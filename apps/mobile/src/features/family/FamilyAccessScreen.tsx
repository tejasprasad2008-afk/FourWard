import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { fontFamilies } from '../../theme/tokens';
import { Text, Button, Tag, Sheet, TitleMetaRow, KeyValueRow } from '../../components/primitives';
import { Icon } from '../../components/icons';
import { FeatureErrorBoundary } from '../common/ErrorBoundary';
import { FEATURES } from '../registry';
import {
  fetchFamilyData,
  fetchManagedPersons,
  addManagedPerson,
  approveManagedPerson,
  updatePersonPermissions,
  revokeManagedPerson,
  DEFAULT_FAMILY_DATA,
} from '../../services/familyService';
import type {
  FamilyDataResponse,
  ManagedPerson,
  AgeBand,
} from '../../../../../packages/contracts/src/family';
import { getPatientProfile, PatientProfile, DEFAULT_PATIENT_PROFILE } from '../onboarding/onboardingStorage';

const RELATION_PRESETS = ['Son', 'Daughter', 'Spouse', 'Mother', 'Father', 'Brother'];
const AGE_BAND_OPTIONS: { label: string; value: AgeBand }[] = [
  { label: 'Child (< 18)', value: 'child' },
  { label: 'Adult (18–59)', value: 'adult' },
  { label: 'Senior (60+)', value: 'senior' },
];

interface FamilyScreenProps {
  hasHeader?: boolean;
}

