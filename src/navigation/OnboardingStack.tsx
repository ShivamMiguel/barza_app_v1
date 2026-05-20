import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { OnboardingProfileScreen } from '../screens/onboarding/OnboardingProfileScreen'
import { OnboardingIntentScreen } from '../screens/onboarding/OnboardingIntentScreen'
import { OnboardingLocationScreen } from '../screens/onboarding/OnboardingLocationScreen'
import { OnboardingStartScreen } from '../screens/onboarding/OnboardingStartScreen'
import { OnboardingWelcomeScreen } from '../screens/onboarding/OnboardingWelcomeScreen'
import { colors } from '../lib/theme'
import type { OnboardingStackParamList } from './types'

const Stack = createNativeStackNavigator<OnboardingStackParamList>()

export function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        contentStyle: { backgroundColor: colors.surfaceContainerLowest },
      }}
    >
      <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
      <Stack.Screen name="OnboardingIntent" component={OnboardingIntentScreen} />
      <Stack.Screen name="OnboardingLocation" component={OnboardingLocationScreen} />
      <Stack.Screen name="OnboardingStart" component={OnboardingStartScreen} />
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
    </Stack.Navigator>
  )
}
