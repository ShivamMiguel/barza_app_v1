import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useCommunity } from '../../context/CommunityContext'
import { fetchMarketInsights } from '../../lib/market-insights'
import { parseAiInsights, parseBullets, findSection } from '../../lib/market-insights-parsers'
import { getMySpaces } from '../../lib/spaces'
import { CreateSpaceModal } from '../../components/modals/CreateSpaceModal'
import { Spinner } from '../../components/ui/Spinner'
import { colors, gradientColors, spacing, radius, typography } from '../../lib/theme'

function fmt(n: number) { return n.toLocaleString('pt-AO') }

export function MarketInsightsScreen() {
  const { marketInsights: cached, isLoadingChrome } = useCommunity()
  const [data, setData] = useState<unknown | null>(cached)
  const [loading, setLoading] = useState(isLoadingChrome)
  const [hasSpace, setHasSpace] = useState<boolean | null>(null)
  const [gateOpen, setGateOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    getMySpaces().then(({ spaces }) => {
      const ok = spaces.length > 0
      setHasSpace(ok)
      setGateOpen(!ok)
    })
  }, [])

  useEffect(() => {
    if (cached) { setData(cached); setLoading(false); return }
    fetchMarketInsights().then(d => { setData(d); setLoading(false) })
  }, [cached])

  if (loading) {
    return (
      <View style={styles.centered}>
        <Spinner diameter={36} color={colors.primaryContainer} />
      </View>
    )
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erro ao carregar dados.</Text>
      </View>
    )
  }

  const md = data as Record<string, any>
  const mi = md.market_insights ?? {}
  const interp = md.interpretation ?? {}
  const uc = md.user_context
  const mainSpace = uc?.spaces?.[0]
  const mainSpaceId = mainSpace?.id
  const spaceName = mainSpace?.space_name ?? 'Market'
  const zones = Object.entries(mi.services_by_zone ?? {}) as [string, { total_revenue: number; total_services: number; average_price?: number }][]
  const pros = Object.entries(mi.most_active_professionals ?? {}) as [string, { professional: string; total_services: number; estimated_revenue: number }][]
  const tickets = Object.entries(mi.ticket_average_per_space ?? {}) as [string, { space_name: string; total_services: number; total_value: number; average_ticket: number }][]
  const hours = (mi.peak_demand_hours ?? []) as { hour: string; demand: number }[]
  const perf = mi.post_performance
  const signals = md.global_beauty_signals ?? []
  const totalRevenue = zones.reduce((s, [, z]) => s + z.total_revenue, 0)
  const totalServices = zones.reduce((s, [, z]) => s + z.total_services, 0)
  const topHours = [...hours].sort((a, b) => b.demand - a.demand).slice(0, 6)
  const maxDemand = Math.max(...topHours.map(h => h.demand), 1)
  const maxProRevenue = Math.max(...pros.map(([, p]) => p.estimated_revenue), 1)

  const userTicket = mainSpaceId ? mi.ticket_average_per_space?.[mainSpaceId] : null
  const userRevenue = userTicket?.total_value ?? 0
  const userServices = userTicket?.total_services ?? 0
  const userAvgTicket = userTicket?.average_ticket ?? 0
  const marketAvgTicket = totalServices > 0 ? Math.round(totalRevenue / totalServices) : 0
  const shareServices = totalServices > 0 ? Math.round((userServices / totalServices) * 100) : 0
  const shareRevenue = totalRevenue > 0 ? Math.round((userRevenue / totalRevenue) * 100) : 0

  const aiParsed = md.ai_insights ? parseAiInsights(md.ai_insights as string) : null
  const successItems = aiParsed ? parseBullets(findSection(aiParsed.sections, 'funcionar')?.content ?? '', 3) : []
  const failureItems = aiParsed ? parseBullets(findSection(aiParsed.sections, 'falhar')?.content ?? '', 2) : []
  const opportunitySection = aiParsed ? (findSection(aiParsed.sections, 'oportunidades') ?? findSection(aiParsed.sections, 'estratégia')) : null
  const opportunityItems = opportunitySection ? parseBullets(opportunitySection.content, 3) : []
  const aiRecs = (md.ai_market_report?.ai_recommendations ?? []) as { title: string; content: string }[]

  return (
    <>
      <Modal visible={gateOpen && hasSpace === false} transparent animationType="fade">
        <Pressable style={styles.gateBackdrop}>
          <View style={styles.gateCard}>
            <View style={styles.gateIcon}>
              <Ionicons name="lock-closed" size={36} color={colors.primaryContainer} />
            </View>
            <Text style={styles.gateTitle}>Acesso Restrito</Text>
            <Text style={styles.gateDesc}>
              Os insights de mercado estão disponíveis apenas para profissionais com uma página registada na Barza.
            </Text>
            <TouchableOpacity style={styles.gateBtnWrap} activeOpacity={0.85} onPress={() => { setGateOpen(false); setCreateOpen(true) }}>
              <LinearGradient colors={gradientColors} style={styles.gateBtn}>
                <Text style={styles.gateBtnText}>Criar Página Profissional</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGateOpen(false)}>
              <Text style={styles.gateBack}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        pointerEvents={gateOpen && !hasSpace ? 'none' : 'auto'}
      >
        <Text style={styles.eyebrow}>Relatório Estratégico Mensal</Text>
        <Text style={styles.pageTitle}>{spaceName.length > 24 ? spaceName.slice(0, 24).trimEnd() + '…' : spaceName}</Text>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titleBar} />

        {/* KPIs */}
        <View style={styles.kpiRow}>
          {[
            { label: 'Receita Total', value: `${fmt(totalRevenue)} Kz` },
            { label: 'Serviços', value: String(totalServices) },
            perf ? { label: 'Engage', value: `${perf.engagement_rate}%` } : null,
          ].filter(Boolean).map((k, i) => (
            <View key={i} style={styles.kpi}>
              <Text style={styles.kpiValue}>{k!.value}</Text>
              <Text style={styles.kpiLabel}>{k!.label}</Text>
            </View>
          ))}
        </View>

        {/* Interpretation */}
        {(interp.market_status || interp.growth_signal || interp.recommendation) && (
          <View style={styles.card}>
            {interp.market_status && <Text style={styles.cardTitle}>{interp.market_status}</Text>}
            {interp.growth_signal && <Text style={styles.cardBody}>{interp.growth_signal}</Text>}
            {interp.recommendation && <Text style={styles.cardBody}>{interp.recommendation}</Text>}
            {interp.best_time_strategy && <Text style={[styles.cardBody, { color: colors.primaryContainer }]}>{interp.best_time_strategy}</Text>}
          </View>
        )}

        {/* Business summary */}
        {(userTicket || totalRevenue > 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Resumo do Negócio</Text>
            <View style={styles.kpiRow}>
              <View style={styles.kpi}><Text style={styles.kpiValue}>{userServices || totalServices}</Text><Text style={styles.kpiLabel}>Serviços</Text></View>
              <View style={styles.kpi}><Text style={styles.kpiValue}>{fmt(userRevenue || totalRevenue)}</Text><Text style={styles.kpiLabel}>Receita Kz</Text></View>
              <View style={styles.kpi}><Text style={[styles.kpiValue, { color: colors.primaryContainer }]}>{fmt(userAvgTicket || marketAvgTicket)}</Text><Text style={styles.kpiLabel}>Ticket</Text></View>
            </View>
            {(shareServices > 0 || shareRevenue > 0) && (
              <View style={styles.shareRow}>
                {shareServices > 0 && <Text style={styles.shareText}>Market share serviços: {shareServices}%</Text>}
                {shareRevenue > 0 && <Text style={styles.shareText}>Eficiência receita: {shareRevenue}%</Text>}
              </View>
            )}
          </View>
        )}

        {/* AI success / failure */}
        {(successItems.length > 0 || failureItems.length > 0) && (
          <View style={styles.card}>
            {successItems.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.primaryContainer }]}>O Que Está a Funcionar</Text>
                {successItems.map((item, i) => (
                  <View key={`s-${i}`} style={styles.aiItem}>
                    {item.bold ? <Text style={styles.aiBold}>{item.bold}</Text> : null}
                    <Text style={styles.aiBody}>{item.rest || item.bold}</Text>
                  </View>
                ))}
              </>
            )}
            {failureItems.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: '#ff4757', marginTop: spacing[3] }]}>O Que Está a Falhar</Text>
                {failureItems.map((item, i) => (
                  <View key={`f-${i}`} style={[styles.aiItem, styles.aiItemDanger]}>
                    {item.bold ? <Text style={styles.aiBold}>{item.bold}</Text> : null}
                    <Text style={styles.aiBody}>{item.rest || item.bold}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {opportunityItems.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Oportunidades</Text>
            {opportunityItems.map((item, i) => (
              <View key={i} style={styles.aiItem}>
                {item.bold ? <Text style={styles.aiBold}>{item.bold}</Text> : null}
                <Text style={styles.aiBody}>{item.rest || item.bold}</Text>
              </View>
            ))}
          </View>
        )}

        {aiRecs.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Recomendações AI</Text>
            {aiRecs.slice(0, 4).map((rec, i) => (
              <View key={i} style={styles.aiItem}>
                <Text style={styles.aiBold}>{rec.title}</Text>
                <Text style={styles.aiBody}>{rec.content}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Zones */}
        {zones.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Zonas</Text>
            {zones.slice(0, 5).map(([zone, z]) => (
              <View key={zone} style={styles.listRow}>
                <Text style={styles.listTitle}>{zone}</Text>
                <Text style={styles.listMeta}>{z.total_services} srv · {fmt(z.total_revenue)} Kz</Text>
              </View>
            ))}
          </View>
        )}

        {/* Top professionals */}
        {pros.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Profissionais Activos</Text>
            {[...pros].sort((a, b) => b[1].estimated_revenue - a[1].estimated_revenue).slice(0, 5).map(([id, p]) => (
              <View key={id} style={styles.proRow}>
                <Text style={styles.listTitle} numberOfLines={1}>{p.professional}</Text>
                <View style={styles.proBarTrack}>
                  <View style={[styles.proBar, { width: `${Math.round((p.estimated_revenue / maxProRevenue) * 100)}%` }]} />
                </View>
                <Text style={styles.listMeta}>{fmt(p.estimated_revenue)} Kz</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tickets */}
        {tickets.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Ticket Médio por Espaço</Text>
            {[...tickets].sort((a, b) => b[1].average_ticket - a[1].average_ticket).slice(0, 5).map(([id, t]) => (
              <View key={id} style={styles.listRow}>
                <Text style={styles.listTitle} numberOfLines={1}>{t.space_name}</Text>
                <Text style={[styles.listMeta, { color: colors.primaryContainer }]}>{fmt(t.average_ticket)} Kz</Text>
              </View>
            ))}
          </View>
        )}

        {/* Peak hours */}
        {topHours.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Horas de Pico</Text>
            <View style={styles.chartRow}>
              {topHours.map((h, i) => {
                const pct = Math.round((h.demand / maxDemand) * 100)
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={[styles.bar, { height: Math.max(8, (pct / 100) * 80), backgroundColor: i === 0 ? colors.primaryContainer : 'rgba(255,145,86,0.2)' }]} />
                    <Text style={styles.barLabel}>{h.hour}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Post performance */}
        {perf && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Performance de Posts</Text>
            <View style={styles.kpiRow}>
              <View style={styles.kpi}><Text style={styles.kpiValue}>{perf.total_posts}</Text><Text style={styles.kpiLabel}>Posts</Text></View>
              <View style={styles.kpi}><Text style={styles.kpiValue}>{perf.total_likes}</Text><Text style={styles.kpiLabel}>Likes</Text></View>
              <View style={styles.kpi}><Text style={[styles.kpiValue, { color: colors.primaryContainer }]}>{perf.engagement_rate}%</Text><Text style={styles.kpiLabel}>Engage</Text></View>
            </View>
          </View>
        )}

        {/* Global signals */}
        {signals.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Sinais Globais de Beleza</Text>
            {signals.slice(0, 5).map((sig: any, i: number) => (
              <View key={i} style={styles.signalRow}>
                <Text style={styles.signalTitle} numberOfLines={1}>{sig.title}</Text>
                <Text style={styles.signalSummary} numberOfLines={2}>{sig.summary}</Text>
                <Text style={styles.signalSource}>{sig.source}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <CreateSpaceModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setHasSpace(true)
          setGateOpen(false)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12], gap: spacing[5] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.onSurfaceVariant },
  eyebrow: { ...typography.label, color: colors.primaryContainer },
  pageTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5, color: colors.onSurface },
  titleBar: { height: 4, width: 48, borderRadius: 2, marginBottom: spacing[2] },
  kpiRow: { flexDirection: 'row', gap: spacing[3] },
  kpi: { flex: 1, backgroundColor: 'rgba(255,145,86,0.06)', borderRadius: radius.xl, padding: spacing[4], alignItems: 'center' },
  kpiValue: { fontSize: 18, fontWeight: '900', color: colors.onSurface },
  kpiLabel: { ...typography.label, marginTop: 4, color: `${colors.onSurfaceVariant}60` },
  card: { backgroundColor: colors.surfaceContainer, borderRadius: radius['3xl'], padding: spacing[5], gap: spacing[3], borderTopWidth: 1, borderTopColor: 'rgba(86,67,58,0.1)' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.onSurface, lineHeight: 20 },
  cardBody: { fontSize: 12, color: `${colors.onSurfaceVariant}80`, lineHeight: 18 },
  sectionLabel: { ...typography.label, color: `${colors.onSurfaceVariant}60` },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 96, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', borderRadius: 4, minHeight: 8 },
  barLabel: { fontSize: 8, color: `${colors.onSurfaceVariant}40`, textTransform: 'uppercase' },
  signalRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: spacing[3], gap: 4 },
  signalTitle: { fontSize: 13, fontWeight: '700', color: colors.onSurface },
  signalSummary: { fontSize: 11, color: `${colors.onSurfaceVariant}80` },
  signalSource: { ...typography.label, fontSize: 9 },
  gateBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: spacing[6] },
  gateCard: { backgroundColor: '#1a120a', borderRadius: radius['3xl'], padding: spacing[8], alignItems: 'center', gap: spacing[4], borderWidth: 1, borderColor: 'rgba(255,145,86,0.25)' },
  gateIcon: { width: 64, height: 64, borderRadius: radius['2xl'], backgroundColor: 'rgba(255,145,86,0.12)', alignItems: 'center', justifyContent: 'center' },
  gateTitle: { fontSize: 20, fontWeight: '800', color: colors.white },
  gateDesc: { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20 },
  gateBtnWrap: { width: '100%', borderRadius: radius['2xl'], overflow: 'hidden' },
  gateBtn: { paddingVertical: 14, alignItems: 'center' },
  gateBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  gateBack: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  shareRow: { marginTop: spacing[3], gap: 4 },
  shareText: { fontSize: 11, color: `${colors.onSurfaceVariant}60` },
  aiItem: { padding: spacing[4], backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: radius.xl, marginBottom: spacing[2], borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  aiItemDanger: { borderLeftWidth: 2, borderLeftColor: 'rgba(255,71,87,0.4)' },
  aiBold: { fontSize: 13, fontWeight: '700', color: colors.onSurface, marginBottom: 4 },
  aiBody: { fontSize: 12, color: `${colors.onSurfaceVariant}80`, lineHeight: 18 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing[2], borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  listTitle: { fontSize: 13, fontWeight: '600', color: colors.onSurface, flex: 1 },
  listMeta: { fontSize: 11, color: `${colors.onSurfaceVariant}60` },
  proRow: { gap: 6, marginBottom: spacing[3] },
  proBarTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  proBar: { height: '100%', backgroundColor: colors.primaryContainer, borderRadius: 2 },
})
