import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { supabaseAuthStorage } from './auth-storage'
import { env } from './env'

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: supabaseAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export type PostWithUser = {
  id: string
  user_id: string
  content: string
  image_url?: string | null
  likes_count: number
  comments_count: number
  created_at: string
  user: {
    id: string
    full_name: string
    avatar_url?: string | null
    profession?: string | null
  }
  liked_by_me?: boolean
}

export type ServiceWithSpace = {
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
  professional_space: {
    id: string
    space_name: string
    logo?: string | null
    location_space?: Record<string, any> | null
    rate?: number | null
    created_at: string
    off_the_platform?: boolean | null
  }
}

export type ProductWithSpace = {
  id: string
  name: string
  description?: string | null
  price: number
  promo_price?: number | null
  image_url?: string | null
  category?: string | null
  created_at: string
  space_id: string
  professional_space: {
    id: string
    space_name: string
    logo?: string | null
    owner: string
    location_space?: Record<string, any> | null
    off_the_platform?: boolean | null
  }
}

export type { UserProfile } from './profile'

export async function fetchPosts(limit = 10, offset = 0): Promise<PostWithUser[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:profiles(id, full_name, avatar_url, profession:role_profile)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !data) return []

  const posts = data as PostWithUser[]

  const { data: { user } } = await supabase.auth.getUser()
  if (user && posts.length > 0) {
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', posts.map(p => p.id))

    const likedSet = new Set((likes ?? []).map((l: any) => l.post_id))
    posts.forEach(p => { p.liked_by_me = likedSet.has(p.id) })
  }

  return posts
}

export async function fetchServices(limit = 50): Promise<ServiceWithSpace[]> {
  const { data, error } = await supabase
    .from('professional_services')
    .select('*, professional_space(id, space_name, logo, location_space, rate, created_at, off_the_platform)')
    .eq('is_active', true)
    .limit(limit)

  if (error || !data) return []
  return data as ServiceWithSpace[]
}

export async function fetchProducts(limit = 50): Promise<ProductWithSpace[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, professional_space!space_id(id, space_name, logo, owner, location_space, off_the_platform)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as ProductWithSpace[]
}

export async function fetchPostsByUser(userId: string, limit = 100): Promise<PostWithUser[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:profiles(id, full_name, avatar_url, profession:role_profile)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as PostWithUser[]
}

export { fetchFullProfile as fetchUserProfile } from './profile'

export { togglePostLike } from './posts'
