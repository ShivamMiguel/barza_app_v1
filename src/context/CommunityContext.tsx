import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as Location from 'expo-location'
import type { UserProfile } from '../lib/profile'
import { fetchMarketInsights } from '../lib/market-insights'
import { useAuth } from './AuthContext'

export type GeoCoords = { lat: number; lon: number }

type CommunityContextValue = {
  userProfile: UserProfile | null
  marketInsights: unknown | null
  isLoadingChrome: boolean
  currentLocation: GeoCoords | null
  refreshInsights: () => Promise<void>
}

const CommunityContext = createContext<CommunityContextValue>({
  userProfile: null,
  marketInsights: null,
  isLoadingChrome: true,
  currentLocation: null,
  refreshInsights: async () => {},
})

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth()
  const [marketInsights, setMarketInsights] = useState<unknown | null>(null)
  const [isLoadingChrome, setIsLoadingChrome] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<GeoCoords | null>(null)

  async function refreshInsights() {
    const data = await fetchMarketInsights()
    setMarketInsights(data)
  }

  useEffect(() => {
    refreshInsights().finally(() => setIsLoadingChrome(false))
  }, [])

  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setCurrentLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
    })().catch(() => {})
  }, [])

  return (
    <CommunityContext.Provider
      value={{
        userProfile,
        marketInsights,
        isLoadingChrome,
        currentLocation,
        refreshInsights,
      }}
    >
      {children}
    </CommunityContext.Provider>
  )
}

export function useCommunity() {
  return useContext(CommunityContext)
}
