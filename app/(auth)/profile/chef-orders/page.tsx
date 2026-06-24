import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Inbox, Clock, CheckCircle2, Ban, ChevronRight, Calendar, User, ShoppingBag } from "lucide-react";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const STATUS_ORDER: Record<string, number> = {
  CREATED: 1,
  ACCEPTED: 2,
  PREPARING: 3,
  READY: 4,
  OUT_FOR_DELIVERY: 5,
  DELIVERED: 6,
  CANCELLED: 7,
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

export default async function ChefOrdersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const chefProfile = await prisma.chefProfile.findUnique({
    where: { userId: session.id },
  });
  if (!chefProfile) {
    notFound();
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("user_locale")?.value || "fr";
  const dict = getDictionary(locale);

  const STATUS_LABELS: Record<string, string> = {
    CREATED: dict.chefOrders.counters.new,
    ACCEPTED: dict.orders.statuses.ACCEPTED,
    PREPARING: dict.orders.statuses.PREPARING,
    READY: dict.orders.statuses.READY,
    OUT_FOR_DELIVERY: dict.orders.statuses.OUT_FOR_DELIVERY,
    DELIVERED: dict.orders.statuses.DELIVERED,
    CANCELLED: dict.orders.statuses.CANCELLED,
  };

  const orders = await prisma.order.findMany({
    where: { chefId: chefProfile.id },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      orderItems: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate status counters
  const countNew = orders.filter((o) => o.status === "CREATED").length;
  const countPreparing = orders.filter((o) => o.status === "ACCEPTED" || o.status === "PREPARING").length;
  const countReady = orders.filter((o) => o.status === "READY" || o.status === "OUT_FOR_DELIVERY").length;
  const countDelivered = orders.filter((o) => o.status === "DELIVERED").length;
  const countCancelled = orders.filter((o) => o.status === "CANCELLED").length;

  // Sort orders by status priority
  const sortedOrders = [...orders].sort((a, b) => {
    return (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
  });

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:px-6">
        
        {/* Header navigation */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/profile"
            className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
            aria-label={dict.common.back}
          >
            <ArrowLeft size={18} className="text-foreground rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-[24px] font-black tracking-tight">{dict.chefOrders.title}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">{dict.chefOrders.sub}</p>
          </div>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-8">
          
          <div className="bg-card border border-border rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-blue-500">
              <Inbox size={18} />
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-full">{dict.chefOrders.counters.new}</span>
            </div>
            <div className="mt-1">
              <span className="text-[24px] font-black leading-none">{countNew}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{dict.chefOrders.counters.newSub}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-amber-500">
              <Clock size={18} />
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full">{dict.chefOrders.counters.progress}</span>
            </div>
            <div className="mt-1">
              <span className="text-[24px] font-black leading-none">{countPreparing}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{dict.chefOrders.counters.progressSub}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-teal-500">
              <ShoppingBag size={18} />
              <span className="text-[10px] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded-full">{dict.chefOrders.counters.ready}</span>
            </div>
            <div className="mt-1">
              <span className="text-[24px] font-black leading-none">{countReady}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{dict.chefOrders.counters.readySub}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-green-500">
              <CheckCircle2 size={18} />
              <span className="text-[10px] font-black uppercase tracking-wider bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full">{dict.chefOrders.counters.completed}</span>
            </div>
            <div className="mt-1">
              <span className="text-[24px] font-black leading-none">{countDelivered}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{dict.chefOrders.counters.completedSub}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] col-span-2 md:col-span-1 flex flex-col gap-2">
            <div className="flex items-center justify-between text-red-500">
              <Ban size={18} />
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">{dict.chefOrders.counters.cancelled}</span>
            </div>
            <div className="mt-1">
              <span className="text-[24px] font-black leading-none">{countCancelled}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{dict.chefOrders.counters.cancelledSub}</p>
            </div>
          </div>

        </div>

        {/* Orders Listing */}
        <h2 className="text-[16px] font-black uppercase tracking-wider text-muted-foreground mb-4 ps-1">
          {dict.chefOrders.queue}
        </h2>

        {sortedOrders.length === 0 ? (
          /* Empty orders queue */
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-[28px] border border-border text-center shadow-sm max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center mb-5 text-muted-foreground">
              <ShoppingBag size={28} />
            </div>
            <h3 className="text-[18px] font-extrabold text-foreground">{dict.chefOrders.empty}</h3>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              {dict.chefOrders.emptySub}
            </p>
          </div>
        ) : (
          /* Priority Queue List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedOrders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const itemsCount = order.orderItems.reduce((acc, item) => acc + item.quantity, 0);

              const customerName = order.customer.firstName || order.customer.lastName
                ? `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim()
                : order.customer.email;

              const itemsTotalLabel = itemsCount === 1 
                ? dict.chefOrders.itemTotal 
                : dict.chefOrders.itemsTotal.replace("{count}", String(itemsCount));

              return (
                <div
                  key={order.id}
                  className="bg-card rounded-[24px] border border-border p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_28px_rgba(0,0,0,0.05)] transition-all flex flex-col justify-between gap-4 text-start"
                >
                  <div className="flex flex-col gap-2">
                    {/* Header: Short ID & Status badge */}
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">
                        {dict.orders.list.orderNum.replace("{id}", order.id.slice(-6).toUpperCase())}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${STATUS_COLORS[order.status] || "bg-secondary text-muted-foreground"}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>

                    {/* Customer display */}
                    <div className="flex items-center gap-2 mt-1">
                      <User size={13} className="text-orange-500 flex-shrink-0" />
                      <span className="text-[14px] font-extrabold text-foreground truncate">
                        {customerName}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold">
                      <Calendar size={12} />
                      <span>{formattedDate}</span>
                    </div>

                    {/* Address snippet */}
                    <p className="text-[12px] text-muted-foreground leading-relaxed truncate mt-0.5">
                      {dict.chefOrders.deliveryAddress.replace("{address}", order.deliveryAddress)}
                    </p>

                    {/* Customer Note indicator */}
                    {order.notes && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-lg px-2 py-0.5 self-start mt-1.5 animate-in fade-in duration-200">
                        <span>📝</span>
                        <span>{dict.chefOrders.customerNote}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Price row */}
                  <div className="flex justify-between items-center border-t border-border pt-4 mt-1">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                        {itemsTotalLabel}
                      </span>
                      <p className="text-[16px] font-black text-orange-600 tabular-nums">
                        {Number(order.totalAmount).toLocaleString("fr-MA")} {dict.common.currency}
                      </p>
                    </div>

                    <Link
                      href={`/profile/chef-orders/${order.id}`}
                      className="h-10 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[12px] flex items-center justify-center gap-1 active:scale-[0.98] transition-all shadow-[0_2px_8px_rgba(255,138,0,0.25)]"
                    >
                      {dict.chefOrders.manageOrder}
                      <ChevronRight size={13} className="rtl:rotate-180" />
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
