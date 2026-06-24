'use client';

import { useState } from 'react';
import { OrderStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/context/I18nContext';

export function ActionButtons({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { dict } = useTranslation();

  const handleAction = async (url: string, body?: any) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        router.refresh();
      } else {
        const errData = await res.json();
        alert(`${dict.common.errorTitle}: ${errData.error || dict.chefOrders.actionFailed}`);
      }
    } catch (err) {
      console.error(err);
      alert(dict.chefOrders.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.CREATED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
    [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  const transitions = allowedTransitions[status] || [];

  if (transitions.length === 0) {
    return (
      <div className="bg-secondary/40 border border-border rounded-2xl p-4 text-center">
        <p className="text-[12px] font-bold text-muted-foreground">
          {dict.chefOrders.noActions}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Accept Order Action */}
      {status === OrderStatus.CREATED && (
        <button
          disabled={loading}
          className="h-11 px-5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-extrabold text-[13px] flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(34,197,94,0.25)] active:scale-[0.98] transition-all disabled:opacity-50"
          onClick={() => handleAction(`/api/chef/orders/${orderId}/accept`)}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {dict.chefOrders.actions.accept}
        </button>
      )}

      {/* Reject/Cancel Order Action */}
      {(status === OrderStatus.CREATED || status === OrderStatus.ACCEPTED) && (
        <button
          disabled={loading}
          className="h-11 px-5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-[13px] flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(239,68,68,0.25)] active:scale-[0.98] transition-all disabled:opacity-50"
          onClick={() => handleAction(`/api/chef/orders/${orderId}/reject`)}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
          {dict.chefOrders.actions.reject}
        </button>
      )}

      {/* Next Status transitions */}
      {transitions
        .filter((next) => next !== OrderStatus.CANCELLED && next !== OrderStatus.ACCEPTED)
        .map((next) => {
          const nextLabel = dict.orders.statuses[next] || next;

          return (
            <button
              key={next}
              disabled={loading}
              className="h-11 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[13px] flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(255,138,0,0.25)] active:scale-[0.98] transition-all disabled:opacity-50"
              onClick={() => handleAction(`/api/chef/orders/${orderId}/status`, { status: next })}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} className="rtl:rotate-180" />}
              {dict.chefOrders.markAs.replace('{status}', nextLabel)}
            </button>
          );
        })}
    </div>
  );
}

