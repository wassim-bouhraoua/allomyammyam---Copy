import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic'; // always fetch fresh data

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
  const ids = idsParam.split(',');

  const orders = await prisma.order.findMany({
    where: { id: { in: ids }, userId: session.id },
    include: {
      chef: { select: { displayName: true } },
      orderItems: { include: { dish: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (orders.length !== ids.length || orders.length === 0) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Order Confirmation</h1>
      {orders.map((order) => (
        <section key={order.id} className="mb-8 border rounded-lg p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">
            Order {order.id.slice(0, 8)}… – Chef: {order.chef?.displayName ?? 'N/A'}
          </h2>
          <p>Status: {order.status}</p>
          <p>Delivery Address: {order.deliveryAddress}</p>
          <table className="w-full border-collapse mt-4">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Dish</th>
                <th className="text-left py-2">Qty</th>
                <th className="text-left py-2">Unit Price (MAD)</th>
                <th className="text-left py-2">Total (MAD)</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.dishName}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="py-2">{Number(item.totalPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 font-bold">Order Total: {Number(order.totalAmount).toFixed(2)} MAD</p>
        </section>
      ))}
    </div>
  );
}
