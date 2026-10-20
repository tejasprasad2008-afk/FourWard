import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import { Text, Button, Sheet, Tag, TitleMetaRow, KeyValueRow } from '../../components/primitives';
import { Icon } from '../../components/icons';
import { formatHumanDateTime } from '../../utils/dateUtils';
import type { DoctorBookingResponse } from '../../../../../packages/contracts/src/doctors';

export type VisitSubTab = 'upcoming' | 'past' | 'cancelled' | 'requests';

export interface MyVisitsViewProps {
  visits: DoctorBookingResponse[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onBookAgain: (visit: DoctorBookingResponse) => void;
  onReschedule: (visit: DoctorBookingResponse) => void;
  onCancelVisit: (bookingId: string) => Promise<void>;
  onViewRecords: () => void;
}

export function MyVisitsView({
  visits,
  isLoading = false,
  onRefresh,
  onBookAgain,
  onReschedule,
  onCancelVisit,
  onViewRecords,
}: MyVisitsViewProps) {
  const { colors, spacing, radii, borders, minTouchTarget } = useTheme();

  const [activeSubTab, setActiveSubTab] = useState<VisitSubTab>('upcoming');
  const [selectedVisit, setSelectedVisit] = useState<DoctorBookingResponse | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Check if any 'requested' visits exist
  const hasRequests = useMemo(() => {
    return visits.some((v) => v.status === 'requested');
  }, [visits]);

  // If active tab was 'requests' but none exist, reset to upcoming
  const safeActiveTab = activeSubTab === 'requests' && !hasRequests ? 'upcoming' : activeSubTab;

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (safeActiveTab === 'upcoming') {
        return v.status === 'confirmed';
      }
      if (safeActiveTab === 'past') {
        return v.status === 'completed';
      }
      if (safeActiveTab === 'cancelled') {
        return v.status === 'cancelled';
      }
      if (safeActiveTab === 'requests') {
        return v.status === 'requested';
      }
      return false;
    });
  }, [visits, safeActiveTab]);

  const handleOpenDirections = (visit: DoctorBookingResponse) => {
    const query = encodeURIComponent(`${visit.hospitalName} ${visit.locality || ''}`);
    Linking.openURL(`https://maps.google.com/?q=${query}`).catch((err) => {
      console.warn('Could not open map directions:', err);
    });
  };

  const handleConfirmCancel = async () => {
    if (!selectedVisit) return;
    setIsActionLoading(true);
    await onCancelVisit(selectedVisit.bookingId);
    setIsActionLoading(false);
    setIsConfirmingCancel(false);
    setSelectedVisit(null);
  };

  const getStatusTagProps = (status: DoctorBookingResponse['status']): { label: string; variant: 'primary' | 'clay' | 'default' | 'danger' } => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmed', variant: 'primary' };
      case 'requested':
        return { label: 'Requested', variant: 'clay' };
      case 'completed':
        return { label: 'Completed', variant: 'default' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'danger' };
      default:
        return { label: status, variant: 'default' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 1. Sub-Tabs Segmented Bar: Upcoming | Past | Cancelled (and Requests only if any exist) */}
      <View
        style={[
          styles.subTabContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: borders.width,
            borderRadius: radii.sm,
            marginBottom: spacing.sm,
          },
        ]}
      >
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Upcoming visits"
          onPress={() => setActiveSubTab('upcoming')}
          style={[
            styles.subTabButton,
            {
              backgroundColor: safeActiveTab === 'upcoming' ? colors.primary : colors.surface,
              borderRadius: radii.sm,
              minHeight: 44,
            },
          ]}
        >
          <Text
            variant="caption"
            color={safeActiveTab === 'upcoming' ? 'surface' : 'ink'}
            weight={safeActiveTab === 'upcoming' ? 'bold' : 'regular'}
          >
            Upcoming
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Past visits"
          onPress={() => setActiveSubTab('past')}
          style={[
            styles.subTabButton,
            {
              backgroundColor: safeActiveTab === 'past' ? colors.primary : colors.surface,
              borderRadius: radii.sm,
              minHeight: 44,
            },
          ]}
        >
          <Text
            variant="caption"
            color={safeActiveTab === 'past' ? 'surface' : 'ink'}
            weight={safeActiveTab === 'past' ? 'bold' : 'regular'}
          >
            Past
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Cancelled visits"
          onPress={() => setActiveSubTab('cancelled')}
          style={[
            styles.subTabButton,
            {
              backgroundColor: safeActiveTab === 'cancelled' ? colors.primary : colors.surface,
              borderRadius: radii.sm,
              minHeight: 44,
            },
          ]}
        >
          <Text
            variant="caption"
            color={safeActiveTab === 'cancelled' ? 'surface' : 'ink'}
            weight={safeActiveTab === 'cancelled' ? 'bold' : 'regular'}
          >
            Cancelled
          </Text>
        </Pressable>

        {hasRequests && (
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Requested visits"
            onPress={() => setActiveSubTab('requests')}
            style={[
              styles.subTabButton,
              {
                backgroundColor: safeActiveTab === 'requests' ? colors.primary : colors.surface,
                borderRadius: radii.sm,
                minHeight: 44,
              },
            ]}
          >
            <Text
              variant="caption"
              color={safeActiveTab === 'requests' ? 'surface' : 'ink'}
              weight={safeActiveTab === 'requests' ? 'bold' : 'regular'}
            >
              Requests
            </Text>
          </Pressable>
        )}
      </View>

      {/* 2. Visits List */}
      {isLoading ? (
        <View style={[styles.centerState, { padding: spacing.xl }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredVisits}
          keyExtractor={(item) => item.bookingId}
          contentContainerStyle={[styles.listContent, { gap: spacing.sm, paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const formattedDateTime = item.tokenNumber
              ? `Token #${item.tokenNumber}`
              : formatHumanDateTime(item.date, item.time);
            const tagProps = getStatusTagProps(item.status);

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Visit with ${item.doctorName}. Tap for options.`}
                onPress={() => {
                  setSelectedVisit(item);
                  setIsConfirmingCancel(false);
                }}
                style={[
                  styles.visitCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.md,
                    padding: spacing.md,
                    gap: spacing.xs,
                    minHeight: minTouchTarget,
                  },
                ]}
              >
                {/* Header row: Doctor name + status tag */}
                <TitleMetaRow
                  title={item.doctorName}
                  statusTag={<Tag label={tagProps.label} variant={tagProps.variant} />}
                />

                {/* Department & Hospital */}
                <Text variant="bodySmall" color="muted">
                  {item.department} • {item.hospitalName}
                  {item.locality ? `, ${item.locality}` : ''}
                </Text>

                {/* KeyValue rows for When and Patient */}
                <KeyValueRow label="When" value={formattedDateTime} labelWidth={70} />
                <KeyValueRow label="Patient" value={item.patientName || 'Self'} labelWidth={70} />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={[styles.centerState, { padding: spacing.xl }]}>
              <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
                {safeActiveTab === 'upcoming' && 'No upcoming visits.'}
                {safeActiveTab === 'past' && 'No past visits.'}
                {safeActiveTab === 'cancelled' && 'No cancelled visits.'}
                {safeActiveTab === 'requests' && 'No pending appointment requests.'}
              </Text>
            </View>
          }
        />
      )}

      {/* 3. Action Sheet on Visit Tap */}
      <Sheet
        visible={Boolean(selectedVisit)}
        onClose={() => {
          setSelectedVisit(null);
          setIsConfirmingCancel(false);
        }}
      >
        {selectedVisit && (
          <View style={[styles.sheetContent, { gap: spacing.md, padding: spacing.md }]}>
            <View style={styles.sheetHeader}>
              <Text variant="headline" color="ink" weight="bold">
                Visit details
              </Text>
              <Text variant="bodySmall" color="muted">
                {selectedVisit.doctorName} • {selectedVisit.department}
              </Text>
            </View>

            {/* Visit Details Box */}
            <View
              style={[
                styles.detailsBox,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.sm,
                  padding: spacing.sm,
                  gap: spacing.xs,
                },
              ]}
            >
              <KeyValueRow label="Hospital" value={selectedVisit.hospitalName} />
              <KeyValueRow
                label="When"
                value={
                  selectedVisit.tokenNumber
                    ? `Token #${selectedVisit.tokenNumber}`
                    : formatHumanDateTime(selectedVisit.date, selectedVisit.time)
                }
              />
              <KeyValueRow label="Patient" value={selectedVisit.patientName || 'Self'} />
              {selectedVisit.room ? (
                <KeyValueRow label="Consultation" value={selectedVisit.room} />
              ) : null}
            </View>

            {/* Action Buttons: Upcoming vs Past vs Cancelled */}
            {selectedVisit.status === 'confirmed' && (
              <View style={{ gap: spacing.sm }}>
                {isConfirmingCancel ? (
                  <View style={{ gap: spacing.sm }}>
                    <Text variant="body" color="danger" weight="bold">
                      Cancel visit?
                    </Text>
                    <Text variant="bodySmall" color="muted">
                      Your token and slot will be released.
                    </Text>
                    <Button
                      variant="danger"
                      label={isActionLoading ? 'Cancelling...' : 'Yes, cancel'}
                      onPress={handleConfirmCancel}
                    />
                    <Button
                      variant="secondary"
                      label="Keep visit"
                      onPress={() => setIsConfirmingCancel(false)}
                    />
                  </View>
                ) : (
                  <View style={{ gap: spacing.sm }}>
                    <Button
                      variant="primary"
                      label="Directions"
                      onPress={() => handleOpenDirections(selectedVisit)}
                    />
                    <Button
                      variant="secondary"
                      label="Reschedule"
                      onPress={() => {
                        const visit = selectedVisit;
                        setSelectedVisit(null);
                        onReschedule(visit);
                      }}
                    />
                    <Button
                      variant="danger"
                      label="Cancel visit"
                      onPress={() => setIsConfirmingCancel(true)}
                    />
                  </View>
                )}
              </View>
            )}

            {selectedVisit.status === 'completed' && (
              <View style={{ gap: spacing.sm }}>
                <Button
                  variant="primary"
                  label="Book again"
                  onPress={() => {
                    const visit = selectedVisit;
                    setSelectedVisit(null);
                    onBookAgain(visit);
                  }}
                />
                <Button
                  variant="secondary"
                  label="View records"
                  onPress={() => {
                    setSelectedVisit(null);
                    onViewRecords();
                  }}
                />
              </View>
            )}

            {(selectedVisit.status === 'cancelled' || selectedVisit.status === 'requested') && (
              <View style={{ gap: spacing.sm }}>
                <Button
                  variant="primary"
                  label="Book again"
                  onPress={() => {
                    const visit = selectedVisit;
                    setSelectedVisit(null);
                    onBookAgain(visit);
                  }}
                />
              </View>
            )}
          </View>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subTabContainer: {
    flexDirection: 'row',
    padding: 3,
  },
  subTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  visitCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    width: '100%',
  },
  sheetHeader: {
    gap: 2,
  },
  detailsBox: {
    width: '100%',
  },
});
