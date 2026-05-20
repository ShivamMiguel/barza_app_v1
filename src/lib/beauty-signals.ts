import { env } from './env'

export type ExternalSignal = {
  title: string
  summary: string
  image: string | null
  source: string
  url: string
  category: string
  tags: string[]
  type: 'article' | 'youtube'
  created_at: string
}

const CACHE_TTL = 60 * 60 * 1000
let cache: { data: ExternalSignal[]; ts: number } | null = null

export async function fetchExternalSignals(): Promise<ExternalSignal[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data

  try {
    const res = await fetch(env.beautySignalsUrl, {
      headers: { Authorization: `Bearer ${env.supabaseAnonKey}` },
    })
    if (!res.ok) throw new Error(`Edge function responded ${res.status}`)
    const json = await res.json()
    const data: ExternalSignal[] = json.data ?? []
    cache = { data, ts: Date.now() }
    return data
  } catch {
    return cache?.data ?? []
  }
}
