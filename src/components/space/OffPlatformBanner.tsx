import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius } from '../../lib/theme'

export function OffPlatformBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="information-circle" size={22} color="#fbbf24" style={styles.icon} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>Este espaço não está activo na plataforma</Text>
        <Text style={styles.body}>
          Este perfil foi criado a partir de dados públicos. Os agendamentos e compras são feitos
          directamente com o negócio.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  icon: { marginTop: 2 },
  textBlock: { flex: 1, gap: 4 },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  body: {
    fontSize: 12,
    color: `${colors.onSurfaceVariant}99`,
    lineHeight: 18,
  },
})
