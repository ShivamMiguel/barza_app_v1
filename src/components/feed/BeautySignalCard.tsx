import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '../../lib/media'
import { InlineVideo } from './InlineVideo'
import type { ExternalSignal } from '../../lib/beauty-signals'

export type { ExternalSignal }

interface Props {
  signal: ExternalSignal
}

const FALLBACK_GRADIENTS: Record<string, [string, string, string]> = {
  product: ['#1a0f06', '#201508', '#2a1a0a'],
  culture: ['#080f1a', '#0d1520', '#111c2a'],
  video: ['#1a0808', '#200d0d', '#2a1010'],
}

function categoryLabel(category: string, type: string): string {
  if (type === 'youtube') return 'Video'
  const map: Record<string, string> = {
    product: 'Product News',
    culture: 'Culture',
    trend: 'Trend Report',
    video: 'Video',
  }
  return map[category] ?? (category.charAt(0).toUpperCase() + category.slice(1))
}

function readTime(summary: string): string {
  const words = summary.trim().split(/\s+/).length
  return `${Math.max(2, Math.ceil(words / 200))} Min Read`
}

function signalStrength(title: string): number {
  const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return 75 + (hash % 25)
}

export function BeautySignalCard({ signal }: Props) {
  const label = categoryLabel(signal.category, signal.type)
  const isVideo = signal.type === 'youtube'
  const embedUrl = isVideo ? getYouTubeEmbedUrl(signal.url) : null
  const watchUrl = isVideo ? getYouTubeWatchUrl(signal.url) : signal.url
  const strength = signalStrength(signal.title)
  const fallbackColors = FALLBACK_GRADIENTS[signal.category] ?? ['#0e0e0e', '#141414', '#1a1a1a']

  return (
    <View style={styles.card}>
      <View style={styles.media}>
        {embedUrl ? (
          <InlineVideo url={signal.url} title={signal.title} inline />
        ) : signal.image ? (
          <Image source={{ uri: signal.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={fallbackColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.imageFallback}
          >
            {isVideo ? (
              <View style={styles.fallbackVideo}>
                <View style={styles.playBtn}>
                  <Ionicons name="play" size={28} color="#fff" style={{ marginLeft: 4 }} />
                </View>
                {signal.tags.slice(0, 3).map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Ionicons name="document-text-outline" size={48} color={`${colors.primaryContainer}30`} />
            )}
          </LinearGradient>
        )}

        <View style={[styles.topOverlay, embedUrl && styles.overlayPassthrough]} pointerEvents="box-none">
          <View style={styles.categoryBadge}>
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.categoryGradient}>
              <Text style={styles.categoryText}>{label}</Text>
            </LinearGradient>
          </View>
          <View style={styles.sourceBadge}>
            <Ionicons
              name={isVideo ? 'logo-youtube' : 'globe-outline'}
              size={14}
              color={isVideo ? '#f87171' : colors.primaryContainer}
            />
            <Text style={styles.sourceText} numberOfLines={1}>{signal.source}</Text>
          </View>
        </View>

        {!embedUrl && (
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.bottomOverlay} pointerEvents="none">
            <View style={styles.bottomMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="flash" size={14} color={colors.primaryContainer} />
                <Text style={styles.metaText}>Signal: {strength}%</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Ionicons
                  name={isVideo ? 'play-circle-outline' : 'time-outline'}
                  size={14}
                  color={colors.onSurfaceVariant}
                />
                <Text style={styles.metaText}>
                  {isVideo ? 'Watch Now' : readTime(signal.summary)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={3}>{signal.title}</Text>
        {signal.summary ? (
          <Text style={styles.summary} numberOfLines={3}>{signal.summary}</Text>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>Live Signal</Text>
          </View>
          <TouchableOpacity
            style={styles.openLink}
            onPress={() => Linking.openURL(watchUrl)}
            activeOpacity={0.85}
          >
            <Text style={styles.openLinkText}>
              {isVideo ? 'Abrir no YouTube' : 'Ver original'}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primaryContainer} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.signalBar}>
        <View style={styles.signalTrack}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.signalFill, { width: `${strength}%` }]}
          />
        </View>
        <Text style={styles.signalLabel}>Trend Score {strength}%</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
  },
  media: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackVideo: { alignItems: 'center', gap: spacing[3] },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(220,38,38,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tagText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  topOverlay: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    right: spacing[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  overlayPassthrough: { pointerEvents: 'none' },
  categoryBadge: { borderRadius: radius.full, overflow: 'hidden' },
  categoryGradient: { paddingHorizontal: 12, paddingVertical: 5 },
  categoryText: {
    ...typography.labelSm,
    color: colors.onPrimary,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    maxWidth: '50%',
  },
  sourceText: {
    ...typography.labelSm,
    color: colors.onSurface,
    flex: 1,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
  },
  bottomMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(86,67,58,0.3)',
  },
  content: { padding: spacing[5], gap: spacing[3] },
  title: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  summary: { color: `${colors.onSurfaceVariant}90`, fontSize: 13, lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(86,67,58,0.1)',
    gap: spacing[3],
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  openLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openLinkText: {
    ...typography.labelSm,
    color: colors.primaryContainer,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  signalBar: { paddingHorizontal: spacing[5], paddingBottom: spacing[4], gap: 6 },
  signalTrack: {
    height: 3,
    backgroundColor: 'rgba(86,67,58,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  signalFill: { height: '100%', borderRadius: 2 },
  signalLabel: { ...typography.labelSm, color: `${colors.primaryContainer}80` },
})
