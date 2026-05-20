import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, Image, RefreshControl,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { useCommunity } from '../../context/CommunityContext'
import { fetchPosts, fetchServices, fetchProducts, PostWithUser, ServiceWithSpace, ProductWithSpace } from '../../lib/supabase'
import { fetchExternalSignals, ExternalSignal } from '../../lib/beauty-signals'
import { haversineKm, getSpaceCoords, RADIUS_KM } from '../../lib/distance'
import { CreatePostBox } from '../../components/feed/CreatePostBox'
import { PostCardEditorial } from '../../components/feed/PostCardEditorial'
import { ProfessionalSpaceCard } from '../../components/feed/ProfessionalSpaceCard'
import { ProductCard } from '../../components/feed/ProductCard'
import { BeautySignalCard } from '../../components/feed/BeautySignalCard'
import { StoryViewerModal, type StoryItem } from '../../components/feed/StoryViewerModal'
import { Spinner } from '../../components/ui/Spinner'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'

const POSTS_PER_PAGE = 10

type FeedItem =
  | { kind: 'service'; data: ServiceWithSpace; key: string }
  | { kind: 'product'; data: ProductWithSpace; key: string }
  | { kind: 'post'; data: PostWithUser; key: string }
  | { kind: 'signal'; data: ExternalSignal; key: string }

