import React, { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import {
  Text,
  Button,
  Tag,
  Tile,
  KeyValueRow,
  TitleMetaRow,
  ActionRow,
  ScreenHeader,
} from '../../components/primitives';
import { DoctorCard } from '../../features/doctors/DoctorCard';
import type { DoctorItem } from '../../../../../packages/contracts/src/doctors';

const STRESS_DATA = {
  en: {
    lang: 'English',
    text80: 'Comprehensive multi-specialty clinical consultation with senior cardiothoracic team',
    sub80: 'Department of Advanced Cardiovascular Interventions and Preventive Cardiac Sciences',
    label: 'Consultation Overview',
    meta: 'Room 204 • Mon to Sat • Scheduled morning appointment',
  },
  te: {
    lang: 'Telugu',
    text80: 'హైదరాబాద్ డెక్కన్ హెల్త్ ఇన్స్టిట్యూట్ సీనియర్ గుండె చికిత్స నిపుణుల సమగ్ర సంప్రదింపులు',
    sub80: 'అధునాతన హృద్రోగ నివారణ మరియు సంరక్షణ విభాగం ప్రత్యేక శస్త్రచికిత్స బృందం రిపోర్టులు',
    label: 'వైద్య సంప్రదింపుల వివరాలు',
    meta: 'గది 204 • సోమవారం నుండి శనివారం వరకు ఉదయం సమయం',
  },
  hi: {
    lang: 'Hindi',
    text80: 'हैदराबाद डेक्कन हेल्थ इंस्टीट्यूट वरिष्ठ हृदय रोग विशेषज्ञ समग्र नैदानिक परामर्श समीक्षा',
    sub80: 'उन्नत हृदय रोग निवारण एवं गहन चिकित्सा विभाग के वरिष्ठ विशेषज्ञों द्वारा परामर्श',
    label: 'परामर्श विवरण एवं समीक्षा',
    meta: 'कमरा संख्या 204 • सोमवार से शनिवार • सुबह की अग्रिम जांच',
  },
};

const DOCTORS_STRESS: Record<'en' | 'te' | 'hi', DoctorItem> = {
  en: {
    id: 'doc_stress_en',
    name: 'Dr. Parameshwar Venkata Satyanarayana Murthy',
    qualification: 'MBBS, MD (General Medicine), DM (Cardiology), Fellowship (Interventional)',
    department: 'Cardiovascular Thoracic Surgery & Critical Care',
    hospitalName: 'Deccan Health Institute of Medical Sciences & Research Foundation',
    locality: 'Gachibowli Financial District, Hyderabad, Telangana',
    fee: 650,
    isPartner: true,
    room: 'Consultation Suite 402, Block B',
    patientsAhead: 7,
    estimatedWaitMinutes: 38,
    availableDays: 'Mon, Tue, Wed, Thu, Fri, Sat',
    nextAvailableSlot: 'Today · about 38 min',
    acceptedSchemes: ['aarogyasri', 'pmjay'],
    distanceKm: 4.8,
  },
  te: {
    id: 'doc_stress_te',
    name: 'డా. పరమేశ్వర్ వెంకట సత్యనారాయణ మూర్తి గారు',
    qualification: 'ఎంబీబీఎస్, ఎండీ (జనరల్ మెడిసిన్), డీఎం (కార్డియాలజీ)',
    department: 'కార్డియోవాస్కులర్ సర్జరీ మరియు గుండె వైద్య విభాగము',
    hospitalName: 'డెక్కన్ హెల్త్ ఇన్స్టిట్యూట్ ఆఫ్ మెడికల్ సైన్సెస్ రీసెర్చ్ ఫౌండేషన్',
    locality: 'గచ్చిబౌలి ఫైనాన్షియల్ డిస్ట్రిక్ట్, హైదరాబాద్',
    fee: 650,
    isPartner: true,
    room: 'కన్సల్టేషన్ గది 402, బ్లాక్ బి',
    patientsAhead: 8,
    estimatedWaitMinutes: 42,
    availableDays: 'సోమవారం నుండి శనివారం వరకు',
    nextAvailableSlot: 'ఈరోజు · సుమారు 42 నిమిషాలు',
    acceptedSchemes: ['aarogyasri'],
    distanceKm: 4.8,
  },
  hi: {
    id: 'doc_stress_hi',
    name: 'डॉ. परमेश्वर वेंकट सत्यनारायण मूर्ति जी',
    qualification: 'एमबीबीएस, एमडी (जनरल मेडिसिन), डीएम (कार्डियोलॉजी)',
    department: 'हृदय एवं वक्ष शल्य चिकित्सा एवं गहन देखभाल विभाग',
    hospitalName: 'डेक्कन हेल्थ इंस्टीट्यूट ऑफ मेडिकल साइंसेज एवं अनुसंधान केंद्र',
    locality: 'गाचीबोवली फाइनेंशियल डिस्ट्रिक्ट, हैदराबाद',
    fee: 650,
    isPartner: true,
    room: 'परामर्श कक्ष 402, ब्लॉक बी',
    patientsAhead: 5,
    estimatedWaitMinutes: 28,
    availableDays: 'सोमवार से शनिवार',
    nextAvailableSlot: 'आज · लगभग 28 मिनट',
    acceptedSchemes: ['pmjay', 'aarogyasri'],
    distanceKm: 4.8,
  },
};

export default function StressTestScreen() {
  const router = useRouter();
  const { mode, setMode, colors, spacing, radii, borders, minTouchTarget } = useTheme();
  const [selectedLang, setSelectedLang] = useState<'all' | 'en' | 'te' | 'hi'>('all');

  const isElderly = mode === 'elderly';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScreenHeader
        title="Stress Test"
        onBack={() => router.back()}
        rightAction={
          <Button
            label={isElderly ? 'Scale: 1.35' : 'Scale: 1.0'}
            variant="secondary"
            onPress={() => setMode(isElderly ? 'normal' : 'elderly')}
          />
        }
      />

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
        {/* Scale and Mode Switcher Control Bar */}
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
          <Text variant="subhead" weight="bold">
            Typography Scale Verification
          </Text>
          <Text variant="bodySmall" color="muted">
            Current scale: {isElderly ? '1.35x (Senior UI Mode)' : '1.0x (Standard UI Mode)'}. Touch target minimum: {minTouchTarget}dp. All rows test flexShrink: 1, minWidth: 0, text wrapping without clipping or truncation dots.
          </Text>

          <View style={[styles.chipRow, { gap: spacing.xs }]}>
            <Button
              label="Standard Scale 1.0"
              variant={!isElderly ? 'primary' : 'secondary'}
              onPress={() => setMode('normal')}
            />
            <Button
              label="Senior Scale 1.35"
              variant={isElderly ? 'primary' : 'secondary'}
              onPress={() => setMode('elderly')}
            />
          </View>
        </View>

        {/* Language Filter */}
        <View style={[styles.chipRow, { gap: spacing.xs }]}>
          {(['all', 'en', 'te', 'hi'] as const).map((lang) => (
            <Button
              key={lang}
              label={lang === 'all' ? 'All Languages' : lang === 'en' ? 'English' : lang === 'te' ? 'Telugu' : 'Hindi'}
              variant={selectedLang === lang ? 'primary' : 'secondary'}
              onPress={() => setSelectedLang(lang)}
            />
          ))}
        </View>

        {/* 1. KeyValueRow Stress Section */}
        <View style={styles.section}>
          <Text variant="subhead" weight="bold">
            1. KeyValueRow (80+ Chars)
          </Text>
          <Text variant="bodySmall" color="muted">
            Tests label and value wrapping, hint lines, and vertical alignment under large fonts.
          </Text>

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
            {(selectedLang === 'all' || selectedLang === 'en') && (
              <KeyValueRow
                label="English 80-Char"
                value={STRESS_DATA.en.text80}
                hint={STRESS_DATA.en.meta}
              />
            )}
            {(selectedLang === 'all' || selectedLang === 'te') && (
              <KeyValueRow
                label="Telugu 80-Char"
                value={STRESS_DATA.te.text80}
                hint={STRESS_DATA.te.meta}
              />
            )}
            {(selectedLang === 'all' || selectedLang === 'hi') && (
              <KeyValueRow
                label="Hindi 80-Char"
                value={STRESS_DATA.hi.text80}
                hint={STRESS_DATA.hi.meta}
              />
            )}
          </View>
        </View>

        {/* 2. TitleMetaRow Stress Section */}
        <View style={styles.section}>
          <Text variant="subhead" weight="bold">
            2. TitleMetaRow (80+ Chars)
          </Text>
          <Text variant="bodySmall" color="muted">
            Tests heading wrapping alongside status tags without row height collapse.
          </Text>

          <View
            style={[
              styles.card,
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
            {(selectedLang === 'all' || selectedLang === 'en') && (
              <TitleMetaRow
                title={STRESS_DATA.en.text80}
                meta={STRESS_DATA.en.sub80}
                statusTag={<Tag label="Confirmed" variant="primary" />}
              />
            )}
            {(selectedLang === 'all' || selectedLang === 'te') && (
              <TitleMetaRow
                title={STRESS_DATA.te.text80}
                meta={STRESS_DATA.te.sub80}
                statusTag={<Tag label="ధృవీకరించబడింది" variant="primary" />}
              />
            )}
            {(selectedLang === 'all' || selectedLang === 'hi') && (
              <TitleMetaRow
                title={STRESS_DATA.hi.text80}
                meta={STRESS_DATA.hi.sub80}
                statusTag={<Tag label="पुष्टीकृत" variant="primary" />}
              />
            )}
          </View>
        </View>

        {/* 3. ActionRow Stress Section */}
        <View style={styles.section}>
          <Text variant="subhead" weight="bold">
            3. ActionRow (80+ Chars)
          </Text>
          <Text variant="bodySmall" color="muted">
            Tests full-width interactive row with right action button and multiline text.
          </Text>

          <View
            style={[
              styles.card,
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
            {(selectedLang === 'all' || selectedLang === 'en') && (
              <ActionRow
                title={STRESS_DATA.en.text80}
                subtitle={STRESS_DATA.en.sub80}
                action={<Button label="Details" variant="secondary" onPress={() => {}} />}
              />
            )}
            {(selectedLang === 'all' || selectedLang === 'te') && (
              <ActionRow
                title={STRESS_DATA.te.text80}
                subtitle={STRESS_DATA.te.sub80}
                action={<Button label="వివరాలు" variant="secondary" onPress={() => {}} />}
              />
            )}
            {(selectedLang === 'all' || selectedLang === 'hi') && (
              <ActionRow
                title={STRESS_DATA.hi.text80}
                subtitle={STRESS_DATA.hi.sub80}
                action={<Button label="विवरण" variant="secondary" onPress={() => {}} />}
              />
            )}
          </View>
        </View>

        {/* 4. Tag Stress Section */}
        <View style={styles.section}>
          <Text variant="subhead" weight="bold">
            4. Tag Wrapping
          </Text>
          <Text variant="bodySmall" color="muted">
            Tags wrap their text gracefully instead of truncating or overflowing.
          </Text>

          <View style={[styles.tagContainer, { gap: spacing.xs }]}>
            <Tag label="Standard Tag" variant="default" />
            <Tag label="Card accepted · Aarogyasri & PMJAY" variant="primary" />
            <Tag label="గచ్చిబౌలి డెక్కన్ హెల్త్ ఇన్స్టిట్యూట్ కార్డ్" variant="primary" />
            <Tag label="आयुष्मान भारत एवं आरोग्यश्री योजना स्वीकृत" variant="primary" />
            <Tag label="Urgent Emergency · Immediate Evaluation" variant="danger" />
          </View>
        </View>

        {/* 5. Tile Stress Section */}
        <View style={styles.section}>
          <Text variant="subhead" weight="bold">
            5. Tile Component (Dense Multiline)
          </Text>
          <Text variant="bodySmall" color="muted">
            Grid tiles with long titles and descriptions in English, Telugu, Hindi.
          </Text>

          <View style={[styles.tileGrid, { gap: spacing.sm }]}>
            <Tile
              title="Clinical Records & Discharge"
              status="Full longitudinal cardiac and pediatric summaries"
              size="wide"
              onPress={() => {}}
            />
            <Tile
              title="వైద్య నివేదికలు"
              status="హైదరాబాద్ డెక్కన్ హెల్త్ సమగ్ర రికార్డులు"
              size="wide"
              onPress={() => {}}
            />
            <Tile
              title="चिकित्सा रिकॉर्ड एवं विवरण"
              status="विस्तृत हृदय रोग एवं नैदानिक पर्चियां"
              size="wide"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* 6. DoctorCard Stress Section */}
        <View style={styles.section}>
          <Text variant="subhead" weight="bold">
            6. DoctorCard (Full Multiline Stress)
          </Text>
          <Text variant="bodySmall" color="muted">
            DoctorCard with 80+ character hospital names, long qualifications, and Indian language scripts.
          </Text>

          <View style={{ gap: spacing.md }}>
            {(selectedLang === 'all' || selectedLang === 'en') && (
              <DoctorCard
                doctor={DOCTORS_STRESS.en}
                userSchemeCard="aarogyasri"
                onPress={() => {}}
              />
            )}
            {(selectedLang === 'all' || selectedLang === 'te') && (
              <DoctorCard
                doctor={DOCTORS_STRESS.te}
                userSchemeCard="aarogyasri"
                onPress={() => {}}
              />
            )}
            {(selectedLang === 'all' || selectedLang === 'hi') && (
              <DoctorCard
                doctor={DOCTORS_STRESS.hi}
                userSchemeCard="pmjay"
                onPress={() => {}}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  section: {
    gap: 8,
  },
  card: {
    minWidth: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tileGrid: {
    gap: 8,
  },
});
