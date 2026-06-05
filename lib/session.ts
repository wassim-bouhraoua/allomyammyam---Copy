import { cookies } from "next/headers"
import { COOKIE_NAME, verifyToken, sessionUserFromPayload } from "./auth"
import type { SessionUser } from "./auth-types"

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const payload = verifyToken(token)
    return sessionUserFromPayload(payload)
  } catch {
    return null
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthenticated")
  }
  return session
}

export async function requireRole(
  allowed: Array<"USER" | "CHEF" | "ADMIN">
): Promise<SessionUser> {
  const session = await requireSession()
  if (!allowed.includes(session.role)) {
    throw new Error("Forbidden")
  }
  return session
}