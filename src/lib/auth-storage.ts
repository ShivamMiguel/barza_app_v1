import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const CHUNK_SIZE = 2000

/**
 * Expo SecureStore limits values to ~2048 bytes. Supabase sessions can exceed that,
 * so we split values into chunks (Supabase Expo tutorial pattern).
 */
class LargeSecureStore {
  private async encrypt(key: string, value: string) {
    const chunkCount = Math.ceil(value.length / CHUNK_SIZE)
    await SecureStore.setItemAsync(`${key}_count`, String(chunkCount))
    await Promise.all(
      Array.from({ length: chunkCount }, (_, i) => {
        const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
        return SecureStore.setItemAsync(`${key}_${i}`, chunk)
      }),
    )
  }

  private async decrypt(key: string): Promise<string | null> {
    const countStr = await SecureStore.getItemAsync(`${key}_count`)
    if (!countStr) return null

    const chunkCount = parseInt(countStr, 10)
    const chunks: string[] = []
    for (let i = 0; i < chunkCount; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_${i}`)
      if (chunk === null) return null
      chunks.push(chunk)
    }
    return chunks.join('')
  }

  async getItem(key: string) {
    return this.decrypt(key)
  }

  async setItem(key: string, value: string) {
    await this.encrypt(key, value)
  }

  async removeItem(key: string) {
    const countStr = await SecureStore.getItemAsync(`${key}_count`)
    if (!countStr) return

    const chunkCount = parseInt(countStr, 10)
    await SecureStore.deleteItemAsync(`${key}_count`)
    await Promise.all(
      Array.from({ length: chunkCount }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}_${i}`),
      ),
    )
  }
}

const webStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // ignore quota errors on web
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  },
}

export const supabaseAuthStorage =
  Platform.OS === 'web' ? webStorage : new LargeSecureStore()
