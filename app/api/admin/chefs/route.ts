import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admins only" },
        { status: 403 }
      );
    }

    const chefs = await prisma.chefProfile.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ chefs });
  } catch (error) {
    console.error("GET admin chefs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admins only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { chefProfileId, status } = body;

    if (!chefProfileId || !["PENDING", "APPROVED", "SUSPENDED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    // Fetch existing chef to validate transition
    const existingChef = await prisma.chefProfile.findUnique({
      where: { id: chefProfileId },
      select: { status: true },
    });

    if (!existingChef) {
      return NextResponse.json(
        { error: "Chef profile not found" },
        { status: 404 }
      );
    }

    const currentStatus = existingChef.status;

    // Allowed transitions:
    // - PENDING -> APPROVED
    // - APPROVED -> SUSPENDED
    // - SUSPENDED -> APPROVED
    const isValidTransition =
      (currentStatus === "PENDING" && status === "APPROVED") ||
      (currentStatus === "APPROVED" && status === "SUSPENDED") ||
      (currentStatus === "SUSPENDED" && status === "APPROVED");

    if (!isValidTransition) {
      return NextResponse.json(
        { error: `Transition from ${currentStatus} to ${status} is not allowed.` },
        { status: 400 }
      );
    }

    const chefProfile = await prisma.chefProfile.update({
      where: { id: chefProfileId },
      data: { status },
    });

    return NextResponse.json({
      message: `Chef status updated to ${status}.`,
      chefProfile,
    });
  } catch (error) {
    console.error("PUT admin chefs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
