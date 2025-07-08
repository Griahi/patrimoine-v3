import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { destroySession } from '@/lib/auth'

export async function POST() {
  try {
    // Supprimer l'utilisateur de test
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    })

    // Détruire la session actuelle
    await destroySession()

    return NextResponse.json({ 
      success: true, 
      message: 'Accès rapide supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'accès rapide:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la suppression de l\'accès rapide' },
      { status: 500 }
    )
  }
} 