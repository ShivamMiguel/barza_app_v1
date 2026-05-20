import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { CommunityScreen } from '../screens/community/CommunityScreen'
import { SpaceDetailScreen } from '../screens/community/SpaceDetailScreen'
import { colors } from '../lib/theme'
import type { MainStackParamList } from './types'

const Stack = createNativeStackNavigator<MainStackParamList>()

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, presentation: 'card' }}>
      <Stack.Screen
        name="Community"
        component={CommunityScreen}
        options={{ contentStyle: { backgroundColor: colors.surface } }}
      />
      <Stack.Screen
        name="SpaceDetail"
        component={SpaceDetailScreen}
        options={{ contentStyle: { backgroundColor: colors.surface }, animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  )
}
