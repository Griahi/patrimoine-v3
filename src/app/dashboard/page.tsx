import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardContent from "@/components/DashboardContent"

export default async function DashboardPage() {
  console.log('🏠 Dashboard page called')
  
  // Check for fallback session
  const cookiesStore = await cookies()
  const authSession = cookiesStore.get('auth-session')
  
  console.log('🔑 Auth session cookie:', authSession?.value)
  
  let isAuthenticated = false
  
  if (authSession?.value) {
    try {
      const sessionData = JSON.parse(authSession.value)
      const expiresAt = new Date(sessionData.expires)
      const now = new Date()
      
      console.log('⏰ Session expiry check:', { expiresAt, now, expired: expiresAt <= now })
      
      if (expiresAt > now) {
        isAuthenticated = true
        console.log('✅ Dashboard: User authenticated via fallback session:', sessionData.userId)
      } else {
        console.log('⚠️ Dashboard: Fallback session expired')
      }
    } catch (error) {
      console.warn('❌ Dashboard: Failed to parse session:', error)
    }
  }

  if (!isAuthenticated) {
    console.log('🔄 Dashboard: Redirecting to login - no valid session')
    redirect("/login")
  }

  console.log('🎉 Dashboard: Rendering dashboard content')
  return <DashboardContent />
} 