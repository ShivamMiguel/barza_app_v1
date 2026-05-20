import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ProfessionalService } from '../../lib/spaces'
import { formatPriceKz } from '../../lib/format'
import { colors, spacing, radius, typography } from '../../lib/theme'

type Props = {
  service: ProfessionalService
  spaceName: string
  isOwner: boolean
  offThePlatform: boolean
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}

export function SpaceServiceCard({
  service,
  spaceName,
  isOwner,
  offThePlatform,
  onEdit,
  onDelete,
  deleting,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {service.image ? (
          <Image source={{ uri: service.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cut-outline" size={40} color={`${colors.onSurfaceVariant}20`} />
          </View>
        )}
        {isOwner ? (
          <View
            style={[
              styles.activeBadge,
              service.is_active ? styles.activeOn : styles.activeOff,
            ]}
          >
            <View
              style={[
                styles.activeDot,
                { backgroundColor: service.is_active ? '#4ade80' : `${colors.onSurfaceVariant}40` },
              ]}
            />
            <Text style={[styles.activeText, service.is_active && styles.activeTextOn]}>
              {service.is_active ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        ) : null}
        {isOwner ? (
          <View style={styles.ownerOverlay}>
            <TouchableOpacity style={styles.overlayBtn} onPress={onEdit}>
              <Ionicons name="create-outline" size={16} color="#fff" />
            </TouchableOpacity>
            {confirmDelete ? (
              <TouchableOpacity
                style={[styles.overlayBtn, styles.confirmDeleteBtn]}
                onPress={onDelete}
                disabled={deleting}
              >
                <Text style={styles.confirmDeleteText}>
                  {deleting ? '…' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.overlayBtn}
                onPress={() => setConfirmDelete(true)}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.categoryLine} numberOfLines={1}>
          {service.category} · {spaceName}
        </Text>
        <Text style={styles.name} numberOfLines={2}>{service.service_name}</Text>

        {!offThePlatform ? (
          <View style={styles.priceRow}>
            <View>
              {service.preco_promocional ? (
                <View style={styles.promoRow}>
                  <Text style={styles.promoPrice}>
                    {formatPriceKz(service.preco_promocional)}
                  </Text>
                  <Text style={styles.oldPrice}>{formatPriceKz(service.price)}</Text>
                </View>
              ) : (
                <Text style={styles.price}>{formatPriceKz(service.price)}</Text>
              )}
            </View>
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={13} color={`${colors.onSurfaceVariant}50`} />
              <Text style={styles.duration}>{service.duration_minutes}min</Text>
            </View>
          </View>
        ) : null}

        {service.description ? (
          <Text style={styles.desc} numberOfLines={2}>{service.description}</Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '48%',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
    backgroundColor: colors.surfaceContainer,
  },
  imageWrap: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceContainerHigh,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  activeOn: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  activeOff: {
    backgroundColor: 'rgba(42,42,42,0.8)',
    borderColor: 'rgba(86,67,58,0.2)',
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: {
    fontSize: 9,
    fontWeight: '800',
    color: `${colors.onSurfaceVariant}80`,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  activeTextOn: { color: '#4ade80' },
  ownerOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  overlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteBtn: {
    width: 'auto',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(239,68,68,0.85)',
  },
  confirmDeleteText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  body: { padding: spacing[3] + 2, gap: 4 },
  categoryLine: {
    ...typography.labelSm,
    color: colors.primaryContainer,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  promoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promoPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primaryContainer,
  },
  oldPrice: {
    fontSize: 10,
    color: `${colors.onSurfaceVariant}40`,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.onSurface,
  },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  duration: {
    fontSize: 10,
    color: `${colors.onSurfaceVariant}50`,
  },
  desc: {
    fontSize: 12,
    color: `${colors.onSurfaceVariant}50`,
    lineHeight: 16,
    marginTop: 4,
  },
})
