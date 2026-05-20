import React from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Spinner } from './Spinner'
import { colors, gradientColors, spacing, radius } from '../../lib/theme'

type Props = {
  visible: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  icon?: keyof typeof Ionicons.glyphMap
  loading?: boolean
  error?: string | null
}

export function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  icon,
  loading = false,
  error,
}: Props) {
  const isDanger = variant === 'danger'
  const iconName = icon ?? (isDanger ? 'warning-outline' : 'help-circle-outline')
  const borderColor = isDanger ? 'rgba(255,71,87,0.25)' : 'rgba(255,145,86,0.2)'
  const iconBg = isDanger ? 'rgba(255,71,87,0.12)' : 'rgba(255,145,86,0.12)'
  const iconColor = isDanger ? '#ff4757' : colors.primaryContainer

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={loading ? undefined : onClose}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onClose}>
        <Pressable style={[styles.card, { borderColor }]} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: iconBg, borderColor }]}>
              <Ionicons name={iconName} size={22} color={iconColor} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={isDanger ? ['#ff4757', '#ff2e44'] : gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmBtn}
              >
                {loading ? (
                  <Spinner diameter={18} color={colors.white} />
                ) : (
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing[6],
  },
  card: {
    borderRadius: radius['3xl'],
    padding: spacing[6],
    borderWidth: 1,
    backgroundColor: '#1a120a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 24,
  },
  header: { flexDirection: 'row', gap: spacing[4], marginBottom: spacing[4] },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerText: { flex: 1, paddingTop: 2 },
  title: { fontSize: 18, fontWeight: '800', color: colors.white, marginBottom: 6 },
  message: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.6)' },
  errorBox: {
    borderRadius: radius.xl,
    padding: spacing[3],
    marginBottom: spacing[4],
    backgroundColor: 'rgba(255,71,87,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.2)',
  },
  errorText: { fontSize: 12, color: '#ff4757' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing[2], marginTop: spacing[2] },
  cancelBtn: { paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
  cancelText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  confirmBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.white,
  },
})
