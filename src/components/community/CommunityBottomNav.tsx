import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography } from '../../lib/theme'

type Tab = 'feed' | 'insights' | 'notifications' | 'profile'

type Props = {
  activeTab?: Tab
  onTabPress?: (tab: Tab) => void
}

const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'feed', label: 'Feed', icon: 'newspaper-outline', iconActive: 'newspaper' },
  { id: 'insights', label: 'Insights', icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  { id: 'notifications', label: 'Avisos', icon: 'notifications-outline', iconActive: 'notifications' },
  { id: 'profile', label: 'Perfil', icon: 'person-outline', iconActive: 'person' },
]

export function CommunityBottomNav({ activeTab = 'feed', onTabPress }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map(tab => {
        const active = tab.id === activeTab
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onTabPress?.(tab.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={active ? tab.iconActive : tab.icon}
              size={22}
              color={active ? colors.primaryContainer : `${colors.onSurface}66`}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: spacing[2],
    backgroundColor: 'rgba(14, 14, 14, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 145, 86, 0.1)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 80,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 2,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 145, 86, 0.1)',
  },
  tabLabel: {
    ...typography.label,
    fontSize: 9,
    color: `${colors.onSurface}66`,
  },
  tabLabelActive: {
    color: colors.primaryContainer,
  },
})
