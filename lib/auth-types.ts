export interface JwtPayload {
  sub: string        // User.id
  email: string
  role: "USER" | "CHEF" | "ADMIN"
  iat?: number
  exp?: number
}

export interface SessionUser {
  id: string
  email: string
  role: "USER" | "CHEF" | "ADMIN"
}

export interface AuthResult {
  user: SessionUser
  token: string
}

export interface AuthError {
  message: string
  status: number
}