const STORIES: StoryItem[] = [
  { name: 'Trends', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAC3l_xOgy-k2Ec-IORYlT2TAhfSdLTSCY7qF4DLmgd5tJA2VVwh0L0fn8i7eDaKOLeLxDwgO0dSwYL7xiLbyBIqKgsa7dV1qZNTZuX5biFr2IKWfDefmQEH8ijD_4W46goMNstL_zaS__QfXPXdts5gZg8NwhTXHXwqrYlcqV81oZCiCS7B_0kOIvMmSZ78JST8-iV2Up6Ju4EQ5kVKazpCVdgsvL7xfyOzoTgIz9yJCHdD7dLZ5k7zCorYD9ZoXdXwyvb7FNfsR0' },
  { name: 'Barber of the week', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXu475Q90pXSudFTSP5EszioqKC1pr-3Tf1ucz3xUepXze4r5ALy2M4WeCTTfXNA2ox7xusSYVfUwxrSAskemmrA7hCzb1jpwqWyFlhBMHFyPkGg-7ssTM-D6ezGF08zPHLRQS7Seva8GrHKwL6tkv7mUhN7Gwa0sINGpeQuS0vquz2j17aHtqYlNlVQTBmNg_aN5mMIrLI2HoJ5iUyg676AcAmHWbDoUDOlPz5DBHKQyLlfo9lWskBL1PYuQP8MMFJSy2QhmZonY' },
  { name: 'Nails Today', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCG7NrKCRgXkxaMafVgoD9YQojXQIaIGnTkWW3-bwTQt_xJjMul5uAFyG3Ig_Ws2Orm79qDjrZ3dAR-bu6w2QVrHadqJRKurfeOnh7TE538L2WTdGfUI_x4PtV4P-pL0cHGgqR-j1J-RTS2ugpdMgR8V6naBS0f3KSc-111pmp9VtaENh0qAktBrt2dL0RV4_Ie5LbnuoOPWzF9X52mA0opnUCd7WqBkL_qpx-OI9ywr6N8-7dIYQgVnm_BTj53eqWGWX6F14ijjT8' },
  { name: 'New Drops', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnkomdXPuuum3ck-BkVaClvauz1bc_Ucin4yMhP6c1AZ31OQHMfe3_9dFkto8-A-ugOAxJSZ3FLg1ThG2jBNRkL4_xMPS01xzm01ElcLzcjQPvAyVh0jj3Qdno2vyZfQxc28zPXKuURUrt6xn2QO5FWCiohty5Tq0puhk9AGoZTNel9bkxV4d1tE9pOXveoVuQ6qrDFKluLhhTCNOZ8ajqB2Wzibo8tB-14JrL6q6x5_B9qOPHge8yKoVL3A_6BBG-dc1Jw4j2E' },
]

function buildFeed(
  services: ServiceWithSpace[],
  products: ProductWithSpace[],
  posts: PostWithUser[],
  signals: ExternalSignal[],
): FeedItem[] {
  const buckets: FeedItem[][] = [
    services.map((d, i) => ({ kind: 'service' as const, data: d, key: `svc-${d.id}-${i}` })),
    products.map((d, i) => ({ kind: 'product' as const, data: d, key: `prd-${d.id}-${i}` })),
    posts.map((d, i) => ({ kind: 'post' as const, data: d, key: `pst-${d.id}-${i}` })),
    signals.map((d, i) => ({ kind: 'signal' as const, data: d, key: `sig-${i}-${d.url}` })),
  ]
  const result: FeedItem[] = []
  const max = Math.max(...buckets.map(b => b.length))
  for (let i = 0; i < max; i++) {
    for (const bucket of buckets) {
      if (i < bucket.length) result.push(bucket[i])
    }
  }
  return result
}

type FeedScreenProps = {
  embedded?: boolean
}

export function FeedScreen({ embedded = false }: FeedScreenProps) {
  const insets = useSafeAreaInsets()
  const { userProfile } = useAuth()
  const { currentLocation } = useCommunity()
  const [rawServices, setRawServices] = useState<ServiceWithSpace[]>([])
  const [rawProducts, setRawProducts] = useState<ProductWithSpace[]>([])
  const [signals, setSignals] = useState<ExternalSignal[]>([])
  const [posts, setPosts] = useState<PostWithUser[]>([])
  const [newPosts, setNewPosts] = useState<PostWithUser[]>([])
  const [extraPosts, setExtraPosts] = useState<PostWithUser[]>([])
  const [offset, setOffset] = useState(POSTS_PER_PAGE)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null)

  async function loadData() {
    const [svcs, prods, postsResult, sigs] = await Promise.all([
      fetchServices(50),
      fetchProducts(50),
      fetchPosts(POSTS_PER_PAGE, 0),
      fetchExternalSignals(),
    ])
    setRawServices(svcs)
    setRawProducts(prods)
    setSignals(sigs)
    setPosts(postsResult)
    setOffset(POSTS_PER_PAGE)
    setHasMore(postsResult.length === POSTS_PER_PAGE)
    setNewPosts([])
    setExtraPosts([])
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const more = await fetchPosts(POSTS_PER_PAGE, offset)
    setExtraPosts(prev => [...prev, ...more])
    setOffset(prev => prev + POSTS_PER_PAGE)
    setHasMore(more.length === POSTS_PER_PAGE)
    setLoadingMore(false)
  }

  const { services, products } = useMemo(() => {
    if (!currentLocation) return { services: rawServices, products: rawProducts }

    const loc = currentLocation!
    function distKm(spaceLoc: Record<string, unknown> | null | undefined): number | null {
      const coords = getSpaceCoords(spaceLoc)
      if (!coords) return null
      return haversineKm(loc.lat, loc.lon, coords.lat, coords.lon)
    }

    const filteredSpaces = rawServices
      .map(s => ({ item: s, km: distKm(s.professional_space.location_space) }))
      .filter(({ km }) => km !== null && km <= RADIUS_KM)
      .sort((a, b) => a.km! - b.km!)
      .map(({ item }) => item)

    const filteredProducts = rawProducts
      .map(p => ({ item: p, km: distKm(p.professional_space.location_space) }))
      .filter(({ km }) => km !== null && km <= RADIUS_KM)
      .sort((a, b) => a.km! - b.km!)
      .map(({ item }) => item)

    return { services: filteredSpaces, products: filteredProducts }
  }, [rawServices, rawProducts, currentLocation])

  const feedItems = useMemo<FeedItem[]>(() => {
    const base = buildFeed(services, products, posts, signals)
    const extras = extraPosts.map((d, i) => ({ kind: 'post' as const, data: d, key: `extra-${d.id}-${i}` }))
    const newItems = newPosts.map((d, i) => ({ kind: 'post' as const, data: d, key: `new-${d.id}-${i}` }))
    return [...newItems, ...base, ...extras]
  }, [services, products, posts, signals, newPosts, extraPosts, currentLocation])

  function renderItem({ item }: { item: FeedItem }) {
    if (item.kind === 'service') return <ProfessionalSpaceCard service={item.data} />
    if (item.kind === 'product') return <ProductCard product={item.data} />
    if (item.kind === 'post') {
      return (
        <PostCardEditorial
          post={item.data}
          currentUserId={userProfile?.id}
          onDelete={id => {
            setPosts(prev => prev.filter(p => p.id !== id))
            setNewPosts(prev => prev.filter(p => p.id !== id))
            setExtraPosts(prev => prev.filter(p => p.id !== id))
          }}
        />
      )
    }
    return <BeautySignalCard signal={item.data} />
  }

  const ListHeader = (
    <View>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Discover</Text>
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titleBar} />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Stories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesRow}
        style={styles.storiesScroll}
      >
        {STORIES.map((s, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.storyItem}
            activeOpacity={0.85}
            onPress={() => setActiveStory(s)}
          >
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.storyRing}>
              <View style={styles.storyInner}>
                <Image source={{ uri: s.img }} style={styles.storyImg} />
              </View>
            </LinearGradient>
            <Text style={styles.storyName} numberOfLines={2}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create post */}
      <View style={styles.createPost}>
        <CreatePostBox
          profile={userProfile}
          onPostCreated={post => setNewPosts(prev => [post, ...prev])}
        />
      </View>

      {/* Loading */}
      {loading && feedItems.length === 0 && (
        <View style={styles.loadingBlock}>
          <Spinner diameter={36} color={colors.primaryContainer} />
        </View>
      )}

      {/* Empty */}
      {!loading && feedItems.length === 0 && (
        <View style={styles.emptyBlock}>
          <Ionicons
            name={currentLocation ? 'location-outline' : 'newspaper-outline'}
            size={48}
            color={`${colors.onSurfaceVariant}40`}
          />
          <Text style={styles.emptyText}>
            {currentLocation ? 'Nenhum espaço a menos de 100 km' : 'Nenhum conteúdo disponível'}
          </Text>
          {currentLocation && (
            <Text style={styles.emptySubtext}>Ainda não há profissionais de beleza na tua área.</Text>
          )}
        </View>
      )}
    </View>
  )

  const ListFooter = hasMore ? (
    <View style={styles.loadMoreBlock}>
      <TouchableOpacity
        onPress={loadMore}
        disabled={loadingMore}
        style={styles.loadMoreBtn}
        activeOpacity={0.8}
      >
        {loadingMore ? (
          <Spinner color={colors.primaryContainer} />
        ) : (
          <>
            <Ionicons name="chevron-down-outline" size={16} color={colors.primaryContainer} />
            <Text style={styles.loadMoreText}>Ver mais</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  ) : null

  return (
    <View style={[styles.root, !embedded && { paddingTop: insets.top }]}>
      <StoryViewerModal
        visible={activeStory !== null}
        story={activeStory}
        onClose={() => setActiveStory(null)}
      />
      <FlatList
        data={feedItems}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: embedded ? spacing[6] : insets.bottom + 80 },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: spacing[5] }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primaryContainer}
            colors={[colors.primaryContainer]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -2,
    color: colors.onSurface,
    lineHeight: 38,
    marginBottom: spacing[2],
  },
  titleBar: {
    height: 4,
    width: 48,
    borderRadius: 2,
  },
  filterBtn: {
    padding: 10,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
  },
  storiesScroll: {
    marginBottom: spacing[6],
    marginHorizontal: -spacing[4],
  },
  storiesRow: {
    paddingHorizontal: spacing[4],
    gap: spacing[5],
  },
  storyItem: {
    alignItems: 'center',
    gap: 6,
    width: 68,
  },
  storyRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInner: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  storyImg: {
    width: '100%',
    height: '100%',
  },
  storyName: {
    ...typography.labelSm,
    color: colors.onSurface,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  createPost: {
    marginBottom: spacing[5],
  },
  loadingBlock: {
    paddingVertical: spacing[10],
    alignItems: 'center',
  },
  emptyBlock: {
    paddingVertical: spacing[10],
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius['3xl'],
  },
  emptyText: {
    ...typography.label,
    color: `${colors.onSurfaceVariant}40`,
  },
  emptySubtext: {
    fontSize: 11,
    color: `${colors.onSurfaceVariant}30`,
    marginTop: 4,
    textAlign: 'center',
  },
  loadMoreBlock: {
    paddingVertical: spacing[5],
    alignItems: 'center',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing[8],
    paddingVertical: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.primaryContainer}40`,
  },
  loadMoreText: {
    ...typography.label,
    color: colors.primaryContainer,
  },
})
