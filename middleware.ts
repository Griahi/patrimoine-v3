import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth-helper"

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request
  
  // Check if user is authenticated using the unified helper
  const user = await getUserFromRequest(request)
  const isLoggedIn = !!user
  
  // Routes configuration
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isPublicRoute = ["/", "/login", "/signup", "/dev-access"].includes(nextUrl.pathname)
  const isAuthPage = ["/login", "/signup"].includes(nextUrl.pathname)
  const isStaticRoute = nextUrl.pathname.startsWith("/_next") || 
                        nextUrl.pathname.startsWith("/favicon") ||
                        nextUrl.pathname.includes(".")

  // Skip middleware for API auth routes and static files
  if (isApiAuthRoute || isStaticRoute) {
    return NextResponse.next()
  }

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (isAuthPage && isLoggedIn) {
    console.log('🔒 Middleware: Authenticated user accessing auth page, redirecting to dashboard');
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  // If user is not logged in and trying to access protected routes
  if (!isLoggedIn && !isPublicRoute) {
    console.log('🔒 Middleware: Unauthenticated user accessing protected route:', nextUrl.pathname);
    const loginUrl = new URL("/login", nextUrl)
    
    // IMPORTANT: Preserve the requested URL for redirect after login
    // Handle both pathname and search params
    const targetUrl = nextUrl.pathname + (nextUrl.search || '')
    loginUrl.searchParams.set('callbackUrl', targetUrl)
    
    console.log('🔒 Middleware: Redirecting to login with callbackUrl:', targetUrl);
    return NextResponse.redirect(loginUrl)
  }

  // Log successful access for debugging
  if (isLoggedIn) {
    console.log('🔒 Middleware: Allowing access to:', nextUrl.pathname, 'for user:', user?.email);
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any files with extensions (js, css, png, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
} 