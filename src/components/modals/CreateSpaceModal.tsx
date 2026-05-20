import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView, Image, Switch,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { nominatimSearch, nominatimReverse, LocationData } from '../../lib/nominatim'
import { DIAL_CODES, DEFAULT_DIAL_CODE, type CountryDialCode } from '../../lib/locations'
import { createProfessionalSpace } from '../../lib/spaces'
import { Spinner } from '../ui/Spinner'
import { colors, gradientColors, spacing, radius } from '../../lib/theme'

const SERVICE_CATEGORIES = [
  { id: 'corte', label: 'Corte Clássico' },
  { id: 'barba', label: 'Barba & Ritual' },
  { id: 'colorimetria', label: 'Colorimetria' },
  { id: 'tratamento', label: 'Tratamento' },
  { id: 'trancas', label: 'Tranças' },
  { id: 'manicure', label: 'Manicure' },
  { id: 'maquilhagem', label: 'Maquilhagem' },
  { id: 'sobrancelhas', label: 'Sobrancelhas' },
]

type Step = 1 | 2 | 3 | 4

type Props = {
  visible: boolean
  onClose: () => void
  onCreated?: () => void
}

function ProgressBars({ step }: { step: Step }) {
  return (
    <View style={progress.row}>
      {([1, 2, 3, 4] as Step[]).map(n => (
        <View key={n} style={[progress.bar, n === step && progress.barActive, n < step && progress.barDone]} />
      ))}
    </View>
  )
}

const progress = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: spacing[6] },
  bar: { height: 3, width: 24, borderRadius: 2, backgroundColor: 'rgba(255,145,86,0.1)' },
  barActive: { width: 48, backgroundColor: colors.primaryContainer },
  barDone: { backgroundColor: 'rgba(255,145,86,0.4)' },
})

