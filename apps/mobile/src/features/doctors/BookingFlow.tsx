import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons';
import { useTheme } from '../../theme';
import { Text, Button, Tag, KeyValueRow, TitleMetaRow, ActionRow } from '../../components/primitives';
import { addVisitToCalendar } from '../../services/calendarService';
import { formatHumanDateTime } from '../../utils/dateUtils';
import { fontFamilies } from '../../theme/tokens';
import type {
  DoctorItem,
  DoctorSlot,
  DoctorSlotsResponse,
} from '../../../../../packages/contracts/src/doctors';
import {
  fetchDoctorSlots,
  submitDoctorBooking,
  saveBookingDraft,
  clearBookingDraft,
  rescheduleDoctorBooking,
  InProgressBookingDraft,
  ActiveTokenBooking,
} from '../../services/triageService';
import { NOTIFICATION_PERMISSION_SENTENCE } from '../../services/notificationService';
import { fetchManagedPersons } from '../../services/familyService';
import { TickAnimationView } from '../../components/animations/TickAnimationView';
import { getDoctorInitials } from './DoctorCard';

export interface BookingFlowProps {
  doctor: DoctorItem;
  userSchemeCard?: string;
  initialDraft?: InProgressBookingDraft | null;
  rescheduleBookingId?: string;
  onDone: (booking?: ActiveTokenBooking) => void;
  onCancel: () => void;
}

const DEFAULT_PROFILES = [
  { id: 'self', name: 'Self' },
  { id: 'family_1', name: 'S. Ramanathan (Father)' },
];

const STEP_TITLES: Record<number, string> = {
  1: 'Doctor details',
  2: 'Patient details',
  3: 'Date & time',
  4: 'Confirm booking',
};

