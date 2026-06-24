import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { ActionButtons } from "./action-buttons";
import Link from "next/link";
import { ArrowLeft, User, Phone, MapPin, Calendar, Clock, CheckCircle2, Circle, Mail } from "lucide-react";
import { getDishImageUrl } from "@/lib/upload";
import { cookies } from "next/headers";
import { getDictionary, getLocalizedOrderItemName } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const STEPS = [
  { key: "CREATED", label: "Received", desc: "Order request received" },
  { key: "ACCEPTED", label: "Accepted", desc: "Chef confirmed order" },
  { key: "PREPARING", label: "Preparing", desc: "Food is being cooked" },
  { key: "READY", label: "Ready", desc: "Meal packed & ready" },
  { key: "OUT_FOR_DELIVERY", label: "On the way", desc: "Out for delivery" },
  { key: "DELIVERED", label: "Delivered", desc: "Delivered successfully" },
];

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
  ACCEPTED: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30",
  PREPARING: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
  READY: "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30",
  OUT_FOR_DELIVERY: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30",
  DELIVERED: "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30",
  CANCELLED: "bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border-red-100 dark:border-red-900/30",
};

export default async function ChefOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole(["CHEF"]);

  const cookieStore = await cookies();
  const locale = cookieStore.get("user_locale")?.value || "fr";
  const dict = getDictionary(locale);

  const chefProfile = await prisma.chefProfile.findUnique({
    where: { userId: session.id },
  });
  if (!chefProfile) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
      orderItems: {
        include: {
          dish: {
            select: {
              name: true,
              name_en: true,
              name_ar: true,
              imageUrl: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!order || order.chefId !== chefProfile.id) {
    notFound();
  }

  const isCancelled = order.status === "CANCELLED";
  const currentStepIndex = STEPS.findIndex(s => s.key === order.status);

  const formattedDate = new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subtotal = order.orderItems.reduce((acc, item) => acc + Number(item.totalPrice), 0);
  const deliveryFee = order.deliveryFee ? Number(order.deliveryFee) : 15;
  const totalAmount = Number(order.totalAmount);

  const customerName = order.customer.firstName || order.customer.lastName
    ? `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim()
    : order.customer.email;

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:px-6">
        
        {/* Header navigation */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/profile/chef-orders"
            className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
            aria-label={dict.chefOrders.details.backToDashboard}
          >
            <ArrowLeft size={18} className="text-foreground rtl:rotate-180" />
          </Link>
          <div className="text-start">
            <h1 className="text-[20px] lg:text-[24px] font-black tracking-tight">
              {dict.chefOrders.details.title.replace("{id}", order.id.slice(-8).toUpperCase())}
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {dict.chefOrders.details.sub}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Timeline and actions */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Action buttons panel */}
            <div className="bg-card rounded-[28px] border border-border p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4 text-start">
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {dict.chefOrders.details.actionsTitle}
                </span>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {dict.chefOrders.details.actionsSub}
                </p>
              </div>

              {/* Action Buttons Component */}
              <ActionButtons orderId={order.id} status={order.status as OrderStatus} />
            </div>

            {/* Status Timeline */}
            <div className="bg-card rounded-[28px] border border-border p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4 text-start">
              <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-2 text-start">
                <div>
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">{dict.chefOrders.details.currentStatus}</p>
                  <span className={`mt-1 inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-extrabold uppercase tracking-wider ${STATUS_COLORS[order.status] || "bg-secondary text-muted-foreground"}`}>
                    {(dict.orders.statuses as Record<string, string>)[order.status] || order.status}
                  </span>
                </div>
                <div className="text-end">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">{dict.chefOrders.details.datePlaced}</p>
                  <p className="text-[13px] font-bold text-foreground mt-1">{formattedDate}</p>
                </div>
              </div>

              {isCancelled ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-2xl p-4 flex gap-3 text-start">
                  <div className="text-red-500 flex-shrink-0 mt-0.5">⚠️</div>
                  <div>
                    <h4 className="text-[13px] font-black text-red-800 dark:text-red-400">{dict.orders.details.cancelledTitle}</h4>
                    <p className="text-[12px] text-red-600 dark:text-red-300 mt-1 leading-relaxed">
                      {order.cancelReason ? dict.orders.details.cancelledReason.replace("{reason}", order.cancelReason) : dict.orders.details.cancelledDefault}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5 pt-2 text-start">
                  <h3 className="text-[13px] font-black text-foreground uppercase tracking-widest pl-1 rtl:pl-0 rtl:pr-1">
                    {dict.chefOrders.details.visualTimeline}
                  </h3>
                  
                  <div className="relative pl-7 rtl:pl-0 rtl:pr-7 flex flex-col gap-6 before:absolute before:left-[11px] rtl:before:left-auto rtl:before:right-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                    {STEPS.map((step, idx) => {
                      const done = idx <= currentStepIndex;
                      const active = idx === currentStepIndex;
                      const stepLabel = (dict.orders.statuses as Record<string, string>)[step.key] || step.label;
                      const stepDesc = (dict.orders.timelineDescs as Record<string, string>)[step.key] || step.desc;

                      return (
                        <div key={step.key} className="relative flex flex-col gap-0.5">
                          <div className={`absolute -left-[27px] rtl:-left-auto rtl:-right-[27px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                            done 
                              ? "bg-orange-500 border-orange-500 text-white shadow-[0_2px_8px_rgba(255,138,0,0.3)]"
                              : "bg-card border-border text-muted-foreground"
                          }`}>
                            {done ? <CheckCircle2 size={13} fill="currentColor" className="text-orange-500 stroke-white" /> : <Circle size={10} />}
                          </div>

                          <span className={`text-[13px] font-black leading-none ${active ? "text-orange-600 dark:text-orange-400" : done ? "text-foreground" : "text-muted-foreground"}`}>
                            {stepLabel}
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5">
                            {stepDesc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Customer Details & Order items */}
          <div className="flex flex-col gap-6">
            
            {/* Customer Details */}
            <div className="bg-card rounded-[28px] border border-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4 text-start">
              <h3 className="text-[13px] font-black text-foreground uppercase tracking-widest pl-0.5 rtl:pl-0 rtl:pr-0.5">
                {dict.chefOrders.details.customerInfo}
              </h3>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-secondary/50 rounded-2xl px-4 py-3 border border-border">
                  <User size={15} className="text-orange-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{dict.chefOrders.details.customerName}</p>
                    <p className="text-[13px] font-semibold text-foreground truncate mt-0.5">{customerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-secondary/50 rounded-2xl px-4 py-3 border border-border">
                  <Mail size={15} className="text-orange-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{dict.chefOrders.details.customerEmail}</p>
                    <p className="text-[13px] font-semibold text-foreground truncate mt-0.5">{order.customer.email}</p>
                  </div>
                </div>

                {order.customer.phoneNumber && (
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-2xl px-4 py-3 border border-border">
                    <Phone size={15} className="text-orange-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{dict.chefOrders.details.customerPhone}</p>
                      <p className="text-[13px] font-semibold text-foreground truncate mt-0.5">{order.customer.phoneNumber}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 bg-secondary/50 rounded-2xl px-4 py-3 border border-border">
                  <MapPin size={15} className="text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{dict.chefOrders.details.deliveryAddress}</p>
                    <p className="text-[13px] font-semibold text-foreground leading-relaxed mt-0.5">{order.deliveryAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {order.notes && (
              <div className="bg-card rounded-[28px] border border-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4 text-start animate-in fade-in duration-200">
                <h3 className="text-[13px] font-black text-foreground uppercase tracking-widest pl-0.5 rtl:pl-0 rtl:pr-0.5">
                  {dict.chefOrders.details.customerNotes}
                </h3>
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4">
                  <p className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed italic">
                    &ldquo;{order.notes}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Dishes summary */}
            <div className="bg-card rounded-[28px] border border-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4 text-start">
              <h3 className="text-[13px] font-black text-foreground uppercase tracking-widest pl-0.5 rtl:pl-0 rtl:pr-0.5 border-b border-border pb-2.5">
                {dict.chefOrders.details.orderedItems}
              </h3>

              <div className="flex flex-col gap-3">
                {order.orderItems.map((item) => {
                  const localizedName = getLocalizedOrderItemName(item, locale);
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden border border-border flex-shrink-0 relative shadow-inner">
                        {item.dish.imageUrl ? (
                          <img
                            src={getDishImageUrl(item.dish.imageUrl) || undefined}
                            alt={localizedName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <h4 className="text-[13px] font-extrabold text-foreground leading-snug truncate">
                          {localizedName}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.quantity} x {Number(item.unitPrice).toFixed(0)} {dict.common.currency}
                        </p>
                      </div>
                      <span className="text-[13px] font-bold text-foreground tabular-nums flex-shrink-0">
                        {Number(item.totalPrice).toFixed(0)} {dict.common.currency}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Invoice Breakdown */}
              <div className="border-t border-border pt-3.5 flex flex-col gap-2.5 text-[13px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>{dict.chefOrders.details.subtotal}</span>
                  <span className="font-semibold text-foreground tabular-nums">{subtotal.toLocaleString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR")} {dict.common.currency}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{dict.chefOrders.details.deliveryFee}</span>
                  <span className="font-semibold text-foreground tabular-nums">{deliveryFee.toLocaleString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR")} {dict.common.currency}</span>
                </div>
                
                <div className="flex justify-between border-t border-border pt-3 mt-1">
                  <span className="font-bold text-foreground">{dict.chefOrders.details.totalPayout}</span>
                  <span className="text-[18px] font-black text-orange-600 tabular-nums">
                    {totalAmount.toLocaleString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR")} {dict.common.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Back button */}
            <Link
              href="/profile/chef-orders"
              className="w-full h-11 rounded-2xl bg-secondary border border-border text-foreground font-extrabold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all hover:bg-secondary/80 text-center"
            >
              {dict.chefOrders.details.backToDashboard}
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}

