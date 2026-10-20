/**
 * FourWard Design Tokens
 * 
 * Strict design rules from AGENTS.md:
 * - All colours, fonts, spacing, radii live in tokens.ts. Never hardcode.
 * - Flat colour blocks and 1px borders.
 * - No gradients, no glow, no blur/glass, no neon, no purple/blue-violet.
 * - Max corner radius 12. Buttons radius 8. Tags radius 6. No pill buttons.
 * - Fonts: Hanken Grotesk (body), Bricolage Grotesque (headings). Never Inter.
 * - Touch targets >= 48dp (>= 56dp in Elderly mode).
 */

export const colors = {
  bg: '#FAFAF6',          // ivory white
  surface: '#FFFFFF',     // white
  ink: '#1C2824',         // deep dark ink green
  muted: '#5E6B66',       // muted green-gray text
  primary: '#1D5A4F',     // deep teal-green
  primaryPressed: '#144238', // active teal-green button press
  sageTint: '#E0EDE6',    // soft sage tint block background
  peachTint: '#F7E8D6',   // warm peach tint block background
  primaryTint: '#E0EDE6', // alias for backwards compatibility
  clayTint: '#F7E8D6',    // alias for backwards compatibility
  accent: '#E58F3A',      // warm orange/marigold (assistant button & highlights)
  danger: '#C2392B',      // danger & emergency only
  dangerTint: '#FDECEB',  // soft danger tint block for tags/alerts
  border: '#D0D4CE',      // neutral 1px flat borders (crisp contrast)
  scrim: '#1C282473',     // flat semi-transparent backdrop overlay
} as const;

export type ColorToken = keyof typeof colors;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radii = {
  sm: 6,   // tags, small badges
  md: 8,   // buttons, search bar, text inputs
  lg: 12,  // tiles, bottom sheets, card containers (max permitted)
} as const;

export type RadiusToken = keyof typeof radii;

export const borders = {
  width: 1, // flat 1px borders everywhere
} as const;

export const touchTargets = {
  normal: 48,  // >= 48dp touch target
  elderly: 56, // >= 56dp touch target in Elderly mode
} as const;

export const iconTokens = {
  strokeWidth: 1.75,
} as const;

export const fontFamilies = {
  headingSemiBold: 'BricolageGrotesque_600SemiBold',
  headingBold: 'BricolageGrotesque_700Bold',
  bodyRegular: 'HankenGrotesk_400Regular',
  bodySemiBold: 'HankenGrotesk_600SemiBold',
} as const;

export const multipliers = {
  normal: 1.0,
  elderly: 1.35,
} as const;

export type ThemeMode = 'normal' | 'elderly';

export interface TypographyStyle {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
}

export const baseTypography = {
  caption: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamilies.bodyRegular,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.bodySemiBold,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.bodyRegular,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fontFamilies.bodyRegular,
  },
  subhead: {
    fontSize: 17,
    lineHeight: 23,
    fontFamily: fontFamilies.bodySemiBold,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamilies.headingSemiBold,
  },
  headline: {
    fontSize: 25,
    lineHeight: 31,
    fontFamily: fontFamilies.headingBold,
  },
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fontFamilies.headingBold,
  },
} as const;

export type TypographyVariant = keyof typeof baseTypography;

/**
 * Returns dynamic typography styles scaled according to the active theme mode.
 */
export function getScaledTypography(mode: ThemeMode, customMultiplier?: number): Record<TypographyVariant, TypographyStyle> {
  const multiplier = customMultiplier !== undefined ? customMultiplier : multipliers[mode];
  const scaled = {} as Record<TypographyVariant, TypographyStyle>;

  (Object.keys(baseTypography) as TypographyVariant[]).forEach((key) => {
    const base = baseTypography[key];
    scaled[key] = {
      fontSize: Math.round(base.fontSize * multiplier),
      lineHeight: Math.round(base.lineHeight * multiplier),
      fontFamily: base.fontFamily,
    };
  });

  return scaled;
}
