import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { ActionButtons } from './action-buttons';

export const dynamic = 'force-dynamic';

export default async function ChefOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole(['CHEF']);

  const chefProfile = await prisma.chefProfile.findUnique({ where: { userId: session.id } });
  if (!chefProfile) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { orderItems: { include: { dish: true } } },
  });
  if (!order || order.chefId !== chefProfile.id) notFound();

  const total = order.orderItems.reduce((sum, item) => sum + item.quantity * Number(item.dish.price), 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 font-sans text-gray-800 dark:text-gray-100">Order #{order.id}</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-300">Status: <span className="font-semibold">{order.status}</span></p>
        <p className="text-gray-600 dark:text-gray-300">Total: <span className="font-semibold">${total.toFixed(2)}</span></p>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-100">Items</h2>
      <ul className="space-y-2">
        {order.orderItems.map((item) => (
          <li key={item.id} className="border border-gray-100 dark:border-gray-700 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
            <div className="flex justify-between font-medium">
              <span>{item.dish.name}</span>
              <span>Qty: {item.quantity}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
              <span>Unit Price: ${Number(item.dish.price).toFixed(2)}</span>
              <span>Subtotal: ${(item.quantity * Number(item.dish.price)).toFixed(2)}</span>
            </div>
          </li>
        ))}
      </ul>
      {/* Action buttons */}
      <ActionButtons orderId={order.id} status={order.status as OrderStatus} />
    </div>
  );
}
