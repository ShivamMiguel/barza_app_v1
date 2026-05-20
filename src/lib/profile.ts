import { supabase } from './supabase'

export type ProfileLocation = {
  country?: string
  country_code?: string
  city?: string
  neighborhood?: string
  street?: string
  address?: string
  latitude?: number
  longitude?: number
  dial_code?: string
  bio?: string
}

export type UserProfile = {
  id: string
  full_name: string
  phone?: string
  user_type?: string
  avatar_url?: string | null
  bio?: string
  profession?: string
  profile_location?: ProfileLocation & Record<string, unknown>
  interests?: string[]
  created_at?: string
  email?: string | null
}

function mapProfile(profile: Record<string, unknown>): UserProfile {
  const loc = profile.profile_location as ProfileLocation | undefined
  return {
    id: profile.id as string,
    full_name: (profile.full_name as string) || 'User',
    phone: profile.phone as string | undefined,
    user_type: profile.user_type as string | undefined,
    avatar_url: profile.avatar_url as string | null | undefined,
    profession: profile.role_profile as string | undefined,
    bio: loc?.bio,
    profile_location: loc,
    interests: Array.isArray(profile.interests) ? (profile.interests as string[]) : undefined,
    created_at: profile.created_at as string | undefined,
    email: profile.email as string | null | undefined,
  }
}

export function needsOnboarding(profile: UserProfile | null | undefined): boolean {
  if (!profile) return true
  const hasPhone = !!profile.phone?.trim()
  const hasInterests = (profile.interests?.length ?? 0) > 0
  const hasCity = !!profile.profile_location?.city?.trim()
  return !hasPhone && !hasInterests && !hasCity
}

export async function fetchProfileById(id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error || !data) return null
  return mapProfile(data as Record<string, unknown>)
}

export async function fetchFullProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (error || !data) return null
  return mapProfile(data as Record<string, unknown>)
}

export async function updateProfile(updates: {
  phone?: string
  avatar_url?: string
  interests?: string[]
  location?: ProfileLocation
}): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const patch: Record<string, unknown> = {}
  if (updates.phone != null) patch.phone = updates.phone
  if (updates.avatar_url != null) patch.avatar_url = updates.avatar_url
  if (updates.interests != null) patch.interests = updates.interests

  if (updates.location) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('profile_location')
      .eq('id', user.id)
      .single()
    const prev = (existing?.profile_location as Record<string, unknown>) ?? {}
    patch.profile_location = { ...prev, ...updates.location }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select('*')
    .single()

  if (error || !data) return null
  return mapProfile(data as Record<string, unknown>)
}
