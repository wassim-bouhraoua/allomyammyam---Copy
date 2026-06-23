'use client';

import { OrderStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';

export function ActionButtons({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();

  const handleAction = async (url: string, body?: any) => {
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
        alert(`Error: ${errData.error || 'Action failed'}`);
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
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

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {status === OrderStatus.CREATED && (
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
          onClick={() => handleAction(`/api/chef/orders/${orderId}/accept`)}
        >
          Accept
        </button>
      )}
      {(status === OrderStatus.CREATED || status === OrderStatus.ACCEPTED) && (
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          onClick={() => handleAction(`/api/chef/orders/${orderId}/reject`)}
        >
          Reject
        </button>
      )}
      {allowedTransitions[status]
        .filter((next) => next !== OrderStatus.CANCELLED)
        .map((next) => (
          <button
            key={next}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            onClick={() => handleAction(`/api/chef/orders/${orderId}/status`, { status: next })}
          >
            Set to {next.replace(/_/g, ' ')}
          </button>
        ))}
    </div>
  );
}