export function BookingFlow({
  doctor,
  userSchemeCard,
  initialDraft,
  rescheduleBookingId,
  onDone,
  onCancel,
}: BookingFlowProps) {
  const { colors, spacing, radii, borders, minTouchTarget, typography } = useTheme();
  const insets = useSafeAreaInsets();

  // Step state (1 to 4 or 'success')
  const [step, setStep] = useState<number>(initialDraft?.step || 1);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<ActiveTokenBooking | null>(null);

  // Patient selection (Step 2)
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [selectedPatient, setSelectedPatient] = useState<string>(
    initialDraft?.patientName || DEFAULT_PROFILES[0].name
  );
  const [customPatient, setCustomPatient] = useState<string>('');
  const [isAddingSomeone, setIsAddingSomeone] = useState<boolean>(false);

  useEffect(() => {
    fetchManagedPersons().then((persons) => {
      if (persons && persons.length > 0) {
        const formatted = persons
          .filter((p) => p.status !== 'revoked')
          .map((p) => ({
            id: p.id,
            name: `${p.name}${p.relation ? ` (${p.relation})` : ''}`,
          }));
        if (formatted.length > 0) {
          setProfiles(formatted);
          if (!initialDraft?.patientName) {
            setSelectedPatient(formatted[0].name);
          }
        }
      }
    });
  }, [initialDraft?.patientName]);

  // Date & Time (Step 3)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
  const dayAfterDate = new Date();
  dayAfterDate.setDate(dayAfterDate.getDate() + 2);
  const dayAfterStr = dayAfterDate.toISOString().split('T')[0];

  const dateOptions = [
    { id: todayStr, label: 'Today · Oct 19' },
    { id: tomorrowStr, label: 'Tomorrow · Oct 20' },
    { id: dayAfterStr, label: 'Tue · Oct 21' },
  ];

  const [selectedDate, setSelectedDate] = useState<string>(initialDraft?.date || todayStr);
  const [slotsData, setSlotsData] = useState<DoctorSlotsResponse | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<DoctorSlot | null>(null);
  const [isWalkIn, setIsWalkIn] = useState<boolean>(initialDraft?.isWalkIn ?? doctor.isPartner);

  // Submitting state (Step 4)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(false);

  // Fetch slots on date change
  useEffect(() => {
    let mounted = true;
    setIsLoadingSlots(true);
    setErrorMessage(null);

    fetchDoctorSlots(doctor.id, selectedDate)
      .then((res) => {
        if (mounted) {
          setSlotsData(res);
          setIsLoadingSlots(false);

          // Restore initial draft slot if matching
          if (initialDraft?.slotId) {
            const match = res.slots.find((s) => s.id === initialDraft.slotId);
            if (match && match.isAvailable) {
              setSelectedSlot(match);
              setIsWalkIn(false);
            }
          }
        }
      })
      .catch(() => {
        if (mounted) setIsLoadingSlots(false);
      });

    return () => {
      mounted = false;
    };
  }, [doctor.id, selectedDate]);

  // Persist draft on changes
  useEffect(() => {
    if (!isSuccess) {
      const draft: InProgressBookingDraft = {
        step,
        doctorId: doctor.id,
        patientName: selectedPatient,
        patientId: 'patient_std_01',
        date: selectedDate,
        time: selectedSlot ? selectedSlot.time : undefined,
        slotId: selectedSlot ? selectedSlot.id : undefined,
        isWalkIn,
      };
      saveBookingDraft(draft);
    }
  }, [step, selectedPatient, selectedDate, selectedSlot, isWalkIn, doctor.id, isSuccess]);

  const handleBack = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      clearBookingDraft();
      onCancel();
    }
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (rescheduleBookingId) {
        const booking = await rescheduleDoctorBooking(
          rescheduleBookingId,
          selectedSlot?.id || `${doctor.id}_${selectedDate}_0900`,
          selectedDate,
          isWalkIn ? 'Walk-in OP' : (selectedSlot?.time || '09:00 AM')
        );
        setConfirmedBooking(booking);
        setIsSuccess(true);
        await clearBookingDraft();
        return;
      }

      const booking = await submitDoctorBooking(
        doctor.id,
        doctor.name,
        doctor.hospitalName,
        doctor.department,
        doctor.room,
        'patient_std_01',
        selectedPatient,
        selectedSlot?.id,
        selectedDate,
        isWalkIn ? 'Walk-in OP' : selectedSlot?.time,
        isWalkIn,
        userSchemeCard
      );

      setConfirmedBooking(booking);
      setIsSuccess(true);
      await clearBookingDraft();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to confirm booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCardAccepted = Boolean(
    userSchemeCard &&
      userSchemeCard !== 'none' &&
      doctor.acceptedSchemes &&
      doctor.acceptedSchemes.includes(userSchemeCard)
  );

  // Group slots by period
  const morningSlots = slotsData?.slots.filter((s) => s.period === 'morning') || [];
  const afternoonSlots = slotsData?.slots.filter((s) => s.period === 'afternoon') || [];
  const eveningSlots = slotsData?.slots.filter((s) => s.period === 'evening') || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 1. Header with back button & flat 2px 4-segment progress bar */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderBottomWidth: borders.width,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: spacing.sm,
            paddingHorizontal: spacing.md,
            gap: spacing.xs,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={isSuccess ? () => onDone(confirmedBooking || undefined) : handleBack}
            hitSlop={8}
            style={[styles.backHit, { minHeight: minTouchTarget }]}
          >
            <Icon name="back" size={20} tone="ink" />
            <Text variant="subhead" color="ink" weight="bold">
              {isSuccess ? 'Close' : 'Back'}
            </Text>
          </Pressable>

          {!isSuccess && (
            <Text variant="caption" color="muted" weight="semiBold">
              {`Step ${step} of 4`}
            </Text>
          )}
        </View>

        {!isSuccess && (
          <View style={{ gap: spacing.xxs }}>
            {/* Step header: "Step 4 of 4" once (small), then the title */}
            <Text variant="title" color="ink" weight="bold">
              {STEP_TITLES[step]}
            </Text>

            {/* Flat 2px 4-segment progress bar */}
            <View style={[styles.progressTrack, { gap: spacing.xxs }]}>
              {[1, 2, 3, 4].map((seg) => (
                <View
                  key={`seg-${seg}`}
                  style={[
                    styles.progressSegment,
                    {
                      backgroundColor: seg <= step ? colors.primary : colors.border,
                      height: 2,
                      borderRadius: 2,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 2. Step Content Body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            padding: spacing.md,
            gap: spacing.md,
            paddingBottom: 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* SUCCESS VIEW */}
        {isSuccess && confirmedBooking ? (
          <View style={{ gap: spacing.lg }}>
            {/* Tick Mark Container: video asset on confirmed */}
            <View style={{ alignItems: 'center', marginTop: spacing.md, gap: spacing.xs }}>
              {confirmedBooking.status === 'confirmed' ? (
                <TickAnimationView size={88} />
              ) : (
                <View
                  style={[
                    styles.successCheckCircle,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                      borderWidth: borders.width,
                      borderRadius: radii.lg,
                    },
                  ]}
                >
                  <Icon name="check" size={32} tone="surface" />
                </View>
              )}

              <Text variant="headline" color="ink" weight="bold">
                {confirmedBooking.status === 'confirmed' ? 'Booking confirmed' : 'Request sent'}
              </Text>
              {confirmedBooking.status !== 'confirmed' && (
                <Tag
                  label="Requested"
                  variant="default"
                />
              )}
              <Text variant="bodySmall" color="muted" style={{ textAlign: 'center' }}>
                {confirmedBooking.status === 'confirmed'
                  ? confirmedBooking.tokenNumber
                    ? `Token #${confirmedBooking.tokenNumber} issued at ${confirmedBooking.hospitalName}`
                    : `Slot confirmed at ${confirmedBooking.hospitalName}`
                  : `We've asked ${confirmedBooking.hospitalName} for this slot. We'll tell you when they confirm.`}
              </Text>
            </View>

            {/* Details Summary Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  gap: spacing.sm,
                },
              ]}
            >
              <KeyValueRow label="Doctor" value={confirmedBooking.doctorName} />
              <KeyValueRow label="Department" value={confirmedBooking.department} />
              <KeyValueRow
                label="Hospital & Room"
                value={`${confirmedBooking.hospitalName} · ${confirmedBooking.room || 'OPD Desk'}`}
              />
              <KeyValueRow
                label="Patient"
                value={confirmedBooking.patientName || selectedPatient}
              />
              <KeyValueRow
                label="Time"
                value={formatHumanDateTime(confirmedBooking.date, confirmedBooking.time)}
                valueColor="primary"
              />
            </View>

            {/* Action Buttons */}
            <View style={{ gap: spacing.xs }}>
              {confirmedBooking.status === 'confirmed' && (
                <Button
                  variant="secondary"
                  fullWidth
                  label="Add to calendar"
                  onPress={async () => {
                    const start = new Date();
                    const end = new Date(start.getTime() + 60 * 60 * 1000);
                    const success = await addVisitToCalendar({
                      title: `Doctor visit: ${confirmedBooking.doctorName}`,
                      startDate: start,
                      endDate: end,
                      location: `${doctor.hospitalName}, ${doctor.locality}`,
                      notes: `Department: ${confirmedBooking.department}\nRoom: ${confirmedBooking.room || 'OPD Desk'}`,
                    });
                    if (success) {
                      Alert.alert('Calendar', 'Appointment added to your device calendar.');
                    }
                  }}
                />
              )}
              <Button
                variant="secondary"
                fullWidth
                label="Directions"
                onPress={() =>
                  Linking.openURL(
                    `https://maps.google.com/?q=${encodeURIComponent(
                      `${doctor.hospitalName}, ${doctor.locality}`
                    )}`
                  ).catch(() => Alert.alert('Directions', `Directions to ${doctor.hospitalName}`))
                }
              />
              <Button
                variant="primary"
                fullWidth
                label="Done"
                onPress={() => onDone(confirmedBooking)}
              />
            </View>
          </View>
        ) : null}

        {/* STEP 1: DOCTOR SUMMARY */}
        {!isSuccess && step === 1 && (
          <View style={{ gap: spacing.md }}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  gap: spacing.sm,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: doctor.isPartner ? colors.sageTint : colors.peachTint,
                      borderRadius: radii.md,
                      borderColor: colors.border,
                      borderWidth: borders.width,
                    },
                  ]}
                >
                  <Text variant="subhead" color="primary" weight="bold">
                    {getDoctorInitials(doctor.name)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="subhead" color="ink" weight="bold">
                    {doctor.name}
                  </Text>
                  <Text variant="bodySmall" color="muted">
                    {doctor.department} • {doctor.qualification}
                  </Text>
                </View>
              </View>

              <KeyValueRow label="Hospital" value={doctor.hospitalName} />
              <KeyValueRow label="Location" value={doctor.locality} />
              <KeyValueRow label="Consultation fee" value={`₹${doctor.fee}`} />
              <KeyValueRow
                label="Availability"
                value={
                  doctor.isPartner
                    ? `Today · about ${doctor.estimatedWaitMinutes || 35} min`
                    : 'Request a slot'
                }
                valueColor="primary"
              />

              {isCardAccepted && (
                <View style={{ marginTop: spacing.xxs, alignSelf: 'flex-start' }}>
                  <Tag label="Accepted here" variant="primary" />
                </View>
              )}
            </View>

            <Button
              variant="primary"
              fullWidth
              label="Continue"
              onPress={() => setStep(2)}
            />
          </View>
        )}

        {/* STEP 2: WHO IS IT FOR? */}
        {!isSuccess && step === 2 && (
          <View style={{ gap: spacing.md }}>
            <Text variant="body" color="muted">
              Select the family profile or enter a dependent's name.
            </Text>

            <View style={{ gap: spacing.xs }}>
              {profiles.map((profile) => {
                const isSelected = selectedPatient === profile.name;
                return (
                  <Pressable
                    key={profile.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setSelectedPatient(profile.name);
                      setIsAddingSomeone(false);
                    }}
                    style={[
                      styles.profileRow,
                      {
                        backgroundColor: isSelected ? colors.sageTint : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : borders.width,
                        borderRadius: radii.lg,
                        padding: spacing.md,
                        minHeight: minTouchTarget,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0, flexShrink: 1 }}>
                      <Icon name="account" size={20} tone={isSelected ? 'primary' : 'muted'} />
                      <Text variant="body" color="ink" weight={isSelected ? 'bold' : 'regular'}>
                        {profile.name}
                      </Text>
                    </View>
                    {isSelected && <Icon name="check" size={20} tone="primary" />}
                  </Pressable>
                );
              })}

              {/* Add someone toggle */}
              {!isAddingSomeone ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add someone else"
                  onPress={() => setIsAddingSomeone(true)}
                  style={[
                    styles.profileRow,
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 }}>
                    <Icon name="add" size={20} tone="primary" />
                    <Text variant="body" color="primary" weight="semiBold">
                      + Add someone
                    </Text>
                  </View>
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.card,
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
                  <Text variant="label" color="ink" weight="semiBold">
                    Patient full name
                  </Text>
                  <TextInput
                    value={customPatient}
                    onChangeText={setCustomPatient}
                    placeholder="e.g. Ramesh Prasad"
                    placeholderTextColor={colors.muted}
                    style={[
                      styles.textInput,
                      {
                        borderColor: colors.border,
                        borderWidth: borders.width,
                        borderRadius: radii.md,
                        padding: spacing.sm,
                        minHeight: 48,
                        fontSize: typography.body.fontSize,
                        color: colors.ink,
                      },
                    ]}
                  />
                  <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xxs }}>
                    <Button
                      variant="primary"
                      label="Use this name"
                      disabled={!customPatient.trim()}
                      onPress={() => {
                        if (customPatient.trim()) {
                          setSelectedPatient(customPatient.trim());
                          setIsAddingSomeone(false);
                        }
                      }}
                    />
                    <Button
                      variant="text"
                      label="Cancel"
                      onPress={() => setIsAddingSomeone(false)}
                    />
                  </View>
                </View>
              )}
            </View>

            <Button
              variant="primary"
              fullWidth
              label="Continue"
              disabled={!selectedPatient}
              onPress={() => setStep(3)}
            />
          </View>
        )}

        {/* STEP 3: DATE & TIME */}
        {!isSuccess && step === 3 && (
          <View style={{ gap: spacing.md }}>
            {/* Date selection chips */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="label" color="ink" weight="semiBold">
                Select date
              </Text>
              <View style={[styles.dateChipRow, { gap: spacing.xs }]}>
                {dateOptions.map((opt) => {
                  const isSelected = selectedDate === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        setSelectedDate(opt.id);
                        setSelectedSlot(null);
                      }}
                      style={[
                        styles.dateChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: borders.width,
                          borderRadius: radii.md,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                          minHeight: 44,
                          minWidth: minTouchTarget,
                        },
                      ]}
                    >
                      <Text
                        variant="bodySmall"
                        color={isSelected ? 'surface' : 'ink'}
                        weight={isSelected ? 'bold' : 'regular'}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Slots Loading Indicator */}
            {isLoadingSlots ? (
              <View style={{ padding: spacing.lg, alignItems: 'center', gap: spacing.xs }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text variant="caption" color="muted">
                  Loading slots...
                </Text>
              </View>
            ) : null}

            {/* Empty Slots State */}
            {!isLoadingSlots && slotsData && slotsData.slots.length === 0 && !doctor.isPartner ? (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.lg,
                    padding: spacing.lg,
                    alignItems: 'center',
                  },
                ]}
              >
                <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
                  No slots today. Try tomorrow.
                </Text>
              </View>
            ) : null}

            {/* Partner Hospital Walk-In Option */}
            {!isLoadingSlots && doctor.isPartner && (
              <View style={{ gap: spacing.xs }}>
                <Text variant="label" color="ink" weight="semiBold">
                  Live hospital token
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isWalkIn }}
                  onPress={() => {
                    setIsWalkIn(true);
                    setSelectedSlot(null);
                  }}
                  style={[
                    styles.slotCard,
                    {
                      backgroundColor: isWalkIn ? colors.sageTint : colors.surface,
                      borderColor: isWalkIn ? colors.primary : colors.border,
                      borderWidth: isWalkIn ? 2 : borders.width,
                      borderRadius: radii.lg,
                      padding: spacing.md,
                      minHeight: minTouchTarget,
                    },
                  ]}
                >
                  <View style={{ gap: 2 }}>
                    <Text variant="subhead" color="ink" weight="bold">
                      Walk-in token
                    </Text>
                    <Text variant="bodySmall" color="primary" weight="semiBold">
                      {`Today · Token #${slotsData?.walkInTokenNumber || 19} · ~${
                        slotsData?.walkInEstimatedWaitMinutes || 35
                      } min wait`}
                    </Text>
                  </View>
                  {isWalkIn && <Icon name="check" size={20} tone="primary" />}
                </Pressable>
              </View>
            )}

            {/* Scheduled Consultation Slots */}
            {!isLoadingSlots && slotsData && slotsData.slots.length > 0 && (
              <View style={{ gap: spacing.sm }}>
                <Text variant="label" color="ink" weight="semiBold">
                  Appointment slots
                </Text>

                {/* Morning Slots */}
                {morningSlots.length > 0 && (
                  <View style={{ gap: spacing.xxs }}>
                    <Text variant="caption" color="muted">
                      Morning
                    </Text>
                    <View style={[styles.slotGrid, { gap: spacing.xs }]}>
                      {morningSlots.map((slot) => {
                        const isSelected = !isWalkIn && selectedSlot?.id === slot.id;
                        return (
                          <Pressable
                            key={slot.id}
                            disabled={!slot.isAvailable}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected, disabled: !slot.isAvailable }}
                            onPress={() => {
                              setSelectedSlot(slot);
                              setIsWalkIn(false);
                            }}
                            style={[
                              styles.timeChip,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : slot.isAvailable
                                  ? colors.surface
                                  : colors.border,
                                borderColor: isSelected ? colors.primary : colors.border,
                                borderWidth: borders.width,
                                borderRadius: radii.md,
                                opacity: slot.isAvailable ? 1 : 0.4,
                                minHeight: minTouchTarget,
                              },
                            ]}
                          >
                            <Text
                              variant="bodySmall"
                              color={isSelected ? 'surface' : 'ink'}
                              weight={isSelected ? 'bold' : 'regular'}
                            >
                              {slot.isAvailable ? slot.time : `${slot.time} · Full`}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Afternoon Slots */}
                {afternoonSlots.length > 0 && (
                  <View style={{ gap: spacing.xxs }}>
                    <Text variant="caption" color="muted">
                      Afternoon
                    </Text>
                    <View style={[styles.slotGrid, { gap: spacing.xs }]}>
                      {afternoonSlots.map((slot) => {
                        const isSelected = !isWalkIn && selectedSlot?.id === slot.id;
                        return (
                          <Pressable
                            key={slot.id}
                            disabled={!slot.isAvailable}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected, disabled: !slot.isAvailable }}
                            onPress={() => {
                              setSelectedSlot(slot);
                              setIsWalkIn(false);
                            }}
                            style={[
                              styles.timeChip,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : slot.isAvailable
                                  ? colors.surface
                                  : colors.border,
                                borderColor: isSelected ? colors.primary : colors.border,
                                borderWidth: borders.width,
                                borderRadius: radii.md,
                                opacity: slot.isAvailable ? 1 : 0.4,
                                minHeight: minTouchTarget,
                              },
                            ]}
                          >
                            <Text
                              variant="bodySmall"
                              color={isSelected ? 'surface' : 'ink'}
                              weight={isSelected ? 'bold' : 'regular'}
                            >
                              {slot.isAvailable ? slot.time : `${slot.time} · Full`}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Evening Slots */}
                {eveningSlots.length > 0 && (
                  <View style={{ gap: spacing.xxs }}>
                    <Text variant="caption" color="muted">
                      Evening
                    </Text>
                    <View style={[styles.slotGrid, { gap: spacing.xs }]}>
                      {eveningSlots.map((slot) => {
                        const isSelected = !isWalkIn && selectedSlot?.id === slot.id;
                        return (
                          <Pressable
                            key={slot.id}
                            disabled={!slot.isAvailable}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected, disabled: !slot.isAvailable }}
                            onPress={() => {
                              setSelectedSlot(slot);
                              setIsWalkIn(false);
                            }}
                            style={[
                              styles.timeChip,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : slot.isAvailable
                                  ? colors.surface
                                  : colors.border,
                                borderColor: isSelected ? colors.primary : colors.border,
                                borderWidth: borders.width,
                                borderRadius: radii.md,
                                opacity: slot.isAvailable ? 1 : 0.4,
                                minHeight: minTouchTarget,
                              },
                            ]}
                          >
                            <Text
                              variant="bodySmall"
                              color={isSelected ? 'surface' : 'ink'}
                              weight={isSelected ? 'bold' : 'regular'}
                            >
                              {slot.isAvailable ? slot.time : `${slot.time} · Full`}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            <Button
              variant="primary"
              fullWidth
              label="Continue"
              disabled={!isWalkIn && !selectedSlot}
              onPress={() => setStep(4)}
            />
          </View>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {!isSuccess && step === 4 && (
          <View style={{ gap: spacing.md }}>
            {/* One card with doctor, hospital, time, patient, fee */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  gap: spacing.sm,
                },
              ]}
            >
              <KeyValueRow label="Doctor" value={`${doctor.name} (${doctor.department})`} />
              <KeyValueRow label="Hospital & Location" value={`${doctor.hospitalName} · ${doctor.locality}`} />
              <KeyValueRow
                label="Appointment time"
                value={isWalkIn ? 'Walk-in OP Token' : formatHumanDateTime(selectedDate, selectedSlot?.time)}
                valueColor="primary"
              />
              <KeyValueRow label="Patient name" value={selectedPatient} />
              <KeyValueRow label="Consultation fee" value={`₹${doctor.fee}`} />

              {/* Accepted here tag only when true */}
              {isCardAccepted && (
                <View style={{ marginTop: spacing.xxs, alignSelf: 'flex-start' }}>
                  <Tag label="Accepted here" variant="primary" />
                </View>
              )}
            </View>

            {/* Error Message Box (e.g. Double booking rejected) */}
            {errorMessage ? (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.dangerTint,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.md,
                    padding: spacing.sm,
                  },
                ]}
              >
                <Text variant="bodySmall" color="danger" weight="semiBold">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Visit reminder becomes [Turn on reminders] per AGENTS.md */}
            <ActionRow
              title="Visit reminder"
              subtitle={remindersEnabled ? 'Reminders active for this visit.' : 'Get a reminder 2 hours before your visit.'}
              action={
                <Button
                  variant="secondary"
                  label={remindersEnabled ? 'Reminders on' : 'Turn on reminders'}
                  disabled={remindersEnabled}
                  onPress={() => setRemindersEnabled(true)}
                />
              }
            />

            {/* Confirm booking button */}
            <Button
              variant="primary"
              fullWidth
              loading={isSubmitting}
              label={rescheduleBookingId ? 'Confirm reschedule' : doctor.isPartner ? 'Confirm booking' : 'Request slot'}
              onPress={handleConfirmBooking}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'column',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressTrack: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 4,
  },
  progressSegment: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'column',
  },
  card: {
    flexDirection: 'column',
    width: '100%',
  },
  avatar: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textInput: {
    fontFamily: fontFamilies.bodyRegular,
  },
  dateChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateChip: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeChip: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCheckCircle: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