export function CreateSpaceModal({ visible, onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [spaceName, setSpaceName] = useState('')
  const [logoUri, setLogoUri] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<LocationData[]>([])
  const [location, setLocation] = useState<LocationData | null>(null)
  const [dial, setDial] = useState<CountryDialCode>(DEFAULT_DIAL_CODE)
  const [phone, setPhone] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [timeIn, setTimeIn] = useState('09:00')
  const [timeOut, setTimeOut] = useState('19:00')
  const [available, setAvailable] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setStep(1); setSpaceName(''); setLogoUri(null); setQuery(''); setSuggestions([])
    setLocation(null); setDial(DEFAULT_DIAL_CODE); setPhone(''); setSelectedServices([])
    setTimeIn('09:00'); setTimeOut('19:00'); setAvailable(true); setError(null); setLoading(false)
  }, [visible])

  useEffect(() => {
    if (!query.trim() || query.length < 3) { setSuggestions([]); return }
    const t = setTimeout(() => nominatimSearch(query).then(setSuggestions).catch(() => setSuggestions([])), 380)
    return () => clearTimeout(t)
  }, [query])

  async function pickLogo() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8 })
    if (!res.canceled && res.assets[0]) setLogoUri(res.assets[0].uri)
  }

  async function detectLocation() {
    setDetecting(true)
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') { setDetecting(false); return }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const loc = await nominatimReverse(pos.coords.latitude, pos.coords.longitude)
      setLocation(loc); setQuery(loc.address); setSuggestions([])
    } catch { setError('Não foi possível detetar localização.') }
    finally { setDetecting(false) }
  }

  function toggleService(id: string) {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function nextStep() {
    setError(null)
    if (step === 1 && !spaceName.trim()) { setError('Nome do espaço é obrigatório.'); return }
    if (step === 2 && !location) { setError('Seleciona uma localização.'); return }
    if (step < 4) setStep((step + 1) as Step)
  }

  async function submit() {
    setLoading(true)
    setError(null)
    const labels = SERVICE_CATEGORIES.filter(s => selectedServices.includes(s.id)).map(s => s.label)
    const fullPhone = phone.trim() ? `${dial.dial}${phone.replace(/\D/g, '')}` : undefined
    try {
      await createProfessionalSpace({
        space_name: spaceName.trim(),
        phone: fullPhone,
        time_in: timeIn,
        time_out: timeOut,
        beauty_services: labels.join(', '),
        available,
        location_space: location as Record<string, unknown> | null,
        logoUri,
      })
      onCreated?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar espaço.')
    } finally {
      setLoading(false)
    }
  }

  const serviceLabels = SERVICE_CATEGORIES.filter(s => selectedServices.includes(s.id)).map(s => s.label)

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.modalTitle}>Criar Página Profissional</Text>
          <ProgressBars step={step} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {step === 1 && (
              <>
                <Text style={styles.stepTag}>Identidade do Espaço</Text>
                <Text style={styles.label}>Nome do Espaço *</Text>
                <TextInput style={styles.input} value={spaceName} onChangeText={setSpaceName} placeholder="Ex: Studio Fade..." placeholderTextColor="#52525b" autoFocus />
                <Text style={styles.label}>Logo / Capa</Text>
                <TouchableOpacity style={styles.logoArea} onPress={pickLogo}>
                  {logoUri ? <Image source={{ uri: logoUri }} style={styles.logoImg} /> : (
                    <View style={styles.logoPlaceholder}>
                      <Ionicons name="image-outline" size={28} color={`${colors.onSurfaceVariant}25`} />
                      <Text style={styles.logoHint}>Carregar imagem</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.stepTag}>Localização</Text>
                <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Pesquisar morada..." placeholderTextColor="#52525b" />
                {suggestions.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.suggestion} onPress={() => { setLocation(s); setQuery(s.address); setSuggestions([]) }}>
                    <Ionicons name="location" size={14} color={colors.primaryContainer} />
                    <Text style={styles.suggestionText} numberOfLines={2}>{s.address}</Text>
                  </TouchableOpacity>
                ))}
                {location && (
                  <View style={styles.selectedLoc}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primaryContainer} />
                    <Text style={styles.selectedText} numberOfLines={2}>{location.address}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.detectBtn} onPress={detectLocation} disabled={detecting}>
                  {detecting ? <Spinner diameter={18} color={colors.primaryContainer} /> : (
                    <>
                      <Ionicons name="locate" size={16} color={colors.primaryContainer} />
                      <Text style={styles.detectText}>Detetar localização</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={styles.label}>Contacto</Text>
                <View style={styles.phoneRow}>
                  <Text style={styles.dialFlag}>{dial.flag} {dial.dial}</Text>
                  <TextInput style={[styles.input, { flex: 1 }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="9xx xxx xxx" placeholderTextColor="#52525b" />
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.stepTag}>Serviços & Horário</Text>
                <View style={styles.serviceGrid}>
                  {SERVICE_CATEGORIES.map(svc => {
                    const sel = selectedServices.includes(svc.id)
                    return (
                      <TouchableOpacity key={svc.id} style={[styles.svcCard, sel && styles.svcCardSel]} onPress={() => toggleService(svc.id)}>
                        <Text style={[styles.svcLabel, sel && styles.svcLabelSel]}>{svc.label}</Text>
                        {sel && <Ionicons name="checkmark-circle" size={16} color={colors.primaryContainer} />}
                      </TouchableOpacity>
                    )
                  })}
                </View>
                <View style={styles.hoursRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Abre</Text>
                    <TextInput style={styles.input} value={timeIn} onChangeText={setTimeIn} placeholder="09:00" placeholderTextColor="#52525b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Fecha</Text>
                    <TextInput style={styles.input} value={timeOut} onChangeText={setTimeOut} placeholder="19:00" placeholderTextColor="#52525b" />
                  </View>
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Disponível</Text>
                  <Switch value={available} onValueChange={setAvailable} trackColor={{ true: colors.primaryContainer }} />
                </View>
              </>
            )}

            {step === 4 && (
              <>
                <Text style={styles.stepTag}>Confirmação</Text>
                <Text style={styles.summaryTitle}>Pronto para{'\n'}<Text style={{ color: colors.primaryContainer }}>Transformar.</Text></Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCell}><Text style={styles.summaryKey}>Identidade</Text><Text style={styles.summaryVal} numberOfLines={1}>{spaceName}</Text></View>
                  <View style={styles.summaryCell}><Text style={styles.summaryKey}>Local</Text><Text style={styles.summaryVal} numberOfLines={1}>{location?.city || '—'}</Text></View>
                  <View style={styles.summaryCell}><Text style={styles.summaryKey}>Serviços</Text><Text style={styles.summaryVal} numberOfLines={2}>{serviceLabels.join(', ') || '—'}</Text></View>
                  <View style={styles.summaryCell}><Text style={styles.summaryKey}>Horário</Text><Text style={styles.summaryVal}>{timeIn} – {timeOut}</Text></View>
                </View>
              </>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.footer}>
              {step > 1 && (
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep((step - 1) as Step)}>
                  <Text style={styles.backText}>Voltar</Text>
                </TouchableOpacity>
              )}
              {step < 4 ? (
                <TouchableOpacity style={{ flex: 1 }} onPress={nextStep} activeOpacity={0.85}>
                  <LinearGradient colors={gradientColors} style={styles.primaryBtn}>
                    <Text style={styles.primaryText}>Continuar</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={{ flex: 1 }} onPress={submit} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient colors={gradientColors} style={styles.primaryBtn}>
                    {loading ? <Spinner color={colors.onPrimary} /> : <Text style={styles.primaryText}>Criar Espaço</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1a120a', borderTopLeftRadius: radius['3xl'], borderTopRightRadius: radius['3xl'], padding: spacing[6], maxHeight: '92%', borderWidth: 1, borderColor: 'rgba(255,145,86,0.15)' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: `${colors.onSurfaceVariant}30`, alignSelf: 'center', marginBottom: spacing[4] },
  modalTitle: { fontSize: 18, fontWeight: '900', color: colors.white, marginBottom: spacing[2] },
  stepTag: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,145,86,0.6)', marginBottom: spacing[4] },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: `${colors.onSurfaceVariant}80`, marginBottom: 8 },
  input: { backgroundColor: '#0e0e0e', borderWidth: 1, borderColor: 'rgba(86,67,58,0.2)', borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: 14, color: colors.onSurface, fontSize: 15, marginBottom: spacing[3] },
  logoArea: { height: 120, borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing[4], borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' },
  logoImg: { width: '100%', height: '100%' },
  logoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoHint: { fontSize: 10, color: `${colors.onSurfaceVariant}30`, letterSpacing: 1, textTransform: 'uppercase' },
  suggestion: { flexDirection: 'row', gap: 10, padding: spacing[3], backgroundColor: '#0e0e0e', borderRadius: radius.lg, marginBottom: 6 },
  suggestionText: { flex: 1, fontSize: 12, color: colors.onSurface },
  selectedLoc: { flexDirection: 'row', gap: 8, padding: spacing[3], backgroundColor: 'rgba(255,145,86,0.08)', borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(255,145,86,0.2)', marginBottom: spacing[3] },
  selectedText: { flex: 1, fontSize: 12, color: colors.onSurface },
  detectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, marginBottom: spacing[4] },
  detectText: { color: colors.primaryContainer, fontWeight: '700', fontSize: 12 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  dialFlag: { fontSize: 14, color: colors.onSurface, paddingHorizontal: spacing[3], paddingVertical: 14, backgroundColor: '#0e0e0e', borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(86,67,58,0.2)' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] },
  svcCard: { width: '47%', padding: spacing[4], backgroundColor: '#201f1f', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(86,67,58,0.15)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  svcCardSel: { backgroundColor: '#2a2a2a', borderColor: 'rgba(255,145,86,0.4)' },
  svcLabel: { fontSize: 12, fontWeight: '600', color: colors.onSurface, flex: 1 },
  svcLabelSel: { color: colors.primaryContainer },
  hoursRow: { flexDirection: 'row', gap: spacing[3] },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] },
  summaryTitle: { fontSize: 28, fontWeight: '900', color: colors.white, lineHeight: 32, marginBottom: spacing[4] },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginBottom: spacing[4] },
  summaryCell: { width: '47%', padding: spacing[4], backgroundColor: '#1c1b1b', borderRadius: radius.lg },
  summaryKey: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: `${colors.onSurfaceVariant}60`, marginBottom: 4 },
  summaryVal: { fontSize: 13, fontWeight: '600', color: colors.onSurface },
  error: { color: colors.error, fontSize: 13, marginBottom: spacing[3] },
  footer: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[2], marginBottom: spacing[4] },
  backBtn: { paddingHorizontal: spacing[5], paddingVertical: 14, justifyContent: 'center' },
  backText: { color: colors.onSurfaceVariant, fontWeight: '700', fontSize: 13 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: radius.lg },
  primaryText: { color: colors.onPrimary, fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
})
