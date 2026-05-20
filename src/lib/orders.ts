import { supabase } from './supabase'

export type OrderWithProduct = {
  id: string
  product_id?: string
  quantity: number
  total_price: number
  status: string
  created_at: string
  user?: string
  space_id?: string
  products: { name: string; image_url?: string | null; price?: number } | null
  professional_space: { space_name: string; logo?: string | null } | null
  buyer?: {
    full_name: string
    avatar_url: string | null
    phone: string | null
    profile_location: Record<string, string> | null
  } | null
}

const ORDER_STATUSES = ['pendente', 'enviada', 'entregue', 'cancelada'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

function normalizeBuyer(raw: unknown): OrderWithProduct['buyer'] {
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

function normalizeOrder(row: Record<string, unknown>): OrderWithProduct {
  const products = Array.isArray(row.products)
    ? (row.products[0] as OrderWithProduct['products'])
    : (row.products as OrderWithProduct['products'])
  return {
    id: row.id as string,
    product_id: row.product_id as string | undefined,
    quantity: row.quantity as number,
    total_price: row.total_price as number,
    status: row.status as string,
    created_at: row.created_at as string,
    user: row.user as string | undefined,
    space_id: row.space_id as string | undefined,
    products,
    professional_space: Array.isArray(row.professional_space)
      ? (row.professional_space[0] as OrderWithProduct['professional_space'])
      : (row.professional_space as OrderWithProduct['professional_space']),
    buyer: normalizeBuyer(row.buyer ?? row.profiles),
  }
}

export async function createOrder(input: {
  product_id: string
  space_id: string
  quantity: number
  unitPrice: number
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('orders')
    .insert({
      product_id: input.product_id,
      quantity: input.quantity,
      total_price: input.unitPrice * input.quantity,
      status: 'pendente',
      user: user.id,
      space_id: input.space_id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function cancelOrder(orderId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelada' })
    .eq('id', orderId)
    .eq('user', user.id)
  return !error
}

export async function getOrdersByUser(userId: string): Promise<OrderWithProduct[]> {
  const { data } = await supabase
    .from('orders')
    .select('*, products(name, image_url), professional_space:space_id(space_name, logo)')
    .eq('user', userId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => normalizeOrder(r as Record<string, unknown>))
}

export async function getOrdersBySpace(spaceId: string): Promise<OrderWithProduct[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      '*, products(name, image_url, price), professional_space:space_id(space_name, logo), buyer:profiles!user(full_name, avatar_url, phone, profile_location)',
    )
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(r => normalizeOrder(r as Record<string, unknown>))
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ error?: string }> {
  if (!ORDER_STATUSES.includes(status)) {
    return { error: 'Status inválido' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, space_id, user, professional_space!space_id(owner)')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) return { error: 'Pedido não encontrado' }

  const space = order.professional_space as { owner: string } | { owner: string }[] | null
  const spaceOwner = Array.isArray(space) ? space[0]?.owner : space?.owner
  const isSpaceOwner = spaceOwner === user.id
  const isBuyer = order.user === user.id

  if (!isSpaceOwner && !isBuyer) return { error: 'Sem permissão' }
  if (isBuyer && !isSpaceOwner) {
    if (status !== 'cancelada' || order.status !== 'pendente') {
      return { error: 'Sem permissão para esta transição' }
    }
  }

  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (error) return { error: error.message }
  return {}
}
