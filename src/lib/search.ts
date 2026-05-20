import { supabase } from './supabase'
import { ServiceWithSpace, ProductWithSpace } from './supabase'

export type SearchSpace = { id: string; space_name: string; logo?: string | null }

export type SearchResults = {
  spaces: SearchSpace[]
  services: ServiceWithSpace[]
  products: ProductWithSpace[]
}

export async function searchCommunity(query: string): Promise<SearchResults> {
  const q = query.trim()
  if (!q) return { spaces: [], services: [], products: [] }
  const pattern = `%${q}%`

  const [spacesRes, servicesRes, productsRes] = await Promise.all([
    supabase
      .from('professional_space')
      .select('id, space_name, logo')
      .ilike('space_name', pattern)
      .limit(8),
    supabase
      .from('professional_services')
      .select('*, professional_space(id, space_name, logo, location_space, rate, created_at, off_the_platform)')
      .ilike('service_name', pattern)
      .eq('is_active', true)
      .limit(8),
    supabase
      .from('products')
      .select('*, professional_space!space_id(id, space_name, logo, owner, location_space, off_the_platform)')
      .ilike('name', pattern)
      .limit(8),
  ])

  return {
    spaces: (spacesRes.data ?? []) as SearchSpace[],
    services: (servicesRes.data ?? []) as ServiceWithSpace[],
    products: (productsRes.data ?? []) as ProductWithSpace[],
  }
}
