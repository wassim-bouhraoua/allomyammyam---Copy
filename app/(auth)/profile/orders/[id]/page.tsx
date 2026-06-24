import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, CreditCard, ShoppingBag, User, CheckCircle2, Circle } from "lucide-react";
import BackToHome from "@/components/auth/back-to-home";
import { getDishImageUrl } from "@/lib/upload";
import ReviewModalButton from "@/components/review-modal-button";

export const dynamic = "force-dynamic";

const STEPS = [
  { key: "CREATED", label: "Received", desc: "We've received your order" },
  { key: "ACCEPTED", label: "Accepted", desc: "Chef confirmed the order" },
  { key: "PREPARING", label: "Preparing", desc: "Chef is preparing your food" },
  { key: "READY", label: "Ready", desc: "Meal is packed and ready" },
  { key: "OUT_FOR_DELIVERY", label: "On the way", desc: "Meal is out for delivery" },
  { key: "DELIVERED", label: "Delivered", desc: "Order completed successfully" },
];

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Received",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
  ACCEPTED: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30",
  PREPARING: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
  READY: "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30",
  OUT_FOR_DELIVERY: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30",
  DELIVERED: "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30",
  CANCELLED: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30",
};

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      chef: {
        select: {
          displayName: true,
          city: true,
        },
      },
      orderItems: {
        include: {
          dish: {
            select: {
              name: true,
              imageUrl: true,
              chef: {
                select: {
                  userId: true,
                },
              },
            },
          },
          dishReview: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Security check: ensure this order belongs to the logged-in user
  if (order.userId !== session.id) {
    redirect("/profile/orders");
  }

  const isCancelled = order.status === "CANCELLED";
  const currentStepIndex = STEPS.findIndex(s => s.key === order.status);

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subtotal = order.orderItems.reduce((acc, item) => acc + Number(item.totalPrice), 0);
  const deliveryFee = order.deliveryFee ? Number(order.deliveryFee) : 15;
  const totalAmount = Number(order.totalAmount);

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:px-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/profile/orders"
            className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Back to Order History"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </Link>
          <div>
            <h1 className="text-[20px] lg:text-[24px] font-black tracking-tight flex items-center gap-2">
              Order Details
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              ID: #{order.id.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Timeline & Delivery details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Status Card & Cancelled Info */}
            <div className="bg-card rounded-[28px] border border-border p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Status</p>
                  <span className={`mt-1 inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-extrabold uppercase tracking-wider ${STATUS_COLORS[order.status] || "bg-secondary text-muted-foreground"}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Placed On</p>
                  <p className="text-[13px] font-bold text-foreground mt-1">{formattedDate}</p>
                </div>
              </div>

              {isCancelled ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-2xl p-4 flex gap-3">
                  <div className="text-red-500 flex-shrink-0 mt-0.5">⚠️</div>
                  <div>
                    <h4 className="text-[13px] font-black text-red-800 dark:text-red-400">Order Cancelled</h4>
                    <p className="text-[12px] text-red-600 dark:text-red-300 mt-1 leading-relaxed">
                      {order.cancelReason ? `Reason: "${order.cancelReason}"` : "This order was cancelled."}
                    </p>
                  </div>
                </div>
              ) : (
                /* Timeline Progress list */
                <div className="flex flex-col gap-5 pt-2">
                  <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest pl-1">
                    Order Status Timeline
                  </h3>
                  
                  <div className="relative pl-7 flex flex-col gap-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                    {STEPS.map((step, idx) => {
                      const done = idx <= currentStepIndex;
                      const active = idx === currentStepIndex;

                      return (
                        <div key={step.key} className="relative flex flex-col gap-0.5">
                          {/* Bullet marker */}
                          <div className={`absolute -left-[27px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                            done 
                              ? "bg-orange-500 border-orange-500 text-white shadow-[0_2px_8px_rgba(255,138,0,0.3)]"
                              : "bg-card border-border text-muted-foreground"
                          }`}>
                            {done ? <CheckCircle2 size={13} fill="currentColor" className="text-orange-500 stroke-white" /> : <Circle size={10} />}
                          </div>

                          <span className={`text-[13px] font-black leading-none ${active ? "text-orange-600 dark:text-orange-400" : done ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5">
                            {step.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery address & Notes */}
            <div className="bg-card rounded-[28px] border border-border p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4">
              <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest">
                Delivery Details
              </h3>
              
              <div className="flex items-start gap-3 bg-secondary/50 border border-border rounded-2xl p-4">
                <MapPin size={18} className="text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Address</p>
                  <p className="text-[13px] font-semibold text-foreground leading-relaxed mt-1">
                    {order.deliveryAddress}
                  </p>
                </div>
              </div>

              {order.notes && (
                <div className="bg-secondary/35 border border-border rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Customer Notes</p>
                  <p className="text-[13px] text-foreground italic mt-1 leading-relaxed">
                    &ldquo;{order.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Order items, subtotal & Chef summary */}
          <div className="flex flex-col gap-6">
            
            {/* Chef info */}
            <div className="bg-card rounded-[28px] border border-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(255,138,0,0.3)] text-[16px] font-black">
                👨‍🍳
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Chef</p>
                <p className="text-[14px] font-extrabold text-foreground truncate mt-0.5">
                  {order.chef.displayName}
                </p>
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Serving in {order.chef.city}
                </p>
              </div>
            </div>

            {/* Items & Invoice summary */}
            <div className="bg-card rounded-[28px] border border-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4">
              <h3 className="text-[13px] font-black text-foreground uppercase tracking-widest border-b border-border pb-2.5">
                Ordered Dishes
              </h3>

              {/* Items List */}
              <div className="flex flex-col gap-3">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden border border-border flex-shrink-0 relative shadow-inner">
                      {item.dish.imageUrl ? (
                        <img
                          src={getDishImageUrl(item.dish.imageUrl) || undefined}
                          alt={item.dishName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-[13px] font-extrabold text-foreground leading-snug truncate">
                        {item.dishName}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {item.quantity} x {Number(item.unitPrice).toFixed(0)} MAD
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-[13px] font-bold text-foreground tabular-nums">
                        {Number(item.totalPrice).toFixed(0)} MAD
                      </span>
                      {order.status === "DELIVERED" && item.dish.chef.userId !== session.id && (
                        <ReviewModalButton
                          orderItemId={item.id}
                          dishName={item.dishName}
                          initialRating={(item as any).dishReview?.rating}
                          initialComment={(item as any).dishReview?.comment || undefined}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Invoice Breakdown */}
              <div className="border-t border-border pt-3.5 flex flex-col gap-2.5 text-[13px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground tabular-nums">{subtotal.toLocaleString("fr-MA")} MAD</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-foreground tabular-nums">{deliveryFee.toLocaleString("fr-MA")} MAD</span>
                </div>
                
                <div className="flex justify-between border-t border-border pt-3 mt-1">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-[18px] font-black text-orange-600 tabular-nums">
                    {totalAmount.toLocaleString("fr-MA")} MAD
                  </span>
                </div>
              </div>
            </div>

            {/* View History Button */}
            <Link
              href="/profile/orders"
              className="w-full h-11 rounded-2xl bg-secondary border border-border text-foreground font-extrabold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all hover:bg-secondary/80"
            >
              Back to Order History
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}
