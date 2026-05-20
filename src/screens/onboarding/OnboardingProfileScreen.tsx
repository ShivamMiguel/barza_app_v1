import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Modal, FlatList,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { DIAL_CODES, DEFAULT_DIAL_CODE, type CountryDialCode } from '../../lib/locations'
import { updateProfile } from '../../lib/profile'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/Spinner'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'
import { OnboardingStackParamList } from '../../navigation/types'

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingProfile'> }

export function OnboardingProfileScreen({ navigation }: Props) {
  const { refreshProfile } = useAuth()
  const [dial, setDial] = useState<CountryDialCode>(DEFAULT_DIAL_CODE)
  const [dialOpen, setDialOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pickAvatar() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!res.canceled && res.assets[0]) setAvatarUri(res.assets[0].uri)
  }

  async function uploadAvatar(uri: string, userId: string): Promise<string> {
    const path = `${userId}/${Date.now()}.jpg`
    const res = await fetch(uri)
    const blob = await res.blob()
    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })
    if (error) throw error
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  async function submit() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      let avatar_url: string | undefined
      if (avatarUri) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('Sessão inválida.'); return }
        avatar_url = await uploadAvatar(avatarUri, user.id)
      }
      const digits = phone.replace(/\D/g, '').trim()
      const patch: Parameters<typeof updateProfile>[0] = {}
      if (avatar_url) patch.avatar_url = avatar_url
      if (digits) {
        patch.phone = `${dial.dial}${digits}`
        patch.location = { dial_code: dial.dial, country_code: dial.code }
      }
      if (Object.keys(patch).length > 0) {
        const profile = await updateProfile(patch)
        if (!profile) { setError('Erro ao guardar. Tenta novamente.'); return }
        await refreshProfile()
      }
      navigation.navigate('OnboardingIntent')
    } catch {
      setError('Erro ao enviar a foto ou guardar perfil.')
    } finally {
      setLoading(false)
    }
  }

  function skip() {
    navigation.navigate('OnboardingIntent')
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={skip} style={styles.skipTop}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Antes de começares…</Text>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bar} />
      <Text style={styles.subtitle}>
        Toda presença precisa de uma forma de ser reconhecida.{' '}
        <Text style={styles.subtitleAccent}>É sobre ligação.</Text>
      </Text>

      <Text style={styles.fieldLabel}>não precisa ser perfeito — só teu</Text>
      <View style={styles.avatarRow}>
        <TouchableOpacity style={styles.avatarBox} onPress={pickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="camera-outline" size={32} color={`${colors.onSurfaceVariant}30`} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={pickAvatar}>
          <Text style={styles.avatarLink}>{avatarUri ? 'Alterar imagem' : 'Carregar imagem'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>para te mantermos ligado ao que importa</Text>
      <View style={styles.phoneRow}>
        <TouchableOpacity style={styles.dialBtn} onPress={() => setDialOpen(true)}>
          <Text style={styles.dialFlag}>{dial.flag}</Text>
          <Text style={styles.dialCode}>{dial.dial}</Text>
          <Ionicons name={dialOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <TextInput
          style={styles.phoneInput}
          value={phone}
          onChangeText={setPhone}
          placeholder="900 000 000"
          placeholderTextColor="#52525b"
          keyboardType="phone-pad"
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity onPress={submit} disabled={loading} activeOpacity={0.85}>
        <LinearGradient colors={gradientColors} style={styles.confirmBtn}>
          {loading ? <Spinner color={colors.onPrimary} /> : (
            <>
              <Text style={styles.confirmText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={dialOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.dialBackdrop} activeOpacity={1} onPress={() => setDialOpen(false)}>
          <View style={styles.dialList}>
            <FlatList
              data={DIAL_CODES}
              keyExtractor={c => c.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dialItem, item.code === dial.code && styles.dialItemSel]}
                  onPress={() => { setDial(item); setDialOpen(false) }}
                >
                  <Text style={styles.dialFlag}>{item.flag}</Text>
                  <Text style={styles.dialName}>{item.name}</Text>
                  <Text style={styles.dialCode}>{item.dial}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  content: { padding: spacing[6], paddingTop: 56, paddingBottom: spacing[10], gap: spacing[4] },
  skipTop: { alignSelf: 'flex-end' },
  skipText: { ...typography.label, color: colors.primaryContainer, fontWeight: '700' },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5, color: colors.onSurface },
  bar: { height: 4, width: 48, borderRadius: 2 },
  subtitle: { ...typography.bodyMd, lineHeight: 24 },
  subtitleAccent: { color: colors.primaryContainer, fontWeight: '600' },
  fieldLabel: { ...typography.label, color: `${colors.onSurfaceVariant}80` },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  avatarBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: 'rgba(86,67,58,0.2)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarLink: { fontSize: 14, fontWeight: '600', color: colors.primaryContainer },
  phoneRow: { flexDirection: 'row', gap: spacing[2] },
  dialBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing[3], paddingVertical: 14, backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(86,67,58,0.15)' },
  dialFlag: { fontSize: 20 },
  dialCode: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  phoneInput: { flex: 1, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: 'rgba(86,67,58,0.15)', borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: 14, color: colors.onSurface, fontSize: 15 },
  error: { color: colors.error, fontSize: 13 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: radius.lg, marginTop: spacing[2] },
  confirmText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800' },
  dialBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing[6] },
  dialList: { maxHeight: 320, backgroundColor: colors.surfaceContainer, borderRadius: radius.xl, overflow: 'hidden' },
  dialItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing[4], borderBottomWidth: 1, borderBottomColor: 'rgba(86,67,58,0.1)' },
  dialItemSel: { backgroundColor: colors.surfaceContainerHigh },
  dialName: { flex: 1, fontSize: 14, color: colors.onSurface },
})
