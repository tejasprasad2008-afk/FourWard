import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons';
import { useTheme } from '../../theme';
import { Text, Tag, Button, Sheet } from '../../components/primitives';
import { FeatureErrorBoundary } from '../common/ErrorBoundary';
import {
  getPatientProfile,
  savePatientProfile,
  resetPatientProfile,
  PatientProfile,
  DEFAULT_PATIENT_PROFILE,
  SupportedLanguage,
} from '../onboarding/onboardingStorage';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { getStorageItem, setStorageItem } from '../../services/storage';

const NOTIFICATIONS_STORAGE_KEY = '@fourward/notifications_enabled';

const LANGUAGE_DISPLAY_MAP: Record<SupportedLanguage, string> = {
  en: 'English (India)',
  te: 'తెలుగు (Telugu)',
  hi: 'हिन्दी (Hindi)',
  ta: 'தமிழ் (Tamil)',
  kn: 'ಕನ್ನಡ (Kannada)',
  ml: 'മലയാളം (Malayalam)',
  mr: 'मराठी (Marathi)',
  bn: 'বাংলা (Bengali)',
};

const SCHEME_DISPLAY_MAP: Record<string, string> = {
  aarogyasri: 'State Aarogyasri',
  pmjay: 'PM-JAY Card',
  cghs: 'CGHS Beneficiary',
  none: 'Private Insurance',
};

const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'mr', label: 'मराठी' },
  { code: 'bn', label: 'বাংলা' },
];

