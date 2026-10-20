import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../icons';
import * as Location from 'expo-location';
import { useTheme, fontFamilies } from '../../theme';
import { Text, Button } from '../primitives';
import {
  saveDeviceLocation,
  getDeviceLocation,
  UserLocation,
} from '../../services/locationStorage';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmLocation: (loc: UserLocation) => void;
}

const POPULAR_LOCALITIES = [
  'Gachibowli, Hyderabad',
  'Hitec City, Hyderabad',
  'Madhapur, Hyderabad',
  'Banjara Hills, Hyderabad',
  'Jubilee Hills, Hyderabad',
  'Kondapur, Hyderabad',
];

export function LocationPickerModal({
  visible,
  onClose,
  onConfirmLocation,
}: LocationPickerModalProps) {
  const { colors, borders, radii, spacing, iconTokens, minTouchTarget } = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocality, setSelectedLocality] = useState<string>(
    getDeviceLocation().locality
  );
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }>({
    latitude: getDeviceLocation().latitude,
    longitude: getDeviceLocation().longitude,
  });
  const [isResolving, setIsResolving] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);

  // Lazy loaded MapView component
  const [NativeMapComponent, setNativeMapComponent] = useState<any>(null);
  const mapRef = useRef<any>(null);

  // Lazy load react-native-maps on native platforms only when modal is opened
  useEffect(() => {
    if (visible && Platform.OS !== 'web' && !NativeMapComponent) {
      try {
        const Maps = require('react-native-maps');
        setNativeMapComponent(() => Maps.default || Maps);
      } catch (err) {
        console.warn('react-native-maps lazy load fallback:', err);
      }
    }
  }, [visible, NativeMapComponent]);

  // Reverse geocode when coordinates change
  const resolveAddress = async (lat: number, lng: number) => {
    setIsResolving(true);
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results && results.length > 0) {
        const r = results[0];
        const locality = r.district || r.subregion || r.city || r.name || 'Hyderabad';
        const city = r.city || 'Hyderabad';
        setSelectedLocality(`${locality}, ${city}`);
      }
    } catch {
      // Keep existing locality
    } finally {
      setIsResolving(false);
    }
  };

  // Search forward geocode
  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    setIsResolving(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        setCoordinates({ latitude, longitude });
        setSelectedLocality(searchQuery.trim());
        mapRef.current?.animateToRegion?.({
          latitude,
          longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        });
      }
    } catch {
      // Fallback
    } finally {
      setIsResolving(false);
    }
  };

  // "Use my current location" button
  const handleUseCurrentLocation = async () => {
    setPermissionMessage('Allow FourWard to access your location to find nearby hospitals.');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionMessage(null);
      if (status !== 'granted') {
        return;
      }
      setIsResolving(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setCoordinates({ latitude: lat, longitude: lng });
      mapRef.current?.animateToRegion?.({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      });
      await resolveAddress(lat, lng);
    } catch {
      setPermissionMessage(null);
    } finally {
      setIsResolving(false);
    }
  };

  const handleConfirm = () => {
    const saved = saveDeviceLocation({
      locality: selectedLocality,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });
    onConfirmLocation(saved);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bg,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Top Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.md, paddingBottom: spacing.xs }]}>
          <Text variant="title" color="ink" weight="bold">
            Select location
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close location picker"
            onPress={onClose}
            style={[styles.closeButton, { minWidth: minTouchTarget, minHeight: minTouchTarget }]}
          >
            <Icon name="close" size={22} tone="ink" />
          </Pressable>
        </View>

        {/* Search Field */}
        <View style={[styles.searchContainer, { paddingHorizontal: spacing.md }]}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: borders.width,
                borderRadius: radii.md,
              },
            ]}
          >
            <Icon name="search" size={16} tone="muted" />
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: colors.ink,
                  fontFamily: fontFamilies.bodyRegular,
                },
              ]}
              placeholder="Search area, locality, or landmark"
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Permission Message Banner */}
        {permissionMessage ? (
          <View style={[styles.noticeBanner, { backgroundColor: colors.peachTint, marginHorizontal: spacing.md }]}>
            <Text variant="bodySmall" color="ink">
              {permissionMessage}
            </Text>
          </View>
        ) : null}

        {/* Map View Area (Native) or Web Fallback */}
        <View style={styles.mapContainer}>
          {Platform.OS !== 'web' && NativeMapComponent ? (
            <View style={styles.mapWrapper}>
              <NativeMapComponent
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={{
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                  latitudeDelta: 0.04,
                  longitudeDelta: 0.04,
                }}
                onRegionChangeComplete={(region: any) => {
                  setCoordinates({ latitude: region.latitude, longitude: region.longitude });
                  resolveAddress(region.latitude, region.longitude);
                }}
              />
              <View style={styles.fixedPinContainer} pointerEvents="none">
                <Icon name="pin" size={36} tone="primary" />
              </View>
            </View>
          ) : (
            // Web / Low-end fallback: List of localities
            <ScrollView
              style={styles.webFallbackContainer}
              contentContainerStyle={{ padding: spacing.md, gap: spacing.xs }}
            >
              <Text variant="subhead" color="ink" weight="bold">
                Nearby localities in Hyderabad
              </Text>
              {POPULAR_LOCALITIES.map((loc) => {
                const isSelected = selectedLocality === loc;
                return (
                  <Pressable
                    key={loc}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${loc}`}
                    onPress={() => setSelectedLocality(loc)}
                    style={[
                      styles.localityRow,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : borders.width,
                        borderRadius: radii.md,
                        padding: spacing.md,
                      },
                    ]}
                  >
                    <View style={styles.localityLeft}>
                      <Icon name="pin" size={18} tone={isSelected ? 'primary' : 'muted'} />
                      <Text variant="body" color={isSelected ? 'primary' : 'ink'} weight={isSelected ? 'bold' : 'regular'}>
                        {loc}
                      </Text>
                    </View>
                    {isSelected ? <Icon name="check" size={18} tone="primary" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Address & Actions Footer */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: borders.width,
              padding: spacing.md,
              gap: spacing.sm,
            },
          ]}
        >
          {/* Use My Current Location Button */}
          <Button
            variant="secondary"
            label="Use my current location"
            onPress={handleUseCurrentLocation}
          />

          {/* Address Line under the map */}
          <View style={styles.addressRow}>
            <Icon name="pin" size={18} tone="primary" style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="label" color="muted">
                Selected hospital locality
              </Text>
              <Text variant="title" color="ink" weight="bold" numberOfLines={1}>
                {selectedLocality}
              </Text>
              {isResolving ? (
                <View style={styles.resolvingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text variant="caption" color="muted">
                    Updating address...
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Confirm Button */}
          <Button
            variant="primary"
            label="Confirm"
            onPress={handleConfirm}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  noticeBanner: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  fixedPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -36,
    marginLeft: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webFallbackContainer: {
    flex: 1,
  },
  localityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  localityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footer: {
    flexDirection: 'column',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  resolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
});
