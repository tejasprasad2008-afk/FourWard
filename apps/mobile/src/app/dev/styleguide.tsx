import React, { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Linking,
} from 'react-native';
import { Icon } from '../../components/icons';
import { useTheme } from '../../theme';
import {
  Text,
  Button,
  Tile,
  ListRow,
  Tag,
  SearchBar,
  Sheet,
  Skeleton,
  InlineWait,
  StatBlock,
} from '../../components/primitives';

export default function StyleguideScreen() {
  const { mode, toggleMode, colors, spacing, radii, borders, minTouchTarget } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [phoneWidth, setPhoneWidth] = useState<390 | 430>(390);

  return (
    <SafeAreaView style={[styles.outerContainer, { backgroundColor: colors.bg }]}>
      {/* Centered Mobile Frame (max-width 430 or 390) */}
      <View
        style={[
          styles.phoneFrame,
          {
            maxWidth: phoneWidth,
            borderColor: colors.border,
            borderLeftWidth: borders.width,
            borderRightWidth: borders.width,
            backgroundColor: colors.bg,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              padding: spacing.md,
              gap: spacing.lg,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Controls: Mode Switch & Phone Width Toggle */}
          <View
            style={[
              styles.modeHeader,
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
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text variant="headline" color="ink" weight="bold">
                  FourWard Styleguide
                </Text>
                <Text variant="caption" color="muted">
                  Utilitarian Design System • 1px Borders Only
                </Text>
              </View>
              <Button
                variant="primary"
                label={mode === 'normal' ? 'Switch to Elderly' : 'Switch to Normal'}
                onPress={toggleMode}
              />
            </View>

            {/* Metrics & Width Switcher */}
            <View style={[styles.metricsRow, { gap: spacing.xs }]}>
              <View
                style={[
                  styles.metricsBadge,
                  {
                    backgroundColor: colors.primaryTint,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.sm,
                    paddingHorizontal: spacing.xs,
                    paddingVertical: spacing.xxs,
                    flex: 1,
                  },
                ]}
              >
                <Text variant="caption" color="primary" weight="bold">
                  {mode.toUpperCase()} ({mode === 'normal' ? '1.0x' : '1.35x'}) • Target {minTouchTarget}dp
                </Text>
              </View>

              <Pressable
                onPress={() => setPhoneWidth((w) => (w === 390 ? 430 : 390))}
                style={[
                  styles.widthToggle,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.sm,
                    paddingHorizontal: spacing.xs,
                    paddingVertical: spacing.xxs,
                  },
                ]}
              >
                <Text variant="caption" color="ink" weight="bold">
                  Width: {phoneWidth}px
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 1. Color Palette Tokens */}
          <View style={styles.section}>
            <Text variant="title" color="ink" weight="bold">
              1. Color Tokens
            </Text>
            <Text variant="caption" color="muted">
              Ivory white bg (#FAFAF6), neutral border (#E4E4DE), surface (#FFFFFF).
            </Text>

            <View style={[styles.paletteGrid, { gap: spacing.xs, marginTop: spacing.xs }]}>
              {[
                { name: 'bg', hex: colors.bg, border: true },
                { name: 'surface', hex: colors.surface, border: true },
                { name: 'ink', hex: colors.ink, border: false },
                { name: 'muted', hex: colors.muted, border: false },
                { name: 'primary', hex: colors.primary, border: false },
                { name: 'primaryPressed', hex: colors.primaryPressed, border: false },
                { name: 'primaryTint', hex: colors.primaryTint, border: true },
                { name: 'accent', hex: colors.accent, border: false },
                { name: 'clayTint', hex: colors.clayTint, border: true },
                { name: 'danger', hex: colors.danger, border: false },
                { name: 'dangerTint', hex: colors.dangerTint, border: true },
                { name: 'border', hex: colors.border, border: false },
              ].map((swatch) => (
                <View
                  key={swatch.name}
                  style={[
                    styles.swatchCard,
                    {
                      backgroundColor: swatch.hex,
                      borderColor: colors.border,
                      borderWidth: swatch.border ? borders.width : 0,
                      borderRadius: radii.sm,
                      padding: spacing.xs,
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    color={
                      swatch.name === 'ink' ||
                      swatch.name === 'primary' ||
                      swatch.name === 'primaryPressed' ||
                      swatch.name === 'danger'
                        ? 'surface'
                        : 'ink'
                    }
                    weight="bold"
                  >
                    {swatch.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 2. Typography Scale */}
          <View style={[styles.section, { gap: spacing.xs }]}>
            <Text variant="title" color="ink" weight="bold">
              2. Typography Scale ({mode} mode)
            </Text>
            <Text variant="caption" color="muted">
              Bricolage Grotesque (headings) & Hanken Grotesk (body).
            </Text>

            <View
              style={[
                styles.cardBox,
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
              <Text variant="display">Display Text</Text>
              <Text variant="headline">Headline Text</Text>
              <Text variant="title">Title Text</Text>
              <Text variant="subhead">Subhead Text</Text>
              <Text variant="body">Body text: Regular hospital notes and clinical instructions.</Text>
              <Text variant="bodySmall">BodySmall: Secondary clinical details and timestamp.</Text>
              <Text variant="caption" color="muted">
                Caption: Department triage queue No. 402
              </Text>
              <Text variant="label" color="primary">
                Label: ACTIONABLE SPECIFICATION
              </Text>

              <View style={{ marginTop: spacing.xs, gap: spacing.xxs }}>
                <Text variant="body" color="primary" weight="semiBold">
                  Telugu / Hindi Support:
                </Text>
                <Text variant="subhead" color="ink">
                  నమస్తే • FourWard ఆసుపత్రి రోగి సంరక్షణ
                </Text>
                <Text variant="subhead" color="ink">
                  नमस्ते • फोरवर्ड अस्पताल आपातकालीन सेवा
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Button Primitives */}
          <View style={[styles.section, { gap: spacing.xs }]}>
            <Text variant="title" color="ink" weight="bold">
              3. Button Primitives
            </Text>
            <Text variant="caption" color="muted">
              Height {mode === 'elderly' ? 56 : 48}, horizontal padding 20, radius 8, Hanken 600, no default icons.
            </Text>

            <View
              style={[
                styles.cardBox,
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
              {/* Standalone Button Variants */}
              <View style={[styles.buttonRow, { gap: spacing.xs }]}>
                <Button
                  variant="primary"
                  label="Confirm consult"
                  onPress={() => {}}
                />
                <Button
                  variant="secondary"
                  label="View waiting time"
                  onPress={() => {}}
                />
                <Button
                  variant="text"
                  label="Dismiss"
                  onPress={() => {}}
                />
              </View>

              <View style={[styles.buttonRow, { gap: spacing.xs }]}>
                <Button
                  variant="danger"
                  label="Emergency 108"
                  onPress={() => Linking.openURL('tel:108').catch(() => {})}
                />
                <Button
                  variant="primary"
                  disabled
                  label="Confirm consult"
                  onPress={() => {}}
                />
                <Button
                  variant="primary"
                  loading
                  loadingLabel="Booking..."
                  label="Confirm consult"
                  onPress={() => {}}
                />
              </View>

              {/* Button Pairs: Side-by-side (Sheet style) */}
              <View style={{ marginTop: spacing.xs, gap: spacing.xxs }}>
                <Text variant="caption" color="muted" weight="bold">
                  Side-by-side pair (Equal width, Sheet style):
                </Text>
                <View style={[styles.buttonPairRow, { gap: spacing.sm }]}>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="secondary"
                      label="Dismiss"
                      fullWidth
                      onPress={() => {}}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="primary"
                      label="Accept"
                      fullWidth
                      onPress={() => {}}
                    />
                  </View>
                </View>
              </View>

              {/* Button Pairs: Stacked (Form style) */}
              <View style={{ marginTop: spacing.xs, gap: spacing.xxs }}>
                <Text variant="caption" color="muted" weight="bold">
                  Stacked pair (Full width, Form style, primary first):
                </Text>
                <View style={{ gap: spacing.xs }}>
                  <Button
                    variant="primary"
                    label="Submit consult request"
                    fullWidth
                    onPress={() => {}}
                  />
                  <Button
                    variant="secondary"
                    label="Cancel"
                    fullWidth
                    onPress={() => {}}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 4. Loading System */}
          <View style={[styles.section, { gap: spacing.xs }]}>
            <Text variant="title" color="ink" weight="bold">
              4. Loading System (No Spinners)
            </Text>
            <Text variant="caption" color="muted">
              Flat border-color blocks with 0.5 to 1 opacity fade & 2px indeterminate bar.
            </Text>

            <View
              style={[
                styles.cardBox,
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
              {/* Skeleton primitive matching real layout */}
              <View style={{ gap: spacing.xs }}>
                <Text variant="caption" color="muted" weight="bold">
                  Skeleton Screen Layout (0.5 to 1.0 slow opacity fade):
                </Text>
                <Skeleton width="45%" height={16} />
                <Skeleton width="100%" height={48} borderRadius={8} />
                <View style={[styles.tileRow, { gap: spacing.sm }]}>
                  <View style={{ flex: 1 }}>
                    <Skeleton width="100%" height={120} borderRadius={12} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Skeleton width="100%" height={120} borderRadius={12} />
                  </View>
                </View>
              </View>

              {/* Inline wait for assistant thinking */}
              <View style={{ gap: spacing.xs }}>
                <Text variant="caption" color="muted" weight="bold">
                  Assistant Thinking & Inline Wait (2px bar + status line):
                </Text>
                <InlineWait status="Checking Cardiology OPD..." />
              </View>
            </View>
          </View>

          {/* 5. Tile Primitives */}
          <View style={[styles.section, { gap: spacing.xs }]}>
            <Text variant="title" color="ink" weight="bold">
              5. Tile Primitives
            </Text>
            <Text variant="caption" color="muted">
              Title top-left, live status, bottom-right bleeding cut-out image (~45% width).
            </Text>

            {/* Half Size (2-column grid) */}
            <View style={[styles.tileRow, { gap: spacing.sm }]}>
              <View style={styles.tileCol}>
                <Tile
                  title="General Ward"
                  status="14 beds free"
                  tint="primaryTint"
                  size="half"
                  image={require('@/assets/tiles/ref_hospital_bed.webp')}
                  onPress={() => {}}
                />
              </View>
              <View style={styles.tileCol}>
                <Tile
                  title="OPD Queue"
                  status="37 min wait"
                  tint="clayTint"
                  size="half"
                  image={require('@/assets/tiles/ref_triage_scope.webp')}
                  onPress={() => {}}
                />
              </View>
            </View>

            {/* Wide Size (Banners) */}
            <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
              <Tile
                title="Prescriptions & Refills"
                status="Automatic delivery cart"
                tint="surface"
                size="wide"
                image={require('@/assets/tiles/ref_pills_bottle.webp')}
                onPress={() => {}}
              />
              <Tile
                title="Maternal Care"
                status="Week 28 checkup scheduled"
                tint="primaryTint"
                size="wide"
                image={require('@/assets/tiles/ref_booties.webp')}
                onPress={() => {}}
              />
            </View>
          </View>

          {/* 6. ListRow Primitives */}
          <View style={[styles.section, { gap: spacing.xs }]}>
            <Text variant="title" color="ink" weight="bold">
              6. ListRow Primitives
            </Text>
            <Text variant="caption" color="muted">
              Utilitarian patient record rows. Left-aligned, 1px border.
            </Text>

            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  overflow: 'hidden',
                },
              ]}
            >
              <ListRow
                leadIcon={<Icon name="approved" size={20} tone="primary" />}
                title="Dr. Ananya Rao"
                subtitle="Cardiology · Consultation OPD Room 204"
                trailingText="Available"
                trailingIcon={<Icon name="next" size={16} tone="muted" />}
                onPress={() => {}}
              />
              <ListRow
                leadIcon={<Icon name="document" size={20} tone="ink" />}
                title="CBC Blood Test Report"
                subtitle="Collected 08:45 AM · Approved by Dr. K. Murthy"
                trailingText="Ready"
                trailingIcon={<Icon name="next" size={16} tone="muted" />}
                onPress={() => {}}
              />
              <ListRow
                leadIcon={<Icon name="cardiology" size={20} tone="muted" />}
                title="Metformin 500mg Refill"
                subtitle="1 tablet with breakfast · 6 days left"
                trailingText="Refill Due"
                trailingIcon={<Icon name="next" size={16} tone="muted" />}
                onPress={() => {}}
              />
              <ListRow
                leadIcon={<Icon name="warning" size={20} tone="danger" />}
                title="Doctor Consent"
                subtitle="Temporary 30-min access requested"
                destructive
                trailingText="Pending"
                borderBottom={false}
                onPress={() => {}}
              />
            </View>
          </View>

          {/* 7. Tag Primitives */}
          <View style={[styles.section, { gap: spacing.xs }]}>
            <Text variant="title" color="ink" weight="bold">
              7. Tag Primitives
            </Text>
            <Text variant="caption" color="muted">
              Square-ish 6px radius. No icons on tags except the danger tag.
            </Text>

            <View style={[styles.tagsRow, { gap: spacing.xs }]}>
              <Tag label="Department: Cardiology" variant="default" />
              <Tag label="Triage Level 1" variant="primary" />
              <Tag label="Diet: Diabetic Meal" variant="clay" />
              <Tag label="Emergency 108" variant="danger" />
            </View>
          </View>

          {/* 8. SearchBar Primitive */}
          <View style={[styles.section, { gap: spacing.xs }]}>
            <Text variant="title" color="ink" weight="bold">
              8. SearchBar Primitive
            </Text>
            <Text variant="caption" color="muted">
              8px radius, 1px border (focus: primary), min touch target compliant.
            </Text>

            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search symptoms, doctors, medicines..."
            />
          </View>

          {/* 9. Sheet Primitive */}
          <View style={[styles.section, { gap: spacing.xs }]}>
            <Text variant="title" color="ink" weight="bold">
              9. Sheet Primitive (Proposal Flow)
            </Text>
            <Text variant="caption" color="muted">
              Side-by-side Accept (primary) and Dismiss (secondary) equal-width pair.
            </Text>

            <Button
              variant="secondary"
              label="Open Action Proposal Sheet"
              onPress={() => setSheetVisible(true)}
            />

            <Sheet
              visible={sheetVisible}
              onClose={() => setSheetVisible(false)}
              title="Assistant Action Proposal"
              footer={
                <View style={[styles.sheetFooterRow, { gap: spacing.sm }]}>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="secondary"
                      label="Dismiss"
                      fullWidth
                      onPress={() => setSheetVisible(false)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="primary"
                      label="Accept"
                      fullWidth
                      onPress={() => setSheetVisible(false)}
                    />
                  </View>
                </View>
              }
            >
              <View style={{ gap: spacing.xs }}>
                <Text variant="body" color="ink">
                  The assistant proposes booking an in-person consultation with{' '}
                  <Text variant="body" color="primary" weight="bold">
                    Dr. Vikram Sethi
                  </Text>{' '}
                  at 11:30 AM in Room 204.
                </Text>
                <Text variant="caption" color="muted">
                  Per hospital rules, no action is taken until you explicitly tap Accept.
                </Text>
              </View>
            </Sheet>
          </View>

          {/* 10. StatBlock Primitive */}
          <View style={[styles.section, { gap: spacing.xs }]}>
            <Text variant="title" color="ink" weight="bold">
              10. StatBlock Primitive
            </Text>
            <Text variant="caption" color="muted">
              Display metrics in bold Bricolage 700 with flat tint fills.
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              <StatBlock value="14" label="ICU Beds Available" variant="sage" style={{ flex: 1, minWidth: 140 }} />
              <StatBlock value="37 min" label="General OPD Wait" variant="peach" style={{ flex: 1, minWidth: 140 }} />
              <StatBlock value="6" label="Active Prescriptions" variant="surface" style={{ flex: 1, minWidth: 140 }} />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: '100%',
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'column',
  },
  modeHeader: {
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricsBadge: {
    justifyContent: 'center',
  },
  widthToggle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    flexDirection: 'column',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  swatchCard: {
    minWidth: 80,
    flex: 1,
  },
  cardBox: {
    flexDirection: 'column',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  buttonPairRow: {
    flexDirection: 'row',
    width: '100%',
  },
  tileRow: {
    flexDirection: 'row',
    width: '100%',
  },
  tileCol: {
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  sheetFooterRow: {
    flexDirection: 'row',
    width: '100%',
  },
});
