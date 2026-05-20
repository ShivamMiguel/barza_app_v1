export const SPACE_SERVICE_CATEGORIES = [
  { id: 'corte', label: 'Corte Clássico' },
  { id: 'barba', label: 'Barba & Ritual' },
  { id: 'colorimetria', label: 'Colorimetria' },
  { id: 'tratamento', label: 'Tratamento' },
  { id: 'trancas', label: 'Tranças' },
  { id: 'manicure', label: 'Manicure' },
  { id: 'maquilhagem', label: 'Maquilhagem' },
  { id: 'sobrancelhas', label: 'Sobrancelhas' },
] as const

export function labelsFromCategoryIds(ids: string[]): string[] {
  return SPACE_SERVICE_CATEGORIES.filter(c => ids.includes(c.id)).map(c => c.label)
}

export function categoryIdsFromBeautyServices(beautyServices?: string | null): string[] {
  const existing = (beautyServices ?? '').split(',').map(s => s.trim()).filter(Boolean)
  return SPACE_SERVICE_CATEGORIES.filter(c => existing.includes(c.label)).map(c => c.id)
}
