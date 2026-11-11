import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWindPressure,
  calculateGlassWeight,
  calculateRequiredGlassThickness,
  getGlassDimensionsForWindow,
  checkHardwareCapacity,
  calculateWindowGlass,
} from './glassCalculator.ts';
import type { TypologyItem } from '../types/index.ts';

test('calculateWindPressure computes pressurePa and pressureKgfM2 according to wind region and height', () => {
  // Região III (40m/s), térreo, terreno suburbano normal
  const result = calculateWindPressure('III', 'terreo_5m', 'suburbano_normal');
  assert.ok(result.windSpeedMs > 0, 'Wind speed should be positive');
  assert.ok(result.pressurePa > 500, 'Pressure should be calculated');
  assert.ok(result.pressureKgfM2 > 50, 'Pressure in kgf/m² should correspond to Pa');

  // Região IV (Litoral), acima de 60m, litoral aberto deve dar pressão significativamente maior
  const highResult = calculateWindPressure('IV', 'acima_60m', 'litoral_aberto');
  assert.ok(highResult.pressurePa > result.pressurePa, 'High altitude coastal pressure must be higher');
});

test('calculateGlassWeight calculates weight using 2.5 kg/(m²·mm) density accurately', () => {
  // 1 m² de vidro 6mm comum: 1 * 6 * 2.5 = 15 kg
  const glass6mm = calculateGlassWeight(1.0, 6, 'Comum');
  assert.equal(glass6mm.weightPerM2Kg, 15);
  assert.equal(glass6mm.totalWeightKg, 15);

  // 2 m² de vidro 8mm temperado: 2 * 8 * 2.5 = 40 kg
  const glass8mm = calculateGlassWeight(2.0, 8, 'Temperado');
  assert.equal(glass8mm.weightPerM2Kg, 20);
  assert.equal(glass8mm.totalWeightKg, 40);

  // Vidro laminado com PVB
  const glassLam = calculateGlassWeight(1.5, 6.38, 'Laminado');
  assert.ok(glassLam.totalWeightKg > 20, 'Laminated glass includes PVB interlayer weight');
});

test('calculateRequiredGlassThickness produces valid commercial thickness according to span', () => {
  // Pequena folha de 600x600 sob pressão moderada
  const small = calculateRequiredGlassThickness(600, 600, 800, 'Temperado');
  assert.ok(small.minimumTheoreticalMm > 0);
  assert.ok(small.recommendedCommercialMm >= 4);

  // Grande folha de 1800x2400 sob pressão alta de 1500 Pa
  const large = calculateRequiredGlassThickness(1800, 2400, 1500, 'Temperado');
  assert.ok(large.minimumTheoreticalMm > 6, 'Large sheet requires thicker glass');
  assert.ok(large.recommendedCommercialMm >= 8);
});

test('getGlassDimensionsForWindow extracts correct sheet cuts from typology', () => {
  const dummyTypology: TypologyItem = {
    id: 'test_typ',
    code: 'TEST-01',
    name: 'Janela de Teste 2F',
    series: 'Suprema',
    category: 'Janela de Correr',
    description: 'Test',
    previewSvg: 'test',
    formula: {
      cuts: [],
      glass: [
        {
          formulaW: (w) => Math.round((w / 2) - 95),
          formulaH: (_w, h) => Math.round(h - 145),
          quantity: 2,
          description: 'Folha de Teste',
        },
      ],
      accessories: [],
    },
  };

  const dims = getGlassDimensionsForWindow(1500, 1200, dummyTypology);
  assert.equal(dims.widthMm, Math.round((1500 / 2) - 95)); // 655 mm
  assert.equal(dims.heightMm, Math.round(1200 - 145));    // 1055 mm
  assert.equal(dims.quantityPerItem, 2);
  assert.ok(dims.areaM2 > 0.6);
});

test('checkHardwareCapacity detects overweight sheets and recommends correct hardware', () => {
  const lightSash = checkHardwareCapacity(20, {
    id: 'typ_cor2',
    code: 'J-COR-2',
    name: 'Janela Suprema',
    series: 'Suprema',
    category: 'Janela de Correr',
    description: '',
    previewSvg: '',
    formula: { cuts: [], glass: [], accessories: [] },
  });
  assert.equal(lightSash.status, 'ok');

  const heavySash = checkHardwareCapacity(68, {
    id: 'typ_cor2',
    code: 'J-COR-2',
    name: 'Janela Suprema',
    series: 'Suprema',
    category: 'Janela de Correr',
    description: '',
    previewSvg: '',
    formula: { cuts: [], glass: [], accessories: [] },
  });
  assert.notEqual(heavySash.status, 'ok', 'Heavy 68kg sash should trigger warning or danger on Suprema');
});

test('calculateWindowGlass integrates all calculations into a complete result', () => {
  const res = calculateWindowGlass({
    windowWidthMm: 1600,
    windowHeightMm: 1400,
    itemQuantity: 2,
    windRegion: 'III',
    heightCategory: 'terreo_5m',
    exposureTerrain: 'suburbano_normal',
    selectedGlassThicknessMm: 6,
    selectedGlassCategory: 'Temperado',
  });

  assert.ok(res.sheetWidthMm > 0);
  assert.ok(res.sheetHeightMm > 0);
  assert.ok(res.weightPerSheetKg > 0);
  assert.ok(res.totalItemGlassWeightKg > 0);
  assert.ok(res.windPressurePa > 0);
  assert.ok(res.recommendedGlassType.length > 0);
  assert.ok(res.hardwareCheck.recommendedHardware.length > 0);
});
