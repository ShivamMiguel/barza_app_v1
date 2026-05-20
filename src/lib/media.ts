import { env } from './env'

/** Origin sent to YouTube embeds (fixes error 153 in WebView). */
export const YOUTUBE_EMBED_REFERER = env.webUrl

export function isVideoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return /\.(mp4|mov|webm|m4v|m3u8)(\?|#|$)/i.test(lower)
    || lower.includes('/video/')
    || lower.includes('content-type=video')
}

export function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url)
}

export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null
  const embedMatch = url.match(/\/embed\/([^?&/]+)/)
  if (embedMatch) return embedMatch[1]
  const watchMatch = url.match(/[?&]v=([^&]+)/)
  if (watchMatch) return watchMatch[1]
  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/)
  if (shortMatch) return shortMatch[1]
  return null
}

/** Embed URI for WebView — nocookie domain + origin (web uses plain youtube.com iframe). */
export function buildYouTubeEmbedUri(videoId: string): string {
  const origin = encodeURIComponent(YOUTUBE_EMBED_REFERER)
  return (
    `https://www.youtube-nocookie.com/embed/${videoId}` +
    `?playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${origin}`
  )
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeVideoId(url)
  return id ? buildYouTubeEmbedUri(id) : null
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export function getYouTubeWatchUrl(url: string): string {
  const id = getYouTubeVideoId(url)
  if (id) return `https://www.youtube.com/watch?v=${id}`
  return url
}
