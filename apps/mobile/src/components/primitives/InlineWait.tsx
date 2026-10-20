import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  AccessibilityInfo,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

export interface InlineWaitProps {
  status: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * InlineWait Primitive
 * 
 * Used for assistant thinking and inline waits:
 * - A 2px indeterminate bar plus a specific status line ("Checking Cardiology OPD...").
 * - No pulsing dots, no spinner ring.
 * - Honors reduced-motion (static bar).
 * - Native-driver animation only.
 */
export function InlineWait({ status, style, testID }: InlineWaitProps) {
  const { colors, spacing } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [containerWidth, setContainerWidth] = useState(240);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [reduceMotion, progress]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
    }
  };

  const runnerWidth = Math.max(containerWidth * 0.35, 60);
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-runnerWidth, containerWidth],
  });

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[styles.container, { gap: spacing.xs }, style]}
    >
      <Text variant="caption" color="muted" weight="semiBold">
        {status}
      </Text>

      {/* 2px Indeterminate Bar */}
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.border,
          },
        ]}
      >
        {reduceMotion ? (
          <View
            style={[
              styles.staticBar,
              {
                backgroundColor: colors.primary,
              },
            ]}
          />
        ) : (
          <Animated.View
            style={[
              styles.runningBar,
              {
                width: runnerWidth,
                backgroundColor: colors.primary,
                transform: [{ translateX }],
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  track: {
    height: 2,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  runningBar: {
    height: 2,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  staticBar: {
    height: 2,
    width: '40%',
  },
});
