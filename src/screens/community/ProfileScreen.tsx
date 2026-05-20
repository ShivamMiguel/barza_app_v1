import React, { useEffect, useState } from 'react'
import { ProfileEditModal } from '../../components/profile/ProfileEditModal'
import { ProfileTabs } from '../../components/profile/ProfileTabs'
import { UserBookingsSection } from '../../components/profile/UserBookingsSection'
import { UserOrdersSection } from '../../components/profile/UserOrdersSection'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../../components/ui/Avatar'
import { fetchPostsByUser, PostWithUser, supabase } from '../../lib/supabase'
import { getSpacesByOwner, ProfessionalSpace } from '../../lib/spaces'
import { getFollowSummary } from '../../lib/follows'
import { Spinner } from '../../components/ui/Spinner'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'
import { MainStackParamList } from '../../navigation/types'

export function ProfileScreen() {
  const { userProfile, refreshProfile, signOut } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>()
  const [posts, setPosts] = useState<PostWithUser[]>([])
  const [spaces, setSpaces] = useState<ProfessionalSpace[]>([])
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userProfile?.id) { setLoading(false); return }
    Promise.all([
      fetchPostsByUser(userProfile.id, 100),
      getSpacesByOwner(userProfile.id),
      getFollowSummary(userProfile.id, userProfile.id),
    ]).then(([userPosts, userSpaces, followSummary]) => {
      setPosts(userPosts)
      setSpaces(userSpaces)
      setFollowers(followSummary.followers)
      setFollowing(followSummary.following)
    }).finally(() => setLoading(false))
  }, [userProfile?.id])

  async function confirmLogout() {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await signOut()
      setLogoutOpen(false)
    } catch {
      setLogoutError('Erro ao sair. Tenta novamente.')
    } finally {
      setLoggingOut(false)
    }
  }

  if (!userProfile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Perfil não encontrado</Text>
        <Text style={styles.errorDesc}>Não conseguimos carregar o teu perfil</Text>
      </View>
    )
  }

  if (loading) {
    return <View style={styles.centered}><Spinner diameter={36} color={colors.primaryContainer} /></View>
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <LinearGradient colors={['rgba(255,145,86,0.12)', 'rgba(255,71,87,0.04)']} style={styles.cover} />
        <View style={styles.headerBody}>
          <View style={styles.avatarRow}>
            <LinearGradient colors={gradientColors} style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Avatar name={userProfile.full_name} avatarUrl={userProfile.avatar_url} size={96} />
              </View>
            </LinearGradient>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditOpen(true)}>
              <Ionicons name="create-outline" size={18} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{userProfile.full_name}</Text>
          {userProfile.profession && <Text style={styles.profession}>{userProfile.profession}</Text>}
          {userProfile.bio && <Text style={styles.bio}>{userProfile.bio}</Text>}
          <View style={styles.stats}>
            {[
              { label: 'Posts', value: posts.length },
              { label: 'Seguidores', value: followers },
              { label: 'Seguindo', value: following },
            ].map(s => (
              <View key={s.label}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Reservas</Text>
      <UserBookingsSection userId={userProfile.id} />

      <Text style={styles.sectionLabel}>Compras</Text>
      <UserOrdersSection userId={userProfile.id} />

      <Text style={styles.sectionLabel}>Espaços Profissionais</Text>
      {spaces.length > 0 ? (
        <View style={styles.spacesGrid}>
          {spaces.map(space => (
            <TouchableOpacity
              key={space.id}
              style={styles.spaceCard}
              onPress={() => navigation.navigate('SpaceDetail', { spaceId: space.id })}
            >
              <View style={styles.spaceLogo}>
                {space.logo ? (
                  <Image source={{ uri: space.logo }} style={styles.spaceLogoImg} />
                ) : (
                  <Ionicons name="storefront-outline" size={24} color={`${colors.onSurfaceVariant}40`} />
                )}
              </View>
              <View style={styles.spaceInfo}>
                <Text style={styles.spaceName} numberOfLines={1}>{space.space_name}</Text>
                {(space.location_space as any)?.city && (
                  <Text style={styles.spaceCity} numberOfLines={1}>
                    {(space.location_space as any).city}
                  </Text>
                )}
              </View>
              <View style={[styles.availDot, { backgroundColor: space.available ? '#22c55e' : `${colors.onSurfaceVariant}30` }]} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptySpaces}>
          <Ionicons name="storefront-outline" size={40} color={`${colors.onSurfaceVariant}20`} />
          <Text style={styles.emptyText}>Ainda não tens um espaço profissional</Text>
        </View>
      )}

      <ProfileTabs posts={posts} currentUserId={userProfile.id} />

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => { setLogoutError(null); setLogoutOpen(true) }}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={styles.logoutText}>Terminar sessão</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={logoutOpen}
        onClose={() => !loggingOut && setLogoutOpen(false)}
        onConfirm={confirmLogout}
        title="Terminar sessão?"
        message="Vais ter de iniciar sessão novamente para aceder à tua conta."
        confirmLabel="Sair"
        variant="danger"
        icon="log-out-outline"
        loading={loggingOut}
        error={logoutError}
      />

      <ProfileEditModal
        visible={editOpen}
        profile={userProfile}
        onClose={() => setEditOpen(false)}
        onSaved={() => refreshProfile()}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[12], gap: spacing[5] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8] },
  errorTitle: { fontSize: 22, fontWeight: '800', color: colors.onSurface },
  errorDesc: { color: colors.onSurfaceVariant, marginTop: 8 },
  headerCard: { borderRadius: radius['3xl'], overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(86,67,58,0.1)', backgroundColor: colors.surfaceContainer },
  cover: { height: 100 },
  headerBody: { padding: spacing[6], marginTop: -48 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: spacing[4] },
  editBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(86,67,58,0.15)' },
  avatarRing: { width: 104, height: 104, borderRadius: 52, padding: 3, alignSelf: 'flex-start' },
  avatarInner: { flex: 1, borderRadius: 52, overflow: 'hidden', borderWidth: 3, borderColor: '#111' },
  name: { fontSize: 26, fontWeight: '900', color: colors.onSurface, letterSpacing: -0.5 },
  profession: { ...typography.label, color: colors.primaryContainer, marginTop: 4 },
  bio: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: spacing[8], marginTop: spacing[5], paddingTop: spacing[5], borderTopWidth: 1, borderTopColor: 'rgba(86,67,58,0.12)' },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.onSurface },
  statLabel: { ...typography.label, fontSize: 9, marginTop: 2, color: `${colors.onSurfaceVariant}60` },
  sectionLabel: { ...typography.label, color: `${colors.onSurfaceVariant}40` },
  spacesGrid: { gap: spacing[4] },
  spaceCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[5], backgroundColor: colors.surfaceContainer, borderRadius: radius['2xl'], borderWidth: 1, borderColor: 'rgba(86,67,58,0.1)' },
  spaceLogo: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  spaceLogoImg: { width: '100%', height: '100%' },
  spaceInfo: { flex: 1 },
  spaceName: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  spaceCity: { fontSize: 11, color: `${colors.onSurfaceVariant}60`, marginTop: 2 },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  emptySpaces: { alignItems: 'center', padding: spacing[10], backgroundColor: colors.surfaceContainer, borderRadius: radius['3xl'], gap: spacing[3] },
  emptyText: { ...typography.label, color: `${colors.onSurfaceVariant}50` },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    marginTop: spacing[2],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: colors.error },
})
