/**
 * Utilitário de Geração de Propostas Formatadas para WhatsApp & Simulador de Pagamento
 * Sanches & Marques Esquadrias de Alumínio e Vidraçaria
 */

import { Order, OrderItem } from '../types';
import { getEffectiveCompanyProfile } from './companyProfile';

export interface PaymentConditionPlan {
  id: string;
  title: string;
  description: string;
  downPaymentValue: number;
  installmentsCount: number;
  installmentValue: number;
  totalWithPlan: number;
  discountPct: number;
  interestRateMonthlyPct: number;
  summaryText: string;
}

export interface PaymentSimulationSettings {
  pixDiscountPercent: number; // ex: 5%
  standardDownPaymentPercent: number; // ex: 50%
  standardInstallmentsCount: number; // ex: 3 parcelas
  cardInterestRateMonthly: number; // ex: 1.99% a.m.
  customDownPayment: number;
  customInstallments: number;
  selectedPlanId: string;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSimulationSettings = {
  pixDiscountPercent: 5,
  standardDownPaymentPercent: 50,
  standardInstallmentsCount: 3,
  cardInterestRateMonthly: 1.99,
  customDownPayment: 0,
  customInstallments: 6,
  selectedPlanId: 'standard_split',
};

export const formatMoney = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(val || 0)
    .replace(/\u00A0/g, ' ');
};

/**
 * Higieniza o número de telefone para o padrão internacional do WhatsApp (DDI 55 Brasil).
 */
export function sanitizeWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return '';

  // Se já tiver DDI 55
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // DDD + 8 ou 9 dígitos (10 ou 11 dígitos) -> adiciona 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Apenas 8 ou 9 dígitos sem DDD (assume SP 11 padrão da fábrica)
  if (digits.length === 8 || digits.length === 9) {
    return `5511${digits}`;
  }

  return digits;
}

/**
 * Calcula os planos de pagamento disponíveis para o valor total da proposta.
 */
export function calculatePaymentPlans(
  totalValue: number,
  settings: PaymentSimulationSettings = DEFAULT_PAYMENT_SETTINGS
): PaymentConditionPlan[] {
  const total = Math.max(0, totalValue);

  // 1. À Vista com Desconto (PIX / Transferência)
  const pixDiscountVal = (total * settings.pixDiscountPercent) / 100;
  const pixTotal = Math.max(0, total - pixDiscountVal);

  const planPix: PaymentConditionPlan = {
    id: 'pix_cash',
    title: `À Vista no PIX (${settings.pixDiscountPercent}% de desconto)`,
    description: `Economia imediata de ${formatMoney(pixDiscountVal)}`,
    downPaymentValue: pixTotal,
    installmentsCount: 1,
    installmentValue: pixTotal,
    totalWithPlan: pixTotal,
    discountPct: settings.pixDiscountPercent,
    interestRateMonthlyPct: 0,
    summaryText: `À vista no PIX: ${formatMoney(pixTotal)} (com ${settings.pixDiscountPercent}% desc.)`,
  };

  // 2. Condição Padrão da Fábrica: Entrada + Parcelas Sem Juros
  const downPayment = (total * settings.standardDownPaymentPercent) / 100;
  const remaining = total - downPayment;
  const count = Math.max(1, settings.standardInstallmentsCount);
  const instVal = remaining / count;

  const planStandard: PaymentConditionPlan = {
    id: 'standard_split',
    title: `Entrada ${settings.standardDownPaymentPercent}% + ${count}x Sem Juros`,
    description: `Entrada na aprovação + ${count} parcelas no boleto ou cartão`,
    downPaymentValue: downPayment,
    installmentsCount: count,
    installmentValue: instVal,
    totalWithPlan: total,
    discountPct: 0,
    interestRateMonthlyPct: 0,
    summaryText: `Entrada de ${formatMoney(downPayment)} + ${count}x de ${formatMoney(instVal)} sem juros`,
  };

  // 3. Parcelamento em 6x Sem Juros (Cartão)
  const inst6x = total / 6;
  const plan6x: PaymentConditionPlan = {
    id: 'card_6x_free',
    title: '6x Sem Juros no Cartão de Crédito',
    description: 'Sem entrada, direto no cartão da obra',
    downPaymentValue: 0,
    installmentsCount: 6,
    installmentValue: inst6x,
    totalWithPlan: total,
    discountPct: 0,
    interestRateMonthlyPct: 0,
    summaryText: `6x de ${formatMoney(inst6x)} sem juros no cartão`,
  };

  // 4. Parcelamento em 10x
  const inst10x = total / 10;
  const plan10x: PaymentConditionPlan = {
    id: 'card_10x_free',
    title: '10x Sem Juros (Obras & Reformas)',
    description: 'Facilidade para fechamento de projetos completos',
    downPaymentValue: 0,
    installmentsCount: 10,
    installmentValue: inst10x,
    totalWithPlan: total,
    discountPct: 0,
    interestRateMonthlyPct: 0,
    summaryText: `10x de ${formatMoney(inst10x)} sem juros no cartão`,
  };

  // 5. Parcelamento em 12x no Cartão (com taxa reduzida)
  // Fórmula de prestação com taxa da maquininha: PMT = PV * (i * (1+i)^n) / ((1+i)^n - 1)
  const i = settings.cardInterestRateMonthly / 100;
  const n = 12;
  const factor = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  const inst12x = total * factor;
  const total12x = inst12x * 12;

  const plan12x: PaymentConditionPlan = {
    id: 'card_12x',
    title: '12x no Cartão de Crédito',
    description: `Parcelamento estendido (${settings.cardInterestRateMonthly}% a.m.)`,
    downPaymentValue: 0,
    installmentsCount: 12,
    installmentValue: inst12x,
    totalWithPlan: total12x,
    discountPct: 0,
    interestRateMonthlyPct: settings.cardInterestRateMonthly,
    summaryText: `12x de ${formatMoney(inst12x)} no cartão de crédito (total: ${formatMoney(total12x)})`,
  };

  return [planPix, planStandard, plan6x, plan10x, plan12x];
}

