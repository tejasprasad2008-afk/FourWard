import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import {
  colors,
  spacing,
  radii,
  borders,
  touchTargets,
  getScaledTypography,
  iconTokens,
  ThemeMode,
  TypographyVariant,
  TypographyStyle,
} from './tokens';

export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isDevScale135: boolean;
  setDevScale135: (enabled: boolean) => void;
  toggleDevScale135: () => void;
  colors: typeof colors;
  spacing: typeof spacing;
  radii: typeof radii;
  borders: typeof borders;
  iconTokens: typeof iconTokens;
  minTouchTarget: number;
  typography: Record<TypographyVariant, TypographyStyle>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  initialMode?: ThemeMode;
  children: ReactNode;
}

export function ThemeProvider({ initialMode = 'normal', children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [isDevScale135, setDevScale135] = useState(false);

  const toggleMode = () => {
    setMode((prev) => (prev === 'normal' ? 'elderly' : 'normal'));
  };

  const toggleDevScale135 = () => {
    setDevScale135((prev) => !prev);
  };

  const value = useMemo<ThemeContextValue>(() => {
    const effectiveMultiplier = isDevScale135 ? 1.35 : undefined;
    return {
      mode,
      setMode,
      toggleMode,
      isDevScale135,
      setDevScale135,
      toggleDevScale135,
      colors,
      spacing,
      radii,
      borders,
      iconTokens,
      minTouchTarget: touchTargets[mode],
      typography: getScaledTypography(mode, effectiveMultiplier),
    };
  }, [mode, isDevScale135]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
