import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView, Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { searchCommunity } from '../../lib/search'
import { Spinner } from '../ui/Spinner'
import { colors, spacing, radius } from '../../lib/theme'
import { MainStackParamList } from '../../navigation/types'

type Props = { visible: boolean; onClose: () => void }

export function SearchModal({ visible, onClose }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchCommunity>> | null>(null)

  useEffect(() => {
    if (!visible) { setQuery(''); setResults(null); return }
    if (!query.trim()) { setResults(null); return }
    setLoading(true)
    const t = setTimeout(() => {
      searchCommunity(query).then(setResults).finally(() => setLoading(false))
    }, 350)
    return () => clearTimeout(t)
  }, [query, visible])

  function goToSpace(spaceId: string) {
    onClose()
    navigation.navigate('SpaceDetail', { spaceId })
  }

  const empty = results && !loading && !results.spaces.length && !results.services.length && !results.products.length

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.primaryContainer} />
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Espaços, serviços, produtos..."
              placeholderTextColor="#52525b"
              autoFocus
            />
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
            {loading && <Spinner diameter={28} color={colors.primaryContainer} />}
            {empty && (
              <Text style={styles.empty}>Nenhum resultado para &quot;{query}&quot;</Text>
            )}
            {results?.spaces.map(s => (
              <TouchableOpacity key={s.id} style={styles.row} onPress={() => goToSpace(s.id)}>
                <View style={styles.thumb}>
                  {s.logo ? <Image source={{ uri: s.logo }} style={styles.thumbImg} /> : <Ionicons name="storefront-outline" size={18} color={`${colors.onSurfaceVariant}40`} />}
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowType}>Espaço</Text>
                  <Text style={styles.rowTitle} numberOfLines={1}>{s.space_name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={`${colors.onSurfaceVariant}30`} />
              </TouchableOpacity>
            ))}
            {results?.services.map(svc => (
              <TouchableOpacity key={svc.id} style={styles.row} onPress={() => goToSpace(svc.professional_space.id)}>
                <View style={styles.thumb}>
                  {svc.professional_space.logo ? <Image source={{ uri: svc.professional_space.logo }} style={styles.thumbImg} /> : <Ionicons name="cut-outline" size={18} color={`${colors.onSurfaceVariant}40`} />}
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowType}>Serviço · {svc.professional_space.space_name}</Text>
                  <Text style={styles.rowTitle} numberOfLines={1}>{svc.service_name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={`${colors.onSurfaceVariant}30`} />
              </TouchableOpacity>
            ))}
            {results?.products.map(p => (
              <TouchableOpacity key={p.id} style={styles.row} onPress={() => goToSpace(p.professional_space.id)}>
                <View style={styles.thumb}>
                  {p.image_url ? <Image source={{ uri: p.image_url }} style={styles.thumbImg} /> : <Ionicons name="bag-outline" size={18} color={`${colors.onSurfaceVariant}40`} />}
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowType}>Produto · {p.professional_space.space_name}</Text>
                  <Text style={styles.rowTitle} numberOfLines={1}>{p.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={`${colors.onSurfaceVariant}30`} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-start', paddingTop: 60 },
  sheet: { flex: 1, backgroundColor: colors.surfaceContainer, borderTopLeftRadius: radius['3xl'], borderTopRightRadius: radius['3xl'], overflow: 'hidden' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[5], borderBottomWidth: 1, borderBottomColor: 'rgba(86,67,58,0.12)' },
  input: { flex: 1, fontSize: 16, color: colors.onSurface },
  results: { flex: 1, padding: spacing[4] },
  empty: { textAlign: 'center', color: `${colors.onSurfaceVariant}50`, padding: spacing[8], fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.xl, marginBottom: spacing[2], backgroundColor: colors.surfaceContainerLowest },
  thumb: { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  rowInfo: { flex: 1 },
  rowType: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.primaryContainer },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.onSurface, marginTop: 2 },
})
