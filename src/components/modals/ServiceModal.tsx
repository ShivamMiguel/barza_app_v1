import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView, Switch, Image,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { ProfessionalService, ProfessionalSpace, createService, updateService } from '../../lib/spaces'
import { Spinner } from '../ui/Spinner'
import { colors, gradientColors, spacing, radius } from '../../lib/theme'

const CATEGORIES = [
  'Corte Clássico', 'Barba & Ritual', 'Colorimetria', 'Tratamento',
  'Tranças', 'Manicure', 'Maquilhagem', 'Sobrancelhas', 'Outro',
]

type Props = {
  visible: boolean
  onClose: () => void
  space: ProfessionalSpace
  service?: ProfessionalService | null
  onSaved: (service: ProfessionalService) => void
}

export function ServiceModal({ visible, onClose, space, service, onSaved }: Props) {
  const isEdit = !!service
  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [price, setPrice] = useState('')
  const [promo, setPromo] = useState('')
  const [duration, setDuration] = useState('30')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    if (service) {
      setName(service.service_name)
      setCategory(service.category)
      setPrice(String(service.price))
      setPromo(service.preco_promocional ? String(service.preco_promocional) : '')
      setDuration(String(service.duration_minutes))
      setDescription(service.description ?? '')
      setIsActive(service.is_active)
      setImageUri(service.image ?? null)
    } else {
      setName(''); setCategory(CATEGORIES[0]); setPrice(''); setPromo('')
      setDuration('30'); setDescription(''); setIsActive(true); setImageUri(null)
    }
    setError(null)
  }, [visible, service])

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri)
  }

  async function save() {
    if (!name.trim() || !price.trim()) { setError('Nome e preço são obrigatórios.'); return }
    setLoading(true)
    setError(null)
    try {
      const payload = {
        professional_space_id: space.id,
        service_name: name.trim(),
        category,
        price: parseFloat(price),
        duration_minutes: parseInt(duration, 10) || 30,
        preco_promocional: promo.trim() ? parseFloat(promo) : null,
        description: description.trim() || null,
        is_active: isActive,
        imageUri: imageUri?.startsWith('file') ? imageUri : undefined,
      }
      const saved = isEdit && service
        ? await updateService(service.id, payload)
        : await createService(payload)
      onSaved(saved)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>{isEdit ? 'Editar Serviço' : 'Novo Serviço'}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
              {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : <Text style={styles.imageHint}>+ Imagem</Text>}
            </TouchableOpacity>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome do serviço" placeholderTextColor="#52525b" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.cat, category === c && styles.catSel]} onPress={() => setCategory(c)}>
                  <Text style={[styles.catText, category === c && styles.catTextSel]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Preço (Kz)" placeholderTextColor="#52525b" />
              <TextInput style={[styles.input, { flex: 1 }]} value={promo} onChangeText={setPromo} keyboardType="numeric" placeholder="Promo (opc.)" placeholderTextColor="#52525b" />
            </View>
            <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="Duração (min)" placeholderTextColor="#52525b" />
            <TextInput style={[styles.input, styles.bio]} value={description} onChangeText={setDescription} multiline placeholder="Descrição" placeholderTextColor="#52525b" />
            <View style={styles.switchRow}>
              <Text style={styles.label}>Activo</Text>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primaryContainer }} />
            </View>
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
  sheet: { backgroundColor: colors.surfaceContainer, borderTopLeftRadius: radius['3xl'], borderTopRightRadius: radius['3xl'], padding: spacing[6], maxHeight: '90%' },
  title: { fontSize: 20, fontWeight: '900', color: colors.onSurface, marginBottom: spacing[4] },
  imageBox: { height: 120, borderRadius: radius.xl, backgroundColor: colors.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[3], overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  imageHint: { color: `${colors.onSurfaceVariant}40`, fontSize: 12 },
  input: { backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: 'rgba(86,67,58,0.2)', borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: 12, color: colors.onSurface, fontSize: 15, marginBottom: spacing[3] },
  bio: { minHeight: 72, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing[3] },
  catRow: { marginBottom: spacing[3] },
  cat: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, marginRight: 8, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: 'rgba(86,67,58,0.15)' },
  catSel: { borderColor: colors.primaryContainer, backgroundColor: 'rgba(255,145,86,0.12)' },
  catText: { fontSize: 11, color: colors.onSurfaceVariant },
  catTextSel: { color: colors.primaryContainer, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant },
  error: { color: colors.error, fontSize: 13, marginBottom: spacing[3] },
  saveBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.lg, marginBottom: spacing[6] },
  saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800' },
})
