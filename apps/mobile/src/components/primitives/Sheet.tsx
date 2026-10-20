import React from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
}

export function Sheet({
  visible,
  onClose,
  title,
  children,
  footer,
  testID,
}: SheetProps) {
  const { colors, radii, borders, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const scrimStyle: ViewStyle = {
    backgroundColor: colors.scrim, // strict token: no hardcoded hex or rgba
  };

  const sheetStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: borders.width,
    borderLeftWidth: borders.width,
    borderRightWidth: borders.width,
    borderTopLeftRadius: radii.lg, // strictly 12px (max permitted)
    borderTopRightRadius: radii.lg, // strictly 12px (max permitted)
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: Math.max(insets.bottom, spacing.lg),
    maxHeight: '90%',
  };

  const handleStyle: ViewStyle = {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radii.sm, // strictly 6px (<= 12px)
    alignSelf: 'center',
    marginBottom: spacing.sm,
  };

  return (
    <Modal
      testID={testID}
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, scrimStyle, { paddingTop: insets.top }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss sheet"
          style={styles.backdropPressable}
          onPress={onClose}
        />
        <View style={[styles.sheetContent, sheetStyle]}>
          <View style={handleStyle} />

          {title && (
            <View style={{ marginBottom: spacing.md }}>
              <Text variant="title" color="ink" weight="bold">
                {title}
              </Text>
            </View>
          )}

          <View style={{ marginBottom: footer ? spacing.md : 0 }}>
            {children}
          </View>

          {footer && <View style={styles.footerContainer}>{footer}</View>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContent: {
    width: '100%',
  },
  footerContainer: {
    alignSelf: 'stretch',
  },
});
