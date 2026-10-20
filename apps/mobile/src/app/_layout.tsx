import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_600SemiBold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../theme';
import { colors } from '../theme/tokens';
import { getPatientProfile, PatientProfile } from '../features/onboarding/onboardingStorage';
import { OnboardingFlow } from '../features/onboarding/OnboardingFlow';

SplashScreen.preventAutoHideAsync();

function RootContent() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);

  useEffect(() => {
    getPatientProfile().then((p) => {
      setProfile(p);
      if (!p.hasCompletedOnboarding) {
        setIsOnboardingVisible(true);
      }
    });
  }, []);

  return (
    <>
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="features/triage" />
        <Stack.Screen name="features/records" />
        <Stack.Screen name="features/consent" />
        <Stack.Screen name="features/prescriptions" />
        <Stack.Screen name="features/cart" />
        <Stack.Screen name="features/diet" />
        <Stack.Screen name="features/maternal" />
        <Stack.Screen name="features/family" />
        <Stack.Screen name="dev/styleguide" />
        <Stack.Screen name="dev/stress" />
      </Stack>

      {isOnboardingVisible && (
        <OnboardingFlow
          initialLanguage={profile?.language || 'en'}
          onComplete={() => setIsOnboardingVisible(false)}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_600SemiBold,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ThemeProvider initialMode="normal">
        <RootContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
