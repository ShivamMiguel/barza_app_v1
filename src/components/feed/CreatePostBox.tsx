import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '../ui/Avatar'
import { InlineVideo } from './InlineVideo'
import { Spinner } from '../ui/Spinner'
import { supabase, PostWithUser, UserProfile } from '../../lib/supabase'
import { colors, spacing, radius, typography } from '../../lib/theme'

interface Props {
  profile?: UserProfile | null
  onPostCreated?: (post: PostWithUser) => void
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const BUCKET = 'logo'

export function CreatePostBox({ profile, onPostCreated }: Props) {
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mediaUri, setMediaUri] = useState<string | null>(null)
  const [mediaFile, setMediaFile] = useState<{ uri: string; type: string; name: string } | null>(null)
  const [isVideo, setIsVideo] = useState(false)

  const userName = profile?.full_name ?? 'User'
  const firstName = userName.split(' ')[0]
  const canPost = content.trim().length > 0 && !isPosting

  async function pickMedia() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      setError('Precisamos de acesso à galeria.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      allowsEditing: false,
      videoMaxDuration: 120,
    })

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      const video = asset.type === 'video'
      const maxBytes = video ? 50 * 1024 * 1024 : MAX_IMAGE_BYTES
      if (asset.fileSize && asset.fileSize > maxBytes) {
        setError(video ? 'O vídeo ultrapassa 50MB.' : 'A imagem ultrapassa 4MB.')
        return
      }
      setError(null)
      setIsVideo(video)
      setMediaUri(asset.uri)
      const ext = video ? 'mp4' : 'jpg'
      setMediaFile({
        uri: asset.uri,
        type: asset.mimeType ?? (video ? 'video/mp4' : 'image/jpeg'),
        name: `post-${Date.now()}.${ext}`,
      })
    }
  }

  async function uploadMedia(): Promise<string | undefined> {
    if (!mediaFile || !profile?.id) return undefined

    const ext = isVideo ? 'mp4' : 'jpg'
    const path = `posts/${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, mediaFile as any, { contentType: mediaFile.type, upsert: false })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed || isPosting) return
    setIsPosting(true)
    setError(null)

    try {
      let image_url: string | undefined
      if (mediaFile) {
        try {
          image_url = await uploadMedia()
        } catch {
          setError(isVideo ? 'Erro ao enviar o vídeo.' : 'Erro ao enviar a imagem.')
          setIsPosting(false)
          return
        }
      }

      const { data, error: insertError } = await supabase
        .from('posts')
        .insert({ content: trimmed, image_url })
        .select('*, user:profiles(id, full_name, avatar_url, profession:role_profile)')
        .single()

      if (insertError) {
        setError(insertError.message)
        setIsPosting(false)
        return
      }

      setContent('')
      setMediaUri(null)
      setMediaFile(null)
      setIsVideo(false)

      if (onPostCreated && data && profile) {
        onPostCreated({
          ...data as PostWithUser,
          liked_by_me: false,
        })
      }
    } catch {
      setError('Erro de conexão. Tenta novamente.')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatarWrapper}>
          <Avatar name={userName} avatarUrl={profile?.avatar_url} size={44} />
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder={`O que está a pensar, ${firstName}?`}
            placeholderTextColor={`${colors.onSurfaceVariant}60`}
            multiline
            maxLength={1000}
            editable={!isPosting}
          />

          {mediaUri && (
            <View style={styles.imagePreview}>
              {isVideo ? (
                <InlineVideo url={mediaUri} />
              ) : (
                <Image source={{ uri: mediaUri }} style={styles.previewImg} resizeMode="cover" />
              )}
              <TouchableOpacity
                style={styles.removeImg}
                onPress={() => { setMediaUri(null); setMediaFile(null); setIsVideo(false) }}
                disabled={isPosting}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={pickMedia}
                disabled={isPosting}
              >
                <Ionicons name="image-outline" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={pickMedia} disabled={isPosting}>
                <Ionicons name="videocam-outline" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.footerRight}>
              <Text style={styles.charCount}>{content.length}/1000</Text>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!canPost}
                style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
                activeOpacity={0.85}
              >
                {isPosting ? (
                  <Spinner color={colors.onPrimary} />
                ) : (
                  <>
                    <Text style={styles.postBtnText}>Postar</Text>
                    <Ionicons name="send-outline" size={14} color={colors.onPrimary} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius['3xl'],
    padding: spacing[5],
    borderTopWidth: 1,
    borderTopColor: 'rgba(86,67,58,0.1)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,145,86,0.25)',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: spacing[3],
  },
  input: {
    color: colors.onSurface,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: spacing[2],
    minHeight: 44,
    textAlignVertical: 'top',
  },
  imagePreview: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,145,86,0.2)',
  },
  previewImg: {
    width: '100%',
    height: 200,
  },
  removeImg: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(86,67,58,0.1)',
  },
  footerLeft: {
    flexDirection: 'row',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charCount: {
    color: `${colors.onSurfaceVariant}60`,
    fontSize: 10,
    fontWeight: '600',
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    minWidth: 72,
    justifyContent: 'center',
  },
  postBtnDisabled: {
    opacity: 0.4,
  },
  postBtnText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
})
