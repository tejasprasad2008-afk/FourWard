import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Linking,
  ActivityIndicator,
  Switch,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { Icon } from '../../components/icons';
import { useTheme } from '../../theme';
import { Text, SearchBar, Button, Sheet, Tag } from '../../components/primitives';
import { FeatureErrorBoundary } from '../common/ErrorBoundary';
import { FEATURES } from '../registry';
import {
  initTriageState,
  saveTriageState,
  clearTriageState,
  submitTriage,
  clearActiveBooking,
  getBookingDraft,
  clearBookingDraft,
  fetchPatientVisits,
  cancelDoctorBooking,
  createBookAgainDraft,
  ActiveTokenBooking,
  TriageState,
  InProgressBookingDraft,
} from '../../services/triageService';
import { getPatientProfile, PatientProfile, DEFAULT_PATIENT_PROFILE } from '../onboarding/onboardingStorage';
import { getActivePerson, onActivePersonChange } from '../../services/familyService';
import type { DoctorBookingResponse, DoctorItem } from '../../../../../packages/contracts/src/doctors';
import { DoctorCard } from './DoctorCard';
import { BookingFlow } from './BookingFlow';
import { MyVisitsView } from './MyVisitsView';

interface DoctorsScreenProps {
  hasHeader?: boolean;
}

const COMMON_SYMPTOMS = [
  'Fever & cough',
  'Chest tightness',
  'Stomach pain',
  'Joint pain',
  'Child fever',
];

const SYMPTOM_DEPT_MAP: Record<string, string> = {
  'Fever & cough': 'Internal Medicine',
  'Chest tightness': 'Cardiology',
  'Stomach pain': 'Internal Medicine',
  'Joint pain': 'Orthopedics',
  'Child fever': 'Pediatrics',
};

const DEPARTMENTS = [
  'All',
  'Internal Medicine',
  'Cardiology',
  'Pediatrics',
  'Gynecology',
  'Orthopedics',
  'ENT',
];

const HOSPITALS = [
  'All',
  'City Care Hospital',
  'Deccan Health Institute',
  'Sunrise Child Clinic',
  'Starlight Maternity Clinic',
  'Apex Bone & Joint Clinic',
  'Metro Speciality Hospital',
  'Central Heart Institute',
  'National Health Institute OPD',
];

import { FALLBACK_DOCTORS } from '../../services/doctorsData';

