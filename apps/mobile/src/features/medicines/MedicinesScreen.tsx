import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Text, SearchBar, Button, Tag, TitleMetaRow } from '../../components/primitives';
import { Icon } from '../../components/icons';
import { FeatureErrorBoundary } from '../common/ErrorBoundary';
import { FEATURES } from '../registry';
import {
  initReminders,
  getReminders,
  getRemindersForPatient,
  toggleReminder as toggleReminderService,
  markDoseTaken as markDoseTakenService,
  onRemindersChange,
  getNextDose,
  MedicineReminder,
} from '../../services/remindersService';
import { getActivePerson, onActivePersonChange } from '../../services/familyService';
import {
  initCart,
  getCartItems,
  getCartTotal,
  addToCart,
  updateCartQuantity,
  CartItem,
} from '../../services/cartService';

const MEDICINE_IMAGES: Record<string, any> = {
  strip: require('../../../assets/medicines/strip.webp'),
  bottle: require('../../../assets/medicines/bottle.webp'),
  syrup: require('../../../assets/medicines/syrup.webp'),
  inhaler: require('../../../assets/medicines/inhaler.webp'),
  drops: require('../../../assets/medicines/drops.webp'),
};

function MedicineThumbnail({ image }: { image?: 'strip' | 'bottle' | 'syrup' | 'inhaler' | 'drops' }) {
  const { colors, radii, borders } = useTheme();
  const source = image ? MEDICINE_IMAGES[image] : null;

  if (source) {
    return (
      <Image
        source={source}
        style={[
          styles.productThumbnail,
          {
            borderColor: colors.border,
            borderWidth: borders.width,
            borderRadius: radii.sm,
          },
        ]}
        resizeMode="cover"
      />
    );
  }

  // Flat placeholder when file is missing or not provided (not the shared bottle photo)
  return (
    <View
      style={[
        styles.productThumbnail,
        styles.flatPlaceholder,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: borders.width,
          borderRadius: radii.sm,
        },
      ]}
    >
      <Icon name="medicines" size={24} tone="muted" />
    </View>
  );
}

interface MedicinesScreenProps {
  hasHeader?: boolean;
}

