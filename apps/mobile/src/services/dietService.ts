import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage.ts';
import type {
  DietRegion,
  DietSetting,
  DietDataResponse,
  DoctorDietRestriction,
  MealSlot,
  DailyTargets,
} from '../../../../packages/contracts/src/diet.ts';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const DEFAULT_DOCTOR_RESTRICTIONS: DoctorDietRestriction[] = [
  {
    id: 'res_sodium',
    rule: 'Low sodium (< 1,500 mg/day) • Post-cardiac consult',
    source: 'Dr. P. V. Ramana Rao (Cardiology)',
    severity: 'mandatory',
  },
  {
    id: 'res_glycemic',
    rule: 'Low glycemic index whole grains only',
    source: 'Dr. Ananya Deshmukh (Internal Medicine)',
    severity: 'recommended',
  },
];

export const DEFAULT_MEAL_TEMPLATES: Record<DietRegion, Record<DietSetting, MealSlot[]>> = {
  'Telugu / Deccan': {
    rural: [
      { id: 'm_breakfast', name: 'Breakfast', time: '8:30 AM', items: 'Jowar upma with fresh mint chutney', calories: 320, logged: true },
      { id: 'm_lunch', name: 'Lunch', time: '1:30 PM', items: 'Jowar roti (2) with methi palak pappu & bottle gourd curry', calories: 510, logged: true },
      { id: 'm_snack', name: 'Snack', time: '5:00 PM', items: 'Roasted chana and spiced buttermilk', calories: 140, logged: false },
      { id: 'm_dinner', name: 'Dinner', time: '8:00 PM', items: 'Foxtail millet khichdi with tomato rasam', calories: 450, logged: false },
    ],
    urban: [
      { id: 'm_breakfast', name: 'Breakfast', time: '8:30 AM', items: 'Pesarattu with ginger chutney', calories: 340, logged: true },
      { id: 'm_lunch', name: 'Lunch', time: '1:30 PM', items: 'Brown rice, dal fry, steamed beans poriyal, curd', calories: 520, logged: true },
      { id: 'm_snack', name: 'Snack', time: '5:00 PM', items: 'Sundal (boiled spiced chickpeas)', calories: 150, logged: false },
      { id: 'm_dinner', name: 'Dinner', time: '8:00 PM', items: 'Phulka (2) with methi paneer & ridge gourd curry', calories: 470, logged: false },
    ],
  },
  'South Indian': {
    rural: [
      { id: 'm_breakfast', name: 'Breakfast', time: '8:30 AM', items: 'Ragi idli (3) with drumstick sambar', calories: 310, logged: true },
      { id: 'm_lunch', name: 'Lunch', time: '1:30 PM', items: 'Ragi sangati with keerai kootu & rasam', calories: 500, logged: true },
      { id: 'm_snack', name: 'Snack', time: '5:00 PM', items: 'Sprouted moong with lemon & coriander', calories: 130, logged: false },
      { id: 'm_dinner', name: 'Dinner', time: '8:00 PM', items: 'Red rice with vegetable sambar & boiled egg/tofu', calories: 460, logged: false },
    ],
    urban: [
      { id: 'm_breakfast', name: 'Breakfast', time: '8:30 AM', items: 'Oats idli (2) with vegetable sambar', calories: 320, logged: true },
      { id: 'm_lunch', name: 'Lunch', time: '1:30 PM', items: 'Brown rice, moringa sambar, cabbage poriyal, buttermilk', calories: 510, logged: true },
      { id: 'm_snack', name: 'Snack', time: '5:00 PM', items: 'Cucumber slices and unsalted roasted peanuts', calories: 140, logged: false },
      { id: 'm_dinner', name: 'Dinner', time: '8:00 PM', items: 'Multigrain dosa with tomato chutney', calories: 450, logged: false },
    ],
  },
  'North Indian': {
    rural: [
      { id: 'm_breakfast', name: 'Breakfast', time: '8:30 AM', items: 'Bajra roti (1) with white butter & curd', calories: 330, logged: true },
      { id: 'm_lunch', name: 'Lunch', time: '1:30 PM', items: 'Missi roti (2) with palak dal & seasonal sabzi', calories: 510, logged: true },
      { id: 'm_snack', name: 'Snack', time: '5:00 PM', items: 'Roasted makhana with roasted jeera', calories: 130, logged: false },
      { id: 'm_dinner', name: 'Dinner', time: '8:00 PM', items: 'Dalia khichdi with roasted papad & vegetable soup', calories: 450, logged: false },
    ],
    urban: [
      { id: 'm_breakfast', name: 'Breakfast', time: '8:30 AM', items: 'Besan chilla with mint coriander chutney', calories: 330, logged: true },
      { id: 'm_lunch', name: 'Lunch', time: '1:30 PM', items: 'Multigrain roti (2) with yellow dal tadka & bhindi sabzi', calories: 510, logged: true },
      { id: 'm_snack', name: 'Snack', time: '5:00 PM', items: 'Roasted makhana and masala chaas', calories: 140, logged: false },
      { id: 'm_dinner', name: 'Dinner', time: '8:00 PM', items: 'Moong dal khichdi with curd and cucumber salad', calories: 460, logged: false },
    ],
  },
};

