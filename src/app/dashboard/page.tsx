import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import DashboardContent from "@/components/DashboardContent"

export default async function DashboardPage() {
  console.log('🏠 Dashboard page called')
  
  // Vérifier l'authentification via le système unifié
  const session = await getServerSession()
  
  if (!session) {
    console.log('🔄 Dashboard: Redirecting to login - no valid session')
    redirect("/login")
  }

  console.log('✅ Dashboard: User authenticated:', session.user.email)
  console.log('🎉 Dashboard: Rendering dashboard content')
  return <DashboardContent />
} 