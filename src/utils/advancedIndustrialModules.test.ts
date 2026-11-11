import { test } from 'node:test';
import assert from 'node:assert';
import { optimizeGlassNesting2D, GlassPaneToNest } from './glassNesting2d';
import { calculateWindowThermalPerformance } from './thermalCalculator';
import { consolidatePurchaseOrders, exportPurchaseOrderCsv } from './purchaseOrderConsolidator';
import { getPunchOperationsForProfile, PUNCH_PRESS_MACHINES } from './punchToolingGuide';
import { evaluateQualityInspection, generateWarrantyCertificateHtml } from './qualityControlCert';
import { calculateGuardrailCompliance } from './guardrailStructural';

test('glassNesting2D packs pieces efficiently onto standard 3210x2250mm sheet', () => {
  const panes: GlassPaneToNest[] = [
    {
      id: 'pane_1',
      orderNumber: 101,
      clientName: 'Residencial Alphaville',
      description: 'Vidro Folha Janela Suprema',
      widthMm: 655,
      heightMm: 1055,
      quantity: 4,
      glassType: 'Temperado Incolor',
      thicknessMm: 6,
    },
    {
      id: 'pane_2',
      orderNumber: 102,
      clientName: 'Dra Camila',
      description: 'Vidro Maxim-Ar Suprema',
      widthMm: 550,
      heightMm: 550,
      quantity: 2,
      glassType: 'Temperado Incolor',
      thicknessMm: 6,
    },
  ];

  const result = optimizeGlassNesting2D(panes, { sheetWidthMm: 3210, sheetHeightMm: 2250 });

  assert.strictEqual(result.totalPanesRequested, 6);
  assert.strictEqual(result.totalPanesPlaced, 6);
  assert.strictEqual(result.totalSheetsRequired, 1);
  assert.ok(result.overallEfficiencyPercent > 0);
  assert.ok(result.sheets[0].placedPanes.length === 6);
  assert.ok(result.sheets[0].usableAreaM2 > 0);
});

test('thermalCalculator calculates Uw, solar heat gain, and NBR 15575 compliance', () => {
  // Teste 1: Janela comum com vidro float 4mm (baixo isolamento)
  const commonWindow = calculateWindowThermalPerformance({
    widthMm: 1500,
    heightMm: 1200,
    frameType: 'alum_sem_ruptura',
    glassType: 'comum_incolor',
  });

  assert.ok(commonWindow.uWindowW_M2K > 5.0);
  assert.strictEqual(commonWindow.nbr15575Compliance.status, 'Não Atende');

  const insulatedWindow = calculateWindowThermalPerformance({
    widthMm: 1500,
    heightMm: 1200,
    frameType: 'alum_sem_ruptura',
    glassType: 'duplo_insulado_ar',
  });
  assert.strictEqual(insulatedWindow.nbr15575Compliance.status, 'Conforme - Nível Intermediário');

  // Teste 2: Janela de alta performance com vidro Low-E insulado
  const highPerfWindow = calculateWindowThermalPerformance({
    widthMm: 1500,
    heightMm: 1200,
    frameType: 'alum_sem_ruptura',
    glassType: 'low_e_insulado',
  });

  assert.ok(highPerfWindow.uWindowW_M2K < 3.0);
  assert.ok(highPerfWindow.nbr15575Compliance.annualKwhSavedPerM2 > 30);
  assert.ok(highPerfWindow.comparativeOptions.length >= 4);
});

test('purchaseOrderConsolidator aggregates cutting requirements and outputs CSV', () => {
  const pieces = [
    {
      id: '1',
      orderNumber: 101,
      profileCode: 'SU-001',
      profileName: 'Marco Lateral',
      length: 1200,
      angleLeft: 90,
      angleRight: 90,
      color: 'Branco',
    },
    {
      id: '2',
      orderNumber: 101,
      profileCode: 'SU-001',
      profileName: 'Marco Lateral',
      length: 1200,
      angleLeft: 90,
      angleRight: 90,
      color: 'Branco',
    },
    {
      id: '3',
      orderNumber: 101,
      profileCode: 'CHR-020',
      profileName: 'Montante Chroma',
      length: 2200,
      angleLeft: 90,
      angleRight: 90,
      color: 'Preto',
    },
  ];

  const profileDir = [
    { code: 'SU-001', name: 'Marco Lateral 2 Planos', weightPerMeterKg: 0.65, series: 'Suprema', pricePerKg: 35 },
    { code: 'CHR-020', name: 'Montante Folha Chroma', weightPerMeterKg: 0.72, series: 'Chroma', pricePerKg: 38 },
  ];

  const orders = consolidatePurchaseOrders(pieces, profileDir);

  assert.ok(orders.length >= 1);
  const totalBars = orders.reduce((acc, o) => acc + o.totalBars6000, 0);
  assert.ok(totalBars >= 2);

  const csv = exportPurchaseOrderCsv(orders[0]);
  assert.ok(csv.includes('FORNECEDOR'));
  assert.ok(csv.includes('Codigo_Perfil'));
});

