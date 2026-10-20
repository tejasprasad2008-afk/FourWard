import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { ScreenHeader } from '../../components/primitives';
import { FamilyAccessScreen } from '../../features/family/FamilyAccessScreen';

export default function FamilyRoute() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScreenHeader />
      <FamilyAccessScreen hasHeader={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
