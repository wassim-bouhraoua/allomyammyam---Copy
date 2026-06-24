import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { Check, Calendar, ShoppingBag, ArrowRight, Home, ChefHat, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ ids?: string; id?: string }> }) {
  const session = await getSession();
  if (!session) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const idsParam = resolvedSearchParams.ids || resolvedSearchParams.id;
  if (!idsParam) {
    notFound();
  }
  const ids = idsParam.split(",");

  const orders = await prisma.order.findMany({
    where: { id: { in: ids }, userId: session.id },
    include: {
      chef: { select: { displayName: true, city: true } },
      orderItems: { include: { dish: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (orders.length !== ids.length || orders.length === 0) {
    notFound();
  }

  // Use the first order's general info for display consistency
  const primaryOrder = orders[0];

  return (
    <div className="bg-background min-h-screen text-foreground py-10 px-4">
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        
        {/* Success Icon Badge */}
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6 text-green-500 shadow-[0_8px_32px_rgba(34,197,94,0.15)]">
          <Check size={36} className="stroke-[3]" />
        </div>

        {/* Title */}
        <h1 className="text-[26px] lg:text-[32px] font-black text-center tracking-tight leading-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-[13px] text-muted-foreground mt-2 text-center max-w-md leading-relaxed">
          Thank you for ordering from AlloMyamMyam. The chef has been notified and is reviewing your order request.
        </p>

        {/* Orders summary container */}
        <div className="w-full flex flex-col gap-4 mt-8">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            const subtotal = order.orderItems.reduce((acc, item) => acc + Number(item.totalPrice), 0);
            const deliveryFee = order.deliveryFee ? Number(order.deliveryFee) : 15;
            const totalAmount = Number(order.totalAmount);

            return (
              <div
                key={order.id}
                className="bg-card rounded-[28px] border border-border p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4 text-left w-full"
              >
                {/* Order header details */}
                <div className="flex justify-between items-start border-b border-border pb-3 flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Order ID
                    </span>
                    <h3 className="text-[14px] font-black text-foreground uppercase mt-0.5">
                      #{order.id.slice(-8).toUpperCase()}
                    </h3>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Placed At
                    </span>
                    <p className="text-[13px] font-bold text-foreground mt-0.5">{formattedDate}</p>
                  </div>
                </div>

                {/* Chef display */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-black shadow-[0_2px_8px_rgba(255,138,0,0.25)]">
                    👨‍🍳
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Chef Profile</p>
                    <p className="text-[13px] font-extrabold text-foreground mt-0.5">
                      {order.chef?.displayName ?? "AlloMyamMyam Chef"}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Delivery Address</p>
                    <p className="text-[13px] font-semibold text-foreground mt-0.5 leading-relaxed">
                      {order.deliveryAddress}
                    </p>
                  </div>
                </div>

                {/* Items Summary list */}
                <div className="flex flex-col gap-2.5 border-t border-b border-border py-4 my-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5 mb-1">
                    Items List
                  </p>
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-[13px]">
                      <span className="text-muted-foreground truncate flex-1 pr-4">
                        <span className="font-bold text-foreground mr-1.5">{item.quantity}x</span>
                        {item.dishName}
                      </span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {Number(item.totalPrice).toFixed(0)} MAD
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotals & Grand Total */}
                <div className="flex flex-col gap-2 text-[13px] border-b border-border pb-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground tabular-nums">{subtotal.toLocaleString("fr-MA")} MAD</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-foreground tabular-nums">{deliveryFee.toLocaleString("fr-MA")} MAD</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-1">
                  <span className="text-[14px] font-black text-foreground uppercase tracking-wider">
                    Total Amount
                  </span>
                  <span className="text-[20px] font-black text-orange-600 tabular-nums">
                    {totalAmount.toLocaleString("fr-MA")} MAD
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button Navigation links */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
          <Link
            href="/profile/orders"
            className="h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(255,138,0,0.38)]"
          >
            <ShoppingBag size={15} />
            Track Orders
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/"
            className="h-12 rounded-2xl bg-secondary border border-border hover:bg-secondary/80 text-foreground font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Home size={15} className="text-muted-foreground" />
            Go to Home Page
          </Link>
        </div>

      </div>
    </div>
  );
}
