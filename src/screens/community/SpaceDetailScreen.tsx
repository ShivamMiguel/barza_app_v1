import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Linking,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  getSpaceById, getServicesBySpaceIds, ProfessionalSpace, ProfessionalService,
} from '../../lib/spaces'
import { fetchFullProfile, fetchProfileById, UserProfile } from '../../lib/profile'
import { fetchRatingsBySpace, SpaceRatingWithProfile } from '../../lib/ratings'
import { getBookingsBySpace, BookingWithClient } from '../../lib/bookings'
import { getOrdersBySpace, OrderWithProduct } from '../../lib/orders'
import { supabase } from '../../lib/supabase'
import { useCommunity } from '../../context/CommunityContext'
import { haversineKm, formatDistance, getSpaceCoords } from '../../lib/distance'
import { Avatar } from '../../components/ui/Avatar'
import { Spinner } from '../../components/ui/Spinner'
import { SpaceServicesSection } from '../../components/space/SpaceServicesSection'
import { SpaceProductsSection } from '../../components/space/SpaceProductsSection'
import { SpaceRatingsSection } from '../../components/space/SpaceRatingsSection'
import { SpaceBookingsSection } from '../../components/space/SpaceBookingsSection'
import { SpaceOrdersSection } from '../../components/space/SpaceOrdersSection'
import { OffPlatformBanner } from '../../components/space/OffPlatformBanner'
import { colors, spacing, radius, typography } from '../../lib/theme'
import { MainStackParamList } from '../../navigation/types'

type Route = RouteProp<MainStackParamList, 'SpaceDetail'>

function getLocation(space: ProfessionalSpace): {
  city?: string
  address?: string
  neighborhood?: string
} {
  const loc = space.location_space as Record<string, string> | null
  if (!loc) return {}
  return {
    city: loc.city,
    address: loc.address,
    neighborhood: loc.neighborhood,
  }
}

function formatHours(space: ProfessionalSpace): string | null {
  if (!space.time_in || !space.time_out) return null
  return `${space.time_in.slice(0, 5)} – ${space.time_out.slice(0, 5)}`
}

function parseServices(text?: string | null): string[] {
  if (!text) return []
  return text.split(',').map(s => s.trim()).filter(Boolean)
}

