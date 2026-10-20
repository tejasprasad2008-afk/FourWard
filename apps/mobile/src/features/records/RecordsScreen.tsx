import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { fontFamilies } from '../../theme/tokens';
import { Text, SearchBar, Button, Tag, Sheet, KeyValueRow, TitleMetaRow } from '../../components/primitives';
import { Icon } from '../../components/icons';
import { FeatureErrorBoundary } from '../common/ErrorBoundary';
import { FEATURES } from '../registry';
import {
  fetchRecords,
  fetchRecordsForPatient,
  uploadReport,
  toggleChecklistItem as toggleChecklistService,
  syncChecklistWithBookings,
  DEFAULT_DOCUMENTS,
  DEFAULT_FOLDERS,
  DEFAULT_CHECKLIST,
} from '../../services/recordsService';
import { getActivePerson, onActivePersonChange } from '../../services/familyService';
import type {
  RecordFolder,
  MedicalDocument,
  VisitChecklistItem,
} from '../../../../../packages/contracts/src/records';

const PRESET_REPORT_TITLES = [
  'Blood Sugar Fasting',
  'Lipid Profile',
  'Chest X-Ray',
  'Resting ECG',
];

const PROBLEM_FOLDERS = [
  'Cardiology',
  'General & Lab',
  'Imaging & Scans',
  'Discharge & Summary',
];

interface RecordsScreenProps {
  hasHeader?: boolean;
}

