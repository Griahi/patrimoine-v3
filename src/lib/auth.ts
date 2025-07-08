import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key-for-development")

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
}

export interface Session {
  user: User
  expires: string
}

export async function createSession(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, image: true }
  })

  if (!user) {
    throw new Error("User not found")
  }

  const token = await new SignJWT({ 
    userId: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret)
  
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/"
  })
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    if (!token) return null
    
    const { payload } = await jwtVerify(token, secret)
    
    return {
      user: {
        id: payload.userId as string,
        email: payload.email as string,
        name: payload.name as string | null,
        image: payload.image as string | null,
      },
      expires: new Date((payload.exp as number) * 1000).toISOString()
    }
  } catch (error) {
    console.warn('⚠️ Error getting session:', error)
    return null
  }
}

export async function getSessionFromRequest(request: Request): Promise<Session | null> {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null
  
  // Parse cookies manually
  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=")
    if (key && value) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, string>)
  
  const token = cookies.session
  if (!token) return null
  
  try {
    const { payload } = await jwtVerify(token, secret)
    
    return {
      user: {
        id: payload.userId as string,
        email: payload.email as string,
        name: payload.name as string | null,
        image: payload.image as string | null,
      },
      expires: new Date((payload.exp as number) * 1000).toISOString()
    }
  } catch {
    return null
  }
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("session")
  } catch (error) {
    console.warn('⚠️ Error destroying session:', error)
  }
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  try {
    console.log('🔐 Authenticate called with email:', email)
    const { email: validEmail, password: validPassword } = loginSchema.parse({ email, password })

    const user = await prisma.user.findUnique({
      where: { email: validEmail },
    })

    console.log('🔍 User found:', user ? 'YES' : 'NO')

    if (!user || !user.password) {
      console.log('❌ No user or no password')
      return null
    }

    const isPasswordValid = await bcrypt.compare(validPassword, user.password)
    console.log('🔑 Password valid:', isPasswordValid)

    if (!isPasswordValid) {
      console.log('❌ Invalid password')
      return null
    }

    console.log('✅ Authentication successful')
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    }
  } catch (error) {
    console.error('🚨 Authentication error:', error)
    return null
  }
}

// Alias pour compatibilité avec l'API existante
export const auth = getSession

// Fonctions de remplacement pour NextAuth compatibilité
export async function getServerSession(request?: Request): Promise<Session | null> {
  if (request) {
    return getSessionFromRequest(request)
  }
  return getSession()
}

export async function getToken(req: { headers: { get: (name: string) => string | null } }): Promise<{ sub?: string } | null> {
  const session = await getSessionFromRequest(req as Request)
  if (session) {
    return { sub: session.user.id }
  }
  return null
}