let cachedDietState: DietDataResponse | null = null;

export async function fetchDiet(
  region: DietRegion = 'Telugu / Deccan',
  setting: DietSetting = 'urban'
): Promise<DietDataResponse> {
  const defaultTemplate = DEFAULT_MEAL_TEMPLATES[region]?.[setting] || DEFAULT_MEAL_TEMPLATES['Telugu / Deccan']['urban'];
  const consumed = defaultTemplate.filter((m) => m.logged).reduce((s, m) => s + m.calories, 0);

  const defaultData: DietDataResponse = {
    region,
    setting,
    doctorRestrictions: DEFAULT_DOCTOR_RESTRICTIONS,
    dailyTargets: {
      caloriesTarget: 1850,
      caloriesConsumed: consumed,
      proteinGrams: 65,
      proteinConsumed: Math.round((consumed / 1850) * 58),
      sodiumMg: 1180,
      sodiumLimitMg: 1500,
    },
    meals: defaultTemplate,
  };

  const stored = await getStorageItem<DietDataResponse>(STORAGE_KEYS.DIET, defaultData);
  cachedDietState = stored;

  // Background sync with API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/diet?region=${encodeURIComponent(region)}&setting=${setting}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const apiData = (await res.json()) as DietDataResponse;
      cachedDietState = apiData;
      await setStorageItem(STORAGE_KEYS.DIET, apiData);
      return apiData;
    }
  } catch {
    // API offline
  }

  return cachedDietState || defaultData;
}

type DietListener = (diet: DietDataResponse) => void;
const dietListeners = new Set<DietListener>();

export function onDietChange(listener: DietListener): () => void {
  dietListeners.add(listener);
  return () => {
    dietListeners.delete(listener);
  };
}

function notifyDietListeners(diet: DietDataResponse) {
  dietListeners.forEach((l) => l(diet));
}

export function getCachedDiet(): DietDataResponse | null {
  return cachedDietState;
}

export async function addMealCalories(calories: number, mealName = 'Meal'): Promise<DietDataResponse> {
  const current = cachedDietState || (await fetchDiet());
  const newCalories = current.dailyTargets.caloriesConsumed + calories;
  const newProtein = Math.round((newCalories / 1850) * 58);

  // If a matching meal slot exists, mark it logged and update its calories
  const meals = [...current.meals];
  const matched = meals.find(
    (m) =>
      m.name.toLowerCase().includes(mealName.toLowerCase()) ||
      mealName.toLowerCase().includes(m.name.toLowerCase())
  );
  if (matched) {
    matched.logged = true;
    matched.calories = calories;
  }

  const updated: DietDataResponse = {
    ...current,
    dailyTargets: {
      ...current.dailyTargets,
      caloriesConsumed: newCalories,
      proteinConsumed: newProtein,
    },
    meals,
  };

  cachedDietState = updated;
  await setStorageItem(STORAGE_KEYS.DIET, updated);
  notifyDietListeners(updated);
  return updated;
}

