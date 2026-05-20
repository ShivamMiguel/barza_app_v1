import { supabase } from './supabase'

export type BookingWithSpace = {
  id: string
  booking_date: string
  booking_time: string
  status: string
  total_price: number
  home: boolean
  description: string | null
  professional_space: { space_name: string; logo: string | null } | null
  professional_services: { service_name: string } | null
}

export type BookingWithClient = {
  id: string
  client_id: string
  professional_space_id: string
  booking_date: string
  booking_time: string
  status: string
  description: string | null
  total_price: number
  home: boolean
  profiles: {
    full_name: string
    avatar_url: string | null
    phone: string | null
    profile_location: Record<string, string> | null
  } | null
  professional_services: { service_name: string } | null
}

const BOOKING_STATUSES = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

function normalizeProfile(raw: unknown): BookingWithClient['profiles'] {
  if (!raw) return null
  const p = Array.isArray(raw) ? raw[0] : raw
  if (!p || typeof p !== 'object') return null
  const row = p as Record<string, unknown>
  return {
    full_name: (row.full_name as string) || 'Cliente',
    avatar_url: (row.avatar_url as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    profile_location: (row.profile_location as Record<string, string> | null) ?? null,
  }
}

function normalizeBookingClient(row: Record<string, unknown>): BookingWithClient {
  return {
    id: row.id as string,
    client_id: row.client_id as string,
    professional_space_id: row.professional_space_id as string,
    booking_date: row.booking_date as string,
    booking_time: row.booking_time as string,
    status: row.status as string,
    description: (row.description as string | null) ?? null,
    total_price: row.total_price as number,
    home: !!row.home,
    profiles: normalizeProfile(row.profiles),
    professional_services: Array.isArray(row.professional_services)
      ? (row.professional_services[0] as { service_name: string })
      : (row.professional_services as { service_name: string } | null),
  }
}

export async function createBooking(input: {
  service_id: string
  professional_space_id: string
  booking_date: string
  booking_time: string
  description?: string | null
  home: boolean
  total_price: number
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      client_id: user.id,
      service_id: input.service_id,
      professional_space_id: input.professional_space_id,
      booking_date: input.booking_date,
      booking_time: input.booking_time,
      description: input.description ?? null,
      home: input.home,
      total_price: input.total_price,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getBookingsByUser(userId: string): Promise<BookingWithSpace[]> {
  const { data } = await supabase
    .from('bookings')
    .select('*, professional_space(space_name, logo), professional_services(service_name)')
    .eq('client_id', userId)
    .order('booking_date', { ascending: false })
  return (data ?? []) as BookingWithSpace[]
}

export async function cancelBooking(bookingId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'rejected' })
    .eq('id', bookingId)
    .eq('client_id', user.id)
  return !error
}

export async function getBookingsBySpace(spaceId: string): Promise<BookingWithClient[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, profiles(full_name, avatar_url, phone, profile_location), professional_services(service_name)')
    .eq('professional_space_id', spaceId)
    .order('booking_date', { ascending: false })
  if (error || !data) return []
  return data.map(r => normalizeBookingClient(r as Record<string, unknown>))
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<{ error?: string }> {
  if (!BOOKING_STATUSES.includes(status)) {
    return { error: 'Estado inválido' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('client_id, professional_space_id, professional_space(owner)')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) return { error: 'Agendamento não encontrado' }

  const space = booking.professional_space as { owner: string } | { owner: string }[] | null
  const spaceOwner = Array.isArray(space) ? space[0]?.owner : space?.owner
  const isSpaceOwner = spaceOwner === user.id
  const isClient = booking.client_id === user.id

  if (!isSpaceOwner && !isClient) return { error: 'Sem permissão' }
  if (isClient && !isSpaceOwner && status !== 'rejected') {
    return { error: 'Sem permissão' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)

  if (error) return { error: error.message }
  return {}
}