test('punchToolingGuide maps stations and operations for profiles', () => {
  assert.ok(PUNCH_PRESS_MACHINES.length >= 3);

  // Perfil Suprema SU-053
  const toolingSuprema = getPunchOperationsForProfile('SU-053');
  assert.ok(toolingSuprema !== null);
  assert.ok(toolingSuprema.operations.some((op) => op.punchType === 'rasgo_fecho'));

  // Perfil Chroma CHR-020
  const toolingChroma = getPunchOperationsForProfile('CHR-020');
  assert.ok(toolingChroma !== null);
  assert.ok(toolingChroma.machine.series.includes('Chroma'));
});

test('qualityControlCert evaluates squareness tolerance under NBR 10821', () => {
  // Teste de esquadro aprovado: D1 = 1850mm, D2 = 1851mm (|D1 - D2| = 1mm <= 2mm)
  const approvedInspection = evaluateQualityInspection({
    orderNumber: 101,
    clientName: 'Residencial Alphaville',
    typologyCode: 'J-COR-2F-SUP',
    typologyName: 'Janela de Correr 2 Folhas',
    widthMm: 1500,
    heightMm: 1200,
    diagonal1Mm: 1920.5,
    diagonal2Mm: 1921.5,
  });

  assert.strictEqual(approvedInspection.diagonalDifferenceMm, 1.0);
  assert.strictEqual(approvedInspection.isSquareApproved, true);
  assert.strictEqual(approvedInspection.overallApproved, true);

  const html = generateWarrantyCertificateHtml(approvedInspection);
  assert.ok(html.includes('SANCHES & MARQUES'));
  assert.ok(html.includes('QUALIDADE APROVADA'));
  assert.ok(html.includes('TERMO DE GARANTIA DE 5 ANOS'));

  // Teste de esquadro reprovado: D1 = 1920mm, D2 = 1924mm (|D1 - D2| = 4mm > 2mm)
  const rejectedInspection = evaluateQualityInspection({
    orderNumber: 102,
    clientName: 'Cliente Teste',
    typologyCode: 'J-COR-2F-SUP',
    typologyName: 'Janela de Correr 2 Folhas',
    widthMm: 1500,
    heightMm: 1200,
    diagonal1Mm: 1920,
    diagonal2Mm: 1924,
  });

  assert.strictEqual(rejectedInspection.isSquareApproved, false);
  assert.strictEqual(rejectedInspection.overallApproved, false);
});

test('guardrailStructural enforces NBR 14718 safety standards and rejects unlaminated glass', () => {
  // Cenário 1: Vidro monolítico não laminado (PROIBIDO)
  const unsafeGuardrail = calculateGuardrailCompliance({
    totalLengthM: 4.0,
    heightMm: 1100,
    buildingUsage: 'residencial_coletivo',
    systemType: 'pontalete_coluna',
    glassType: 'temperado_monolitico',
    interlayerType: 'pvb_076',
    anchorageType: 'chumbador_quimico_inox',
  });

  assert.strictEqual(unsafeGuardrail.glassSafetyApproved, false);
  assert.strictEqual(unsafeGuardrail.overallApproved, false);
  assert.ok(unsafeGuardrail.glassSafetyWarning?.includes('PROIBIDO PELA NBR 14718'));

  // Cenário 2: Guarda-corpo de alto padrão com vidro laminado temperado e altura 1100mm (APROVADO)
  const safeGuardrail = calculateGuardrailCompliance({
    totalLengthM: 4.0,
    heightMm: 1100,
    buildingUsage: 'residencial_coletivo',
    systemType: 'pontalete_coluna',
    glassType: 'laminado_temperado_10mm',
    interlayerType: 'pvb_152',
    anchorageType: 'chumbador_quimico_inox',
  });

  assert.strictEqual(safeGuardrail.normativeHeightApproved, true);
  assert.strictEqual(safeGuardrail.glassSafetyApproved, true);
  assert.strictEqual(safeGuardrail.softBodyImpactTestResult.approved, true);
  assert.strictEqual(safeGuardrail.anchorageApproved, true);
  assert.strictEqual(safeGuardrail.overallApproved, true);
  assert.ok(safeGuardrail.billOfMaterials.length >= 4);
});
