import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Text, Button, Tag, TitleMetaRow, KeyValueRow } from '../../components/primitives';
import { Icon } from '../../components/icons';
import { FeatureErrorBoundary } from '../common/ErrorBoundary';
import { FEATURES } from '../registry';
import {
  fetchMaternalData,
  toggleVaccineMilestone as toggleVaccineService,
  DEFAULT_MATERNAL_DATA,
} from '../../services/maternalService';
import type {
  MaternalDataResponse,
  MaternalMilestone,
} from '../../../../../packages/contracts/src/maternal';

type TrimesterFilter = 'all' | 'trimester_1' | 'trimester_2' | 'trimester_3' | 'newborn';

const FILTER_TABS: Array<{ id: TrimesterFilter; label: string }> = [
  { id: 'all', label: 'All milestones' },
  { id: 'trimester_1', label: 'Trimester 1' },
  { id: 'trimester_2', label: 'Trimester 2' },
  { id: 'trimester_3', label: 'Trimester 3' },
  { id: 'newborn', label: 'Newborn NIS' },
];

interface MaternalScreenProps {
  hasHeader?: boolean;
}

export function MaternalCareScreen({ hasHeader = false }: MaternalScreenProps) {
  const { colors, spacing, radii, borders } = useTheme();
  const insets = useSafeAreaInsets();

  const [maternalData, setMaternalData] = useState<MaternalDataResponse>(DEFAULT_MATERNAL_DATA);
  const [selectedFilter, setSelectedFilter] = useState<TrimesterFilter>('all');

  useEffect(() => {
    let active = true;
    fetchMaternalData().then((data) => {
      if (active) setMaternalData(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleToggleVaccine = async (milestoneId: string) => {
    const next = await toggleVaccineService(milestoneId);
    setMaternalData(next);
  };

  const filteredMilestones = useMemo(() => {
    if (selectedFilter === 'all') return maternalData.milestones;
    return maternalData.milestones.filter((m) => m.category === selectedFilter);
  }, [maternalData.milestones, selectedFilter]);

  const topPadding = hasHeader
    ? spacing.sm
    : Math.max(insets.top, 16) + spacing.xs;

  return (
    <FeatureErrorBoundary fallbackTitle="Maternal Care Unavailable">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <FlatList
          data={filteredMilestones}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: spacing.md,
              paddingTop: topPadding,
              paddingBottom: 120, // Clearance for assistant button
              gap: spacing.sm,
            },
          ]}
          ListHeaderComponent={
            <View style={[styles.headerContainer, { gap: spacing.md }]}>
              {/* Header Title */}
              <View style={styles.header}>
                <Text variant="headline" color="ink" weight="bold">
                  {FEATURES.maternal.name}
                </Text>
                <Text variant="body" color="muted">
                  Vaccines and care instructions.
                </Text>
              </View>

              {/* Stage & Clinic Check-up Notice */}
              <View
                style={[
                  styles.stageCard,
                  {
                    backgroundColor: colors.sageTint,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.lg,
                    padding: spacing.md,
                    gap: spacing.xs,
                  },
                ]}
              >
                <Text variant="caption" color="primary" weight="bold">
                  Current pregnancy stage
                </Text>

                <Text variant="title" color="ink" weight="bold">
                  {maternalData.stage}
                </Text>
                <Text variant="bodySmall" color="ink">
                  {maternalData.trimesterAlert}
                </Text>

                <View
                  style={[
                    styles.clinicBanner,
                    {
                      borderColor: colors.border,
                      borderTopWidth: borders.width,
                      paddingTop: spacing.xs,
                      marginTop: 4,
                    },
                  ]}
                >
                  <Text variant="caption" color="primary" weight="bold">
                    Free check-up on the 9th of every month at government clinics
                  </Text>
                </View>
              </View>

              {/* Physical Documents: Section heading with flat rows and 1px dividers (no card inside card) */}
              <View style={{ gap: spacing.xs }}>
                <Text variant="subhead" color="ink" weight="bold">
                  Physical records for clinic
                </Text>
                <Text variant="caption" color="muted">
                  Take these paper copies to your ANC check-up
                </Text>

                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.lg,
                    overflow: 'hidden',
                  }}
                >
                  {maternalData.physicalDocuments.map((doc, idx) => (
                    <View
                      key={doc.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: spacing.md,
                        gap: spacing.sm,
                        borderBottomWidth:
                          idx < maternalData.physicalDocuments.length - 1 ? borders.width : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Icon name="document" size={18} tone="primary" />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text variant="bodySmall" color="ink" weight="bold">
                          {doc.title}
                        </Text>
                        <Text variant="caption" color="muted">
                          {doc.subtitle}
                        </Text>
                      </View>
                      <Tag label="Required" variant="clay" />
                    </View>
                  ))}
                </View>
              </View>

              {/* Trimester Filter Tabs */}
              <View style={{ gap: spacing.xs }}>
                <Text variant="caption" color="muted" weight="semiBold">
                  Immunization timeline
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.xs }}
                >
                  {FILTER_TABS.map((tab) => {
                    const isSelected = selectedFilter === tab.id;
                    return (
                      <Pressable
                        key={tab.id}
                        onPress={() => setSelectedFilter(tab.id)}
                        style={[
                          styles.chipPressable,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderWidth: borders.width,
                            borderRadius: radii.md,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                          },
                        ]}
                      >
                        <Text
                          variant="bodySmall"
                          color={isSelected ? 'surface' : 'ink'}
                          weight={isSelected ? 'bold' : 'regular'}
                        >
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Section Subheading */}
              <View style={styles.sectionHeaderRow}>
                <Text variant="subhead" color="ink" weight="bold">
                  Milestones and vaccines
                </Text>
                <Text variant="caption" color="muted">
                  {`${filteredMilestones.length} items`}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.milestoneCard,
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
              <TitleMetaRow
                title={item.name}
                meta={
                  item.completed ? (
                    <Tag label="Completed" variant="primary" />
                  ) : (
                    <Tag label="Due soon" variant="default" />
                  )
                }
              />

              <KeyValueRow
                label="When"
                value={`${item.scheduleWindow} · Due ${item.dueDate}`}
              />
              <KeyValueRow label="Counter" value={item.hospitalCounter} />

              {item.notes && (
                <Text variant="caption" color="muted">
                  {item.notes}
                </Text>
              )}

              <View style={styles.milestoneActionRow}>
                <Button
                  variant={item.completed ? 'secondary' : 'primary'}
                  label={item.completed ? 'Completed' : 'Mark done'}
                  onPress={() => handleToggleVaccine(item.id)}
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
  stageCard: {
    flexDirection: 'column',
  },
  stageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clinicBanner: {
    flexDirection: 'column',
  },
  card: {
    flexDirection: 'column',
  },
  docItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  chipPressable: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  milestoneCard: {
    flexDirection: 'column',
    minHeight: 48,
  },
  milestoneTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  milestoneActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
});
