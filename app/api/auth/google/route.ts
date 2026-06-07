import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { credential, targetRole } = await req.json();

    if (!credential) {
      return NextResponse.json(
        { error: "Credential token is required." },
        { status: 400 }
      );
    }

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error("Google authentication error: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.");
      return NextResponse.json(
        { error: "Google authentication is currently unconfigured." },
        { status: 500 }
      );
    }

    // Verify token with Google's tokeninfo endpoint
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { cache: "no-store" }
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: "Invalid Google credential token." },
        { status: 400 }
      );
    }

    const payload = await verifyRes.json();

    // Verify audience
    if (payload.aud !== googleClientId) {
      return NextResponse.json(
        { error: "Invalid client audience." },
        { status: 400 }
      );
    }

    const email = payload.email;
    if (!email) {
      return NextResponse.json(
        { error: "Google account does not provide an email address." },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      if (!user.isActive) {
        return NextResponse.json(
          { error: "This account has been deactivated." },
          { status: 403 }
        );
      }

      // If targetRole is CHEF and existing user is a customer (USER), block registration
      if (targetRole === "CHEF" && user.role !== "CHEF") {
        return NextResponse.json(
          { error: "This Google account is already associated with a customer account. Please use a different email address for your chef account." },
          { status: 409 }
        );
      }

      // If existing user has no avatar, assign their Google profile picture
      if (!user.avatar && payload.picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar: payload.picture },
        });
      }
    } else {
      // Create a new user (Option A: random password hash)
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await hashPassword(randomPassword);

      const firstName = payload.given_name || payload.name || "Google";
      const lastName = payload.family_name || "User";
      const avatar = payload.picture || null;

      if (targetRole === "CHEF") {
        user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: "CHEF",
            avatar,
            chefProfile: {
              create: {
                displayName: `${firstName} ${lastName}`,
                status: "PENDING",
                avatarUrl: avatar,
              },
            },
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: "USER",
            avatar,
          },
        });
      }
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      message: "Google login successful.",
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Google login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
