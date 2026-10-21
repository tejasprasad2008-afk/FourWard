import React, { useState, useEffect, useRef } from 'react';
import {
  Pressable,
  View,
  Text as RNText,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  AccessibilityInfo,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '../../theme';
import { fontFamilies } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  loadingLabel,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  testID,
}: ButtonProps) {
  const { colors, radii, borders, mode, typography } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(120);

  // Check reduced motion setting
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

  // Indeterminate loading progress animation
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading || reduceMotion) {
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
  }, [loading, reduceMotion, progress]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== buttonWidth) {
      setButtonWidth(w);
    }
  };

  const buttonHeight = mode === 'elderly' ? 56 : 48;

  // Colors based on variant and pressed state
  const getColors = (pressed: boolean) => {
    if (variant === 'danger') {
      return {
        bg: pressed ? colors.ink : colors.danger,
        border: pressed ? colors.ink : colors.danger,
        text: colors.surface,
        bar: colors.surface,
      };
    }
    if (variant === 'secondary') {
      return {
        bg: pressed ? colors.primaryTint : colors.surface,
        border: pressed ? colors.primaryPressed : colors.primary,
        text: pressed ? colors.primaryPressed : colors.primary,
        bar: colors.primary,
      };
    }
    if (variant === 'text') {
      return {
        bg: 'transparent',
        border: 'transparent',
        text: pressed ? colors.primaryPressed : colors.primary,
        bar: colors.primary,
      };
    }
    // primary default
    return {
      bg: pressed ? colors.primaryPressed : colors.primary,
      border: pressed ? colors.primaryPressed : colors.primary,
      text: colors.surface,
      bar: colors.surface,
    };
  };

  const runnerWidth = Math.max(buttonWidth * 0.4, 40);
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-runnerWidth, buttonWidth],
  });

  const displayLabel = loading && loadingLabel ? loadingLabel : label;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: Boolean(loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      onLayout={onLayout}
      android_ripple={null}
      style={({ pressed }) => {
        const c = getColors(pressed);
        const containerStyle: ViewStyle = {
          minHeight: buttonHeight,
          paddingVertical: 8,
          paddingHorizontal: variant === 'text' ? 12 : 20,
          borderRadius: radii.md, // strictly 8px
          borderWidth: variant === 'text' ? 0 : borders.width,
          borderColor: c.border,
          backgroundColor: c.bg,
          opacity: disabled ? 0.4 : 1, // disabled: same style at 40% opacity, no beige block
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        };
        return [styles.base, containerStyle];
      }}
    >
      {({ pressed }) => {
        const c = getColors(pressed);
        const textStyle: TextStyle = {
          fontFamily: fontFamilies.bodySemiBold,
          fontSize: typography.body.fontSize,
          lineHeight: typography.body.lineHeight,
          color: c.text,
          letterSpacing: 0,
          textDecorationLine: variant === 'text' && pressed ? 'underline' : 'none',
          flexShrink: 1,
          textAlign: 'center',
        };

        return (
          <>
            <View style={styles.contentRow}>
              {icon && iconPosition === 'left' && (
                <View style={[styles.iconWrapper, { marginRight: 8 }]}>{icon}</View>
              )}
              <RNText style={textStyle}>{displayLabel}</RNText>
              {icon && iconPosition === 'right' && (
                <View style={[styles.iconWrapper, { marginLeft: 8 }]}>{icon}</View>
              )}
            </View>

            {/* 2px Indeterminate Bottom Edge Bar (Runs during loading) */}
            {loading && (
              <View style={[styles.loadingTrack, { backgroundColor: variant === 'secondary' ? colors.primaryTint : 'transparent' }]}>
                {reduceMotion ? (
                  <View style={[styles.staticBar, { backgroundColor: c.bar }]} />
                ) : (
                  <Animated.View
                    style={[
                      styles.runningBar,
                      {
                        width: runnerWidth,
                        backgroundColor: c.bar,
                        transform: [{ translateX }],
                      },
                    ]}
                  />
                )}
              </View>
            )}
          </>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    flexShrink: 1,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    overflow: 'hidden',
  },
  runningBar: {
    height: 2,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  staticBar: {
    height: 2,
    width: '100%',
  },
});
