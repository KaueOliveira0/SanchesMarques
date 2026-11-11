import { test } from 'node:test';
import assert from 'node:assert';
import {
  EXTRUDERS_DIRECTORY,
  calculateVolumeNegotiation,
  filterOrdersForConsolidation,
  consolidatePurchaseOrders,
  exportPurchaseOrderCsv,
  generateExtruderWhatsAppQuote,
  createExtruderWhatsAppUrl,
  ConsolidatorPiece,
  ProfileCatalogEntry,
} from './purchaseOrderConsolidator';
import { Order } from '../types';

test('EXTRUDERS_DIRECTORY contains national extruders (Belmetal, Hydro, Alcoa, Miranda, CBA)', () => {
  assert.ok(EXTRUDERS_DIRECTORY.length >= 5);
  const names = EXTRUDERS_DIRECTORY.map((e) => e.tradeName);
  assert.ok(names.includes('Belmetal'));
  assert.ok(names.includes('Hydro Extrusões'));
  assert.ok(names.includes('Alcoa / Kawneer'));
  assert.ok(names.includes('Miranda Alumínio'));
  assert.ok(names.includes('CBA (Cia. Brasileira de Alumínio)'));
});

test('calculateVolumeNegotiation handles retail, 1 ton, and multi-ton tiers accurately', () => {
  const belmetal = EXTRUDERS_DIRECTORY.find((e) => e.id === 'belmetal')!;

  // 1. Varejo: 200 kg
  const res200 = calculateVolumeNegotiation(200, belmetal);
  assert.strictEqual(res200.totalWeightKg, 200);
  assert.strictEqual(res200.totalTons, 0.2);
  assert.strictEqual(res200.currentTier.pricePerKg, 38.0);
  assert.strictEqual(res200.totalSavingsR$, 0);
  assert.ok(res200.nextTier !== null);
  assert.strictEqual(res200.missingKgToNextTier, 100); // 300 - 200

  // 2. 1 Tonelada: 1.000 kg
  const res1000 = calculateVolumeNegotiation(1000, belmetal);
  assert.strictEqual(res1000.totalTons, 1.0);
  assert.strictEqual(res1000.currentTier.pricePerKg, 32.5); // Faixa 1 Ton
  assert.ok(res1000.totalSavingsR$ > 0); // 1000 * (38 - 32.5) = 5500
  assert.strictEqual(res1000.totalSavingsR$, 5500);
  assert.strictEqual(res1000.missingKgToNextTier, 500); // 1500 - 1000

  // 3. Carga máxima: 3.500 kg (3.5 tons)
  const res3500 = calculateVolumeNegotiation(3500, belmetal);
  assert.strictEqual(res3500.currentTier.pricePerKg, 27.0);
  assert.strictEqual(res3500.nextTier, null);
  assert.strictEqual(res3500.missingKgToNextTier, 0);
});

test('filterOrdersForConsolidation filters by approval status and time periods', () => {
  const refDate = new Date('2026-10-31T12:00:00Z');

  const orders: Partial<Order>[] = [
    {
      id: 'ord_1',
      number: 101,
      status: 'Aprovado',
      createdAt: '2026-10-30T10:00:00Z', // Ontem (essa semana)
      clientName: 'Cliente 1',
    },
    {
      id: 'ord_2',
      number: 102,
      status: 'Orçamento', // Não aprovado
      createdAt: '2026-10-29T10:00:00Z',
      clientName: 'Cliente 2',
    },
    {
      id: 'ord_3',
      number: 103,
      status: 'Em Produção',
      createdAt: '2026-10-05T10:00:00Z', // Este mês, mas > 7 dias
      clientName: 'Cliente 3',
    },
    {
      id: 'ord_4',
      number: 104,
      status: 'Aprovado',
      createdAt: '2026-08-01T10:00:00Z', // Mês passado
      clientName: 'Cliente 4',
    },
  ];

  // Apenas aprovados desta semana
  const thisWeek = filterOrdersForConsolidation(orders as Order[], {
    period: 'this_week',
    includeOnlyApproved: true,
    referenceDate: refDate,
  });
  assert.strictEqual(thisWeek.length, 1);
  assert.strictEqual(thisWeek[0].id, 'ord_1');

  // Aprovados deste mês
  const thisMonth = filterOrdersForConsolidation(orders as Order[], {
    period: 'this_month',
    includeOnlyApproved: true,
    referenceDate: refDate,
  });
  assert.strictEqual(thisMonth.length, 2); // ord_1 e ord_3

  // Incluindo orçamentos
  const withQuotes = filterOrdersForConsolidation(orders as Order[], {
    period: 'this_week',
    includeOnlyApproved: false,
    referenceDate: refDate,
  });
  assert.strictEqual(withQuotes.length, 2); // ord_1 e ord_2
});

