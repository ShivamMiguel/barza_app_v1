import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native'

type SpinnerProps = {
  diameter?: number
  color?: string
  style?: ViewStyle
}

/**
 * Loading indicator without ActivityIndicator — RN 0.81 Fabric cannot
 * parse size="large"|"small" on the native ActivityIndicatorView.
 */
export function Spinner({ diameter = 20, color = '#ff9156', style }: SpinnerProps) {
  const rotation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    loop.start()
    return () => loop.stop()
  }, [rotation])

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const borderWidth = Math.max(2, Math.round(diameter / 10))

  return (
    <Animated.View
      style={[
        {
          width: diameter,
          height: diameter,
          transform: [{ rotate }],
        },
        style,
      ]}
    >
      <View
        style={[
          styles.ring,
          {
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            borderWidth,
            borderTopColor: color,
            borderRightColor: `${color}55`,
            borderBottomColor: `${color}33`,
            borderLeftColor: `${color}33`,
          },
        ]}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  ring: {
    borderColor: 'transparent',
  },
})
