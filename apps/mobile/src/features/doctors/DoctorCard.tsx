import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { Text, Tag, TitleMetaRow } from '../../components/primitives';
import type { DoctorItem } from '../../../../../packages/contracts/src/doctors';

export interface DoctorCardProps {
  doctor: DoctorItem;
  userSchemeCard?: string;
  onPress: () => void;
}

export function getDoctorInitials(name: string): string {
  const clean = name.replace(/^Dr\.\s*/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DoctorCard({ doctor, userSchemeCard, onPress }: DoctorCardProps) {
  const { colors, spacing, radii, borders, minTouchTarget } = useTheme();

  const isCardAccepted = Boolean(
    userSchemeCard &&
      userSchemeCard !== 'none' &&
      doctor.acceptedSchemes &&
      doctor.acceptedSchemes.includes(userSchemeCard)
  );

  const initials = getDoctorInitials(doctor.name);
  const inClinic = doctor.inClinic !== false;
  const nowServing = doctor.nowServingToken || (inClinic && doctor.isPartner ? 14 : undefined);
  const statusLine = inClinic && nowServing
    ? `Now serving token #${nowServing}`
    : (doctor.isPartner ? `Today · about ${doctor.estimatedWaitMinutes || 35} min` : 'Request a slot');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${doctor.name}, ${doctor.department}, ${inClinic ? 'In clinic' : 'Not in today'}, ${statusLine}, consultation fee ${doctor.fee} rupees. Tap to book.`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: borders.width,
          borderRadius: radii.lg,
          padding: spacing.md,
          minHeight: minTouchTarget,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={[styles.headerRow, { gap: spacing.sm }]}>
        {/* Initials Avatar (rounded square radius 8, tint fill, no photos) */}
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
            {initials}
          </Text>
        </View>

        {/* Doctor Details */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text variant="subhead" color="ink" weight="bold" style={{ flex: 1, minWidth: 0 }}>
              {doctor.name}
            </Text>
            <Tag
              label={inClinic ? 'In clinic' : 'Not in today'}
              variant={inClinic ? 'primary' : 'default'}
            />
          </View>

          {/* Department only; qualifications go in the doctor sheet per AGENTS.md */}
          <Text variant="bodySmall" color="muted">
            {doctor.department}
          </Text>

          <Text variant="caption" color="ink">
            {doctor.hospitalName} · {doctor.locality}
          </Text>

          <View style={{ marginTop: spacing.xxs, minWidth: 0, width: '100%' }}>
            <TitleMetaRow
              title={`Fee: ₹${doctor.fee}`}
              meta={statusLine}
              titleVariant="caption"
              titleWeight="regular"
              metaColor="primary"
            />
          </View>

          {/* Scheme acceptance tag only when true */}
          {isCardAccepted && (
            <View style={{ marginTop: spacing.xxs, alignSelf: 'flex-start' }}>
              <Tag label="Accepts my card" variant="primary" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0,
    width: '100%',
  },
  avatar: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minWidth: 0,
    gap: 8,
  },
});
