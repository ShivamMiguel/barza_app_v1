import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native'
import * as Location from 'expo-location'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { nominatimSearch, nominatimReverse, LocationData } from '../../lib/nominatim'
import { updateProfile } from '../../lib/profile'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/Spinner'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'
import { OnboardingStackParamList } from '../../navigation/types'

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingLocation'> }

export function OnboardingLocationScreen({ navigation }: Props) {
  const { refreshProfile } = useAuth()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<LocationData[]>([])
  const [selected, setSelected] = useState<LocationData | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const t = setTimeout(() => {
      nominatimSearch(query).then(setSuggestions).catch(() => setSuggestions([]))
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  async function detectLocation() {
    setDetecting(true)
    setError(null)
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setError('Geolocalização não suportada ou permissão negada.')
      setDetecting(false)
      return
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const loc = await nominatimReverse(pos.coords.latitude, pos.coords.longitude)
      setSelected(loc)
      setQuery('')
      setSuggestions([])
    } catch {
      setError('Não foi possível obter o endereço. Tenta pesquisar manualmente.')
    } finally {
      setDetecting(false)
    }
  }

  async function confirm() {
    if (!selected) { setError('Seleciona ou deteta a tua localização.'); return }
    setLoading(true)
    setError(null)
    const profile = await updateProfile({ location: selected })
    setLoading(false)
    if (!profile) { setError('Erro ao guardar. Tenta novamente.'); return }
    await refreshProfile()
    navigation.navigate('OnboardingStart')
  }

  function skip() {
    navigation.navigate('OnboardingStart')
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Onde estás?</Text>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bar} />
      <Text style={styles.subtitle}>A tua localização ajuda-nos a mostrar profissionais perto de ti.</Text>

      <TouchableOpacity style={styles.detectBtn} onPress={detectLocation} disabled={detecting}>
        {detecting ? (
          <Spinner color={colors.primaryContainer} />
        ) : (
          <>
            <Ionicons name="locate" size={18} color={colors.primaryContainer} />
            <Text style={styles.detectText}>Usar a minha localização</Text>
          </>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Pesquisar cidade ou morada..."
        placeholderTextColor="#52525b"
      />

      {suggestions.map((s, i) => (
        <TouchableOpacity key={i} style={styles.suggestion} onPress={() => { setSelected(s); setQuery(s.address); setSuggestions([]) }}>
          <Ionicons name="location-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={styles.suggestionText} numberOfLines={2}>{s.address}</Text>
        </TouchableOpacity>
      ))}

      {selected && (
        <View style={styles.selectedBox}>
          <Text style={styles.selectedLabel}>Selecionado</Text>
          <Text style={styles.selectedAddr}>{selected.address}</Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity onPress={confirm} disabled={loading} activeOpacity={0.85}>
        <LinearGradient colors={gradientColors} style={styles.confirmBtn}>
          {loading ? <Spinner color={colors.onPrimary} /> : <Text style={styles.confirmText}>Confirmar</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={skip} style={styles.skipBtn}>
        <Text style={styles.skipText}>Saltar por agora</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  content: { padding: spacing[6], paddingTop: 60, paddingBottom: spacing[10], gap: spacing[4] },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5, color: colors.onSurface },
  bar: { height: 4, width: 48, borderRadius: 2 },
  subtitle: { ...typography.bodyMd, marginBottom: spacing[2] },
  detectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(255,145,86,0.3)' },
  detectText: { color: colors.primaryContainer, fontWeight: '700' },
  input: { backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: 'rgba(86,67,58,0.3)', borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: 14, color: colors.onSurface, fontSize: 15 },
  suggestion: { flexDirection: 'row', gap: 10, padding: spacing[3], backgroundColor: colors.surfaceContainer, borderRadius: radius.lg },
  suggestionText: { flex: 1, fontSize: 13, color: colors.onSurface },
  selectedBox: { padding: spacing[4], backgroundColor: 'rgba(255,145,86,0.08)', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,145,86,0.2)' },
  selectedLabel: { ...typography.label, color: colors.primaryContainer },
  selectedAddr: { fontSize: 13, color: colors.onSurface, marginTop: 4 },
  error: { color: colors.error, fontSize: 13 },
  confirmBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.lg, marginTop: spacing[2] },
  confirmText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800' },
  skipBtn: { alignItems: 'center', padding: spacing[4] },
  skipText: { ...typography.label, color: `${colors.onSurfaceVariant}60` },
})
