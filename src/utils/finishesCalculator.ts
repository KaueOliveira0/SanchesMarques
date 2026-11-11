import { ALUMINUM_FINISHES_CATALOG, AluminumFinish } from '../data/finishesCatalog';
import { Order, OrderItem } from '../types';

export interface FinishCostImpact {
  currentMultiplier: number;
  targetMultiplier: number;
  baseMaterialCost: number;
  adjustedMaterialCost: number;
  differenceR$: number;
  differencePercent: number;
}

/**
 * Retorna um acabamento pelo ID ou código comercial
 */
export function findFinishByIdOrCode(query: string): AluminumFinish | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  return ALUMINUM_FINISHES_CATALOG.find(
    (f) =>
      f.id.toLowerCase() === q ||
      f.commercialCode.toLowerCase() === q ||
      f.name.toLowerCase().includes(q)
  );
}

/**
 * Calcula a variação de custo entre o acabamento atual e o acabamento alvo
 */
export function calculateFinishCostImpact(
  currentMultiplier: number,
  targetMultiplier: number,
  baseMaterialCost: number
): FinishCostImpact {
  const safeCurrent = currentMultiplier > 0 ? currentMultiplier : 1.0;
  const safeTarget = targetMultiplier > 0 ? targetMultiplier : 1.0;
  const safeCost = Math.max(0, baseMaterialCost);

  // Custo base sem multiplicador
  const unmultipliedCost = safeCost / safeCurrent;
  const adjustedMaterialCost = unmultipliedCost * safeTarget;
  const differenceR$ = adjustedMaterialCost - safeCost;
  const differencePercent = ((safeTarget - safeCurrent) / safeCurrent) * 100;

  return {
    currentMultiplier: safeCurrent,
    targetMultiplier: safeTarget,
    baseMaterialCost: safeCost,
    adjustedMaterialCost: Math.round(adjustedMaterialCost * 100) / 100,
    differenceR$: Math.round(differenceR$ * 100) / 100,
    differencePercent: Math.round(differencePercent * 10) / 10,
  };
}

/**
 * Mapeia uma categoria de acabamento amigável para um ColorFinish do sistema
 */
export function mapFinishToColorCategory(finish: AluminumFinish): 'Branco' | 'Preto' | 'Bronze' | 'Natural' | 'Amadeirado' {
  if (finish.id.includes('branco')) return 'Branco';
  if (finish.id.includes('preto') || finish.id.includes('antracite') || finish.id.includes('7016')) return 'Preto';
  if (finish.id.includes('bronze') || finish.id.includes('corten')) return 'Bronze';
  if (finish.id.includes('carvalho') || finish.id.includes('nogueira') || finish.id.includes('cerejeira') || finish.category === 'Amadeirado Sublimação') {
    return 'Amadeirado';
  }
  return 'Natural';
}

/**
 * Aplica um acabamento a um pedido e recalcula os custos proporcionais
 */
export function applyFinishToOrder(
  order: Order,
  targetFinish: AluminumFinish
): Order {
  const colorCategory = mapFinishToColorCategory(targetFinish);
  const targetMultiplier = targetFinish.multiplier;

  // Atualiza itens do pedido com a nova cor e acabamento
  const updatedItems: OrderItem[] = order.items.map((item) => {
    const unitPrice = item.unitPrice || 0;
    // Ajusta o preço unitário proporcionalmente
    const newUnitPrice = Math.round(unitPrice * targetMultiplier * 100) / 100;
    const newTotalPrice = Math.round(newUnitPrice * item.quantity * 100) / 100;

    return {
      ...item,
      color: colorCategory,
      aluminumColor: `${targetFinish.name} (${targetFinish.commercialCode})`,
      unitPrice: newUnitPrice,
      totalPrice: newTotalPrice,
    };
  });

  // Recalcula totais do pedido
  const newSubtotal = updatedItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
  const finalPrice = Math.max(0, newSubtotal - (order.discountValue || 0));

  return {
    ...order,
    color: colorCategory,
    items: updatedItems,
    subtotal: newSubtotal,
    finalPrice: finalPrice,
    history: [
      ...(order.history || []),
      {
        date: new Date().toISOString(),
        action: `Acabamento alterado para "${targetFinish.name}" (Multiplicador ${targetMultiplier}x)`,
      },
    ],
  };
}

/**
 * Gera o texto do laudo técnico de acabamento e garantia para o cliente/arquiteto
 */
export function generateFinishTechnicalSpecText(
  finish: AluminumFinish,
  companyName: string = 'Sanches & Marques Esquadrias Pro'
): string {
  return [
    `═══════════════════════════════════════════════════════════`,
    `   CERTIFICADO TÉCNICO DE ACABAMENTO & GARANTIA - ALUMÍNIO`,
    `               ${companyName.toUpperCase()}`,
    `═══════════════════════════════════════════════════════════`,
    ``,
    `ACABAMENTO ESPECIFICADO: ${finish.name}`,
    `CÓDIGO INDUSTRIAL: ${finish.commercialCode}`,
    `CATEGORIA: ${finish.category}`,
    `NORMA ABNT APLICÁVEL: ${finish.spec.norma}`,
    `PROCESSO INDUSTRIAL: ${finish.spec.processType}`,
    `ESPESSURA DA CAMADA: ${finish.spec.thicknessMicrons}`,
    `RESISTÊNCIA A NÉVOA SALINA (NBR 8094): ${finish.spec.saltSprayHours} horas de ensaio em câmara salina`,
    `GARANTIA CONTRA DESBOTAMENTO UV: ${finish.spec.uvResistanceYears} anos de fábrica`,
    finish.spec.qualicoatClass ? `CERTIFICAÇÃO INTERNACIONAL: ${finish.spec.qualicoatClass}` : '',
    ``,
    `AMBIENTES RECOMENDADOS:`,
    ...finish.spec.recommendedEnvironments.map((env) => `  • ${env}`),
    ``,
    `INSTRUÇÕES DE CONSERVAÇÃO & LIMPEZA:`,
    `  ${finish.spec.maintenanceTip}`,
    ``,
    `DESCRIÇÃO TÉCNICA:`,
    `  ${finish.description}`,
    `═══════════════════════════════════════════════════════════`,
  ].filter(Boolean).join('\n');
}
