import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '../ui/Avatar'
import { RatingModal } from '../modals/RatingModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import {
  SpaceRatingWithProfile,
  deleteMySpaceRating,
  fetchRatingsBySpace,
} from '../../lib/ratings'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'

type Props = {
  spaceId: string
  spaceName: string
  isOwner: boolean
  currentUserId: string | null
  initialRatings: SpaceRatingWithProfile[]
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Ionicons
          key={n}
          name={n <= value ? 'star' : 'star-outline'}
          size={size}
          color={n <= value ? colors.primaryContainer : `${colors.onSurfaceVariant}20`}
        />
      ))}
    </View>
  )
}

export function SpaceRatingsSection({
  spaceId,
  spaceName,
  isOwner,
  currentUserId,
  initialRatings,
}: Props) {
  const [ratings, setRatings] = useState(initialRatings)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const myRating = currentUserId
    ? ratings.find(r => r.client_id === currentUserId) ?? null
    : null
  const canRate = !isOwner && !!currentUserId
  const count = ratings.length
  const average = count > 0 ? ratings.reduce((s, r) => s + r.stars, 0) / count : 0
  const displayAvg = average > 0 ? average.toFixed(1) : null

  const dist = [5, 4, 3, 2, 1].map(n => ({
    n,
    c: ratings.filter(r => r.stars === n).length,
    pct: count > 0 ? Math.round((ratings.filter(r => r.stars === n).length / count) * 100) : 0,
  }))

  async function refreshRatings() {
    const data = await fetchRatingsBySpace(spaceId)
    setRatings(data)
  }

  function handleSaved(stars: number, comment: string | null) {
    if (!currentUserId) return
    setRatings(prev => {
      const idx = prev.findIndex(r => r.client_id === currentUserId)
      if (idx >= 0) {
        return prev.map(r =>
          r.client_id === currentUserId ? { ...r, stars, comment } : r,
        )
      }
      return [
        {
          id: `local-${Date.now()}`,
          space_id: spaceId,
          client_id: currentUserId,
          stars,
          comment,
          created_at: new Date().toISOString(),
          profiles: null,
        },
        ...prev,
      ]
    })
    refreshRatings()
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteMySpaceRating(spaceId)
    setDeleting(false)
    setConfirmDelete(false)
    if (!result.error) {
      setRatings(prev => prev.filter(r => r.client_id !== currentUserId))
      refreshRatings()
    }
  }

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            Avaliações{count > 0 ? ` (${count})` : ''}
          </Text>
          {canRate ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setModalOpen(true)}>
              <LinearGradient colors={gradientColors} style={styles.rateBtn}>
                <Ionicons name="star" size={14} color={colors.onPrimary} />
                <Text style={styles.rateBtnText}>{myRating ? 'Editar' : 'Avaliar'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
        </View>

        {count === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={40} color={`${colors.onSurfaceVariant}20`} />
            <Text style={styles.emptyTitle}>Ainda sem avaliações</Text>
            {canRate ? (
              <Text style={styles.emptySub}>Sê o primeiro a avaliar este espaço</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryLeft}>
                <Text style={styles.avgBig}>{displayAvg}</Text>
                <Stars value={Math.round(average)} size={16} />
                <Text style={styles.avgCount}>
                  {count} {count === 1 ? 'avaliação' : 'avaliações'}
                </Text>
              </View>
              <View style={styles.distCol}>
                {dist.map(({ n, c, pct }) => (
                  <View key={n} style={styles.distRow}>
                    <Text style={styles.distN}>{n}</Text>
                    <Ionicons name="star" size={12} color={colors.primaryContainer} />
                    <View style={styles.distTrack}>
                      <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.distFill, { width: `${pct}%` }]}
                      />
                    </View>
                    <Text style={styles.distC}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {ratings.map(r => {
              const name = r.profiles?.full_name ?? 'Utilizador'
              const isMe = r.client_id === currentUserId
              return (
                <View
                  key={r.id}
                  style={[styles.reviewCard, isMe && styles.reviewCardMe]}
                >
                  <Avatar
                    name={name}
                    avatarUrl={r.profiles?.avatar_url}
                    size={36}
                  />
                  <View style={styles.reviewBody}>
                    <View style={styles.reviewHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewName}>
                          {name}
                          {isMe ? (
                            <Text style={styles.youBadge}> · Tu</Text>
                          ) : null}
                        </Text>
                        <View style={styles.reviewMeta}>
                          <Stars value={r.stars} size={12} />
                          <Text style={styles.reviewDate}>{fmtDate(r.created_at)}</Text>
                        </View>
                      </View>
                      {isMe ? (
                        <View style={styles.reviewActions}>
                          <TouchableOpacity onPress={() => setModalOpen(true)}>
                            <Ionicons name="create-outline" size={16} color={colors.onSurfaceVariant} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setConfirmDelete(true)}>
                            <Ionicons name="trash-outline" size={16} color="#ff4757" />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                    {r.comment ? (
                      <Text style={styles.reviewComment}>{r.comment}</Text>
                    ) : null}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </View>

      <RatingModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        spaceId={spaceId}
        spaceName={spaceName}
        existingRating={myRating ? { stars: myRating.stars, comment: myRating.comment } : null}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        visible={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Remover avaliação?"
        message="A tua avaliação será removida permanentemente."
        confirmLabel="Remover"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing[5] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    ...typography.label,
    color: `${colors.onSurfaceVariant}40`,
    letterSpacing: 2,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  rateBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    gap: spacing[2],
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
  },
  emptyTitle: { color: colors.onSurfaceVariant, fontSize: 14 },
  emptySub: { fontSize: 12, color: `${colors.onSurfaceVariant}40` },
  content: { gap: spacing[4] },
  summaryCard: {
    flexDirection: 'row',
    gap: spacing[6],
    padding: spacing[5],
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
    alignItems: 'center',
  },
  summaryLeft: { alignItems: 'center', flexShrink: 0 },
  avgBig: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.onSurface,
    lineHeight: 48,
  },
  avgCount: {
    fontSize: 10,
    color: `${colors.onSurfaceVariant}40`,
    marginTop: 4,
  },
  distCol: { flex: 1, gap: 8 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distN: {
    width: 12,
    fontSize: 11,
    color: `${colors.onSurfaceVariant}50`,
    textAlign: 'right',
  },
  distTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  distFill: { height: '100%', borderRadius: 3 },
  distC: {
    width: 20,
    fontSize: 10,
    color: `${colors.onSurfaceVariant}35`,
  },
  reviewCard: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
  },
  reviewCardMe: {
    borderColor: `${colors.primaryContainer}30`,
    backgroundColor: `${colors.primaryContainer}08`,
  },
  reviewBody: { flex: 1, gap: 6 },
  reviewHeader: { flexDirection: 'row', gap: spacing[2] },
  reviewName: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  youBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryContainer,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  reviewDate: { fontSize: 10, color: `${colors.onSurfaceVariant}35` },
  reviewActions: { flexDirection: 'row', gap: 10 },
  reviewComment: {
    fontSize: 14,
    color: `${colors.onSurfaceVariant}99`,
    lineHeight: 20,
  },
})
