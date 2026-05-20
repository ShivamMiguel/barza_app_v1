export type LocationData = {
  city: string
  street: string
  address: string
  country: string
  latitude: number
  longitude: number
  neighborhood: string
}

type NominatimResult = {
  display_name: string
  lat: string
  lon: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    road?: string
    pedestrian?: string
    footway?: string
    neighbourhood?: string
    suburb?: string
    quarter?: string
    country?: string
  }
}

function parseNominatim(r: NominatimResult): LocationData {
  const a = r.address ?? {}
  return {
    city: a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? '',
    street: a.road ?? a.pedestrian ?? a.footway ?? '',
    address: r.display_name,
    country: a.country ?? '',
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
    neighborhood: a.neighbourhood ?? a.suburb ?? a.quarter ?? '',
  }
}

export async function nominatimSearch(q: string): Promise<LocationData[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
    { headers: { 'Accept-Language': 'pt-AO, pt, en' } },
  )
  const json = (await res.json()) as NominatimResult[]
  return json.map(parseNominatim)
}

export async function nominatimReverse(lat: number, lon: number): Promise<LocationData> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
    { headers: { 'Accept-Language': 'pt-AO, pt, en' } },
  )
  return parseNominatim((await res.json()) as NominatimResult)
}
