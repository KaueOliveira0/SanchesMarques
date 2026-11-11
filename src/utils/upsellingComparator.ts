import { Order, OrderItem } from '../types';
import { formatMoney } from './whatsappProposal';
import { renderCorporatePdfHeader, escapeHtml } from './pdfPrint';
import { getEffectiveCompanyProfile } from './companyProfile';

export type UpsellingTierId = 'suprema' | 'gold' | 'minimalista';

export interface UpsellingTierSpec {
  id: UpsellingTierId;
  name: string;
  seriesName: string;
  badge: string;
  badgeColor: string; // tailwind color class
  tagline: string;
  description: string;
  profileDepthMm: number;
  profileThicknessRange: string;
  windPressurePa: number;
  windClassification: string;
  windSpeedKmh: number;
  acousticRwDb: number;
  acousticPerformance: string;
  glassCompatibility: string;
  trackRailSpec: string;
  rollerSpec: string;
  locksAndHandles: string;
  warrantyYears: number;
  priceFactor: number; // vs Suprema baseline
  weightFactor: number; // vs Suprema baseline
}

export const UPSELLING_TIERS: Record<UpsellingTierId, UpsellingTierSpec> = {
  suprema: {
    id: 'suprema',
    name: 'Linha Suprema (25mm)',
    seriesName: 'Suprema',
    badge: 'Melhor Custo-Benefício',
    badgeColor: 'bg-slate-700 text-slate-200 border-slate-600',
    tagline: 'Solução clássica, leve e econômica para residências e reformas rápidas.',
    description: 'Sistema padronizado de 25mm com marcos tubulares e excelente vedação para obras convencionais.',
    profileDepthMm: 25,
    profileThicknessRange: '1.2mm a 1.4mm',
    windPressurePa: 1050,
    windClassification: 'Classe 2 (NBR 10821)',
    windSpeedKmh: 130,
    acousticRwDb: 25,
    acousticPerformance: 'Atenuação Padrão (24-26 dB)',
    glassCompatibility: 'Vidros Comuns ou Temperados de 4mm a 6mm',
    trackRailSpec: 'Trilho de alumínio convencional extrudado',
    rollerSpec: 'Roldana simples de nylon (30 kg/folha)',
    locksAndHandles: 'Fechos concha laterais em polímero/zamack',
    warrantyYears: 3,
    priceFactor: 1.0,
    weightFactor: 1.0,
  },
  gold: {
    id: 'gold',
    name: 'Linha Gold (32mm)',
    seriesName: 'Gold',
    badge: 'Mais Vendida • Recomendada',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    tagline: 'Perfis encorpados, trilho inox e alta durabilidade mecânica.',
    description: 'Linha premium de 32mm com montantes reforçados, trilhos de aço inoxidável e excelente atenuação acústica.',
    profileDepthMm: 32,
    profileThicknessRange: '1.6mm a 2.0mm',
    windPressurePa: 1950,
    windClassification: 'Classe 4 (NBR 10821)',
    windSpeedKmh: 175,
    acousticRwDb: 32,
    acousticPerformance: 'Atenuação Acústica Superior (+7 dB / 31-33 dB)',
    glassCompatibility: 'Vidros Temperados e Laminados de 8mm a 10mm',
    trackRailSpec: 'Capa de trilho em Aço Inox AISI 304 de rolagem contínua',
    rollerSpec: 'Roldanas duplas com rolamento tipo agulha (80 a 120 kg/folha)',
    locksAndHandles: 'Fecho cremona multiponto e puxadores tubulares em inox',
    warrantyYears: 5,
    priceFactor: 1.40,
    weightFactor: 1.42,
  },
  minimalista: {
    id: 'minimalista',
    name: 'Linha Minimalista Chroma (Slim)',
    seriesName: 'Chroma Minimalista',
    badge: 'Luxo Arquitetônico • High-End',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    tagline: 'Vistas ultrafinas, trilho oculto no piso e panos de vidro panorâmicos.',
    description: 'Sistema contemporâneo com perfis quase invisíveis, drenagem oculta no contrapiso e estética de cinema.',
    profileDepthMm: 45,
    profileThicknessRange: '2.0mm a 2.5mm (ligas de alta inércia)',
    windPressurePa: 2800,
    windClassification: 'Classe 5+ Extrema (NBR 10821)',
    windSpeedKmh: 215,
    acousticRwDb: 38,
    acousticPerformance: 'Isolamento Termoacústico Máximo (+13 dB / 36-40 dB)',
    glassCompatibility: 'Vidros Laminados e Insulados Duplos Low-E até 24mm',
    trackRailSpec: 'Trilho 100% embutido "Piso Nível Zero" sem ressaltos',
    rollerSpec: 'Carros quádruplos de roletes inox blindados (até 250 kg/folha)',
    locksAndHandles: 'Travamento magnético multiponto oculto no montante',
    warrantyYears: 10,
    priceFactor: 1.88,
    weightFactor: 1.80,
  },
};

