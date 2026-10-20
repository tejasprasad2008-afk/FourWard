import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { ScreenHeader } from '../../components/primitives';
import { MaternalCareScreen } from '../../features/maternal/MaternalCareScreen';

export default function MaternalRoute() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScreenHeader />
      <MaternalCareScreen hasHeader={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