export function MedicinesScreen({ hasHeader = false }: MedicinesScreenProps) {
  const { colors, spacing, radii, borders, minTouchTarget } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [reminders, setReminders] = useState<MedicineReminder[]>(getReminders());
  const [cartItems, setCartItems] = useState<CartItem[]>(getCartItems());
  const [cartTotal, setCartTotal] = useState<number>(getCartTotal());
  const [markedTakenToast, setMarkedTakenToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getActivePerson().then((person) => {
      getRemindersForPatient(person.id).then((data) => {
        if (active) setReminders(data);
      });
    });
    initCart().then((items) => {
      if (active) {
        setCartItems(items);
        setCartTotal(getCartTotal());
      }
    });

    const unsubPerson = onActivePersonChange((person) => {
      getRemindersForPatient(person.id).then(setReminders);
    });

    const unsubReminders = onRemindersChange((updated) => {
      setReminders(updated);
    });

    return () => {
      active = false;
      unsubPerson();
      unsubReminders();
    };
  }, []);

  const topPadding = hasHeader
    ? spacing.sm
    : Math.max(insets.top, 16) + spacing.xs;

  // Next scheduled untaken dose
  const currentNextDose = useMemo(() => {
    return reminders.find((r) => r.isNextDose && !r.takenToday) ||
      reminders.find((r) => !r.takenToday) ||
      null;
  }, [reminders]);

  const filteredReminders = useMemo(() => {
    if (!searchQuery.trim()) return reminders;
    const q = searchQuery.toLowerCase().trim();
    return reminders.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.hospital.toLowerCase().includes(q) ||
        r.instruction.toLowerCase().includes(q)
    );
  }, [reminders, searchQuery]);

  const handleToggleReminder = async (id: string) => {
    const next = await toggleReminderService(id);
    setReminders(next);
  };

  const handleMarkTaken = async (id: string) => {
    const dose = reminders.find((r) => r.id === id);
    const doseName = dose ? dose.name : 'Dose';
    const next = await markDoseTakenService(id);
    setReminders(next);
    setMarkedTakenToast(`Marked ${doseName} as taken`);
    setTimeout(() => {
      setMarkedTakenToast(null);
    }, 2500);
  };

  const handleAddToCart = async (item: MedicineReminder) => {
    const updatedCart = await addToCart({
      id: item.id,
      name: `${item.name} (10 Tablets)`,
      price: item.pricePerStrip,
      details: `${item.hospital} • Standard strip`,
    });
    setCartItems(updatedCart);
    setCartTotal(getCartTotal());
  };

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    const updated = await updateCartQuantity(itemId, newQty);
    setCartItems(updated);
    setCartTotal(getCartTotal());
  };

  const getQuantityInCart = (itemId: string): number => {
    const found = cartItems.find((c) => c.id === itemId || c.medicineId === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <FeatureErrorBoundary fallbackTitle="Medicines Unavailable">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <FlatList
          data={filteredReminders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: spacing.md,
              paddingTop: topPadding,
              paddingBottom: cartItems.length > 0 ? 140 : 120,
              gap: spacing.sm,
            },
          ]}
          ListHeaderComponent={
            <View style={[styles.headerContainer, { gap: spacing.md }]}>
              {/* Feature Header */}
              <View style={styles.header}>
                <Text variant="headline" color="ink" weight="bold">
                  {FEATURES.medicines.name}
                </Text>
                <Text variant="body" color="muted">
                  Daily doses, reminders, and delivery refills.
                </Text>
              </View>

              {/* Search Inside Medicines */}
              <SearchBar
                placeholder="Search medicines or salt names"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {/* Brief Confirmation Toast if just marked taken */}
              {markedTakenToast && (
                <View
                  style={[
                    styles.toastBanner,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.primary,
                      borderWidth: borders.width,
                      borderRadius: radii.sm,
                      padding: spacing.xs,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.xs,
                    },
                  ]}
                >
                  <Icon name="check" size={16} tone="primary" />
                  <Text variant="bodySmall" color="primary" weight="bold">
                    {markedTakenToast}
                  </Text>
                </View>
              )}

              {/* Next Scheduled Dose Banner */}
              {currentNextDose ? (
                <View
                  style={[
                    styles.nextDoseBanner,
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="caption" color="primary" weight="bold">
                      {`Next scheduled dose · ${currentNextDose.time}`}
                    </Text>
                    <Tag label="Due today" variant="default" />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <View style={{ flex: 1, paddingRight: spacing.sm }}>
                      <Text variant="subhead" color="ink" weight="bold">
                        {currentNextDose.name}
                      </Text>
                      <Text variant="bodySmall" color="muted">
                        {currentNextDose.instruction}
                      </Text>
                    </View>
                    <Button
                      variant="primary"
                      label="Mark taken"
                      onPress={() => handleMarkTaken(currentNextDose.id)}
                    />
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.allTakenBanner,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: borders.width,
                      borderRadius: radii.lg,
                      padding: spacing.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                    },
                  ]}
                >
                  <Icon name="confirmed" size={24} tone="primary" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="subhead" color="ink" weight="bold">
                      All doses taken for today
                    </Text>
                    <Text variant="caption" color="muted">
                      Next scheduled doses will unlock tomorrow morning.
                    </Text>
                  </View>
                </View>
              )}

              {/* Section Subheading */}
              <View style={styles.sectionHeaderRow}>
                <Text variant="subhead" color="ink" weight="bold">
                  Active prescriptions
                </Text>
                <Text variant="caption" color="muted">
                  {`${filteredReminders.length} medicines`}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const qty = getQuantityInCart(item.id);

            return (
              <View
                style={[
                  styles.productCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.lg,
                    padding: spacing.sm,
                    gap: spacing.sm,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                  {/* Clean Medicine Product Thumbnail */}
                  <MedicineThumbnail image={item.image} />

                  {/* Product Details */}
                  <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text variant="subhead" color="ink" weight="bold" numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.refillUrgent && (
                        <Tag label={`${item.daysLeft}d left`} variant="danger" />
                      )}
                    </View>

                    <Text variant="caption" color="muted" weight="semiBold">
                      {`Strip of 10 tablets · ₹${Math.round(item.pricePerStrip)}`}
                    </Text>

                    <Text variant="caption" color="muted" numberOfLines={1}>
                      {`${item.instruction} · ${item.time}`}
                    </Text>
                  </View>
                </View>

                {/* Footer Controls: Bell Toggle + Stepper */}
                <View style={styles.productFooterRow}>
                  {/* Compact Reminder Bell Toggle */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.enabled ? 'Turn off dose reminder' : 'Turn on dose reminder'}
                    onPress={() => handleToggleReminder(item.id)}
                    style={[
                      styles.bellButton,
                      {
                        borderColor: item.enabled ? colors.primary : colors.border,
                        borderWidth: borders.width,
                        backgroundColor: item.enabled ? colors.primaryTint : colors.surface,
                        borderRadius: radii.sm,
                        paddingHorizontal: spacing.xs,
                        minHeight: 36,
                      },
                    ]}
                  >
                    <Icon
                      name={item.enabled ? 'reminderOn' : 'reminderOff'}
                      size={16}
                      tone={item.enabled ? 'primary' : 'muted'}
                    />
                    <Text
                      variant="caption"
                      color={item.enabled ? 'primary' : 'muted'}
                      weight={item.enabled ? 'bold' : 'regular'}
                    >
                      {item.enabled ? 'Reminder' : 'Muted'}
                    </Text>
                  </Pressable>

                  {/* Interactive E-commerce Quantity Stepper */}
                  {qty === 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name} to cart`}
                      onPress={() => handleAddToCart(item)}
                      style={[
                        styles.addCartButton,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.primary,
                          borderWidth: borders.width,
                          borderRadius: radii.sm,
                          paddingHorizontal: spacing.md,
                          minHeight: 36,
                        },
                      ]}
                    >
                      <Text variant="bodySmall" color="primary" weight="bold">
                        + Add
                      </Text>
                    </Pressable>
                  ) : (
                    <View
                      style={[
                        styles.stepperContainer,
                        {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                          borderWidth: borders.width,
                          borderRadius: radii.sm,
                          minHeight: 36,
                        },
                      ]}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Decrease quantity"
                        onPress={() => handleUpdateQuantity(item.id, qty - 1)}
                        style={styles.stepperButton}
                      >
                        <Text variant="subhead" color="surface" weight="bold">
                          -
                        </Text>
                      </Pressable>

                      <View style={styles.stepperQuantity}>
                        <Text variant="bodySmall" color="surface" weight="bold">
                          {qty}
                        </Text>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Increase quantity"
                        onPress={() => handleUpdateQuantity(item.id, qty + 1)}
                        style={styles.stepperButton}
                      >
                        <Text variant="subhead" color="surface" weight="bold">
                          +
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />

        {/* Bottom Sticky Cart Bar */}
        {cartItems.length > 0 && (
          <View
            style={[
              styles.stickyCartBar,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderTopWidth: borders.width,
                padding: spacing.md,
              },
            ]}
          >
            <View style={styles.cartBarInfo}>
              <Text variant="subhead" color="ink" weight="bold" numberOfLines={1}>
                {`${cartItems.reduce((s, c) => s + c.quantity, 0)} items · ₹${Math.round(cartTotal)}`}
              </Text>
              <Text variant="caption" color="muted" numberOfLines={1}>
                City Care Pharmacy delivery
              </Text>
            </View>
            <Button
              variant="primary"
              label="Open cart"
              onPress={() => router.push('/features/cart')}
            />
          </View>
        )}
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
  header: {
    flexDirection: 'column',
    gap: 4,
  },
  toastBanner: {
    minHeight: 36,
  },
  nextDoseBanner: {
    flexDirection: 'column',
  },
  allTakenBanner: {
    minHeight: 64,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productCard: {
    flexDirection: 'column',
  },
  productThumbnail: {
    width: 52,
    height: 52,
    flexShrink: 0,
  },
  flatPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  bellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  addCartButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stepperButton: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
  },
  stepperQuantity: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyCartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartBarInfo: {
    flex: 1,
    gap: 2,
    marginRight: 12,
  },
});
