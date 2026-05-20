import React, { useCallback, useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable,
  Image, Linking, Share,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { Avatar } from '../ui/Avatar'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'

type Props = {
  visible: boolean
  onClose: () => void
  title: string
  description?: string
  imageUrl?: string
  shareUrl: string
  authorName?: string
  authorAvatarUrl?: string
  category?: string
}

export function ShareModal({
  visible,
  onClose,
  title,
  description,
  imageUrl,
  shareUrl,
  authorName,
  authorAvatarUrl,
  category,
}: Props) {
  const [copied, setCopied] = useState(false)

  const handleClose = useCallback(() => {
    setCopied(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!visible) setCopied(false)
  }, [visible])

  async function handleCopy() {
    await Clipboard.setStringAsync(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 3500)
  }

  async function handleNativeShare() {
    try {
      await Share.share({ message: shareUrl, url: shareUrl, title })
    } catch {
      /* user cancelled */
    }
  }

  const encodedUrl = encodeURIComponent(shareUrl)

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerLabel}>Partilhar</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={styles.preview}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={['#1a0f0a', '#2a1510', '#1a0f0a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.previewPlaceholder}
              >
                <LinearGradient colors={gradientColors} style={styles.previewOrb} />
              </LinearGradient>
            )}
            <View style={styles.previewBody}>
              <View style={styles.brandRow}>
                <LinearGradient colors={gradientColors} style={styles.brandDot} />
                <Text style={styles.brandText}>Barza</Text>
                {category ? (
                  <>
                    <Text style={styles.brandSep}>·</Text>
                    <Text style={styles.categoryText} numberOfLines={1}>{category}</Text>
                  </>
                ) : null}
              </View>
              <Text style={styles.previewTitle} numberOfLines={2}>{title}</Text>
              {description ? (
                <Text style={styles.previewDesc} numberOfLines={2}>{description}</Text>
              ) : null}
              {authorName ? (
                <View style={styles.authorRow}>
                  <Avatar name={authorName} avatarUrl={authorAvatarUrl} size={20} />
                  <Text style={styles.authorName}>{authorName}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.platformRow}>
            <TouchableOpacity
              style={[styles.platformBtn, styles.fbBtn]}
              onPress={() => Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
            >
              <Ionicons name="logo-facebook" size={22} color="#1877F2" />
              <Text style={[styles.platformLabel, { color: '#1877F2' }]}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.platformBtn, styles.liBtn]}
              onPress={() => Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)}
            >
              <Ionicons name="logo-linkedin" size={22} color="#0A66C2" />
              <Text style={[styles.platformLabel, { color: '#0A66C2' }]}>LinkedIn</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.platformBtn, styles.igBtn]} onPress={handleCopy}>
              <Ionicons name="logo-instagram" size={22} color="#DD2A7B" />
              <Text style={[styles.platformLabel, { color: '#DD2A7B' }]}>Instagram</Text>
            </TouchableOpacity>
          </View>

          {copied ? (
            <View style={styles.copiedTip}>
              <Ionicons name="checkmark-circle" size={16} color="#DD2A7B" />
              <Text style={styles.copiedTipText}>
                Link copiado! Cola no Instagram Stories para partilhar.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.copyRow} onPress={handleCopy} activeOpacity={0.85}>
            <Ionicons name="link-outline" size={18} color={colors.onSurfaceVariant} />
            <Text style={styles.copyUrl} numberOfLines={1}>{shareUrl}</Text>
            <Text style={[styles.copyAction, copied && styles.copyActionDone]}>
              {copied ? 'Copiado!' : 'Copiar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.moreShareBtn} onPress={handleNativeShare} activeOpacity={0.85}>
            <Ionicons name="share-social-outline" size={18} color={colors.primaryContainer} />
            <Text style={styles.moreShareText}>Mais opções</Text>
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
    backgroundColor: '#111111',
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[8],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  headerLabel: {
    ...typography.labelSm,
    color: `${colors.onSurface}80`,
    letterSpacing: 2.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  preview: {
    backgroundColor: '#1c1c1c',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  previewImage: { width: '100%', height: 128 },
  previewPlaceholder: {
    width: '100%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewOrb: { width: 48, height: 48, borderRadius: 24, opacity: 0.35 },
  previewBody: { padding: spacing[4] },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing[2] },
  brandDot: { width: 12, height: 12, borderRadius: 3 },
  brandText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryContainer,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  brandSep: { fontSize: 9, color: `${colors.onSurfaceVariant}30` },
  categoryText: {
    fontSize: 9,
    color: `${colors.onSurfaceVariant}50`,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  previewTitle: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  previewDesc: {
    color: `${colors.onSurfaceVariant}99`,
    fontSize: 11,
    lineHeight: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  authorName: { fontSize: 10, color: `${colors.onSurfaceVariant}80` },
  platformRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[3] },
  platformBtn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: radius['2xl'],
    borderWidth: 1,
  },
  fbBtn: { backgroundColor: 'rgba(24,119,242,0.08)', borderColor: 'rgba(24,119,242,0.2)' },
  liBtn: { backgroundColor: 'rgba(10,102,194,0.08)', borderColor: 'rgba(10,102,194,0.2)' },
  igBtn: { backgroundColor: 'rgba(221,42,123,0.08)', borderColor: 'rgba(221,42,123,0.2)' },
  platformLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  copiedTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.xl,
    backgroundColor: 'rgba(221,42,123,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(221,42,123,0.15)',
    marginBottom: spacing[3],
  },
  copiedTipText: { flex: 1, fontSize: 10, color: 'rgba(221,42,123,0.85)', lineHeight: 14 },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius['2xl'],
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: spacing[3],
  },
  copyUrl: {
    flex: 1,
    fontSize: 10,
    color: `${colors.onSurfaceVariant}66`,
  },
  copyAction: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryContainer,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  copyActionDone: { color: '#4ade80' },
  moreShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  moreShareText: {
    ...typography.label,
    color: colors.primaryContainer,
  },
})
