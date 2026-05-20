import React, { useEffect, useMemo, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '../ui/Avatar'
import { Spinner } from '../ui/Spinner'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import {
  PostComment, fetchComments, createComment, deleteComment,
} from '../../lib/comments'
import { colors, spacing, radius } from '../../lib/theme'
import { getTimeAgo } from '../../lib/time'

type Props = {
  postId: string
  currentUserId?: string
  onCountChange?: (count: number) => void
}

function firstName(name?: string) {
  return (name ?? '').trim().split(/\s+/)[0] ?? ''
}

function CommentComposer({
  postId,
  parentId,
  initialContent = '',
  placeholder,
  onSubmitted,
  onCancel,
}: {
  postId: string
  parentId?: string | null
  initialContent?: string
  placeholder: string
  onSubmitted: (c: PostComment, count: number) => void
  onCancel?: () => void
}) {
  const [content, setContent] = useState(initialContent)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const trimmed = content.trim()
    if (!trimmed || posting) return
    setPosting(true)
    setError(null)
    try {
      const { comment, comments_count } = await createComment(postId, trimmed, parentId)
      setContent('')
      onSubmitted(comment, comments_count)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao publicar')
    } finally {
      setPosting(false)
    }
  }

  return (
    <View style={composer.wrap}>
      <View style={composer.row}>
        <TextInput
          style={composer.input}
          value={content}
          onChangeText={setContent}
          placeholder={placeholder}
          placeholderTextColor="#52525b"
          multiline
          maxLength={500}
          editable={!posting}
        />
        {onCancel && (
          <TouchableOpacity onPress={onCancel} disabled={posting}>
            <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={submit} disabled={!content.trim() || posting}>
          {posting ? (
            <Spinner diameter={18} color={colors.primaryContainer} />
          ) : (
            <Ionicons name="send" size={20} color={colors.primaryContainer} />
          )}
        </TouchableOpacity>
      </View>
      {error && <Text style={composer.error}>{error}</Text>}
      <Text style={composer.count}>{content.length}/500</Text>
    </View>
  )
}

function CommentItem({
  comment,
  replies,
  postId,
  currentUserId,
  onReply,
  onDelete,
  isReply,
  onRequestReply,
}: {
  comment: PostComment
  replies: PostComment[]
  postId: string
  currentUserId?: string
  onReply: (c: PostComment, count: number) => void
  onDelete: (id: string) => void
  isReply?: boolean
  onRequestReply?: (mention: string) => void
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [mention, setMention] = useState('')
  const isOwner = currentUserId === comment.user_id

  function handleReplyPress() {
    const prefilled = isReply && comment.user?.full_name
      ? `@${firstName(comment.user.full_name)} `
      : ''
    if (isReply && onRequestReply) onRequestReply(prefilled)
    else { setMention(prefilled); setReplyOpen(true) }
  }

  return (
    <View style={item.row}>
      <Avatar name={comment.user?.full_name ?? 'User'} avatarUrl={comment.user?.avatar_url} size={isReply ? 28 : 36} />
      <View style={item.body}>
        <View style={item.bubble}>
          <View style={item.bubbleHeader}>
            <Text style={[item.name, isReply && item.nameSm]} numberOfLines={1}>
              {comment.user?.full_name ?? 'Anonymous'}
            </Text>
            {isOwner && (
              <TouchableOpacity onPress={() => onDelete(comment.id)}>
                <Ionicons name="trash-outline" size={14} color={`${colors.onSurfaceVariant}50`} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[item.content, isReply && item.contentSm]}>{comment.content}</Text>
        </View>
        <View style={item.meta}>
          <Text style={item.time}>{getTimeAgo(comment.created_at)}</Text>
          {currentUserId && (
            <TouchableOpacity onPress={handleReplyPress}>
              <Text style={item.replyBtn}>Responder</Text>
            </TouchableOpacity>
          )}
        </View>
        {!isReply && replies.length > 0 && (
          <View style={item.replies}>
            {replies.map(r => (
              <CommentItem
                key={r.id}
                comment={r}
                replies={[]}
                postId={postId}
                currentUserId={currentUserId}
                onReply={onReply}
                onDelete={onDelete}
                isReply
                onRequestReply={pref => { setMention(pref); setReplyOpen(true) }}
              />
            ))}
          </View>
        )}
        {!isReply && replyOpen && currentUserId && (
          <View style={item.replyComposer}>
            <CommentComposer
              postId={postId}
              parentId={comment.id}
              initialContent={mention}
              placeholder="Escreve uma resposta..."
              onSubmitted={(c, count) => { onReply(c, count); setReplyOpen(false); setMention('') }}
              onCancel={() => { setReplyOpen(false); setMention('') }}
            />
          </View>
        )}
      </View>
    </View>
  )
}

export function CommentsSection({ postId, currentUserId, onCountChange }: Props) {
  const [comments, setComments] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchComments(postId).then(setComments).finally(() => setLoading(false))
  }, [postId])

  const { topLevel, repliesByParent } = useMemo(() => {
    const top: PostComment[] = []
    const map: Record<string, PostComment[]> = {}
    for (const c of comments) {
      if (c.parent_id) {
        (map[c.parent_id] = map[c.parent_id] ?? []).push(c)
      } else {
        top.push(c)
      }
    }
    return { topLevel: top, repliesByParent: map }
  }, [comments])

  function handleNew(comment: PostComment, count: number) {
    setComments(prev => [...prev, comment])
    onCountChange?.(count)
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const count = await deleteComment(postId, deleteId)
      setComments(prev => prev.filter(c => c.id !== deleteId && c.parent_id !== deleteId))
      onCountChange?.(count)
      setDeleteId(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Erro ao apagar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.list}>
        {loading ? (
          <Spinner diameter={24} color={colors.primaryContainer} />
        ) : topLevel.length === 0 ? (
          <Text style={styles.empty}>Sê o primeiro a comentar</Text>
        ) : (
          topLevel.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={repliesByParent[c.id] ?? []}
              postId={postId}
              currentUserId={currentUserId}
              onReply={handleNew}
              onDelete={setDeleteId}
            />
          ))
        )}
      </View>
      {currentUserId && (
        <View style={styles.composerWrap}>
          <CommentComposer
            postId={postId}
            placeholder="Escreve um comentário..."
            onSubmitted={handleNew}
          />
        </View>
      )}
      <ConfirmDialog
        visible={!!deleteId}
        onClose={() => !deleting && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Apagar comentário?"
        message="Esta ação não pode ser desfeita. As respostas também serão removidas."
        confirmLabel="Apagar"
        variant="danger"
        icon="trash-outline"
        loading={deleting}
        error={deleteError}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(86,67,58,0.1)',
    backgroundColor: 'rgba(42,42,42,0.25)',
  },
  list: { padding: spacing[5], gap: spacing[5] },
  empty: {
    textAlign: 'center',
    color: `${colors.onSurfaceVariant}40`,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingVertical: spacing[4],
  },
  composerWrap: { paddingHorizontal: spacing[5], paddingBottom: spacing[5] },
})

