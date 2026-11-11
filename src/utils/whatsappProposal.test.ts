import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeWhatsAppPhone,
  calculatePaymentPlans,
  generateWhatsAppProposalText,
  createWhatsAppShareUrl,
  DEFAULT_PAYMENT_SETTINGS,
} from './whatsappProposal';
import { Order } from '../types';

test('sanitizeWhatsAppPhone formats Brazilian phone numbers correctly', () => {
  // Com DDD e traço
  assert.equal(sanitizeWhatsAppPhone('(11) 98765-4321'), '5511987654321');
  // Já com 55
  assert.equal(sanitizeWhatsAppPhone('+55 (11) 98765-4321'), '5511987654321');
  // Número fixo de 8 dígitos com DDD
  assert.equal(sanitizeWhatsAppPhone('(11) 3456-7890'), '551134567890');
  // Vazio ou nulo
  assert.equal(sanitizeWhatsAppPhone(''), '');
  assert.equal(sanitizeWhatsAppPhone(null), '');
});

test('calculatePaymentPlans calculates PIX discount, split downpayment and credit card plans accurately', () => {
  const total = 10000;
  const plans = calculatePaymentPlans(total, {
    ...DEFAULT_PAYMENT_SETTINGS,
    pixDiscountPercent: 5,
    standardDownPaymentPercent: 50,
    standardInstallmentsCount: 3,
  });

  assert.equal(plans.length, 5);

  // 1. PIX com 5% de desconto
  const pixPlan = plans.find((p) => p.id === 'pix_cash')!;
  assert.equal(pixPlan.totalWithPlan, 9500);
  assert.equal(pixPlan.discountPct, 5);

  // 2. Entrada 50% + 3x sem juros
  const stdPlan = plans.find((p) => p.id === 'standard_split')!;
  assert.equal(stdPlan.downPaymentValue, 5000);
  assert.equal(stdPlan.installmentsCount, 3);
  assert.equal(Math.round(stdPlan.installmentValue * 100) / 100, 1666.67);
  assert.equal(stdPlan.totalWithPlan, 10000);

  // 3. 6x sem juros
  const plan6x = plans.find((p) => p.id === 'card_6x_free')!;
  assert.equal(plan6x.installmentsCount, 6);
  assert.equal(Math.round(plan6x.installmentValue * 100) / 100, 1666.67);

  // 4. 12x no cartão
  const plan12x = plans.find((p) => p.id === 'card_12x')!;
  assert.equal(plan12x.installmentsCount, 12);
  assert.ok(plan12x.totalWithPlan > 10000, 'Total with 12x interest should be greater than cash');
});

test('generateWhatsAppProposalText generates structured message with items, values and payment plans', () => {
  const dummyOrder: Order = {
    id: 'ord_test_wa',
    number: 105,
    clientName: 'Roberto Alencar',
    clientPhone: '(11) 99887-7665',
    clientAddress: 'Alameda dos Ipês, 450 - Tamboré',
    createdAt: '2026-10-31',
    deliveryDate: '2026-11-25',
    status: 'Orçamento',
    color: 'Preto',
    totalWeightKg: 85,
    totalGlassM2: 6.4,
    materialCost: 4000,
    laborCost: 1500,
    subtotal: 5500,
    finalPrice: 8500,
    items: [
      {
        id: 'it_1',
        typologyId: 'typ_sup_j2',
        typologyName: 'Janela 2 Folhas Suprema',
        width: 1500,
        height: 1200,
        quantity: 2,
        roomTag: 'Suíte Casal',
        color: 'Preto',
        glassId: 'vid_4mm',
        glassType: 'Vidro Temperado 6mm Incolor',
        totalPrice: 4250,
      },
    ],
    history: [],
  };

  const text = generateWhatsAppProposalText(dummyOrder);

  assert.ok(text.includes('Roberto'), 'Should greet client by name');
  assert.ok(text.includes('105'), 'Should include order number');
  assert.ok(text.includes('Janela 2 Folhas Suprema'), 'Should include typology name');
  assert.ok(text.includes('1500 × 1200 mm'), 'Should include dimensions');
  assert.ok(text.includes('Vidro Temperado 6mm Incolor'), 'Should include glass type');
  assert.ok(text.includes('Suíte Casal'), 'Should include room tag');
  assert.ok(text.includes('R$ 8.500,00'), 'Should format total price in BRL');
  assert.ok(text.includes('CONDIÇÕES ESPECIAIS DE PAGAMENTO'), 'Should include payment section');
  assert.ok(text.includes('ABNT NBR 10821'), 'Should include guarantee and technical standards');
});

test('createWhatsAppShareUrl creates a valid URL with sanitized phone and encoded text', () => {
  const phone = '(11) 98765-4321';
  const text = 'Olá! Teste de proposta.';
  const url = createWhatsAppShareUrl(phone, text);

  assert.ok(url.startsWith('https://api.whatsapp.com/send?phone=5511987654321&text='));
  assert.ok(url.includes('Ol%C3%A1!%20Teste%20de%20proposta.'));
});
