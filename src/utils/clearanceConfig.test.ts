import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LINE_CLEARANCES,
  getClearanceForSeries,
  calculateDynamicGlassDimensions,
  loadClearanceConfigs,
  saveClearanceConfigs,
} from './clearanceConfig';

test('DEFAULT_LINE_CLEARANCES contains configurations for Suprema and Gold', () => {
  const suprema = DEFAULT_LINE_CLEARANCES.find((c) => c.series === 'Suprema');
  const gold = DEFAULT_LINE_CLEARANCES.find((c) => c.series === 'Gold');

  assert.ok(suprema, 'Linha Suprema deve existir');
  assert.ok(gold, 'Linha Gold deve existir');
  assert.equal(suprema?.glassDeltaWidthMm, 95);
  assert.equal(suprema?.glassDeltaHeightMm, 145);
  assert.equal(gold?.glassDeltaWidthMm, 115);
  assert.equal(gold?.glassDeltaHeightMm, 175);
});

test('getClearanceForSeries finds config case-insensitively and falls back safely', () => {
  const c1 = getClearanceForSeries('suprema');
  assert.equal(c1.series, 'Suprema');

  const c2 = getClearanceForSeries('GOLD');
  assert.equal(c2.series, 'Gold');

  const cFallback = getClearanceForSeries('Série Inexistente XYZ');
  assert.equal(cFallback.series, 'Suprema');
});

test('calculateDynamicGlassDimensions accurately computes glass size for Suprema 2-leaf window', () => {
  // Janela 1200 x 1200 na Linha Suprema
  // 2 folhas, overlap = 26mm, Delta W = 95, Delta H = 145
  // sashWidth = (1200 + 26) / 2 = 613
  // glassWidth = 613 - 95 = 518
  // glassHeight = 1200 - 145 = 1055
  const result = calculateDynamicGlassDimensions(1200, 1200, 'Suprema', 2);
  assert.equal(result.glassWidthMm, 518);
  assert.equal(result.glassHeightMm, 1055);
  assert.ok(result.areaM2 > 0.5 && result.areaM2 < 0.6);
  assert.equal(result.clearanceUsed.series, 'Suprema');
});

test('calculateDynamicGlassDimensions respects custom clearance overrides', () => {
  const customClearance = [
    {
      ...DEFAULT_LINE_CLEARANCES[0],
      series: 'Suprema',
      glassDeltaWidthMm: 100,
      glassDeltaHeightMm: 150,
      sashOverlapWidthMm: 20,
    },
  ];

  // (1200 + 20) / 2 = 610
  // glassWidth = 610 - 100 = 510
  // glassHeight = 1200 - 150 = 1050
  const result = calculateDynamicGlassDimensions(1200, 1200, 'Suprema', 2, customClearance);
  assert.equal(result.glassWidthMm, 510);
  assert.equal(result.glassHeightMm, 1050);
});