/**
 * Gera a mensagem textual profissional completa com formatação nativa do WhatsApp (*negrito*, bullet points, emojis).
 */
export function generateWhatsAppProposalText(
  order: Order,
  selectedPlan?: PaymentConditionPlan,
  allPlans?: PaymentConditionPlan[]
): string {
  const profile = getEffectiveCompanyProfile();
  const plans = allPlans || calculatePaymentPlans(order.finalPrice);
  const activePlan = selectedPlan || plans[1] || plans[0];

  const clientGreetingName = order.clientName ? order.clientName.trim().split(' ')[0] : 'Cliente';
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('pt-BR');
  const deliveryDateFormatted = new Date(order.deliveryDate || Date.now()).toLocaleDateString('pt-BR');

  // Cabeçalho da Proposta
  let msg = `Olá, *${clientGreetingName}*! Tudo bem?\n`;
  msg += `Aqui é da *${profile.name || 'Sanches & Marques Esquadrias e Vidraçaria'}*.\n\n`;
  msg += `📋 *ORÇAMENTO & PROPOSTA COMERCIAL #${order.number}*\n`;
  msg += `📅 *Data:* ${orderDate}\n`;
  if (order.clientAddress) {
    msg += `📍 *Obra / Local:* ${order.clientAddress}\n`;
  }
  msg += `\n─────────────────────\n`;
  msg += `📐 *DETALHAMENTO TÉCNICO DAS ESQUADRIAS & VIDROS:*\n\n`;

  // Itens das Esquadrias
  order.items.forEach((item, index) => {
    const itemNum = index + 1;
    const room = item.roomTag || item.location || 'Ambiente';
    const width = item.widthMm || item.width;
    const height = item.heightMm || item.height;
    const glass = item.glassType || item.glassId || 'Vidro Conforme Norma';
    const color = item.aluminumColor || item.color || 'Branco';
    const totalItem = formatMoney(item.totalPrice || item.unitPrice || 0);

    msg += `*${itemNum}. ${item.typologyName}*\n`;
    msg += `   • *Ambiente:* ${room}\n`;
    msg += `   • *Dimensões:* ${width} × ${height} mm\n`;
    msg += `   • *Vidro:* ${glass}\n`;
    msg += `   • *Acabamento Alumínio:* ${color}\n`;
    msg += `   • *Quantidade:* ${item.quantity} un\n`;
    msg += `   • *Subtotal:* ${totalItem}\n\n`;
  });

  msg += `─────────────────────\n`;
  msg += `💰 *VALOR TOTAL DO PEDIDO: ${formatMoney(order.finalPrice)}*\n`;
  msg += `🚚 *Prazo de Fabricação e Instalação:* Até ${deliveryDateFormatted}\n\n`;

  // Condições de Pagamento
  msg += `💳 *CONDIÇÕES ESPECIAIS DE PAGAMENTO:*\n\n`;
  msg += `✅ *Condição Recomendada:*\n`;
  msg += `👉 *${activePlan.title}*\n`;
  msg += `   ${activePlan.summaryText}\n\n`;

  msg += `Outras Opções Disponíveis:\n`;
  plans
    .filter((p) => p.id !== activePlan.id)
    .slice(0, 3)
    .forEach((p) => {
      msg += `• *${p.title}:* ${p.summaryText}\n`;
    });

  // Garantia & Diferenciais
  msg += `\n─────────────────────\n`;
  msg += `🛡️ *DIFERENCIAIS & GARANTIA SANCHES & MARQUES:*\n`;
  msg += `• Fabricação em total conformidade com as normas ABNT NBR 10821, NBR 14718 e NBR 7199\n`;
  msg += `• Perfis de alta performance e vedação contra vento e chuva forte\n`;
  msg += `• 5 anos de garantia contra defeitos de fabricação e fixação\n`;
  msg += `• Equipe própria de montagem e instalação técnica especializada\n\n`;

  // Encerramento
  msg += `Podemos agendar a vistoria / medição técnica ou enviar o link de aprovação?\n`;
  msg += `Fico à sua inteira disposição!\n\n`;
  msg += `*${profile.name || 'Sanches & Marques Esquadrias'}*\n`;
  if (profile.phone) msg += `📞 ${profile.phone}\n`;
  if (profile.email) msg += `✉️ ${profile.email}\n`;

  return msg;
}

/**
 * Cria a URL universal para envio de mensagem no WhatsApp.
 */
export function createWhatsAppShareUrl(phone: string, messageText: string): string {
  const cleanPhone = sanitizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(messageText);

  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}
