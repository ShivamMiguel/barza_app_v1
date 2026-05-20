import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'
import { OnboardingStackParamList } from '../../navigation/types'

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingStart'> }

const OPTIONS = [
  { icon: 'newspaper' as const, label: 'Explorar o Feed', action: 'feed' },
  { icon: 'storefront' as const, label: 'Criar Página Profissional', action: 'space' },
  { icon: 'create' as const, label: 'Publicar no Feed', action: 'post' },
]

export function OnboardingStartScreen({ navigation }: Props) {
  function pick(_action: string) {
    navigation.navigate('OnboardingWelcome')
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Por onde queres começar?</Text>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bar} />
      <Text style={styles.subtitle}>Escolhe o teu próximo passo na comunidade Barza.</Text>

      {OPTIONS.map(opt => (
        <TouchableOpacity key={opt.action} style={styles.option} onPress={() => pick(opt.action)} activeOpacity={0.85}>
          <Ionicons name={opt.icon} size={22} color={colors.primaryContainer} />
          <Text style={styles.optionText}>{opt.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={`${colors.onSurfaceVariant}50`} />
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={() => pick('feed')} activeOpacity={0.85} style={{ marginTop: spacing[4] }}>
        <LinearGradient colors={gradientColors} style={styles.doneBtn}>
          <Text style={styles.doneText}>Entrar na Comunidade</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  content: { padding: spacing[6], paddingTop: 60, gap: spacing[4] },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5, color: colors.onSurface },
  bar: { height: 4, width: 48, borderRadius: 2 },
  subtitle: { ...typography.bodyMd, marginBottom: spacing[2] },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], padding: spacing[5], backgroundColor: colors.surfaceContainer, borderRadius: radius['2xl'], borderWidth: 1, borderColor: 'rgba(86,67,58,0.1)' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.onSurface },
  doneBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.lg },
  doneText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800' },
})
