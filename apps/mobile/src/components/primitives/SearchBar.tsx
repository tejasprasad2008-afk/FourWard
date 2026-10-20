import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Icon } from '../icons';
import { useTheme } from '../../theme';
import { fontFamilies } from '../../theme/tokens';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onClear?: () => void;
  autoFocus?: boolean;
  testID?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onSubmit,
  onClear,
  autoFocus = false,
  testID,
}: SearchBarProps) {
  const { colors, radii, borders, spacing, minTouchTarget, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const showClear = Boolean(value && value.length > 0);

  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  const containerStyle: ViewStyle = {
    minHeight: minTouchTarget,
    backgroundColor: colors.surface,
    borderColor: isFocused ? colors.primary : colors.border,
    borderWidth: borders.width,
    borderRadius: radii.md, // strictly 8px (never pill)
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  };

  const inputStyle: TextStyle = {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: typography.body.fontSize,
    color: colors.ink,
  };

  return (
    <View testID={testID} style={[styles.container, containerStyle]}>
      <Icon name="search" size={20} tone="muted" />

      <TextInput
        style={[styles.input, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={false}
        numberOfLines={1}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
        autoCorrect={false}
      />

      {showClear && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={handleClear}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.clearButton}
        >
          <Icon name="close" size={18} tone="muted" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    margin: 0,
  },
  clearButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
