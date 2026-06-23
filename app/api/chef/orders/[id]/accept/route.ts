// app/api/chef/orders/[id]/accept/route.ts
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

  if (order.status !== OrderStatus.CREATED) {
    return NextResponse.json({ error: 'Order cannot be accepted in its current status' }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: OrderStatus.ACCEPTED },
  });
  return NextResponse.json(updated);
}
