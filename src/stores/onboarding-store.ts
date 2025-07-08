import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface OnboardingData {
  profile: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    familyStatus?: string
    objectives?: string[]
  }
  entities: Array<{
    id: string
    name: string
    type: 'PHYSICAL_PERSON' | 'LEGAL_ENTITY'
    taxId?: string
    address?: string
    email?: string
    notes?: string
  }>
  bankAccounts: Array<{
    id: string
    bank: string
    type: 'current' | 'savings' | 'securities' | 'pea'
    iban?: string
    balance: number
    currency: string
    entityId?: string
    manual?: boolean
  }>
  stockPortfolio: Array<{
    id: string
    symbol: string
    name: string
    quantity: number
    averagePrice: number
    currentPrice?: number
    currency: string
    accountId?: string
  }>
  realEstate: Array<{
    id: string
    address: string
    type: 'apartment' | 'house' | 'land' | 'commercial'
    surface?: number
    rooms?: number
    estimatedValue: number
    remainingDebt?: number
    monthlyRent?: number
    entityId?: string
  }>
  otherAssets: Array<{
    id: string
    name: string
    type: string
    description?: string
    estimatedValue: number
    currency: string
    entityId?: string
  }>
  ownership: Array<{
    id: string
    ownerEntityId: string
    ownedAssetId?: string
    ownedEntityId?: string
    percentage: number
  }>
}

interface OnboardingState {
  currentStep: number
  data: OnboardingData
  completedSteps: Set<number>
  isLoading: boolean
  errors: Record<string, string[]>
  
  // Actions
  setStepData: (step: keyof OnboardingData, data: any) => void
  updateStepField: (step: keyof OnboardingData, field: string, value: any) => void
  addToStepArray: (step: keyof OnboardingData, item: any) => void
  removeFromStepArray: (step: keyof OnboardingData, id: string) => void
  updateArrayItem: (step: keyof OnboardingData, id: string, updates: any) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  markStepComplete: (step: number) => void
  setStepErrors: (step: string, errors: string[]) => void
  clearStepErrors: (step: string) => void
  canGoNext: () => boolean
  resetOnboarding: () => void
  setLoading: (loading: boolean) => void
  importExcelData: (data: Partial<OnboardingData>) => void
}

const initialData: OnboardingData = {
  profile: {},
  entities: [],
  bankAccounts: [],
  stockPortfolio: [],
  realEstate: [],
  otherAssets: [],
  ownership: [],
}

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set, get) => ({
        currentStep: 0,
        data: initialData,
        completedSteps: new Set(),
        isLoading: false,
        errors: {},

        setStepData: (step, data) =>
          set((state) => ({
            data: {
              ...state.data,
              [step]: data,
            },
          })),

        updateStepField: (step, field, value) =>
          set((state) => ({
            data: {
              ...state.data,
              [step]: {
                ...state.data[step],
                [field]: value,
              },
            },
          })),

        addToStepArray: (step, item) =>
          set((state) => ({
            data: {
              ...state.data,
              [step]: [...(state.data[step] as any[]), { ...item, id: Date.now().toString() }],
            },
          })),

        removeFromStepArray: (step, id) =>
          set((state) => ({
            data: {
              ...state.data,
              [step]: (state.data[step] as any[]).filter((item) => item.id !== id),
            },
          })),

        updateArrayItem: (step, id, updates) =>
          set((state) => ({
            data: {
              ...state.data,
              [step]: (state.data[step] as any[]).map((item) =>
                item.id === id ? { ...item, ...updates } : item
              ),
            },
          })),

        nextStep: () =>
          set((state) => {
            const newStep = Math.min(state.currentStep + 1, 7)
            return {
              currentStep: newStep,
              completedSteps: new Set([...state.completedSteps, state.currentStep]),
            }
          }),

        prevStep: () =>
          set((state) => ({
            currentStep: Math.max(state.currentStep - 1, 0),
          })),

        goToStep: (step) =>
          set(() => ({
            currentStep: step,
          })),

        markStepComplete: (step) =>
          set((state) => ({
            completedSteps: new Set([...state.completedSteps, step]),
          })),

        setStepErrors: (step, errors) =>
          set((state) => ({
            errors: {
              ...state.errors,
              [step]: errors,
            },
          })),

        clearStepErrors: (step) =>
          set((state) => ({
            errors: {
              ...state.errors,
              [step]: [],
            },
          })),

        canGoNext: () => {
          const state = get()
          const currentStepData = getCurrentStepValidation(state.currentStep, state.data)
          return Boolean(currentStepData?.isValid)
        },

        resetOnboarding: () =>
          set(() => ({
            currentStep: 0,
            data: initialData,
            completedSteps: new Set(),
            isLoading: false,
            errors: {},
          })),

        setLoading: (loading) =>
          set(() => ({
            isLoading: loading,
          })),

        importExcelData: (data) =>
          set((state) => ({
            data: {
              ...state.data,
              ...data,
            },
            currentStep: 7, // Jump to summary
          })),
      }),
      {
        name: 'onboarding-storage',
        partialize: (state) => ({
          currentStep: state.currentStep,
          data: state.data,
          completedSteps: Array.from(state.completedSteps),
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Ensure completedSteps is always a Set
            if (Array.isArray(state.completedSteps)) {
              state.completedSteps = new Set(state.completedSteps)
            } else if (!(state.completedSteps instanceof Set)) {
              state.completedSteps = new Set()
            }
          }
        },
      }
    )
  )
)

// Validation helper function
function getCurrentStepValidation(step: number, data: OnboardingData) {
  try {
    switch (step) {
      case 0: // Profile
        return {
          isValid: Boolean(data.profile?.firstName && data.profile?.lastName && data.profile?.email),
          errors: [],
        }
      case 1: // Entities
        return {
          isValid: data.entities && data.entities.length > 0,
          errors: (!data.entities || data.entities.length === 0) ? ['Au moins une entité est requise'] : [],
        }
      case 2: // Bank accounts
        return {
          isValid: true, // Optional step
          errors: [],
        }
      case 3: // Stock portfolio
        return {
          isValid: true, // Optional step
          errors: [],
        }
      case 4: // Real estate
        return {
          isValid: true, // Optional step
          errors: [],
        }
      case 5: // Other assets
        return {
          isValid: true, // Optional step
          errors: [],
        }
      case 6: // Ownership structure
        return {
          isValid: true, // Will be validated based on created assets
          errors: [],
        }
      case 7: // Summary
        return {
          isValid: true,
          errors: [],
        }
      default:
        return {
          isValid: false,
          errors: ['Étape inconnue'],
        }
    }
  } catch (error) {
    console.error('Error in getCurrentStepValidation:', error)
    return {
      isValid: false,
      errors: ['Erreur de validation'],
    }
  }
} 