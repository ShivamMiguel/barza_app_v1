import { env } from './env'

const WEB_BASE = env.webUrl

export function getPostShareUrl(postId: string): string {
  return `${WEB_BASE}/share/post/${postId}`
}

export function getCommunityShareUrl(): string {
  return `${WEB_BASE}/community`
}
