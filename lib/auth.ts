import jwt from "jsonwebtoken"
import type { JwtPayload, SessionUser } from "./auth-types"

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = "7d"

export const COOKIE_NAME = "auth_token"

function getSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set")
  }
  return JWT_SECRET
}

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getSecret())
  return decoded as JwtPayload
}

export function sessionUserFromPayload(payload: JwtPayload): SessionUser {
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    city: payload.city,
  }
}