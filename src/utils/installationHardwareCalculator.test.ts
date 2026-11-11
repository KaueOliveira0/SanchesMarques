import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSideClamps,
  calculateSingleOpeningHardware,
  aggregateHardwareRequirements,
  generateInstallationKitWhatsAppMessage,
  DEFAULT_HARDWARE_CONFIG,
} from './installationHardwareCalculator';

test('calculateSideClamps calculates correct clamp positions with corner offsets and max spacing', () => {
  // Very short side (<= 300mm):
  assert.equal(calculateSideClamps(150, 400, 150), 1);
  assert.equal(calculateSideClamps(300, 400, 150), 2);

  // 1200mm side:
  // Span = 1200 - 300 = 900mm. With 400mm spacing: ceil(900/400) - 1 = 3 - 1 = 2 intermediate clamps.
  // Total = 2 + 2 = 4 clamps.
  assert.equal(calculateSideClamps(1200, 400, 150), 4);

  // 2400mm side (door):
  // Span = 2400 - 300 = 2100mm. With 400mm spacing: ceil(2100/400) - 1 = 6 - 1 = 5 intermediate clamps.
  // Total = 2 + 5 = 7 clamps.
  assert.equal(calculateSideClamps(2400, 400, 150), 7);
});

test('calculateSingleOpeningHardware computes standard window 1500x1200mm hardware accurately', () => {
  const result = calculateSingleOpeningHardware({
    id: 'j1',
    name: 'Janela J1 - Sala de Estar',
    widthMm: 1500,
    heightMm: 1200,
    quantity: 1,
  });

  // Perimeter = 2 * (1.5 + 1.2) = 5.4m
  assert.equal(result.perimeterLinearM, 5.4);
  assert.equal(result.totalPerimeterLinearM, 5.4);

  // Clamps:
  // Height 1200mm -> 4 clamps (left & right = 8)
  // Width 1500mm -> span 1200 / 400 = 3 -> 2 intermediate -> 4 clamps (head & sill = 8)
  // Total = 16 clamps
  assert.equal(result.clampsPerUnit, 16);
  assert.equal(result.totalClamps, 16);

  // Screws: 16 * 2 + 4 corner screws = 36 screws
  assert.equal(result.screwsAndPlugsPerUnit, 36);

  // Sealant: 5.4m * 1.15 = 6.21m. At 36ml/m -> 223.56 ml. Tubes = 1
  assert.equal(result.sealantTubesRounded, 1);
  assert.ok(result.sealantTubesRaw > 0.5 && result.sealantTubesRaw <= 1.0);

  // Estimated cost must be positive and non-zero
  assert.ok(result.estimatedCost > 50);
});

test('calculateSingleOpeningHardware excludes sill clamps when opening is a door or floor-to-ceiling', () => {
  const windowResult = calculateSingleOpeningHardware({
    id: 'w1',
    name: 'Janela 2000x2100mm',
    widthMm: 2000,
    heightMm: 2100,
    quantity: 1,
    isDoorOrFloorToCeiling: false,
  });

  const doorResult = calculateSingleOpeningHardware({
    id: 'd1',
    name: 'Porta 2000x2100mm',
    widthMm: 2000,
    heightMm: 2100,
    quantity: 1,
    isDoorOrFloorToCeiling: true,
  });

  // Door should have fewer clamps because the sill / floor does not have counterframe clamps
  assert.ok(doorResult.clampsPerUnit < windowResult.clampsPerUnit);
});

test('aggregateHardwareRequirements aggregates multiple openings, totals and cost breakdowns', () => {
  const openings = [
    { id: '1', name: 'J1 - Quarto 1', widthMm: 1200, heightMm: 1200, quantity: 2 },
    { id: '2', name: 'J2 - Sala', widthMm: 2000, heightMm: 1400, quantity: 1 },
    { id: '3', name: 'P1 - Varanda', widthMm: 2400, heightMm: 2200, quantity: 1, isDoorOrFloorToCeiling: true },
  ];

  const summary = aggregateHardwareRequirements(openings);

  assert.equal(summary.totalOpenings, 3);
  assert.equal(summary.totalUnits, 4); // 2 + 1 + 1
  assert.ok(summary.totalPerimeterM > 20);
  assert.ok(summary.totalClamps > 40);
  assert.ok(summary.totalSealantTubes >= 3);
  assert.ok(summary.costBreakdown.totalCost > 150);
  assert.equal(summary.items.length, 3);
});

test('generateInstallationKitWhatsAppMessage creates structured message with checklist items', () => {
  const openings = [
    { id: '1', name: 'Janela Sala', widthMm: 1500, heightMm: 1200, quantity: 1 },
  ];
  const summary = aggregateHardwareRequirements(openings);
  const message = generateInstallationKitWhatsAppMessage(summary, 'Dr. Roberto Miranda', 1042, 'Rua das Palmeiras, 300');

  assert.ok(message.includes('KIT DE INSUMOS DE FIXAÇÃO'));
  assert.ok(message.includes('OP #1042'));
  assert.ok(message.includes('Dr. Roberto Miranda'));
  assert.ok(message.includes('Rua das Palmeiras, 300'));
  assert.ok(message.includes('Grampos Chumbadores'));
  assert.ok(message.includes('Selante PU 40'));
  assert.ok(message.includes('Checklist de Carregamento'));
});

test('custom config overrides default values and prices correctly', () => {
  const openings = [{ id: '1', name: 'Vão Teste', widthMm: 1500, heightMm: 1200, quantity: 1 }];
  const customConfig = {
    clampSpacingMm: 300, // tighter spacing -> more clamps
    unitPrices: {
      ...DEFAULT_HARDWARE_CONFIG.unitPrices,
      clamp: 2.50, // doubled price
    },
  };

  const defaultSummary = aggregateHardwareRequirements(openings);
  const customSummary = aggregateHardwareRequirements(openings, customConfig);

  assert.ok(customSummary.totalClamps > defaultSummary.totalClamps);
  assert.ok(customSummary.costBreakdown.clampsCost > defaultSummary.costBreakdown.clampsCost);
});
