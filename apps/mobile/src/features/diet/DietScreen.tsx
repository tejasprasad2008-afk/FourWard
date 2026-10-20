import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, Pressable, ScrollView, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Text, Button, Tag } from '../../components/primitives';
import { Icon } from '../../components/icons';
import { FeatureErrorBoundary } from '../common/ErrorBoundary';
import { FEATURES } from '../registry';
import {
  fetchDiet,
  toggleMeal as toggleMealService,
  onDietChange,
  DEFAULT_DOCTOR_RESTRICTIONS,
  DEFAULT_MEAL_TEMPLATES,
} from '../../services/dietService';
import type {
  DietRegion,
  DietSetting,
  DietDataResponse,
} from '../../../../../packages/contracts/src/diet';

const REGIONS: DietRegion[] = ['Telugu / Deccan', 'South Indian', 'North Indian'];
const FOOD_THUMB = require('../../../assets/tiles/ref_thali.webp');

interface DietScreenProps {
  hasHeader?: boolean;
}

export function DietScreen({ hasHeader = false }: DietScreenProps) {
  const { colors, spacing, radii, borders } = useTheme();
  const insets = useSafeAreaInsets();

  const [region, setRegion] = useState<DietRegion>('Telugu / Deccan');
  const [setting, setSetting] = useState<DietSetting>('urban');
  const [dietData, setDietData] = useState<DietDataResponse>({
    region: 'Telugu / Deccan',
    setting: 'urban',
    doctorRestrictions: DEFAULT_DOCTOR_RESTRICTIONS,
    dailyTargets: {
      caloriesTarget: 1850,
      caloriesConsumed: 860,
      proteinGrams: 65,
      proteinConsumed: 28,
      sodiumMg: 1180,
      sodiumLimitMg: 1500,
    },
    meals: DEFAULT_MEAL_TEMPLATES['Telugu / Deccan']['urban'],
  });

  const progressAnim = useRef(new Animated.Value(0.46)).current;

  useEffect(() => {
    let active = true;
    fetchDiet(region, setting).then((data) => {
      if (active) setDietData(data);
    });

    const unsub = onDietChange((updated) => {
      setDietData(updated);
    });

    return () => {
      active = false;
      unsub();
    };
  }, [region, setting]);

  const { dailyTargets, meals, doctorRestrictions } = dietData;
  const progressPercent = Math.min(
    100,
    Math.round((dailyTargets.caloriesConsumed / dailyTargets.caloriesTarget) * 100)
  );

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent / 100,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  const handleToggleMeal = async (mealId: string) => {
    const next = await toggleMealService(mealId, region, setting);
    setDietData(next);
  };

  const topPadding = hasHeader
    ? spacing.sm
    : Math.max(insets.top, 16) + spacing.xs;

  // Estimated macros
  const carbsGrams = Math.round((dailyTargets.caloriesConsumed * 0.55) / 4);
  const carbsTarget = 240;
  const fatGrams = Math.round((dailyTargets.caloriesConsumed * 0.25) / 9);
  const fatTarget = 50;

  return (
    <FeatureErrorBoundary fallbackTitle="Diet Unavailable">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <FlatList
          data={meals}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: spacing.md,
              paddingTop: topPadding,
              paddingBottom: 120,
              gap: spacing.sm,
            },
          ]}
          ListHeaderComponent={
            <View style={[styles.headerContainer, { gap: spacing.md }]}>
              {/* Feature Header */}
              <View style={styles.header}>
                <Text variant="headline" color="ink" weight="bold">
                  {FEATURES.diet.name}
                </Text>
                <Text variant="body" color="muted">
                  Daily nutrition and doctor-approved meal plan.
                </Text>
              </View>

              {/* Compact Regional & Setting Selector */}
              <View
                style={[
                  styles.selectorCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.md,
                    padding: spacing.sm,
                    gap: spacing.xs,
                  },
                ]}
              >
                <Text variant="caption" color="muted" weight="bold">
                  Region & cuisine
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.xs }}
                >
                  {REGIONS.map((r) => {
                    const isSelected = region === r;
                    return (
                      <Pressable
                        key={r}
                        accessibilityRole="button"
                        accessibilityLabel={`Select region ${r}`}
                        onPress={() => setRegion(r)}
                        style={[
                          styles.chipPressable,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderWidth: borders.width,
                            borderRadius: radii.sm,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 6,
                            minHeight: 36,
                          },
                        ]}
                      >
                        <Text
                          variant="caption"
                          color={isSelected ? 'surface' : 'ink'}
                          weight={isSelected ? 'bold' : 'regular'}
                        >
                          {r}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={[styles.settingToggleRow, { gap: spacing.xs, marginTop: 2 }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select urban kitchen foods"
                    onPress={() => setSetting('urban')}
                    style={[
                      styles.settingButton,
                      {
                        backgroundColor: setting === 'urban' ? colors.primaryTint : colors.surface,
                        borderColor: setting === 'urban' ? colors.primary : colors.border,
                        borderWidth: borders.width,
                        borderRadius: radii.sm,
                        paddingVertical: 6,
                        minHeight: 36,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      color={setting === 'urban' ? 'primary' : 'ink'}
                      weight={setting === 'urban' ? 'bold' : 'regular'}
                    >
                      Urban kitchen
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select rural traditional millets"
                    onPress={() => setSetting('rural')}
                    style={[
                      styles.settingButton,
                      {
                        backgroundColor: setting === 'rural' ? colors.primaryTint : colors.surface,
                        borderColor: setting === 'rural' ? colors.primary : colors.border,
                        borderWidth: borders.width,
                        borderRadius: radii.sm,
                        paddingVertical: 6,
                        minHeight: 36,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      color={setting === 'rural' ? 'primary' : 'ink'}
                      weight={setting === 'rural' ? 'bold' : 'regular'}
                    >
                      Traditional millets
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Doctor Restrictions Banner */}
              <View
                style={[
                  styles.restrictionsCard,
                  {
                    backgroundColor: colors.peachTint,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.md,
                    padding: spacing.sm,
                    gap: spacing.xxs,
                  },
                ]}
              >
                <View style={styles.restrictionsTitleRow}>
                  <Icon name="warning" size={14} tone="primary" />
                  <Text variant="caption" color="primary" weight="bold">
                    Doctor clinical guidance
                  </Text>
                </View>

                {doctorRestrictions.map((res) => (
                  <View key={res.id} style={styles.restrictionRow}>
                    <Text variant="bodySmall" color="ink" weight="semiBold">
                      {`• ${res.rule}`}
                    </Text>
                    <Text variant="caption" color="muted">
                      {res.source}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Healthify-Style Top Hero Card */}
              <View
                style={[
                  styles.heroCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.lg,
                    padding: spacing.md,
                    gap: spacing.md,
                  },
                ]}
              >
                {/* Big Display Numbers (No Wrapping) */}
                <View style={styles.calorieHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                      <Text variant="display" color="ink" weight="bold">
                        {dailyTargets.caloriesConsumed}
                      </Text>
                      <Text variant="subhead" color="muted" weight="semiBold">
                        / {dailyTargets.caloriesTarget} kcal
                      </Text>
                    </View>
                    <Text variant="caption" color="muted">
                      Daily calorie intake · {progressPercent}% of target
                    </Text>
                  </View>
                  <Tag
                    label={progressPercent >= 100 ? 'Target met' : `${Math.max(0, dailyTargets.caloriesTarget - dailyTargets.caloriesConsumed)} kcal left`}
                    variant={progressPercent >= 100 ? 'primary' : 'default'}
                  />
                </View>

                {/* Animated Calorie Progress Bar */}
                <View
                  style={[
                    styles.progressBarTrack,
                    {
                      borderColor: colors.border,
                      borderWidth: borders.width,
                      backgroundColor: colors.primaryTint,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: colors.primary,
                        borderRadius: radii.sm,
                      },
                    ]}
                  />
                </View>

                {/* Compact Horizontal Macro Meters (4 Columns, Full Readable Labels) */}
                <View style={[styles.macroGrid, { gap: spacing.xs }]}>
                  {/* Protein */}
                  <View style={[styles.macroCol, { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: borders.width, borderRadius: radii.sm, padding: spacing.xs }]}>
                    <Text variant="caption" color="muted" weight="bold">
                      Protein
                    </Text>
                    <Text variant="bodySmall" color="ink" weight="bold">
                      {`${dailyTargets.proteinConsumed}/${dailyTargets.proteinGrams}g`}
                    </Text>
                    <View style={[styles.miniMeterTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.miniMeterFill, { width: `${Math.min(100, Math.round((dailyTargets.proteinConsumed / dailyTargets.proteinGrams) * 100))}%`, backgroundColor: colors.primary }]} />
                    </View>
                  </View>

                  {/* Carbs */}
                  <View style={[styles.macroCol, { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: borders.width, borderRadius: radii.sm, padding: spacing.xs }]}>
                    <Text variant="caption" color="muted" weight="bold">
                      Carbs
                    </Text>
                    <Text variant="bodySmall" color="ink" weight="bold">
                      {`${carbsGrams}/${carbsTarget}g`}
                    </Text>
                    <View style={[styles.miniMeterTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.miniMeterFill, { width: `${Math.min(100, Math.round((carbsGrams / carbsTarget) * 100))}%`, backgroundColor: colors.accent }]} />
                    </View>
                  </View>

                  {/* Fat */}
                  <View style={[styles.macroCol, { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: borders.width, borderRadius: radii.sm, padding: spacing.xs }]}>
                    <Text variant="caption" color="muted" weight="bold">
                      Fat
                    </Text>
                    <Text variant="bodySmall" color="ink" weight="bold">
                      {`${fatGrams}/${fatTarget}g`}
                    </Text>
                    <View style={[styles.miniMeterTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.miniMeterFill, { width: `${Math.min(100, Math.round((fatGrams / fatTarget) * 100))}%`, backgroundColor: colors.ink }]} />
                    </View>
                  </View>

                  {/* Sodium */}
                  <View style={[styles.macroCol, { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: borders.width, borderRadius: radii.sm, padding: spacing.xs }]}>
                    <Text variant="caption" color="muted" weight="bold">
                      Sodium
                    </Text>
                    <Text variant="bodySmall" color="ink" weight="bold">
                      {`${dailyTargets.sodiumMg} mg`}
                    </Text>
                    <View style={[styles.miniMeterTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.miniMeterFill, { width: `${Math.min(100, Math.round((dailyTargets.sodiumMg / dailyTargets.sodiumLimitMg) * 100))}%`, backgroundColor: dailyTargets.sodiumMg > dailyTargets.sodiumLimitMg ? colors.danger : colors.primary }]} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Section Subheading */}
              <View style={styles.sectionHeaderRow}>
                <Text variant="subhead" color="ink" weight="bold">
                  Today's meal plan
                </Text>
                <Text variant="caption" color="muted">
                  {`${meals.filter((m) => m.logged).length} of ${meals.length} logged`}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.mealCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.md,
                  padding: spacing.sm,
                  gap: spacing.xs,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <Image
                  source={FOOD_THUMB}
                  style={[
                    styles.foodThumbnail,
                    {
                      borderColor: colors.border,
                      borderWidth: borders.width,
                      borderRadius: radii.sm,
                    },
                  ]}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="subhead" color="ink" weight="bold">
                      {item.name}
                    </Text>
                    <Tag label={`${item.calories} kcal`} variant={item.logged ? 'primary' : 'default'} />
                  </View>
                  <Text variant="caption" color="muted">
                    {item.time}
                  </Text>
                  <Text variant="bodySmall" color="ink" numberOfLines={2}>
                    {item.items}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
                <Button
                  variant={item.logged ? 'secondary' : 'primary'}
                  label={item.logged ? 'Logged' : '+ Log'}
                  onPress={() => handleToggleMeal(item.id)}
                />
              </View>
            </View>
          )}
        />
      </View>
    </FeatureErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'column',
    gap: 4,
  },
  selectorCard: {
    flexDirection: 'column',
  },
  chipPressable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restrictionsCard: {
    flexDirection: 'column',
  },
  restrictionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restrictionRow: {
    flexDirection: 'column',
    gap: 2,
    marginTop: 2,
  },
  heroCard: {
    flexDirection: 'column',
  },
  calorieHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarTrack: {
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  macroGrid: {
    flexDirection: 'row',
  },
  macroCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  miniMeterTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
    marginTop: 4,
  },
  miniMeterFill: {
    height: '100%',
    borderRadius: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  mealCard: {
    flexDirection: 'column',
    minHeight: 48,
  },
  foodThumbnail: {
    width: 52,
    height: 52,
    flexShrink: 0,
  },
});
