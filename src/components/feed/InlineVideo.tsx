import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Linking, Image, Platform,
} from 'react-native'
import { Video, ResizeMode } from 'expo-av'
import { WebView } from 'react-native-webview'
import { Ionicons } from '@expo/vector-icons'
import {
  YOUTUBE_EMBED_REFERER,
  buildYouTubeEmbedUri,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeVideoId,
  getYouTubeWatchUrl,
  isYouTubeUrl,
  isVideoUrl,
} from '../../lib/media'
import { colors, radius } from '../../lib/theme'

type Props = {
  url: string
  title?: string
  aspectRatio?: number
  /** When true (default), embed loads immediately like web iframe. */
  inline?: boolean
}

export function InlineVideo({ url, title, aspectRatio = 16 / 9, inline = true }: Props) {
  const videoId = getYouTubeVideoId(url)
  const embedUri = videoId ? buildYouTubeEmbedUri(videoId) : getYouTubeEmbedUrl(url)
  const isDirectVideo = isVideoUrl(url) && !isYouTubeUrl(url)
  const [active, setActive] = useState(inline)
  const [failed, setFailed] = useState(false)

  if (embedUri && videoId) {
    if (!active) {
      return (
        <TouchableOpacity
          style={[styles.container, { aspectRatio }]}
          activeOpacity={0.9}
          onPress={() => setActive(true)}
        >
          <Image
            source={{ uri: getYouTubeThumbnailUrl(videoId) }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <View style={styles.playBtn}>
              <Ionicons name="play" size={28} color="#fff" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.playLabel}>Assistir vídeo</Text>
          </View>
        </TouchableOpacity>
      )
    }

    if (failed) {
      return (
        <View style={[styles.container, styles.fallback, { aspectRatio }]}>
          <Ionicons name="logo-youtube" size={36} color="#ff4757" />
          <Text style={styles.fallbackTitle}>Não foi possível reproduzir aqui</Text>
          <TouchableOpacity
            style={styles.fallbackBtn}
            onPress={() => Linking.openURL(getYouTubeWatchUrl(url))}
          >
            <Text style={styles.fallbackBtnText}>Abrir no YouTube</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={[styles.container, { aspectRatio }]}>
        <WebView
          source={{
            uri: embedUri,
            headers: {
              Referer: `${YOUTUBE_EMBED_REFERER}/`,
            },
          }}
          style={StyleSheet.absoluteFill}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled={Platform.OS === 'android'}
          setSupportMultipleWindows={false}
          originWhitelist={['https://*']}
          onError={() => setFailed(true)}
          onHttpError={() => setFailed(true)}
        />
      </View>
    )
  }

  if (isDirectVideo) {
    return (
      <View style={[styles.container, { aspectRatio }]}>
        <Video
          source={{ uri: url }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
        />
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={[styles.container, { aspectRatio }]}
      onPress={() => Linking.openURL(getYouTubeWatchUrl(url))}
    >
      <View style={styles.playOverlay}>
        <Ionicons name="open-outline" size={24} color={colors.primaryContainer} />
        {title ? <Text style={styles.playLabel}>{title}</Text> : null}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
  },
  thumbnail: { width: '100%', height: '100%' },
  video: { width: '100%', height: '100%' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    gap: 8,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,71,87,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  fallbackTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
  },
  fallbackBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,71,87,0.9)',
  },
  fallbackBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
})
