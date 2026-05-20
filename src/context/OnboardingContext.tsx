import React, { createContext, useContext, useState, ReactNode } from 'react'

type OnboardingContextValue = {
  completeOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextValue>({
  completeOnboarding: () => {},
})

export function OnboardingProvider({ children, onComplete }: { children: ReactNode; onComplete: () => void }) {
  return (
    <OnboardingContext.Provider value={{ completeOnboarding: onComplete }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  return useContext(OnboardingContext)
}
