import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { saveAvatar, getAvatarUrl } from "@/lib/upload";

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { firstName, lastName, phoneNumber, avatar } = body;

    // Validation
    if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
      return NextResponse.json(
        { error: "First name is required." },
        { status: 400 }
      );
    }

    if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
      return NextResponse.json(
        { error: "Last name is required." },
        { status: 400 }
      );
    }

    // Avatar state handling:
    // - If null: delete/remove avatar.
    // - If starts with data:image/: save new image.
    // - Otherwise: keep existing avatar.
    let avatarPath: string | null | undefined = undefined;

    if (avatar === null) {
      avatarPath = null;
    } else if (typeof avatar === "string" && avatar.startsWith("data:image/")) {
      try {
        avatarPath = await saveAvatar(avatar);
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message ?? "Failed to save profile photo." },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const dataToUpdate: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : null,
    };

    if (avatarPath !== undefined) {
      dataToUpdate.avatar = avatarPath;
      if (session.role === "CHEF") {
        dataToUpdate.chefProfile = {
          update: {
            avatarUrl: avatarPath,
          },
        };
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: session.id,
      },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        avatar: getAvatarUrl(updatedUser.avatar),
        role: updatedUser.role,
        createdAt: updatedUser.createdAt.toISOString(),
      },
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
