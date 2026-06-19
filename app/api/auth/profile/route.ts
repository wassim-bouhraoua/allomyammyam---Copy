import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { saveAvatar, saveBanner, getAvatarUrl } from "@/lib/upload";

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
    const { firstName, lastName, phoneNumber, avatar, displayName, bio, city, specialties, isAvailable, banner } = body;

    // Validation
    if (body.hasOwnProperty("firstName") && (!firstName || typeof firstName !== "string" || !firstName.trim())) {
      return NextResponse.json(
        { error: "First name is required." },
        { status: 400 }
      );
    }

    if (body.hasOwnProperty("lastName") && (!lastName || typeof lastName !== "string" || !lastName.trim())) {
      return NextResponse.json(
        { error: "Last name is required." },
        { status: 400 }
      );
    }

    if (session.role === "CHEF") {
      if (body.hasOwnProperty("displayName") && (!displayName || typeof displayName !== "string" || !displayName.trim())) {
        return NextResponse.json(
          { error: "Display name is required for chefs." },
          { status: 400 }
        );
      }
      if (body.hasOwnProperty("city") && (!city || typeof city !== "string" || !city.trim())) {
        return NextResponse.json(
          { error: "City is required for chefs." },
          { status: 400 }
        );
      }
      if (body.hasOwnProperty("specialties") && (!specialties || !Array.isArray(specialties) || specialties.length === 0)) {
        return NextResponse.json(
          { error: "At least one specialty is required for chefs." },
          { status: 400 }
        );
      }
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
    const dataToUpdate: any = {};
    if (body.hasOwnProperty("firstName")) dataToUpdate.firstName = firstName.trim();
    if (body.hasOwnProperty("lastName")) dataToUpdate.lastName = lastName.trim();
    if (body.hasOwnProperty("phoneNumber")) dataToUpdate.phoneNumber = phoneNumber ? phoneNumber.trim() : null;

    let bannerPath: string | null | undefined = undefined;
    if (body.hasOwnProperty("banner")) {
      if (banner === null) {
        bannerPath = null;
      } else if (typeof banner === "string" && banner.startsWith("data:image/")) {
        try {
          bannerPath = await saveBanner(banner);
        } catch (err: any) {
          return NextResponse.json(
            { error: err.message ?? "Failed to save cover banner." },
            { status: 400 }
          );
        }
      }
    }

    if (session.role === "CHEF") {
      const chefProfileUpdate: any = {};
      if (body.hasOwnProperty("displayName")) chefProfileUpdate.displayName = displayName.trim();
      if (body.hasOwnProperty("bio")) chefProfileUpdate.bio = bio ? bio.trim() : null;
      if (body.hasOwnProperty("city")) chefProfileUpdate.city = city ? city.trim() : null;
      if (body.hasOwnProperty("specialties")) chefProfileUpdate.specialties = specialties || [];
      if (body.hasOwnProperty("isAvailable")) chefProfileUpdate.isAvailable = !!isAvailable;
      if (bannerPath !== undefined) chefProfileUpdate.bannerUrl = bannerPath;

      if (Object.keys(chefProfileUpdate).length > 0) {
        dataToUpdate.chefProfile = {
          update: chefProfileUpdate
        };
      }
    }

    if (avatarPath !== undefined) {
      dataToUpdate.avatar = avatarPath;
      if (session.role === "CHEF") {
        if (!dataToUpdate.chefProfile) {
          dataToUpdate.chefProfile = { update: {} };
        }
        dataToUpdate.chefProfile.update.avatarUrl = avatarPath;
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
