import { supabase } from './supabase'

export type FollowSummary = {
  followers: number
  following: number
  is_following: boolean | null
}

export async function getFollowSummary(
  targetUserId: string,
  callerId: string | null,
): Promise<FollowSummary> {
  const [followersRes, followingRes] = await Promise.all([
    supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('followed_id', targetUserId),
    supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId),
  ])

  let is_following: boolean | null = null
  if (callerId && callerId !== targetUserId) {
    const { data } = await supabase
      .from('user_follows')
      .select('follower_id')
      .eq('follower_id', callerId)
      .eq('followed_id', targetUserId)
      .maybeSingle()
    is_following = !!data
  }

  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
    is_following,
  }
}

export async function followUser(followerId: string, followedId: string): Promise<FollowSummary> {
  if (followerId === followedId) throw new Error('Não podes seguir-te a ti próprio.')
  const { error } = await supabase
    .from('user_follows')
    .insert({ follower_id: followerId, followed_id: followedId })
  if (error && error.code !== '23505') throw new Error(error.message)
  return getFollowSummary(followedId, followerId)
}

export async function unfollowUser(followerId: string, followedId: string): Promise<FollowSummary> {
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('followed_id', followedId)
  if (error) throw new Error(error.message)
  return getFollowSummary(followedId, followerId)
}
