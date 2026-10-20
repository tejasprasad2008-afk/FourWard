import React from 'react';
import { View, StyleSheet, useWindowDimensions, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

export interface ActionRowProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  action: React.ReactNode;
  forceStacked?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * ActionRow Primitive
 * Text (title + optional subtitle) plus button.
 * Button drops below when tight or font scale > 1.15.
 * Strictly maintains minWidth: 0 on all row containers and children.
 */
export function ActionRow({
  title,
  subtitle,
  action,
  forceStacked,
  style,
  testID,
}: ActionRowProps) {
  const { spacing } = useTheme();
  const { fontScale } = useWindowDimensions();

  const shouldStack = forceStacked || fontScale > 1.15;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        shouldStack ? styles.stacked : styles.horizontal,
        { gap: Math.max(spacing.sm, 8) },
        style,
      ]}
    >
      <View style={[styles.textCol, shouldStack ? styles.fullWidth : null]}>
        {typeof title === 'string' ? (
          <Text variant="subhead" color="ink" weight="bold">
            {title}
          </Text>
        ) : (
          title
        )}

        {subtitle && (
          <View style={{ marginTop: 2 }}>
            {typeof subtitle === 'string' ? (
              <Text variant="bodySmall" color="muted">
                {subtitle}
              </Text>
            ) : (
              subtitle
            )}
          </View>
        )}
      </View>

      <View style={[styles.actionCol, shouldStack ? styles.actionFullWidth : null]}>
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minWidth: 0,
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  actionCol: {
    flexShrink: 0,
  },
  actionFullWidth: {
    width: '100%',
    alignItems: 'stretch',
  },
  fullWidth: {
    minWidth: 0,
    width: '100%',
  },
});
