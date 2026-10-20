import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { ColorToken, TypographyVariant, fontFamilies } from '../../theme/tokens';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
  weight?: 'regular' | 'semiBold' | 'bold';
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'ink',
  align = 'left',
  weight,
  style,
  children,
  ...rest
}: TextProps) {
  const { colors, typography } = useTheme();
  const typeStyle = typography[variant];

  let selectedFont = typeStyle.fontFamily;
  if (weight === 'bold') {
    selectedFont = fontFamilies.headingBold;
  } else if (weight === 'semiBold') {
    selectedFont =
      variant === 'display' || variant === 'headline' || variant === 'title'
        ? fontFamilies.headingSemiBold
        : fontFamilies.bodySemiBold;
  } else if (weight === 'regular') {
    selectedFont = fontFamilies.bodyRegular;
  }

  const computedStyle: TextStyle = {
    fontFamily: selectedFont,
    fontSize: typeStyle.fontSize,
    lineHeight: typeStyle.lineHeight,
    color: colors[color],
    textAlign: align,
    flexShrink: 1,
  };

  return (
    <RNText style={[computedStyle, style]} {...rest}>
      {children}
    </RNText>
  );
}
