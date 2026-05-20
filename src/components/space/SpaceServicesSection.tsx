import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { ProfessionalSpace, ProfessionalService, deleteService } from '../../lib/spaces'
import { ServiceModal } from '../modals/ServiceModal'
import { SpaceServiceCard } from './SpaceServiceCard'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'

type Props = {
  space: ProfessionalSpace
  initialServices: ProfessionalService[]
  isOwner: boolean
  offThePlatform: boolean
}

export function SpaceServicesSection({
  space,
  initialServices,
  isOwner,
  offThePlatform,
}: Props) {
  const [services, setServices] = useState(initialServices)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<ProfessionalService | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteService(id)
      setServices(prev => prev.filter(s => s.id !== id))
    } catch { /* ignore */ }
    setDeletingId(null)
  }

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            Serviços <Text style={styles.count}>({services.length})</Text>
          </Text>
          {isOwner ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => { setEditingService(null); setModalOpen(true) }}
            >
              <Ionicons name="add" size={14} color={colors.primaryContainer} />
              <Text style={styles.addBtnText}>Adicionar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {services.length > 0 ? (
          <View style={styles.grid}>
            {services.map(svc => (
              <SpaceServiceCard
                key={svc.id}
                service={svc}
                spaceName={space.space_name}
                isOwner={isOwner}
                offThePlatform={offThePlatform}
                onEdit={() => { setEditingService(svc); setModalOpen(true) }}
                onDelete={() => handleDelete(svc.id)}
                deleting={deletingId === svc.id}
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="cut-outline" size={40} color={`${colors.onSurfaceVariant}20`} />
            <Text style={styles.emptyText}>
              {isOwner ? 'Ainda não tens serviços' : 'Nenhum serviço publicado'}
            </Text>
            {isOwner ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => { setEditingService(null); setModalOpen(true) }}
              >
                <LinearGradient colors={gradientColors} style={styles.createBtn}>
                  <Ionicons name="add" size={14} color={colors.onPrimary} />
                  <Text style={styles.createBtnText}>Criar Serviço</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      {isOwner ? (
        <ServiceModal
          visible={modalOpen}
          onClose={() => setModalOpen(false)}
          space={space}
          service={editingService}
          onSaved={svc => {
            setServices(prev => {
              const idx = prev.findIndex(s => s.id === svc.id)
              if (idx >= 0) {
                const next = [...prev]
                next[idx] = svc
                return next
              }
              return [svc, ...prev]
            })
          }}
        />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing[5] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    ...typography.label,
    color: `${colors.onSurfaceVariant}40`,
    letterSpacing: 2,
  },
  count: { color: `${colors.onSurfaceVariant}25` },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryContainer,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    justifyContent: 'space-between',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    gap: spacing[3],
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[6],
    paddingVertical: 10,
    borderRadius: radius.full,
    marginTop: spacing[2],
  },
  createBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
