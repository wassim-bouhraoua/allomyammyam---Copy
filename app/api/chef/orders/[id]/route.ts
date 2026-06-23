// app/api/chef/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { requireRole } from '@/lib/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole(['CHEF']);
  const chefProfile = await prisma.chefProfile.findUnique({
    where: { userId: session.id },
  });
  if (!chefProfile) {
    return NextResponse.json({ error: 'Chef profile not found' }, { status: 404 });
  }
  const order = await prisma.order.findUnique({
    where: { id },
    include: { orderItems: { include: { dish: true } } },
  });
  if (!order || order.chefId !== chefProfile.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  return NextResponse.json(order);
}
