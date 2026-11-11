import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRequiredInertia, KNOWN_PROFILES_INERTIA } from './structuralInertia.ts';
import { selectGlazingBead, GLAZING_BEADS_CATALOG } from './glazingBeadSelector.ts';
import { generateEsquadriaDxf } from './dxfExporter.ts';
import { compareLinesForSpan, BENCHMARK_LINES } from './lineBenchmarking.ts';
import { planVehicleLoading, TRANSPORT_FLEET, CargoItemToLoad } from './vehicleLoadPlanner.ts';
import { generateBarcodeSvg, createLabelsFromCutPieces, generatePrintableLabelsHtml } from './barcodeLabels.ts';
import { CutPiece } from '../types/index.ts';

test('structuralInertia calculates Ix_nec and approves robust Chroma profile', () => {
  // Janela padrão 1500 x 1200 com pressão de vento baixa (500 Pa)
  const resultLow = calculateRequiredInertia(1500, 1200, 500, 'SU-053');
  assert.equal(resultLow.isApproved, true);
  assert.ok(resultLow.actualIxCm4 >= resultLow.requiredIxCm4);

  // Porta alta 2000 x 2600 sob vento severo de 1500 Pa
  const resultHigh = calculateRequiredInertia(2000, 2600, 1500, 'SU-053');
  assert.equal(resultHigh.isApproved, false);
  assert.ok(resultHigh.requiredIxCm4 > resultHigh.actualIxCm4);
  assert.ok(resultHigh.recommendedReinforcement?.includes('Chroma') || resultHigh.recommendedReinforcement?.includes('aço'));

  // Testando com perfil reforçado Chroma CHR-040 (14.8 cm4) em vão de 1600 x 2100 sob 600 Pa
  const resultChroma = calculateRequiredInertia(1600, 2100, 600, 'CHR-040');
  assert.equal(resultChroma.isApproved, true);
  assert.equal(resultChroma.actualIxCm4, 14.8);
});

test('glazingBeadSelector selects appropriate bead for standard and insulated glass', () => {
  // Suprema com vidro 6mm
  const sup6 = selectGlazingBead('Suprema', 6, 'Temperado');
  assert.equal(sup6.series, 'Suprema');
  assert.equal(sup6.recommendedBead.code, 'SU-102');
  assert.equal(sup6.recommendedBead.beadWidthMm, 14);

  // Chroma com vidro duplo insulado de 18mm
  const chromaIns = selectGlazingBead('Chroma', 18, 'Insulado Termoacústico');
  assert.equal(chromaIns.series, 'Chroma');
  assert.equal(chromaIns.recommendedBead.code, 'CHR-104');
  assert.equal(chromaIns.recommendedBead.isInsulatedCompatible, true);
  assert.equal(chromaIns.recommendedBead.beadWidthMm, 8);
  assert.ok(chromaIns.technicianNotes.includes('insulado'));
});

test('dxfExporter generates compliant ASCII DXF with all required layers and dimensions', () => {
  const dxf = generateEsquadriaDxf({
    typologyCode: 'J-COR-2F-CHR',
    typologyName: 'Janela de Correr 2 Folhas Chroma',
    series: 'Chroma',
    widthMm: 1600,
    heightMm: 1200,
    leafCount: 2,
    orderNumber: 202,
    clientName: 'Residencial Aurora',
  });

  assert.ok(dxf.includes('SECTION'));
  assert.ok(dxf.includes('HEADER'));
  assert.ok(dxf.includes('AC1009'));
  assert.ok(dxf.includes('MARCO_EXTERNO'));
  assert.ok(dxf.includes('FOLHAS_MOVEL'));
  assert.ok(dxf.includes('VIDRO_TEMPERADO'));
  assert.ok(dxf.includes('COTAS_MEDIDAS'));
  assert.ok(dxf.includes('TEXTOS_LEGENDA'));
  assert.ok(dxf.includes('L = 1600 mm'));
  assert.ok(dxf.includes('H = 1200 mm'));
  assert.ok(dxf.includes('EOF'));
});

test('lineBenchmarking compares 5 lines and computes relative weights and acoustic ratings', () => {
  const comparison = compareLinesForSpan(1500, 1200, 35, 'janela');
  assert.equal(comparison.length, 5);

  const chroma = comparison.find((c) => c.spec.series === 'Chroma')!;
  const suprema = comparison.find((c) => c.spec.series === 'Suprema')!;
  const gold = comparison.find((c) => c.spec.series === 'Gold')!;

  assert.ok(chroma);
  assert.ok(suprema);
  assert.ok(gold);

  // Chroma tem maior atenuação acústica que Suprema
  assert.ok(chroma.spec.acousticAttenuationDb > suprema.spec.acousticAttenuationDb);
  // Gold tem maior peso que Suprema
  assert.ok(gold.estimatedWeightKg > suprema.estimatedWeightKg);
  // Preços sugeridos calculados
  assert.ok(chroma.suggestedSalePrice > 0);
});

test('vehicleLoadPlanner sequences items in LIFO order and checks axle balance', () => {
  const vehicle = TRANSPORT_FLEET[0]; // Fiorino (650kg)
  const items: CargoItemToLoad[] = [
    {
      id: 'it-1',
      orderNumber: 101,
      clientName: 'Cliente Primeiro (Entrega 1)',
      destinationAddress: 'Rua das Flores 10',
      deliverySequence: 1,
      description: 'Janela 2F Suprema',
      widthMm: 1500,
      heightMm: 1200,
      weightKg: 25,
      isFragileGlass: false,
    },
    {
      id: 'it-2',
      orderNumber: 102,
      clientName: 'Cliente Último (Entrega 2)',
      destinationAddress: 'Av Paulista 200',
      deliverySequence: 2,
      description: 'Porta 4F Gold',
      widthMm: 2200,
      heightMm: 2400,
      weightKg: 85,
      isFragileGlass: true,
    },
  ];

  const plan = planVehicleLoading(vehicle, items);
  assert.equal(plan.totalCargoWeightKg, 110);
  assert.equal(plan.isOverweight, false);
  assert.equal(plan.slots.length, 2);

  // LIFO: O item com entrega 2 (última) deve ser o primeiro a ser carregado (loadOrder 1)
  assert.equal(plan.slots[0].item.deliverySequence, 2);
  assert.equal(plan.slots[1].item.deliverySequence, 1);
});

test('barcodeLabels produces valid SVG and printable HTML document', () => {
  const samplePieces: CutPiece[] = [
    {
      id: 'p-1',
      orderNumber: 101,
      itemTag: 'Dormitório 1',
      profileCode: 'CHR-001',
      profileName: 'Marco Superior',
      length: 1470,
      angleLeft: 45,
      angleRight: 45,
      description: 'Marco',
      color: 'Branco',
      barcode: '101-CHR-001-1470-1',
    },
  ];

  const labels = createLabelsFromCutPieces(samplePieces, 'Dr. Eduardo');
  assert.equal(labels.length, 1);
  assert.equal(labels[0].profileCode, 'CHR-001');

  const svg = generateBarcodeSvg('SMQ-101-CHR-001-1470');
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('rect'));

  const html = generatePrintableLabelsHtml(labels, 'termica_100x50');
  assert.ok(html.includes('SANCHES & MARQUES'));
  assert.ok(html.includes('CHR-001'));
  assert.ok(html.includes('1470'));
});