const composer = StyleSheet.create({
  wrap: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  input: { flex: 1, color: colors.onSurface, fontSize: 14, maxHeight: 100, paddingVertical: 8 },
  error: { color: colors.error, fontSize: 11 },
  count: { fontSize: 10, color: `${colors.onSurfaceVariant}30`, textAlign: 'right' },
})

const item = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' },
  body: { flex: 1 },
  bubble: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius['2xl'],
    borderTopLeftRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  bubbleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 13, fontWeight: '700', color: colors.onSurface, flex: 1 },
  nameSm: { fontSize: 11 },
  content: { fontSize: 14, color: `${colors.onSurface}e6`, lineHeight: 20 },
  contentSm: { fontSize: 12 },
  meta: { flexDirection: 'row', gap: spacing[3], marginTop: 4, paddingHorizontal: 4 },
  time: { fontSize: 10, color: `${colors.onSurfaceVariant}40`, textTransform: 'uppercase', letterSpacing: 0.5 },
  replyBtn: { fontSize: 10, fontWeight: '700', color: `${colors.onSurfaceVariant}60`, textTransform: 'uppercase', letterSpacing: 0.5 },
  replies: { marginTop: spacing[3], gap: spacing[3] },
  replyComposer: { marginTop: spacing[3] },
})
