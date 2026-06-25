// app/api/chef/orders/route.ts
import { requireRole } from '@/lib/session';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// OrderStatus handled via @prisma/client; import not needed

export async function GET() {
  // Ensure authenticated chef
  const session = await requireRole(['CHEF']);
  // Load chef profile
  const chefProfile = await prisma.chefProfile.findUnique({
    where: { userId: session.id },
  });
  if (!chefProfile) {
    return NextResponse.json({ error: 'Chef profile not found' }, { status: 404 });
  }
  const orders = await prisma.order.findMany({
    where: { chefId: chefProfile.id },
    include: { orderItems: { include: { dish: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(orders);
}
