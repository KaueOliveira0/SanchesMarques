import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeProfileCode,
  findMatchingProfile,
  buildPricingMatrix,
  applyPricingMatrix,
  applyColorMultipliersUpdate,
  extractPricingFromTextHeuristic,
  OcrDetectedPriceItem,
} from './pricingOcrParser';
import { ProfileDefinition } from '../types';

const mockCatalog: ProfileDefinition[] = [
  {
    id: 'prof_su001',
    code: 'SU-001',
    name: 'Trilho Superior 2 Planos',
    series: 'Suprema',
    category: 'Trilho',
    kgm: 0.684,
    defaultLength: 6000,
    pricePerKg: 32.0,
  },
  {
    id: 'prof_gl002',
    code: 'GL-002',
    name: 'Marco Inferior Gold',
    series: 'Gold',
    category: 'Marco',
    kgm: 1.28,
    defaultLength: 6000,
    pricePerKg: 34.0,
  },
];

test('normalizeProfileCode standardizes codes with various punctuation and casing', () => {
  assert.equal(normalizeProfileCode('su-001'), 'SU-001');
  assert.equal(normalizeProfileCode('su001'), 'SU-001');
  assert.equal(normalizeProfileCode('gl 002'), 'GL-002');
  assert.equal(normalizeProfileCode('chr_020'), 'CHR-020');
  assert.equal(normalizeProfileCode('mn053'), 'MN-053');
});

test('findMatchingProfile finds profiles with hyphen tolerance and casing', () => {
  const match1 = findMatchingProfile('SU-001', mockCatalog);
  assert.ok(match1);
  assert.equal(match1?.code, 'SU-001');

  const match2 = findMatchingProfile('su001', mockCatalog);
  assert.ok(match2);
  assert.equal(match2?.code, 'SU-001');

  const match3 = findMatchingProfile('gl-002', mockCatalog);
  assert.ok(match3);
  assert.equal(match3?.code, 'GL-002');

  const matchNone = findMatchingProfile('AL-999', mockCatalog);
  assert.equal(matchNone, undefined);
});

test('buildPricingMatrix calculates price variances, differences and summaries', () => {
  const detectedItems: OcrDetectedPriceItem[] = [
    {
      code: 'SU-001',
      pricePerKg: 36.8, // Old is 32.0 -> +4.80 (+15.0%)
    },
    {
      code: 'GL-002',
      pricePerKg: 34.0, // Old is 34.0 -> 0 (0.0%)
    },
    {
      code: 'MN-999', // New profile
      name: 'Perfil Novo Teste',
      series: 'Chroma',
      kgm: 1.1,
      pricePerKg: 42.0,
    },
  ];

  const matrix = buildPricingMatrix(detectedItems, mockCatalog, { Branco: 1.12 }, 'Fornecedor Alpha');

  assert.equal(matrix.supplier, 'Fornecedor Alpha');
  assert.equal(matrix.rows.length, 3);

  // Row 1 (SU-001)
  const row1 = matrix.rows[0];
  assert.equal(row1.code, 'SU-001');
  assert.equal(row1.isNewProfile, false);
  assert.equal(row1.currentPricePerKg, 32.0);
  assert.equal(row1.detectedPricePerKg, 36.8);
  assert.equal(row1.priceDiff, 4.8);
  assert.equal(row1.variancePct, 15.0);

  // Row 2 (GL-002)
  const row2 = matrix.rows[1];
  assert.equal(row2.priceDiff, 0);
  assert.equal(row2.variancePct, 0);

  // Row 3 (MN-999)
  const row3 = matrix.rows[2];
  assert.equal(row3.isNewProfile, true);
  assert.equal(row3.currentPricePerKg, null);

  // Summary
  assert.equal(matrix.summary.totalDetected, 3);
  assert.equal(matrix.summary.matchedCount, 2);
  assert.equal(matrix.summary.newCount, 1);
});

test('applyPricingMatrix updates existing profiles and adds new ones seamlessly', () => {
  const detectedItems: OcrDetectedPriceItem[] = [
    { code: 'SU-001', pricePerKg: 38.0 },
    { code: 'NEW-01', name: 'Perfil Inédito', series: 'Universal', kgm: 0.85, pricePerKg: 35.5 },
  ];

  const matrix = buildPricingMatrix(detectedItems, mockCatalog);
  const { updatedProfiles, updatedCount, addedCount } = applyPricingMatrix(mockCatalog, matrix.rows, {
    addNewProfiles: true,
  });

  assert.equal(updatedCount, 1);
  assert.equal(addedCount, 1);
  assert.equal(updatedProfiles.length, 3);

  const updatedSu = updatedProfiles.find((p) => p.code === 'SU-001');
  assert.equal(updatedSu?.pricePerKg, 38.0);

  const newProf = updatedProfiles.find((p) => p.code === 'NEW-01');
  assert.ok(newProf);
  assert.equal(newProf?.pricePerKg, 35.5);
  assert.equal(newProf?.kgm, 0.85);
});

test('applyColorMultipliersUpdate validates and bounds multipliers', () => {
  const current = { Branco: 1.1, Preto: 1.15 };
  const detected = { Branco: 1.14, Preto: 1.18, Amadeirado: 1.45 };

  const merged = applyColorMultipliersUpdate(current, detected);
  assert.equal(merged['Branco'], 1.14);
  assert.equal(merged['Preto'], 1.18);
  assert.equal(merged['Amadeirado'], 1.45);
});

test('extractPricingFromTextHeuristic parses raw price lists with Brazilian formats', () => {
  const rawText = `
    TABELA DE PREÇOS BELMETAL 2026
    Branco: 1.12 | Preto: 1.15 | Bronze: 1.20 | Amadeirado: 1.45
    SU-001 | Trilho Superior 2 Planos | 0,684 kg/m | R$ 38,50
    GL-002 | Marco Inferior 2 Planos  | 1,280 kg/m | R$ 37,80
  `;

  const parsed = extractPricingFromTextHeuristic(rawText);
  assert.equal(parsed.supplier, 'BELMETAL');
  assert.ok(parsed.colorMultipliers);
  assert.equal(parsed.colorMultipliers['Branco'], 1.12);
  assert.equal(parsed.items.length, 2);
  assert.equal(parsed.items[0].code, 'SU-001');
  assert.equal(parsed.items[0].pricePerKg, 38.5);
  assert.equal(parsed.items[1].code, 'GL-002');
  assert.equal(parsed.items[1].pricePerKg, 37.8);
});
