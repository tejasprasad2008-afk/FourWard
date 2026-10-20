import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage.ts';
import type { CheckoutResponse } from '../../../../packages/contracts/src/medicines.ts';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface CartItem {
  id: string;
  medicineId?: string;
  name: string;
  details: string;
  price: number;
  quantity: number;
  image?: 'strip' | 'bottle' | 'syrup' | 'inhaler' | 'drops';
}

export const DEFAULT_CART_ITEMS: CartItem[] = [
  {
    id: 'med-1',
    medicineId: 'med_atorva_10',
    name: 'Atorvastatin 10mg (10 Tablets)',
    details: 'Batch: AT-2026-90 • Exp: 09/2028',
    price: 142.0,
    quantity: 1,
    image: 'bottle',
  },
  {
    id: 'med-2',
    medicineId: 'med_telmi_40',
    name: 'Telmisartan 40mg (15 Tablets)',
    details: 'Batch: TL-2026-44 • Exp: 11/2028',
    price: 142.0,
    quantity: 1,
    image: 'strip',
  },
];

let cachedCart: CartItem[] = [...DEFAULT_CART_ITEMS];
let isLoaded = false;

export async function initCart(): Promise<CartItem[]> {
  if (isLoaded) return cachedCart;
  const items = await getStorageItem<CartItem[]>(STORAGE_KEYS.CART, DEFAULT_CART_ITEMS);
  cachedCart = items;
  isLoaded = true;
  return cachedCart;
}

export function getCartItems(): CartItem[] {
  return cachedCart;
}

export async function saveCartItems(items: CartItem[]): Promise<void> {
  cachedCart = items;
  await setStorageItem(STORAGE_KEYS.CART, items);
}

export function getCartTotal(): number {
  return cachedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export async function updateCartQuantity(itemId: string, quantity: number): Promise<CartItem[]> {
  if (quantity <= 0) {
    cachedCart = cachedCart.filter((item) => item.id !== itemId);
  } else {
    const existing = cachedCart.find((item) => item.id === itemId);
    if (existing) {
      existing.quantity = quantity;
    }
  }

  await saveCartItems(cachedCart);

  // Sync to API
  fetch(`${API_BASE_URL}/medicines/cart/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medicineId: itemId, quantity }),
  }).catch(() => {});

  return [...cachedCart];
}

export async function addToCart(item: {
  id: string;
  name: string;
  price: number;
  details?: string;
}): Promise<CartItem[]> {
  const existing = cachedCart.find((c) => c.id === item.id || c.medicineId === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cachedCart.push({
      id: item.id,
      medicineId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      details: item.details || 'Standard refill strip',
    });
  }

  await saveCartItems(cachedCart);

  fetch(`${API_BASE_URL}/medicines/cart/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      medicineId: item.id,
      quantity: existing ? existing.quantity : 1,
    }),
  }).catch(() => {});

  return [...cachedCart];
}

export async function checkoutCart(
  deliveryMode: 'doorstep' | 'pickup',
  paymentMethod: 'upi' | 'cod' = 'upi'
): Promise<CheckoutResponse> {
  const itemsTotal = getCartTotal();
  const deliveryFee = deliveryMode === 'doorstep' ? 30.0 : 0.0;
  const grandTotal = itemsTotal + deliveryFee;
  const orderNumber = Math.floor(Math.random() * 900 + 100);
  const orderId = `FW-${orderNumber}`;

  const localReceipt: CheckoutResponse = {
    orderId,
    itemsCount: cachedCart.reduce((s, i) => s + i.quantity, 0),
    itemsTotal,
    deliveryFee,
    grandTotal,
    deliveryMode,
    pharmacyName: 'City Care Pharmacy',
    paymentStatus: 'confirmed',
    estimatedDelivery: deliveryMode === 'doorstep' ? 'Arriving by 6:30 PM' : 'Ready for pickup in 20 mins',
    orderedAt: new Date().toISOString(),
  };

  // Save active order receipt
  await setStorageItem(STORAGE_KEYS.ORDERS, localReceipt);

  // Clear cart
  await saveCartItems([]);

  // Sync to API in background
  try {
    const res = await fetch(`${API_BASE_URL}/medicines/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryMode, paymentMethod, pharmacyName: 'City Care Pharmacy' }),
    });
    if (res.ok) {
      const serverReceipt = (await res.json()) as CheckoutResponse;
      await setStorageItem(STORAGE_KEYS.ORDERS, serverReceipt);
      return serverReceipt;
    }
  } catch {
    // API offline - local receipt is already persisted
  }

  return localReceipt;
}
