import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ChefOrdersPage() {
  const session = await getSession();
  if (!session) notFound();

  const chefProfile = await prisma.chefProfile.findUnique({
    where: { userId: session.id },
  });
  if (!chefProfile) notFound();

  const orders = await prisma.order.findMany({
    where: { chefId: chefProfile.id },
    include: { orderItems: { include: { dish: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Chef Orders</h1>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border p-4 rounded-lg shadow">
              <a href={`/profile/chef-orders/${order.id}`} className="text-blue-600 hover:underline">
                Order #{order.id} – {order.status}
              </a>
              <div>Total: ${order.totalAmount.toFixed(2)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
