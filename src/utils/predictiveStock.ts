/**
 * Módulo de Análise Preditiva de Demanda e Ponto de Pedido de Estoque (PCP / Serralheria)
 * Sanches & Marques Esquadrias
 */

import type { StockProfile, Order } from '../types/index.ts';
import { PROFILES_CATALOG, TYPOLOGIES_CATALOG } from '../data/catalog.ts';

export interface PredictiveProfileInsight {
  profileCode: string;
  profileName: string;
  series: string;
  color: string;
  currentBarsQty: number;
  currentMeters: number;
  dailyConsumptionMeters: number;
  monthlyDemandMeters: number;
  leadTimeDays: number; // Prazo de entrega da fábrica/extrusora
  safetyStockMeters: number; // Estoque de segurança mínimo
  reorderPointMeters: number; // Ponto de Pedido ROP
  reorderPointBars: number;
  daysUntilStockout: number; // Dias até zerar o estoque
  urgencyLevel: 'CRITICO' | 'ALERTA' | 'ATENCAO' | 'SAUDAVEL';
  suggestedPurchaseBars: number; // Lote econômico recomendado
  estimatedPurchaseCostR$: number;
  supplierRecommended: string;
  reasoning: string;
}

export interface PredictiveStockDashboardSummary {
  totalProfilesMonitored: number;
  criticalCount: number;
  alertCount: number;
  healthyCount: number;
  totalSuggestedInvestmentR$: number;
  totalBarsToBuy: number;
  topPriorityProfiles: PredictiveProfileInsight[];
}

/**
 * Calcula a taxa de consumo diário em metros a partir dos pedidos em produção e catálogo
 */
export function calculateProfileDailyConsumption(
  profileCode: string,
  orders: Order[]
): number {
  let totalMetersDemanded = 0;

  // Analisar pedidos ativos (Aprovado, Em Produção, Concluído)
  const activeOrders = orders.filter(
    (o) => o.status === 'Aprovado' || o.status === 'Em Produção' || o.status === 'Concluído'
  );

  activeOrders.forEach((ord) => {
    ord.items.forEach((item) => {
      const typo = TYPOLOGIES_CATALOG.find((t) => t.id === item.typologyId);
      if (typo && typo.formula && typo.formula.cuts) {
        typo.formula.cuts.forEach((cut) => {
          if (cut.profileCode === profileCode) {
            const cutLenMm = cut.formula(item.width, item.height);
            const totalItemMeters = (cutLenMm / 1000) * cut.quantity * item.quantity;
            totalMetersDemanded += totalItemMeters;
          }
        });
      }
    });
  });

  // Base histórica mínima para perfis de alto giro (ex: marco e folha) caso haja poucos pedidos
  const baselineRates: Record<string, number> = {
    'SU-001': 4.2, // Marco lateral/cabeceira Suprema
    'SU-002': 3.8, // Marco soleira Suprema
    'SU-053': 5.5, // Montante lateral folha Suprema
    'SU-068': 4.8, // Travessa folha Suprema
    'SU-102': 6.0, // Baguete Suprema
    'GL-001': 2.8, // Linha Gold
    'GL-036': 3.2,
  };

  const calculatedRate = totalMetersDemanded / 30; // média móvel 30 dias
  const baseline = baselineRates[profileCode] || 1.5;

  return Math.round((Math.max(calculatedRate, baseline)) * 10) / 10;
}

/**
 * Gera a análise preditiva completa para o inventário de perfis de alumínio
 */
