import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Tile } from '../../components/primitives/Tile';
import { Logo } from '../../components/primitives/Logo';
import { Text } from '../../components/primitives/Text';
import { Button } from '../../components/primitives/Button';
import { Tag } from '../../components/primitives/Tag';
import { Sheet } from '../../components/primitives/Sheet';
import { AssistantFloatingButton } from '../../components/assistant/AssistantFloatingButton';
import { FeatureErrorBoundary } from '../../features/common/ErrorBoundary';
import { getTileFeatures, FeatureDefinition } from '../../features/registry';
import { LocationPickerModal } from '../../components/location/LocationPickerModal';
import { getDeviceLocation, initDeviceLocation, UserLocation } from '../../services/locationStorage';
import { getPatientProfile, PatientProfile, DEFAULT_PATIENT_PROFILE } from '../../features/onboarding/onboardingStorage';
import {
  initTriageState,
  fetchPatientVisits,
  saveBookingDraft,
  createBookAgainDraft,
  ActiveTokenBooking,
} from '../../services/triageService';
import {
  getActivePerson,
  setActivePersonId,
  fetchManagedPersons,
  onActivePersonChange,
  DEFAULT_MANAGED_PERSONS,
} from '../../services/familyService';
import {
  getRemindersForPatient,
  markDoseTaken as markDoseTakenService,
  onRemindersChange,
  MedicineReminder,
} from '../../services/remindersService';
import {
  fetchDiet,
  onDietChange,
} from '../../services/dietService';
import type { ManagedPerson } from '../../../../../packages/contracts/src/family';
import type { DoctorBookingResponse } from '../../../../../packages/contracts/src/doctors';
import type { DietDataResponse } from '../../../../../packages/contracts/src/diet';