export function DoctorsScreen({ hasHeader = false }: DoctorsScreenProps) {
  const { colors, spacing, radii, borders, minTouchTarget } = useTheme();
  const insets = useSafeAreaInsets();

  const [patientProfile, setPatientProfile] = useState<PatientProfile>(DEFAULT_PATIENT_PROFILE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedHospital, setSelectedHospital] = useState('All');
  const [filterAcceptsCard, setFilterAcceptsCard] = useState(false);
  const [filterPartnerOnly, setFilterPartnerOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'soonest' | 'nearest' | 'fee'>('soonest');

  // Sheet modals for Sort & Filter
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Active booking & Triage state
  const [activeBooking, setActiveBooking] = useState<ActiveTokenBooking | null>(null);
  const [triage, setTriage] = useState<TriageState>({
    hasRecordedSymptoms: false,
    recordedAt: null,
    chiefComplaint: '',
    assignedDepartment: '',
    answers: {},
    isEmergency: false,
  });

  const [customSymptom, setCustomSymptom] = useState('');
  const [triageAnswers, setTriageAnswers] = useState<Record<string, string>>({});
  const [isTriageLoading, setIsTriageLoading] = useState(false);

  // Full Screen Booking Flow state
  const [bookingDoctor, setBookingDoctor] = useState<DoctorItem | null>(null);
  const [restoredDraft, setRestoredDraft] = useState<InProgressBookingDraft | null>(null);
  const [reschedulingBookingId, setReschedulingBookingId] = useState<string | undefined>(undefined);

  // Doctors screen top segmented tab: 'find' | 'visits'
  const router = useRouter();
  const [mainTab, setMainTab] = useState<'find' | 'visits'>('find');
  const [switcherWidth, setSwitcherWidth] = useState(0);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const [isEmergencyHighlighted, setIsEmergencyHighlighted] = useState(false);

  const handleTabChange = (newTab: 'find' | 'visits') => {
    if (newTab === mainTab) return;
    setMainTab(newTab);
    Animated.timing(tabAnim, {
      toValue: newTab === 'find' ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const [visits, setVisits] = useState<DoctorBookingResponse[]>([]);
  const [isVisitsLoading, setIsVisitsLoading] = useState(false);

  const loadVisits = useCallback(async () => {
    setIsVisitsLoading(true);
    const activePerson = await getActivePerson();
    const list = await fetchPatientVisits(activePerson.id);
    setVisits(list);
    setIsVisitsLoading(false);
  }, []);

  useEffect(() => {
    getPatientProfile().then(setPatientProfile);
    loadVisits();

    const unsub = onActivePersonChange((person) => {
      fetchPatientVisits(person.id).then(setVisits);
    });

    initTriageState().then(({ triage: savedTriage, booking: savedBooking }) => {
      setTriage(savedTriage);
      setActiveBooking(savedBooking);
      if (savedTriage.chiefComplaint) {
        setCustomSymptom(savedTriage.chiefComplaint);
        setTriageAnswers(savedTriage.answers || {});
      }
    });

    // Check if there was an in-progress booking draft
    getBookingDraft().then((draft) => {
      if (draft && draft.doctorId) {
        const doc = FALLBACK_DOCTORS.find((d) => d.id === draft.doctorId);
        if (doc) {
          setBookingDoctor(doc);
          setRestoredDraft(draft);
        }
      }
    });

    return () => {
      unsub();
    };
  }, [loadVisits]);

  const handleBookAgain = (visit: DoctorBookingResponse) => {
    const doc = FALLBACK_DOCTORS.find((d) => d.id === visit.doctorId) || {
      id: visit.doctorId,
      name: visit.doctorName,
      qualification: 'Consultant Specialist',
      department: visit.department,
      hospitalName: visit.hospitalName,
      locality: visit.locality || 'Hyderabad',
      fee: visit.fee || 500,
      isPartner: true,
      room: visit.room || 'Room 101',
      availableDays: 'Mon - Sat',
      nextAvailableSlot: 'Today',
    };
    setBookingDoctor(doc);
    setReschedulingBookingId(undefined);
    setRestoredDraft(createBookAgainDraft(visit));
  };

  const handleReschedule = (visit: DoctorBookingResponse) => {
    const doc = FALLBACK_DOCTORS.find((d) => d.id === visit.doctorId) || {
      id: visit.doctorId,
      name: visit.doctorName,
      qualification: 'Consultant Specialist',
      department: visit.department,
      hospitalName: visit.hospitalName,
      locality: visit.locality || 'Hyderabad',
      fee: visit.fee || 500,
      isPartner: true,
      room: visit.room || 'Room 101',
      availableDays: 'Mon - Sat',
      nextAvailableSlot: 'Today',
    };
    setBookingDoctor(doc);
    setReschedulingBookingId(visit.bookingId);
    setRestoredDraft({
      step: 3,
      doctorId: visit.doctorId,
      patientId: visit.patientId || 'patient_std_01',
      patientName: visit.patientName || 'Tejas',
      date: 'Today',
    });
  };

  const handleCancelVisit = async (bookingId: string) => {
    await cancelDoctorBooking(bookingId);
    await loadVisits();
    if (activeBooking?.bookingId === bookingId) {
      setActiveBooking(null);
    }
  };

  const handleCall108 = useCallback(() => {
    Linking.openURL('tel:108').catch((err) => {
      console.warn('Unable to dial 108:', err);
    });
  }, []);

  // Handle triage symptom tap or input
  const handleSelectSymptom = (symptom: string) => {
    if (customSymptom === symptom) {
      handleResetTriage();
      return;
    }
    setCustomSymptom(symptom);
    const dept = SYMPTOM_DEPT_MAP[symptom] || 'Internal Medicine';
    setSelectedDept(dept);
    const isEmerg = symptom === 'Chest tightness';
    setIsEmergencyHighlighted(isEmerg);

    const updatedState: TriageState = {
      hasRecordedSymptoms: true,
      recordedAt: new Date().toISOString(),
      chiefComplaint: symptom,
      assignedDepartment: dept,
      answers: {},
      isEmergency: isEmerg,
    };

    setTriage(updatedState);
    saveTriageState(updatedState);

    if (isEmerg) {
      handleCall108();
    }
  };

  const handleResetTriage = () => {
    setCustomSymptom('');
    setSelectedDept('All');
    setIsEmergencyHighlighted(false);
    clearTriageState();
    setTriage({
      hasRecordedSymptoms: false,
      recordedAt: null,
      chiefComplaint: '',
      assignedDepartment: '',
      answers: {},
      isEmergency: false,
    });
  };

  const handleCancelActiveBooking = async () => {
    await clearActiveBooking();
    setActiveBooking(null);
  };

  // Filter & Sort doctor list
  const filteredDoctors = useMemo(() => {
    let list = FALLBACK_DOCTORS.filter((d) => {
      const matchDept = selectedDept === 'All' || d.department.toLowerCase() === selectedDept.toLowerCase();
      const matchHospital = selectedHospital === 'All' || d.hospitalName.toLowerCase().includes(selectedHospital.toLowerCase());
      const matchCard = !filterAcceptsCard || (d.acceptedSchemes && d.acceptedSchemes.includes(patientProfile.schemeCard));
      const matchPartner = !filterPartnerOnly || d.isPartner;
      const matchSearch =
        searchQuery === '' ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.locality.toLowerCase().includes(searchQuery.toLowerCase());

      return matchDept && matchHospital && matchCard && matchPartner && matchSearch;
    });

    if (sortBy === 'nearest') {
      list.sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));
    } else if (sortBy === 'fee') {
      list.sort((a, b) => a.fee - b.fee);
    } else {
      // soonest
      list.sort((a, b) => {
        if (a.isPartner && !b.isPartner) return -1;
        if (!a.isPartner && b.isPartner) return 1;
        return (a.estimatedWaitMinutes || 99) - (b.estimatedWaitMinutes || 99);
      });
    }

    return list;
  }, [
    selectedDept,
    selectedHospital,
    filterAcceptsCard,
    filterPartnerOnly,
    searchQuery,
    sortBy,
    patientProfile.schemeCard,
  ]);

  const activeFilterCount =
    (selectedDept !== 'All' ? 1 : 0) +
    (selectedHospital !== 'All' ? 1 : 0) +
    (filterAcceptsCard ? 1 : 0) +
    (filterPartnerOnly ? 1 : 0);

  const sortLabelMap = {
    soonest: 'Soonest',
    nearest: 'Nearest',
    fee: 'Lowest fee',
  };

  const topPadding = hasHeader
    ? spacing.xs
    : Math.max(insets.top, 16) + spacing.xs;

  const navigation = useNavigation();
  useEffect(() => {
    if (bookingDoctor) {
      navigation.setOptions({ tabBarStyle: { display: 'none' } });
    } else {
      navigation.setOptions({ tabBarStyle: undefined });
    }
  }, [bookingDoctor, navigation]);

  // If a booking is currently being conducted, render full-screen BookingFlow
  if (bookingDoctor) {
    return (
      <BookingFlow
        doctor={bookingDoctor}
        userSchemeCard={patientProfile.schemeCard}
        initialDraft={restoredDraft}
        rescheduleBookingId={reschedulingBookingId}
        onDone={(booking) => {
          if (booking) {
            setActiveBooking(booking);
          }
          loadVisits();
          setBookingDoctor(null);
          setRestoredDraft(null);
          setReschedulingBookingId(undefined);
          setMainTab('visits');
        }}
        onCancel={() => {
          setBookingDoctor(null);
          setRestoredDraft(null);
          setReschedulingBookingId(undefined);
        }}
      />
    );
  }

  const renderHeader = () => (
    <View style={{ gap: spacing.md }}>

      {/* 2. Top Red Emergency Bar: One slim row on solid danger fill */}
      <View
        style={[
          styles.emergencyBar,
          {
            backgroundColor: colors.danger,
            borderColor: isEmergencyHighlighted ? colors.ink : colors.danger,
            borderWidth: isEmergencyHighlighted ? 2 : borders.width,
            borderRadius: radii.lg,
            paddingVertical: isEmergencyHighlighted ? 10 : 8,
            paddingHorizontal: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: 0,
          },
        ]}
      >
        <Text variant="subhead" color="surface" weight="bold" style={{ flexShrink: 1 }}>
          Emergency? Call 108
        </Text>
        <Button
          variant="secondary"
          label="Call 108"
          onPress={handleCall108}
        />
      </View>

      {/* 3. Active Booking Banner if booked */}
      {activeBooking && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: borders.width,
              borderRadius: radii.md,
              padding: spacing.md,
              gap: spacing.xs,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="time" size={16} tone="primary" />
              <Text variant="subhead" color="primary" weight="bold">
                {activeBooking.tokenNumber
                  ? `Active Token #${activeBooking.tokenNumber}`
                  : `Slot ${activeBooking.time}`}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel visit"
              onPress={handleCancelActiveBooking}
              hitSlop={8}
            >
              <Text variant="caption" color="muted" weight="semiBold">
                Cancel visit
              </Text>
            </Pressable>
          </View>
          <Text variant="body" color="ink" weight="bold">
            {activeBooking.doctorName}
          </Text>
          <Text variant="bodySmall" color="muted">
            {activeBooking.hospitalName} • {activeBooking.room || 'OPD Desk'}
            {activeBooking.estimatedWaitMinutes ? ` • Est. ${activeBooking.estimatedWaitMinutes} min wait` : ''}
          </Text>
        </View>
      )}

      {/* 4. Simplified Symptom Triage Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: borders.width,
            borderRadius: radii.md,
            padding: spacing.md,
            gap: spacing.sm,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="subhead" color="ink" weight="bold">
            Check symptoms
          </Text>
          {customSymptom !== '' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear symptom filter"
              onPress={handleResetTriage}
              hitSlop={8}
            >
              <Text variant="caption" color="muted" weight="semiBold">
                Clear
              </Text>
            </Pressable>
          )}
        </View>

        {/* Common Symptom Chips */}
        <View style={styles.chipRow}>
          {COMMON_SYMPTOMS.map((symptom) => {
            const isSelected = customSymptom === symptom;
            return (
              <Pressable
                key={symptom}
                accessibilityRole="button"
                accessibilityLabel={`Symptom: ${symptom}`}
                onPress={() => handleSelectSymptom(symptom)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.sm,
                    minHeight: 36,
                    paddingHorizontal: spacing.sm,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  color={isSelected ? 'surface' : 'ink'}
                  weight={isSelected ? 'bold' : 'regular'}
                >
                  {symptom}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 1-line inline note when symptom is active */}
        {customSymptom !== '' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <Text variant="caption" color="muted">
              Showing {selectedDept} doctors
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear filter"
              hitSlop={8}
              onPress={handleResetTriage}
            >
              <Text variant="caption" color="primary" weight="bold">
                Clear
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 5. Search Bar */}
      <SearchBar
        placeholder="Search doctor, department, hospital"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* 6. Single Filter Row: Department Chips + Sort Toggle */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.xs, alignItems: 'center' }}
      >
        {DEPARTMENTS.map((dept) => {
          const isSelected = selectedDept.toLowerCase() === dept.toLowerCase();
          return (
            <Pressable
              key={dept}
              onPress={() => {
                setSelectedDept(dept);
                if (dept === 'All') {
                  setCustomSymptom('');
                  setIsEmergencyHighlighted(false);
                }
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.sm,
                  paddingHorizontal: spacing.sm,
                  minHeight: 36,
                },
              ]}
            >
              <Text
                variant="caption"
                color={isSelected ? 'surface' : 'ink'}
                weight={isSelected ? 'bold' : 'regular'}
              >
                {dept}
              </Text>
            </Pressable>
          );
        })}
        <Button
          variant="secondary"
          label={`Sort: ${sortLabelMap[sortBy]}`}
          onPress={() => setIsSortSheetOpen(true)}
        />
      </ScrollView>

      {/* Results Count */}
      <Text variant="caption" color="muted">
        {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} available
      </Text>
    </View>
  );

  return (
    <FeatureErrorBoundary fallbackTitle="Doctors Unavailable">
      <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: topPadding }]}>
        {/* Top Feature Title & 2-option Segmented Control: Find doctor | My visits */}
        <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm }}>
          <View style={styles.header}>
            <Text variant="headline" color="ink" weight="bold">
              {FEATURES.doctors.name}
            </Text>
            <Text variant="body" color="muted">
              {mainTab === 'find' ? 'Find specialists and check symptoms.' : 'Manage appointments and history.'}
            </Text>
          </View>

          {/* Segmented Control (Radius 8, 48dp) */}
          <View
            onLayout={(e) => setSwitcherWidth(e.nativeEvent.layout.width)}
            style={[
              styles.segmentedControl,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: borders.width,
                borderRadius: radii.sm,
                position: 'relative',
                overflow: 'hidden',
              },
            ]}
          >
            {switcherWidth > 0 && (
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: switcherWidth / 2,
                  backgroundColor: colors.primary,
                  borderRadius: radii.sm,
                  transform: [
                    {
                      translateX: tabAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, switcherWidth / 2],
                      }),
                    },
                    {
                      scaleX: tabAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 0.92, 1],
                      }),
                    },
                  ],
                }}
              />
            )}

            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Find doctor tab"
              accessibilityState={{ selected: mainTab === 'find' }}
              onPress={() => handleTabChange('find')}
              style={[
                styles.segmentButton,
                {
                  borderRadius: radii.sm,
                  minHeight: 44,
                  backgroundColor: 'transparent',
                },
              ]}
            >
              <Text
                variant="subhead"
                color={mainTab === 'find' ? 'surface' : 'ink'}
                weight={mainTab === 'find' ? 'bold' : 'regular'}
              >
                Find doctor
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="My visits tab"
              accessibilityState={{ selected: mainTab === 'visits' }}
              onPress={() => handleTabChange('visits')}
              style={[
                styles.segmentButton,
                {
                  borderRadius: radii.sm,
                  minHeight: 44,
                  backgroundColor: 'transparent',
                },
              ]}
            >
              <Text
                variant="subhead"
                color={mainTab === 'visits' ? 'surface' : 'ink'}
                weight={mainTab === 'visits' ? 'bold' : 'regular'}
              >
                My visits
              </Text>
            </Pressable>
          </View>
        </View>

        {mainTab === 'find' ? (
          <FlatList
            data={filteredDoctors}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingHorizontal: spacing.md,
                paddingBottom: 110,
                gap: spacing.xs,
              },
            ]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <DoctorCard
                doctor={item}
                userSchemeCard={patientProfile.schemeCard}
                onPress={() => {
                  setBookingDoctor(item);
                  setRestoredDraft(null);
                }}
              />
            )}
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { padding: spacing.xl }]}>
                <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
                  No doctors found matching "{searchQuery}".
                </Text>
              </View>
            }
          />
        ) : (
          <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
            <MyVisitsView
              visits={visits}
              isLoading={isVisitsLoading}
              onRefresh={loadVisits}
              onBookAgain={handleBookAgain}
              onReschedule={handleReschedule}
              onCancelVisit={handleCancelVisit}
              onViewRecords={() => router.push('/records')}
            />
          </View>
        )}

        {/* SORT SHEET */}
        <Sheet
          visible={isSortSheetOpen}
          onClose={() => setIsSortSheetOpen(false)}
        >
          <View style={{ gap: spacing.md }}>
            <Text variant="title" color="ink" weight="bold">
              Sort doctors
            </Text>

            <View style={{ gap: spacing.xs }}>
              {[
                { id: 'soonest' as const, label: 'Soonest (Live wait & earliest slots)' },
                { id: 'nearest' as const, label: 'Nearest distance' },
                { id: 'fee' as const, label: 'Lowest consultation fee' },
              ].map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setSortBy(opt.id);
                      setIsSortSheetOpen(false);
                    }}
                    style={[
                      styles.sheetOption,
                      {
                        backgroundColor: isSelected ? colors.sageTint : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : borders.width,
                        borderRadius: radii.md,
                        padding: spacing.md,
                        minHeight: minTouchTarget,
                      },
                    ]}
                  >
                    <Text variant="body" color="ink" weight={isSelected ? 'bold' : 'regular'}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Sheet>

        {/* FILTER SHEET */}
        <Sheet
          visible={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
        >
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="title" color="ink" weight="bold">
                Filter doctors
              </Text>
              <Pressable
                onPress={() => {
                  setSelectedDept('All');
                  setSelectedHospital('All');
                  setFilterAcceptsCard(false);
                  setFilterPartnerOnly(false);
                }}
              >
                <Text variant="label" color="primary" weight="semiBold">
                  Reset all
                </Text>
              </Pressable>
            </View>

            {/* Department Filter */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="label" color="ink" weight="semiBold">
                Department
              </Text>
              <View style={styles.chipRow}>
                {DEPARTMENTS.map((dept) => {
                  const isSelected = selectedDept === dept;
                  return (
                    <Pressable
                      key={dept}
                      onPress={() => setSelectedDept(dept)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: borders.width,
                          borderRadius: radii.sm,
                          paddingHorizontal: spacing.sm,
                          minHeight: 36,
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        color={isSelected ? 'surface' : 'ink'}
                        weight={isSelected ? 'bold' : 'regular'}
                      >
                        {dept}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Hospital Filter */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="label" color="ink" weight="semiBold">
                Hospital
              </Text>
              <View style={styles.chipRow}>
                {HOSPITALS.map((hosp) => {
                  const isSelected = selectedHospital === hosp;
                  return (
                    <Pressable
                      key={hosp}
                      onPress={() => setSelectedHospital(hosp)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: borders.width,
                          borderRadius: radii.sm,
                          paddingHorizontal: spacing.sm,
                          minHeight: 36,
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        color={isSelected ? 'surface' : 'ink'}
                        weight={isSelected ? 'bold' : 'regular'}
                      >
                        {hosp}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Accepts My Card Toggle */}
            <View
              style={[
                styles.toggleRow,
                {
                  borderColor: colors.border,
                  borderTopWidth: borders.width,
                  paddingTop: spacing.sm,
                  minHeight: minTouchTarget,
                },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text variant="body" color="ink" weight="semiBold">
                  Accepts my card
                </Text>
                <Text variant="caption" color="muted">
                  {`Matches ${patientProfile.schemeCard.toUpperCase()} scheme`}
                </Text>
              </View>
              <Switch
                value={filterAcceptsCard}
                onValueChange={setFilterAcceptsCard}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            {/* Partner Hospitals Only Toggle */}
            <View
              style={[
                styles.toggleRow,
                {
                  borderColor: colors.border,
                  borderTopWidth: borders.width,
                  paddingTop: spacing.sm,
                  minHeight: minTouchTarget,
                },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text variant="body" color="ink" weight="semiBold">
                  Partner hospitals only
                </Text>
                <Text variant="caption" color="muted">
                  Hospitals offering live tokens and instant slots
                </Text>
              </View>
              <Switch
                value={filterPartnerOnly}
                onValueChange={setFilterPartnerOnly}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            {/* Apply Button */}
            <Button
              variant="primary"
              fullWidth
              label="Apply filters"
              onPress={() => setIsFilterSheetOpen(false)}
            />
          </View>
        </Sheet>
      </View>
    </FeatureErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'column',
    gap: 2,
  },
  emergencyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    flexDirection: 'column',
    width: '100%',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
