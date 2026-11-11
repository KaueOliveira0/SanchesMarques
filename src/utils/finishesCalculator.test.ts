import { test } from 'node:test';
import assert from 'node:assert';
import {
  findFinishByIdOrCode,
  calculateFinishCostImpact,
  mapFinishToColorCategory,
  applyFinishToOrder,
} from './finishesCalculator';
import { ALUMINUM_FINISHES_CATALOG } from '../data/finishesCatalog';
import { Order } from '../types';

test('findFinishByIdOrCode finds finishes by ID or commercial code', () => {
  const white = findFinishByIdOrCode('branco-ral-9003');
  assert.ok(white);
  assert.strictEqual(white?.commercialCode, 'P-BR-9003');

  const black = findFinishByIdOrCode('P-PR-9005-MT');
  assert.ok(black);
  assert.strictEqual(black?.id, 'preto-fosco-9005');

  const wood = findFinishByIdOrCode('nogueira');
  assert.ok(wood);
  assert.strictEqual(wood?.category, 'Amadeirado Sublimação');
});

test('calculateFinishCostImpact computes cost differences accurately', () => {
  // Base 1000 R$ with 1.0x to 1.15x (+15%)
  const impact = calculateFinishCostImpact(1.0, 1.15, 1000);
  assert.strictEqual(impact.adjustedMaterialCost, 1150);
  assert.strictEqual(impact.differenceR$, 150);
  assert.strictEqual(impact.differencePercent, 15);

  // From 1.10x to 1.48x (+34.5%)
  const woodImpact = calculateFinishCostImpact(1.10, 1.48, 1100);
  assert.strictEqual(woodImpact.adjustedMaterialCost, 1480);
  assert.strictEqual(woodImpact.differenceR$, 380);
});

test('mapFinishToColorCategory categorizes correctly for system enums', () => {
  const white = ALUMINUM_FINISHES_CATALOG.find((f) => f.id === 'branco-ral-9003')!;
  assert.strictEqual(mapFinishToColorCategory(white), 'Branco');

  const black = ALUMINUM_FINISHES_CATALOG.find((f) => f.id === 'preto-fosco-9005')!;
  assert.strictEqual(mapFinishToColorCategory(black), 'Preto');

  const wood = ALUMINUM_FINISHES_CATALOG.find((f) => f.id === 'madeira-nogueira-real')!;
  assert.strictEqual(mapFinishToColorCategory(wood), 'Amadeirado');

  const anod = ALUMINUM_FINISHES_CATALOG.find((f) => f.id === 'natural-fosco-anodizado')!;
  assert.strictEqual(mapFinishToColorCategory(anod), 'Natural');
});

test('applyFinishToOrder recalculates order prices and updates items and history', () => {
  const sampleOrder: Order = {
    id: 'ord_test',
    number: 2002,
    clientName: 'Cliente Teste',
    clientPhone: '11988887777',
    deliveryDate: '2026-11-30',
    createdAt: '2026-11-01',
    status: 'Orçamento',
    color: 'Branco',
    items: [
      {
        id: 'item_1',
        typologyId: 'typ_cor2_sup',
        typologyName: 'Janela 2F',
        width: 1200,
        height: 1200,
        quantity: 2,
        roomTag: 'Sala',
        color: 'Branco',
        glassId: 'gl_comum_4',
        unitPrice: 500,
        totalPrice: 1000,
      },
    ],
    totalWeightKg: 20,
    totalGlassM2: 2.88,
    materialCost: 800,
    laborCost: 200,
    subtotal: 1000,
    finalPrice: 1000,
    history: [],
  };

  const targetFinish = ALUMINUM_FINISHES_CATALOG.find((f) => f.id === 'preto-fosco-9005')!; // multiplier 1.15
  const updated = applyFinishToOrder(sampleOrder, targetFinish);

  assert.strictEqual(updated.color, 'Preto');
  assert.strictEqual(updated.items[0].color, 'Preto');
  assert.strictEqual(updated.items[0].unitPrice, 575); // 500 * 1.15
  assert.strictEqual(updated.items[0].totalPrice, 1150); // 575 * 2
  assert.strictEqual(updated.subtotal, 1150);
  assert.strictEqual(updated.finalPrice, 1150);
  assert.strictEqual(updated.history.length, 1);
});