export function SpaceDetailScreen() {
  const { spaceId } = useRoute<Route>().params
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>()
  const insets = useSafeAreaInsets()
  const { currentLocation } = useCommunity()
  const [space, setSpace] = useState<ProfessionalSpace | null>(null)
  const [services, setServices] = useState<ProfessionalService[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [ratings, setRatings] = useState<SpaceRatingWithProfile[]>([])
  const [bookings, setBookings] = useState<BookingWithClient[]>([])
  const [spaceOrders, setSpaceOrders] = useState<OrderWithProduct[]>([])
  const [owner, setOwner] = useState<UserProfile | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [sp, profile] = await Promise.all([getSpaceById(spaceId), fetchFullProfile()])
      if (!sp) {
        setLoading(false)
        return
      }
      setSpace(sp)
      setCurrentUserId(profile?.id ?? null)
      setIsOwner(profile?.id === sp.owner)

      const ownerUser = profile?.id === sp.owner

      const [svcs, prodsRes, rats, ownerProfile, spaceBookings, orders] = await Promise.all([
        getServicesBySpaceIds([sp.id], !ownerUser),
        supabase.from('products').select('*').eq('space_id', sp.id),
        fetchRatingsBySpace(sp.id),
        fetchProfileById(sp.owner),
        ownerUser ? getBookingsBySpace(sp.id) : Promise.resolve([]),
        ownerUser ? getOrdersBySpace(sp.id) : Promise.resolve([]),
      ])
      setServices(svcs)
      setProducts(prodsRes.data ?? [])
      setRatings(rats)
      setBookings(spaceBookings)
      setSpaceOrders(orders)
      setOwner(ownerProfile)
      setLoading(false)
    })()
  }, [spaceId])

  if (loading) {
    return (
      <View style={styles.centered}>
        <Spinner diameter={36} color={colors.primaryContainer} />
      </View>
    )
  }

  if (!space) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Espaço não encontrado</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Voltar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const loc = getLocation(space)
  const locationParts = [loc.neighborhood, loc.city].filter(Boolean).join(', ')
  const hours = formatHours(space)
  const beautyCategories = parseServices(space.beauty_services)
  const coords = getSpaceCoords(space.location_space as Record<string, unknown>)
  const distance =
    !isOwner && currentLocation && coords
      ? formatDistance(
          haversineKm(currentLocation.lat, currentLocation.lon, coords.lat, coords.lon),
        )
      : null
  const ratingCount = ratings.length
  const avgRating =
    ratingCount > 0
      ? (ratings.reduce((s, r) => s + r.stars, 0) / ratingCount).toFixed(1)
      : null

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={16} color={`${colors.onSurfaceVariant}99`} />
        <Text style={styles.backText}>Comunidade</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(255,145,86,0.15)', 'rgba(255,71,87,0.06)']}
            style={styles.heroCover}
          >
            {space.logo ? (
              <Image source={{ uri: space.logo }} style={styles.heroCoverImg} />
            ) : null}
            <LinearGradient
              colors={['transparent', 'rgba(17,17,17,0.8)']}
              style={styles.heroCoverFade}
            />
          </LinearGradient>

          <View style={styles.heroBody}>
            <View style={styles.heroTop}>
              <View style={styles.logoBox}>
                {space.logo ? (
                  <Image source={{ uri: space.logo }} style={styles.logoImg} />
                ) : (
                  <Ionicons name="storefront-outline" size={32} color={`${colors.onSurfaceVariant}30`} />
                )}
              </View>
              <View
                style={[
                  styles.badge,
                  space.available ? styles.badgeOn : styles.badgeOff,
                ]}
              >
                <View
                  style={[
                    styles.badgeDot,
                    { backgroundColor: space.available ? '#4ade80' : `${colors.onSurfaceVariant}30` },
                  ]}
                />
                <Text style={styles.badgeText}>
                  {space.available ? 'Disponível' : 'Indisponível'}
                </Text>
              </View>
            </View>

            <Text style={styles.spaceTitle}>{space.space_name}</Text>
            <View style={styles.metaRow}>
              {locationParts ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={16} color={`${colors.onSurfaceVariant}99`} />
                  <Text style={styles.metaText}>{locationParts}</Text>
                </View>
              ) : null}
              {distance ? (
                <View style={styles.distanceRow}>
                  <Ionicons name="navigate" size={14} color={colors.primaryContainer} />
                  <Text style={styles.distance}>{distance}</Text>
                </View>
              ) : null}
            </View>

            {beautyCategories.length > 0 ? (
              <View style={styles.tags}>
                {beautyCategories.map(cat => (
                  <Text key={cat} style={styles.tag}>{cat}</Text>
                ))}
              </View>
            ) : null}

            <View style={styles.statsRow}>
              {ratingCount > 0 && avgRating ? (
                <View style={styles.stat}>
                  <View style={styles.statValRow}>
                    <Text style={styles.statVal}>{avgRating}</Text>
                    <Ionicons name="star" size={16} color={colors.primaryContainer} />
                  </View>
                  <Text style={styles.statLbl}>
                    {ratingCount} {ratingCount === 1 ? 'avaliação' : 'avaliações'}
                  </Text>
                </View>
              ) : null}
              {services.length > 0 ? (
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{services.length}</Text>
                  <Text style={styles.statLbl}>
                    {services.length === 1 ? 'Serviço' : 'Serviços'}
                  </Text>
                </View>
              ) : null}
              {hours ? (
                <View style={styles.stat}>
                  <Text style={[styles.statVal, styles.statValHours]}>{hours}</Text>
                  <Text style={styles.statLbl}>Horário</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {(space.phone || loc.address || loc.city) ? (
          <View style={styles.contactGrid}>
            {space.phone ? (
              <TouchableOpacity
                style={styles.contactCard}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(`tel:${space.phone}`)}
              >
                <Ionicons name="call-outline" size={22} color={colors.primaryContainer} />
                <View>
                  <Text style={styles.contactLabel}>Telefone</Text>
                  <Text style={styles.contactValue}>{space.phone}</Text>
                </View>
              </TouchableOpacity>
            ) : null}
            {(loc.address || loc.city) ? (
              <View style={styles.contactCard}>
                <Ionicons name="location-outline" size={22} color={colors.primaryContainer} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Endereço</Text>
                  <Text style={styles.contactValue}>{loc.address ?? loc.city}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        <SpaceServicesSection
          space={space}
          initialServices={services}
          isOwner={isOwner}
          offThePlatform={!!space.off_the_platform}
        />

        <SpaceProductsSection
          products={products}
          space={space}
          offThePlatform={!!space.off_the_platform}
        />

        <SpaceRatingsSection
          spaceId={space.id}
          spaceName={space.space_name}
          isOwner={isOwner}
          currentUserId={currentUserId}
          initialRatings={ratings}
        />

        {space.off_the_platform ? <OffPlatformBanner /> : null}

        {isOwner ? (
          <SpaceBookingsSection initialBookings={bookings} />
        ) : null}

        {isOwner ? (
          <SpaceOrdersSection initialOrders={spaceOrders} />
        ) : null}

        {owner ? (
          <View>
            <Text style={styles.ownerSectionLabel}>Proprietário</Text>
            <View style={styles.ownerCard}>
              <Avatar name={owner.full_name} avatarUrl={owner.avatar_url} size={48} />
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{owner.full_name}</Text>
                {owner.profession ? (
                  <Text style={styles.ownerProfession}>{owner.profession}</Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { color: colors.onSurfaceVariant },
  backLink: { color: colors.primaryContainer },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backText: {
    ...typography.label,
    color: `${colors.onSurfaceVariant}99`,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[12],
    gap: spacing[8],
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  heroCard: {
    borderRadius: radius['3xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
    backgroundColor: colors.surfaceContainer,
  },
  heroCover: { height: 140, position: 'relative', overflow: 'hidden' },
  heroCoverImg: { width: '100%', height: '100%', opacity: 0.3 },
  heroCoverFade: { ...StyleSheet.absoluteFillObject },
  heroBody: { paddingHorizontal: spacing[6], paddingBottom: spacing[6] },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -48,
    marginBottom: spacing[4],
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#111',
  },
  logoImg: { width: '100%', height: '100%' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeOn: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  badgeOff: {
    backgroundColor: `${colors.onSurfaceVariant}10`,
    borderColor: 'rgba(86,67,58,0.2)',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  spaceTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.onSurface,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: 6,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 14, color: `${colors.onSurfaceVariant}99` },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryContainer,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing[3] },
  tag: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: `${colors.primaryContainer}18`,
    color: colors.primaryContainer,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    marginTop: spacing[5],
    paddingTop: spacing[5],
    borderTopWidth: 1,
    borderTopColor: 'rgba(86,67,58,0.12)',
  },
  stat: { gap: 2 },
  statValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statVal: { fontSize: 20, fontWeight: '900', color: colors.onSurface },
  statValHours: { fontSize: 16 },
  statLbl: {
    ...typography.labelSm,
    color: `${colors.onSurfaceVariant}60`,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  contactGrid: { gap: spacing[3] },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
  },
  contactLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: `${colors.onSurfaceVariant}40`,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  ownerSectionLabel: {
    ...typography.label,
    color: `${colors.onSurfaceVariant}40`,
    letterSpacing: 2,
    marginBottom: spacing[4],
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
    alignSelf: 'flex-start',
  },
  ownerInfo: { gap: 2 },
  ownerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  ownerProfession: {
    fontSize: 10,
    color: `${colors.onSurfaceVariant}50`,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
