import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { CommunityProvider } from '../context/CommunityContext'
import { OnboardingProvider } from '../context/OnboardingContext'
import { needsOnboarding } from '../lib/profile'
import { AuthStack } from './AuthStack'
import { MainNavigator } from './MainNavigator'
import { OnboardingStack } from './OnboardingStack'
import { Spinner } from '../components/ui/Spinner'
import { colors } from '../lib/theme'

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Spinner diameter={36} color={colors.primaryContainer} />
    </View>
  )
}

export function RootNavigator() {
  const { session, userProfile, loading } = useAuth()
  const [onboardingDone, setOnboardingDone] = useState(false)

  if (loading) return <LoadingScreen />

  const showOnboarding =
    !!session && needsOnboarding(userProfile) && !onboardingDone

  return (
    <NavigationContainer>
      {!session ? (
        <AuthStack />
      ) : showOnboarding ? (
        <OnboardingProvider onComplete={() => setOnboardingDone(true)}>
          <OnboardingStack />
        </OnboardingProvider>
      ) : (
        <CommunityProvider>
          <MainNavigator />
        </CommunityProvider>
      )}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
  },
})
