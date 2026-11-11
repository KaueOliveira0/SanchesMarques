import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStockAlerts,
  calculateProfileTotalWeightKg,
  validateProfileData,
  validateAccessoryData,
  validateGlassData,
  validateConsumableData,
} from './stockLogic.ts';
import type { StockProfile, StockAccessory, StockGlass, StockConsumable } from '../types/index.ts';

test('computeStockAlerts counts low stock items correctly across all categories', () => {
  const profiles: StockProfile[] = [
    { id: '1', code: 'SU-001', name: 'Marco', series: 'Suprema', color: 'Branco', wholeBarsQty: 2, minBarsThreshold: 5, remnants: [], kgm: 0.5 },
    { id: '2', code: 'SU-002', name: 'Folha', series: 'Suprema', color: 'Preto', wholeBarsQty: 10, minBarsThreshold: 4, remnants: [], kgm: 0.6 },
  ];

  const accessories: StockAccessory[] = [
    { id: 'a1', code: 'ROL-01', name: 'Roldana', unit: 'un', currentQty: 3, minQty: 10, price: 15 },
  ];

  const glass: StockGlass[] = [
    { id: 'g1', name: 'Vidro 6mm', thicknessMm: 6, currentAreaM2: 5, minAreaM2: 10, pricePerM2: 120 },
  ];

  const consumables: StockConsumable[] = [
    { id: 'c1', code: 'SIL-01', name: 'Silicone', category: 'Selantes & Silicones', unit: 'tubo', currentQty: 2, minQty: 5, price: 20 },
    { id: 'c2', code: 'PAR-01', name: 'Parafuso', category: 'Fixadores & Parafusos', unit: 'cento', currentQty: 20, minQty: 5, price: 30 },
  ];

  const alerts = computeStockAlerts(profiles, accessories, glass, consumables);
  assert.equal(alerts.lowProfilesCount, 1);
  assert.equal(alerts.lowAccessoriesCount, 1);
  assert.equal(alerts.lowGlassCount, 1);
  assert.equal(alerts.lowConsumablesCount, 1);
  assert.equal(alerts.totalAlerts, 4);
});

test('calculateProfileTotalWeightKg calculates 6m bar total kg accurately', () => {
  assert.equal(calculateProfileTotalWeightKg(10, 0.582, 6), 34.92);
  assert.equal(calculateProfileTotalWeightKg(0, 0.582, 6), 0);
  assert.equal(calculateProfileTotalWeightKg(-1, 0.582, 6), 0);
});

test('validateProfileData catches missing or invalid fields', () => {
  assert.equal(validateProfileData({ code: '', name: 'Marco', kgm: 0.5 }).isValid, false);
  assert.equal(validateProfileData({ code: 'SU-001', name: '', kgm: 0.5 }).isValid, false);
  assert.equal(validateProfileData({ code: 'SU-001', name: 'Marco', kgm: 0 }).isValid, false);
  assert.equal(validateProfileData({ code: 'SU-001', name: 'Marco', kgm: -0.2 }).isValid, false);
  assert.equal(validateProfileData({ code: 'SU-001', name: 'Marco', kgm: 0.5, wholeBarsQty: 10 }).isValid, true);
});

test('validateConsumableData validates code and name', () => {
  assert.equal(validateConsumableData({ code: '', name: 'Silicone' }).isValid, false);
  assert.equal(validateConsumableData({ code: 'SIL-01', name: '', currentQty: 10 }).isValid, false);
  assert.equal(validateConsumableData({ code: 'SIL-01', name: 'Silicone', currentQty: -1 }).isValid, false);
  assert.equal(validateConsumableData({ code: 'SIL-01', name: 'Silicone', currentQty: 5, price: 25 }).isValid, true);
});
