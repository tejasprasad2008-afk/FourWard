import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../../components/primitives/Text';
import { MonumentDoodle } from './MonumentDoodle';
import { LANGUAGE_OPTIONS } from './translations';
import type { SupportedLanguage } from './onboardingStorage';

export interface LanguageSelectStepProps {
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
}

export function LanguageSelectStep({
  selectedLanguage,
  onSelectLanguage,
}: LanguageSelectStepProps) {
  const { colors, spacing, radii, borders, minTouchTarget } = useTheme();

  // 2-column chunking
  const rows: (typeof LANGUAGE_OPTIONS)[] = [];
  for (let i = 0; i < LANGUAGE_OPTIONS.length; i += 2) {
    rows.push(LANGUAGE_OPTIONS.slice(i, i + 2));
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.lg,
          paddingBottom: 48,
          gap: spacing.md,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.headerCol, { gap: spacing.xxs }]}>
        <Text variant="display" color="ink" weight="bold">
          Select a language
        </Text>
        <Text variant="body" color="muted">
          Choose the language you are most comfortable reading
        </Text>
      </View>

      {/* 2-Column Grid */}
      <View style={[styles.grid, { gap: spacing.sm }]}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={[styles.row, { gap: spacing.sm }]}>
            {row.map((option) => {
              const isSelected = selectedLanguage === option.id;
              const cardBg = colors[option.tint];

              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.nativeName}, ${option.englishName}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onSelectLanguage(option.id)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: cardBg,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : borders.width,
                      borderRadius: radii.lg,
                      padding: spacing.sm,
                      minHeight: Math.max(116, minTouchTarget),
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  {/* Top-left: Text labels */}
                  <View style={styles.textCol}>
                    <Text variant="title" color="ink" weight="bold">
                      {option.nativeName}
                    </Text>
                    <Text variant="bodySmall" color="muted">
                      {option.englishName}
                    </Text>
                  </View>

                  {/* Bottom-right: Monument line doodle */}
                  <View style={styles.doodleWrapper}>
                    <MonumentDoodle language={option.id} size={54} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexDirection: 'column',
  },
  headerCol: {
    flexDirection: 'column',
  },
  grid: {
    flexDirection: 'column',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  card: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  textCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  doodleWrapper: {
    alignSelf: 'flex-end',
    marginTop: 4,
    zIndex: 1,
  },
});
