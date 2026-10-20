import type {
  DietRegion,
  DietSetting,
  DoctorDietRestriction,
  DailyTargets,
  MealSlot,
  DietDataResponse,
} from '../../../../../packages/contracts/src/diet.ts';

export class DietStore {
  private doctorRestrictions: DoctorDietRestriction[] = [
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

  // Meal templates by region and setting
  private templates: Record<DietRegion, Record<DietSetting, MealSlot[]>> = {
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

  // Active state per region+setting
  private activeMeals: Map<string, MealSlot[]> = new Map();

  public getDietData(region: DietRegion = 'Telugu / Deccan', setting: DietSetting = 'urban'): DietDataResponse {
    const key = `${region}_${setting}`;
    if (!this.activeMeals.has(key)) {
      const template = this.templates[region]?.[setting] || this.templates['Telugu / Deccan']['urban'];
      this.activeMeals.set(key, JSON.parse(JSON.stringify(template)));
    }

    const meals = this.activeMeals.get(key)!;
    const consumed = meals.filter((m) => m.logged).reduce((sum, m) => sum + m.calories, 0);

    const dailyTargets: DailyTargets = {
      caloriesTarget: 1850,
      caloriesConsumed: consumed,
      proteinGrams: 65,
      proteinConsumed: Math.round((consumed / 1850) * 58),
      sodiumMg: 1180,
      sodiumLimitMg: 1500,
    };

    return {
      region,
      setting,
      doctorRestrictions: [...this.doctorRestrictions],
      dailyTargets,
      meals: [...meals],
    };
  }

  public toggleMeal(
    mealId: string,
    logged?: boolean,
    region: DietRegion = 'Telugu / Deccan',
    setting: DietSetting = 'urban'
  ): DietDataResponse {
    const key = `${region}_${setting}`;
    if (!this.activeMeals.has(key)) {
      this.getDietData(region, setting);
    }

    const meals = this.activeMeals.get(key)!;
    const meal = meals.find((m) => m.id === mealId || m.name.toLowerCase() === mealId.toLowerCase());
    if (meal) {
      meal.logged = logged !== undefined ? logged : !meal.logged;
    }

    return this.getDietData(region, setting);
  }
}

export const dietStore = new DietStore();
