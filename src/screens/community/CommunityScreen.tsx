import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CommunityTopBar } from '../../components/community/CommunityTopBar'
import { SearchModal } from '../../components/modals/SearchModal'
import { CommunityBottomNav } from '../../components/community/CommunityBottomNav'
import { FeedScreen } from './FeedScreen'
import { MarketInsightsScreen } from './MarketInsightsScreen'
import { NotificationsScreen } from './NotificationsScreen'
import { ProfileScreen } from './ProfileScreen'
import { CommunityTab } from '../../navigation/types'
import { colors } from '../../lib/theme'

export function CommunityScreen() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<CommunityTab>('feed')
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top, backgroundColor: colors.surfaceContainerLowest }}>
        <CommunityTopBar
          activeTab={tab}
          onNotificationsPress={() => setTab('notifications')}
          onSearchPress={() => setSearchOpen(true)}
        />
      </View>

      <View style={styles.body}>
        {tab === 'feed' && <FeedScreen embedded />}
        {tab === 'insights' && <MarketInsightsScreen />}
        {tab === 'notifications' && <NotificationsScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </View>

      <CommunityBottomNav activeTab={tab} onTabPress={setTab} />
      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  body: { flex: 1 },
})
