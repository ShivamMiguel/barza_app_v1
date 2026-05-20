import React, { useState } from 'react'
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
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>
}

export function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignup() {
    if (!name || !email || !password) {
      setError('Preenche todos os campos.')
      return
    }
    if (password.length < 8) {
      setError('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Este email já está registado.'
        : authError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    navigation.navigate('Otp', { email, redirectTo: 'Community' })
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
        {/* Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Criar Conta</Text>
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titleBar} />
          <Text style={styles.subtitle}>Cria a tua conta em menos de um minuto.</Text>
        </View>

        {/* Badge */}
        <View style={styles.badge}>
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badgeIcon}>
            <Ionicons name="checkmark-circle" size={14} color={colors.onPrimary} />
          </LinearGradient>
          <Text style={styles.badgeText}>10k+ Activos</Text>
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
            <Text style={styles.label}>Nome Completo</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 48 }]}
                value={name}
                onChangeText={setName}
                placeholder="Como gostas de ser chamado?"
                placeholderTextColor="#52525b"
                autoComplete="name"
                returnKeyType="next"
              />
              <View style={styles.inputIcon}>
                <Ionicons name="person-outline" size={16} color="#71717a" />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 48 }]}
                value={email}
                onChangeText={setEmail}
                placeholder="O teu melhor email"
                placeholderTextColor="#52525b"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
              <View style={styles.inputIcon}>
                <Ionicons name="mail-outline" size={16} color="#71717a" />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Palavra-passe</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 48 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#52525b"
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
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
            onPress={handleSignup}
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
                : <Text style={styles.submitText}>Criar Conta</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <View style={styles.bottomSection}>
          <Text style={styles.haveAccountText}>Já tens conta?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
            style={styles.loginBtn}
          >
            <Text style={styles.loginBtnText}>Entrar na Conta</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Ao continuar, aceitas os <Text style={styles.termsLink}>termos</Text> e a visão de evoluir.
          </Text>
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
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    marginLeft: -spacing[2],
  },
  titleBlock: {
    marginBottom: spacing[4],
    gap: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -2,
    color: colors.onSurface,
    lineHeight: 38,
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing[5],
  },
  badgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.label,
    color: colors.primaryContainer,
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
    gap: spacing[4],
  },
  fieldGroup: {
    gap: 6,
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
  inputIcon: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
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
  bottomSection: {
    gap: spacing[3],
    marginTop: spacing[6],
  },
  haveAccountText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
  },
  loginBtn: {
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginBtnText: {
    color: colors.primaryContainer,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  termsText: {
    color: '#52525b',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: spacing[2],
  },
  termsLink: {
    color: colors.primary,
  },
})
