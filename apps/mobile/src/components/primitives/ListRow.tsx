import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  leadIcon?: React.ReactNode;
  trailingText?: string;
  trailingIcon?: React.ReactNode;
  onPress?: () => void;
  borderBottom?: boolean;
  destructive?: boolean;
  testID?: string;
}

export function ListRow({
  title,
  subtitle,
  leadIcon,
  trailingText,
  trailingIcon,
  onPress,
  borderBottom = true,
  destructive = false,
  testID,
}: ListRowProps) {
  const { colors, borders, spacing, minTouchTarget } = useTheme();

  const containerStyle: ViewStyle = {
    minHeight: minTouchTarget,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: borderBottom ? borders.width : 0,
    borderBottomColor: colors.border,
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
      <View style={[styles.innerRow, { gap: spacing.sm }]}>
        {leadIcon && <View style={styles.leadSlot}>{leadIcon}</View>}

        <View style={styles.textColumn}>
          <Text
            variant="body"
            color={destructive ? 'danger' : 'ink'}
            weight="semiBold"
          >
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" color="muted">
              {subtitle}
            </Text>
          )}
        </View>

        {(trailingText || trailingIcon) && (
          <View style={[styles.trailingSlot, { gap: spacing.xxs }]}>
            {trailingText && (
              <Text variant="caption" color="muted" align="right">
                {trailingText}
              </Text>
            )}
            {trailingIcon && (
              <View style={styles.trailingIconContainer}>{trailingIcon}</View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leadSlot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  trailingSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  trailingIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