test('consolidatePurchaseOrders aggregates pieces into 6m bars, bundles, and color batches', () => {
  const pieces: ConsolidatorPiece[] = [
    { id: '1', orderNumber: 101, profileCode: 'SU-001', length: 1500, color: 'Branco' },
    { id: '2', orderNumber: 101, profileCode: 'SU-001', length: 1500, color: 'Branco' },
    { id: '3', orderNumber: 101, profileCode: 'SU-001', length: 1500, color: 'Branco' },
    { id: '4', orderNumber: 101, profileCode: 'SU-001', length: 1500, color: 'Branco' }, // total 6000mm (+5% margem = 6300mm -> 2 barras)
    { id: '5', orderNumber: 102, profileCode: 'GL-002', length: 2200, color: 'Preto' },
  ];

  const profileDir: ProfileCatalogEntry[] = [
    { code: 'SU-001', name: 'Marco Lateral Suprema', weightPerMeterKg: 0.65, series: 'Suprema' },
    { code: 'GL-002', name: 'Trilho Superior Gold', weightPerMeterKg: 1.10, series: 'Gold' },
  ];

  const batches = consolidatePurchaseOrders(pieces, profileDir, {
    extruderId: 'belmetal',
    safetyMarginPercent: 5,
  });

  assert.strictEqual(batches.length, 2); // Um lote Branco e um lote Preto

  const whiteBatch = batches.find((b) => b.color === 'Branco')!;
  assert.ok(whiteBatch);
  assert.strictEqual(whiteBatch.items.length, 1);
  assert.strictEqual(whiteBatch.items[0].totalBars6000, 2);
  assert.strictEqual(whiteBatch.supplierName, 'Belmetal Indústria e Comércio de Alumínio Ltda.');

  const blackBatch = batches.find((b) => b.color === 'Preto')!;
  assert.ok(blackBatch);
  assert.strictEqual(blackBatch.items[0].totalBars6000, 1);
});

test('generateExtruderWhatsAppQuote and exportPurchaseOrderCsv output complete, valid formats', () => {
  const pieces: ConsolidatorPiece[] = [
    { id: '1', orderNumber: 101, profileCode: 'SU-001', length: 2000, color: 'Branco' },
  ];
  const profileDir: ProfileCatalogEntry[] = [
    { code: 'SU-001', name: 'Marco Lateral', weightPerMeterKg: 0.65, series: 'Suprema' },
  ];
  const belmetal = EXTRUDERS_DIRECTORY.find((e) => e.id === 'belmetal')!;
  const orders = consolidatePurchaseOrders(pieces, profileDir, { extruderId: 'belmetal' });
  const vol = calculateVolumeNegotiation(500, belmetal);

  const text = generateExtruderWhatsAppQuote(orders, belmetal, vol, 1);
  assert.ok(text.includes('Belmetal'));
  assert.ok(text.includes('SANCHES & MARQUES'));
  assert.ok(text.includes('SU-001'));
  assert.ok(text.includes('tonelada'));

  const url = createExtruderWhatsAppUrl(belmetal.repContact.phone, text);
  assert.ok(url.startsWith('https://api.whatsapp.com/send?phone=5511987651100'));
  assert.ok(url.includes(encodeURIComponent('Belmetal')));

  const csv = exportPurchaseOrderCsv(orders[0]);
  assert.ok(csv.includes('FORNECEDOR'));
  assert.ok(csv.includes('Belmetal'));
  assert.ok(csv.includes('Codigo_Perfil'));
  assert.ok(csv.includes('TOTAL_GERAL'));
});
