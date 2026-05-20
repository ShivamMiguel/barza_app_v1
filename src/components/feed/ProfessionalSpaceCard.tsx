import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ServiceWithSpace } from '../../lib/supabase'
import { useCommunity } from '../../context/CommunityContext'
import { haversineKm, formatDistance, getSpaceCoords } from '../../lib/distance'
import { formatArrival, formatPriceKz } from '../../lib/format'
import { getTimeAgoFeed, formatLocation } from '../../lib/time'
import { useTravelEstimate } from '../../hooks/useTravelEstimate'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'
import { MainStackParamList } from '../../navigation/types'
import { BookingModal } from '../modals/BookingModal'

interface Props {
  service: ServiceWithSpace
}

function weatherIconName(icon: string): keyof typeof Ionicons.glyphMap {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    rainy: 'rainy',
    thunderstorm: 'thunderstorm',
    cloudy: 'cloudy',
    cloud: 'cloudy-outline',
    clear_day: 'sunny',
    partly_cloudy_day: 'partly-sunny',
    foggy: 'cloudy',
  }
  return map[icon] ?? 'partly-sunny'
}

export function ProfessionalSpaceCard({ service }: Props) {
  const [bookingOpen, setBookingOpen] = useState(false)
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>()
  const { currentLocation } = useCommunity()
  const space = service.professional_space
  const location = formatLocation(space.location_space)
  const coords = getSpaceCoords(space.location_space)
  const distance =
    currentLocation && coords
      ? formatDistance(haversineKm(currentLocation.lat, currentLocation.lon, coords.lat, coords.lon))
      : null
  const { data: travel } = useTravelEstimate(
    currentLocation ?? null,
    coords,
  )

  return (
    <>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.header}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('SpaceDetail', { spaceId: space.id })}
        >
          <View style={styles.spaceRow}>
            <View style={styles.logoWrapper}>
              {space.logo ? (
                <Image source={{ uri: space.logo }} style={styles.logo} />
              ) : (
                <LinearGradient colors={gradientColors} style={styles.logoPlaceholder}>
                  <Text style={styles.logoLetter}>{space.space_name[0]?.toUpperCase()}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.spaceInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.spaceName} numberOfLines={1}>{space.space_name}</Text>
                {!space.off_the_platform && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primaryContainer} />
                )}
              </View>
              <Text style={styles.spaceMeta} numberOfLines={1}>
                {location}
                {distance ? ` • ${distance}` : ''}
                {` • ${getTimeAgoFeed(space.created_at)}`}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreBtn} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={20} color={`${colors.onSurface}50`} />
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.imageBlock}>
          {service.image ? (
            <Image source={{ uri: service.image }} style={styles.serviceImage} resizeMode="cover" />
          ) : (
            <View style={styles.noImage}>
              <Ionicons name="image-outline" size={48} color={`${colors.onSurfaceVariant}25`} />
              <Text style={styles.noImageText}>Imagem não disponível</Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imageOverlay}
          >
            <View style={styles.overlayContent}>
              <Text style={styles.category}>{service.category}</Text>
              <Text style={styles.serviceName}>{service.service_name}</Text>
              {!space.off_the_platform && (
                <Text style={styles.serviceMeta}>
                  {service.duration_minutes}min · {formatPriceKz(service.price)}
                </Text>
              )}

              {travel ? (
                <View style={styles.travelChip}>
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.travelText}>~{travel.duration_min} min</Text>
                  <Text style={styles.travelSep}>·</Text>
                  <Text style={styles.travelText}>
                    Chega às {formatArrival(travel.arrival_iso)}
                  </Text>
                  {travel.weather ? (
                    <>
                      <Text style={styles.travelSep}>·</Text>
                      <Ionicons
                        name={weatherIconName(travel.weather.icon)}
                        size={13}
                        color="rgba(255,255,255,0.85)"
                      />
                      <Text style={styles.travelText}>{travel.weather.temp_c}°</Text>
                    </>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.ctaRow}>
                {space.off_the_platform ? (
                  <TouchableOpacity
                    style={styles.ctaPrimary}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('SpaceDetail', { spaceId: space.id })}
                  >
                    <LinearGradient colors={gradientColors} style={styles.ctaPrimaryGradient}>
                      <Ionicons name="call-outline" size={16} color={colors.onPrimary} />
                      <Text style={styles.ctaPrimaryText}>Contactar Empresa</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.ctaPrimary}
                    activeOpacity={0.9}
                    onPress={() => setBookingOpen(true)}
                  >
                    <LinearGradient colors={gradientColors} style={styles.ctaPrimaryGradient}>
                      <Text style={styles.ctaPrimaryText}>Agendar Agora</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.ctaSecondary}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('SpaceDetail', { spaceId: space.id })}
                >
                  <Text style={styles.ctaSecondaryText}>Ver Perfil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>

      {!space.off_the_platform && (
        <BookingModal visible={bookingOpen} onClose={() => setBookingOpen(false)} service={service} />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius['3xl'],
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,145,86,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[6],
    justifyContent: 'space-between',
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  logoWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
    flexShrink: 0,
  },
  logo: { width: 48, height: 48 },
  logoPlaceholder: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  spaceInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  spaceName: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  spaceMeta: {
    color: `${colors.onSurfaceVariant}99`,
    fontSize: 12,
  },
  moreBtn: { padding: 4 },
  imageBlock: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceContainerHigh,
  },
  serviceImage: { width: '100%', height: '100%' },
  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  noImageText: {
    ...typography.labelSm,
    color: `${colors.onSurfaceVariant}25`,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing[8],
  },
  overlayContent: { gap: spacing[1] },
  category: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryContainer,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  serviceName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  serviceMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  travelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    marginTop: spacing[2],
  },
  travelText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  travelSep: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[4],
  },
  ctaPrimary: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  ctaPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  ctaPrimaryText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  ctaSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(86,67,58,0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSecondaryText: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '800',
  },
})
