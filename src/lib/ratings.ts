import { supabase } from './supabase'

export type SpaceRatingWithProfile = {
  id: string
  space_id: string
  client_id: string
  stars: number
  comment: string | null
  created_at: string
  profiles: { full_name: string; avatar_url: string | null } | null
}

function normalizeProfile(raw: unknown): SpaceRatingWithProfile['profiles'] {
  if (!raw) return null
  const p = Array.isArray(raw) ? raw[0] : raw
  if (!p || typeof p !== 'object') return null
  const row = p as Record<string, unknown>
  return {
    full_name: (row.full_name as string) || 'Utilizador',
    avatar_url: (row.avatar_url as string | null) ?? null,
  }
}

function normalizeRating(row: Record<string, unknown>): SpaceRatingWithProfile {
  return {
    id: row.id as string,
    space_id: row.space_id as string,
    client_id: row.client_id as string,
    stars: row.stars as number,
    comment: (row.comment as string | null) ?? null,
    created_at: row.created_at as string,
    profiles: normalizeProfile(row.profiles),
  }
}

export async function fetchRatingsBySpace(spaceId: string): Promise<SpaceRatingWithProfile[]> {
  const { data, error } = await supabase
    .from('professional_space_ratings')
    .select('*, profiles(full_name, avatar_url)')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(r => normalizeRating(r as Record<string, unknown>))
}

async function recalculateSpaceRate(spaceId: string) {
  const { data: allRatings } = await supabase
    .from('professional_space_ratings')
    .select('stars')
    .eq('space_id', spaceId)
  const newRate =
    allRatings && allRatings.length > 0
      ? Math.round(allRatings.reduce((s, r) => s + r.stars, 0) / allRatings.length * 10) / 10
      : null
  await supabase.from('professional_space').update({ rate: newRate }).eq('id', spaceId)
}

export async function upsertSpaceRating(
  spaceId: string,
  stars: number,
  comment: string | null,
): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: space } = await supabase
    .from('professional_space')
    .select('owner')
    .eq('id', spaceId)
    .single()
  if (space?.owner === user.id) {
    return { error: 'Não podes avaliar o teu próprio espaço' }
  }

  const { error } = await supabase
    .from('professional_space_ratings')
    .upsert(
      { space_id: spaceId, client_id: user.id, stars, comment },
      { onConflict: 'space_id,client_id' },
    )
  if (error) return { error: error.message }

  await recalculateSpaceRate(spaceId)
  return {}
}

export async function deleteMySpaceRating(spaceId: string): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('professional_space_ratings')
    .delete()
    .eq('space_id', spaceId)
    .eq('client_id', user.id)
  if (error) return { error: error.message }

  await recalculateSpaceRate(spaceId)
  return {}
}