export function generatePredictiveStockInsights(
  stockProfiles: StockProfile[],
  orders: Order[],
  leadTimeDays: number = 10
): PredictiveStockDashboardSummary {
  const insights: PredictiveProfileInsight[] = stockProfiles.map((p) => {
    const dailyConsumptionMeters = calculateProfileDailyConsumption(p.code, orders);
    const monthlyDemandMeters = Math.round(dailyConsumptionMeters * 30 * 10) / 10;

    // Estoque de segurança: consumo de 5 dias
    const safetyStockMeters = Math.round(dailyConsumptionMeters * 5);
    // Ponto de pedido ROP = (ConsumoDiario * LeadTime) + EstoqueSegurança
    const reorderPointMeters = Math.round(dailyConsumptionMeters * leadTimeDays + safetyStockMeters);
    const reorderPointBars = Math.ceil(reorderPointMeters / 6);

    const currentMeters = p.wholeBarsQty * 6;
    const daysUntilStockout =
      dailyConsumptionMeters > 0 ? Math.round((currentMeters / dailyConsumptionMeters) * 10) / 10 : 999;

    let urgencyLevel: 'CRITICO' | 'ALERTA' | 'ATENCAO' | 'SAUDAVEL' = 'SAUDAVEL';
    if (daysUntilStockout <= leadTimeDays) {
      urgencyLevel = 'CRITICO';
    } else if (daysUntilStockout <= leadTimeDays * 1.5) {
      urgencyLevel = 'ALERTA';
    } else if (daysUntilStockout <= leadTimeDays * 2.5) {
      urgencyLevel = 'ATENCAO';
    }

    // Lote econômico de compra: cobrir 30 dias de demanda + recompor estoque mínimo
    let suggestedPurchaseBars = 0;
    if (urgencyLevel === 'CRITICO' || urgencyLevel === 'ALERTA') {
      const deficitMeters = Math.max(0, reorderPointMeters - currentMeters);
      const cycleMeters = dailyConsumptionMeters * 25; // 25 dias de giro
      suggestedPurchaseBars = Math.max(5, Math.ceil((deficitMeters + cycleMeters) / 6));
    } else if (urgencyLevel === 'ATENCAO') {
      suggestedPurchaseBars = Math.max(0, Math.ceil(reorderPointBars - p.wholeBarsQty));
    }

    const profDef = PROFILES_CATALOG.find((pr) => pr.code === p.code);
    const pricePerKg = profDef?.pricePerKg || 36.5;
    const kgm = p.kgm || 0.65;
    const estimatedPurchaseCostR$ = Math.round(suggestedPurchaseBars * 6 * kgm * pricePerKg);

    const suppliers = ['Alcoa Alumínio / Distribuidor Autorizado', 'CBA Extrusão', 'Perfil Alumínio Brasil', 'Hydro Extrusion'];
    const supplierRecommended = suppliers[Math.abs(p.code.charCodeAt(p.code.length - 1)) % suppliers.length];

    let reasoning = '';
    if (urgencyLevel === 'CRITICO') {
      reasoning = `RUPTURA IMINENTE EM ${daysUntilStockout} DIAS! O estoque acabará antes do prazo de entrega do fornecedor (${leadTimeDays} dias). Emitir pedido urgente de compra de ${suggestedPurchaseBars} barras.`;
    } else if (urgencyLevel === 'ALERTA') {
      reasoning = `Estoque atinge ponto de pedido em ${daysUntilStockout} dias. Recomendado solicitar cotação nesta semana (${suggestedPurchaseBars} barras).`;
    } else if (urgencyLevel === 'ATENCAO') {
      reasoning = `Giro moderado. Monitorar ordens de produção futuras.`;
    } else {
      reasoning = `Estoque em nível saudável (${daysUntilStockout} dias de autonomia estimada).`;
    }

    return {
      profileCode: p.code,
      profileName: p.name,
      series: p.series,
      color: p.color,
      currentBarsQty: p.wholeBarsQty,
      currentMeters,
      dailyConsumptionMeters,
      monthlyDemandMeters,
      leadTimeDays,
      safetyStockMeters,
      reorderPointMeters,
      reorderPointBars,
      daysUntilStockout,
      urgencyLevel,
      suggestedPurchaseBars,
      estimatedPurchaseCostR$,
      supplierRecommended,
      reasoning,
    };
  });

  // Ordenar prioridades (Críticos primeiro, depois Alerta)
  const priorityOrder = { CRITICO: 0, ALERTA: 1, ATENCAO: 2, SAUDAVEL: 3 };
  insights.sort((a, b) => priorityOrder[a.urgencyLevel] - priorityOrder[b.urgencyLevel] || a.daysUntilStockout - b.daysUntilStockout);

  const criticalCount = insights.filter((i) => i.urgencyLevel === 'CRITICO').length;
  const alertCount = insights.filter((i) => i.urgencyLevel === 'ALERTA').length;
  const healthyCount = insights.filter((i) => i.urgencyLevel === 'SAUDAVEL').length;

  const totalSuggestedInvestmentR$ = insights.reduce((acc, i) => acc + i.estimatedPurchaseCostR$, 0);
  const totalBarsToBuy = insights.reduce((acc, i) => acc + i.suggestedPurchaseBars, 0);

  return {
    totalProfilesMonitored: insights.length,
    criticalCount,
    alertCount,
    healthyCount,
    totalSuggestedInvestmentR$,
    totalBarsToBuy,
    topPriorityProfiles: insights,
  };
}
