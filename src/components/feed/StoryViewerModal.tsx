import React from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius } from '../../lib/theme'

export type StoryItem = {
  name: string
  img: string
}

type Props = {
  visible: boolean
  story: StoryItem | null
  onClose: () => void
}

export function StoryViewerModal({ visible, story, onClose }: Props) {
  const insets = useSafeAreaInsets()
  if (!story) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Image source={{ uri: story.img }} style={styles.image} resizeMode="cover" />
        <View style={[styles.overlay, { paddingTop: insets.top + spacing[3] }]}>
          <View style={styles.topBar}>
            <Text style={styles.storyName}>{story.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
  },
  storyName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
