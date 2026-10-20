import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Animated,
  ActivityIndicator,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons';
import * as Haptics from 'expo-haptics';
import { useTheme, fontFamilies } from '../../theme';
import { Text, Button } from '../../components/primitives';
import { verifyCheckinCode } from '../../services/checkinService';
import { TickAnimationView } from '../../components/animations/TickAnimationView';

const CODE_LENGTH = 6;
const CONFETTI_COUNT = 24;

interface ConfettiParticle {
  id: number;
  color: string;
  startX: number;
  driftX: number;
  size: number;
}

export function CheckInScreen() {
  const { colors, borders, radii, spacing, iconTokens } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [doctorInfo, setDoctorInfo] = useState<{ room: string; doctor: string; department?: string }>({
    room: 'Room 204',
    doctor: 'Dr. P. V. Ramana Rao',
    department: 'General Medicine',
  });

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const tickScaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReducedMotion(enabled))
      .catch(() => {});
  }, []);

  // Trigger shake animation on wrong code
  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // Ignore haptic failure
      }
    }
  };

  // Trigger success animations (tick + 24 confetti particles)
  const triggerSuccess = (room: string, doctor: string, department?: string) => {
    setDoctorInfo({ room, doctor, department });
    setIsSuccess(true);

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Ignore haptic failure
      }
    }

    Animated.spring(tickScaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    if (!reducedMotion) {
      confettiAnim.setValue(0);
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start();
    }
  };

  // Submit and verify code strictly against backend API
  const handleVerify = async (code: string) => {
    if (isVerifying || isLocked) return;
    setIsVerifying(true);
    setErrorMessage(null);

    const result = await verifyCheckinCode(code);
    setIsVerifying(false);

    if (result.status === 'ok') {
      triggerSuccess(
        result.room || 'Room 204',
        result.doctorName || 'Dr. P. V. Ramana Rao',
        result.department || 'General Medicine'
      );
    } else if (result.status === 'expired') {
      triggerShake();
      setErrorMessage(result.message || 'This code expired. Ask the nurse for a new one.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } else if (result.status === 'locked') {
      triggerShake();
      setIsLocked(true);
      setErrorMessage(result.message || 'Too many tries. Ask the nurse for a new code.');
    } else if (result.status === 'error') {
      triggerShake();
      setErrorMessage(result.message || 'Unable to connect to hospital service.');
    } else {
      // Invalid code from server
      triggerShake();
      if (result.remainingTries === 0) {
        setIsLocked(true);
        setErrorMessage(result.message || 'Too many tries. Ask the nurse for a new code.');
      } else {
        setErrorMessage(result.message || "That code doesn't match.");
        setDigits(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    }
  };

  const handleDigitChange = (val: string, index: number) => {
    if (isLocked) return;

    // Handle paste of 6 digits
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const newDigits = Array(CODE_LENGTH).fill('');
      for (let i = 0; i < Math.min(cleaned.length, CODE_LENGTH); i++) {
        newDigits[i] = cleaned[i];
      }
      setDigits(newDigits);
      if (cleaned.length >= CODE_LENGTH) {
        handleVerify(cleaned.slice(0, CODE_LENGTH));
      } else {
        inputRefs.current[cleaned.length]?.focus();
      }
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const updated = [...digits];
    updated[index] = singleDigit;
    setDigits(updated);

    if (singleDigit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit on 6th digit
    if (index === CODE_LENGTH - 1 && singleDigit) {
      const fullCode = updated.join('');
      if (fullCode.length === CODE_LENGTH) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const updated = [...digits];
        updated[index - 1] = '';
        setDigits(updated);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Generate 24 static confetti specs
  const confettiParticles: ConfettiParticle[] = useRef(
    Array.from({ length: CONFETTI_COUNT }).map((_, i) => ({
      id: i,
      color: [colors.primary, colors.accent, colors.peachTint, colors.sageTint][i % 4],
      startX: ((i * 15) % 320) - 160,
      driftX: ((i * 23) % 80) - 40,
      size: (i % 3) * 3 + 6,
    }))
  ).current;

  // 1. Success Screen (Full Screen)
  if (isSuccess) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bg,
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
            paddingHorizontal: spacing.lg,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        {/* Confetti & tick animation (falls back to static solid tick on reduced motion / error) */}
        <TickAnimationView size={88} />

        <View style={[styles.successContent, { marginTop: spacing.lg, gap: spacing.xs }]}>
          <Text variant="headline" color="ink" weight="bold" style={{ textAlign: 'center' }}>
            You're all set.
          </Text>
          <Text variant="subhead" color="muted" style={{ textAlign: 'center' }}>
            {doctorInfo.department
              ? `Go to ${doctorInfo.room} for ${doctorInfo.department} with ${doctorInfo.doctor}.`
              : `Go to ${doctorInfo.room} to see ${doctorInfo.doctor}.`}
          </Text>
        </View>

        <View style={[styles.bottomButtonContainer, { marginTop: spacing.xl, width: '100%' }]}>
          <Button
            variant="primary"
            label="Done"
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      </View>
    );
  }

  // 2. Entry Screen
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      {/* Header: "Check-in", then one short line */}
      <View style={[styles.headerSection, { gap: 4, marginTop: spacing.md }]}>
        <Text variant="headline" color="ink" weight="bold">
          Check-in
        </Text>
        <Text variant="body" color="muted">
          Enter the code from the nurse.
        </Text>
      </View>

      {/* 6 Square Digit Boxes with shake animation on error */}
      <Animated.View
        style={[
          styles.digitsContainer,
          {
            marginTop: spacing.xl,
            gap: spacing.xs,
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        {digits.map((digit, index) => {
          const isFocused = focusedIndex === index;
          const hasError = Boolean(errorMessage);

          return (
            <TextInput
              key={`digit-${index}`}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.digitBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: hasError
                    ? colors.danger
                    : isFocused
                    ? colors.primary
                    : colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.sm,
                  color: hasError ? colors.danger : colors.ink,
                  fontFamily: fontFamilies.headingBold,
                },
              ]}
              value={digit}
              onChangeText={(val) => handleDigitChange(val, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              selectTextOnFocus
              editable={!isVerifying && !isLocked}
              autoFocus={index === 0}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              accessibilityLabel={`Digit ${index + 1} of 6`}
            />
          );
        })}
      </Animated.View>

      {/* InlineWait while checking */}
      {isVerifying ? (
        <View style={[styles.waitRow, { marginTop: spacing.md, gap: spacing.xs }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text variant="bodySmall" color="muted">
            Checking code...
          </Text>
        </View>
      ) : null}

      {/* Error Message */}
      {errorMessage ? (
        <View style={{ marginTop: spacing.md }}>
          <Text variant="bodySmall" color="danger" weight="semiBold" style={{ textAlign: 'center' }}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Under the boxes: "No code? Ask the nurse." */}
      <View style={[styles.helpSection, { marginTop: spacing.xl }]}>
        <Text variant="bodySmall" color="muted" style={{ textAlign: 'center' }}>
          No code? Ask the nurse.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    flexDirection: 'column',
  },
  digitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitBox: {
    width: 48,
    height: 54,
    minWidth: 48,
    minHeight: 48,
    fontSize: 22,
    textAlign: 'center',
  },
  waitRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpSection: {
    alignItems: 'center',
  },
  tickCircle: {
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
  },
  bottomButtonContainer: {
    maxWidth: 360,
  },
  confetti: {
    position: 'absolute',
  },
});
