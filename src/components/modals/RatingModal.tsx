import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Pressable,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Spinner } from '../ui/Spinner'
import { upsertSpaceRating } from '../../lib/ratings'
import { colors, gradientColors, spacing, radius } from '../../lib/theme'

const LABELS = ['', 'Fraco', 'Regular', 'Bom', 'Muito bom', 'Excelente']

type Props = {
  visible: boolean
  onClose: () => void
  spaceId: string
  spaceName: string
  existingRating?: { stars: number; comment: string | null } | null
  onSaved: (stars: number, comment: string | null) => void
}

export function RatingModal({
  visible,
  onClose,
  spaceId,
  spaceName,
  existingRating,
  onSaved,
}: Props) {
  const [stars, setStars] = useState(existingRating?.stars ?? 0)
  const [comment, setComment] = useState(existingRating?.comment ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setStars(existingRating?.stars ?? 0)
      setComment(existingRating?.comment ?? '')
      setError(null)
    }
  }, [visible, existingRating])

  async function handleSubmit() {
    if (stars === 0) {
      setError('Selecciona pelo menos 1 estrela')
      return
    }
    setLoading(true)
    setError(null)
    const result = await upsertSpaceRating(spaceId, stars, comment.trim() || null)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onSaved(stars, comment.trim() || null)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>
                {existingRating ? 'Editar avaliação' : 'Avaliar espaço'}
              </Text>
              <Text style={styles.title} numberOfLines={1}>{spaceName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={20} color={`${colors.onSurfaceVariant}60`} />
            </TouchableOpacity>
          </View>

          <View style={styles.starsBlock}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setStars(n)} activeOpacity={0.8}>
                  <Ionicons
                    name={n <= stars ? 'star' : 'star-outline'}
                    size={36}
                    color={n <= stars ? colors.primaryContainer : `${colors.onSurfaceVariant}25`}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {stars > 0 ? (
              <Text style={styles.starLabel}>{LABELS[stars]}</Text>
            ) : null}
          </View>

          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Comentário opcional…"
            placeholderTextColor={`${colors.onSurfaceVariant}40`}
            multiline
            maxLength={500}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.9}>
            <LinearGradient colors={gradientColors} style={styles.submitBtn}>
              {loading ? (
                <Spinner color={colors.onPrimary} />
              ) : (
                <Text style={styles.submitText}>Guardar avaliação</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a1210',
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: 'rgba(255,145,86,0.2)',
    gap: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryContainer,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onSurface,
    maxWidth: 260,
  },
  starsBlock: { alignItems: 'center', gap: spacing[2] },
  starsRow: { flexDirection: 'row', gap: spacing[2] },
  starLabel: {
    fontSize: 13,
    color: `${colors.onSurfaceVariant}80`,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,145,86,0.15)',
    borderRadius: radius['2xl'],
    padding: spacing[4],
    color: colors.onSurface,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: { fontSize: 12, color: '#ff4757' },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
