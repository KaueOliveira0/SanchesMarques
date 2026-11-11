import { test } from 'node:test';
import assert from 'node:assert';
import {
  parseDimensions,
  calculateRomaneioItemMetrics,
  calculateRomaneioDetailedTotals,
  generateRomaneioPdfHtml,
  generateRomaneioWhatsAppText,
} from './romaneioPdf';
import { DeliveryRomaneio } from '../types';

test('parseDimensions parses various dimension formats accurately', () => {
  // mm with ×
  const d1 = parseDimensions('1500 × 1200 mm');
  assert.deepStrictEqual(d1, { widthMm: 1500, heightMm: 1200 });

  // mm with x
  const d2 = parseDimensions('2000x2400');
  assert.deepStrictEqual(d2, { widthMm: 2000, heightMm: 2400 });

  // meters format (e.g. 1.5 x 1.2 m)
  const d3 = parseDimensions('1.5 x 1.2 m');
  assert.deepStrictEqual(d3, { widthMm: 1500, heightMm: 1200 });

  // invalid/accessory dimension
  const d4 = parseDimensions('5/16" × 75mm');
  // It shouldn't match two standard positive integers as W x H or if it doesn't match standard dimensions
  // let's check
  const d5 = parseDimensions('Avulso');
  assert.strictEqual(d5, null);
});

test('calculateRomaneioItemMetrics computes unit and total area and weights', () => {
  const item = {
    description: 'Janela de Correr 2 Folhas (Suprema)',
    dimensions: '1500 × 1200 mm',
    quantity: 2,
    location: 'Quarto 1',
    weightKg: 50.4,
  };

  const metrics = calculateRomaneioItemMetrics(item);
  assert.strictEqual(metrics.quantity, 2);
  assert.strictEqual(metrics.isEsquadria, true);
  assert.strictEqual(metrics.unitAreaM2, 1.8);
  assert.strictEqual(metrics.totalAreaM2, 3.6);
  assert.strictEqual(metrics.unitWeightKg, 25.2);
  assert.strictEqual(metrics.totalWeightKg, 50.4);
});

test('calculateRomaneioItemMetrics handles non-rectangular accessories gracefully', () => {
  const item = {
    description: '500 Chumbadores de Aço com Bucha 8mm',
    dimensions: 'Avulso',
    quantity: 500,
    location: 'Obra / Alvenaria',
    weightKg: 18,
  };

  const metrics = calculateRomaneioItemMetrics(item);
  assert.strictEqual(metrics.isEsquadria, false);
  assert.strictEqual(metrics.unitAreaM2, 0);
  assert.strictEqual(metrics.totalAreaM2, 0);
  assert.strictEqual(metrics.totalWeightKg, 18);
});

test('calculateRomaneioDetailedTotals aggregates area, weight and density', () => {
  const items = [
    {
      description: 'Janela 2 Folhas',
      dimensions: '1500 × 1200 mm', // 1.8m² each
      quantity: 2, // 3.6m²
      location: 'Sala',
      weightKg: 50,
    },
    {
      description: 'Porta de Correr 2 Folhas',
      dimensions: '2000 × 2400 mm', // 4.8m² each
      quantity: 1, // 4.8m²
      location: 'Varanda',
      weightKg: 72,
    },
    {
      description: 'Chumbadores',
      dimensions: 'Padrão',
      quantity: 100,
      location: 'Fixação',
      weightKg: 8,
    },
  ];

  const { detailedItems, totals } = calculateRomaneioDetailedTotals(items);
  assert.strictEqual(detailedItems.length, 3);
  assert.strictEqual(totals.totalPieces, 103);
  assert.strictEqual(totals.totalAreaM2, 8.4); // 3.6 + 4.8
  assert.strictEqual(totals.totalWeightKg, 130); // 50 + 72 + 8
  assert.strictEqual(totals.esquadriasCount, 3); // 2 + 1
  assert.strictEqual(totals.accessoriesCount, 100);
  assert.ok(totals.avgKgPerM2 > 0);
});

test('generateRomaneioPdfHtml produces valid HTML with tables and signatures', () => {
  const romaneio: DeliveryRomaneio = {
    id: 'rom_123',
    number: 1001,
    orderId: 'ord_123',
    orderNumber: 101,
    clientName: 'Residencial Alphaville',
    address: 'Av. das Flores, 120',
    date: '2026-11-03',
    driverName: 'Carlos Silveira',
    vehiclePlate: 'BRA-2E19',
    invoiceNumber: 'NF-e 4921',
    status: 'Em Trânsito',
    items: [
      {
        description: 'Janela Suprema 2 Folhas',
        dimensions: '1500 × 1200 mm',
        quantity: 2,
        location: 'Quarto 01',
        weightKg: 45,
      },
    ],
  };

  const html = generateRomaneioPdfHtml(romaneio);
  assert.ok(html.includes('ROMANEIO Nº 1001'));
  assert.ok(html.includes('Residencial Alphaville'));
  assert.ok(html.includes('Carlos Silveira'));
  assert.ok(html.includes('BRA-2E19'));
  assert.ok(html.includes('1.80 m²'));
  assert.ok(html.includes('3.60 m²'));
  assert.ok(html.includes('45.0 kg'));
  assert.ok(html.includes('DECLARAÇÃO DE CONFERÊNCIA'));
});

test('generateRomaneioWhatsAppText outputs formatted message', () => {
  const romaneio: DeliveryRomaneio = {
    id: 'rom_123',
    number: 1001,
    orderId: 'ord_123',
    orderNumber: 101,
    clientName: 'Dra. Camila',
    address: 'Rua Bela Vista, 88',
    date: '2026-11-03',
    driverName: 'Marcos',
    vehiclePlate: 'ABC-1234',
    invoiceNumber: 'NF 1234',
    status: 'Separado',
    items: [
      {
        description: 'Porta Linha Gold',
        dimensions: '2000 × 2400 mm',
        quantity: 1,
        location: 'Sala',
        weightKg: 65,
      },
    ],
  };

  const text = generateRomaneioWhatsAppText(romaneio);
  assert.ok(text.includes('ROMANEIO DE EXPEDIÇÃO Nº 1001'));
  assert.ok(text.includes('Dra. Camila'));
  assert.ok(text.includes('Porta Linha Gold'));
  assert.ok(text.includes('4.80m²'));
  assert.ok(text.includes('65.0kg'));
});
