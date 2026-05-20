import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '../ui/Avatar'
import { Spinner } from '../ui/Spinner'
import {
  OrderWithProduct,
  updateOrderStatus,
  type OrderStatus,
} from '../../lib/orders'
import { formatPriceKz } from '../../lib/format'
import { colors, spacing, radius, typography } from '../../lib/theme'

const TABS = ['Todos', 'Pendentes', 'Enviados', 'Entregues', 'Cancelados'] as const
type TabKey = (typeof TABS)[number]

const TAB_STATUS: Record<TabKey, string | null> = {
  Todos: null,
  Pendentes: 'pendente',
  Enviados: 'enviada',
  Entregues: 'entregue',
  Cancelados: 'cancelada',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pendente: {
    label: 'Pendente',
    bg: 'rgba(245,158,11,0.1)',
    text: '#fbbf24',
    border: 'rgba(245,158,11,0.2)',
  },
  enviada: {
    label: 'Enviada',
    bg: 'rgba(59,130,246,0.1)',
    text: '#60a5fa',
    border: 'rgba(59,130,246,0.2)',
  },
  entregue: {
    label: 'Entregue',
    bg: 'rgba(34,197,94,0.1)',
    text: '#4ade80',
    border: 'rgba(34,197,94,0.2)',
  },
  cancelada: {
    label: 'Cancelada',
    bg: `${colors.onSurfaceVariant}10`,
    text: `${colors.onSurfaceVariant}80`,
    border: 'rgba(86,67,58,0.2)',
  },
}

const ACTIONS: Record<string, Array<{ label: string; next: OrderStatus; style: object }>> = {
  pendente: [
    {
      label: 'Marcar Enviada',
      next: 'enviada',
      style: { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' },
    },
    {
      label: 'Cancelar',
      next: 'cancelada',
      style: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
    },
  ],
  enviada: [
    {
      label: 'Marcar Entregue',
      next: 'entregue',
      style: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' },
    },
    {
      label: 'Cancelar',
      next: 'cancelada',
      style: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
    },
  ],
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type Props = {
  initialOrders: OrderWithProduct[]
}

export function SpaceOrdersSection({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState<TabKey>('Todos')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered =
    activeTab === 'Todos'
      ? orders
      : orders.filter(o => o.status === TAB_STATUS[activeTab])

  async function handleUpdate(orderId: string, status: OrderStatus) {
    setLoadingId(orderId)
    setError(null)
    const result = await updateOrderStatus(orderId, status)
    if (result.error) {
      setError(result.error)
    } else {
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)))
    }
    setLoadingId(null)
  }

  if (orders.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Pedidos de Produtos</Text>
        <View style={styles.empty}>
          <Ionicons name="bag-outline" size={40} color={`${colors.onSurfaceVariant}20`} />
          <Text style={styles.emptyText}>Ainda não há pedidos de compra</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>
        Pedidos de Produtos <Text style={styles.count}>({orders.length})</Text>
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map(tab => {
          const count =
            tab === 'Todos'
              ? orders.length
              : orders.filter(o => o.status === TAB_STATUS[tab]).length
          const active = activeTab === tab
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {filtered.length === 0 ? (
        <Text style={styles.emptyFilter}>Nenhum pedido nesta categoria</Text>
      ) : (
        <View style={styles.list}>
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pendente
            const actions = ACTIONS[order.status] ?? []
            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.thumb}>
                    {order.products?.image_url ? (
                      <Image
                        source={{ uri: order.products.image_url }}
                        style={styles.thumbImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="cube-outline" size={24} color={`${colors.onSurfaceVariant}30`} />
                    )}
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {order.products?.name ?? 'Produto removido'}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: cfg.bg, borderColor: cfg.border },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={styles.qty}>×{order.quantity}</Text>
                      <Text style={styles.orderPrice}>{formatPriceKz(order.total_price)}</Text>
                      <Text style={styles.orderDate}>{fmtDate(order.created_at)}</Text>
                    </View>
                  </View>
                </View>

                {order.buyer ? (
                  <View style={styles.buyerRow}>
                    <Avatar
                      name={order.buyer.full_name}
                      avatarUrl={order.buyer.avatar_url}
                      size={32}
                    />
                    <View style={styles.buyerInfo}>
                      <Text style={styles.buyerName} numberOfLines={1}>
                        {order.buyer.full_name}
                      </Text>
                      <View style={styles.buyerMeta}>
                        {order.buyer.phone ? (
                          <TouchableOpacity
                            style={styles.buyerChip}
                            onPress={() => Linking.openURL(`tel:${order.buyer!.phone}`)}
                          >
                            <Ionicons name="call-outline" size={11} color={colors.primaryContainer} />
                            <Text style={styles.buyerChipText}>{order.buyer.phone}</Text>
                          </TouchableOpacity>
                        ) : null}
                        {order.buyer.profile_location?.city ? (
                          <View style={styles.buyerChip}>
                            <Ionicons name="location-outline" size={11} color={`${colors.onSurfaceVariant}50`} />
                            <Text style={styles.buyerCity}>
                              {order.buyer.profile_location.city}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ) : null}

                {actions.length > 0 ? (
                  <View style={styles.actions}>
                    {actions.map(action => (
                      <TouchableOpacity
                        key={action.next}
                        style={[styles.actionBtn, action.style]}
                        disabled={loadingId === order.id}
                        onPress={() => handleUpdate(order.id, action.next)}
                      >
                        {loadingId === order.id ? (
                          <Spinner diameter={14} color={colors.onSurfaceVariant} />
                        ) : (
                          <Text style={styles.actionText}>{action.label}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing[4] },
  sectionLabel: { ...typography.label, color: `${colors.onSurfaceVariant}40`, letterSpacing: 2 },
  count: { color: `${colors.onSurfaceVariant}25` },
  tabsRow: { gap: spacing[2] },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: `${colors.primaryContainer}18`,
    borderColor: `${colors.primaryContainer}30`,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: `${colors.onSurfaceVariant}50`,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tabTextActive: { color: colors.primaryContainer },
  error: { fontSize: 12, color: '#f87171', paddingHorizontal: 4 },
  emptyFilter: {
    textAlign: 'center',
    paddingVertical: spacing[8],
    color: `${colors.onSurfaceVariant}40`,
    fontSize: 14,
  },
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
    padding: spacing[4],
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.1)',
    gap: spacing[3],
  },
  cardTop: { flexDirection: 'row', gap: spacing[4] },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  cardInfo: { flex: 1, minWidth: 0 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: 6,
    flexWrap: 'wrap',
  },
  qty: { fontSize: 11, color: `${colors.onSurfaceVariant}50` },
  orderPrice: { fontSize: 14, fontWeight: '900', color: colors.onSurface },
  orderDate: {
    marginLeft: 'auto',
    fontSize: 10,
    color: `${colors.onSurfaceVariant}35`,
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(86,67,58,0.08)',
  },
  buyerInfo: { flex: 1, minWidth: 0 },
  buyerName: { fontSize: 12, fontWeight: '600', color: colors.onSurface },
  buyerMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginTop: 2 },
  buyerChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  buyerChipText: { fontSize: 10, color: colors.primaryContainer },
  buyerCity: { fontSize: 10, color: `${colors.onSurfaceVariant}50` },
  actions: { flexDirection: 'row', gap: spacing[2] },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
})
