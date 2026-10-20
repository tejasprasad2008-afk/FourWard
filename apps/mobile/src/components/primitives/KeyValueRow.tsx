import React from 'react';
import { View, StyleSheet, useWindowDimensions, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { ColorToken } from '../../theme/tokens';
import { Text } from './Text';

export interface KeyValueRowProps {
  label: string | React.ReactNode;
  value: string | React.ReactNode;
  labelColor?: ColorToken;
  valueColor?: ColorToken;
  valueWeight?: 'regular' | 'semiBold' | 'bold';
  forceStacked?: boolean;
  labelWidth?: number;
  hint?: string | React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * KeyValueRow Primitive
 * Label left, value right.
 * Automatically stacks the label above the value when the value is long or font scale > 1.15.
 * Strictly maintains a minimum 8dp gap and minWidth: 0 for wrapping.
 */
export function KeyValueRow({
  label,
  value,
  labelColor = 'muted',
  valueColor = 'ink',
  valueWeight = 'bold',
  forceStacked,
  labelWidth,
  hint,
  style,
  testID,
}: KeyValueRowProps) {
  const { spacing } = useTheme();
  const { fontScale } = useWindowDimensions();

  const isValueLong = typeof value === 'string' && value.length > 24;
  const shouldStack = forceStacked || fontScale > 1.15 || isValueLong;

  return (
    <View
      testID={testID}
      style={[
        shouldStack ? styles.stackedContainer : styles.horizontalContainer,
        { gap: Math.max(spacing.xs, 8) },
        style,
      ]}
    >
      <View
        style={
          shouldStack
            ? styles.fullWidth
            : [styles.labelCol, labelWidth ? { width: labelWidth, flex: undefined } : null]
        }
      >
        {typeof label === 'string' ? (
          <Text variant="caption" color={labelColor}>
            {label}
          </Text>
        ) : (
          label
        )}
      </View>

      <View style={shouldStack ? styles.fullWidth : styles.valueCol}>
        {typeof value === 'string' ? (
          <Text
            variant="bodySmall"
            color={valueColor}
            weight={valueWeight}
            align={shouldStack ? 'left' : 'right'}
          >
            {value}
          </Text>
        ) : (
          value
        )}
        {hint && (
          <Text variant="caption" color="muted" align={shouldStack ? 'left' : 'right'}>
            {hint}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minWidth: 0,
    width: '100%',
  },
  stackedContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    minWidth: 0,
    width: '100%',
  },
  labelCol: {
    flexShrink: 1,
    minWidth: 0,
  },
  valueCol: {
    flexShrink: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  fullWidth: {
    minWidth: 0,
    width: '100%',
  },
});
