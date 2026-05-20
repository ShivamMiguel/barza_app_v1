import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BookingWithSpace, cancelBooking, getBookingsByUser } from '../../lib/bookings'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Spinner } from '../ui/Spinner'
import { colors, spacing, radius, typography } from '../../lib/theme'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  rejected: 'Cancelado',
}

type Props = { userId: string }

export function UserBookingsSection({ userId }: Props) {
  const [bookings, setBookings] = useState<BookingWithSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    getBookingsByUser(userId).then(setBookings).finally(() => setLoading(false))
  }, [userId])

  async function confirmCancel() {
    if (!cancelId) return
    setCancelling(true)
    const ok = await cancelBooking(cancelId)
    if (ok) setBookings(prev => prev.map(b => b.id === cancelId ? { ...b, status: 'rejected' } : b))
    setCancelling(false)
    setCancelId(null)
  }

  if (loading) return <Spinner diameter={24} color={colors.primaryContainer} />

  if (bookings.length === 0) {
    return <Text style={styles.empty}>Sem reservas ainda</Text>
  }

  return (
    <View style={styles.list}>
      {bookings.slice(0, 8).map(b => (
        <View key={b.id} style={styles.card}>
          <View style={styles.logo}>
            {b.professional_space?.logo ? (
              <Image source={{ uri: b.professional_space.logo }} style={styles.logoImg} />
            ) : (
              <Ionicons name="storefront-outline" size={20} color={`${colors.onSurfaceVariant}40`} />
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{b.professional_services?.service_name ?? 'Serviço'}</Text>
            <Text style={styles.space} numberOfLines={1}>{b.professional_space?.space_name}</Text>
            <Text style={styles.date}>{b.booking_date} · {b.booking_time?.slice(0, 5)}</Text>
            <Text style={styles.status}>{STATUS_LABELS[b.status] ?? b.status}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.price}>{b.total_price.toLocaleString('pt-AO')} Kz</Text>
            {b.status === 'pending' && (
              <TouchableOpacity onPress={() => setCancelId(b.id)}>
                <Text style={styles.cancel}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <ConfirmDialog
        visible={!!cancelId}
        onClose={() => !cancelling && setCancelId(null)}
        onConfirm={confirmCancel}
        title="Cancelar reserva?"
        message="A reserva será marcada como cancelada."
        confirmLabel="Cancelar reserva"
        variant="danger"
        icon="calendar-outline"
        loading={cancelling}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: spacing[3] },
  card: { flexDirection: 'row', gap: spacing[3], padding: spacing[4], backgroundColor: colors.surfaceContainer, borderRadius: radius['2xl'], borderWidth: 1, borderColor: 'rgba(86,67,58,0.1)' },
  logo: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: '100%', height: '100%' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  space: { fontSize: 11, color: `${colors.onSurfaceVariant}70` },
  date: { fontSize: 11, color: `${colors.onSurfaceVariant}50` },
  status: { ...typography.label, fontSize: 9, color: colors.primaryContainer, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 13, fontWeight: '800', color: colors.primaryContainer },
  cancel: { fontSize: 11, color: colors.error },
  empty: { ...typography.label, color: `${colors.onSurfaceVariant}50` },
})
