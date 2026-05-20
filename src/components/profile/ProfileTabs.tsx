import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PostCardEditorial } from '../feed/PostCardEditorial'
import { PostWithUser } from '../../lib/supabase'
import { colors, spacing, radius, typography } from '../../lib/theme'

const TABS = ['Posts', 'Vault', 'Favoritos', 'Colaborações'] as const

type Props = {
  posts: PostWithUser[]
  currentUserId?: string
}

export function ProfileTabs({ posts, currentUserId }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Posts')

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {activeTab === 'Posts' && (
          posts.length > 0 ? (
            posts.map(post => (
              <PostCardEditorial key={post.id} post={post} currentUserId={currentUserId} />
            ))
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="newspaper-outline" size={40} color={`${colors.onSurfaceVariant}20`} />
              <Text style={styles.placeholderText}>Nenhum post publicado ainda</Text>
            </View>
          )
        )}

        {activeTab === 'Vault' && (
          <View style={styles.placeholder}>
            <Ionicons name="archive-outline" size={40} color={`${colors.onSurfaceVariant}20`} />
            <Text style={styles.placeholderText}>Vault em breve</Text>
          </View>
        )}

        {activeTab === 'Favoritos' && (
          <View style={styles.placeholder}>
            <Ionicons name="heart-outline" size={40} color={`${colors.onSurfaceVariant}20`} />
            <Text style={styles.placeholderText}>Sem favoritos ainda</Text>
          </View>
        )}

        {activeTab === 'Colaborações' && (
          <View style={styles.placeholder}>
            <Ionicons name="people-outline" size={40} color={`${colors.onSurfaceVariant}20`} />
            <Text style={styles.placeholderText}>Sem colaborações ainda</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  tabBar: { borderBottomWidth: 1, borderBottomColor: 'rgba(86,67,58,0.12)', marginBottom: spacing[4] },
  tab: { paddingVertical: spacing[4], paddingHorizontal: spacing[4], borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primaryContainer },
  tabText: { ...typography.label, color: `${colors.onSurfaceVariant}40` },
  tabTextActive: { color: colors.primaryContainer },
  content: { gap: spacing[6] },
  placeholder: { alignItems: 'center', padding: spacing[12], gap: spacing[3] },
  placeholderText: { color: colors.onSurfaceVariant, fontSize: 14 },
})
