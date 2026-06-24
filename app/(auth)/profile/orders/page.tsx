import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { ArrowLeft, ShoppingBag, Calendar, User, ChevronRight } from "lucide-react";
import BackToHome from "@/components/auth/back-to-home";
import { cookies } from "next/headers";
import { getDictionary, getLocalizedOrderItemName } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
  ACCEPTED: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30",
  PREPARING: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
  READY: "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30",
  OUT_FOR_DELIVERY: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30",
  DELIVERED: "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30",
  CANCELLED: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30",
};

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("user_locale")?.value || "fr";
  const dict = getDictionary(locale);

  const session = await getSession();
  if (!session) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background min-h-screen text-foreground">
        <BackToHome />
        <div className="w-20 h-20 rounded-3xl bg-secondary border border-border flex items-center justify-center mb-6">
          <ShoppingBag size={32} className="text-muted-foreground" />
        </div>
        <h1 className="text-[20px] font-black text-foreground text-center">
          {dict.profile.notSignedIn}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-2 text-center mb-8 leading-relaxed">
          {dict.profile.notSignedInSub}
        </p>
        <Link href="/login"
          className="h-12 px-8 rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          {dict.profile.signIn}
        </Link>
      </main>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    include: {
      chef: { select: { displayName: true } },
      orderItems: {
        include: {
          dish: { select: { name: true, name_en: true, name_ar: true } },
          dishReview: true,
        },
      },
    },
  });

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:px-6">
        
        {/* Navigation / Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/profile"
            className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
            aria-label={dict.common.back}
          >
            <ArrowLeft size={18} className="text-foreground rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-[24px] font-black tracking-tight">{dict.orders.list.title}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">{dict.orders.list.sub}</p>
          </div>
        </div>

        {orders.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-[28px] border border-border text-center shadow-sm max-w-md mx-auto mt-6">
            <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center mb-5">
              <ShoppingBag size={28} className="text-orange-500" />
            </div>
            <h2 className="text-[18px] font-extrabold text-foreground">{dict.orders.list.empty}</h2>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              {dict.orders.list.emptySub}
            </p>
            <Link
              href="/dishes"
              className="mt-6 inline-flex items-center justify-center px-6 h-11 bg-orange-500 text-white font-extrabold text-[14px] rounded-2xl shadow-[0_4px_16px_rgba(255,138,0,0.35)] active:scale-98 transition-transform"
            >
              {dict.orders.list.browse}
            </Link>
          </div>
        ) : (
          /* Orders Card List */
          <div className="flex flex-col gap-4">
            {orders.map((o) => {
              const formattedDate = new Date(o.createdAt).toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              // Construct items summary text
              const itemsCount = o.orderItems.reduce((sum, item) => sum + item.quantity, 0);
              const firstItemName = o.orderItems[0] ? getLocalizedOrderItemName(o.orderItems[0], locale) : "Dish";
              const itemsSummary = o.orderItems.length > 1 
                ? dict.orders.list.itemsSummaryMore.replace("{first}", firstItemName).replace("{count}", String(itemsCount - o.orderItems[0].quantity))
                : dict.orders.list.itemsSummaryOne.replace("{first}", firstItemName).replace("{count}", String(itemsCount));

              const statusText = dict.orders.statuses[o.status] || o.status;

              return (
                <div
                  key={o.id}
                  className="bg-card rounded-[24px] border border-border p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_28px_rgba(0,0,0,0.06)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-start"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">
                        {dict.orders.list.orderNum.replace("{id}", o.id.slice(-6).toUpperCase())}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${STATUS_COLORS[o.status] || "bg-secondary text-muted-foreground"}`}>
                        {statusText}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <User size={13} className="text-orange-500 flex-shrink-0" />
                      <p className="text-[14px] font-extrabold text-foreground truncate">
                        {o.chef?.displayName ?? "AlloMyamMyam Chef"}
                      </p>
                    </div>

                    <p className="text-[12px] text-muted-foreground leading-relaxed truncate">
                      {itemsSummary}
                    </p>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formattedDate}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                      <span className="text-orange-600 font-extrabold">
                        {Number(o.totalAmount).toLocaleString("fr-MA")} {dict.common.currency}
                      </span>
                      {o.status === "DELIVERED" && (() => {
                        const reviewedCount = o.orderItems.filter(item => item.dishReview).length;
                        const totalItemsCount = o.orderItems.length;
                        if (reviewedCount === 0) return null;
                        return (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-border" />
                            <span className="text-amber-500 font-extrabold flex items-center gap-1 animate-in fade-in duration-200">
                              ⭐ {reviewedCount === totalItemsCount ? dict.orders.list.reviewed : dict.orders.list.partiallyReviewed}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <Link
                    href={`/profile/orders/${o.id}`}
                    className="h-11 px-5 rounded-2xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all self-start sm:self-auto"
                  >
                    {dict.orders.list.viewDetails}
                    <ChevronRight size={14} className="text-muted-foreground rtl:rotate-180" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
