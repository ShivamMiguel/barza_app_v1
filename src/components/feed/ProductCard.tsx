import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ProductWithSpace } from '../../lib/supabase'
import { useCommunity } from '../../context/CommunityContext'
import { haversineKm, formatDistance, getSpaceCoords } from '../../lib/distance'
import { formatArrival, formatPriceKz } from '../../lib/format'
import { useTravelEstimate } from '../../hooks/useTravelEstimate'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'
import { MainStackParamList } from '../../navigation/types'
import { PurchaseModal } from '../modals/PurchaseModal'

interface Props {
  product: ProductWithSpace
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

export function ProductCard({ product }: Props) {
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>()
  const { currentLocation } = useCommunity()
  const space = product.professional_space
  const hasPromo = product.promo_price != null && product.promo_price < product.price
  const displayPrice = hasPromo ? product.promo_price! : product.price
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
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="storefront-outline" size={16} color={`${colors.onSurfaceVariant}30`} />
                </View>
              )}
            </View>
            <View style={styles.spaceInfo}>
              <Text style={styles.spaceName} numberOfLines={1}>{space.space_name}</Text>
              <View style={styles.headerMeta}>
                {product.category ? (
                  <Text style={styles.category} numberOfLines={1}>{product.category}</Text>
                ) : null}
                {distance ? (
                  <View style={styles.distanceRow}>
                    {product.category ? <Text style={styles.metaSep}> </Text> : null}
                    <Ionicons name="navigate" size={11} color={`${colors.onSurfaceVariant}50`} />
                    <Text style={styles.distance}>{distance}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={`${colors.onSurfaceVariant}20`} />
        </TouchableOpacity>

        {travel ? (
          <View style={styles.travelRow}>
            <Ionicons name="time-outline" size={13} color={colors.primaryContainer} />
            <Text style={styles.travelBold}>~{travel.duration_min} min</Text>
            <Text style={styles.travelSep}>·</Text>
            <Text style={styles.travelMuted}>
              Chega às {formatArrival(travel.arrival_iso)}
            </Text>
            {travel.weather ? (
              <>
                <Text style={styles.travelSep}>·</Text>
                <Ionicons
                  name={weatherIconName(travel.weather.icon)}
                  size={13}
                  color={`${colors.onSurfaceVariant}99`}
                />
                <Text style={styles.travelMuted}>
                  {travel.weather.temp_c}° · {travel.weather.condition}
                </Text>
              </>
            ) : null}
          </View>
        ) : null}

        {product.image_url ? (
          <View style={styles.imageBlock}>
            <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" />
            {hasPromo && !space.off_the_platform ? (
              <View style={styles.promoOnImage}>
                <Text style={styles.promoOnImageText}>Promoção</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.content}>
          {!product.image_url && product.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{product.category}</Text>
            </View>
          ) : null}

          <Text style={styles.productName}>{product.name}</Text>
          {product.description ? (
            <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
          ) : null}

          <View style={styles.priceRow}>
            {!space.off_the_platform ? (
              <View style={styles.priceBlock}>
                <Text style={styles.displayPrice}>{formatPriceKz(displayPrice)}</Text>
                {hasPromo ? (
                  <Text style={styles.originalPrice}>{formatPriceKz(product.price)}</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.priceBlock} />
            )}

            {space.off_the_platform ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('SpaceDetail', { spaceId: space.id })}
              >
                <LinearGradient colors={gradientColors} style={styles.buyGradient}>
                  <Ionicons name="call-outline" size={14} color={colors.onPrimary} />
                  <Text style={styles.buyText}>Contactar</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setPurchaseOpen(true)}>
                <LinearGradient colors={gradientColors} style={styles.buyGradient}>
                  <Ionicons name="bag-outline" size={14} color={colors.onPrimary} />
                  <Text style={styles.buyText}>Comprar</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {!space.off_the_platform && (
        <PurchaseModal visible={purchaseOpen} onClose={() => setPurchaseOpen(false)} product={product} />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius['3xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(86,67,58,0.08)',
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  logoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
    flexShrink: 0,
  },
  logo: { width: 36, height: 36 },
  logoPlaceholder: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceInfo: { flex: 1, minWidth: 0 },
  spaceName: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '700',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  category: {
    ...typography.labelSm,
    color: `${colors.onSurfaceVariant}50`,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 },
  metaSep: { color: `${colors.onSurfaceVariant}30`, fontSize: 10 },
  distance: {
    fontSize: 10,
    color: `${colors.onSurfaceVariant}50`,
  },
  travelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(86,67,58,0.06)',
    backgroundColor: 'rgba(42,42,42,0.25)',
  },
  travelBold: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurface,
  },
  travelSep: { fontSize: 11, color: `${colors.onSurfaceVariant}30` },
  travelMuted: {
    fontSize: 11,
    color: `${colors.onSurfaceVariant}99`,
  },
  imageBlock: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceContainerHigh,
  },
  productImage: { width: '100%', height: '100%' },
  promoOnImage: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  promoOnImageText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.onPrimary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  content: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primaryContainer}18`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing[1],
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryContainer,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  productName: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
  productDesc: {
    color: `${colors.onSurfaceVariant}99`,
    fontSize: 14,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[1],
    borderTopWidth: 1,
    borderTopColor: 'rgba(86,67,58,0.08)',
    gap: spacing[3],
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
    flex: 1,
  },
  displayPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.onSurface,
  },
  originalPrice: {
    fontSize: 12,
    color: `${colors.onSurfaceVariant}40`,
    textDecorationLine: 'line-through',
  },
  buyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  buyText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
})
