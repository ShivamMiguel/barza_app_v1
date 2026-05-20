import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable,
  TextInput, ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { ServiceWithSpace } from '../../lib/supabase'
import { createBooking } from '../../lib/bookings'
import { Spinner } from '../ui/Spinner'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const TIME_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30']

type Props = {
  visible: boolean
  onClose: () => void
  service: ServiceWithSpace
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function BookingCalendar({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const now = new Date()
  const [viewY, setViewY] = useState(now.getFullYear())
  const [viewM, setViewM] = useState(now.getMonth())
  const startOffset = (new Date(viewY, viewM, 1).getDay() + 6) % 7
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <View>
      <View style={cal.header}>
        <TouchableOpacity onPress={() => (viewM === 0 ? (setViewY(y => y - 1), setViewM(11)) : setViewM(m => m - 1))}>
          <Ionicons name="chevron-back" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={cal.month}>{MONTHS_PT[viewM]} {viewY}</Text>
        <TouchableOpacity onPress={() => (viewM === 11 ? (setViewY(y => y + 1), setViewM(0)) : setViewM(m => m + 1))}>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>
      <View style={cal.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e-${i}`} style={cal.cell} />
          const past = new Date(viewY, viewM, d) < new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const sel = value === toDateStr(viewY, viewM, d)
          return (
            <TouchableOpacity
              key={d}
              disabled={past}
              style={[cal.cell, sel && cal.cellSel, past && cal.cellPast]}
              onPress={() => onChange(toDateStr(viewY, viewM, d))}
            >
              <Text style={[cal.cellText, sel && cal.cellTextSel, past && cal.cellTextPast]}>{d}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const cal = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] },
  month: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  cellSel: { backgroundColor: colors.primaryContainer },
  cellPast: { opacity: 0.2 },
  cellText: { fontSize: 13, color: colors.onSurface },
  cellTextSel: { color: colors.onPrimary, fontWeight: '800' },
  cellTextPast: { color: colors.onSurfaceVariant },
})

export function BookingModal({ visible, onClose, service }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [home, setHome] = useState(false)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!visible) return
    setStep(1); setDate(''); setTime(''); setHome(false); setDescription('')
    setError(null); setSuccess(false); setLoading(false)
  }, [visible])

  function handleClose() {
    onClose()
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      await createBooking({
        service_id: service.id,
        professional_space_id: service.professional_space.id,
        booking_date: date,
        booking_time: time,
        description: description || null,
        home,
        total_price: service.preco_promocional ?? service.price,
      })
      setSuccess(true)
    } catch (e: any) {
      setError(e.message ?? 'Ocorreu um erro. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  const price = (service.preco_promocional ?? service.price).toLocaleString('pt-AO')
  const canAdvance = step === 1 ? !!date : step === 2 ? !!time : true

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          {success ? (
            <View style={styles.success}>
              <Ionicons name="checkmark-circle" size={56} color="#4ade80" />
              <Text style={styles.successTitle}>Pedido enviado!</Text>
              <Text style={styles.successDesc}>O espaço irá confirmar a tua reserva em breve.</Text>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.85}>
                <LinearGradient colors={gradientColors} style={styles.doneBtn}>
                  <Text style={styles.doneText}>Fechar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.steps}>
                  {([1, 2, 3] as const).map(s => (
                    <View key={s} style={[styles.stepDot, s === step && styles.stepDotActive, s < step && styles.stepDotDone]} />
                  ))}
                </View>
                <TouchableOpacity onPress={handleClose}><Ionicons name="close" size={22} color={colors.onSurfaceVariant} /></TouchableOpacity>
              </View>
              <Text style={styles.serviceName}>{service.service_name}</Text>
              <Text style={styles.spaceName}>{service.professional_space.space_name}</Text>

              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                {step === 1 && <BookingCalendar value={date} onChange={setDate} />}
                {step === 2 && (
                  <View style={styles.timeGrid}>
                    {TIME_SLOTS.map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.timeSlot, time === t && styles.timeSlotSel]}
                        onPress={() => setTime(t)}
                      >
                        <Text style={[styles.timeText, time === t && styles.timeTextSel]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {step === 3 && (
                  <View style={styles.confirm}>
                    <Text style={styles.confirmRow}>Data: <Text style={styles.confirmVal}>{date}</Text></Text>
                    <Text style={styles.confirmRow}>Hora: <Text style={styles.confirmVal}>{time}</Text></Text>
                    <Text style={styles.confirmRow}>Total: <Text style={styles.confirmVal}>{price} Kz</Text></Text>
                    <TouchableOpacity style={styles.homeRow} onPress={() => setHome(h => !h)}>
                      <Ionicons name={home ? 'checkbox' : 'square-outline'} size={20} color={colors.primaryContainer} />
                      <Text style={styles.homeText}>Serviço ao domicílio</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.notes}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Notas (opcional)"
                      placeholderTextColor="#52525b"
                      multiline
                    />
                    {error && <Text style={styles.error}>{error}</Text>}
                  </View>
                )}
              </ScrollView>

              <View style={styles.footer}>
                {step > 1 && (
                  <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => (s - 1) as 1 | 2 | 3)}>
                    <Text style={styles.backText}>Voltar</Text>
                  </TouchableOpacity>
                )}
                {step < 3 ? (
                  <TouchableOpacity
                    style={[styles.nextWrap, !canAdvance && { opacity: 0.4 }]}
                    disabled={!canAdvance}
                    onPress={() => setStep(s => (s + 1) as 1 | 2 | 3)}
                  >
                    <LinearGradient colors={gradientColors} style={styles.nextBtn}>
                      <Text style={styles.nextText}>Continuar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.nextWrap} onPress={handleSubmit} disabled={loading}>
                    <LinearGradient colors={gradientColors} style={styles.nextBtn}>
                      {loading ? <Spinner color={colors.onPrimary} /> : <Text style={styles.nextText}>Confirmar</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 2, borderTopColor: colors.primaryContainer, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing[6], paddingBottom: spacing[3] },
  steps: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: `${colors.onSurfaceVariant}30` },
  stepDotActive: { width: 20, backgroundColor: colors.primaryContainer },
  stepDotDone: { backgroundColor: `${colors.primaryContainer}60` },
  serviceName: { fontSize: 18, fontWeight: '800', color: colors.onSurface, paddingHorizontal: spacing[6] },
  spaceName: { fontSize: 12, color: colors.onSurfaceVariant, paddingHorizontal: spacing[6], marginBottom: spacing[4] },
  body: { paddingHorizontal: spacing[6], maxHeight: 360 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(86,67,58,0.3)' },
  timeSlotSel: { borderColor: colors.primaryContainer, backgroundColor: 'rgba(255,145,86,0.15)' },
  timeText: { fontSize: 13, color: colors.onSurface },
  timeTextSel: { color: colors.primaryContainer, fontWeight: '700' },
  confirm: { gap: spacing[3] },
  confirmRow: { fontSize: 14, color: colors.onSurfaceVariant },
  confirmVal: { color: colors.onSurface, fontWeight: '700' },
  homeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing[2] },
  homeText: { fontSize: 14, color: colors.onSurface },
  notes: { backgroundColor: colors.surfaceContainer, borderRadius: radius.lg, padding: spacing[4], color: colors.onSurface, minHeight: 80, textAlignVertical: 'top', marginTop: spacing[2] },
  error: { color: colors.error, fontSize: 13 },
  footer: { flexDirection: 'row', gap: spacing[3], padding: spacing[6], paddingBottom: spacing[8] },
  backBtn: { paddingVertical: 14, paddingHorizontal: spacing[5], borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(86,67,58,0.3)' },
  backText: { color: colors.onSurfaceVariant, fontWeight: '700' },
  nextWrap: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  nextBtn: { paddingVertical: 14, alignItems: 'center' },
  nextText: { color: colors.onPrimary, fontWeight: '800', fontSize: 15 },
  success: { alignItems: 'center', padding: spacing[10], gap: spacing[4] },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.onSurface },
  successDesc: { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center' },
  doneBtn: { paddingHorizontal: spacing[10], paddingVertical: 14, borderRadius: radius.full, marginTop: spacing[4] },
  doneText: { color: colors.onPrimary, fontWeight: '800' },
})
