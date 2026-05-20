import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'
import { AuthStackParamList } from '../../navigation/AuthStack'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>
}

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    if (!email || !password) {
      setError('Preenche todos os campos.')
      return
    }
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      if (authError.message.includes('Email not confirmed') || authError.message.includes('email_not_confirmed')) {
        await supabase.auth.resend({ type: 'signup', email })
        navigation.navigate('Otp', { email, redirectTo: 'Community' })
      } else {
        setError(authError.message === 'Invalid login credentials'
          ? 'Email ou palavra-passe incorretos.'
          : authError.message)
      }
    }

    setLoading(false)
  }

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
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Text style={styles.logoLetter}>B</Text>
          </LinearGradient>
          <Text style={styles.brand}>BARZA</Text>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Entrar</Text>
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titleBar} />
          <Text style={styles.subtitle}>O teu progresso continua de onde paraste.</Text>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
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
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Senha</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotLink}>Esqueci</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 48 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="A tua palavra-passe"
                placeholderTextColor="#52525b"
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(p => !p)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#71717a"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={styles.submitBtn}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading
                ? <Spinner color={colors.onPrimary} />
                : <Text style={styles.submitText}>Entrar</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Signup link */}
        <View style={styles.bottomSection}>
          <Text style={styles.noAccountText}>Ainda não tens conta?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.85}
            style={styles.signupBtn}
          >
            <Text style={styles.signupBtnText}>Criar Conta Agora</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing[8],
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: colors.onPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  brand: {
    ...typography.label,
    fontSize: 12,
    color: colors.primaryContainer,
    letterSpacing: 3,
  },
  titleBlock: {
    marginBottom: spacing[6],
    gap: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -2,
    color: colors.onSurface,
    lineHeight: 42,
  },
  titleBar: {
    height: 4,
    width: 48,
    borderRadius: 2,
  },
  subtitle: {
    ...typography.bodyMd,
    marginTop: 4,
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
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
  },
  form: {
    gap: spacing[5],
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  forgotLink: {
    ...typography.label,
    color: colors.primaryContainer,
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
  submitBtn: {
    marginTop: spacing[2],
    borderRadius: radius.lg,
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
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(86,67,58,0.2)',
  },
  dividerText: {
    ...typography.label,
    color: 'rgba(86,67,58,0.6)',
  },
  bottomSection: {
    gap: spacing[3],
  },
  noAccountText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
  },
  signupBtn: {
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signupBtnText: {
    color: colors.primaryContainer,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
})
