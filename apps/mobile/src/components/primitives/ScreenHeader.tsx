import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../icons';
import { useTheme } from '../../theme';
import { Text } from './Text';

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightAction,
}: ScreenHeaderProps) {
  const { colors, spacing, borders, iconTokens, minTouchTarget } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: borders.width,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: spacing.sm,
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            hitSlop={8}
            style={[
              styles.backButton,
              {
                minWidth: minTouchTarget,
                minHeight: minTouchTarget,
              },
            ]}
          >
            <Icon name="back" size={24} tone="ink" />
            <Text variant="body" color="ink" weight="semiBold">
              Back
            </Text>
          </Pressable>
        ) : (
          <View style={{ minHeight: minTouchTarget }} />
        )}

        {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
      </View>

      {title ? (
        <View style={[styles.titleSection, { marginTop: spacing.xs, gap: 2 }]}>
          <Text variant="headline" color="ink" weight="semiBold">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySmall" color="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-start',
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleSection: {
    flexDirection: 'column',
  },
});
