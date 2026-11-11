import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectOrderTier,
  calculateOrderUpselling,
  generateComparativeWhatsAppText,
  applyTierUpgradeToOrder,
  UPSELLING_TIERS,
} from './upsellingComparator';
import { Order } from '../types';

const mockSupremaOrder: Order = {
  id: 'order_test_suprema',
  number: 1042,
  clientName: 'Dr. Roberto Silveira',
  clientPhone: '(11) 98765-4321',
  clientAddress: 'Alameda das Rosas, 200 - Alphaville',
  createdAt: '2026-03-10',
  deliveryDate: '2026-04-15',
  status: 'Orçamento',
  color: 'Preto',
  totalWeightKg: 85.0,
  totalGlassM2: 12.4,
  materialCost: 5200,
  laborCost: 1800,
  subtotal: 10000,
  finalPrice: 10000,
  history: [],
  items: [
    {
      id: 'it_1',
      typologyId: 'typ_cor2_sup',
      typologyName: 'Janela de Correr 2 Folhas Móveis (Suprema)',
      width: 1500,
      height: 1200,
      quantity: 2,
      roomTag: 'Suíte Master',
      color: 'Preto',
      glassId: 'gls_incolor_4mm',
      unitPrice: 2500,
      totalPrice: 5000,
      weightKg: 40.0,
    },
    {
      id: 'it_2',
      typologyId: 'typ_maximar_sup',
      typologyName: 'Janela Maxim-Ar com Braço Inox (Suprema)',
      width: 800,
      height: 600,
      quantity: 2,
      roomTag: 'Banheiro Master',
      color: 'Preto',
      glassId: 'gls_incolor_4mm',
      unitPrice: 2500,
      totalPrice: 5000,
      weightKg: 45.0,
    },
  ],
};

const mockGoldOrder: Order = {
  ...mockSupremaOrder,
  id: 'order_test_gold',
  number: 1043,
  finalPrice: 14000,
  totalWeightKg: 120.7,
  items: [
    {
      id: 'it_g1',
      typologyId: 'typ_porta_cor2_gold',
      typologyName: 'Porta de Correr 2 Folhas Móveis (Linha Gold)',
      width: 2000,
      height: 2200,
      quantity: 1,
      roomTag: 'Living',
      color: 'Preto',
      glassId: 'gls_temp_8mm',
      unitPrice: 14000,
      totalPrice: 14000,
      weightKg: 120.7,
    },
  ],
};

const mockChromaOrder: Order = {
  ...mockSupremaOrder,
  id: 'order_test_chroma',
  number: 1044,
  finalPrice: 18800,
  totalWeightKg: 153.0,
  items: [
    {
      id: 'it_c1',
      typologyId: 'typ_chr_01',
      typologyName: 'Painel Deslizante Chroma Minimalista Slim',
      width: 3000,
      height: 2600,
      quantity: 1,
      roomTag: 'Varanda Gourmet',
      color: 'Preto',
      glassId: 'gls_insulado_18mm',
      unitPrice: 18800,
      totalPrice: 18800,
      weightKg: 153.0,
    },
  ],
};

test('detectOrderTier identifies line series correctly from order items', () => {
  assert.equal(detectOrderTier(mockSupremaOrder), 'suprema');
  assert.equal(detectOrderTier(mockGoldOrder), 'gold');
  assert.equal(detectOrderTier(mockChromaOrder), 'minimalista');
});

