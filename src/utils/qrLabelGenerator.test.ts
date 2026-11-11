import { test } from 'node:test';
import assert from 'node:assert';
import {
  generateItemQrPayload,
  parseItemQrPayload,
  calculateLabelMetrics,
  formatProductionLabelData,
} from './qrLabelGenerator';
import { Order, OrderItem } from '../types';

test('generateItemQrPayload generates compact format', () => {
  const payload = generateItemQrPayload(1001, 'item_3');
  assert.strictEqual(payload, 'SMPRO:O1001:Iitem_3');
});

test('parseItemQrPayload extracts orderNumber and itemId correctly', () => {
  const parsed = parseItemQrPayload('SMPRO:O1001:Iitem_3');
  assert.deepStrictEqual(parsed, { orderNumber: 1001, itemId: 'item_3' });

  // Test variant with ORD and ITEM
  const parsed2 = parseItemQrPayload('SMPRO:ORD2050:ITEM5');
  assert.deepStrictEqual(parsed2, { orderNumber: 2050, itemId: '5' });

  // Test fallback to plain number
  const parsed3 = parseItemQrPayload('#1045');
  assert.strictEqual(parsed3?.orderNumber, 1045);
});

test('calculateLabelMetrics computes accurate area and default weight', () => {
  const metrics = calculateLabelMetrics(1500, 1200);
  assert.strictEqual(metrics.areaM2, 1.8);
  assert.strictEqual(metrics.weightKg, 26.1); // 1.8 * 14.5

  // When explicit weight provided
  const metricsWithWeight = calculateLabelMetrics(1500, 1200, 32.5);
  assert.strictEqual(metricsWithWeight.weightKg, 32.5);
});

test('formatProductionLabelData formats complete production label', () => {
  const mockOrder: Order = {
    id: 'ord_1',
    number: 1001,
    clientName: 'Residencial Alphaville',
    clientPhone: '11999999999',
    deliveryDate: '2026-11-20',
    createdAt: '2026-11-01',
    status: 'Em Produção',
    productionStep: 'Corte CNC',
    color: 'Preto',
    items: [],
    totalWeightKg: 50,
    totalGlassM2: 3.5,
    materialCost: 2000,
    laborCost: 1000,
    subtotal: 3000,
    finalPrice: 3000,
    history: [],
  };

  const mockItem: OrderItem = {
    id: 'it_01',
    typologyId: 'typ_cor2_sup',
    typologyName: 'Janela de Correr 2 Folhas (Suprema)',
    width: 1500,
    height: 1200,
    quantity: 1,
    roomTag: 'J01 - Suíte Master',
    color: 'Preto',
    aluminumColor: 'Preto Fosco Microtexturizado',
    glassId: 'gl_lam_6',
    glassType: 'Vidro Laminado 6mm Incolor',
  };

  const label = formatProductionLabelData(mockOrder, mockItem);

  assert.strictEqual(label.orderNumber, 1001);
  assert.strictEqual(label.clientName, 'Residencial Alphaville');
  assert.strictEqual(label.roomTag, 'J01 - Suíte Master');
  assert.strictEqual(label.widthMm, 1500);
  assert.strictEqual(label.heightMm, 1200);
  assert.strictEqual(label.color, 'Preto Fosco Microtexturizado');
  assert.strictEqual(label.qrPayload, 'SMPRO:O1001:Iit_01');
});
