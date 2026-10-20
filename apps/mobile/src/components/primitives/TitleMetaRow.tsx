import React from 'react';
import { View, StyleSheet, useWindowDimensions, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { ColorToken, TypographyVariant } from '../../theme/tokens';
import { Text } from './Text';

export interface TitleMetaRowProps {
  title: string | React.ReactNode;
  meta?: string | React.ReactNode;
  statusTag?: React.ReactNode;
  titleVariant?: TypographyVariant;
  titleWeight?: 'regular' | 'semiBold' | 'bold';
  metaColor?: ColorToken;
  forceStacked?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * TitleMetaRow Primitive
 * Title plus time or status.
 * Meta drops to its own line when tight or font scale > 1.15.
 * Strictly maintains minWidth: 0 on all row containers and children.
 */
export function TitleMetaRow({
  title,
  meta,
  statusTag,
  titleVariant = 'subhead',
  titleWeight = 'bold',
  metaColor = 'muted',
  forceStacked,
  style,
  testID,
}: TitleMetaRowProps) {
  const { spacing } = useTheme();
  const { fontScale } = useWindowDimensions();

  const isMetaLong = typeof meta === 'string' && meta.length > 20;
  const shouldStack = forceStacked || fontScale > 1.15 || isMetaLong || Boolean(statusTag && meta);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        shouldStack ? styles.stacked : styles.horizontal,
        { gap: Math.max(spacing.xs, 8) },
        style,
      ]}
    >
      <View style={shouldStack ? styles.fullWidth : styles.titleCol}>
        {typeof title === 'string' ? (
          <Text variant={titleVariant} color="ink" weight={titleWeight}>
            {title}
          </Text>
        ) : (
          title
        )}
      </View>

      {(meta || statusTag) && (
        <View style={shouldStack ? [styles.fullWidth, { gap: spacing.xs }] : [styles.metaCol, { gap: spacing.xs, alignItems: 'flex-end' }]}>
          {statusTag}
          {meta && (
            typeof meta === 'string' ? (
              <Text variant="caption" color={metaColor} weight="semiBold" align={shouldStack ? 'left' : 'right'}>
                {meta}
              </Text>
            ) : (
              meta
            )
          )}
        </View>
      )}
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
    alignItems: 'baseline',
  },
  stacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  metaCol: {
    flexShrink: 0,
    minWidth: 0,
  },
  fullWidth: {
    minWidth: 0,
    width: '100%',
  },
});
