import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Image,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { ProductWithSpace } from '../../lib/supabase'
import { createOrder } from '../../lib/orders'
import { Spinner } from '../ui/Spinner'
import { colors, gradientColors, spacing, radius } from '../../lib/theme'

type Props = {
  visible: boolean
  onClose: () => void
  product: ProductWithSpace
}

export function PurchaseModal({ visible, onClose, product }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const hasPromo = product.promo_price != null && product.promo_price < product.price
  const unitPrice = hasPromo ? product.promo_price! : product.price
  const total = unitPrice * quantity
  const space = product.professional_space

  useEffect(() => {
    if (!visible) return
    setQuantity(1); setError(null); setSuccess(false); setLoading(false)
  }, [visible])

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await createOrder({
        product_id: product.id,
        space_id: space.id,
        quantity,
        unitPrice,
      })
      setSuccess(true)
    } catch (e: any) {
      setError(e.message ?? 'Erro ao registar pedido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          {success ? (
            <View style={styles.success}>
              <Ionicons name="checkmark-circle" size={56} color="#4ade80" />
              <Text style={styles.successTitle}>Pedido registado!</Text>
              <Text style={styles.successDesc}>
                O teu pedido foi enviado ao espaço. Aguarda o contacto do vendedor para combinar o pagamento e entrega.
              </Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.85}>
                <LinearGradient colors={gradientColors} style={styles.doneBtn}>
                  <Text style={styles.doneText}>Fechar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View>
                  <Text style={styles.eyebrow}>Comprar produto</Text>
                  <Text style={styles.title}>{product.name}</Text>
                  <Text style={styles.sub}>{space.space_name}</Text>
                </View>
                <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={colors.onSurfaceVariant} /></TouchableOpacity>
              </View>
              {product.image_url && (
                <Image source={{ uri: product.image_url }} style={styles.img} resizeMode="cover" />
              )}
              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>Quantidade</Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={18} color={colors.onSurface} />
                  </TouchableOpacity>
                  <Text style={styles.qtyVal}>{quantity}</Text>
                  <TouchableOpacity onPress={() => setQuantity(q => Math.min(99, q + 1))} style={styles.qtyBtn}>
                    <Ionicons name="add" size={18} color={colors.onSurface} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalVal}>{total.toLocaleString('pt-AO')} Kz</Text>
              </View>
              {error && <Text style={styles.error}>{error}</Text>}
              <TouchableOpacity onPress={handleConfirm} disabled={loading} activeOpacity={0.85} style={styles.confirmWrap}>
                <LinearGradient colors={gradientColors} style={styles.confirmBtn}>
                  {loading ? <Spinner color={colors.onPrimary} /> : (
                    <>
                      <Ionicons name="bag-outline" size={16} color={colors.onPrimary} />
                      <Text style={styles.confirmText}>Confirmar pedido</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing[6], paddingBottom: spacing[10], gap: spacing[4] },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center', marginBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: `${colors.onSurfaceVariant}60` },
  title: { fontSize: 18, fontWeight: '800', color: colors.onSurface, marginTop: 4 },
  sub: { fontSize: 12, color: colors.onSurfaceVariant },
  img: { width: '100%', height: 160, borderRadius: radius['2xl'] },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyLabel: { fontSize: 14, color: colors.onSurface },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  qtyVal: { fontSize: 18, fontWeight: '800', color: colors.onSurface, minWidth: 24, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: 'rgba(86,67,58,0.15)' },
  totalLabel: { fontSize: 14, color: colors.onSurfaceVariant },
  totalVal: { fontSize: 20, fontWeight: '900', color: colors.primaryContainer },
  error: { color: colors.error, fontSize: 13 },
  confirmWrap: { borderRadius: radius.lg, overflow: 'hidden', marginTop: spacing[2] },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  confirmText: { color: colors.onPrimary, fontWeight: '800', fontSize: 15 },
  success: { alignItems: 'center', padding: spacing[8], gap: spacing[4] },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.onSurface },
  successDesc: { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  doneBtn: { paddingHorizontal: spacing[10], paddingVertical: 14, borderRadius: radius.full, marginTop: spacing[4] },
  doneText: { color: colors.onPrimary, fontWeight: '800' },
})
