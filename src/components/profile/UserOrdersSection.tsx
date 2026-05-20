import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native'
import { OrderWithProduct, cancelOrder, getOrdersByUser } from '../../lib/orders'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Spinner } from '../ui/Spinner'
import { colors, spacing, radius, typography } from '../../lib/theme'

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  enviada: 'Enviada',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
}

const TABS = ['Todos', 'Pendentes', 'Enviados', 'Entregues', 'Cancelados'] as const
const TAB_STATUS: Record<string, string | null> = {
  Todos: null, Pendentes: 'pendente', Enviados: 'enviada', Entregues: 'entregue', Cancelados: 'cancelada',
}

type Props = { userId: string }

export function UserOrdersSection({ userId }: Props) {
  const [orders, setOrders] = useState<OrderWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Todos')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getOrdersByUser(userId).then(setOrders).finally(() => setLoading(false))
  }, [userId])

  const filtered = activeTab === 'Todos'
    ? orders
    : orders.filter(o => o.status === TAB_STATUS[activeTab])

  async function confirmCancel() {
    if (!cancelId) return
    setCancelling(true)
    setError(null)
    const ok = await cancelOrder(cancelId)
    if (!ok) setError('Erro ao cancelar pedido.')
    else setOrders(prev => prev.map(o => o.id === cancelId ? { ...o, status: 'cancelada' } : o))
    setCancelling(false)
    setCancelId(null)
  }

  if (loading) return <Spinner diameter={24} color={colors.primaryContainer} />

  if (orders.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>Ainda não fizeste nenhuma compra</Text>
      </View>
    )
  }

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {TABS.map(tab => {
          const count = tab === 'Todos' ? orders.length : orders.filter(o => o.status === TAB_STATUS[tab]).length
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <View style={styles.list}>
        {filtered.map(order => (
          <View key={order.id} style={styles.card}>
            <View style={styles.thumb}>
              {order.products?.image_url ? (
                <Image source={{ uri: order.products.image_url }} style={styles.thumbImg} />
              ) : null}
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{order.products?.name ?? 'Produto'}</Text>
              <Text style={styles.space} numberOfLines={1}>{order.professional_space?.space_name}</Text>
              <Text style={styles.meta}>x{order.quantity} · {STATUS_LABELS[order.status] ?? order.status}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.price}>{order.total_price.toLocaleString('pt-AO')} Kz</Text>
              {order.status === 'pendente' && (
                <TouchableOpacity onPress={() => setCancelId(order.id)}>
                  <Text style={styles.cancel}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <ConfirmDialog
        visible={!!cancelId}
        onClose={() => !cancelling && setCancelId(null)}
        onConfirm={confirmCancel}
        title="Cancelar pedido?"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Cancelar pedido"
        variant="danger"
        icon="bag-remove-outline"
        loading={cancelling}
        error={error}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  tabs: { marginBottom: spacing[3] },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  tabActive: { backgroundColor: 'rgba(255,145,86,0.12)', borderColor: 'rgba(255,145,86,0.25)' },
  tabText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: `${colors.onSurfaceVariant}50` },
  tabTextActive: { color: colors.primaryContainer },
  list: { gap: spacing[3] },
  card: { flexDirection: 'row', gap: spacing[3], padding: spacing[4], backgroundColor: colors.surfaceContainer, borderRadius: radius['2xl'], borderWidth: 1, borderColor: 'rgba(86,67,58,0.1)' },
  thumb: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerHigh, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  space: { fontSize: 11, color: `${colors.onSurfaceVariant}70` },
  meta: { fontSize: 11, color: `${colors.onSurfaceVariant}50` },
  right: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 13, fontWeight: '800', color: colors.primaryContainer },
  cancel: { fontSize: 11, color: colors.error },
  emptyBox: { padding: spacing[8], alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: radius['3xl'] },
  emptyText: { ...typography.label, color: `${colors.onSurfaceVariant}50` },
})