export default function HomeScreen() {
  const { colors, spacing, radii, borders, iconTokens, mode, toggleMode, minTouchTarget } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isElderly = mode === 'elderly';

  // Active Person state & switcher
  const [activePerson, setActivePerson] = useState<ManagedPerson>(DEFAULT_MANAGED_PERSONS[0]);
  const [managedPersons, setManagedPersons] = useState<ManagedPerson[]>(DEFAULT_MANAGED_PERSONS);
  const [isPersonSwitcherOpen, setIsPersonSwitcherOpen] = useState(false);

  // Patient Profile state
  const [profile, setProfile] = useState<PatientProfile>(DEFAULT_PATIENT_PROFILE);

  // Active Booking & Past Visit states for current person
  const [activeBooking, setActiveBooking] = useState<ActiveTokenBooking | null>(null);
  const [pastVisit, setPastVisit] = useState<DoctorBookingResponse | null>(null);

  // Medicines next dose & Diet progress live dashboard states
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [dietData, setDietData] = useState<DietDataResponse | null>(null);

  // Location State (persisted across restarts)
  const [currentLocation, setCurrentLocation] = useState<UserLocation>(getDeviceLocation());
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const loadPersonVisits = useCallback((person: ManagedPerson) => {
    fetchPatientVisits(person.id).then((allVisits) => {
      const past = allVisits.find((v) => v.status === 'completed');
      setPastVisit(past || null);
      const upcoming = allVisits.find((v) => v.status === 'confirmed' || v.status === 'requested');
      setActiveBooking(upcoming || null);
    });
    getRemindersForPatient(person.id).then(setReminders);
  }, []);

  useEffect(() => {
    initDeviceLocation().then((loc) => {
      setCurrentLocation(loc);
    });
    getPatientProfile().then((p) => {
      setProfile(p);
    });
    getActivePerson().then((person) => {
      setActivePerson(person);
      loadPersonVisits(person);
    });
    fetchManagedPersons().then(setManagedPersons);
    fetchDiet().then(setDietData);

    const unsubPerson = onActivePersonChange((person) => {
      setActivePerson(person);
      loadPersonVisits(person);
    });

    const unsubRem = onRemindersChange((updated) => {
      setReminders(updated);
    });

    const unsubDiet = onDietChange((updated) => {
      setDietData(updated);
    });

    return () => {
      unsubPerson();
      unsubRem();
      unsubDiet();
    };
  }, [loadPersonVisits]);

  const nextDose = useMemo(() => {
    return reminders.find((r) => r.isNextDose && !r.takenToday) ||
      reminders.find((r) => !r.takenToday) ||
      null;
  }, [reminders]);

  const handleHomeMarkTaken = async (id: string) => {
    const updated = await markDoseTakenService(id);
    setReminders(updated);
  };

  const handleBookAgain = async () => {
    if (!pastVisit) return;
    await saveBookingDraft(createBookAgainDraft(pastVisit));
    router.push('/(tabs)/doctors' as any);
  };

  const handleSelectPerson = async (person: ManagedPerson) => {
    if (person.status === 'waiting_approval') {
      setIsPersonSwitcherOpen(false);
      router.push('/features/family' as any);
      return;
    }
    const updated = await setActivePersonId(person.id);
    setActivePerson(updated);
    loadPersonVisits(updated);
    setIsPersonSwitcherOpen(false);
  };

  // Features directly from single-source registry
  const displayedTiles = useMemo(() => {
    return getTileFeatures(isElderly);
  }, [isElderly]);

  // Chunk tiles into 2-column rows for stable layout
  const tileRows = useMemo(() => {
    const rows: FeatureDefinition[][] = [];
    for (let i = 0; i < displayedTiles.length; i += 2) {
      rows.push(displayedTiles.slice(i, i + 2));
    }
    return rows;
  }, [displayedTiles]);

  return (
    <FeatureErrorBoundary fallbackTitle="Home Unavailable">
      <View style={[styles.outerContainer, { backgroundColor: colors.bg, paddingTop: Math.max(insets.top, 24) }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Mobile Frame */}
          <View style={[styles.phoneFrame, { maxWidth: 430, paddingHorizontal: spacing.sm }]}>
            {/* 1. Header: Logo left-aligned + Senior UI toggle */}
            <View style={[styles.headerRow, { marginTop: spacing.xs, minHeight: minTouchTarget }]}>
              <Logo variant="lockup" height={32} />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle senior elderly mode"
                onPress={toggleMode}
                style={[
                  styles.modeButton,
                  {
                    backgroundColor: isElderly ? colors.primary : colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.sm,
                    paddingHorizontal: spacing.xs,
                    minHeight: 30,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  color={isElderly ? 'surface' : 'ink'}
                  weight="semiBold"
                >
                  {isElderly ? 'Elderly: ON' : 'Senior UI'}
                </Text>
              </Pressable>
            </View>

            {/* 1b. "Viewing: Name" Row (opens Person Switcher Sheet) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Viewing ${activePerson.name}. Tap to switch person.`}
              onPress={() => {
                fetchManagedPersons().then(setManagedPersons);
                setIsPersonSwitcherOpen(true);
              }}
              style={[
                styles.viewingBar,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.md,
                  marginTop: spacing.xs,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  minHeight: 48,
                },
              ]}
            >
              <View style={styles.viewingLeft}>
                <Text variant="caption" color="primary" weight="bold">
                  Viewing:
                </Text>
                <Text variant="body" color="ink" weight="bold" style={styles.viewingName}>
                  {activePerson.name}
                </Text>
                {activePerson.relation && (
                  <Tag
                    variant="default"
                    label={activePerson.relation === 'Self' ? 'Primary' : activePerson.relation}
                  />
                )}
              </View>
              <Icon name="dropdown" size={16} tone="muted" />
            </Pressable>

            {/* 1c. "Book again" card on top when a past visit exists for active person */}
            {pastVisit && (
              <View
                style={[
                  styles.bookAgainCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.md,
                    marginTop: spacing.xs,
                    padding: spacing.sm,
                    gap: spacing.xs,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="caption" color="primary" weight="bold">
                    Past consultation
                  </Text>
                  <Text variant="caption" color="muted">
                    {pastVisit.date}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, gap: 2, paddingRight: spacing.xs }}>
                    <Text variant="subhead" color="ink" weight="bold" style={{ flexWrap: 'wrap' }}>
                      {pastVisit.doctorName}
                    </Text>
                    <Text variant="caption" color="muted">
                      {pastVisit.department} · {pastVisit.hospitalName}
                    </Text>
                    {pastVisit.patientName && (
                      <Text variant="caption" color="primary">
                        For {pastVisit.patientName}
                      </Text>
                    )}
                  </View>

                  <Button
                    variant="primary"
                    label="Book again"
                    onPress={handleBookAgain}
                  />
                </View>
              </View>
            )}

            {/* 2. Location Row (Opens full-screen location picker) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Current hospital location: ${currentLocation.locality}. Tap to change.`}
              onPress={() => setIsLocationPickerOpen(true)}
              style={[
                styles.locationBar,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.md,
                  marginTop: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  minHeight: 44,
                },
              ]}
            >
              <View style={styles.locationLeft}>
                <Icon name="pin" size={16} tone="primary" />
                <Text variant="label" color="ink" weight="bold" numberOfLines={1}>
                  {currentLocation.locality}
                </Text>
              </View>
              <Icon name="dropdown" size={16} tone="muted" />
            </Pressable>

            {/* Live Daily Dashboard Section */}
            <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
              {/* 1. Today's Upcoming Visit Card (with direct Check-in button) */}
              {activeBooking ? (
                <View
                  style={[
                    styles.dashboardCard,
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="caption" color="primary" weight="bold">
                      {`Upcoming visit · ${activeBooking.hospitalName}`}
                    </Text>
                    <Tag label="Confirmed" variant="primary" />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: spacing.sm, gap: 2 }}>
                      <Text variant="subhead" color="ink" weight="bold" style={{ flexWrap: 'wrap' }}>
                        {activeBooking.doctorName}
                      </Text>
                      <Text variant="caption" color="muted">
                        {activeBooking.department} · {activeBooking.date || 'Today'} · {activeBooking.time}
                      </Text>
                      {activeBooking.room ? (
                        <Text variant="caption" color="primary">
                          {activeBooking.room}
                        </Text>
                      ) : null}
                    </View>

                    <Button
                      variant="primary"
                      label="Check-in"
                      onPress={() => router.push('/features/consent')}
                    />
                  </View>
                </View>
              ) : null}

              {/* 2. Next Medicine Dose Card (with working Mark taken button) */}
              <View
                style={[
                  styles.dashboardCard,
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
                {nextDose ? (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text variant="caption" color="primary" weight="bold">
                        {`Next dose · ${nextDose.time}`}
                      </Text>
                      <Tag label="Due today" variant="default" />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1, paddingRight: spacing.sm, gap: 2 }}>
                        <Text variant="subhead" color="ink" weight="bold">
                          {nextDose.name}
                        </Text>
                        <Text variant="caption" color="muted">
                          {nextDose.instruction}
                        </Text>
                      </View>

                      <Button
                        variant="primary"
                        label="Mark taken"
                        onPress={() => handleHomeMarkTaken(nextDose.id)}
                      />
                    </View>
                  </>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Icon name="confirmed" size={20} tone="primary" />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="subhead" color="ink" weight="bold">
                        All doses taken for today
                      </Text>
                      <Text variant="caption" color="muted">
                        Next scheduled dose will unlock tomorrow.
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* 3. Today's Diet Progress Card (live kcal + quick + Log meal button) */}
              <View
                style={[
                  styles.dashboardCard,
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="caption" color="primary" weight="bold">
                    Today's nutrition
                  </Text>
                  <Text variant="caption" color="muted">
                    {dietData
                      ? `${dietData.dailyTargets.caloriesConsumed} / ${dietData.dailyTargets.caloriesTarget} kcal`
                      : '1850 kcal target'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: spacing.sm, gap: 6 }}>
                    <Text variant="subhead" color="ink" weight="bold">
                      {dietData
                        ? `${Math.round((dietData.dailyTargets.caloriesConsumed / dietData.dailyTargets.caloriesTarget) * 100)}% of target met`
                        : 'Daily meal progress'}
                    </Text>
                    {dietData && (
                      <View
                        style={{
                          height: 6,
                          backgroundColor: colors.primaryTint,
                          borderColor: colors.border,
                          borderWidth: borders.width,
                          borderRadius: 3,
                          overflow: 'hidden',
                          width: '100%',
                        }}
                      >
                        <View
                          style={{
                            height: '100%',
                            width: `${Math.min(100, Math.round((dietData.dailyTargets.caloriesConsumed / dietData.dailyTargets.caloriesTarget) * 100))}%`,
                            backgroundColor: colors.primary,
                            borderRadius: 3,
                          }}
                        />
                      </View>
                    )}
                  </View>

                  <Button
                    variant="primary"
                    label="+ Log meal"
                    onPress={() => router.push('/features/diet')}
                  />
                </View>
              </View>
            </View>

            {/* 4. Feature Tiles Grid (2-column layout) */}
            <View style={[styles.tileGrid, { marginTop: spacing.md, gap: spacing.sm }]}>
              {tileRows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={[styles.tileRow, { gap: spacing.sm }]}>
                  {row.map((item) => (
                    <View key={item.id} style={styles.tileCol}>
                      <Tile
                        title={item.name}
                        status={item.tileStatus}
                        tint={item.tint}
                        image={item.image}
                        onPress={() => router.push(item.route as any)}
                      />
                    </View>
                  ))}
                  {row.length === 1 && <View style={styles.tileCol} />}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Person Switcher Sheet */}
        <Sheet
          visible={isPersonSwitcherOpen}
          onClose={() => setIsPersonSwitcherOpen(false)}
          title="Switch active person"
        >
          <View style={{ gap: spacing.sm }}>
            <Text variant="bodySmall" color="muted">
              Choose who you are viewing records and booking visits for.
            </Text>

            {managedPersons.map((p) => {
              const isSelected = p.id === activePerson.id;
              const isPending = p.status === 'waiting_approval';
              const isRevoked = p.status === 'revoked';

              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${p.name}`}
                  onPress={() => handleSelectPerson(p)}
                  style={[
                    styles.personOptionCard,
                    {
                      backgroundColor: isSelected ? colors.sageTint : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: borders.width,
                      borderRadius: radii.md,
                      padding: spacing.sm,
                      minHeight: 48,
                    },
                  ]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="subhead" color="ink" weight="bold" style={styles.wrapText}>
                      {p.name}
                    </Text>
                    <Text variant="caption" color="muted">
                      {p.relation} • {p.ageBand}
                      {p.phone ? ` • ${p.phone}` : ''}
                    </Text>
                  </View>

                  {isSelected && <Icon name="check" size={18} tone="primary" />}
                  {isPending && <Tag variant="clay" label="Waiting for approval" />}
                  {isRevoked && <Tag variant="danger" label="Revoked" />}
                </Pressable>
              );
            })}

            <View style={{ marginTop: spacing.xs }}>
              <Button
                variant="secondary"
                label="Manage family"
                fullWidth
                onPress={() => {
                  setIsPersonSwitcherOpen(false);
                  router.push('/features/family' as any);
                }}
              />
            </View>
          </View>
        </Sheet>

        {/* Location Picker Modal */}
        <LocationPickerModal
          visible={isLocationPickerOpen}
          onConfirmLocation={(loc: UserLocation) => setCurrentLocation(loc)}
          onClose={() => setIsLocationPickerOpen(false)}
        />

        {/* Assistant Button */}
        <AssistantFloatingButton />
      </View>
    </FeatureErrorBoundary>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  phoneFrame: {
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingRight: 8,
  },
  viewingName: {
    flexWrap: 'wrap',
  },
  wrapText: {
    flexWrap: 'wrap',
  },
  personOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  bookAgainCard: {
    width: '100%',
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusBanner: {
    width: '100%',
  },
  dashboardCard: {
    width: '100%',
  },
  tileGrid: {
    width: '100%',
  },
  tileRow: {
    flexDirection: 'row',
    width: '100%',
  },
  tileCol: {
    flex: 1,
  },
});
