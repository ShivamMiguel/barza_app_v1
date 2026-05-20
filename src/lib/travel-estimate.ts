import { env } from './env'
import { haversineKm } from './distance'

export type WeatherInfo = {
  condition: string
  icon: string
  temp_c: number
  adjust_min: number
}

export type TravelEstimate = {
  duration_min: number
  distance_km: number
  arrival_iso: string
  source: 'google' | 'estimate'
  weather: WeatherInfo | null
}

function estimateDrivingMin(km: number): number {
  if (km < 1) return 5
  if (km < 3) return Math.round(km * 9)
  if (km < 8) return Math.round(km * 6)
  if (km < 20) return Math.round(km * 3)
  if (km < 50) return Math.round(km * 1.8)
  return Math.round(km * 1.2)
}

export function computeTravelEstimate(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
): TravelEstimate {
  const distanceKm = haversineKm(from.lat, from.lon, to.lat, to.lon)
  const duration_min = estimateDrivingMin(distanceKm)
  return {
    duration_min,
    distance_km: Math.round(distanceKm * 10) / 10,
    arrival_iso: new Date(Date.now() + duration_min * 60_000).toISOString(),
    source: 'estimate',
    weather: null,
  }
}

export async function fetchTravelEstimate(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
): Promise<TravelEstimate> {
  try {
    const params = new URLSearchParams({
      from_lat: String(from.lat),
      from_lon: String(from.lon),
      to_lat: String(to.lat),
      to_lon: String(to.lon),
    })
    const res = await fetch(`${env.webUrl}/api/travel-estimate?${params}`)
    if (res.ok) return (await res.json()) as TravelEstimate
  } catch {
    /* fallback below */
  }
  return computeTravelEstimate(from, to)
}
