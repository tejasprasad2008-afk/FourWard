import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { fontFamilies } from '../../theme/tokens';
import { Text } from '../../components/primitives/Text';
import { Button } from '../../components/primitives/Button';
import { TRANSLATIONS } from './translations';
import type {
  SupportedLanguage,
  AgeGroup,
  LivingSetting,
  MaternalStatus,
  SchemeCard,
  PatientProfile,
} from './onboardingStorage';

export interface QuestionnaireStepProps {
  language: SupportedLanguage;
  onChangeLanguage: () => void;
  onComplete: (profile: PatientProfile) => void;
}

export function QuestionnaireStep({
  language,
  onChangeLanguage,
  onComplete,
}: QuestionnaireStepProps) {
  const { colors, spacing, radii, borders, minTouchTarget, typography, setMode } = useTheme();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Questionnaire form state
  const [stepIndex, setStepIndex] = useState(0); // 0 to 4
  const [name, setName] = useState('Tejas');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('under_35');
  const [setting, setSetting] = useState<LivingSetting>('urban');
  const [conditions, setConditions] = useState<string[]>(['none']);
  const [maternalStatus, setMaternalStatus] = useState<MaternalStatus>('none');
  const [schemeCard, setSchemeCard] = useState<SchemeCard>('aarogyasri');
  const [emergencyPhone, setEmergencyPhone] = useState('9849028143');

  const handleAgeSelect = (age: AgeGroup) => {
    setAgeGroup(age);
    if (age === '60_plus') {
      setMode('elderly');
    } else {
      setMode('normal');
    }
  };

  const handleConditionToggle = (cond: string) => {
    if (cond === 'none') {
      setConditions(['none']);
      return;
    }

    const withoutNone = conditions.filter((c) => c !== 'none');
    if (withoutNone.includes(cond)) {
      const remaining = withoutNone.filter((c) => c !== cond);
      setConditions(remaining.length === 0 ? ['none'] : remaining);
    } else {
      setConditions([...withoutNone, cond]);
    }
  };

  const handleNext = () => {
    if (stepIndex < 4) {
      setStepIndex((prev) => prev + 1);
    } else {
      // Completed all 5 steps
      const profile: PatientProfile = {
        hasCompletedOnboarding: true,
        language,
        name: name.trim() || 'Tejas',
        ageGroup,
        setting,
        conditions,
        maternalStatus,
        schemeCard,
        emergencyPhone: emergencyPhone.trim() || undefined,
      };
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    } else {
      onChangeLanguage();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: 48,
            gap: spacing.md,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation Row */}
        <View style={styles.topNavRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={stepIndex === 0 ? t.changeLanguage : 'Back'}
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              {
                minHeight: minTouchTarget,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text variant="label" color="primary" weight="bold">
              {stepIndex === 0 ? t.changeLanguage : '← Back'}
            </Text>
          </Pressable>

          <Text variant="caption" color="muted" weight="semiBold">
            {t.stepIndicator(stepIndex + 1, 5)}
          </Text>
        </View>

        {/* Step Progress Bar (5 flat segments) */}
        <View style={[styles.progressTrack, { gap: spacing.xxs }]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={`prog-${i}`}
              style={[
                styles.progressSegment,
                {
                  backgroundColor: i <= stepIndex ? colors.primary : colors.border,
                  height: 3,
                  borderRadius: radii.sm,
                },
              ]}
            />
          ))}
        </View>

        {/* QUESTION 1: WHO IS THIS FOR? */}
        {stepIndex === 0 && (
          <View style={[styles.stepContainer, { gap: spacing.md }]}>
            <View style={{ gap: spacing.xxs }}>
              <Text variant="headline" color="ink" weight="bold">
                {t.step1Title}
              </Text>
              <Text variant="bodySmall" color="muted">
                {t.step1Subtitle}
              </Text>
            </View>

            {/* Name Input */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="label" color="ink" weight="semiBold">
                {t.nameLabel}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t.namePlaceholder}
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.sm,
                    fontSize: typography.body.fontSize,
                    color: colors.ink,
                  },
                ]}
              />
            </View>

            {/* Age Band Cards */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="label" color="ink" weight="semiBold">
                {t.ageLabel}
              </Text>

              {/* Under 35 */}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: ageGroup === 'under_35' }}
                onPress={() => handleAgeSelect('under_35')}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: ageGroup === 'under_35' ? colors.sageTint : colors.surface,
                    borderColor: ageGroup === 'under_35' ? colors.primary : colors.border,
                    borderWidth: ageGroup === 'under_35' ? 2 : borders.width,
                    borderRadius: radii.lg,
                    padding: spacing.sm,
                    minHeight: minTouchTarget,
                  },
                ]}
              >
                <Text variant="body" color="ink" weight={ageGroup === 'under_35' ? 'bold' : 'regular'}>
                  {t.ageUnder35}
                </Text>
              </Pressable>

              {/* 35-59 */}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: ageGroup === '35_59' }}
                onPress={() => handleAgeSelect('35_59')}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: ageGroup === '35_59' ? colors.sageTint : colors.surface,
                    borderColor: ageGroup === '35_59' ? colors.primary : colors.border,
                    borderWidth: ageGroup === '35_59' ? 2 : borders.width,
                    borderRadius: radii.lg,
                    padding: spacing.sm,
                    minHeight: minTouchTarget,
                  },
                ]}
              >
                <Text variant="body" color="ink" weight={ageGroup === '35_59' ? 'bold' : 'regular'}>
                  {t.age35to59}
                </Text>
              </Pressable>

              {/* 60+ Senior */}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: ageGroup === '60_plus' }}
                onPress={() => handleAgeSelect('60_plus')}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: ageGroup === '60_plus' ? colors.peachTint : colors.surface,
                    borderColor: ageGroup === '60_plus' ? colors.primary : colors.border,
                    borderWidth: ageGroup === '60_plus' ? 2 : borders.width,
                    borderRadius: radii.lg,
                    padding: spacing.sm,
                    minHeight: minTouchTarget,
                  },
                ]}
              >
                <View style={{ gap: spacing.xxs }}>
                  <Text variant="body" color="ink" weight={ageGroup === '60_plus' ? 'bold' : 'regular'}>
                    {t.age60Plus}
                  </Text>
                  <Text variant="caption" color="primary" weight="semiBold">
                    {t.age60PlusHint}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {/* QUESTION 2: WHERE DO YOU LIVE? */}
        {stepIndex === 1 && (
          <View style={[styles.stepContainer, { gap: spacing.md }]}>
            <View style={{ gap: spacing.xxs }}>
              <Text variant="headline" color="ink" weight="bold">
                {t.step2Title}
              </Text>
              <Text variant="bodySmall" color="muted">
                {t.step2Subtitle}
              </Text>
            </View>

            <View style={{ gap: spacing.sm }}>
              {/* Urban */}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: setting === 'urban' }}
                onPress={() => setSetting('urban')}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: setting === 'urban' ? colors.sageTint : colors.surface,
                    borderColor: setting === 'urban' ? colors.primary : colors.border,
                    borderWidth: setting === 'urban' ? 2 : borders.width,
                    borderRadius: radii.lg,
                    padding: spacing.md,
                    minHeight: minTouchTarget,
                  },
                ]}
              >
                <View style={{ gap: spacing.xxs }}>
                  <Text variant="subhead" color="ink" weight="bold">
                    {t.settingUrban}
                  </Text>
                  <Text variant="bodySmall" color="muted">
                    {t.settingUrbanDesc}
                  </Text>
                </View>
              </Pressable>

              {/* Rural */}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: setting === 'rural' }}
                onPress={() => setSetting('rural')}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: setting === 'rural' ? colors.peachTint : colors.surface,
                    borderColor: setting === 'rural' ? colors.primary : colors.border,
                    borderWidth: setting === 'rural' ? 2 : borders.width,
                    borderRadius: radii.lg,
                    padding: spacing.md,
                    minHeight: minTouchTarget,
                  },
                ]}
              >
                <View style={{ gap: spacing.xxs }}>
                  <Text variant="subhead" color="ink" weight="bold">
                    {t.settingRural}
                  </Text>
                  <Text variant="bodySmall" color="muted">
                    {t.settingRuralDesc}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {/* QUESTION 3: HEALTH CONDITIONS */}
        {stepIndex === 2 && (
          <View style={[styles.stepContainer, { gap: spacing.md }]}>
            <View style={{ gap: spacing.xxs }}>
              <Text variant="headline" color="ink" weight="bold">
                {t.step3Title}
              </Text>
              <Text variant="bodySmall" color="muted">
                {t.step3Subtitle}
              </Text>
            </View>

            <View style={{ gap: spacing.xs }}>
              {[
                { id: 'diabetes', label: t.conditionDiabetes },
                { id: 'hypertension', label: t.conditionHypertension },
                { id: 'joint', label: t.conditionJoint },
                { id: 'none', label: t.conditionNone },
              ].map((item) => {
                const isSelected = conditions.includes(item.id);

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleConditionToggle(item.id)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected ? colors.sageTint : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : borders.width,
                        borderRadius: radii.lg,
                        padding: spacing.sm,
                        minHeight: minTouchTarget,
                      },
                    ]}
                  >
                    <Text variant="body" color="ink" weight={isSelected ? 'bold' : 'regular'}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* QUESTION 4: MATERNAL & BABY CARE */}
        {stepIndex === 3 && (
          <View style={[styles.stepContainer, { gap: spacing.md }]}>
            <View style={{ gap: spacing.xxs }}>
              <Text variant="headline" color="ink" weight="bold">
                {t.step4Title}
              </Text>
              <Text variant="bodySmall" color="muted">
                {t.step4Subtitle}
              </Text>
            </View>

            <View style={{ gap: spacing.xs }}>
              {[
                { id: 'pregnant' as const, label: t.maternalPregnant },
                { id: 'newborn' as const, label: t.maternalNewborn },
                { id: 'none' as const, label: t.maternalNone },
              ].map((item) => {
                const isSelected = maternalStatus === item.id;

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setMaternalStatus(item.id)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected ? colors.peachTint : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : borders.width,
                        borderRadius: radii.lg,
                        padding: spacing.sm,
                        minHeight: minTouchTarget,
                      },
                    ]}
                  >
                    <Text variant="body" color="ink" weight={isSelected ? 'bold' : 'regular'}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* QUESTION 5: FAMILY & HEALTH CARD */}
        {stepIndex === 4 && (
          <View style={[styles.stepContainer, { gap: spacing.md }]}>
            <View style={{ gap: spacing.xxs }}>
              <Text variant="headline" color="ink" weight="bold">
                {t.step5Title}
              </Text>
              <Text variant="bodySmall" color="muted">
                {t.step5Subtitle}
              </Text>
            </View>

            {/* Scheme Cards */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="label" color="ink" weight="semiBold">
                {t.schemeLabel}
              </Text>

              {[
                { id: 'aarogyasri' as const, label: t.schemeAarogyasri },
                { id: 'pmjay' as const, label: t.schemePmjay },
                { id: 'cghs' as const, label: t.schemeCghs },
                { id: 'none' as const, label: t.schemeNone },
              ].map((item) => {
                const isSelected = schemeCard === item.id;

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setSchemeCard(item.id)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected ? colors.sageTint : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : borders.width,
                        borderRadius: radii.lg,
                        padding: spacing.sm,
                        minHeight: minTouchTarget,
                      },
                    ]}
                  >
                    <Text variant="body" color="ink" weight={isSelected ? 'bold' : 'regular'}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Caregiver Mobile */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="label" color="ink" weight="semiBold">
                {t.phoneLabel}
              </Text>
              <TextInput
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                placeholder={t.phonePlaceholder}
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                maxLength={10}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.sm,
                    fontSize: typography.body.fontSize,
                    color: colors.ink,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Continue / Finish Action Button */}
        <View style={{ marginTop: spacing.sm }}>
          <Button
            variant="primary"
            fullWidth
            label={stepIndex === 4 ? t.finish : t.continue}
            onPress={handleNext}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexDirection: 'column',
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    justifyContent: 'center',
  },
  progressTrack: {
    flexDirection: 'row',
    width: '100%',
  },
  progressSegment: {
    flex: 1,
  },
  stepContainer: {
    flexDirection: 'column',
  },
  input: {
    minHeight: 48,
    fontFamily: fontFamilies.bodyRegular,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
