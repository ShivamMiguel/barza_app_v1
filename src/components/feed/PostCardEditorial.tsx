import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '../ui/Avatar'
import { Spinner } from '../ui/Spinner'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { supabase, PostWithUser } from '../../lib/supabase'
import { togglePostLike } from '../../lib/posts'
import { isVideoUrl } from '../../lib/media'
import { getPostShareUrl } from '../../lib/share'
import { CommentsSection } from './CommentsSection'
import { FollowButton } from './FollowButton'
import { InlineVideo } from './InlineVideo'
import { ShareModal } from './ShareModal'
import { colors, spacing, radius, typography } from '../../lib/theme'
import { getTimeAgo } from '../../lib/time'

interface Props {
  post: PostWithUser
  currentUserId?: string
  onDelete?: (postId: string) => void
  onUpdate?: (post: PostWithUser) => void
}

export function PostCardEditorial({ post, currentUserId, onDelete, onUpdate }: Props) {
  const isOwner = currentUserId === post.user_id
  const [liked, setLiked] = useState(post.liked_by_me ?? false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [isToggling, setIsToggling] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [content, setContent] = useState(post.content)
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const lines = content.split('\n').filter(Boolean)
  const title = lines[0] ?? ''
  const body = lines.slice(1).join('\n')
  const timeAgo = getTimeAgo(post.created_at)

  async function handleLike() {
    if (isToggling) return
    const wasLiked = liked
    const prevCount = likesCount
    setLiked(!wasLiked)
    setLikesCount(Math.max(0, prevCount + (wasLiked ? -1 : 1)))
    setIsToggling(true)
    try {
      const result = await togglePostLike(post.id)
      setLiked(result.liked)
      setLikesCount(result.likes_count)
    } catch {
      setLiked(wasLiked)
      setLikesCount(prevCount)
    } finally {
      setIsToggling(false)
    }
  }

  async function saveEdit() {
    const trimmed = editContent.trim()
    if (!trimmed) { setEditError('O conteúdo não pode estar vazio.'); return }
    if (trimmed === content) { setIsEditing(false); return }
    setIsSaving(true)
    setEditError(null)
    const { data, error } = await supabase
      .from('posts')
      .update({ content: trimmed })
      .eq('id', post.id)
      .select()
      .single()
    if (error) {
      setEditError('Erro ao guardar as alterações.')
      setIsSaving(false)
      return
    }
    setContent(trimmed)
    setIsEditing(false)
    setIsSaving(false)
    onUpdate?.({ ...post, content: trimmed })
  }

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (error) {
      setDeleteError('Não foi possível eliminar o post. Tenta novamente.')
      setIsDeleting(false)
      return
    }
    setConfirmDelete(false)
    onDelete?.(post.id)
  }

  const shareImageUrl =
    post.image_url && !isVideoUrl(post.image_url) ? post.image_url : undefined

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userRow}>
          <View style={styles.avatarWrapper}>
            <Avatar name={post.user?.full_name || 'User'} avatarUrl={post.user?.avatar_url} size={44} />
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{post.user?.full_name || 'Anonymous'}</Text>
              {post.user?.profession && (
                <View style={styles.profBadge}>
                  <Text style={styles.profBadgeText}>{post.user.profession}</Text>
                </View>
              )}
            </View>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {!isOwner && currentUserId && <FollowButton userId={post.user_id} compact />}
          {isOwner && (
            <TouchableOpacity onPress={() => setMenuOpen(o => !o)} style={styles.menuBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color={`${colors.onSurfaceVariant}80`} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Owner menu */}
      {isOwner && menuOpen && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setEditContent(content); setIsEditing(true); setMenuOpen(false) }}
          >
            <Ionicons name="create-outline" size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.menuItemText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setMenuOpen(false); setConfirmDelete(true) }}
          >
            <Ionicons name="trash-outline" size={16} color="#ff4757" />
            <Text style={[styles.menuItemText, { color: '#ff4757' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <View style={styles.body}>
        {isEditing ? (
          <View style={styles.editBlock}>
            <TextInput
              style={styles.editInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              maxLength={1000}
              editable={!isSaving}
              autoFocus
            />
            {editError && <Text style={styles.editError}>{editError}</Text>}
            <View style={styles.editActions}>
              <Text style={styles.charCount}>{editContent.length}/1000</Text>
              <View style={styles.editBtns}>
                <TouchableOpacity
                  onPress={() => { setEditContent(content); setIsEditing(false) }}
                  style={styles.cancelBtn}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveEdit}
                  style={styles.saveBtn}
                  disabled={isSaving || !editContent.trim()}
                >
                  {isSaving
                    ? <Spinner color={colors.onPrimary} />
                    : <Text style={styles.saveBtnText}>Guardar</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.postTitle}>{title}</Text>
            {body ? <Text style={styles.postBody}>{body}</Text> : null}
            {post.image_url ? (
              <View style={styles.imageWrapper}>
                {isVideoUrl(post.image_url) ? (
                  <InlineVideo url={post.image_url} />
                ) : (
                  <Image
                    source={{ uri: post.image_url }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <TouchableOpacity
            onPress={handleLike}
            disabled={isToggling}
            style={styles.actionBtn}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? '#ff4757' : colors.onSurfaceVariant}
            />
            <Text style={[styles.actionCount, liked && { color: '#ff4757' }]}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCommentsOpen(o => !o)}
            style={styles.actionBtn}
          >
            <Ionicons
              name={commentsOpen ? 'chatbubble' : 'chatbubble-outline'}
              size={20}
              color={commentsOpen ? colors.primaryContainer : colors.onSurfaceVariant}
            />
            <Text style={styles.actionCount}>{commentsCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShareOpen(true)}>
            <Ionicons name="share-outline" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {commentsOpen && (
        <CommentsSection
          postId={post.id}
          currentUserId={currentUserId}
          onCountChange={setCommentsCount}
        />
      )}

      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={title.replace(/\*\*/g, '')}
        description={body || undefined}
        imageUrl={shareImageUrl}
        shareUrl={getPostShareUrl(post.id)}
        authorName={post.user?.full_name ?? undefined}
        authorAvatarUrl={post.user?.avatar_url ?? undefined}
        category={post.user?.profession ?? undefined}
      />

      <ConfirmDialog
        visible={confirmDelete}
        onClose={() => !isDeleting && setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar post?"
        message="Esta acção não pode ser desfeita. O post e todos os comentários serão removidos permanentemente."
        confirmLabel="Eliminar"
        variant="danger"
        icon="trash-outline"
        loading={isDeleting}
        error={deleteError}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1209',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[5],
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,145,86,0.2)',
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userName: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '700',
  },
  profBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  profBadgeText: {
    ...typography.labelSm,
    color: colors.onSecondaryContainer,
  },
  timeAgo: {
    ...typography.labelSm,
    color: `${colors.onSurfaceVariant}60`,
    letterSpacing: 1,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  menuBtn: { padding: 4 },
  menu: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
    backgroundColor: '#1a120a',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,145,86,0.15)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
  },
  menuItemText: {
    color: colors.onSurface,
    fontSize: 14,
  },
  body: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    gap: spacing[3],
  },
  postTitle: {
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 28,
  },
  postBody: {
    color: `${colors.onSurfaceVariant}e0`,
    fontSize: 15,
    lineHeight: 22,
  },
  imageWrapper: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,145,86,0.15)',
    marginTop: spacing[2],
  },
  postImage: {
    width: '100%',
    height: 280,
  },
  editBlock: {
    gap: spacing[3],
  },
  editInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,145,86,0.2)',
    borderRadius: radius['2xl'],
    padding: spacing[4],
    color: colors.onSurface,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editError: {
    color: '#ff4757',
    fontSize: 12,
    backgroundColor: 'rgba(255,71,87,0.08)',
    borderRadius: radius.xl,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.2)',
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCount: {
    color: `${colors.onSurfaceVariant}60`,
    fontSize: 10,
    fontWeight: '600',
  },
  editBtns: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  cancelBtnText: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnText: {
    ...typography.label,
    color: colors.onPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: 14,
    backgroundColor: 'rgba(42,42,42,0.4)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(86,67,58,0.1)',
  },
  footerLeft: {
    flexDirection: 'row',
    gap: spacing[5],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
})
