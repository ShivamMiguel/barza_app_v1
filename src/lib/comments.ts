import { supabase } from './supabase'

export type PostComment = {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string
    avatar_url?: string | null
    profession?: string | null
  }
}

const SELECT = `
  id, post_id, user_id, parent_id, content, created_at, updated_at,
  user:profiles(id, full_name, avatar_url, profession:role_profile)
`

function normalizeComment(raw: Record<string, unknown>): PostComment {
  const u = raw.user
  const user = Array.isArray(u) ? u[0] : u
  return { ...raw, user } as PostComment
}

export async function fetchComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select(SELECT)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) return []
  return (data ?? []).map((c: Record<string, unknown>) => normalizeComment(c))
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string | null,
): Promise<{ comment: PostComment; comments_count: number }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  let resolvedParentId: string | null = null
  if (parentId) {
    const { data: parent } = await supabase
      .from('post_comments')
      .select('id, parent_id, post_id')
      .eq('id', parentId)
      .single()
    if (!parent || parent.post_id !== postId) throw new Error('Comentário inválido')
    resolvedParentId = parent.parent_id ?? parent.id
  }

  const { data: comment, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
      parent_id: resolvedParentId,
    })
    .select(SELECT)
    .single()

  if (error || !comment) throw new Error(error?.message ?? 'Erro ao publicar')

  const comments_count = await syncCommentsCount(postId)
  return { comment: normalizeComment(comment as Record<string, unknown>), comments_count }
}

export async function deleteComment(
  postId: string,
  commentId: string,
): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  return syncCommentsCount(postId)
}

async function syncCommentsCount(postId: string): Promise<number> {
  const { count } = await supabase
    .from('post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  const commentsCount = count ?? 0
  await supabase.from('posts').update({ comments_count: commentsCount }).eq('id', postId)
  return commentsCount
}