export function RecordsScreen({ hasHeader = false }: RecordsScreenProps) {
  const { colors, spacing, radii, borders, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<RecordFolder[]>(DEFAULT_FOLDERS);
  const [documents, setDocuments] = useState<MedicalDocument[]>(DEFAULT_DOCUMENTS);
  const [checklist, setChecklist] = useState<VisitChecklistItem[]>(DEFAULT_CHECKLIST);
  const [isChecklistCollapsed, setIsChecklistCollapsed] = useState(false);

  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Document details sheet
  const [inspectedDoc, setInspectedDoc] = useState<MedicalDocument | null>(null);

  // Add report sheet
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFolder, setNewFolder] = useState('General & Lab');
  const [newNeedsPaper, setNewNeedsPaper] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getActivePerson().then((person) => {
      fetchRecordsForPatient(person.id)
        .then((data) => {
          if (active) {
            setFolders(data.folders);
            setDocuments(data.documents);
            setChecklist(data.visitChecklist);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    });

    const unsub = onActivePersonChange((person) => {
      fetchRecordsForPatient(person.id).then((data) => {
        setFolders(data.folders);
        setDocuments(data.documents);
        setChecklist(data.visitChecklist);
      });
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const handleToggleChecklist = async (itemId: string) => {
    const nextChecklist = await toggleChecklistService(itemId);
    setChecklist(nextChecklist);
  };

  const handleSaveReport = async () => {
    if (!newTitle.trim()) return;
    setIsSaving(true);
    try {
      const activePerson = await getActivePerson();
      const result = await uploadReport({
        patientId: activePerson.id,
        title: newTitle.trim(),
        problemFolder: newFolder,
        hospitalName: 'City Care Hospital',
        summary: 'Patient uploaded report for upcoming hospital visit.',
        summaryMetrics: 'Uploaded • Verified',
        requiresHardCopy: newNeedsPaper,
      });
      setDocuments(result.allDocuments);
      setNewTitle('');
      setNewNeedsPaper(false);
      setIsAddSheetOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    let list = documents;

    if (selectedFolder !== 'All') {
      list = list.filter(
        (d) => d.problemFolder.toLowerCase() === selectedFolder.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.hospitalName.toLowerCase().includes(q) ||
          d.problemFolder.toLowerCase().includes(q) ||
          d.summaryMetrics.toLowerCase().includes(q)
      );
    }

    return list;
  }, [documents, selectedFolder, searchQuery]);

  const topPadding = hasHeader ? spacing.sm : Math.max(insets.top, 16) + spacing.xs;

  // Folder chips list
  const folderTabs = useMemo(() => {
    const allCount = documents.length;
    const tabs = [{ name: 'All', count: allCount }];
    for (const f of folders) {
      const count = documents.filter((d) => d.problemFolder === f.name).length;
      tabs.push({ name: f.name, count });
    }
    return tabs;
  }, [folders, documents]);

  const renderChecklistCard = () => (
    <View
      style={[
        styles.checklistCard,
        {
          backgroundColor: colors.peachTint,
          borderColor: colors.border,
          borderWidth: borders.width,
          borderRadius: radii.lg,
          padding: spacing.md,
          gap: spacing.xs,
          marginTop: selectedFolder !== 'All' ? spacing.sm : 0,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Toggle carry for your visit checklist"
        onPress={() => setIsChecklistCollapsed((prev) => !prev)}
        style={styles.checklistHeader}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 }}>
          <Text variant="subhead" color="ink" weight="bold">
            Carry for your visit
          </Text>
          <Icon
            name="dropdown"
            size={16}
            tone="muted"
            style={{ transform: [{ rotate: isChecklistCollapsed ? '-90deg' : '0deg' }] }}
          />
        </View>
        <Text variant="caption" color="muted">
          {isChecklistCollapsed
            ? `${checklist.filter((i) => i.checked).length}/${checklist.length} ready`
            : 'Tap to check off'}
        </Text>
      </Pressable>

      {!isChecklistCollapsed &&
        checklist.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => handleToggleChecklist(item.id)}
            style={[
              styles.checklistItemRow,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: borders.width,
                borderRadius: radii.md,
                padding: spacing.sm,
                gap: spacing.sm,
              },
            ]}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: item.checked ? colors.primary : colors.border,
                  backgroundColor: item.checked ? colors.primary : colors.surface,
                  borderWidth: borders.width,
                  borderRadius: radii.sm, // strictly 6px square
                },
              ]}
            >
              {item.checked && <Icon name="check" size={16} tone="surface" />}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                variant="body"
                color={item.checked ? 'muted' : 'ink'}
                style={item.checked ? styles.strikethrough : undefined}
              >
                {item.label}
              </Text>
            </View>
            {item.requiresPaper && (
              <Tag label="Paper copy needed" variant="danger" />
            )}
          </Pressable>
        ))}
    </View>
  );

  return (
    <FeatureErrorBoundary fallbackTitle="Records Unavailable">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <FlatList
          data={filteredDocuments}
          extraData={selectedFolder}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={selectedFolder !== 'All' ? renderChecklistCard : undefined}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: spacing.md,
              paddingTop: topPadding,
              paddingBottom: 120, // Clean clearance for Assistant button
              gap: spacing.sm,
            },
          ]}
          ListHeaderComponent={
            <View style={[styles.headerContainer, { gap: spacing.md }]}>
              {/* Screen Title */}
              <View style={styles.titleSection}>
                <View style={styles.titleRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="headline" color="ink" weight="bold">
                      {FEATURES.records.name}
                    </Text>
                    <Text variant="body" color="muted">
                      All medical reports and visit checklist.
                    </Text>
                  </View>
                  <Button
                    variant="primary"
                    label="Add report"
                    onPress={() => setIsAddSheetOpen(true)}
                  />
                </View>
              </View>

              {/* Problem Folder Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.folderChipsContainer, { gap: spacing.xs }]}
              >
                {folderTabs.map((tab) => {
                  const isSelected = selectedFolder.toLowerCase() === tab.name.toLowerCase();
                  return (
                    <Pressable
                      key={tab.name}
                      onPress={() => setSelectedFolder(tab.name)}
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
                        {`${tab.name} (${tab.count})`}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Search Inside Records */}
              <SearchBar
                placeholder="Search reports or hospital name"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {/* What to Carry: In Header only when "All" tab is active */}
              {selectedFolder === 'All' && renderChecklistCard()}

              {/* Section Subheading */}
              <View style={styles.sectionHeaderRow}>
                <Text variant="subhead" color="ink" weight="bold">
                  {selectedFolder === 'All' ? 'Recent reports' : selectedFolder}
                </Text>
                <Text variant="caption" color="muted">
                  {`${filteredDocuments.length} documents`}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setInspectedDoc(item)}
              style={({ pressed }) => [
                styles.documentRow,
                {
                  backgroundColor: pressed ? colors.primaryTint : colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  gap: spacing.xs,
                },
              ]}
            >
              <TitleMetaRow
                title={item.title}
                meta={<Icon name="next" size={18} tone="muted" />}
              />
              <Text variant="bodySmall" color="muted">
                {`${item.hospitalName} · ${item.date}`}
              </Text>

              <View style={styles.docFooterRow}>
                <Tag
                  label={item.isLatest ? 'Latest' : 'Previous version'}
                  variant={item.isLatest ? 'primary' : 'default'}
                />
                <Text variant="caption" color="muted" weight="semiBold">
                  {item.summaryMetrics}
                </Text>
                {item.requiresHardCopy && (
                  <Tag label="Paper copy" variant="clay" />
                )}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  gap: spacing.xs,
                },
              ]}
            >
              <Icon name="document" size={24} tone="muted" />
              <Text variant="subhead" color="ink" weight="bold">
                No reports found
              </Text>
              <Text variant="body" color="muted">
                {searchQuery
                  ? 'No documents matched your search filter.'
                  : 'No records in this folder yet. Tap Add report above.'}
              </Text>
            </View>
          }
        />

        {/* Document Inspection Sheet */}
        {inspectedDoc && (
          <Sheet
            visible={Boolean(inspectedDoc)}
            onClose={() => setInspectedDoc(null)}
            title={inspectedDoc.title}
            footer={
              <Button
                variant="primary"
                label="Close"
                fullWidth
                onPress={() => setInspectedDoc(null)}
              />
            }
          >
            <View style={{ gap: spacing.sm }}>
              <View style={styles.sheetMetaRow}>
                <Text variant="bodySmall" color="muted">
                  {`${inspectedDoc.hospitalName} · ${inspectedDoc.date}`}
                </Text>
                {inspectedDoc.requiresHardCopy && (
                  <Tag label="Paper copy needed" variant="danger" />
                )}
              </View>

              <View
                style={[
                  styles.metricHighlightCard,
                  {
                    backgroundColor: colors.sageTint,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.md,
                    padding: spacing.sm,
                  },
                ]}
              >
                <Text variant="caption" color="primary" weight="bold">
                  Clinical summary
                </Text>
                <Text variant="subhead" color="ink" weight="bold">
                  {inspectedDoc.summaryMetrics}
                </Text>
                {inspectedDoc.summary && (
                  <Text variant="body" color="ink" style={{ marginTop: 4 }}>
                    {inspectedDoc.summary}
                  </Text>
                )}
              </View>

              {/* Key Findings */}
              {inspectedDoc.keyFindings && (
                <View
                  style={[
                    styles.findingsTable,
                    {
                      borderColor: colors.border,
                      borderWidth: borders.width,
                      borderRadius: radii.md,
                      padding: spacing.sm,
                      backgroundColor: colors.surface,
                      gap: spacing.xs,
                    },
                  ]}
                >
                  {Object.entries(inspectedDoc.keyFindings).map(([key, val]) => (
                    <KeyValueRow key={key} label={key} value={val} />
                  ))}
                </View>
              )}
            </View>
          </Sheet>
        )}

        {/* Add Report Sheet */}
        <Sheet
          visible={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          title="Add medical report"
          footer={
            <Button
              variant="primary"
              label={isSaving ? 'Saving...' : 'Save report'}
              disabled={isSaving || !newTitle.trim()}
              fullWidth
              onPress={handleSaveReport}
            />
          }
        >
          <View style={{ gap: spacing.md }}>
            {/* Quick Presets */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                QUICK REPORT PRESETS
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                {PRESET_REPORT_TITLES.map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => setNewTitle(preset)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: newTitle === preset ? colors.primaryTint : colors.surface,
                        borderColor: newTitle === preset ? colors.primary : colors.border,
                        borderWidth: borders.width,
                        borderRadius: radii.sm,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      color={newTitle === preset ? 'primary' : 'ink'}
                      weight={newTitle === preset ? 'bold' : 'regular'}
                    >
                      {preset}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Custom Title Input */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                REPORT TITLE
              </Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. 2D Echo or Fasting Blood Sugar"
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
                  },
                ]}
              />
            </View>

            {/* Folder Selection */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                PROBLEM FOLDER
              </Text>
              <View style={styles.folderSelectionGrid}>
                {PROBLEM_FOLDERS.map((folder) => {
                  const isPicked = newFolder === folder;
                  return (
                    <Pressable
                      key={folder}
                      onPress={() => setNewFolder(folder)}
                      style={[
                        styles.folderSelectionChip,
                        {
                          backgroundColor: isPicked ? colors.primary : colors.surface,
                          borderColor: isPicked ? colors.primary : colors.border,
                          borderWidth: borders.width,
                          borderRadius: radii.md,
                          padding: spacing.sm,
                        },
                      ]}
                    >
                      <Text
                        variant="bodySmall"
                        color={isPicked ? 'surface' : 'ink'}
                        weight={isPicked ? 'bold' : 'regular'}
                      >
                        {folder}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Hard copy checkable toggle */}
            <Pressable
              onPress={() => setNewNeedsPaper(!newNeedsPaper)}
              style={[
                styles.paperToggleRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.md,
                  padding: spacing.sm,
                  gap: spacing.sm,
                },
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: newNeedsPaper ? colors.primary : colors.border,
                    backgroundColor: newNeedsPaper ? colors.primary : colors.surface,
                    borderWidth: borders.width,
                    borderRadius: radii.sm,
                  },
                ]}
              >
                {newNeedsPaper && <Icon name="check" size={16} tone="surface" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" color="ink">
                  Doctor needs printed paper copy
                </Text>
                <Text variant="caption" color="muted">
                  Adds to your hospital visit checklist
                </Text>
              </View>
            </Pressable>
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
    flexDirection: 'column',
    marginBottom: 8,
  },
  titleSection: {
    flexDirection: 'column',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  folderChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipPressable: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistCard: {
    flexDirection: 'column',
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  documentRow: {
    flexDirection: 'column',
    minHeight: 48,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  sheetMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricHighlightCard: {
    flexDirection: 'column',
    gap: 2,
  },
  findingsTable: {
    flexDirection: 'column',
  },
  findingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetChip: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 48,
  },
  folderSelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  folderSelectionChip: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paperToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
});
