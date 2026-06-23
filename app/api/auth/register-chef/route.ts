import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { signToken, COOKIE_NAME } from "@/lib/auth"
import { saveAvatar } from "@/lib/upload"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      displayName,
      bio,
      specialties,
      city,
      avatar,
    } = body

    if (!email || !password || !firstName || !lastName || !displayName) {
      return NextResponse.json(
        { error: "email, password, firstName, lastName and displayName are required" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const hashed = await hashPassword(password)

    let avatarPath: string | null = null
    if (avatar && avatar.startsWith("data:image/")) {
      try {
        avatarPath = await saveAvatar(avatar)
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message ?? "Failed to save profile photo." },
          { status: 400 }
        )
      }
    }

    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          password: hashed,
          firstName,
          lastName,
          phoneNumber: phoneNumber ?? null,
          role: "CHEF",
          avatar: avatarPath,
          chefProfile: {
            create: {
              displayName,
              bio: bio ?? null,
              specialties: specialties ?? [],
              city: city ?? null,
              status: "PENDING",
              avatarUrl: avatarPath,
            },
          },
        },
      }),
    ])

    const token = signToken({ sub: user.id, email: user.email, role: user.role, city: user.city })

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
        },
        message: "Chef account created. Awaiting approval.",
      },
      { status: 201 }
    )

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}