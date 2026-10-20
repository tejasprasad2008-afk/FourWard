import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

export type LogoVariant = 'lockup' | 'mark';

export interface LogoProps {
  variant?: LogoVariant;
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * FourWard Brand Logo Primitive
 * 
 * - variant="lockup": Combined horizontal mark + serif wordmark asset.
 * - variant="mark": Standalone stethoscope/heart mark.
 * - Strictly uses the brand image asset. Never retypes the wordmark.
 */
export function Logo({
  variant = 'lockup',
  height = 32,
  style,
  testID,
}: LogoProps) {
  if (variant === 'mark') {
    const markWidth = Math.round(height * (270 / 195));
    return (
      <View testID={testID} style={[styles.container, style]}>
        <Image
          source={require('@/assets/brand/logo-mark.png')}
          style={{ height, width: markWidth }}
          contentFit="contain"
          accessibilityLabel="FourWard logo mark"
        />
      </View>
    );
  }

  // Lockup variant: about 32dp tall, left-aligned
  const lockupWidth = Math.round(height * 4.6);

  return (
    <View testID={testID} style={[styles.container, style]}>
      <Image
        source={require('@/assets/brand/logo-lockup.png')}
        style={{ height, width: lockupWidth }}
        contentFit="contain"
        accessibilityLabel="FourWard logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});
