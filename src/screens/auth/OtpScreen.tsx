import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Clipboard,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'
import { AuthStackParamList } from '../../navigation/AuthStack'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Otp'>
  route: RouteProp<AuthStackParamList, 'Otp'>
}

export function OtpScreen({ navigation, route }: Props) {
  const { email, redirectTo } = route.params
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const inputs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  useEffect(() => {
    setTimeout(() => inputs.current[0]?.focus(), 300)
  }, [])

  const handleVerify = useCallback(async (code: string) => {
    setError(null)
    setLoading(true)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (verifyError) {
      setError('Código inválido. Tenta novamente.')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputs.current[0]?.focus(), 50)
      setLoading(false)
      return
    }

    setLoading(false)
  }, [email, redirectTo])

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    setError(null)

    if (digit && index < 5) {
      inputs.current[index + 1]?.focus()
    }

    if (digit && newOtp.every(d => d !== '')) {
      handleVerify(newOtp.join(''))
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        inputs.current[index - 1]?.focus()
      }
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setError(null)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setError('Erro ao reenviar. Tenta novamente.')
    } else {
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputs.current[0]?.focus(), 50)
    }
  }

  const codeComplete = otp.every(d => d !== '')

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={`${colors.onSurface}60`} />
        </TouchableOpacity>

        {/* Header icon */}
        <View style={styles.iconWrapper}>
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBox}>
            <Ionicons name="mail-open" size={26} color={colors.onPrimary} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Verifica o teu email</Text>
        <Text style={styles.subtitle}>
          Enviámos um código de 6 dígitos para{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        {/* OTP inputs */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => { inputs.current[i] = el }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : {},
                error ? styles.otpInputError : {},
              ]}
              value={digit}
              onChangeText={v => handleChange(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              editable={!loading}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          onPress={() => handleVerify(otp.join(''))}
          disabled={!codeComplete || loading}
          activeOpacity={0.85}
          style={styles.submitBtn}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.submitGradient, (!codeComplete || loading) && styles.submitDisabled]}
          >
            {loading
              ? <Spinner color={colors.onPrimary} />
              : <Text style={styles.submitText}>Confirmar Código</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendSection}>
          <Text style={styles.resendHint}>Não recebeste o email?</Text>
          {resendCooldown > 0 ? (
            <Text style={styles.resendCooldown}>
              Podes reenviar em <Text style={styles.resendTimer}>{resendCooldown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendBtn}>Reenviar código</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(14,14,14,0.96)',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[10],
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  iconWrapper: {
    marginBottom: spacing[5],
    marginTop: spacing[6],
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing[8],
  },
  emailText: {
    color: colors.onSurface,
    fontWeight: '700',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing[5],
  },
  otpInput: {
    width: 46,
    height: 56,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: 'rgba(86,67,58,0.4)',
    backgroundColor: colors.surfaceContainerLowest,
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: colors.primaryContainer,
    color: colors.primaryContainer,
  },
  otpInputError: {
    borderColor: colors.error,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,180,171,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.2)',
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
    alignSelf: 'stretch',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
  },
  submitBtn: {
    alignSelf: 'stretch',
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing[6],
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  resendSection: {
    alignItems: 'center',
    gap: 6,
  },
  resendHint: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  resendCooldown: {
    color: `${colors.onSurfaceVariant}80`,
    fontSize: 12,
  },
  resendTimer: {
    color: colors.primaryContainer,
    fontWeight: '700',
  },
  resendBtn: {
    ...typography.label,
    color: colors.primaryContainer,
    textDecorationLine: 'underline',
  },
})
