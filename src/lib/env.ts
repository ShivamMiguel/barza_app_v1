function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill in the values.`,
    )
  }
  return value
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

const supabaseUrl = trimTrailingSlash(required('EXPO_PUBLIC_SUPABASE_URL'))

export const env = {
  webUrl: trimTrailingSlash(
    process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000',
  ),
  supabaseUrl,
  supabaseAnonKey: required('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  beautySignalsUrl: `${supabaseUrl}/functions/v1/beauty-signals`,
  marketInsightsUrl: `${supabaseUrl}/functions/v1/market-insight`,
} as const
