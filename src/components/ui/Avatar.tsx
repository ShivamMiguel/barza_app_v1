import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'

const AVATAR_COLORS = [
  '#ff9156', '#e67e22', '#9b59b6', '#3498db',
  '#1abc9c', '#e74c3c', '#f39c12', '#16a085', '#8e44ad',
]

function getColorForName(name: string): string {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: number
}

export function Avatar({ name, avatarUrl, size = 44 }: AvatarProps) {
  const bg = getColorForName(name)
  const initials = name
    .split(' ')
    .map(w => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('')

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    )
  }

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '800',
  },
})
