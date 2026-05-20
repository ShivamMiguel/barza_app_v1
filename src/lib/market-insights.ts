import { supabase } from './supabase'
import { env } from './env'

export async function fetchMarketInsights(): Promise<unknown | null> {
  const { data: { user } } = await supabase.auth.getUser()
  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.supabaseAnonKey}`,
    'Content-Type': 'application/json',
  }
  if (user?.id) headers['x-user-id'] = user.id

  try {
    const res = await fetch(env.marketInsightsUrl, { headers })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
