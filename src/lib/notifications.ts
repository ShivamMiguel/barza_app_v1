import { supabase } from './supabase'

export type NotificationType = 'booking' | 'reminder' | 'message' | 'promotion' | 'rating' | 'system'

export type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export async function getNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as Notification[]
}

export async function markAsRead(notificationId: string, userId: string) {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
}

export async function markAllAsRead(userId: string) {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
}

export async function deleteNotification(notificationId: string, userId: string) {
  await supabase.from('notifications').delete().eq('id', notificationId).eq('user_id', userId)
}

export async function deleteAllNotifications(userId: string) {
  await supabase.from('notifications').delete().eq('user_id', userId)
}