export async function toggleMeal(
  mealId: string,
  region: DietRegion = 'Telugu / Deccan',
  setting: DietSetting = 'urban'
): Promise<DietDataResponse> {
  const current = cachedDietState || (await fetchDiet(region, setting));
  const meals = [...current.meals];
  const meal = meals.find((m) => m.id === mealId || m.name.toLowerCase() === mealId.toLowerCase());

  if (meal) {
    meal.logged = !meal.logged;
  }

  const consumed = meals.filter((m) => m.logged).reduce((s, m) => s + m.calories, 0);

  const updated: DietDataResponse = {
    ...current,
    region,
    setting,
    dailyTargets: {
      ...current.dailyTargets,
      caloriesConsumed: consumed,
      proteinConsumed: Math.round((consumed / 1850) * 58),
    },
    meals,
  };

  cachedDietState = updated;
  await setStorageItem(STORAGE_KEYS.DIET, updated);
  notifyDietListeners(updated);

  // Sync to API
  fetch(`${API_BASE_URL}/diet/toggle-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mealId, logged: meal ? meal.logged : true, region, setting }),
  }).catch(() => {});

  return updated;
}

export async function syncDietProfileFromOnboarding(
  language: string,
  setting: DietSetting = 'urban',
  conditions: string[] = []
): Promise<DietDataResponse> {
  let region: DietRegion = 'Telugu / Deccan';
  if (language === 'te') {
    region = 'Telugu / Deccan';
  } else if (language === 'ta' || language === 'kn' || language === 'ml') {
    region = 'South Indian';
  } else if (language === 'hi' || language === 'mr' || language === 'bn') {
    region = 'North Indian';
  } else {
    // English defaults to South Indian (or Deccan)
    region = 'South Indian';
  }

  const restrictions: DoctorDietRestriction[] = [];
  if (conditions.includes('hypertension') || conditions.includes('cardiac')) {
    restrictions.push({
      id: 'res_sodium',
      rule: 'Low sodium (< 1,500 mg/day) • Cardiology consult',
      source: 'Clinical Protocol',
      severity: 'mandatory',
    });
  }
  if (conditions.includes('diabetes')) {
    restrictions.push({
      id: 'res_glycemic',
      rule: 'Low glycemic index whole grains only',
      source: 'Endocrinology Guidance',
      severity: 'recommended',
    });
  }
  if (restrictions.length === 0) {
    restrictions.push({
      id: 'res_balanced',
      rule: 'Balanced nutrition • High fiber seasonal vegetables',
      source: 'General Nutrition',
      severity: 'recommended',
    });
  }

  const defaultTemplate = DEFAULT_MEAL_TEMPLATES[region]?.[setting] || DEFAULT_MEAL_TEMPLATES['Telugu / Deccan']['urban'];
  const consumed = defaultTemplate.filter((m) => m.logged).reduce((s, m) => s + m.calories, 0);

  const newDietData: DietDataResponse = {
    region,
    setting,
    doctorRestrictions: restrictions,
    dailyTargets: {
      caloriesTarget: 1850,
      caloriesConsumed: consumed,
      proteinGrams: 65,
      proteinConsumed: Math.round((consumed / 1850) * 58),
      sodiumMg: 1180,
      sodiumLimitMg: restrictions.some((r) => r.id === 'res_sodium') ? 1500 : 2300,
    },
    meals: defaultTemplate,
  };

  cachedDietState = newDietData;
  await setStorageItem(STORAGE_KEYS.DIET, newDietData);
  return newDietData;
}
