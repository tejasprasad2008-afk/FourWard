import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Icon } from '../icons';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../../theme';
import { fontFamilies } from '../../theme/tokens';
import { Sheet } from '../primitives/Sheet';
import { Text } from '../primitives/Text';
import { Button } from '../primitives/Button';
import { Tag } from '../primitives/Tag';
import {
  sendAssistantMessage,
  executeAssistantAction,
  AssistantProposal,
} from '../../services/assistantService';
import { fetchManagedPersons } from '../../services/familyService';
import { getPatientProfile } from '../../features/onboarding/onboardingStorage';
import { getDoctorsByDepartment } from '../../services/doctorsData';
import { fetchDoctorSlots } from '../../services/triageService';

const QUICK_PROMPTS = [
  'Book a cardiologist',
  'Log a meal',
  'Refill medicines',
];

export interface InteractiveChip {
  id: string;
  label: string;
  onPress: () => void;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isEmergency?: boolean;
  actionSummary?: string;
  receipt?: string;
  chips?: InteractiveChip[];
}

export function AssistantFloatingButton() {
  const { colors, borders, radii, spacing, typography, iconTokens } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProposal, setActiveProposal] = useState<AssistantProposal | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'assistant',
      text: 'I can operate FourWard for you. Actions require your explicit confirmation before anything happens.',
    },
  ]);

  const inputRef = useRef<TextInput>(null);

  // Flow 1: Book a cardiologist (Dynamic from Family, Doctors, and Slots stores)
  const startCardiologistFlow = async () => {
    setActiveProposal(null);
    try {
      const [persons, profile] = await Promise.all([
        fetchManagedPersons(),
        getPatientProfile(),
      ]);

      const selfName = profile?.name || 'Self';
      const patientChips: InteractiveChip[] = [
        {
          id: 'chip_self',
          label: `${selfName} (Self)`,
          onPress: () => handleCardioPatientSelected(selfName, 'patient_std_01'),
        },
      ];

      if (persons && persons.length > 0) {
        persons
          .filter((p) => p.status !== 'revoked')
          .forEach((p) => {
            patientChips.push({
              id: `chip_${p.id}`,
              label: p.relation ? `${p.name} (${p.relation})` : p.name,
              onPress: () => handleCardioPatientSelected(p.name, p.id),
            });
          });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: 'Who is this consultation for?',
          chips: patientChips,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: 'Who is this consultation for?',
          chips: [
            {
              id: 'chip_self',
              label: 'Self',
              onPress: () => handleCardioPatientSelected('Self', 'self'),
            },
          ],
        },
      ]);
    }
  };

  const handleCardioPatientSelected = async (patientName: string, patientId: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: patientName,
      },
      {
        id: `asst_loading_${Date.now()}`,
        sender: 'assistant',
        text: 'Checking available slots with cardiologists...',
      },
    ]);

    try {
      const cardioDoctors = getDoctorsByDepartment('Cardiology');
      const todayStr = new Date().toISOString().split('T')[0];
      const slotChips: InteractiveChip[] = [];

      for (const doc of cardioDoctors) {
        const slotsResponse = await fetchDoctorSlots(doc.id, todayStr);
        // Skip full slots (only available slots)
        const availableSlots = (slotsResponse?.slots || []).filter((s) => s.isAvailable);

        if (availableSlots.length > 0) {
          availableSlots.slice(0, 2).forEach((slot) => {
            slotChips.push({
              id: `chip_${doc.id}_${slot.id}`,
              label: `${doc.name} · ${slot.time}`,
              onPress: () =>
                handleCardioDoctorSelected(
                  patientName,
                  patientId,
                  doc.name,
                  doc.id,
                  doc.hospitalName,
                  doc.department,
                  doc.room || 'Consult Desk',
                  'Today',
                  slot.time,
                  slot.id
                ),
            });
          });
        }
      }

      setMessages((prev) => {
        const cleaned = prev.filter((m) => !m.id.startsWith('asst_loading_'));
        return [
          ...cleaned,
          {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: slotChips.length > 0
              ? 'Choose cardiologist & preferred slot:'
              : 'No open slots found today. Choose a doctor to request a slot:',
            chips: slotChips.length > 0
              ? slotChips
              : cardioDoctors.map((doc) => ({
                  id: `chip_req_${doc.id}`,
                  label: `${doc.name} · Request slot`,
                  onPress: () =>
                    handleCardioDoctorSelected(
                      patientName,
                      patientId,
                      doc.name,
                      doc.id,
                      doc.hospitalName,
                      doc.department,
                      doc.room || 'Consult Desk',
                      'Today',
                      'Next available',
                      `${doc.id}_req`
                    ),
                })),
          },
        ];
      });
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => !m.id.startsWith('asst_loading_')),
        {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to load slots. Please visit Doctors tab directly.',
        },
      ]);
    }
  };

  const handleCardioDoctorSelected = (
    patientName: string,
    patientId: string,
    doctorName: string,
    doctorId: string,
    hospitalName: string,
    department: string,
    room: string,
    date: string,
    time: string,
    slotId: string
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: `${doctorName} · ${date} ${time}`,
      },
      {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: `I prepared an appointment proposal for ${doctorName}. Tap Accept to confirm.`,
      },
    ]);
    setActiveProposal({
      id: `prop_cardio_${Date.now()}`,
      toolName: 'book_appointment',
      title: `Cardiology consultation: ${doctorName}`,
      summary: `${date} ${time} · ${room} at ${hospitalName} · For ${patientName}`,
      args: {
        doctorId,
        doctorName,
        hospitalName,
        department,
        room,
        patientName,
        patientId,
        date,
        time,
        slotId,
      },
      targetRoute: '/(tabs)/doctors',
    });
  };

  // Flow 2: Log a meal (Multi-step interactive chips)
  const startMealFlow = () => {
    setActiveProposal(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: 'Which meal would you like to log?',
        chips: [
          {
            id: 'chip_m_b',
            label: 'Breakfast (340 kcal)',
            onPress: () => handleMealSelected('Breakfast', 340),
          },
          {
            id: 'chip_m_l',
            label: 'Lunch (520 kcal)',
            onPress: () => handleMealSelected('Lunch', 520),
          },
          {
            id: 'chip_m_d',
            label: 'Dinner (470 kcal)',
            onPress: () => handleMealSelected('Dinner', 470),
          },
        ],
      },
    ]);
  };

  const handleMealSelected = (mealName: string, calories: number) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: `${mealName} (${calories} kcal)`,
      },
      {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: `Ready to record ${mealName} (${calories} kcal). Tap Accept to log.`,
      },
    ]);
    setActiveProposal({
      id: `prop_meal_${Date.now()}`,
      toolName: 'log_meal',
      title: `Log ${mealName} (${calories} kcal)`,
      summary: `Add ${calories} kcal to your daily nutrition plan`,
      args: { calories, mealName },
      targetRoute: '/features/diet',
    });
  };

  // Flow 3: Refill medicines (Multi-step interactive chips)
  const startRefillFlow = () => {
    setActiveProposal(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: 'Choose prescription to refill:',
        chips: [
          {
            id: 'chip_r_met',
            label: 'Metformin 500mg · ₹68',
            onPress: () => handleRefillSelected('med-2', 'Metformin 500mg (10 Tablets)', 68),
          },
          {
            id: 'chip_r_tel',
            label: 'Telmisartan 40mg · ₹142',
            onPress: () => handleRefillSelected('med-1', 'Telmisartan 40mg (10 Tablets)', 142),
          },
        ],
      },
    ]);
  };

  const handleRefillSelected = (medicineId: string, name: string, price: number) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: `${name} (₹${price})`,
      },
      {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: `Ready to add ${name} to refill cart. Tap Accept to proceed.`,
      },
    ]);
    setActiveProposal({
      id: `prop_refill_${Date.now()}`,
      toolName: 'add_to_cart',
      title: `Add ${name} to Cart`,
      summary: `1 strip (10 tablets • ₹${price}) from City Care Pharmacy`,
      args: { medicineId, name, price },
      targetRoute: '/features/cart',
    });
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMsgId = `msg_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setActiveProposal(null);
    setIsEmergencyActive(false);

    const lower = textToSend.toLowerCase();

    // Check deterministic flows first
    if (
      lower.includes('cardiologist') ||
      (lower.includes('cardio') && (lower.includes('book') || lower.includes('appointment') || lower.includes('doctor')))
    ) {
      setIsLoading(false);
      startCardiologistFlow();
      return;
    }

    if (
      lower.includes('520') ||
      (lower.includes('lunch') && (lower.includes('log') || lower.includes('ate')))
    ) {
      setIsLoading(false);
      handleMealSelected('Lunch', 520);
      return;
    }

    if (lower === 'log a meal' || lower === 'log meal') {
      setIsLoading(false);
      startMealFlow();
      return;
    }

    if (lower === 'refill medicines' || lower.includes('refill') || lower.includes('order medicine')) {
      setIsLoading(false);
      startRefillFlow();
      return;
    }

    try {
      const response = await sendAssistantMessage(textToSend, pathname);

      if (response.isEmergency) {
        setIsEmergencyActive(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: response.reply,
            isEmergency: true,
          },
        ]);
      } else if (response.proposal) {
        setActiveProposal(response.proposal);
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: response.reply,
          },
        ]);
      } else if (response.immediateAction) {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: response.reply,
            actionSummary: response.immediateAction!.summary,
          },
        ]);
        setTimeout(() => {
          setIsOpen(false);
          router.push(response.immediateAction!.route as any);
        }, 600);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: response.reply,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: 'Service unavailable. Please retry your request.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setTimeout(() => {
      setInputText('Book a cardiologist');
      setIsListening(false);
      inputRef.current?.focus();
    }, 1200);
  };

  const handleAcceptProposal = async () => {
    if (!activeProposal) return;
    const proposal = activeProposal;
    setActiveProposal(null);

    const actionResult = await executeAssistantAction(proposal.toolName, proposal.args);

    if (proposal.toolName === 'add_to_cart') {
      setTimeout(() => {
        setIsOpen(false);
        router.push('/features/cart');
      }, 700);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: 'Action completed.',
        receipt: actionResult.receipt,
      },
    ]);
  };

  const handleDismissProposal = () => {
    setActiveProposal(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: 'Cancelled. Nothing was changed.',
      },
    ]);
  };

  const handleChangeProposal = () => {
    if (activeProposal) {
      setInputText(`Change: ${activeProposal.title}`);
    }
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Floating circular assistant button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open FourWard voice and chat assistant"
        onPress={() => setIsOpen(true)}
        style={[
          styles.floatingButton,
          {
            backgroundColor: colors.accent,
            borderColor: colors.border,
            borderWidth: borders.width,
            borderRadius: 28, // assistant-circle-exception
          },
        ]}
      >
        <Icon
          name="mic"
          size={26}
          tone="surface"
        />
      </Pressable>

      {/* Interactive Assistant Sheet */}
      <Sheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title="FourWard Assistant"
        footer={
          <Button
            variant="text"
            label="Close assistant"
            fullWidth
            onPress={() => setIsOpen(false)}
          />
        }
      >
        <View style={{ gap: spacing.sm, maxHeight: 480 }}>
          {/* Quick Prompts Horizontal Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.xs, paddingBottom: 4 }}
          >
            {QUICK_PROMPTS.map((prompt) => (
              <Pressable
                key={prompt}
                accessibilityRole="button"
                accessibilityLabel={prompt}
                onPress={() => handleSend(prompt)}
                style={[
                  styles.quickPromptChip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.sm,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                  },
                ]}
              >
                <Text variant="caption" color="primary" weight="semiBold">
                  {prompt}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Conversation Transcript Area */}
          <ScrollView
            style={styles.chatScroll}
            contentContainerStyle={{ gap: spacing.xs, paddingVertical: 4 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.bubbleContainer,
                  m.sender === 'user' ? styles.userBubbleAlign : styles.asstBubbleAlign,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    {
                      backgroundColor: m.sender === 'user' ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      borderWidth: borders.width,
                      borderRadius: radii.md,
                      padding: spacing.sm,
                    },
                  ]}
                >
                  <Text
                    variant="bodySmall"
                    color={m.sender === 'user' ? 'surface' : 'ink'}
                    weight={m.sender === 'user' ? 'semiBold' : 'regular'}
                  >
                    {m.text}
                  </Text>

                  {/* Interactive Selection Chips */}
                  {m.chips && m.chips.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {m.chips.map((chip) => (
                        <Pressable
                          key={chip.id}
                          accessibilityRole="button"
                          accessibilityLabel={chip.label}
                          onPress={chip.onPress}
                          style={[
                            styles.interactiveChip,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.primary,
                              borderWidth: borders.width,
                              borderRadius: radii.sm,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: 6,
                              minHeight: 36,
                              justifyContent: 'center',
                            },
                          ]}
                        >
                          <Text variant="caption" color="primary" weight="bold">
                            {chip.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {m.actionSummary && (
                    <View style={{ marginTop: 4 }}>
                      <Tag label={m.actionSummary} variant="primary" />
                    </View>
                  )}

                  {m.receipt && (
                    <View
                      style={[
                        styles.receiptCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          borderWidth: borders.width,
                          borderRadius: radii.sm,
                          padding: spacing.xs,
                          marginTop: 6,
                        },
                      ]}
                    >
                      <Text variant="caption" color="primary" weight="bold">
                        {m.receipt}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* Emergency Alert Card */}
            {isEmergencyActive && (
              <View
                style={[
                  styles.emergencyCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.danger,
                    borderWidth: 2,
                    borderRadius: radii.md,
                    padding: spacing.md,
                    gap: spacing.xs,
                  },
                ]}
              >
                <View style={styles.emergencyHeader}>
                  <Icon name="warning" size={18} tone="danger" />
                  <Text variant="subhead" color="danger" weight="bold">
                    Emergency alert
                  </Text>
                </View>
                <Text variant="bodySmall" color="ink">
                  Immediate emergency assistance required. Do not wait for an app consultation.
                </Text>
                <Button
                  variant="danger"
                  label="Call 108 now"
                  fullWidth
                  onPress={() => Linking.openURL('tel:108')}
                />
              </View>
            )}

            {/* Structured Proposal Card (AGENTS.md Accept/Dismiss Flow) */}
            {activeProposal && (
              <View
                style={[
                  styles.proposalCard,
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
                <Text variant="caption" color="primary" weight="bold">
                  Proposed action (confirmation needed)
                </Text>
                <Text variant="subhead" color="ink" weight="bold">
                  {activeProposal.title}
                </Text>
                <Text variant="bodySmall" color="ink">
                  {activeProposal.summary}
                </Text>

                {/* Accept / Dismiss Buttons */}
                <View style={[styles.proposalActionRow, { gap: spacing.xs, marginTop: spacing.xs }]}>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="primary"
                      label="Accept"
                      fullWidth
                      onPress={handleAcceptProposal}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="secondary"
                      label="Dismiss"
                      fullWidth
                      onPress={handleDismissProposal}
                    />
                  </View>
                </View>

                {/* Refine / Change Request Button */}
                <Button
                  variant="text"
                  label="Change request"
                  fullWidth
                  onPress={handleChangeProposal}
                />
              </View>
            )}
          </ScrollView>

          {/* Voice & Text Input Box */}
          <View
            style={[
              styles.inputContainer,
              {
                borderColor: colors.border,
                borderWidth: borders.width,
                borderRadius: radii.md,
                backgroundColor: colors.surface,
                paddingHorizontal: spacing.sm,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput,
                {
                  fontFamily: fontFamilies.bodyRegular,
                  color: colors.ink,
                  fontSize: 14,
                },
              ]}
              placeholder="Ask assistant or choose above..."
              placeholderTextColor={colors.muted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isListening ? 'Stop listening' : 'Start speaking'}
              onPress={handleMicToggle}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isListening ? colors.accent : colors.surface,
                  borderColor: isListening ? colors.accent : colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.sm,
                },
              ]}
            >
              <Icon
                name={isListening ? 'micOff' : 'mic'}
                size={18}
                tone={isListening ? 'surface' : 'ink'}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              onPress={() => handleSend()}
              disabled={isLoading || !inputText.trim()}
              style={[
                styles.iconButton,
                {
                  backgroundColor: inputText.trim() ? colors.primary : colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.sm,
                  opacity: inputText.trim() ? 1 : 0.4,
                },
              ]}
            >
              <Icon
                name="send"
                size={16}
                tone={inputText.trim() ? 'surface' : 'muted'}
              />
            </Pressable>
          </View>
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 84, // Sits cleanly above tab bar
    right: 20,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  quickPromptChip: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  interactiveChip: {
    alignSelf: 'flex-start',
  },
  chatScroll: {
    maxHeight: 280,
  },
  bubbleContainer: {
    width: '100%',
    flexDirection: 'row',
  },
  userBubbleAlign: {
    justifyContent: 'flex-end',
  },
  asstBubbleAlign: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    flexDirection: 'column',
  },
  receiptCard: {
    width: '100%',
  },
  emergencyCard: {
    flexDirection: 'column',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proposalCard: {
    flexDirection: 'column',
  },
  proposalActionRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
  },
  iconButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
