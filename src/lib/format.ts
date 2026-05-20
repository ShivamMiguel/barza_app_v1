export function formatPriceKz(value: number): string {
  return `${value.toLocaleString('pt-AO')} Kz`
}

export function formatArrival(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
}
