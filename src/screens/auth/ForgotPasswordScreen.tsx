import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'
import { AuthStackParamList } from '../../navigation/AuthStack'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>
}

type Step = 1 | 2 | 3

export function ForgotPasswordScreen({ navigation }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  useEffect(() => {
    if (step === 2) setTimeout(() => inputs.current[0]?.focus(), 100)
  }, [step])

  async function handleRequestCode() {
    if (!email) { setError('Introduz o teu email.'); return }
    setError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setResendCooldown(60)
    setStep(2)
    setLoading(false)
  }

  const handleConfirm = useCallback(async (code: string) => {
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.')
      return
    }
    if (password.length < 8) {
      setError('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }
    setError(null)
    setLoading(true)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery',
    })

    if (verifyError) {
      setError('Código inválido ou expirado.')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputs.current[0]?.focus(), 50)
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setStep(3)
    setLoading(false)
  }, [email, password, confirmPassword])

  async function handleResend() {
    if (resendCooldown > 0) return
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      setError('Erro ao reenviar.')
    } else {
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputs.current[0]?.focus(), 50)
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    setError(null)
    if (digit && index < 5) inputs.current[index + 1]?.focus()
    if (digit && newOtp.every(d => d !== '') && password && confirmPassword) {
      handleConfirm(newOtp.join(''))
    }
  }

  function handleOtpKeyPress(index: number, key: string) {
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

  const codeComplete = otp.every(d => d !== '')

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={`${colors.onSurface}60`} />
        </TouchableOpacity>

        {/* ── Step 1 ─────────────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBox}>
              <Ionicons name="lock-open-outline" size={26} color={colors.onPrimary} />
            </LinearGradient>
            <Text style={styles.title}>Recuperar Palavra-Passe</Text>
            <Text style={styles.subtitle}>
              Introduz o teu email e enviamos um código para definires uma nova palavra-passe.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="O teu email"
                placeholderTextColor="#52525b"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleRequestCode}
              />
            </View>

            <TouchableOpacity
              onPress={handleRequestCode}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.submitBtn}
            >
              <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                {loading ? <Spinner color={colors.onPrimary} /> : <Text style={styles.submitText}>Enviar Código</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backLink}>← Voltar ao login</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2 ─────────────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBox}>
              <Ionicons name="mail-open" size={26} color={colors.onPrimary} />
            </LinearGradient>
            <Text style={styles.title}>Código + Nova Senha</Text>
            <Text style={styles.subtitle}>
              Enviámos um código para <Text style={styles.emailBold}>{email}</Text>.{'\n'}
              Introduz o código e define a nova palavra-passe.
            </Text>

            {/* OTP */}
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={el => { inputs.current[i] = el }}
                  style={[styles.otpInput, digit && styles.otpInputFilled, error && !password && styles.otpInputError]}
                  value={digit}
                  onChangeText={v => handleOtpChange(i, v)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  editable={!loading}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Resend */}
            <View style={styles.resendRow}>
              {resendCooldown > 0
                ? <Text style={styles.resendCooldown}>Reenviar em <Text style={styles.resendTimer}>{resendCooldown}s</Text></Text>
                : <TouchableOpacity onPress={handleResend}><Text style={styles.resendBtn}>Reenviar código</Text></TouchableOpacity>
              }
            </View>

            {/* New password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nova Palavra-Passe</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 48 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor="#52525b"
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(p => !p)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#71717a" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmar Palavra-Passe</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 48 }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repete a palavra-passe"
                  placeholderTextColor="#52525b"
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(p => !p)}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#71717a" />
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => codeComplete && handleConfirm(otp.join(''))}
              disabled={!codeComplete || !password || !confirmPassword || loading}
              activeOpacity={0.85}
              style={styles.submitBtn}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.submitGradient, (!codeComplete || !password || !confirmPassword) && { opacity: 0.4 }]}
              >
                {loading ? <Spinner color={colors.onPrimary} /> : <Text style={styles.submitText}>Redefinir Palavra-Passe</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep(1); setError(null) }}>
              <Text style={styles.backLink}>← Usar outro email</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3 ─────────────────────────────────────────── */}
        {step === 3 && (
          <View style={[styles.stepContainer, styles.successContainer]}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={44} color="#4ade80" />
            </View>
            <Text style={styles.title}>Palavra-passe actualizada!</Text>
            <Text style={styles.subtitle}>
              A tua palavra-passe foi alterada com sucesso. Já podes entrar com a nova senha.
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
              style={styles.submitBtn}
            >
              <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                <Text style={styles.submitText}>Ir para Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[10],
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  stepContainer: {
    marginTop: spacing[8],
    alignItems: 'center',
    gap: spacing[4],
  },
  successContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
    color: colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  emailBold: {
    color: colors.onSurface,
    fontWeight: '700',
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
    alignSelf: 'stretch',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
  },
  fieldGroup: {
    gap: 6,
    alignSelf: 'stretch',
  },
  label: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  input: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.3)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    color: colors.onSurface,
    fontSize: 15,
  },
  inputWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
  },
  otpInput: {
    width: 44,
    height: 52,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: 'rgba(86,67,58,0.4)',
    backgroundColor: colors.surfaceContainerLowest,
    color: colors.onSurface,
    fontSize: 20,
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
  resendRow: {
    marginTop: -spacing[2],
  },
  resendCooldown: {
    color: `${colors.onSurfaceVariant}60`,
    fontSize: 12,
    textAlign: 'center',
  },
  resendTimer: {
    color: colors.primaryContainer,
    fontWeight: '700',
  },
  resendBtn: {
    ...typography.label,
    color: colors.primaryContainer,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  submitBtn: {
    alignSelf: 'stretch',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  submitText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  backLink: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing[2],
  },
})
