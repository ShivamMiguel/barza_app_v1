import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { followUser, unfollowUser, getFollowSummary } from '../../lib/follows'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../ui/Spinner'
import { colors, radius } from '../../lib/theme'

type Props = {
  userId: string
  compact?: boolean
}

export function FollowButton({ userId, compact = true }: Props) {
  const { session } = useAuth()
  const callerId = session?.user?.id ?? null
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!callerId || callerId === userId) {
      setIsFollowing(null)
      return
    }
    getFollowSummary(userId, callerId).then(s => setIsFollowing(s.is_following))
  }, [userId, callerId])

  if (isFollowing === null) return null

  async function toggle() {
    if (!callerId || loading) return
    const was = isFollowing
    setIsFollowing(!was)
    setLoading(true)
    setError(null)
    try {
      const summary = was
        ? await unfollowUser(callerId, userId)
        : await followUser(callerId, userId)
      setIsFollowing(summary.is_following ?? !was)
    } catch {
      setIsFollowing(was)
      setError('Erro. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  const label = isFollowing ? 'A seguir' : 'Seguir'

  return (
    <View>
      <TouchableOpacity
        onPress={toggle}
        disabled={loading}
        style={[
          styles.btn,
          compact && styles.btnCompact,
          isFollowing ? styles.btnFollowing : styles.btnFollow,
        ]}
        activeOpacity={0.85}
      >
        {loading ? (
          <Spinner diameter={14} color={isFollowing ? colors.onSurface : colors.onPrimary} />
        ) : (
          <>
            <Ionicons
              name={isFollowing ? 'checkmark' : 'person-add-outline'}
              size={compact ? 12 : 14}
              color={isFollowing ? colors.onSurface : colors.onPrimary}
            />
            <Text style={[styles.text, compact && styles.textCompact, isFollowing && styles.textFollowing]}>
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  btnCompact: { paddingHorizontal: 12, paddingVertical: 6 },
  btnFollow: { backgroundColor: colors.primaryContainer },
  btnFollowing: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.3)',
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.onPrimary,
  },
  textCompact: { fontSize: 10 },
  textFollowing: { color: colors.onSurface },
  error: { fontSize: 9, color: colors.error, marginTop: 4 },
})
