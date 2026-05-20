import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useOnboarding } from '../../context/OnboardingContext'
import { colors, gradientColors } from '../../lib/theme'
import { OnboardingStackParamList } from '../../navigation/types'

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingWelcome'> }

type Stage = 'logo_in' | 'logo_out' | 'received' | 'farewell'

const TOTAL_MS = 8000

export function OnboardingWelcomeScreen({ navigation: _nav }: Props) {
  const { completeOnboarding } = useOnboarding()
  const [stage, setStage] = useState<Stage>('logo_in')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage('logo_out'), 1700),
      setTimeout(() => setStage('received'), 3000),
      setTimeout(() => setStage('farewell'), 5500),
      setTimeout(() => completeOnboarding(), TOTAL_MS),
    ]
    const start = Date.now()
    const tick = setInterval(() => {
      setProgress(Math.min(1, (Date.now() - start) / TOTAL_MS))
    }, 50)
    return () => { timers.forEach(clearTimeout); clearInterval(tick) }
  }, [completeOnboarding])

  function skip() {
    completeOnboarding()
  }

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.skip} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.center}>
        {(stage === 'logo_in' || stage === 'logo_out') && (
          <Text style={[styles.logo, stage === 'logo_out' && styles.fadeOut]}>BARZA</Text>
        )}
        {stage === 'received' && (
          <Text style={styles.received}>A tua presença foi recebida.</Text>
        )}
        {stage === 'farewell' && (
          <View style={styles.farewell}>
            <Text style={styles.welcome}>Bem-vindo à Barza.</Text>
            <Text style={styles.tagline}>Aqui, cada escolha é uma forma de expressão.</Text>
          </View>
        )}
      </View>

      <View style={styles.progressTrack}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${progress * 100}%` }]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface, justifyContent: 'center' },
  skip: { position: 'absolute', top: 56, right: 24, zIndex: 10 },
  skipText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: `${colors.onSurfaceVariant}80`, textTransform: 'uppercase' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 48, fontWeight: '900', letterSpacing: 12, color: colors.onSurface },
  fadeOut: { opacity: 0.2 },
  received: { fontSize: 24, fontWeight: '900', color: colors.onSurface, textAlign: 'center', letterSpacing: -0.5 },
  farewell: { alignItems: 'center', gap: 12 },
  welcome: { fontSize: 28, fontWeight: '900', color: colors.onSurface, textAlign: 'center' },
  tagline: { fontSize: 15, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  progressTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.03)' },
  progressBar: { height: '100%' },
})
