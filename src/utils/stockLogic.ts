import type { StockProfile, StockAccessory, StockGlass, StockConsumable } from '../types/index.ts';

export interface StockAlertsSummary {
  lowProfilesCount: number;
  lowAccessoriesCount: number;
  lowGlassCount: number;
  lowConsumablesCount: number;
  totalAlerts: number;
}

export function computeStockAlerts(
  profiles: StockProfile[],
  accessories: StockAccessory[],
  glass: StockGlass[],
  consumables: StockConsumable[] = []
): StockAlertsSummary {
  const lowProfiles = profiles.filter((p) => p.wholeBarsQty <= p.minBarsThreshold);
  const lowAccessories = accessories.filter((a) => a.currentQty <= a.minQty);
  const lowGlass = glass.filter((g) => g.currentAreaM2 <= g.minAreaM2);
  const lowConsumables = consumables.filter((c) => c.currentQty <= c.minQty);

  return {
    lowProfilesCount: lowProfiles.length,
    lowAccessoriesCount: lowAccessories.length,
    lowGlassCount: lowGlass.length,
    lowConsumablesCount: lowConsumables.length,
    totalAlerts: lowProfiles.length + lowAccessories.length + lowGlass.length + lowConsumables.length,
  };
}

export function calculateProfileTotalWeightKg(barsCount: number, kgm: number, barLengthM: number = 6): number {
  if (barsCount < 0 || kgm < 0) return 0;
  return Math.round(barsCount * barLengthM * kgm * 100) / 100;
}

export function validateProfileData(data: {
  code?: string;
  name?: string;
  kgm?: number;
  wholeBarsQty?: number;
}): { isValid: boolean; error?: string } {
  if (!data.code || data.code.trim().length === 0) {
    return { isValid: false, error: 'Código do perfil é obrigatório' };
  }
  if (!data.name || data.name.trim().length === 0) {
    return { isValid: false, error: 'Nome do perfil é obrigatório' };
  }
  if (data.kgm === undefined || isNaN(data.kgm) || data.kgm <= 0) {
    return { isValid: false, error: 'Peso linear (kg/m) deve ser maior que zero' };
  }
  if (data.wholeBarsQty !== undefined && data.wholeBarsQty < 0) {
    return { isValid: false, error: 'Quantidade de barras não pode ser negativa' };
  }
  return { isValid: true };
}

export function validateAccessoryData(data: {
  code?: string;
  name?: string;
  price?: number;
  currentQty?: number;
}): { isValid: boolean; error?: string } {
  if (!data.code || data.code.trim().length === 0) {
    return { isValid: false, error: 'Código do acessório é obrigatório' };
  }
  if (!data.name || data.name.trim().length === 0) {
    return { isValid: false, error: 'Nome do componente é obrigatório' };
  }
  if (data.price !== undefined && (isNaN(data.price) || data.price < 0)) {
    return { isValid: false, error: 'Preço não pode ser negativo' };
  }
  if (data.currentQty !== undefined && data.currentQty < 0) {
    return { isValid: false, error: 'Quantidade em estoque não pode ser negativa' };
  }
  return { isValid: true };
}

export function validateGlassData(data: {
  name?: string;
  thicknessMm?: number;
  currentAreaM2?: number;
  pricePerM2?: number;
}): { isValid: boolean; error?: string } {
  if (!data.name || data.name.trim().length === 0) {
    return { isValid: false, error: 'Descrição da chapa de vidro é obrigatória' };
  }
  if (!data.thicknessMm || data.thicknessMm <= 0) {
    return { isValid: false, error: 'Espessura do vidro deve ser maior que zero' };
  }
  if (data.currentAreaM2 !== undefined && data.currentAreaM2 < 0) {
    return { isValid: false, error: 'Área em estoque não pode ser negativa' };
  }
  if (data.pricePerM2 !== undefined && (isNaN(data.pricePerM2) || data.pricePerM2 < 0)) {
    return { isValid: false, error: 'Preço por m² não pode ser negativo' };
  }
  return { isValid: true };
}

export function validateConsumableData(data: {
  code?: string;
  name?: string;
  currentQty?: number;
  price?: number;
}): { isValid: boolean; error?: string } {
  if (!data.code || data.code.trim().length === 0) {
    return { isValid: false, error: 'Código do insumo é obrigatório' };
  }
  if (!data.name || data.name.trim().length === 0) {
    return { isValid: false, error: 'Nome do insumo é obrigatório' };
  }
  if (data.currentQty !== undefined && data.currentQty < 0) {
    return { isValid: false, error: 'Quantidade não pode ser negativa' };
  }
  if (data.price !== undefined && (isNaN(data.price) || data.price < 0)) {
    return { isValid: false, error: 'Preço unitário não pode ser negativo' };
  }
  return { isValid: true };
}
