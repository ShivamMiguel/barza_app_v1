import { supabase } from './supabase'

export type ProfessionalSpace = {
  id: string
  created_at: string
  space_name: string
  rate: number | null
  owner: string
  beauty_services?: string | null
  location_space?: Record<string, unknown> | null
  phone?: string | null
  time_in?: string | null
  time_out?: string | null
  logo?: string | null
  available?: boolean | null
  off_the_platform?: boolean | null
}

export type ProfessionalService = {
  id: string
  professional_space_id: string
  service_name: string
  price: number
  category: string
  is_active: boolean
  duration_minutes: number
  description?: string | null
  extra_fee?: number | null
  preco_promocional?: number | null
  image?: string | null
}

export async function getSpaceById(id: string): Promise<ProfessionalSpace | null> {
  const { data, error } = await supabase.from('professional_space').select('*').eq('id', id).single()
  if (error || !data) return null
  return data as ProfessionalSpace
}

export async function getSpacesByOwner(ownerId: string): Promise<ProfessionalSpace[]> {
  const { data } = await supabase
    .from('professional_space')
    .select('*')
    .eq('owner', ownerId)
    .order('created_at', { ascending: false })
  return (data ?? []) as ProfessionalSpace[]
}

export async function getServicesBySpaceIds(
  spaceIds: string[],
  activeOnly = false,
): Promise<ProfessionalService[]> {
  if (spaceIds.length === 0) return []
  let query = supabase
    .from('professional_services')
    .select('*')
    .in('professional_space_id', spaceIds)
    .order('created_at', { ascending: false })
  if (activeOnly) query = query.eq('is_active', true)
  const { data } = await query
  return (data ?? []) as ProfessionalService[]
}

export async function createProfessionalSpace(input: {
  space_name: string
  phone?: string
  time_in?: string
  time_out?: string
  beauty_services?: string
  available?: boolean
  location_space?: Record<string, unknown> | null
  logoUri?: string | null
  logoMime?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  let logoUrl: string | null = null
  if (input.logoUri) {
    const path = `spaces/${user.id}/${Date.now()}.jpg`
    const res = await fetch(input.logoUri)
    const blob = await res.blob()
    const { error: upErr } = await supabase.storage.from('logo').upload(path, blob, {
      contentType: input.logoMime ?? 'image/jpeg',
      upsert: true,
    })
    if (!upErr) {
      const { data: pub } = supabase.storage.from('logo').getPublicUrl(path)
      logoUrl = pub.publicUrl
    }
  }

  const { data, error } = await supabase
    .from('professional_space')
    .insert({
      space_name: input.space_name,
      owner: user.id,
      logo: logoUrl,
      phone: input.phone ?? null,
      time_in: input.time_in ?? null,
      time_out: input.time_out ?? null,
      beauty_services: input.beauty_services ?? null,
      space: true,
      available: input.available ?? true,
      location_space: input.location_space ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ProfessionalSpace
}

export async function createService(input: {
  professional_space_id: string
  service_name: string
  category: string
  price: number
  duration_minutes: number
  preco_promocional?: number | null
  extra_fee?: number | null
  description?: string | null
  is_active?: boolean
  imageUri?: string | null
}) {
  let imageUrl: string | null = null
  if (input.imageUri) {
    const path = `services/${input.professional_space_id}/${Date.now()}.jpg`
    const res = await fetch(input.imageUri)
    const blob = await res.blob()
    const { error: upErr } = await supabase.storage.from('logo').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    })
    if (!upErr) {
      const { data: pub } = supabase.storage.from('logo').getPublicUrl(path)
      imageUrl = pub.publicUrl
    }
  }

  const { data, error } = await supabase
    .from('professional_services')
    .insert({
      professional_space_id: input.professional_space_id,
      service_name: input.service_name,
      category: input.category,
      price: input.price,
      duration_minutes: input.duration_minutes,
      preco_promocional: input.preco_promocional ?? null,
      extra_fee: input.extra_fee ?? null,
      description: input.description ?? null,
      is_active: input.is_active ?? true,
      image: imageUrl,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ProfessionalService
}

export async function updateService(
  id: string,
  input: Partial<Omit<ProfessionalService, 'id'>> & { imageUri?: string | null },
) {
  const patch: Record<string, unknown> = { ...input }
  delete patch.imageUri
  if (input.imageUri) {
    const path = `services/${id}/${Date.now()}.jpg`
    const res = await fetch(input.imageUri)
    const blob = await res.blob()
    const { error: upErr } = await supabase.storage.from('logo').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
    if (!upErr) {
      const { data: pub } = supabase.storage.from('logo').getPublicUrl(path)
      patch.image = pub.publicUrl
    }
  }
  const { data, error } = await supabase.from('professional_services').update(patch).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as ProfessionalService
}

export async function deleteService(id: string) {
  const { error } = await supabase.from('professional_services').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getMySpaces(): Promise<{ spaces: ProfessionalSpace[]; services: ProfessionalService[] }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { spaces: [], services: [] }
  const spaces = await getSpacesByOwner(user.id)
  const services = await getServicesBySpaceIds(spaces.map(s => s.id))
  return { spaces, services }
}
