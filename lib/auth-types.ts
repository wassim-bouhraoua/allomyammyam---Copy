export interface JwtPayload {
  sub: string        // User.id
  email: string
  role: "USER" | "CHEF" | "ADMIN"
  city?: string | null
  iat?: number
  exp?: number
}

export interface SessionUser {
  id: string
  email: string
  role: "USER" | "CHEF" | "ADMIN"
  city?: string | null
}

export interface AuthResult {
  user: SessionUser
  token: string
}

export interface AuthError {
  message: string
  status: number
}