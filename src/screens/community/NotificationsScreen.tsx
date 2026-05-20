import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNotifications, Notification } from '../../hooks/useNotifications'
import { NotificationType } from '../../lib/notifications'
import { Spinner } from '../../components/ui/Spinner'
import { colors, spacing, radius, typography } from '../../lib/theme'

const TYPE_META: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; colour: string; bg: string }> = {
  booking: { icon: 'calendar', colour: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
  message: { icon: 'chatbubble', colour: '#c084fc', bg: 'rgba(168,85,247,0.1)' },
  rating: { icon: 'star', colour: '#facc15', bg: 'rgba(234,179,8,0.1)' },
  promotion: { icon: 'pricetag', colour: '#4ade80', bg: 'rgba(34,197,94,0.1)' },
  reminder: { icon: 'alarm', colour: '#fb923c', bg: 'rgba(249,115,22,0.1)' },
  system: { icon: 'information-circle', colour: '#a1a1aa', bg: 'rgba(161,161,170,0.1)' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'agora mesmo'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('pt-AO', { day: 'numeric', month: 'short' })
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const meta = TYPE_META[notification.type] ?? TYPE_META.system

  return (
    <View style={[styles.item, notification.is_read ? styles.itemRead : styles.itemUnread]}>
      <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={20} color={meta.colour} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <Text style={[styles.itemTitle, notification.is_read && styles.itemTitleRead]} numberOfLines={2}>
            {notification.title}
          </Text>
          <Text style={styles.itemTime}>{timeAgo(notification.created_at)}</Text>
        </View>
        <Text style={styles.itemMessage}>{notification.message}</Text>
        <View style={styles.itemActions}>
          {!notification.is_read && (
            <TouchableOpacity onPress={() => onMarkRead(notification.id)}>
              <Text style={styles.markRead}>Marcar como lida</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onDelete(notification.id)}>
            <Text style={styles.deleteBtn}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!notification.is_read && <View style={styles.unreadDot} />}
    </View>
  )
}

type Filter = 'all' | 'unread'

export function NotificationsScreen() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, deleteAll } =
    useNotifications()
  const [filter, setFilter] = useState<Filter>('all')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const visible = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications

  async function handleDeleteAll() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deleteAll()
    setConfirmDelete(false)
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notificações</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>
              {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Marcar todas</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleDeleteAll}
              style={[styles.headerBtn, confirmDelete && styles.headerBtnDanger]}
            >
              <Text style={[styles.headerBtnText, confirmDelete && styles.headerBtnDangerText]}>
                {confirmDelete ? 'Confirmar' : 'Apagar todas'}
              </Text>
            </TouchableOpacity>
          )}
          {confirmDelete && (
            <TouchableOpacity onPress={() => setConfirmDelete(false)} style={styles.headerBtn}>
              <Text style={styles.headerBtnMuted}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filters}>
        {(['all', 'unread'] as Filter[]).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Todas' : `Não lidas${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Spinner diameter={36} color={colors.primaryContainer} />
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={48} color={`${colors.onSurfaceVariant}30`} />
          <Text style={styles.emptyText}>
            {filter === 'unread' ? 'Nenhuma notificação por ler' : 'Sem notificações'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={n => n.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <NotificationItem notification={item} onMarkRead={markAsRead} onDelete={deleteNotification} />
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: spacing[3],
  },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -1, color: colors.onSurface },
  subtitle: { fontSize: 12, color: `${colors.onSurfaceVariant}80`, marginTop: 2 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.lg },
  headerBtnDanger: { backgroundColor: colors.errorContainer },
  headerBtnText: { ...typography.label, color: colors.primaryContainer },
  headerBtnDangerText: { color: colors.onSurface },
  headerBtnMuted: { ...typography.label, color: `${colors.onSurfaceVariant}60` },
  filters: {
    flexDirection: 'row',
    gap: 4,
    margin: spacing[4],
    padding: 4,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    alignSelf: 'flex-start',
  },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.lg },
  filterBtnActive: { backgroundColor: 'rgba(255,145,86,0.2)' },
  filterText: { ...typography.label, color: `${colors.onSurfaceVariant}60` },
  filterTextActive: { color: colors.primaryContainer },
  list: { padding: spacing[4], gap: spacing[3] },
  item: {
    flexDirection: 'row',
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: radius['2xl'],
    borderWidth: 1,
  },
  itemRead: { borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'transparent' },
  itemUnread: { borderColor: 'rgba(255,145,86,0.2)', backgroundColor: 'rgba(255,145,86,0.05)' },
  iconBox: { width: 40, height: 40, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.onSurface },
  itemTitleRead: { color: `${colors.onSurface}B3` },
  itemTime: { ...typography.label, fontSize: 10, color: `${colors.onSurfaceVariant}60` },
  itemMessage: { fontSize: 12, color: `${colors.onSurfaceVariant}99`, marginTop: 4, lineHeight: 18 },
  itemActions: { flexDirection: 'row', gap: spacing[3], marginTop: 8 },
  markRead: { ...typography.label, color: colors.primaryContainer },
  deleteBtn: { ...typography.label, color: `${colors.onSurfaceVariant}50` },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryContainer, marginTop: 6 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[10] },
  emptyText: { ...typography.label, color: `${colors.onSurfaceVariant}60` },
})
