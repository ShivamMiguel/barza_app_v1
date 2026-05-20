import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Pressable,
  ScrollView, Image, Switch,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { ProfessionalSpace, updateProfessionalSpace } from '../../lib/spaces'
import {
  SPACE_SERVICE_CATEGORIES,
  categoryIdsFromBeautyServices,
  labelsFromCategoryIds,
} from '../../lib/space-categories'
import { DIAL_CODES, DEFAULT_DIAL_CODE, type CountryDialCode } from '../../lib/locations'
import { nominatimSearch, type LocationData } from '../../lib/nominatim'
import { Spinner } from '../ui/Spinner'
import { colors, gradientColors, spacing, radius } from '../../lib/theme'

type Props = {
  visible: boolean
  onClose: () => void
  space: ProfessionalSpace
  onSaved: (space: ProfessionalSpace) => void
}

function locationFromSpace(raw: Record<string, unknown> | null): LocationData | null {
  if (!raw || raw.latitude == null) return null
  return {
    city: String(raw.city ?? ''),
    street: String(raw.street ?? ''),
    address: String(raw.address ?? ''),
    country: String(raw.country ?? ''),
    latitude: Number(raw.latitude),
    longitude: Number(raw.longitude),
    neighborhood: String(raw.neighborhood ?? ''),
  }
}

function parsePhone(raw: string | null | undefined): { dial: CountryDialCode; local: string } {
  const phone = raw ?? ''
  const matched = DIAL_CODES.find(c => phone.startsWith(c.dial))
  if (matched) {
    return { dial: matched, local: phone.slice(matched.dial.length).trim() }
  }
  return { dial: DEFAULT_DIAL_CODE, local: phone }
}

