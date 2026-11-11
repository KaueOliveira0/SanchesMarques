import { test } from 'node:test';
import assert from 'node:assert';
import {
  analyzeSquareness,
  calculateFinishedDimensions,
  createSiteSurveyItem,
  RoughOpeningDimensions,
} from './siteSurveyMeasurement';

test('analyzeSquareness identifies perfect, tolerable, and critical out-of-square openings', () => {
  // Caso 1: Vão perfeito com diferença <= 3mm
  const perfect = analyzeSquareness(2000, 2001, 1600, 1200);
  assert.strictEqual(perfect.diffMm, 1);
  assert.strictEqual(perfect.status, 'PERFECT');
  assert.strictEqual(perfect.severity, 'success');

  // Caso 2: Tolerável (diferença entre 4mm e 8mm, ex: 6mm)
  const tolerable = analyzeSquareness(2000, 2006, 1600, 1200);
  assert.strictEqual(tolerable.diffMm, 6);
  assert.strictEqual(tolerable.status, 'TOLERABLE');
  assert.strictEqual(tolerable.severity, 'warning');
  assert.strictEqual(tolerable.distortionDirection, 'tilted_left');

  // Caso 3: Crítico / Fora de Esquadro (> 8mm, ex: 18mm)
  const critical = analyzeSquareness(2018, 2000, 1600, 1200);
  assert.strictEqual(critical.diffMm, 18);
  assert.strictEqual(critical.status, 'CRITICAL_OUT_OF_SQUARE');
  assert.strictEqual(critical.severity, 'danger');
  assert.strictEqual(critical.distortionDirection, 'tilted_right');
  assert.ok(critical.statusLabel.includes('CRÍTICO'));
  assert.ok(critical.recommendation.includes('ATENÇÃO'));
});

test('calculateFinishedDimensions deduces counterframe clearance from minimum measured point', () => {
  const rough: RoughOpeningDimensions = {
    widthTopMm: 1560,
    widthCenterMm: 1555, // menor largura
    widthBottomMm: 1558,
    heightLeftMm: 1260,
    heightCenterMm: 1262,
    heightRightMm: 1256, // menor altura
  };

  // Folga padrão de contramarco = 25mm por lado (50mm total)
  const result = calculateFinishedDimensions(rough, 25);

  assert.strictEqual(result.minRoughWidthMm, 1555);
  assert.strictEqual(result.maxRoughWidthMm, 1560);
  assert.strictEqual(result.widthVarianceMm, 5);

  assert.strictEqual(result.minRoughHeightMm, 1256);
  assert.strictEqual(result.maxRoughHeightMm, 1262);
  assert.strictEqual(result.heightVarianceMm, 6);

  // Medida final da esquadria = menor vão - 50mm
  assert.strictEqual(result.finishedFabricationWidthMm, 1555 - 50); // 1505mm
  assert.strictEqual(result.finishedFabricationHeightMm, 1256 - 50); // 1206mm

  // Medida externa do contramarco = menor vão - 20mm
  assert.strictEqual(result.counterFrameWidthMm, 1555 - 20); // 1535mm
  assert.strictEqual(result.counterFrameHeightMm, 1256 - 20); // 1236mm
});

test('createSiteSurveyItem builds valid survey item with automatic calculations', () => {
  const item = createSiteSurveyItem({
    orderId: 'ord_101',
    orderNumber: 101,
    clientName: 'Residencial Alphaville',
    roomName: 'Suíte Casal',
    typologyName: 'Janela de Correr 2 Folhas Suprema',
    widthTopMm: 1650,
    widthCenterMm: 1648,
    widthBottomMm: 1652,
    heightLeftMm: 1250,
    heightCenterMm: 1250,
    heightRightMm: 1248,
    diagonal1Mm: 2068,
    diagonal2Mm: 2072, // diff = 4mm (tolerável)
    clearanceMm: 25,
    technicalNotes: 'Piso acabado com porcelanato já instalado.',
  });

  assert.ok(item.id.startsWith('survey_'));
  assert.strictEqual(item.orderNumber, 101);
  assert.strictEqual(item.squareness.diffMm, 4);
  assert.strictEqual(item.squareness.status, 'TOLERABLE');
  assert.strictEqual(item.deduction.minRoughWidthMm, 1648);
  assert.strictEqual(item.deduction.finishedFabricationWidthMm, 1648 - 50);
  assert.strictEqual(item.plumbLevel.isLevelCompliant, true);
});