export function AccountScreen() {
  const { colors, spacing, radii, borders, mode, toggleMode, minTouchTarget, isDevScale135, toggleDevScale135 } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isElderly = mode === 'elderly';
  const [profile, setProfile] = useState<PatientProfile>(DEFAULT_PATIENT_PROFILE);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    getPatientProfile().then(setProfile);
    getStorageItem<boolean>(NOTIFICATIONS_STORAGE_KEY, true).then(setNotificationsEnabled);
  }, []);

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    const updated = { ...profile, language: lang };
    setProfile(updated);
    await savePatientProfile(updated);
  };

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    await setStorageItem(NOTIFICATIONS_STORAGE_KEY, val);
  };

  const handleRedoSetup = async () => {
    setIsSettingsOpen(false);
    await resetPatientProfile();
    setIsOnboardingActive(true);
  };

  const handleOnboardingComplete = () => {
    setIsOnboardingActive(false);
    getPatientProfile().then(setProfile);
  };

  return (
    <FeatureErrorBoundary fallbackTitle="Account Unavailable">
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={[
          styles.content,
          {
            padding: spacing.md,
            paddingTop: Math.max(insets.top, 16) + spacing.xs,
            gap: spacing.md,
            paddingBottom: 110,
          },
        ]}
      >
        {/* Top Header Card: Owner Name, Language, Card */}
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: borders.width,
              borderRadius: radii.lg,
              padding: spacing.md,
              gap: spacing.xs,
            },
          ]}
        >
          <Text variant="headline" color="ink" weight="bold">
            {profile.name}
          </Text>
          <View style={[styles.badgeRow, { gap: spacing.xs }]}>
            <Tag variant="primary" label={LANGUAGE_DISPLAY_MAP[profile.language] || 'English'} />
            <Tag variant="default" label={SCHEME_DISPLAY_MAP[profile.schemeCard] || 'Private'} />
            {isElderly && <Tag variant="danger" label="Senior UI" />}
          </View>
        </View>

        {/* 2-Column Tile Grid: My visits, Family, Documents, Settings, Help */}
        <View style={[styles.gridContainer, { gap: spacing.sm }]}>
          {/* Row 1: My visits & Family */}
          <View style={[styles.gridRow, { gap: spacing.sm }]}>
            {/* Tile 1: My visits */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="My visits"
              onPress={() => router.push('/(tabs)/doctors' as any)}
              style={[
                styles.tile,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  minHeight: minTouchTarget * 2,
                },
              ]}
            >
              <Icon name="visits" size={22} tone="primary" />
              <View style={{ gap: 2 }}>
                <Text variant="subhead" color="ink" weight="bold">
                  My visits
                </Text>
                <Text variant="caption" color="muted">
                  Bookings and slots
                </Text>
              </View>
            </Pressable>

            {/* Tile 2: Family */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Family"
              onPress={() => router.push('/features/family' as any)}
              style={[
                styles.tile,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  minHeight: minTouchTarget * 2,
                },
              ]}
            >
              <Icon name="family" size={22} tone="primary" />
              <View style={{ gap: 2 }}>
                <Text variant="subhead" color="ink" weight="bold">
                  Family
                </Text>
                <Text variant="caption" color="muted">
                  Managed people
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Row 2: Documents & Settings */}
          <View style={[styles.gridRow, { gap: spacing.sm }]}>
            {/* Tile 3: Documents (opens Records) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Documents"
              onPress={() => router.push('/(tabs)/records' as any)}
              style={[
                styles.tile,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  minHeight: minTouchTarget * 2,
                },
              ]}
            >
              <Icon name="documents" size={22} tone="primary" />
              <View style={{ gap: 2 }}>
                <Text variant="subhead" color="ink" weight="bold">
                  Documents
                </Text>
                <Text variant="caption" color="muted">
                  Records and reports
                </Text>
              </View>
            </Pressable>

            {/* Tile 4: Settings */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => setIsSettingsOpen(true)}
              style={[
                styles.tile,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  minHeight: minTouchTarget * 2,
                },
              ]}
            >
              <Icon name="settings" size={22} tone="primary" />
              <View style={{ gap: 2 }}>
                <Text variant="subhead" color="ink" weight="bold">
                  Settings
                </Text>
                <Text variant="caption" color="muted">
                  Preferences and UI
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Row 3: Help (spans full width) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Help"
            onPress={() => setIsHelpOpen(true)}
            style={[
              styles.tileFull,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: borders.width,
                borderRadius: radii.lg,
                padding: spacing.md,
                minHeight: minTouchTarget,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name="help" size={22} tone="primary" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="subhead" color="ink" weight="bold">
                  Help
                </Text>
                <Text variant="caption" color="muted">
                  Emergency assistance and contact
                </Text>
              </View>
              <Icon name="next" size={18} tone="muted" />
            </View>
          </Pressable>
        </View>

        {/* Settings Sheet: language, notifications, Redo setup, Senior UI toggle */}
        <Sheet
          visible={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          title="Settings"
        >
          <View style={{ gap: spacing.md }}>
            {/* 1. Language selector */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                LANGUAGE
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = profile.language === lang.code;
                  return (
                    <Pressable
                      key={lang.code}
                      accessibilityRole="button"
                      accessibilityLabel={`Select language ${lang.label}`}
                      onPress={() => handleLanguageChange(lang.code)}
                      style={[
                        styles.chipPressable,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: borders.width,
                          borderRadius: radii.md,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                          minHeight: 40,
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        color={isSelected ? 'surface' : 'ink'}
                        weight={isSelected ? 'bold' : 'regular'}
                      >
                        {lang.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Notifications toggle */}
            <View style={[styles.toggleRow, { minHeight: minTouchTarget }]}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text variant="body" color="ink" weight="semiBold">
                  Visit notifications
                </Text>
                <Text variant="caption" color="muted">
                  Reminders 1 day and 2 hours before
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            {/* 3. Senior UI toggle */}
            <View style={[styles.toggleRow, { minHeight: minTouchTarget }]}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text variant="body" color="ink" weight="semiBold">
                  Senior UI mode
                </Text>
                <Text variant="caption" color="muted">
                  Enlarged text and larger touch targets
                </Text>
              </View>
              <Switch
                value={isElderly}
                onValueChange={toggleMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            {/* 4. Redo setup button */}
            <View style={{ marginTop: spacing.xs }}>
              <Button
                variant="secondary"
                label="Change language / Redo setup"
                fullWidth
                onPress={handleRedoSetup}
              />
            </View>

            {/* 5. Developer Tools (__DEV__ only) */}
            {__DEV__ && (
              <View
                style={{
                  borderTopColor: colors.border,
                  borderTopWidth: borders.width,
                  paddingTop: spacing.sm,
                  gap: spacing.sm,
                }}
              >
                <Text variant="caption" color="muted" weight="semiBold">
                  DEVELOPER TOOLS
                </Text>

                {/* Dev Toggle for Font Scale 1.35 */}
                <View style={[styles.toggleRow, { minHeight: minTouchTarget }]}>
                  <View style={{ flex: 1, paddingRight: spacing.sm }}>
                    <Text variant="body" color="ink" weight="semiBold">
                      Dev font scale: 1.35
                    </Text>
                    <Text variant="caption" color="muted">
                      Tests 1.35 scale independent of Senior UI
                    </Text>
                  </View>
                  <Switch
                    value={isDevScale135}
                    onValueChange={toggleDevScale135}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                </View>

                {/* Dev Row: Layout stress test */}
                <Button
                  variant="secondary"
                  label="Layout stress test (/dev/stress)"
                  fullWidth
                  onPress={() => {
                    setIsSettingsOpen(false);
                    router.push('/dev/stress' as any);
                  }}
                />
              </View>
            )}
          </View>
        </Sheet>

        {/* Help Sheet */}
        <Sheet
          visible={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="Help & support"
        >
          <View style={{ gap: spacing.md }}>
            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: colors.dangerTint,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  gap: spacing.xs,
                },
              ]}
            >
              <Text variant="label" color="danger">
                EMERGENCY ASSISTANCE
              </Text>
              <Text variant="bodySmall" color="ink">
                For life-threatening cardiac, trauma, or respiratory emergencies, call emergency ambulance services immediately.
              </Text>
              <View style={{ marginTop: spacing.xs }}>
                <Button
                  variant="danger"
                  label="Call 108 Ambulance"
                  onPress={() => Linking.openURL('tel:108').catch(() => {})}
                />
              </View>
            </View>

            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                Hospital helpdesk
              </Text>
              <Text variant="body" color="ink">
                City Care Hospital Central Reception: +91 40 2360 7777
              </Text>
              <Text variant="bodySmall" color="muted">
                Available 24 hours for OPD scheduling and patient enquiries.
              </Text>
            </View>
          </View>
        </Sheet>
      </ScrollView>

      {/* Onboarding Overlay when Redo Setup is active */}
      {isOnboardingActive && (
        <OnboardingFlow
          initialLanguage={profile.language}
          onComplete={handleOnboardingComplete}
        />
      )}
    </FeatureErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexDirection: 'column',
  },
  headerCard: {
    width: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridContainer: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
  },
  tile: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 12,
  },
  tileFull: {
    width: '100%',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBox: {
    width: '100%',
  },
});