export function FamilyAccessScreen({ hasHeader = false }: FamilyScreenProps) {
  const { colors, spacing, radii, borders, typography, minTouchTarget } = useTheme();
  const insets = useSafeAreaInsets();

  const [familyData, setFamilyData] = useState<FamilyDataResponse>(DEFAULT_FAMILY_DATA);
  const [profile, setProfile] = useState<PatientProfile>(DEFAULT_PATIENT_PROFILE);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  // Add person form state
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('Son');
  const [newAgeBand, setNewAgeBand] = useState<AgeBand>('child');
  const [newPhone, setNewPhone] = useState('');
  const [canBookVisits, setCanBookVisits] = useState(true);
  const [canViewRecords, setCanViewRecords] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Approval code sheet state
  const [approvingPerson, setApprovingPerson] = useState<ManagedPerson | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const loadData = async () => {
    const [data, p] = await Promise.all([
      fetchFamilyData(),
      getPatientProfile(),
    ]);
    setFamilyData(data);
    setProfile(p);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddSheet = () => {
    setNewName('');
    setNewRelation('Son');
    setNewAgeBand('child');
    setNewPhone('');
    setCanBookVisits(true);
    setCanViewRecords(true);
    setErrorMessage('');
    setIsAddSheetOpen(true);
  };

  const handleAddPerson = async () => {
    if (!newName.trim()) {
      setErrorMessage('Please enter a name.');
      return;
    }
    if ((newAgeBand === 'adult' || newAgeBand === 'senior') && !newPhone.trim()) {
      setErrorMessage('Phone number required for adults.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      await addManagedPerson({
        name: newName.trim(),
        relation: newRelation.trim(),
        ageBand: newAgeBand,
        phone: newPhone.trim() || undefined,
        canBookVisits,
        canViewRecords,
      });
      await loadData();
      setIsAddSheetOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not add person.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyApproval = async () => {
    if (!approvingPerson) return;
    if (!inputCode.trim()) {
      setApprovalError('Please enter the 4-digit code.');
      return;
    }

    setIsApproving(true);
    setApprovalError('');
    try {
      await approveManagedPerson(approvingPerson.id, inputCode.trim());
      await loadData();
      setApprovingPerson(null);
      setInputCode('');
    } catch (err: any) {
      setApprovalError(err.message || 'Invalid approval code.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleToggleCanBook = async (person: ManagedPerson) => {
    await updatePersonPermissions(person.id, {
      canBookVisits: !person.permissions.canBookVisits,
    });
    await loadData();
  };

  const handleToggleCanView = async (person: ManagedPerson) => {
    await updatePersonPermissions(person.id, {
      canViewRecords: !person.permissions.canViewRecords,
    });
    await loadData();
  };

  const handleRevoke = async (personId: string) => {
    await revokeManagedPerson(personId);
    await loadData();
  };

  const topPadding = hasHeader
    ? spacing.sm
    : Math.max(insets.top, 16) + spacing.xs;

  return (
    <FeatureErrorBoundary fallbackTitle="Family Unavailable">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <FlatList
          data={familyData.managedPersons}
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
              {/* Header Title & Add Person Button */}
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="headline" color="ink" weight="bold">
                    {FEATURES.family.name}
                  </Text>
                  <Text variant="body" color="muted">
                    People you manage and record access.
                  </Text>
                </View>
                <Button
                  variant="primary"
                  label="Add person"
                  onPress={handleOpenAddSheet}
                />
              </View>

              {/* Section Header */}
              <View style={styles.sectionHeaderRow}>
                <Text variant="subhead" color="ink" weight="bold">
                  People I manage
                </Text>
                <Text variant="caption" color="muted">
                  {familyData.managedPersons.length} people
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isOwner = item.isOwner;
            const isPending = item.status === 'waiting_approval';
            const isRevoked = item.status === 'revoked';
            const isActive = item.status === 'active';

            return (
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
                {/* Person Header */}
                <View style={styles.personHeader}>
                  <View style={{ flex: 1 }}>
                    <Text variant="subhead" color="ink" weight="bold">
                      {item.name}
                    </Text>
                    <Text variant="bodySmall" color="muted">
                      {item.relation} • {item.ageBand}
                      {item.phone ? ` • ${item.phone}` : ''}
                    </Text>
                  </View>

                  {isOwner && <Tag label="Self" variant="default" />}
                  {isActive && !isOwner && <Tag label="Active" variant="primary" />}
                  {isPending && <Tag label="Waiting for approval" variant="clay" />}
                  {isRevoked && <Tag label="Revoked" variant="danger" />}
                </View>

                {/* Pending Approval Callout */}
                {isPending && (
                  <View
                    style={[
                      styles.noticeBox,
                      {
                        backgroundColor: colors.sageTint,
                        borderColor: colors.border,
                        borderWidth: borders.width,
                        borderRadius: radii.sm,
                        padding: spacing.sm,
                        gap: spacing.xs,
                      },
                    ]}
                  >
                    <Text variant="bodySmall" color="ink">
                      Approval code sent to {item.phone || 'their phone'}:
                    </Text>
                    <Text variant="caption" color="muted">
                      "Allow {profile.name} to manage your visits?"
                    </Text>
                    <View style={{ marginTop: spacing.xxs }}>
                      <Button
                        variant="primary"
                        label="Enter approval code"
                        onPress={() => {
                          setApprovingPerson(item);
                          setInputCode('');
                          setApprovalError('');
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Active Person Controls (Toggles & Revoke) */}
                {isActive && !isOwner && (
                  <View style={{ gap: spacing.xs }}>
                    {/* Toggle: Can book visits */}
                    <View style={[styles.permissionRow, { minHeight: 36 }]}>
                      <Text variant="bodySmall" color="ink">
                        Can book visits
                      </Text>
                      <Switch
                        value={item.permissions.canBookVisits}
                        onValueChange={() => handleToggleCanBook(item)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={colors.surface}
                      />
                    </View>

                    {/* Toggle: Can view records */}
                    <View style={[styles.permissionRow, { minHeight: 36 }]}>
                      <Text variant="bodySmall" color="ink">
                        Can view records
                      </Text>
                      <Switch
                        value={item.permissions.canViewRecords}
                        onValueChange={() => handleToggleCanView(item)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={colors.surface}
                      />
                    </View>

                    {/* Revoke button */}
                    <View style={{ marginTop: spacing.xxs }}>
                      <Button
                        variant="danger"
                        label="Revoke access"
                        onPress={() => handleRevoke(item.id)}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            <View style={[styles.footerContainer, { gap: spacing.sm, marginTop: spacing.md }]}>
              {/* Audit Log Header */}
              <View style={styles.sectionHeaderRow}>
                <Text variant="subhead" color="ink" weight="bold">
                  Activity log
                </Text>
                <Text variant="caption" color="muted">
                  Who saw my records
                </Text>
              </View>

              {/* Audit Log Box */}
              <View
                style={[
                  styles.auditCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.lg,
                    overflow: 'hidden',
                  },
                ]}
              >
                {familyData.auditLog.map((log, idx) => {
                  const displayEvent =
                    log.event.toLowerCase().includes('grant') || log.event.toLowerCase().includes('consent')
                      ? 'You allowed access'
                      : log.event;

                  return (
                    <View
                      key={log.id}
                      style={[
                        styles.auditLogRow,
                        {
                          borderBottomWidth: idx < familyData.auditLog.length - 1 ? borders.width : 0,
                          borderBottomColor: colors.border,
                          padding: spacing.md,
                          gap: spacing.xs,
                        },
                      ]}
                    >
                      <TitleMetaRow
                        title={log.actor}
                        meta={<Text variant="caption" color="muted">{log.timestamp}</Text>}
                      />
                      <KeyValueRow label="Action" value={displayEvent} />
                      <Text variant="bodySmall" color="muted">
                        {log.detail}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          }
        />

        {/* Add Person Sheet */}
        <Sheet
          visible={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          title="Add person"
          footer={
            <Button
              variant="primary"
              label={
                isSaving
                  ? 'Saving...'
                  : newAgeBand === 'child'
                  ? 'Add child directly'
                  : 'Send approval code'
              }
              disabled={isSaving || !newName.trim()}
              fullWidth
              onPress={handleAddPerson}
            />
          }
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ gap: spacing.md }}
          >
            {errorMessage ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.dangerTint,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.sm,
                    padding: spacing.sm,
                  },
                ]}
              >
                <Text variant="bodySmall" color="danger" weight="semiBold">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Name Input */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                FULL NAME
              </Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Ramesh Prasad"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.md,
                    backgroundColor: colors.surface,
                    paddingHorizontal: spacing.sm,
                    color: colors.ink,
                    fontFamily: fontFamilies.bodyRegular,
                    fontSize: typography.body.fontSize,
                    minHeight: minTouchTarget,
                  },
                ]}
              />
            </View>

            {/* Relation Presets */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                RELATION
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                {RELATION_PRESETS.map((rel) => {
                  const isSelected = newRelation === rel;
                  return (
                    <Pressable
                      key={rel}
                      accessibilityRole="button"
                      accessibilityLabel={`Select relation ${rel}`}
                      onPress={() => setNewRelation(rel)}
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
                        {rel}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Age Band Selection */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                AGE BAND
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {AGE_BAND_OPTIONS.map((opt) => {
                  const isSelected = newAgeBand === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      accessibilityRole="button"
                      accessibilityLabel={`Select age band ${opt.label}`}
                      onPress={() => setNewAgeBand(opt.value)}
                      style={[
                        styles.chipPressable,
                        {
                          flex: 1,
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: borders.width,
                          borderRadius: radii.md,
                          paddingHorizontal: spacing.xs,
                          paddingVertical: spacing.xs,
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 44,
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
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

            {/* Phone Input */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                PHONE NUMBER {newAgeBand === 'child' ? '(OPTIONAL)' : '(REQUIRED FOR APPROVAL)'}
              </Text>
              <TextInput
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                placeholder="e.g. +91 98480 12345"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.md,
                    backgroundColor: colors.surface,
                    paddingHorizontal: spacing.sm,
                    color: colors.ink,
                    fontFamily: fontFamilies.bodyRegular,
                    fontSize: typography.body.fontSize,
                    minHeight: minTouchTarget,
                  },
                ]}
              />
            </View>

            {/* Permissions Toggles */}
            <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                PERMISSIONS
              </Text>
              <View style={[styles.permissionRow, { minHeight: 40 }]}>
                <Text variant="bodySmall" color="ink">
                  Can book visits
                </Text>
                <Switch
                  value={canBookVisits}
                  onValueChange={setCanBookVisits}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              <View style={[styles.permissionRow, { minHeight: 40 }]}>
                <Text variant="bodySmall" color="ink">
                  Can view records
                </Text>
                <Switch
                  value={canViewRecords}
                  onValueChange={setCanViewRecords}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Sheet>

        {/* Approval Code Sheet */}
        <Sheet
          visible={Boolean(approvingPerson)}
          onClose={() => setApprovingPerson(null)}
          title="Approve access"
          footer={
            <Button
              variant="primary"
              label={isApproving ? 'Verifying...' : 'Confirm approval'}
              disabled={isApproving || !inputCode.trim()}
              fullWidth
              onPress={handleVerifyApproval}
            />
          }
        >
          <View style={{ gap: spacing.md }}>
            <Text variant="body" color="ink">
              Enter the 4-digit code sent to {approvingPerson?.phone || 'their phone'} for {approvingPerson?.name}.
            </Text>

            {approvalError ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.dangerTint,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.sm,
                    padding: spacing.sm,
                  },
                ]}
              >
                <Text variant="bodySmall" color="danger" weight="semiBold">
                  {approvalError}
                </Text>
              </View>
            ) : null}

            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                APPROVAL CODE (TEST CODE: 4821)
              </Text>
              <TextInput
                value={inputCode}
                onChangeText={setInputCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="4821"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.md,
                    backgroundColor: colors.surface,
                    paddingHorizontal: spacing.sm,
                    color: colors.ink,
                    fontFamily: fontFamilies.bodyRegular,
                    fontSize: typography.title.fontSize,
                    letterSpacing: 4,
                    textAlign: 'center',
                    minHeight: minTouchTarget,
                  },
                ]}
              />
            </View>
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
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  card: {
    width: '100%',
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeBox: {
    width: '100%',
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerContainer: {
    width: '100%',
  },
  auditCard: {
    width: '100%',
  },
  auditLogRow: {
    width: '100%',
  },
  auditLogTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
  },
  errorBanner: {
    width: '100%',
  },
});
