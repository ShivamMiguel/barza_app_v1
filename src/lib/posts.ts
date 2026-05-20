import { supabase } from './supabase'

export async function togglePostLike(postId: string): Promise<{ liked: boolean; likes_count: number }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  let liked: boolean
  if (existing) {
    const { error } = await supabase.from('post_likes').delete().eq('id', existing.id)
    if (error) throw new Error(error.message)
    liked = false
  } else {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
    if (error) throw new Error(error.message)
    liked = true
  }

  const { count } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  const likes_count = count ?? 0
  await supabase.from('posts').update({ likes_count }).eq('id', postId)

  return { liked, likes_count }
}
