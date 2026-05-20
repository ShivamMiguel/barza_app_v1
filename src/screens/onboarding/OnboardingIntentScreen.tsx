import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { updateProfile } from '../../lib/profile'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/Spinner'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'
import { OnboardingStackParamList } from '../../navigation/types'

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingIntent'> }

const INTENTS = [
  { id: 'beleza_cabelo', label: 'Beleza & Cabelo', icon: 'cut-outline' as const },
  { id: 'unhas_estetica', label: 'Unhas & Estética', icon: 'brush-outline' as const },
  { id: 'skincare_bemestar', label: 'Skincare & Bem-estar', icon: 'leaf-outline' as const },
  { id: 'barbeiro_grooming', label: 'Barbeiro & Grooming', icon: 'man-outline' as const },
  { id: 'produtos_compras', label: 'Produtos & Compras', icon: 'bag-outline' as const },
  { id: 'inspiracao_conteudo', label: 'Inspiração & Conteúdo', icon: 'camera-outline' as const },
]

export function OnboardingIntentScreen({ navigation }: Props) {
  const { refreshProfile } = useAuth()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function continueFlow() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      if (selected.size > 0) {
        const interests = INTENTS.filter(i => selected.has(i.id)).map(i => i.id)
        const profile = await updateProfile({ interests })
        if (!profile) { setError('Erro ao guardar. Tenta novamente.'); return }
        await refreshProfile()
      }
      navigation.navigate('OnboardingLocation')
    } catch {
      setError('Erro de conexão. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.navigate('OnboardingLocation')} style={styles.skipTop}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Text style={styles.title}>O que te trouxe à Barza?</Text>
      <Text style={styles.subtitle}>
        Ninguém entra num espaço de beleza por acaso. Mesmo quando ainda não sabe o que procura.
      </Text>

      <View style={styles.grid}>
        {INTENTS.map(intent => {
          const isSel = selected.has(intent.id)
          return (
            <TouchableOpacity
              key={intent.id}
              style={[styles.card, isSel && styles.cardSel]}
              onPress={() => toggle(intent.id)}
              activeOpacity={0.85}
            >
              <Ionicons name={intent.icon} size={28} color={isSel ? colors.primaryContainer : colors.primary} />
              <Text style={styles.cardLabel}>{intent.label}</Text>
              {isSel && <Ionicons name="checkmark-circle" size={18} color={colors.primaryContainer} style={styles.check} />}
            </TouchableOpacity>
          )
        })}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity onPress={continueFlow} disabled={loading} activeOpacity={0.85}>
        <LinearGradient colors={gradientColors} style={styles.confirmBtn}>
          {loading ? <Spinner color={colors.onPrimary} /> : <Text style={styles.confirmText}>Continuar</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  content: { padding: spacing[6], paddingTop: 56, paddingBottom: spacing[10], gap: spacing[4] },
  skipTop: { alignSelf: 'flex-end' },
  skipText: { ...typography.label, color: colors.onSurfaceVariant },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5, color: colors.onSurface },
  subtitle: { ...typography.bodyMd, lineHeight: 24, opacity: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  card: { width: '47%', padding: spacing[5], backgroundColor: colors.surfaceContainer, borderRadius: radius['2xl'], borderWidth: 1, borderColor: 'rgba(86,67,58,0.1)', gap: spacing[3] },
  cardSel: { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.primaryContainer },
  cardLabel: { ...typography.label, fontSize: 10, color: colors.onSurface },
  check: { position: 'absolute', top: 10, right: 10 },
  error: { color: colors.error, fontSize: 13 },
  confirmBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.lg, marginTop: spacing[2] },
  confirmText: { color: colors.onPrimary, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
})
