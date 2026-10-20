import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon } from '../../components/icons';
import { useTheme } from '../../theme';

import { FEATURES } from '../../features/registry';

export default function TabLayout() {
  const { colors, borders, mode, minTouchTarget } = useTheme();
  const isElderly = mode === 'elderly';
  const iconSize = isElderly ? 26 : 22;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarAllowFontScaling: true,
        tabBarLabel: ({ color, children }) => (
          <Text
            maxFontSizeMultiplier={1.15}
            numberOfLines={1}
            style={{
              color,
              fontFamily: 'HankenGrotesk_600SemiBold',
              fontSize: isElderly ? 12 : 11,
              textAlign: 'center',
            }}
          >
            {children}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: borders.width,
          height: isElderly ? 70 : 58,
          paddingBottom: isElderly ? 10 : 6,
          paddingTop: 6,
          width: '100%',
        },
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          minHeight: minTouchTarget,
          paddingHorizontal: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Icon name="home" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: FEATURES.doctors.name,
          tabBarIcon: ({ color }) => (
            <Icon name="doctors" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: FEATURES.records.name,
          tabBarIcon: ({ color }) => (
            <Icon name="records" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="medicines"
        options={{
          title: FEATURES.medicines.name,
          tabBarIcon: ({ color }) => (
            <Icon name="medicines" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => (
            <Icon name="account" size={iconSize} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
