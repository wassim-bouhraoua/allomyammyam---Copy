import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Custom error for client‑side validation failures (400 responses)
class CheckoutError extends Error {}

/**
 * POST /api/cart/checkout
 * Creates one Order per chef from the user's cart.
 * All validations and stock updates happen inside a single Prisma transaction.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { deliveryAddress, notes } = await req.json();
    if (!deliveryAddress || typeof deliveryAddress !== 'string') {
      return NextResponse.json({ error: 'Delivery address is required.' }, { status: 400 });
    }

    // Load cart with items, dishes and chefs
    const cart = await prisma.cart.findUnique({
      where: { userId: session.id },
      include: {
        cartItems: {
          include: {
            dish: {
              include: {
                chef: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    // Ensure user city is set
    if (!session.city) {
      return NextResponse.json({ error: 'User city must be selected before checkout.' }, { status: 400 });
    }

    // Validate that every dish belongs to a chef in the same city as the user
    for (const item of cart.cartItems) {
      if (item.dish.chef.city !== session.city) {
        return NextResponse.json({ error: 'All dishes must belong to chefs in your city.' }, { status: 400 });
      }
    }

    // Group cart items by chefId
    const itemsByChef: Record<string, typeof cart.cartItems> = {};
    for (const item of cart.cartItems) {
      const chefId = item.dish.chefId;
      if (!itemsByChef[chefId]) itemsByChef[chefId] = [];
      itemsByChef[chefId].push(item);
    }

    // Transaction: create orders, order items, decrement stock, delete cart items
    const createdOrders = await prisma.$transaction(async (tx) => {
      const orders: any[] = [];
      for (const chefId of Object.keys(itemsByChef)) {
        const items = itemsByChef[chefId];
        // Re‑read dishes inside the transaction for fresh stock values
        const dishIds = items.map((i) => i.dish.id);
        const freshDishes = await tx.dish.findMany({
          where: { id: { in: dishIds } },
        });
        const freshMap = new Map(freshDishes.map((d) => [d.id, d]));

        // Validate stock for each item
        for (const item of items) {
          const fresh = freshMap.get(item.dish.id);
          if (!fresh) {
            // Dish missing – abort transaction and return 400
            throw new CheckoutError(`Dish ${item.dish.id} no longer exists.`);
          }
          if (fresh.stockCount !== null && item.quantity > fresh.stockCount) {
            // Insufficient stock – abort transaction and return 400
            throw new CheckoutError(`Insufficient stock for ${fresh.name}. Requested ${item.quantity}, available ${fresh.stockCount}.`);
          }
        }

        // Calculate subtotal
        let subtotal = 0;
        for (const item of items) {
          subtotal += Number(item.dish.price) * item.quantity;
        }

        const order = await tx.order.create({
          data: {
            userId: session.id,
            chefId,
            status: 'CREATED',
            totalAmount: subtotal,
            deliveryAddress,
            notes: notes ?? null,
          },
        });

        // Create order items and decrement stock
        for (const item of items) {
          const fresh = freshMap.get(item.dish.id)!;
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              dishId: fresh.id,
              quantity: item.quantity,
              unitPrice: fresh.price,
              totalPrice: Number(fresh.price) * item.quantity,
              dishName: fresh.name,
            },
          });

          if (fresh.stockCount !== null) {
            const updateResult = await tx.dish.updateMany({
              where: { id: fresh.id, stockCount: { gte: item.quantity } },
              data: { stockCount: { decrement: item.quantity } },
            });
            if (updateResult.count === 0) {
              // Stock was insufficient due to concurrent checkout – abort transaction
              throw new CheckoutError(`Insufficient stock for ${fresh.name} during checkout.`);
            }
          }
        }

        orders.push({
          id: order.id,
          chefId,
          totalAmount: subtotal,
          status: order.status,
        });
      }

      // Delete only the cart items, keep the cart record
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return orders;
    });

    return NextResponse.json({ orders: createdOrders });
  } catch (error: any) {
    console.error('POST /api/cart/checkout error:', error);
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
