import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';
import { Icon } from '../icons';

export type TagVariant = 'default' | 'primary' | 'clay' | 'danger';

export interface TagProps {
  label: string;
  variant?: TagVariant;
  icon?: React.ReactNode;
  testID?: string;
}

/**
 * Tag Primitive
 * 
 * - Square-ish 6px radius (strictly no pills).
 * - Flat tint fills, 1px border.
 * - Icons are strictly forbidden on tags, except the danger tag (warning icon).
 * - Label wraps and never overflows.
 */
export function Tag({
  label,
  variant = 'default',
  icon,
  testID,
}: TagProps) {
  const { colors, radii, borders, spacing } = useTheme();

  let backgroundColor: string = colors.surface;
  let textColor: 'ink' | 'primary' | 'danger' = 'ink';

  // Crisp 1px border on white surface with ZERO tinted background fill
  backgroundColor = colors.surface;

  switch (variant) {
    case 'primary':
      textColor = 'primary';
      break;
    case 'clay':
      textColor = 'ink';
      break;
    case 'danger':
      textColor = 'danger';
      break;
    case 'default':
    default:
      textColor = 'ink';
      break;
  }

  const containerStyle: ViewStyle = {
    backgroundColor,
    borderColor: colors.border,
    borderWidth: borders.width,
    borderRadius: radii.sm, // strictly 6px (square-ish, no pills!)
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  };

  // Only the danger tag is permitted an icon
  const showIcon = variant === 'danger';
  const renderIcon = showIcon ? (icon || <Icon name="warning" size={12} tone="danger" />) : null;

  return (
    <View testID={testID} style={[styles.base, containerStyle]}>
      {renderIcon && (
        <View style={[styles.iconWrapper, { marginRight: spacing.xxs }]}>
          {renderIcon}
        </View>
      )}
      <Text variant="caption" color={textColor} weight="semiBold" style={styles.labelText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minWidth: 0,
    flexShrink: 1,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  labelText: {
    flexShrink: 1,
    minWidth: 0,
  },
});
