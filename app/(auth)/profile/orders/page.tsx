import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic'; // ensure fresh data per request

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) {
    // Not authenticated – show nothing or redirect (simplified)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Order History</h1>
        <p>Please sign in to view your orders.</p>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    include: { chef: { select: { displayName: true } } },
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Order History</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Order ID</th>
              <th className="text-left py-2">Chef</th>
              <th className="text-left py-2">Total (MAD)</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="py-2">
                  <Link href={`/profile/orders/confirmation?ids=${o.id}`} className="text-indigo-600 hover:underline">
                    {o.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="py-2">{o.chef?.displayName ?? 'N/A'}</td>
                <td className="py-2">{Number(o.totalAmount).toFixed(2)}</td>
                <td className="py-2">{o.status}</td>
                <td className="py-2">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
