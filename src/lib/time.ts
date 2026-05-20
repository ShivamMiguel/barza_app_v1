/** Matches web feed cards: "agora", "2h atrás", "3d atrás" */
export function getTimeAgoFeed(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  if (h < 1) return 'agora'
  if (h < 24) return `${h}h atrás`
  return `${d}d atrás`
}

export function getTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'agora'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return d.toLocaleDateString('pt-AO', { year: '2-digit', month: 'short', day: 'numeric' })
}

export function formatLocation(loc: Record<string, any> | null | undefined): string {
  if (!loc) return 'Angola'
  return loc.city || loc.province || loc.municipio || loc.address || 'Angola'
}
