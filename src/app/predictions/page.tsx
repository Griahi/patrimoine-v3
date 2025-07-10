import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'

export default async function PredictionsPage() {
  // Vérifier l'authentification
  const session = await getServerSession()
  
  if (!session) {
    redirect('/login?callbackUrl=/predictions')
  }
  
  // Rediriger vers la page dashboard/predictions
  redirect('/dashboard/predictions')
} 