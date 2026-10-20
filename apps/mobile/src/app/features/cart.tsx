import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons';
import { useTheme } from '../../theme';
import { Text, Button, Tag, ScreenHeader, Sheet } from '../../components/primitives';
import { FeatureErrorBoundary } from '../../features/common/ErrorBoundary';
import {
  CartItem,
  getCartItems,
  getCartTotal,
  initCart,
  updateCartQuantity,
  checkoutCart,
} from '../../services/cartService';
import type { CheckoutResponse } from '../../../../../packages/contracts/src/medicines';

export default function CartRoute() {
  const { colors, spacing, borders, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>(getCartItems());
  const [deliveryMode, setDeliveryMode] = useState<'doorstep' | 'pickup'>('doorstep');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [isConfirmSheetOpen, setIsConfirmSheetOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeOrder, setActiveOrder] = useState<CheckoutResponse | null>(null);

  useEffect(() => {
    let active = true;
    initCart().then((c) => {
      if (active) setItems(c);
    });
    return () => {
      active = false;
    };
  }, []);

  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryMode === 'doorstep' ? 30.0 : 0.0;
  const grandTotal = itemsTotal + deliveryFee;

  const handleStepQuantity = async (itemId: string, currentQty: number, delta: number) => {
    const nextQty = Math.max(0, currentQty + delta);
    const updated = await updateCartQuantity(itemId, nextQty);
    setItems(updated);
  };

  const handleProceedToPayment = () => {
    setIsConfirmSheetOpen(true);
  };

  const handleConfirmOrder = async () => {
    setIsCheckingOut(true);
    try {
      const order = await checkoutCart(deliveryMode, paymentMethod);
      setActiveOrder(order);
      setItems([]);
      setIsConfirmSheetOpen(false);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <FeatureErrorBoundary fallbackTitle="Cart Unavailable">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScreenHeader />

        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            { padding: spacing.md, gap: spacing.md, paddingBottom: 110 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text variant="headline" color="ink" weight="bold">
              Medicine cart & checkout
            </Text>
            <Text variant="body" color="muted">
              Prescription refills from City Care Pharmacy.
            </Text>
          </View>

          {activeOrder ? (
            /* Order Placed Success Card */
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.sageTint,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  gap: spacing.sm,
                },
              ]}
            >
              <View style={styles.orderStatusTop}>
                <Tag label="Order confirmed" variant="primary" />
                <Text variant="caption" color="muted">
                  {`Order #${activeOrder.orderId}`}
                </Text>
              </View>

              <Text variant="title" color="ink" weight="bold">
                {activeOrder.estimatedDelivery}
              </Text>

              <Text variant="body" color="ink">
                {activeOrder.deliveryMode === 'doorstep'
                  ? 'Delivery to your address via City Care Hospital Pharmacy courier.'
                  : 'Ready at City Care Hospital Pharmacy counter (OPD Block Ground Floor).'}
              </Text>

              <View
                style={[
                  styles.receiptSummary,
                  {
                    borderColor: colors.border,
                    borderTopWidth: borders.width,
                    paddingTop: spacing.sm,
                    gap: 4,
                  },
                ]}
              >
                <View style={styles.summaryRow}>
                  <Text variant="bodySmall" color="muted">
                    Total paid
                  </Text>
                  <Text variant="bodySmall" color="ink" weight="bold">
                    {`₹${Math.round(activeOrder.grandTotal)}`}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text variant="bodySmall" color="muted">
                    Mode
                  </Text>
                  <Text variant="bodySmall" color="ink" weight="semiBold">
                    {activeOrder.deliveryMode === 'doorstep' ? 'Home delivery' : 'Pharmacy pickup'}
                  </Text>
                </View>
              </View>

              <Button
                variant="primary"
                label="Back to medicines"
                onPress={() => router.back()}
              />
            </View>
          ) : items.length === 0 ? (
            /* Empty Cart View */
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  gap: spacing.sm,
                  alignItems: 'center',
                },
              ]}
            >
              <Text variant="subhead" color="ink" weight="bold">
                Cart is empty
              </Text>
              <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
                No medicine strips pending refill.
              </Text>
              <Button
                variant="secondary"
                label="Browse medicines"
                onPress={() => router.back()}
              />
            </View>
          ) : (
            <>
              {/* Dynamic Cart Items List with 48x48dp Quantity Steppers */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borders.width,
                    borderRadius: radii.lg,
                    padding: spacing.md,
                    gap: spacing.sm,
                  },
                ]}
              >
                <Text variant="subhead" color="ink" weight="bold">
                  {`Prescription items (${items.length})`}
                </Text>

                {items.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.cartItemRow,
                      {
                        borderBottomWidth: idx < items.length - 1 ? borders.width : 0,
                        borderBottomColor: colors.border,
                        paddingBottom: idx < items.length - 1 ? spacing.sm : 0,
                        marginBottom: idx < items.length - 1 ? spacing.xs : 0,
                      },
                    ]}
                  >
                    <View style={styles.itemInfo}>
                      <Text variant="subhead" color="ink" weight="bold">
                        {item.name}
                      </Text>
                      <Text variant="caption" color="muted">
                        {item.details || 'Standard refill strip'}
                      </Text>
                      <Text variant="bodySmall" color="primary" weight="bold">
                        {`₹${Math.round(item.price * item.quantity)}`}
                      </Text>
                    </View>

                    {/* Quantity Stepper (>= 48x48dp touch targets) */}
                    <View style={styles.stepperContainer}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Decrease quantity"
                        onPress={() => handleStepQuantity(item.id, item.quantity, -1)}
                        style={[
                          styles.stepperButton,
                          {
                            borderColor: colors.border,
                            borderWidth: borders.width,
                            borderRadius: radii.md,
                            backgroundColor: colors.surface,
                          },
                        ]}
                      >
                        <Icon name="remove" size={18} tone="ink" />
                      </Pressable>

                      <View style={styles.quantityDisplay}>
                        <Text variant="body" color="ink" weight="bold">
                          {String(item.quantity)}
                        </Text>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Increase quantity"
                        onPress={() => handleStepQuantity(item.id, item.quantity, 1)}
                        style={[
                          styles.stepperButton,
                          {
                            borderColor: colors.border,
                            borderWidth: borders.width,
                            borderRadius: radii.md,
                            backgroundColor: colors.surface,
                          },
                        ]}
                      >
                        <Icon name="add" size={18} tone="ink" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              {/* Delivery Mode Toggle (Two Flat Selectable Option Cards) */}
              <View style={{ gap: spacing.xs }}>
                <Text variant="subhead" color="ink" weight="bold">
                  Delivery mode
                </Text>

                <View style={{ gap: spacing.xs }}>
                  <Pressable
                    onPress={() => setDeliveryMode('doorstep')}
                    style={[
                      styles.modeOptionCard,
                      {
                        backgroundColor: deliveryMode === 'doorstep' ? colors.primaryTint : colors.surface,
                        borderColor: deliveryMode === 'doorstep' ? colors.primary : colors.border,
                        borderWidth: borders.width,
                        borderRadius: radii.md,
                        padding: spacing.md,
                        gap: spacing.sm,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: deliveryMode === 'doorstep' ? colors.primary : colors.border,
                          backgroundColor: deliveryMode === 'doorstep' ? colors.primary : colors.surface,
                          borderWidth: borders.width,
                          borderRadius: radii.sm, // strictly square 6px
                        },
                      ]}
                    >
                      {deliveryMode === 'doorstep' && <Icon name="check" size={14} tone="surface" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="subhead" color="ink" weight="bold">
                        Home delivery (₹30)
                      </Text>
                      <Text variant="caption" color="muted">
                        Arriving at your home by 6:30 PM
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setDeliveryMode('pickup')}
                    style={[
                      styles.modeOptionCard,
                      {
                        backgroundColor: deliveryMode === 'pickup' ? colors.primaryTint : colors.surface,
                        borderColor: deliveryMode === 'pickup' ? colors.primary : colors.border,
                        borderWidth: borders.width,
                        borderRadius: radii.md,
                        padding: spacing.md,
                        gap: spacing.sm,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: deliveryMode === 'pickup' ? colors.primary : colors.border,
                          backgroundColor: deliveryMode === 'pickup' ? colors.primary : colors.surface,
                          borderWidth: borders.width,
                          borderRadius: radii.sm, // strictly square 6px
                        },
                      ]}
                    >
                      {deliveryMode === 'pickup' && <Icon name="check" size={14} tone="surface" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="subhead" color="ink" weight="bold">
                        Hospital pharmacy pickup (Free)
                      </Text>
                      <Text variant="caption" color="muted">
                        Collect from City Care Hospital OPD Counter
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Price Breakdown */}
              <View
                style={[
                  styles.card,
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
                <View style={styles.summaryRow}>
                  <Text variant="body" color="muted">
                    {`Medicines total (${items.length} items)`}
                  </Text>
                  <Text variant="body" color="ink">
                    {`₹${itemsTotal.toFixed(2)}`}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text variant="body" color="muted">
                    Delivery charge
                  </Text>
                  <Text variant="body" color={deliveryFee === 0 ? 'primary' : 'ink'} weight="semiBold">
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                  </Text>
                </View>

                <View
                  style={[
                    styles.summaryRow,
                    {
                      borderTopColor: colors.border,
                      borderTopWidth: borders.width,
                      paddingTop: spacing.xs,
                      marginTop: 4,
                    },
                  ]}
                >
                  <Text variant="subhead" color="ink" weight="bold">
                    Total payable
                  </Text>
                  <Text variant="subhead" color="primary" weight="bold">
                    {`₹${grandTotal.toFixed(2)}`}
                  </Text>
                </View>
              </View>

              {/* Payment Button */}
              <Button
                variant="primary"
                label="Proceed to payment"
                fullWidth
                onPress={handleProceedToPayment}
              />
            </>
          )}
        </ScrollView>

        {/* Payment Confirmation Sheet with complete checkout flow */}
        <Sheet
          visible={isConfirmSheetOpen}
          onClose={() => setIsConfirmSheetOpen(false)}
          title="Confirm refill order"
          footer={
            <Button
              variant="primary"
              label={isCheckingOut ? 'Placing order...' : 'Confirm order'}
              disabled={isCheckingOut}
              fullWidth
              onPress={handleConfirmOrder}
            />
          }
        >
          <View style={{ gap: spacing.md }}>
            <View
              style={[
                styles.billCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borders.width,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  gap: spacing.xs,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text variant="bodySmall" color="muted">
                  Dispensing pharmacy
                </Text>
                <Text variant="bodySmall" color="ink" weight="bold">
                  City Care Pharmacy
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="bodySmall" color="muted">
                  Delivery mode
                </Text>
                <Text variant="bodySmall" color="ink" weight="bold">
                  {deliveryMode === 'doorstep' ? 'Home delivery (₹30)' : 'Hospital pickup (Free)'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="bodySmall" color="muted">
                  Grand total
                </Text>
                <Text variant="subhead" color="primary" weight="bold">
                  {`₹${grandTotal.toFixed(2)}`}
                </Text>
              </View>
            </View>

            {/* Payment Method Selector */}
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="muted" weight="semiBold">
                SELECT PAYMENT METHOD
              </Text>

              <View style={{ gap: spacing.xs }}>
                <Pressable
                  onPress={() => setPaymentMethod('upi')}
                  style={[
                    styles.methodRow,
                    {
                      backgroundColor: paymentMethod === 'upi' ? colors.primaryTint : colors.surface,
                      borderColor: paymentMethod === 'upi' ? colors.primary : colors.border,
                      borderWidth: borders.width,
                      borderRadius: radii.md,
                      padding: spacing.sm,
                      gap: spacing.sm,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: paymentMethod === 'upi' ? colors.primary : colors.border,
                        backgroundColor: paymentMethod === 'upi' ? colors.primary : colors.surface,
                        borderWidth: borders.width,
                        borderRadius: radii.sm,
                      },
                    ]}
                  >
                    {paymentMethod === 'upi' && <Icon name="check" size={14} tone="surface" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" color="ink" weight="semiBold">
                      UPI / QR code
                    </Text>
                    <Text variant="caption" color="muted">
                      Pay instantly via any UPI app
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentMethod('cod')}
                  style={[
                    styles.methodRow,
                    {
                      backgroundColor: paymentMethod === 'cod' ? colors.primaryTint : colors.surface,
                      borderColor: paymentMethod === 'cod' ? colors.primary : colors.border,
                      borderWidth: borders.width,
                      borderRadius: radii.md,
                      padding: spacing.sm,
                      gap: spacing.sm,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: paymentMethod === 'cod' ? colors.primary : colors.border,
                        backgroundColor: paymentMethod === 'cod' ? colors.primary : colors.surface,
                        borderWidth: borders.width,
                        borderRadius: radii.sm,
                      },
                    ]}
                  >
                    {paymentMethod === 'cod' && <Icon name="check" size={14} tone="surface" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" color="ink" weight="semiBold">
                      Pay at delivery or pickup
                    </Text>
                    <Text variant="caption" color="muted">
                      Cash or card on receipt
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
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
  content: {
    flexDirection: 'column',
  },
  titleSection: {
    flexDirection: 'column',
    gap: 4,
  },
  card: {
    flexDirection: 'column',
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  radioCircle: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billCard: {
    flexDirection: 'column',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  orderStatusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptSummary: {
    flexDirection: 'column',
  },
});
