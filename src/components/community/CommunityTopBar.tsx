import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNotifications } from '../../hooks/useNotifications'
import { colors, spacing } from '../../lib/theme'
import { CommunityTab } from '../../navigation/types'

type Props = {
  activeTab?: CommunityTab
  onNotificationsPress?: () => void
  onSearchPress?: () => void
}

export function CommunityTopBar({ activeTab, onNotificationsPress, onSearchPress }: Props) {
  const { unreadCount } = useNotifications()

  return (
    <View style={styles.bar}>
      <Text style={styles.logo}>Barza</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onSearchPress}>
          <Ionicons name="search-outline" size={22} color={`${colors.onSurface}99`} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.7}
          onPress={onNotificationsPress}
        >
          <View>
            <Ionicons
              name={activeTab === 'notifications' ? 'notifications' : 'notifications-outline'}
              size={22}
              color={activeTab === 'notifications' ? colors.primaryContainer : `${colors.onSurface}99`}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 145, 86, 0.2)',
    backgroundColor: 'rgba(14, 14, 14, 0.92)',
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -1,
    color: colors.primaryContainer,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  iconBtn: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
})
