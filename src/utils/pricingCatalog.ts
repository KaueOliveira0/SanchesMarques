import { ProfileDefinition, GlassDefinition, AccessoryDefinition } from '../types';
import {
  PROFILES_CATALOG,
  GLASS_CATALOG,
  ACCESSORIES_CATALOG,
  COLOR_MULTIPLIERS,
} from '../data/catalog';

const KEY_PROFILES_PRICING = 'sm_custom_profiles_pricing_v1';
const KEY_GLASS_PRICING = 'sm_custom_glass_pricing_v1';
const KEY_ACCESSORIES_PRICING = 'sm_custom_acc_pricing_v1';
const KEY_COLORS_PRICING = 'sm_custom_colors_pricing_v1';

export const loadProfilesWithCustomPrices = (): ProfileDefinition[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_PROFILES_PRICING) : null;
    if (raw) {
      const overrides: Record<string, number> = JSON.parse(raw);
      return PROFILES_CATALOG.map((p) => ({
        ...p,
        pricePerKg: overrides[p.code] ?? overrides[p.id] ?? p.pricePerKg,
      }));
    }
  } catch (e) {
    console.error('Error loading custom profile prices', e);
  }
  return PROFILES_CATALOG;
};

export const saveProfilesCustomPrices = (profiles: ProfileDefinition[]) => {
  try {
    const map: Record<string, number> = {};
    profiles.forEach((p) => {
      map[p.code] = p.pricePerKg;
    });
    localStorage.setItem(KEY_PROFILES_PRICING, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving custom profile prices', e);
  }
};

export const loadGlassWithCustomPrices = (): GlassDefinition[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_GLASS_PRICING) : null;
    if (raw) {
      const overrides: Record<string, number> = JSON.parse(raw);
      return GLASS_CATALOG.map((g) => ({
        ...g,
        pricePerM2: overrides[g.id] ?? g.pricePerM2,
      }));
    }
  } catch (e) {
    console.error('Error loading custom glass prices', e);
  }
  return GLASS_CATALOG;
};

export const saveGlassCustomPrices = (glassList: GlassDefinition[]) => {
  try {
    const map: Record<string, number> = {};
    glassList.forEach((g) => {
      map[g.id] = g.pricePerM2;
    });
    localStorage.setItem(KEY_GLASS_PRICING, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving custom glass prices', e);
  }
};

export const loadAccessoriesWithCustomPrices = (): AccessoryDefinition[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_ACCESSORIES_PRICING) : null;
    if (raw) {
      const overrides: Record<string, number> = JSON.parse(raw);
      return ACCESSORIES_CATALOG.map((a) => ({
        ...a,
        price: overrides[a.code] ?? overrides[a.id] ?? a.price,
      }));
    }
  } catch (e) {
    console.error('Error loading custom accessory prices', e);
  }
  return ACCESSORIES_CATALOG;
};

export const saveAccessoriesCustomPrices = (accessories: AccessoryDefinition[]) => {
  try {
    const map: Record<string, number> = {};
    accessories.forEach((a) => {
      map[a.code] = a.price;
    });
    localStorage.setItem(KEY_ACCESSORIES_PRICING, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving custom accessory prices', e);
  }
};

export const loadColorMultipliers = (): Record<string, number> => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_COLORS_PRICING) : null;
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading color multipliers', e);
  }
  return COLOR_MULTIPLIERS;
};

export const saveColorMultipliers = (multipliers: Record<string, number>) => {
  try {
    localStorage.setItem(KEY_COLORS_PRICING, JSON.stringify(multipliers));
  } catch (e) {
    console.error('Error saving color multipliers', e);
  }
};
