import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '../ui/Avatar'
import { Spinner } from '../ui/Spinner'
import {
  BookingWithClient,
  updateBookingStatus,
  type BookingStatus,
} from '../../lib/bookings'
import { formatPriceKz } from '../../lib/format'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'accepted', label: 'Aceites' },
  { key: 'rejected', label: 'Recusados' },
  { key: 'completed', label: 'Concluídos' },
  { key: 'cancelled', label: 'Cancelados' },
]

type StatusCfg = { label: string; dotColor: string; badgeBg: string; badgeText: string; badgeBorder: string }

const STATUS: Record<string, StatusCfg> = {
  pending: {
    label: 'Pendente',
    dotColor: '#fbbf24',
    badgeBg: 'rgba(245,158,11,0.1)',
    badgeText: '#fbbf24',
    badgeBorder: 'rgba(245,158,11,0.2)',
  },
  accepted: {
    label: 'Aceite',
    dotColor: '#4ade80',
    badgeBg: 'rgba(34,197,94,0.1)',
    badgeText: '#4ade80',
    badgeBorder: 'rgba(34,197,94,0.2)',
  },
  rejected: {
    label: 'Recusado',
    dotColor: 'rgba(248,113,113,0.6)',
    badgeBg: 'rgba(239,68,68,0.1)',
    badgeText: 'rgba(248,113,113,0.8)',
    badgeBorder: 'rgba(239,68,68,0.2)',
  },
  completed: {
    label: 'Concluído',
    dotColor: '#60a5fa',
    badgeBg: 'rgba(59,130,246,0.1)',
    badgeText: '#60a5fa',
    badgeBorder: 'rgba(59,130,246,0.2)',
  },
  cancelled: {
    label: 'Cancelado',
    dotColor: `${colors.onSurfaceVariant}30`,
    badgeBg: colors.surfaceContainer,
    badgeText: `${colors.onSurfaceVariant}80`,
    badgeBorder: 'rgba(86,67,58,0.12)',
  },
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-').map(Number)
  const date = new Date(y, m - 1, day)
  return `${WEEKDAYS[date.getDay()]}, ${day} ${MONTHS[m - 1]}`
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

function statusCfg(s: string): StatusCfg {
  return STATUS[s] ?? {
    label: s,
    dotColor: `${colors.onSurfaceVariant}30`,
    badgeBg: colors.surfaceContainer,
    badgeText: `${colors.onSurfaceVariant}80`,
    badgeBorder: 'rgba(86,67,58,0.12)',
  }
}

function BookingCard({
  booking,
  onStatusChange,
}: {
  booking: BookingWithClient
  onStatusChange: (id: string, status: string) => void
}) {
  const [loading, setLoading] = useState<'confirm' | 'cancel' | null>(null)
  const cfg = statusCfg(booking.status)
  const clientName = booking.profiles?.full_name ?? 'Cliente'
  const serviceName = booking.professional_services?.service_name ?? '—'
  const clientPhone = booking.profiles?.phone ?? null
  const clientCity = booking.profiles?.profile_location?.city ?? null

  async function update(status: BookingStatus, action: 'confirm' | 'cancel') {
    setLoading(action)
    const result = await updateBookingStatus(booking.id, status)
    if (!result.error) onStatusChange(booking.id, status)
    setLoading(null)
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar
          name={clientName}
          avatarUrl={booking.profiles?.avatar_url}
          size={40}
        />
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
          {clientPhone ? (
            <TouchableOpacity
              style={styles.phoneRow}
              onPress={() => Linking.openURL(`tel:${clientPhone}`)}
            >
              <Ionicons name="call-outline" size={11} color={colors.primaryContainer} />
              <Text style={styles.phoneText}>{clientPhone}</Text>
            </TouchableOpacity>
          ) : clientCity ? (
            <View style={styles.phoneRow}>
              <Ionicons name="location-outline" size={11} color={`${colors.onSurfaceVariant}50`} />
              <Text style={styles.cityText}>{clientCity}</Text>
            </View>
          ) : (
            <Text style={styles.serviceHint} numberOfLines={1}>{serviceName}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.badgeBg, borderColor: cfg.badgeBorder }]}>
          <View style={[styles.statusDot, { backgroundColor: cfg.dotColor }]} />
          <Text style={[styles.statusText, { color: cfg.badgeText }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.metaChip}>
          <Ionicons name="calendar-outline" size={14} color={`${colors.onSurfaceVariant}60`} />
          <Text style={styles.metaText}>{formatDate(booking.booking_date)}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="time-outline" size={14} color={`${colors.onSurfaceVariant}60`} />
          <Text style={styles.metaText}>{formatTime(booking.booking_time)}</Text>
        </View>
        {booking.home ? (
          <View style={styles.metaChip}>
            <Ionicons name="home-outline" size={14} color={colors.primaryContainer} />
            <Text style={[styles.metaText, { color: colors.primaryContainer }]}>Domicílio</Text>
          </View>
        ) : null}
        <Text style={styles.price}>{formatPriceKz(booking.total_price)}</Text>
      </View>

      {booking.description ? (
        <Text style={styles.desc} numberOfLines={2}>{booking.description}</Text>
      ) : null}

      {(booking.status === 'pending' || booking.status === 'accepted') ? (
        <View style={styles.actions}>
          {booking.status === 'pending' ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              disabled={!!loading}
              onPress={() => update('accepted', 'confirm')}
            >
              {loading === 'confirm' ? (
                <Spinner diameter={16} color="#4ade80" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={14} color="#4ade80" />
                  <Text style={[styles.actionText, { color: '#4ade80' }]}>Aceitar</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
          {booking.status === 'accepted' ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn]}
              disabled={!!loading}
              onPress={() => update('completed', 'confirm')}
            >
              {loading === 'confirm' ? (
                <Spinner diameter={16} color="#60a5fa" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={14} color="#60a5fa" />
                  <Text style={[styles.actionText, { color: '#60a5fa' }]}>Concluído</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            disabled={!!loading}
            onPress={() => update('rejected', 'cancel')}
          >
            {loading === 'cancel' ? (
              <Spinner diameter={16} color="#f87171" />
            ) : (
              <>
                <Ionicons name="close" size={14} color="#f87171" />
                <Text style={[styles.actionText, { color: '#f87171' }]}>Recusar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  )
}

type Props = {
  initialBookings: BookingWithClient[]
}

export function SpaceBookingsSection({ initialBookings }: Props) {
  const [bookings, setBookings] = useState(initialBookings)
  const [tab, setTab] = useState('')

  const pending = bookings.filter(b => b.status === 'pending').length
  const filtered = tab ? bookings.filter(b => b.status === tab) : bookings

  function handleStatusChange(id: string, status: string) {
    setBookings(prev => prev.map(b => (b.id === id ? { ...b, status } : b)))
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>
          Agendamentos <Text style={styles.count}>({bookings.length})</Text>
        </Text>
        {pending > 0 ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pending}</Text>
          </View>
        ) : null}
      </View>

      {bookings.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map(t => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} activeOpacity={0.85}>
              {tab === t.key ? (
                <LinearGradient colors={gradientColors} style={styles.tabActive}>
                  <Text style={styles.tabActiveText}>{t.label}</Text>
                  {t.key === 'pending' && pending > 0 ? (
                    <View style={styles.tabPendingDot}>
                      <Text style={styles.tabPendingText}>{pending}</Text>
                    </View>
                  ) : null}
                </LinearGradient>
              ) : (
                <View style={styles.tab}>
                  <Text style={styles.tabText}>{t.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {filtered.length > 0 ? (
        <View style={styles.list}>
          {filtered.map(b => (
            <BookingCard key={b.id} booking={b} onStatusChange={handleStatusChange} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={40} color={`${colors.onSurfaceVariant}20`} />
          <Text style={styles.emptyText}>
            {tab ? 'Nenhum agendamento neste estado' : 'Ainda não tens agendamentos'}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing[4] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  sectionLabel: { ...typography.label, color: `${colors.onSurfaceVariant}40`, letterSpacing: 2 },
  count: { color: `${colors.onSurfaceVariant}25` },
  pendingBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: { fontSize: 9, fontWeight: '900', color: '#000' },
  tabsRow: { gap: spacing[2], paddingBottom: spacing[1] },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.12)',
    backgroundColor: colors.surfaceContainer,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: `${colors.onSurfaceVariant}50`,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  tabActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tabPendingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(251,191,36,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPendingText: { fontSize: 7, fontWeight: '900', color: '#fbbf24' },
  list: { gap: spacing[3] },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    gap: spacing[3],
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
  },
  emptyText: { color: colors.onSurfaceVariant, fontSize: 14 },
  card: {
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(86,67,58,0.08)',
  },
  cardHeaderInfo: { flex: 1, minWidth: 0 },
  clientName: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  phoneText: { fontSize: 10, color: colors.primaryContainer },
  cityText: { fontSize: 10, color: `${colors.onSurfaceVariant}50` },
  serviceHint: { fontSize: 10, color: `${colors.onSurfaceVariant}50`, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  cardBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: `${colors.onSurfaceVariant}99` },
  price: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '900',
    color: colors.onSurface,
  },
  desc: {
    fontSize: 11,
    color: `${colors.onSurfaceVariant}45`,
    lineHeight: 16,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    padding: spacing[4],
    paddingTop: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  acceptBtn: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  completeBtn: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderColor: 'rgba(59,130,246,0.2)',
  },
  rejectBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  actionText: { fontSize: 12, fontWeight: '700' },
})
