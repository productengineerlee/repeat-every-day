/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react'

export type CertificationType =
  | '정보처리기사'
  | 'ADsP'
  | 'SQLD'
  | '정보처리산업기사'
  | '빅데이터분석기사'

export interface OnboardingState {
  step: number
  certificationType: CertificationType | null
  targetExamDate: Date | null
  diagnosticAnswers: Record<string, string>
  diagnosticResults: {
    scores: Record<string, number>
    weakAreas: string[]
  } | null
  completed: boolean
}

interface OnboardingContextType {
  state: OnboardingState
  setCertificationType: (type: CertificationType) => void
  setTargetExamDate: (date: Date | null) => void
  setDiagnosticAnswer: (questionId: string, answer: string) => void
  setDiagnosticResults: (results: OnboardingState['diagnosticResults']) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  reset: () => void
  completeOnboarding: () => void
}

const initialState: OnboardingState = {
  step: 1,
  certificationType: null,
  targetExamDate: null,
  diagnosticAnswers: {},
  diagnosticResults: null,
  completed: false,
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
)

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = useState<OnboardingState>(initialState)

  const setCertificationType = useCallback((type: CertificationType) => {
    setState((prev) => ({ ...prev, certificationType: type }))
  }, [])

  const setTargetExamDate = useCallback((date: Date | null) => {
    setState((prev) => ({ ...prev, targetExamDate: date }))
  }, [])

  const setDiagnosticAnswer = useCallback(
    (questionId: string, answer: string) => {
      setState((prev) => ({
        ...prev,
        diagnosticAnswers: {
          ...prev.diagnosticAnswers,
          [questionId]: answer,
        },
      }))
    },
    []
  )

  const setDiagnosticResults = useCallback(
    (results: OnboardingState['diagnosticResults']) => {
      setState((prev) => ({ ...prev, diagnosticResults: results }))
    },
    []
  )

  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: prev.step + 1 }))
  }, [])

  const previousStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }))
  }, [])

  const goToStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, completed: true }))
  }, [])

  const value: OnboardingContextType = {
    state,
    setCertificationType,
    setTargetExamDate,
    setDiagnosticAnswer,
    setDiagnosticResults,
    nextStep,
    previousStep,
    goToStep,
    reset,
    completeOnboarding,
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}