export interface CalculatedTierItem {
  id: string;
  typologyName: string;
  roomTag: string;
  width: number;
  height: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weightKg: number;
  glassRecommended: string;
}

export interface CalculatedTierProposal {
  tier: UpsellingTierSpec;
  isCurrentOrderTier: boolean;
  totalPrice: number;
  totalWeightKg: number;
  // Planos de pagamento ilustrativos
  installments10x: number; // 10x sem juros
  installments12xCard: number; // 12x no cartão
  downpaymentAndSplit: {
    downpayment50: number;
    remaining3x: number;
  };
  // Diferenciais comparados ao baseline (Suprema ou atual)
  priceDiffFromBaseline: number;
  percentDiffFromBaseline: number;
  monthlyDiffFromBaseline10x: number;
  weightDiffKgFromBaseline: number;
  weightPercentDiffFromBaseline: number;
  items: CalculatedTierItem[];
}

export interface OrderUpsellingComparison {
  orderNumber: number;
  orderId: string;
  clientName: string;
  clientPhone: string;
  currentTierId: UpsellingTierId;
  colorName: string;
  deliveryDate: string;
  tiers: Record<UpsellingTierId, CalculatedTierProposal>;
  tierList: CalculatedTierProposal[];
  salesPitch: string;
  technicalSummary: string;
}

/**
 * Detecta a linha predominante do pedido (Suprema, Gold ou Minimalista/Chroma)
 */
export function detectOrderTier(order: Order): UpsellingTierId {
  if (!order.items || order.items.length === 0) return 'suprema';

  let goldScore = 0;
  let chromaScore = 0;
  let supremaScore = 0;

  for (const item of order.items) {
    const text = `${item.typologyName || ''} ${item.typologyId || ''} ${item.notes || ''}`.toLowerCase();
    if (text.includes('gold') || text.includes('gld') || text.includes('linha 32')) {
      goldScore += item.quantity || 1;
    } else if (text.includes('chroma') || text.includes('minimal') || text.includes('slim') || text.includes('panoram')) {
      chromaScore += item.quantity || 1;
    } else {
      supremaScore += item.quantity || 1;
    }
  }

  if (chromaScore > goldScore && chromaScore > supremaScore) return 'minimalista';
  if (goldScore > supremaScore) return 'gold';
  return 'suprema';
}

/**
 * Calcula a proposta comparativa completa de Up-Selling em 3 níveis
 */
