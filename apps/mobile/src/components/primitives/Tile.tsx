import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { useTheme } from '../../theme';
import { Text } from './Text';

export type TileTint = 'sageTint' | 'peachTint' | 'surface' | 'primaryTint' | 'clayTint';
export type TileSize = 'half' | 'wide';

export interface TileProps {
  title: string;
  status: string;
  tint?: TileTint;
  image?: ImageSource | string | number | null;
  size?: TileSize;
  onPress?: () => void;
  testID?: string;
}

/**
 * Tile Primitive
 * 
 * - Flat tint fill, 1px border, radius 12.
 * - Title top-left in Bricolage 600.
 * - One live status line under it in Hanken Grotesk.
 * - Image cut-out anchored bottom-right, bleeding off the edge (~45% of tile width).
 * - Two sizes: half (2-col grid, height ~150dp) and wide (banner).
 * - Uses expo-image. While loading or when image is null, shows the flat tint only.
 */
export function Tile({
  title,
  status,
  tint = 'sageTint',
  image,
  size = 'half',
  onPress,
  testID,
}: TileProps) {
  const { colors, radii, borders, spacing, mode } = useTheme();

  const isWide = size === 'wide';
  const tileHeight = isWide ? 104 : (mode === 'elderly' ? 160 : 142);

  const containerStyle: ViewStyle = {
    backgroundColor: colors[tint],
    borderColor: colors.border,
    borderWidth: borders.width,
    borderRadius: radii.lg,
    padding: spacing.sm,
    minHeight: tileHeight,
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        { opacity: pressed && onPress ? 0.85 : 1 },
      ]}
    >
      {/* Text Area (Top-Left aligned, content-driven) */}
      <View style={[styles.textContainer, { maxWidth: isWide ? '72%' : '85%', gap: 4 }]}>
        <Text variant={isWide ? 'title' : 'subhead'} color="ink" weight="bold">
          {title}
        </Text>
        <Text variant="bodySmall" color="muted">
          {status}
        </Text>
      </View>

      {/* Image Cut-out anchored bottom-right, bleeding off the edge */}
      {image ? (
        <View style={[styles.imageAnchor, { width: isWide ? '38%' : '58%', height: isWide ? '88%' : '68%' }]}>
          <Image
            source={image}
            style={styles.image}
            contentFit="contain"
            contentPosition="bottom right"
            transition={0}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
    alignSelf: 'stretch',
    position: 'relative',
    minWidth: 0,
  },
  textContainer: {
    zIndex: 2,
    flexDirection: 'column',
    alignSelf: 'flex-start',
    minWidth: 0,
    flexShrink: 1,
  },
  imageAnchor: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    zIndex: 1,
    pointerEvents: 'none',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
