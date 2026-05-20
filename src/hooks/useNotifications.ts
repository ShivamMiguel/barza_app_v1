import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  getNotifications,
  markAsRead as markReadDb,
  markAllAsRead as markAllDb,
  deleteNotification as deleteDb,
  deleteAllNotifications,
  type Notification,
} from '../lib/notifications'

export type { Notification }

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null
      setUserId(id)
      if (!id) setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    getNotifications(userId)
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications:${userId}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n)),
            )
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== (payload.old as { id: string }).id))
          }
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications])

  const markAsRead = useCallback(async (id: string) => {
    if (!userId) return
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)))
    await markReadDb(id, userId)
  }, [userId])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await markAllDb(userId)
  }, [userId])

  const deleteNotification = useCallback(async (id: string) => {
    if (!userId) return
    setNotifications(prev => prev.filter(n => n.id !== id))
    await deleteDb(id, userId)
  }, [userId])

  const deleteAll = useCallback(async () => {
    if (!userId) return
    setNotifications([])
    await deleteAllNotifications(userId)
  }, [userId])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, deleteAll }
}
