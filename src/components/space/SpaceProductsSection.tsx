import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { ProductWithSpace } from '../../lib/supabase'
import { ProfessionalSpace } from '../../lib/spaces'
import { formatPriceKz } from '../../lib/format'
import { PurchaseModal } from '../modals/PurchaseModal'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'

type Product = {
  id: string
  name: string
  description?: string | null
  price: number
  promo_price?: number | null
  image_url?: string | null
  category?: string | null
  created_at: string
  space_id: string
}

type Props = {
  products: Product[]
  space: ProfessionalSpace
  offThePlatform: boolean
}

export function SpaceProductsSection({ products, space, offThePlatform }: Props) {
  const [selected, setSelected] = useState<ProductWithSpace | null>(null)

  if (products.length === 0) return null

  function toProductWithSpace(p: Product): ProductWithSpace {
    return {
      ...p,
      professional_space: {
        id: space.id,
        space_name: space.space_name,
        logo: space.logo ?? null,
        owner: space.owner,
        location_space: space.location_space as Record<string, unknown> | null,
        off_the_platform: space.off_the_platform,
      },
    }
  }

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Produtos <Text style={styles.count}>({products.length})</Text>
        </Text>

        <View style={styles.grid}>
          {products.map(product => {
            const hasPromo =
              product.promo_price != null && product.promo_price < product.price
            const displayPrice = hasPromo ? product.promo_price! : product.price

            return (
              <View key={product.id} style={styles.card}>
                {product.image_url ? (
                  <View style={styles.imageWrap}>
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                    {hasPromo && !offThePlatform ? (
                      <View style={styles.promoBadge}>
                        <Text style={styles.promoText}>Promo</Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={[styles.imageWrap, styles.imagePlaceholder]}>
                    <Ionicons
                      name="cube-outline"
                      size={28}
                      color={`${colors.onSurfaceVariant}20`}
                    />
                  </View>
                )}

                <View style={styles.body}>
                  <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
                  {product.category ? (
                    <Text style={styles.category} numberOfLines={1}>{product.category}</Text>
                  ) : null}

                  <View style={styles.footer}>
                    {!offThePlatform ? (
                      <View style={styles.priceBlock}>
                        <Text style={styles.price}>{formatPriceKz(displayPrice)}</Text>
                        {hasPromo ? (
                          <Text style={styles.oldPrice}>{formatPriceKz(product.price)}</Text>
                        ) : null}
                      </View>
                    ) : (
                      <View style={styles.priceBlock} />
                    )}

                    {offThePlatform ? (
                      <View style={styles.buyBtnSmall}>
                        <Ionicons name="call-outline" size={12} color={colors.onPrimary} />
                        <Text style={styles.buyText}>Contactar</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setSelected(toProductWithSpace(product))}
                      >
                        <LinearGradient colors={gradientColors} style={styles.buyBtnSmall}>
                          <Ionicons name="bag-outline" size={12} color={colors.onPrimary} />
                          <Text style={styles.buyText}>Comprar</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      </View>

      {selected && !offThePlatform ? (
        <PurchaseModal
          visible
          onClose={() => setSelected(null)}
          product={selected}
        />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing[5] },
  sectionLabel: {
    ...typography.label,
    color: `${colors.onSurfaceVariant}40`,
    letterSpacing: 2,
  },
  count: { color: `${colors.onSurfaceVariant}25` },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
    backgroundColor: colors.surfaceContainer,
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceContainerHigh,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  promoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  promoText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.onPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  body: { padding: spacing[3], gap: 6, flex: 1 },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurface,
    lineHeight: 16,
  },
  category: {
    fontSize: 9,
    color: `${colors.onSurfaceVariant}40`,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 'auto',
  },
  priceBlock: { flex: 1, minWidth: 0 },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.onSurface,
  },
  oldPrice: {
    fontSize: 9,
    color: `${colors.onSurfaceVariant}40`,
    textDecorationLine: 'line-through',
  },
  buyBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  buyText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
})