export function calculateOrderUpselling(
  order: Order,
  customFactors?: { goldFactor?: number; minimalistaFactor?: number }
): OrderUpsellingComparison {
  const currentTierId = detectOrderTier(order);

  // Fatores de cálculo
  const goldPriceFactor = customFactors?.goldFactor ?? UPSELLING_TIERS.gold.priceFactor;
  const miniPriceFactor = customFactors?.minimalistaFactor ?? UPSELLING_TIERS.minimalista.priceFactor;

  // Encontra a base de cálculo para a Suprema
  // Se o pedido atual já for Gold ou Minimalista, normaliza para trás
  const rawFinalPrice = Math.max(1, order.finalPrice || 0);
  const rawWeight = Math.max(1, order.totalWeightKg || 0);

  let baselinePrice = rawFinalPrice;
  let baselineWeight = rawWeight;

  if (currentTierId === 'gold') {
    baselinePrice = rawFinalPrice / goldPriceFactor;
    baselineWeight = rawWeight / UPSELLING_TIERS.gold.weightFactor;
  } else if (currentTierId === 'minimalista') {
    baselinePrice = rawFinalPrice / miniPriceFactor;
    baselineWeight = rawWeight / UPSELLING_TIERS.minimalista.weightFactor;
  }

  const tierIds: UpsellingTierId[] = ['suprema', 'gold', 'minimalista'];
  const tiersResult: Partial<Record<UpsellingTierId, CalculatedTierProposal>> = {};

  for (const tid of tierIds) {
    const spec = UPSELLING_TIERS[tid];
    let priceMultiplier = 1.0;
    let weightMultiplier = 1.0;

    if (tid === 'suprema') {
      priceMultiplier = 1.0;
      weightMultiplier = 1.0;
    } else if (tid === 'gold') {
      priceMultiplier = goldPriceFactor;
      weightMultiplier = spec.weightFactor;
    } else if (tid === 'minimalista') {
      priceMultiplier = miniPriceFactor;
      weightMultiplier = spec.weightFactor;
    }

    const calculatedPrice = tid === currentTierId && order.finalPrice > 0
      ? order.finalPrice
      : Math.round(baselinePrice * priceMultiplier * 100) / 100;

    const calculatedWeight = tid === currentTierId && order.totalWeightKg > 0
      ? order.totalWeightKg
      : Math.round(baselineWeight * weightMultiplier * 10) / 10;

    const installments10x = Math.round((calculatedPrice / 10) * 100) / 100;
    const installments12xCard = Math.round(((calculatedPrice * 1.055) / 12) * 100) / 100;
    const downpayment50 = Math.round((calculatedPrice * 0.5) * 100) / 100;
    const remaining3x = Math.round(((calculatedPrice * 0.5) / 3) * 100) / 100;

    // Diferenças em relação ao baseline (Suprema)
    const priceDiff = Math.round((calculatedPrice - baselinePrice) * 100) / 100;
    const percentDiff = Math.round(((calculatedPrice - baselinePrice) / baselinePrice) * 100);
    const monthlyDiff10x = Math.round(((calculatedPrice - baselinePrice) / 10) * 100) / 100;
    const weightDiffKg = Math.round((calculatedWeight - baselineWeight) * 10) / 10;
    const weightPercentDiff = Math.round(((calculatedWeight - baselineWeight) / baselineWeight) * 100);

    // Itens simulados para esta linha
    const items: CalculatedTierItem[] = (order.items || []).map((it) => {
      const baseItemPrice = it.totalPrice || (calculatedPrice / Math.max(1, order.items.length));
      const itemPrice = tid === currentTierId && it.totalPrice
        ? it.totalPrice
        : Math.round(baseItemPrice * (priceMultiplier / (currentTierId === 'gold' ? goldPriceFactor : currentTierId === 'minimalista' ? miniPriceFactor : 1)) * 100) / 100;

      const baseWeight = it.weightKg || (calculatedWeight / Math.max(1, order.items.length));
      const itemWeight = Math.round(baseWeight * (weightMultiplier / (currentTierId === 'gold' ? UPSELLING_TIERS.gold.weightFactor : currentTierId === 'minimalista' ? UPSELLING_TIERS.minimalista.weightFactor : 1)) * 10) / 10;

      let glassName = it.glassType || 'Vidro Padrão';
      if (tid === 'gold' && !glassName.toLowerCase().includes('laminado') && !glassName.toLowerCase().includes('8mm')) {
        glassName = 'Vidro Temperado 8mm Incolor / Fumê';
      } else if (tid === 'minimalista') {
        glassName = 'Vidro Insulado Termoacústico 18mm ou Laminado 10mm';
      }

      let formattedTypologyName = it.typologyName;
      if (tid === 'gold') {
        formattedTypologyName = formattedTypologyName.replace(/\(Suprema\)/gi, '').trim() + ' (Linha Gold 32mm)';
      } else if (tid === 'minimalista') {
        formattedTypologyName = formattedTypologyName.replace(/\(Suprema\)/gi, '').replace(/\(Linha Gold\)/gi, '').trim() + ' (Chroma Minimalista Slim)';
      }

      return {
        id: it.id,
        typologyName: formattedTypologyName,
        roomTag: it.roomTag || it.location || 'Ambiente',
        width: it.width || it.widthMm || 1500,
        height: it.height || it.heightMm || 1200,
        quantity: it.quantity || 1,
        unitPrice: Math.round((itemPrice / Math.max(1, it.quantity || 1)) * 100) / 100,
        totalPrice: itemPrice,
        weightKg: itemWeight,
        glassRecommended: glassName,
      };
    });

    tiersResult[tid] = {
      tier: spec,
      isCurrentOrderTier: tid === currentTierId,
      totalPrice: calculatedPrice,
      totalWeightKg: calculatedWeight,
      installments10x,
      installments12xCard,
      downpaymentAndSplit: {
        downpayment50,
        remaining3x,
      },
      priceDiffFromBaseline: priceDiff,
      percentDiffFromBaseline: percentDiff,
      monthlyDiffFromBaseline10x: monthlyDiff10x,
      weightDiffKgFromBaseline: weightDiffKg,
      weightPercentDiffFromBaseline: weightPercentDiff,
      items,
    };
  }

  const tiers = tiersResult as Record<UpsellingTierId, CalculatedTierProposal>;
  const tierList = [tiers.suprema, tiers.gold, tiers.minimalista];

  // Argumento de vendas estruturado
  const goldDiffMonthly = tiers.gold.monthlyDiffFromBaseline10x;
  const salesPitch = `Por apenas +${formatMoney(goldDiffMonthly)}/mês na parcela em 10x, você entrega a Linha Gold com +42% de robustez de alumínio, trilho de inox macio e isolamento acústico superior de 32 dB (norma NBR 10821).`;

  const technicalSummary = `Comparativo entre Suprema (25mm), Gold (32mm) e Minimalista Chroma (45mm). Resistência ao vento de 1.050 Pa até 2.800 Pa, peso estrutural escalonado e suporte de vidros de 4mm até 24mm insulados.`;

  return {
    orderNumber: order.number,
    orderId: order.id,
    clientName: order.clientName || 'Cliente',
    clientPhone: order.clientPhone || '',
    currentTierId,
    colorName: order.color || 'Branco',
    deliveryDate: order.deliveryDate || new Date().toISOString(),
    tiers,
    tierList,
    salesPitch,
    technicalSummary,
  };
}

