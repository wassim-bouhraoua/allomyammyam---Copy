// app/api/chef/orders/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { OrderStatus } from '@prisma/client';

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole(['CHEF']);
  const chefProfile = await prisma.chefProfile.findUnique({
    where: { userId: session.id },
  });
  if (!chefProfile) {
    return NextResponse.json({ error: 'Chef profile not found' }, { status: 404 });
  }

  const body = await req.json();
  const newStatus = body.status as OrderStatus;
  if (!newStatus) {
    return NextResponse.json({ error: 'Missing status' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.chefId !== chefProfile.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const current = order.status as OrderStatus;
  const allowed = allowedTransitions[current] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({ error: `Transition from ${current} to ${newStatus} not allowed` }, { status: 400 });
  }

  // If transitioning to CANCELLED, restore stock within a transaction
  if (newStatus === OrderStatus.CANCELLED) {
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({ where: { id }, data: { status: OrderStatus.CANCELLED } });
      // Restore stock for each order item
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        await tx.dish.update({ where: { id: item.dishId }, data: { stockCount: { increment: item.quantity } } });
      }
    });
    const updated = await prisma.order.findUnique({ where: { id } });
    return NextResponse.json(updated);
  }

  // For other transitions, just update status
  const updated = await prisma.order.update({
    where: { id },
    data: { status: newStatus },
  });
  return NextResponse.json(updated);
}
