import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

export interface StatBlockProps {
  value: string | number;
  label: string;
  sublabel?: string;
  variant?: 'surface' | 'sage' | 'peach' | 'danger';
  style?: ViewStyle;
}

export function StatBlock({
  value,
  label,
  sublabel,
  variant = 'surface',
  style,
}: StatBlockProps) {
  const { colors, borders, radii, spacing } = useTheme();

  const getBgColor = () => {
    switch (variant) {
      case 'sage':
        return colors.sageTint;
      case 'peach':
        return colors.peachTint;
      case 'danger':
        return colors.dangerTint;
      case 'surface':
      default:
        return colors.surface;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBgColor(),
          borderColor: colors.border,
          borderWidth: borders.width,
          borderRadius: radii.md,
          padding: spacing.md,
          gap: spacing.xxs,
        },
        style,
      ]}
    >
      <Text variant="display" color="ink" weight="bold">
        {String(value)}
      </Text>
      <Text variant="bodySmall" color="muted" weight="semiBold" numberOfLines={1}>
        {label}
      </Text>
      {sublabel ? (
        <Text variant="caption" color="muted" numberOfLines={1}>
          {sublabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 100,
    justifyContent: 'center',
  },
});
