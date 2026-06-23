// app/api/chef/orders/[id]/reject/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { OrderStatus } from '@prisma/client';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole(['CHEF']);
  const chefProfile = await prisma.chefProfile.findUnique({
    where: { userId: session.id },
  });
  if (!chefProfile) {
    return NextResponse.json({ error: 'Chef profile not found' }, { status: 404 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.chefId !== chefProfile.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Allow rejection if order is in CREATED or ACCEPTED
  if (order.status !== OrderStatus.CREATED && order.status !== OrderStatus.ACCEPTED) {
    return NextResponse.json({ error: 'Order cannot be rejected in its current status' }, { status: 400 });
  }

  // Perform cancellation and restore stock in a transaction
  await prisma.$transaction(async (tx) => {
    // Update order status
    await tx.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
    // Restore stock for each order item
    const items = await tx.orderItem.findMany({ where: { orderId: id } });
    for (const item of items) {
      await tx.dish.update({
        where: { id: item.dishId },
        data: { stockCount: { increment: item.quantity } },
      });
    }
  });

  const updated = await prisma.order.findUnique({ where: { id } });
  return NextResponse.json(updated);
}
