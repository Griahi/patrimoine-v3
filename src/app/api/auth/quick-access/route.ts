import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function POST() {
  try {
    console.log('🚀 Starting quick access creation...')
    
    // Créer ou récupérer l'utilisateur de test
    console.log('📝 Creating/updating test user...')
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        name: 'Utilisateur Test',
      },
      create: {
        email: 'test@example.com',
        name: 'Utilisateur Test',
        password: null, // Pas de mot de passe pour l'accès rapide
      },
    })

    console.log('✅ Test user created/updated:', testUser.id)

    // Créer une session pour cet utilisateur
    console.log('🔐 Creating session...')
    await createSession(testUser.id)

    console.log('✅ Session created successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Accès rapide créé avec succès',
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name
      }
    })
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'accès rapide:', error)
    console.error('📋 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined
    })
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur lors de la création de l\'accès rapide',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
} 