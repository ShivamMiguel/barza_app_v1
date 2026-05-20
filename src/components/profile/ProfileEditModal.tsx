import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { UserProfile, updateProfile } from '../../lib/profile'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../ui/Spinner'
import { colors, gradientColors, spacing, radius } from '../../lib/theme'

type Props = {
  visible: boolean
  profile: UserProfile
  onClose: () => void
  onSaved: () => void
}

export function ProfileEditModal({ visible, profile, onClose, onSaved }: Props) {
  const [fullName, setFullName] = useState(profile.full_name)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [profession, setProfession] = useState(profile.profession ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setFullName(profile.full_name)
    setBio(profile.bio ?? '')
    setProfession(profile.profession ?? '')
    setError(null)
  }, [visible, profile])

  async function save() {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sessão inválida.'); setLoading(false); return }

    const loc = { ...(profile.profile_location ?? {}), bio: bio.trim() || undefined }
    const { error: nameErr } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || profile.full_name,
        role_profile: profession.trim() || null,
        profile_location: loc,
      })
      .eq('id', user.id)

    if (nameErr) {
      setError(nameErr.message)
      setLoading(false)
      return
    }
    await updateProfile({ location: loc })
    onSaved()
    onClose()
    setLoading(false)
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>Editar Perfil</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholderTextColor="#52525b" />

            <Text style={styles.label}>Profissão</Text>
            <TextInput style={styles.input} value={profession} onChangeText={setProfession} placeholder="Ex: Estilista" placeholderTextColor="#52525b" />

            <Text style={styles.label}>Bio</Text>
            <TextInput style={[styles.input, styles.bio]} value={bio} onChangeText={setBio} multiline placeholderTextColor="#52525b" />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity onPress={save} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={gradientColors} style={styles.saveBtn}>
                {loading ? <Spinner color={colors.onPrimary} /> : <Text style={styles.saveText}>Guardar</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surfaceContainer, borderTopLeftRadius: radius['3xl'], borderTopRightRadius: radius['3xl'], padding: spacing[6], maxHeight: '85%' },
  title: { fontSize: 20, fontWeight: '900', color: colors.onSurface, marginBottom: spacing[4] },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: `${colors.onSurfaceVariant}80`, marginBottom: 8, marginTop: spacing[3] },
  input: { backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: 'rgba(86,67,58,0.2)', borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: 12, color: colors.onSurface, fontSize: 15 },
  bio: { minHeight: 80, textAlignVertical: 'top' },
  error: { color: colors.error, fontSize: 13, marginTop: spacing[3] },
  saveBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.lg, marginTop: spacing[4], marginBottom: spacing[6] },
  saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800' },
})
