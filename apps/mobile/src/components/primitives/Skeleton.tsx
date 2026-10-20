import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
  DimensionValue,
  AccessibilityInfo,
} from 'react-native';
import { useTheme } from '../../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Skeleton Primitive
 * 
 * Flat blocks in the border colour matching the real layout.
 * One slow opacity fade: 0.5 to 1.0 over 1.2s.
 * Strictly NO shimmer sweep (gradients are forbidden).
 * Honors reduced motion. Uses native driver animations only.
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { colors, radii } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useRef(new Animated.Value(0.5)).current;

  // Cap radius at max 12px
  const safeRadius = Math.min(borderRadius, radii.lg);

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

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.75);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1.0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [reduceMotion, opacity]);

  const blockStyle: ViewStyle = {
    width,
    height,
    borderRadius: safeRadius,
    backgroundColor: colors.border,
  };

  return <Animated.View style={[blockStyle, { opacity }, style]} />;
}
