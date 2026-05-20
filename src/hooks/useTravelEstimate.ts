import { useEffect, useState } from 'react'
import { fetchTravelEstimate, type TravelEstimate } from '../lib/travel-estimate'

type Coords = { lat: number; lon: number } | null

export function useTravelEstimate(from: Coords, to: Coords) {
  const [data, setData] = useState<TravelEstimate | null>(null)

  useEffect(() => {
    if (!from || !to) {
      setData(null)
      return
    }
    let cancelled = false
    fetchTravelEstimate(from, to).then(result => {
      if (!cancelled) setData(result)
    })
    return () => { cancelled = true }
  }, [
    from?.lat,
    from?.lon,
    to?.lat,
    to?.lon,
  ])

  return { data }
}
