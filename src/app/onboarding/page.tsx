"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

export default function OnboardingPage() {
  const router = useRouter()

  const handleComplete = () => {
    // Redirect to dashboard after onboarding completion
    router.push('/dashboard')
  }

  return (
    <OnboardingFlow onComplete={handleComplete} />
  )
} 