test('calculateOrderUpselling generates 3 tier proposals with accurate price, weight and installment scaling', () => {
  const comparison = calculateOrderUpselling(mockSupremaOrder);

  assert.equal(comparison.orderNumber, 1042);
  assert.equal(comparison.clientName, 'Dr. Roberto Silveira');
  assert.equal(comparison.currentTierId, 'suprema');
  assert.equal(comparison.tierList.length, 3);

  const tSuprema = comparison.tiers.suprema;
  const tGold = comparison.tiers.gold;
  const tMini = comparison.tiers.minimalista;

  // Linha Suprema (Baseline)
  assert.equal(tSuprema.isCurrentOrderTier, true);
  assert.equal(tSuprema.totalPrice, 10000);
  assert.equal(tSuprema.installments10x, 1000);
  assert.equal(tSuprema.totalWeightKg, 85);
  assert.equal(tSuprema.priceDiffFromBaseline, 0);

  // Linha Gold (+40% price, +42% weight)
  assert.equal(tGold.isCurrentOrderTier, false);
  assert.equal(tGold.totalPrice, 14000);
  assert.equal(tGold.installments10x, 1400);
  assert.equal(tGold.monthlyDiffFromBaseline10x, 400); // 1400 - 1000 = 400/mês
  assert.equal(tGold.priceDiffFromBaseline, 4000);
  assert.equal(tGold.percentDiffFromBaseline, 40);
  assert.equal(tGold.tier.windPressurePa, 1950);
  assert.equal(tGold.tier.acousticRwDb, 32);

  // Linha Minimalista (+88% price, +80% weight)
  assert.equal(tMini.isCurrentOrderTier, false);
  assert.equal(tMini.totalPrice, 18800);
  assert.equal(tMini.installments10x, 1880);
  assert.equal(tMini.monthlyDiffFromBaseline10x, 880);
  assert.equal(tMini.tier.windPressurePa, 2800);
  assert.equal(tMini.tier.acousticRwDb, 38);

  // Itens breakdown exists for each tier
  assert.equal(tSuprema.items.length, 2);
  assert.equal(tGold.items.length, 2);
  assert.equal(tMini.items.length, 2);
  assert.match(tGold.items[0].typologyName, /Linha Gold/i);
  assert.match(tMini.items[0].typologyName, /Minimalista/i);
});

test('calculateOrderUpselling normalizes baseline when order starts as Gold', () => {
  const comparison = calculateOrderUpselling(mockGoldOrder);

  assert.equal(comparison.currentTierId, 'gold');
  assert.equal(comparison.tiers.gold.isCurrentOrderTier, true);
  assert.equal(comparison.tiers.gold.totalPrice, 14000);
  // Suprema should be normalized back down
  assert.equal(comparison.tiers.suprema.totalPrice, 10000);
  // Minimalista should be scaled up from baseline
  assert.equal(comparison.tiers.minimalista.totalPrice, 18800);
});

test('generateComparativeWhatsAppText formats comprehensive WhatsApp proposal message', () => {
  const comparison = calculateOrderUpselling(mockSupremaOrder);
  const text = generateComparativeWhatsAppText(comparison, 'gold');

  assert.match(text, /SANCHES & MARQUES ESQUADRIAS/);
  assert.match(text, /OP #1042/);
  assert.match(text, /Dr\. Roberto Silveira/);
  assert.match(text, /LINHA SUPREMA \(25mm\)/);
  assert.match(text, /LINHA GOLD \(32mm\)/);
  assert.match(text, /LINHA MINIMALISTA CHROMA/);
  assert.match(text, /10x sem juros de R\$/);
  assert.match(text, /1\.050 Pa/);
  assert.match(text, /1\.950 Pa/);
  assert.match(text, /2\.800 Pa/);
  assert.match(text, /Suíte Master/);
});

test('applyTierUpgradeToOrder updates order properties and recalculates values', () => {
  const upgradedOrder = applyTierUpgradeToOrder(mockSupremaOrder, 'gold');

  assert.equal(upgradedOrder.id, mockSupremaOrder.id);
  assert.equal(upgradedOrder.finalPrice, 14000);
  assert.equal(upgradedOrder.subtotal, 14000);
  assert.equal(upgradedOrder.items[0].typologyName.includes('Gold'), true);
  assert.equal(upgradedOrder.history.length, 1);
  assert.match(upgradedOrder.history[0].action, /Upgrade comercial de linha para "Linha Gold/);
  assert.match(upgradedOrder.notes || '', /Upgrade Comercial Realizado/);
});