/**
 * Gera mensagem rica pronta para envio no WhatsApp apresentando as 3 opções
 */
export function generateComparativeWhatsAppText(
  comparison: OrderUpsellingComparison,
  recommendedTier: UpsellingTierId = 'gold'
): string {
  const { clientName, orderNumber, tiers, colorName } = comparison;
  const tSuprema = tiers.suprema;
  const tGold = tiers.gold;
  const tMini = tiers.minimalista;

  const lines: string[] = [];

  lines.push(`🏛️ *SANCHES & MARQUES ESQUADRIAS DE ALUMÍNIO*`);
  lines.push(`📐 *Estudo Comparativo de Esquadrias — OP #${orderNumber}*`);
  lines.push(`👤 *Cliente:* ${clientName}`);
  lines.push(`🎨 *Acabamento:* ${colorName}`);
  lines.push(``);
  lines.push(`Preparamos uma análise técnica comparativa em *3 níveis de acabamento* para valorizar ao máximo o seu projeto:`);
  lines.push(``);

  // 1. Linha Suprema
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`1️⃣ *LINHA SUPREMA (25mm)* — _Custo-Benefício_`);
  lines.push(`• *Valor Total:* ${formatMoney(tSuprema.totalPrice)}`);
  lines.push(`• *Condição:* 10x sem juros de ${formatMoney(tSuprema.installments10x)}`);
  lines.push(`• *Entrada 50% + 3x:* ${formatMoney(tSuprema.downpaymentAndSplit.downpayment50)} + 3x de ${formatMoney(tSuprema.downpaymentAndSplit.remaining3x)}`);
  lines.push(`• *Peso Estrutural:* ${tSuprema.totalWeightKg.toFixed(1)} kg de alumínio`);
  lines.push(`• *Resistência Vento:* 1.050 Pa (NBR 10821)`);
  lines.push(`• *Acústica:* 25 dB (vidros 4mm a 6mm)`);
  lines.push(``);

  // 2. Linha Gold
  const isGoldRec = recommendedTier === 'gold';
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`2️⃣ *LINHA GOLD (32mm)* — *PREMIUM RECOMENDADA* ⭐`);
  lines.push(`• *Valor Total:* ${formatMoney(tGold.totalPrice)}`);
  lines.push(`• *Condição:* 10x sem juros de ${formatMoney(tGold.installments10x)}`);
  lines.push(`• *Diferença:* Apenas *+${formatMoney(tGold.monthlyDiffFromBaseline10x)}/mês* vs Suprema!`);
  lines.push(`• *Entrada 50% + 3x:* ${formatMoney(tGold.downpaymentAndSplit.downpayment50)} + 3x de ${formatMoney(tGold.downpaymentAndSplit.remaining3x)}`);
  lines.push(`• *Peso Estrutural:* ${tGold.totalWeightKg.toFixed(1)} kg (*+${tGold.weightPercentDiffFromBaseline}% mais encorpado*)`);
  lines.push(`• *Diferenciais:* Trilho em Aço Inox AISI 304 (deslize silencioso), roldanas duplas agulha e vidro temperado 8mm.`);
  lines.push(`• *Resistência Vento:* 1.950 Pa (Classe 4) | *Acústica:* 32 dB (+7 dB de isolamento)`);
  if (isGoldRec) {
    lines.push(`👉 _Nossa melhor indicação para excelente isolamento e valorização do imóvel!_`);
  }
  lines.push(``);

  // 3. Linha Minimalista
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`3️⃣ *LINHA MINIMALISTA CHROMA* — *ALTO PADRÃO SLIM* ✨`);
  lines.push(`• *Valor Total:* ${formatMoney(tMini.totalPrice)}`);
  lines.push(`• *Condição:* 10x sem juros de ${formatMoney(tMini.installments10x)}`);
  lines.push(`• *Entrada 50% + 3x:* ${formatMoney(tMini.downpaymentAndSplit.downpayment50)} + 3x de ${formatMoney(tMini.downpaymentAndSplit.remaining3x)}`);
  lines.push(`• *Peso Estrutural:* ${tMini.totalWeightKg.toFixed(1)} kg (*+${tMini.weightPercentDiffFromBaseline}% em ligas de alta inércia*)`);
  lines.push(`• *Diferenciais:* Trilho 100% oculto no piso ("Nível Zero"), vistas ultrafinas contemporâneas e vidros insulados duplos.`);
  lines.push(`• *Resistência Vento:* 2.800 Pa (Classe 5+) | *Acústica:* 38 dB`);
  lines.push(``);

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📋 *Resumo dos Vãos (${tSuprema.items.length} itens):*`);
  for (const it of tSuprema.items.slice(0, 6)) {
    lines.push(`• ${it.roomTag}: ${it.width}x${it.height}mm (${it.quantity} un)`);
  }
  if (tSuprema.items.length > 6) {
    lines.push(`• ... e mais ${tSuprema.items.length - 6} vãos no projeto.`);
  }

  lines.push(``);
  lines.push(`Qual das 3 linhas melhor atende o padrão desejado para o seu projeto? Ficamos à disposição para agendar a medição técnica dos vãos! 🤝`);

  return lines.join('\n');
}

/**
 * Converte e atualiza a ordem para uma linha selecionada (Up-selling 1-click)
 */
export function applyTierUpgradeToOrder(order: Order, targetTierId: UpsellingTierId): Order {
  const comparison = calculateOrderUpselling(order);
  const targetProposal = comparison.tiers[targetTierId];
  if (!targetProposal) return order;

  // Atualiza itens do pedido com nova precificação e nomes
  const updatedItems: OrderItem[] = order.items.map((it, idx) => {
    const simItem = targetProposal.items[idx];
    const newUnitPrice = simItem ? simItem.unitPrice : it.unitPrice;
    const newTotalPrice = simItem ? simItem.totalPrice : it.totalPrice;
    const newWeight = simItem ? simItem.weightKg : it.weightKg;

    let updatedName = it.typologyName;
    if (targetTierId === 'gold') {
      updatedName = updatedName.replace(/suprema/gi, 'Gold').replace(/linha 25/gi, 'Linha Gold');
      if (!updatedName.toLowerCase().includes('gold')) {
        updatedName = `${updatedName} (Linha Gold 32mm)`;
      }
    } else if (targetTierId === 'minimalista') {
      updatedName = updatedName.replace(/suprema/gi, 'Minimalista').replace(/gold/gi, 'Minimalista');
      if (!updatedName.toLowerCase().includes('minimalista') && !updatedName.toLowerCase().includes('chroma')) {
        updatedName = `${updatedName} (Chroma Minimalista Slim)`;
      }
    } else if (targetTierId === 'suprema') {
      updatedName = updatedName.replace(/gold/gi, 'Suprema').replace(/minimalista/gi, 'Suprema');
      if (!updatedName.toLowerCase().includes('suprema')) {
        updatedName = `${updatedName} (Suprema 25mm)`;
      }
    }

    return {
      ...it,
      typologyName: updatedName,
      unitPrice: newUnitPrice,
      totalPrice: newTotalPrice,
      weightKg: newWeight,
      notes: `${it.notes ? it.notes + ' | ' : ''}Upgrade para ${targetProposal.tier.name}`,
    };
  });

  const updatedOrder: Order = {
    ...order,
    items: updatedItems,
    finalPrice: targetProposal.totalPrice,
    subtotal: targetProposal.totalPrice,
    totalWeightKg: targetProposal.totalWeightKg,
    notes: `${order.notes ? order.notes + '\n' : ''}[Upgrade Comercial Realizado: ${targetProposal.tier.name} em ${new Date().toLocaleDateString('pt-BR')}]`,
    history: [
      ...(order.history || []),
      {
        date: new Date().toISOString(),
        action: `Upgrade comercial de linha para "${targetProposal.tier.name}" com novo valor final de ${formatMoney(targetProposal.totalPrice)}`,
      },
    ],
  };

  return updatedOrder;
}

/**
 * Imprime Proposta Executiva ABNT de 3 Níveis Lado a Lado em PDF
 */
export function printComparativeProposalHtml(comparison: OrderUpsellingComparison): void {
  const profile = getEffectiveCompanyProfile();
  const dateStr = new Date().toLocaleDateString('pt-BR');

  const { orderNumber, clientName, clientPhone, colorName, tiers } = comparison;
  const tSuprema = tiers.suprema;
  const tGold = tiers.gold;
  const tMini = tiers.minimalista;

  const headerHtml = renderCorporatePdfHeader({
    docBadge: 'PROPOSTA COMPARATIVA 3 NÍVEIS',
    docNumber: `ESTUDO-OP #${orderNumber}`,
    docDate: dateStr,
    docSubtitle: `CLIENTE: ${escapeHtml(clientName)}`,
    extraLines: [
      `Telefone: ${escapeHtml(clientPhone || 'Não informado')}`,
      `Acabamento: ${escapeHtml(colorName)}`,
    ],
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta Comparativa de Esquadrias - OP #${orderNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
    }

    .pdf-corporate-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #b45309;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-logo { width: 64px; height: 64px; object-fit: contain; }
    .brand-name { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: 0.5px; }
    .brand-sub { font-size: 9px; font-weight: 700; color: #d97706; margin-bottom: 4px; }
    .company-meta, .company-contact { font-size: 9px; color: #475569; }
    .header-right { text-align: right; }
    .doc-badge {
      display: inline-block;
      background: #0f172a;
      color: #f8fafc;
      font-weight: 700;
      font-size: 9px;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .doc-number { font-size: 16px; font-weight: 800; color: #b45309; margin-top: 4px; }
    .doc-date { font-size: 10px; color: #475569; }
    .extra-line { font-size: 9px; color: #64748b; }

    .banner-intro {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 12px 0;
    }
    .banner-title { font-size: 12px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
    .banner-desc { font-size: 10px; color: #475569; margin: 0; }

    /* Grade Comparativa das 3 Linhas */
    .tiers-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .tier-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .tier-card.featured {
      border: 2px solid #d97706;
      background: #fffbeb;
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.1);
    }
    .tier-badge {
      position: absolute;
      top: -10px;
      right: 12px;
      font-size: 8px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-suprema { background: #e2e8f0; color: #334155; }
    .badge-gold { background: #d97706; color: #ffffff; }
    .badge-mini { background: #7e22ce; color: #ffffff; }

    .tier-title { font-size: 13px; font-weight: 800; color: #0f172a; margin: 4px 0 2px 0; }
    .tier-series { font-size: 9px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .tier-tagline { font-size: 9px; color: #475569; margin: 6px 0 10px 0; min-height: 24px; }

    .tier-price-box {
      background: #f1f5f9;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 10px;
      text-align: center;
    }
    .tier-card.featured .tier-price-box {
      background: #fef3c7;
      border: 1px solid #fde68a;
    }
    .price-label { font-size: 8px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .price-val { font-size: 16px; font-weight: 900; color: #0f172a; }
    .installments-val { font-size: 10px; font-weight: 700; color: #0284c7; margin-top: 2px; }
    .diff-highlight { font-size: 9px; font-weight: 800; color: #b45309; margin-top: 4px; }

    .specs-list { list-style: none; padding: 0; margin: 0; font-size: 9.5px; border-top: 1px solid #e2e8f0; }
    .spec-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .spec-label { color: #64748b; font-weight: 600; }
    .spec-val { color: #0f172a; font-weight: 700; text-align: right; }

    /* Tabela de Itens e Vãos */
    .table-section { margin-top: 14px; }
    .section-title { font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    th {
      background: #0f172a;
      color: #f8fafc;
      padding: 6px 8px;
      text-align: left;
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 700;
    }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }

    .footer-note {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 8.5px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  ${headerHtml}

  <div class="banner-intro">
    <div class="banner-title">ESTUDO COMPARATIVO TÉCNICO &amp; COMERCIAL DE LINHAS DE ESQUADRIAS</div>
    <div class="banner-desc">
      Apresentamos abaixo a análise de 3 linhas de engenharia para o seu projeto. Cada linha possui propriedades estruturais distintas conforme as normas <b>ABNT NBR 10821</b> (esquadrias para edificações) e <b>NBR 7199</b> (envidraçamento).
    </div>
  </div>

  <div class="tiers-grid">
    <!-- Linha Suprema -->
    <div class="tier-card">
      <span class="tier-badge badge-suprema">Custo-Benefício</span>
      <div class="tier-series">Linha 25mm</div>
      <div class="tier-title">Linha Suprema</div>
      <div class="tier-tagline">${escapeHtml(tSuprema.tier.tagline)}</div>

      <div class="tier-price-box">
        <div class="price-label">Valor Total do Pedido</div>
        <div class="price-val">${formatMoney(tSuprema.totalPrice)}</div>
        <div class="installments-val">10x sem juros de ${formatMoney(tSuprema.installments10x)}</div>
      </div>

      <div class="specs-list">
        <div class="spec-item">
          <span class="spec-label">Profundidade Marco:</span>
          <span class="spec-val">25 mm</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Peso Alumínio Total:</span>
          <span class="spec-val">${tSuprema.totalWeightKg.toFixed(1)} kg</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Resistência ao Vento:</span>
          <span class="spec-val">1.050 Pa (Classe 2)</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Atenuação Acústica:</span>
          <span class="spec-val">25 dB (Rw)</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Vidros Recomendados:</span>
          <span class="spec-val">4 a 6mm</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Trilhos e Deslizamento:</span>
          <span class="spec-val">Trilho Alumínio</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Garantia Estrutural:</span>
          <span class="spec-val">3 Anos</span>
        </div>
      </div>
    </div>

    <!-- Linha Gold (Featured) -->
    <div class="tier-card featured">
      <span class="tier-badge badge-gold">⭐ Recomendada</span>
      <div class="tier-series">Linha 32mm Premium</div>
      <div class="tier-title">Linha Gold</div>
      <div class="tier-tagline">${escapeHtml(tGold.tier.tagline)}</div>

      <div class="tier-price-box">
        <div class="price-label">Valor Total do Pedido</div>
        <div class="price-val">${formatMoney(tGold.totalPrice)}</div>
        <div class="installments-val">10x sem juros de ${formatMoney(tGold.installments10x)}</div>
        <div class="diff-highlight">+${formatMoney(tGold.monthlyDiffFromBaseline10x)}/mês vs Suprema</div>
      </div>

      <div class="specs-list">
        <div class="spec-item">
          <span class="spec-label">Profundidade Marco:</span>
          <span class="spec-val">32 mm (+28%)</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Peso Alumínio Total:</span>
          <span class="spec-val">${tGold.totalWeightKg.toFixed(1)} kg (+${tGold.weightPercentDiffFromBaseline}%)</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Resistência ao Vento:</span>
          <span class="spec-val">1.950 Pa (Classe 4)</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Atenuação Acústica:</span>
          <span class="spec-val">32 dB (+7 dB isolamento)</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Vidros Recomendados:</span>
          <span class="spec-val">8 a 10mm Temperado</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Trilhos e Deslizamento:</span>
          <span class="spec-val">Capa Inox AISI 304</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Garantia Estrutural:</span>
          <span class="spec-val">5 Anos</span>
        </div>
      </div>
    </div>

    <!-- Linha Minimalista -->
    <div class="tier-card">
      <span class="tier-badge badge-mini">Arquitetura Slim</span>
      <div class="tier-series">Chroma Minimalista</div>
      <div class="tier-title">Linha Minimalista</div>
      <div class="tier-tagline">${escapeHtml(tMini.tier.tagline)}</div>

      <div class="tier-price-box">
        <div class="price-label">Valor Total do Pedido</div>
        <div class="price-val">${formatMoney(tMini.totalPrice)}</div>
        <div class="installments-val">10x sem juros de ${formatMoney(tMini.installments10x)}</div>
        <div class="diff-highlight">+${formatMoney(tMini.monthlyDiffFromBaseline10x)}/mês vs Suprema</div>
      </div>

      <div class="specs-list">
        <div class="spec-item">
          <span class="spec-label">Profundidade Marco:</span>
          <span class="spec-val">45 mm Oculto</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Peso Alumínio Total:</span>
          <span class="spec-val">${tMini.totalWeightKg.toFixed(1)} kg (+${tMini.weightPercentDiffFromBaseline}%)</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Resistência ao Vento:</span>
          <span class="spec-val">2.800 Pa (Classe 5+)</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Atenuação Acústica:</span>
          <span class="spec-val">38 dB (Termoacústico)</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Vidros Recomendados:</span>
          <span class="spec-val">Insulados Duplos Low-E</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Trilhos e Deslizamento:</span>
          <span class="spec-val">Trilho Piso Nível Zero</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Garantia Estrutural:</span>
          <span class="spec-val">10 Anos</span>
        </div>
      </div>
    </div>
  </div>

  <div class="table-section">
    <div class="section-title">Detalhamento dos Vãos do Pedido (${tSuprema.items.length} itens)</div>
    <table>
      <thead>
        <tr>
          <th>Ambiente / Vão</th>
          <th>Medidas (L x A)</th>
          <th>Qtd</th>
          <th>Linha Suprema</th>
          <th>Linha Gold (32mm)</th>
          <th>Chroma Minimalista</th>
        </tr>
      </thead>
      <tbody>
        ${tSuprema.items.map((it, idx) => {
          const goldIt = tGold.items[idx];
          const miniIt = tMini.items[idx];
          return `
            <tr>
              <td><b>${escapeHtml(it.roomTag)}</b><br/><span style="color:#64748b; font-size:8.5px;">${escapeHtml(it.typologyName)}</span></td>
              <td>${it.width} x ${it.height} mm</td>
              <td><b>${it.quantity} un</b></td>
              <td>${formatMoney(it.totalPrice)}</td>
              <td><b>${formatMoney(goldIt?.totalPrice || 0)}</b></td>
              <td>${formatMoney(miniIt?.totalPrice || 0)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer-note">
    <div><b>SANCHES &amp; MARQUES ESQUADRIAS PRO</b> • Proposta válida por 15 dias corridos.</div>
    <div>Emitido em ${dateStr} • Sujeito à aprovação final de projeto executivo.</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