export function EditSpaceModal({ visible, onClose, space, onSaved }: Props) {
  const [spaceName, setSpaceName] = useState(space.space_name)
  const [available, setAvailable] = useState(space.available ?? false)
  const [dial, setDial] = useState<CountryDialCode>(DEFAULT_DIAL_CODE)
  const [phone, setPhone] = useState('')
  const [timeIn, setTimeIn] = useState('')
  const [timeOut, setTimeOut] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [logoUri, setLogoUri] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(space.logo ?? null)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [locationSearch, setLocationSearch] = useState('')
  const [locationResults, setLocationResults] = useState<LocationData[]>([])
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [locationSearching, setLocationSearching] = useState(false)
  const [dialPickerOpen, setDialPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    const { dial: d, local } = parsePhone(space.phone)
    const loc = space.location_space as Record<string, unknown> | null
    setSpaceName(space.space_name)
    setAvailable(space.available ?? false)
    setDial(d)
    setPhone(local)
    setTimeIn(space.time_in?.slice(0, 5) ?? '')
    setTimeOut(space.time_out?.slice(0, 5) ?? '')
    setSelectedCategories(categoryIdsFromBeautyServices(space.beauty_services))
    setLogoUri(null)
    setLogoPreview(space.logo ?? null)
    setLocation(locationFromSpace(loc))
    setLocationSearch('')
    setLocationResults([])
    setShowLocationSearch(false)
    setError(null)
  }, [visible, space])

  useEffect(() => {
    if (!locationSearch.trim() || locationSearch.length < 2) {
      setLocationResults([])
      return
    }
    const t = setTimeout(async () => {
      setLocationSearching(true)
      try {
        setLocationResults(await nominatimSearch(locationSearch))
      } catch {
        setLocationResults([])
      } finally {
        setLocationSearching(false)
      }
    }, 380)
    return () => clearTimeout(t)
  }, [locationSearch])

  async function pickLogo() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!res.canceled && res.assets[0]) {
      setLogoUri(res.assets[0].uri)
      setLogoPreview(res.assets[0].uri)
    }
  }

  function toggleCategory(id: string) {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    )
  }

  const locDisplay = location
    ? [location.neighborhood, location.city, location.country].filter(Boolean).join(', ')
    : null

  async function handleSave() {
    if (!spaceName.trim()) {
      setError('Nome obrigatório.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const fullPhone = phone.trim() ? `${dial.dial}${phone.replace(/\D/g, '')}` : null
      const updated = await updateProfessionalSpace(space.id, {
        space_name: spaceName.trim(),
        available,
        phone: fullPhone,
        time_in: timeIn || null,
        time_out: timeOut || null,
        beauty_services: labelsFromCategoryIds(selectedCategories).join(', ') || null,
        location_space: location as Record<string, unknown> | null,
        logoUri: logoUri ?? undefined,
      })
      onSaved(updated)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>Editar Espaço</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>{space.space_name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.form}
          >
            <Text style={styles.label}>Logo</Text>
            <TouchableOpacity style={styles.logoBox} onPress={pickLogo} activeOpacity={0.9}>
              {logoPreview ? (
                <Image source={{ uri: logoPreview }} style={styles.logoImg} />
              ) : (
                <Ionicons name="camera-outline" size={28} color={`${colors.onSurfaceVariant}40`} />
              )}
              <View style={styles.logoOverlay}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={styles.label}>Nome do Espaço *</Text>
            <TextInput
              style={styles.input}
              value={spaceName}
              onChangeText={setSpaceName}
              placeholder="Nome do espaço"
              placeholderTextColor={`${colors.onSurfaceVariant}40`}
            />

            <View style={styles.availableRow}>
              <View>
                <Text style={styles.availableTitle}>Disponível</Text>
                <Text style={styles.availableSub}>Aceitar agendamentos</Text>
              </View>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ true: colors.primaryContainer, false: '#3f3f46' }}
              />
            </View>

            <Text style={styles.label}>Telefone</Text>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={styles.dialBtn}
                onPress={() => setDialPickerOpen(o => !o)}
              >
                <Text style={styles.dialText}>{dial.flag} {dial.dial}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="000 000 000"
                placeholderTextColor={`${colors.onSurfaceVariant}40`}
              />
            </View>
            {dialPickerOpen ? (
              <View style={styles.dialList}>
                {DIAL_CODES.map(c => (
                  <TouchableOpacity
                    key={c.code}
                    style={styles.dialOption}
                    onPress={() => { setDial(c); setDialPickerOpen(false) }}
                  >
                    <Text>{c.flag} {c.dial}</Text>
                    <Text style={styles.dialName}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <View style={styles.hoursRow}>
              <View style={styles.hourCol}>
                <Text style={styles.label}>Abertura</Text>
                <TextInput
                  style={styles.input}
                  value={timeIn}
                  onChangeText={setTimeIn}
                  placeholder="09:00"
                  placeholderTextColor={`${colors.onSurfaceVariant}40`}
                />
              </View>
              <View style={styles.hourCol}>
                <Text style={styles.label}>Encerramento</Text>
                <TextInput
                  style={styles.input}
                  value={timeOut}
                  onChangeText={setTimeOut}
                  placeholder="19:00"
                  placeholderTextColor={`${colors.onSurfaceVariant}40`}
                />
              </View>
            </View>

            <Text style={styles.label}>Categorias de Serviço</Text>
            <View style={styles.catGrid}>
              {SPACE_SERVICE_CATEGORIES.map(cat => {
                const active = selectedCategories.includes(cat.id)
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => toggleCategory(cat.id)}
                  >
                    <Text style={[styles.catText, active && styles.catTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={styles.locHeader}>
              <Text style={styles.label}>Localização</Text>
              <TouchableOpacity onPress={() => setShowLocationSearch(o => !o)}>
                <Text style={styles.locToggle}>
                  {showLocationSearch ? 'Fechar' : 'Atualizar'}
                </Text>
              </TouchableOpacity>
            </View>
            {locDisplay && !showLocationSearch ? (
              <View style={styles.locCurrent}>
                <Ionicons name="location" size={14} color={colors.primaryContainer} />
                <Text style={styles.locCurrentText} numberOfLines={2}>{locDisplay}</Text>
              </View>
            ) : null}
            {showLocationSearch ? (
              <>
                <TextInput
                  style={styles.input}
                  value={locationSearch}
                  onChangeText={setLocationSearch}
                  placeholder="Pesquisar localização…"
                  placeholderTextColor={`${colors.onSurfaceVariant}40`}
                />
                {locationSearching ? (
                  <Spinner diameter={20} color={colors.primaryContainer} />
                ) : null}
                {locationResults.map((loc, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestion}
                    onPress={() => {
                      setLocation(loc)
                      setLocationSearch('')
                      setLocationResults([])
                      setShowLocationSearch(false)
                    }}
                  >
                    <Text style={styles.suggestionTitle}>
                      {loc.city || loc.neighborhood}
                      {loc.country ? ` · ${loc.country}` : ''}
                    </Text>
                    <Text style={styles.suggestionAddr} numberOfLines={1}>{loc.address}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveWrap}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.9}
              >
                <LinearGradient colors={gradientColors} style={styles.saveBtn}>
                  {saving ? (
                    <Spinner color={colors.onPrimary} />
                  ) : (
                    <Text style={styles.saveText}>Guardar Alterações</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0e0e0e',
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255,145,86,0.2)',
    borderTopWidth: 2,
    borderTopColor: colors.primaryContainer,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: `${colors.onSurfaceVariant}30`,
    alignSelf: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(86,67,58,0.12)',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: `${colors.primaryContainer}99`,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.onSurface,
    marginTop: 4,
    maxWidth: 280,
  },
  form: { padding: spacing[6], paddingBottom: spacing[10], gap: spacing[3] },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: `${colors.onSurfaceVariant}50`,
    marginBottom: 6,
    marginTop: spacing[2],
  },
  input: {
    backgroundColor: '#0e0e0e',
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.25)',
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
    color: colors.onSurface,
    fontSize: 14,
    marginBottom: spacing[2],
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(86,67,58,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  logoImg: { width: '100%', height: '100%' },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.15)',
    marginVertical: spacing[2],
  },
  availableTitle: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  availableSub: { fontSize: 12, color: `${colors.onSurfaceVariant}99`, marginTop: 2 },
  phoneRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  dialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#0e0e0e',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.25)',
  },
  dialText: { fontSize: 13, color: colors.onSurface },
  phoneInput: { flex: 1, marginBottom: 0 },
  dialList: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.25)',
    backgroundColor: '#111',
    marginBottom: spacing[2],
    overflow: 'hidden',
  },
  dialOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing[4],
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(86,67,58,0.1)',
  },
  dialName: { fontSize: 12, color: colors.onSurfaceVariant },
  hoursRow: { flexDirection: 'row', gap: spacing[3] },
  hourCol: { flex: 1 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] },
  catChip: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.2)',
    backgroundColor: colors.surfaceContainer,
  },
  catChipActive: {
    borderColor: `${colors.primaryContainer}50`,
    backgroundColor: `${colors.primaryContainer}18`,
  },
  catText: { fontSize: 12, fontWeight: '600', color: `${colors.onSurfaceVariant}99` },
  catTextActive: { color: colors.primaryContainer },
  locHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  locToggle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryContainer,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  locCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing[3],
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.15)',
    marginBottom: spacing[2],
  },
  locCurrentText: { flex: 1, fontSize: 12, color: colors.onSurface },
  suggestion: {
    padding: spacing[3],
    backgroundColor: '#0e0e0e',
    borderRadius: radius.lg,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.15)',
  },
  suggestionTitle: { fontSize: 12, fontWeight: '700', color: colors.onSurface },
  suggestionAddr: { fontSize: 11, color: `${colors.onSurfaceVariant}50`, marginTop: 2 },
  error: { color: '#f87171', fontSize: 12, marginTop: spacing[2] },
  footer: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(86,67,58,0.25)',
    alignItems: 'center',
  },
  cancelText: { color: colors.onSurfaceVariant, fontWeight: '700', fontSize: 14 },
  saveWrap: { flex: 1 },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  saveText: {
    color: colors.onPrimary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
