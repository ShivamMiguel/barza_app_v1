export type CountryDialCode = {
  code: string
  name: string
  dial: string
  flag: string
}

export const DIAL_CODES: CountryDialCode[] = [
  { code: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'BR', name: 'Brasil', dial: '+55', flag: '🇧🇷' },
  { code: 'MZ', name: 'Moçambique', dial: '+258', flag: '🇲🇿' },
  { code: 'CV', name: 'Cabo Verde', dial: '+238', flag: '🇨🇻' },
  { code: 'GW', name: 'Guiné-Bissau', dial: '+245', flag: '🇬🇼' },
  { code: 'ST', name: 'São Tomé', dial: '+239', flag: '🇸🇹' },
  { code: 'ES', name: 'Espanha', dial: '+34', flag: '🇪🇸' },
  { code: 'FR', name: 'França', dial: '+33', flag: '🇫🇷' },
  { code: 'GB', name: 'Reino Unido', dial: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Alemanha', dial: '+49', flag: '🇩🇪' },
  { code: 'US', name: 'EUA', dial: '+1', flag: '🇺🇸' },
]

export const DEFAULT_DIAL_CODE = DIAL_CODES[0]
