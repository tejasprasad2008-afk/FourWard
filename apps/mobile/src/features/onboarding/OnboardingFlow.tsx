import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { LanguageSelectStep } from './LanguageSelectStep';
import { QuestionnaireStep } from './QuestionnaireStep';
import {
  savePatientProfile,
  SupportedLanguage,
  PatientProfile,
} from './onboardingStorage';
import { syncDietProfileFromOnboarding } from '../../services/dietService';

export interface OnboardingFlowProps {
  onComplete: () => void;
  initialLanguage?: SupportedLanguage;
}

export function OnboardingFlow({
  onComplete,
  initialLanguage = 'en',
}: OnboardingFlowProps) {
  const { colors, setMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState<'language' | 'questionnaire'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Fade transition animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    setCurrentStep('questionnaire');
  };

  const handleQuestionnaireComplete = async (profile: PatientProfile) => {
    // 1. Save patient profile to persistent storage
    await savePatientProfile(profile);

    // 2. Automatically sync dietary settings & restrictions
    await syncDietProfileFromOnboarding(profile.language, profile.setting, profile.conditions);

    // 3. Set Elderly mode if 60+ Senior selected
    if (profile.ageGroup === '60_plus') {
      setMode('elderly');
    } else {
      setMode('normal');
    }

    // 4. Smooth Fade-Out (400ms, honoring reduced-motion)
    if (reduceMotion) {
      onComplete();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top,
          opacity: fadeAnim,
        },
      ]}
    >
      {currentStep === 'language' ? (
        <LanguageSelectStep
          selectedLanguage={selectedLanguage}
          onSelectLanguage={handleSelectLanguage}
        />
      ) : (
        <QuestionnaireStep
          language={selectedLanguage}
          onChangeLanguage={() => setCurrentStep('language')}
          onComplete={handleQuestionnaireComplete}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
  },
});
