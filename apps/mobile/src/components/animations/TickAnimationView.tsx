import React, { useState, useEffect } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../../theme';
import { Icon } from '../icons';

export interface TickAnimationViewProps {
  size?: number;
}

export function TickAnimationView({ size = 88 }: TickAnimationViewProps) {
  const { colors, radii, borders } = useTheme();
  const [hasError, setHasError] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isMounted) setSystemReducedMotion(enabled);
    }).catch(() => {});

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (isMounted) setSystemReducedMotion(enabled);
    });

    return () => {
      isMounted = false;
      sub?.remove();
    };
  }, []);

  const shouldReduceMotion = Boolean(systemReducedMotion);

  const player = useVideoPlayer(
    require('../../../assets/animations/tick_confetti.mp4'),
    (p) => {
      p.loop = false;
      p.muted = true;
      if (!shouldReduceMotion) {
        p.play();
      }
    }
  );

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('statusChange', (payload: any) => {
      if (payload?.status === 'error' || payload?.error) {
        setHasError(true);
      }
    });
    return () => {
      sub?.remove();
    };
  }, [player]);

  // Fallback to static solid tick when reduced motion is on or video errors
  if (shouldReduceMotion || hasError) {
    return (
      <View
        style={[
          styles.fallbackBox,
          {
            width: size,
            height: size,
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            borderWidth: borders.width,
            borderRadius: radii.lg,
          },
        ]}
      >
        <Icon name="check" size={Math.round(size * 0.45)} tone="surface" />
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <VideoView
        player={player}
        style={{ width: size, height: size }}
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
