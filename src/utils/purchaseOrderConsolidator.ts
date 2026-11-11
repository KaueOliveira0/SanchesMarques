import { Order, ColorFinish } from '../types';

export interface ConsolidatorPiece {
  id: string;
  orderNumber: number;
  profileCode: string;
  profileName?: string;
  length: number;
  angleLeft?: number;
  angleRight?: number;
  color?: string;
}

export type PieceToCut = ConsolidatorPiece;

export interface ProfileCatalogEntry {
  code: string;
  name?: string;
  weightPerMeterKg?: number;
  kgm?: number;
  series?: string;
  pricePerKg?: number;
}

export interface PurchaseOrderItem {
  profileCode: string;
  profileName: string;
  series: string;
  color: string;
  totalCutLengthMm: number;
  piecesCount: number;
  totalBars6000: number;
  totalBars6000Needed?: number; // Alias para totalBars6000
  totalLinearMetersNeeded?: number; // Metros lineares
  commercialBundlesCount: number; // Fardos comerciais (amarrados c/ 4 ou 6 barras)
  totalWeightKg: number;
  pricePerKg: number;
  totalCostR$: number;
  estimatedTotalCost: number; // Alias para totalCostR$
}

export interface VolumePricingTier {
  minKg: number;
  maxKg: number;
  tierName: string;
  pricePerKg: number;
  discountPercent: number;
  badge: string;
}

export interface VolumeNegotiationResult {
  totalWeightKg: number;
  totalTons: number;
  currentTier: VolumePricingTier;
  negotiatedPricePerKg: number;
  baselinePricePerKg: number;
  baselineTotalCost: number;
  negotiatedTotalCost: number;
  totalSavingsR$: number;
  savingsPercent: number;
  nextTier: VolumePricingTier | null;
  missingKgToNextTier: number;
  potentialNextTierSavingsR$: number;
}

export interface ExtruderCompany {
  id: string;
  tradeName: string;
  legalName: string;
  cnpj: string;
  location: string;
  specialties: string;
  standardAlloy: string;
  leadTimeDays: number;
  minOrderKg: number;
  repContact: {
    name: string;
    phone: string;
    email: string;
  };
  volumeTiers: VolumePricingTier[];
}

export const VOLUME_TIERS_DEFAULT: VolumePricingTier[] = [
  {
    minKg: 0,
    maxKg: 300,
    tierName: 'Varejo / Fracionado (< 300 kg)',
    pricePerKg: 38.0,
    discountPercent: 0,
    badge: 'Tabela Padrão',
  },
  {
    minKg: 300,
    maxKg: 700,
    tierName: 'Lote Pequeno (300 a 700 kg)',
    pricePerKg: 35.5,
    discountPercent: 6.58,
    badge: '6.5% OFF',
  },
  {
    minKg: 700,
    maxKg: 1500,
    tierName: 'Meia Tonelada / 1 Ton (700 a 1.500 kg)',
    pricePerKg: 32.8,
    discountPercent: 13.68,
    badge: '13.7% OFF',
  },
  {
    minKg: 1500,
    maxKg: 3000,
    tierName: 'Lote Atacado (1.500 a 3.000 kg)',
    pricePerKg: 29.9,
    discountPercent: 21.32,
    badge: '21.3% OFF',
  },
  {
    minKg: 3000,
    maxKg: Infinity,
    tierName: 'Carreta / Carga Fechada (> 3 Toneladas)',
    pricePerKg: 27.5,
    discountPercent: 27.63,
    badge: '27.6% OFF Máximo',
  },
];

export const EXTRUDERS_DIRECTORY: ExtruderCompany[] = [
  {
    id: 'belmetal',
    tradeName: 'Belmetal',
    legalName: 'Belmetal Indústria e Comércio de Alumínio Ltda.',
    cnpj: '61.123.456/0001-99',
    location: 'São Paulo - SP / Distribuição Nacional',
    specialties: 'Linhas Suprema, Gold, Fachada Stick e Linha 25/30',
    standardAlloy: '6060-T5 e 6063-T6',
    leadTimeDays: 5,
    minOrderKg: 150,
    repContact: {
      name: 'Carlos Miranda (Comercial Belmetal)',
      phone: '11987651100',
      email: 'vendas.sp@belmetal.com.br',
    },
    volumeTiers: [
      { minKg: 0, maxKg: 300, tierName: 'Varejo (< 300 kg)', pricePerKg: 38.0, discountPercent: 0, badge: 'Padrão' },
      { minKg: 300, maxKg: 700, tierName: 'Lote PME (300-700 kg)', pricePerKg: 35.0, discountPercent: 7.9, badge: '7.9% OFF' },
      { minKg: 700, maxKg: 1500, tierName: 'Faixa 1 Ton (700-1.500 kg)', pricePerKg: 32.5, discountPercent: 14.5, badge: '14.5% OFF' },
      { minKg: 1500, maxKg: 3000, tierName: 'Atacado (1.500-3.000 kg)', pricePerKg: 29.5, discountPercent: 22.4, badge: '22.4% OFF' },
      { minKg: 3000, maxKg: Infinity, tierName: 'Carga Fechada (> 3.000 kg)', pricePerKg: 27.0, discountPercent: 28.9, badge: '28.9% OFF' },
    ],
  },
  {
    id: 'hydro',
    tradeName: 'Hydro Extrusões',
    legalName: 'Hydro Extrusões Brasil S.A.',
    cnpj: '04.832.910/0001-44',
    location: 'Itu e Santo André - SP',
    specialties: 'Alumínio de Baixo Carbono (Hydro CIRCAL), Linhas Pesadas e Perfis Especiais',
    standardAlloy: '6060-T5 e 6005A-T6',
    leadTimeDays: 7,
    minOrderKg: 300,
    repContact: {
      name: 'Mariana Duarte (Key Account Hydro)',
      phone: '11991232200',
      email: 'contato.extrusao@hydro.com',
    },
    volumeTiers: [
      { minKg: 0, maxKg: 300, tierName: 'Fracionado (< 300 kg)', pricePerKg: 39.0, discountPercent: 0, badge: 'Padrão' },
      { minKg: 300, maxKg: 700, tierName: 'Lote Padrão (300-700 kg)', pricePerKg: 36.0, discountPercent: 7.7, badge: '7.7% OFF' },
      { minKg: 700, maxKg: 1500, tierName: 'Lote 1 Ton (700-1.500 kg)', pricePerKg: 33.0, discountPercent: 15.4, badge: '15.4% OFF' },
      { minKg: 1500, maxKg: 3000, tierName: 'Atacado Industrial (1.5-3t)', pricePerKg: 29.8, discountPercent: 23.6, badge: '23.6% OFF' },
      { minKg: 3000, maxKg: Infinity, tierName: 'Contrato Tonelada (> 3t)', pricePerKg: 27.2, discountPercent: 30.2, badge: '30.2% OFF' },
    ],
  },
  {
    id: 'alcoa',
    tradeName: 'Alcoa / Kawneer',
    legalName: 'Alcoa Alumínio S.A.',
    cnpj: '61.408.026/0001-50',
    location: 'Poços de Caldas - MG / São Paulo - SP',
    specialties: 'Fachadas Unitizadas, Perfis Estruturais e Ligas de Alta Resistência',
    standardAlloy: '6063-T5 e 6061-T6',
    leadTimeDays: 10,
    minOrderKg: 400,
    repContact: {
      name: 'Roberto Silveira (Divisão Kawneer Alcoa)',
      phone: '11983453300',
      email: 'vendas.perfis@alcoa.com.br',
    },
    volumeTiers: [
      { minKg: 0, maxKg: 300, tierName: 'Balcão (< 300 kg)', pricePerKg: 39.5, discountPercent: 0, badge: 'Padrão' },
      { minKg: 300, maxKg: 700, tierName: 'Lote Obra (300-700 kg)', pricePerKg: 36.5, discountPercent: 7.6, badge: '7.6% OFF' },
      { minKg: 700, maxKg: 1500, tierName: 'Lote Tonelada (700-1.500 kg)', pricePerKg: 33.5, discountPercent: 15.2, badge: '15.2% OFF' },
      { minKg: 1500, maxKg: 3000, tierName: 'Grandes Obras (1.5-3t)', pricePerKg: 30.0, discountPercent: 24.0, badge: '24% OFF' },
      { minKg: 3000, maxKg: Infinity, tierName: 'Carga Fechada (> 3t)', pricePerKg: 27.5, discountPercent: 30.4, badge: '30.4% OFF' },
    ],
  },
  {
    id: 'miranda',
    tradeName: 'Miranda Alumínio',
    legalName: 'Miranda Metais & Alumínio Distribuidora Ltda.',
    cnpj: '12.345.678/0001-10',
    location: 'Guarulhos & Campinas - SP',
    specialties: 'Pronta Entrega de Barras Fracionadas, Suprema, Gold e Pinturas Rápidas',
    standardAlloy: '6060-T5',
    leadTimeDays: 3,
    minOrderKg: 50,
    repContact: {
      name: 'Fernando Castro (Atendimento Miranda)',
      phone: '11976544400',
      email: 'pedidos@mirandaaluminio.com.br',
    },
    volumeTiers: [
      { minKg: 0, maxKg: 300, tierName: 'Fracionado (< 300 kg)', pricePerKg: 37.5, discountPercent: 0, badge: 'Padrão' },
      { minKg: 300, maxKg: 700, tierName: 'Fardos Fechados (300-700 kg)', pricePerKg: 34.8, discountPercent: 7.2, badge: '7.2% OFF' },
      { minKg: 700, maxKg: 1500, tierName: '1 Tonelada (700-1.500 kg)', pricePerKg: 32.0, discountPercent: 14.7, badge: '14.7% OFF' },
      { minKg: 1500, maxKg: 3000, tierName: 'Atacado Miranda (1.5-3t)', pricePerKg: 29.2, discountPercent: 22.1, badge: '22.1% OFF' },
      { minKg: 3000, maxKg: Infinity, tierName: 'Carreta Direta (> 3t)', pricePerKg: 26.8, discountPercent: 28.5, badge: '28.5% OFF' },
    ],
  },
  {
    id: 'cba',
    tradeName: 'CBA (Cia. Brasileira de Alumínio)',
    legalName: 'Companhia Brasileira de Alumínio - CBA',
    cnpj: '61.409.892/0001-73',
    location: 'Alumínio - SP',
    specialties: 'Produção Primária de Lingotes e Perfis Extrudados para Grande Escala',
    standardAlloy: '6060-T5 e 6463-T6',
    leadTimeDays: 12,
    minOrderKg: 500,
    repContact: {
      name: 'Juliana Pires (Vendas Corporativas CBA)',
      phone: '11998885500',
      email: 'comercial.extrusao@cba.com.br',
    },
    volumeTiers: [
      { minKg: 0, maxKg: 300, tierName: 'Lote Mínimo (< 300 kg)', pricePerKg: 38.5, discountPercent: 0, badge: 'Padrão' },
      { minKg: 300, maxKg: 700, tierName: 'Lote Inicial (300-700 kg)', pricePerKg: 35.0, discountPercent: 9.1, badge: '9.1% OFF' },
      { minKg: 700, maxKg: 1500, tierName: 'Faixa 1 Ton (700-1.500 kg)', pricePerKg: 31.8, discountPercent: 17.4, badge: '17.4% OFF' },
      { minKg: 1500, maxKg: 3000, tierName: 'Atacado Industrial (1.5-3t)', pricePerKg: 28.5, discountPercent: 26.0, badge: '26% OFF' },
      { minKg: 3000, maxKg: Infinity, tierName: 'Carga Fechada Usina (> 3t)', pricePerKg: 26.0, discountPercent: 32.5, badge: '32.5% OFF' },
    ],
  },
];

export interface SupplierPurchaseOrder {
  id: string;
  supplierName: string;
  supplierCnpj: string;
  supplierCnpjOrContact?: string; // Alias
  orderDate: string;
  expectedDelivery: string;
  deliveryLeadTimeDays: number; // Prazo em dias
  color: string;
  items: PurchaseOrderItem[];
  totalBars6000: number;
  totalWeightKg: number;
  totalAmountR$: number;
  totalEstimatedCost: number; // Alias para totalAmountR$
  extruderInfo?: ExtruderCompany;
  volumeNegotiation?: VolumeNegotiationResult;
}

export type PeriodFilter = 'all' | 'this_week' | 'this_month' | 'last_30_days' | 'custom';

/**
 * Calcula a faixa de negociação por volume e o desconto por tonelada
 */
export const calculateVolumeNegotiation = (
  totalWeightKg: number,
  extruder?: ExtruderCompany
): VolumeNegotiationResult => {
  const tiers = extruder?.volumeTiers || VOLUME_TIERS_DEFAULT;
  const safeWeight = Math.max(0, totalWeightKg);
  const totalTons = Math.round((safeWeight / 1000) * 1000) / 1000;

  // Encontra o tier atual
  let currentTier = tiers[0];
  let currentTierIndex = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (safeWeight >= tiers[i].minKg && safeWeight < tiers[i].maxKg) {
      currentTier = tiers[i];
      currentTierIndex = i;
      break;
    }
  }

  // Se o peso exceder o último tier
  if (safeWeight >= tiers[tiers.length - 1].minKg) {
    currentTier = tiers[tiers.length - 1];
    currentTierIndex = tiers.length - 1;
  }

  const baselinePricePerKg = tiers[0].pricePerKg;
  const negotiatedPricePerKg = currentTier.pricePerKg;

  const baselineTotalCost = Math.round(safeWeight * baselinePricePerKg * 100) / 100;
  const negotiatedTotalCost = Math.round(safeWeight * negotiatedPricePerKg * 100) / 100;
  const totalSavingsR$ = Math.max(0, Math.round((baselineTotalCost - negotiatedTotalCost) * 100) / 100);
  const savingsPercent =
    baselineTotalCost > 0 ? Math.round((totalSavingsR$ / baselineTotalCost) * 1000) / 10 : 0;

  // Próximo tier
  const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
  const missingKgToNextTier = nextTier ? Math.max(0, Math.round((nextTier.minKg - safeWeight) * 10) / 10) : 0;
  const potentialNextTierSavingsR$ = nextTier
    ? Math.max(0, Math.round((baselinePricePerKg - nextTier.pricePerKg) * nextTier.minKg * 100) / 100)
    : 0;

  return {
    totalWeightKg: safeWeight,
    totalTons,
    currentTier,
    negotiatedPricePerKg,
    baselinePricePerKg,
    baselineTotalCost,
    negotiatedTotalCost,
    totalSavingsR$,
    savingsPercent,
    nextTier,
    missingKgToNextTier,
    potentialNextTierSavingsR$,
  };
};

/**
 * Filtra pedidos por status e período (Semana, Mês, 30 dias)
 */
export const filterOrdersForConsolidation = (
  orders: Order[],
  options: {
    period?: PeriodFilter;
    includeOnlyApproved?: boolean;
    selectedOrderIds?: string[];
    referenceDate?: Date;
  } = {}
): Order[] => {
  const {
    period = 'all',
    includeOnlyApproved = true,
    selectedOrderIds,
    referenceDate = new Date(),
  } = options;

  return orders.filter((o) => {
    // 1. Filtro de seleção manual de IDs
    if (selectedOrderIds && selectedOrderIds.length > 0) {
      return selectedOrderIds.includes(o.id);
    }

    // 2. Filtro de Status
    if (includeOnlyApproved) {
      const isApprovedOrInProd = o.status === 'Aprovado' || o.status === 'Em Produção' || o.status === 'Concluído';
      if (!isApprovedOrInProd) return false;
    }

    // 3. Filtro de Período
    if (period === 'all') return true;

    const orderDateStr = o.createdAt || o.date;
    if (!orderDateStr) return true;

    const orderTime = new Date(orderDateStr).getTime();
    if (isNaN(orderTime)) return true;

    const refTime = referenceDate.getTime();
    const diffDays = (refTime - orderTime) / (1000 * 60 * 60 * 24);

    if (period === 'this_week') {
      return diffDays >= -1 && diffDays <= 7.5;
    }

    if (period === 'this_month') {
      const oDate = new Date(orderDateStr);
      return (
        oDate.getFullYear() === referenceDate.getFullYear() &&
        oDate.getMonth() === referenceDate.getMonth()
      );
    }

    if (period === 'last_30_days') {
      return diffDays >= -1 && diffDays <= 31;
    }

    return true;
  });
};

/**
 * Consolidação principal de matéria-prima para pedidos de compra com extrusoras
 */
export const consolidatePurchaseOrders = (
  pieces: ConsolidatorPiece[],
  profilesDirectory: ProfileCatalogEntry[] = [],
  options: {
    safetyMarginPercent?: number;
    supplierName?: string;
    extruderId?: string;
    pricePerKgOverride?: number;
  } = {}
): SupplierPurchaseOrder[] => {
  const safetyMargin = (options.safetyMarginPercent ?? 5) / 100;
  const barLength = 6000;

  // Busca extrusora se informada
  const extruder =
    EXTRUDERS_DIRECTORY.find((e) => e.id === options.extruderId) ||
    (options.supplierName
      ? EXTRUDERS_DIRECTORY.find((e) => e.tradeName.toLowerCase() === options.supplierName?.toLowerCase())
      : undefined);

  // Agrupar por Cor e Perfil
  const map = new Map<string, ConsolidatorPiece[]>();
  for (const p of pieces) {
    const color = p.color || 'Branco';
    const key = `${p.profileCode}|${color}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(p);
  }

  // Agrupar itens por Cor de pintura/anodização
  const colorBatches = new Map<string, PurchaseOrderItem[]>();

  for (const [key, pList] of map.entries()) {
    const [code, color] = key.split('|');
    const profile = profilesDirectory.find((pr) => pr.code === code);
    const kgm = profile?.weightPerMeterKg ?? profile?.kgm ?? 0.65;
    const basePricePerKg = options.pricePerKgOverride ?? profile?.pricePerKg ?? 34.0;
    const series = profile?.series ?? 'Universal';
    const name = profile?.name ?? pList[0]?.profileName ?? code;

    const totalMm = pList.reduce((acc, p) => acc + p.length, 0);
    // Margem de segurança de corte e serragem
    const totalWithMarginMm = totalMm * (1 + safetyMargin);
    const barsNeeded = Math.ceil(totalWithMarginMm / barLength);
    const totalWeight = Math.round(barsNeeded * (barLength / 1000) * kgm * 10) / 10;
    const totalCost = Math.round(totalWeight * basePricePerKg * 100) / 100;

    const finalBars = Math.max(1, barsNeeded);
    const item: PurchaseOrderItem = {
      profileCode: code,
      profileName: name,
      series,
      color,
      totalCutLengthMm: totalMm,
      piecesCount: pList.length,
      totalBars6000: finalBars,
      totalBars6000Needed: finalBars,
      totalLinearMetersNeeded: Math.round((totalMm / 1000) * 10) / 10,
      commercialBundlesCount: Math.ceil(finalBars / 4),
      totalWeightKg: totalWeight,
      pricePerKg: basePricePerKg,
      totalCostR$: totalCost,
      estimatedTotalCost: totalCost,
    };

    if (!colorBatches.has(color)) {
      colorBatches.set(color, []);
    }
    colorBatches.get(color)!.push(item);
  }

  const result: SupplierPurchaseOrder[] = [];
  const now = new Date().toISOString().slice(0, 10);

  // Calcula peso total somado de todas as cores para calcular a faixa por tonelada
  let grandTotalWeightKg = 0;
  for (const items of colorBatches.values()) {
    for (const it of items) {
      grandTotalWeightKg += it.totalWeightKg;
    }
  }

  const volumeInfo = calculateVolumeNegotiation(grandTotalWeightKg, extruder);

  for (const [color, items] of colorBatches.entries()) {
    // Se a extrusora possui preço por tonelada negociado, aplica a cada item
    if (extruder && !options.pricePerKgOverride) {
      for (const it of items) {
        it.pricePerKg = volumeInfo.negotiatedPricePerKg;
        it.totalCostR$ = Math.round(it.totalWeightKg * volumeInfo.negotiatedPricePerKg * 100) / 100;
        it.estimatedTotalCost = it.totalCostR$;
      }
    }

    const totalBars = items.reduce((acc, it) => acc + it.totalBars6000, 0);
    const totalWeight = Math.round(items.reduce((acc, it) => acc + it.totalWeightKg, 0) * 10) / 10;
    const totalAmount = Math.round(items.reduce((acc, it) => acc + it.totalCostR$, 0) * 100) / 100;

    const finalSupplierName = extruder
      ? extruder.legalName
      : options.supplierName || 'Alumínio do Brasil S.A. / Extrusão Regional';
    const finalCnpj = extruder ? extruder.cnpj : '61.234.567/0001-89';
    const leadTime = extruder ? extruder.leadTimeDays : 7;

    result.push({
      id: `ped_forn_${Date.now()}_${color.toLowerCase()}`,
      supplierName: finalSupplierName,
      supplierCnpj: finalCnpj,
      supplierCnpjOrContact: extruder ? `${extruder.tradeName} • ${extruder.repContact.name} (${extruder.repContact.phone})` : finalCnpj,
      orderDate: now,
      expectedDelivery: new Date(Date.now() + leadTime * 86400000).toISOString().slice(0, 10),
      deliveryLeadTimeDays: leadTime,
      color,
      items,
      totalBars6000: totalBars,
      totalWeightKg: totalWeight,
      totalAmountR$: totalAmount,
      totalEstimatedCost: totalAmount,
      extruderInfo: extruder,
      volumeNegotiation: volumeInfo,
    });
  }

  return result;
};

/**
 * Exporta Pedido de Compra em formato CSV para importação direta em sistemas de distribuidoras
 */
export const exportPurchaseOrderCsv = (order: SupplierPurchaseOrder): string => {
  const rows: string[] = [];
  rows.push('FORNECEDOR;CNPJ;PEDIDO_DATA;PREVISAO_ENTREGA;ACABAMENTO_COR;PRAZO_DIAS');
  rows.push(
    `"${order.supplierName}";"${order.supplierCnpj}";"${order.orderDate}";"${order.expectedDelivery}";"${order.color}";${order.deliveryLeadTimeDays}`
  );
  rows.push('');
  rows.push('Codigo_Perfil;Descricao;Serie;Cor_Acabamento;Barras_6000mm;Metros_Lineares_Total;Fardos_Comerciais;Peso_Kg;Preco_Kg_RS;Valor_Total_RS');

  for (const it of order.items) {
    const totalM = (it.totalBars6000 * 6).toFixed(1);
    rows.push(
      `"${it.profileCode}";"${it.profileName}";"${it.series}";"${it.color}";${it.totalBars6000};${totalM};${it.commercialBundlesCount};${it.totalWeightKg};${it.pricePerKg.toFixed(2)};${it.totalCostR$.toFixed(2)}`
    );
  }

  rows.push('');
  rows.push(`TOTAL_GERAL;;;;"${order.color}";${order.totalBars6000};${(order.totalBars6000 * 6).toFixed(1)};;${order.totalWeightKg};;${order.totalAmountR$.toFixed(2)}`);

  return rows.join('\n');
};

/**
 * Gera mensagem estruturada e polida para o WhatsApp do representante comercial da extrusora
 */
export const generateExtruderWhatsAppQuote = (
  ordersByColor: SupplierPurchaseOrder[],
  extruder: ExtruderCompany,
  volumeInfo: VolumeNegotiationResult,
  ordersCount: number
): string => {
  const grandTotalBars = ordersByColor.reduce((acc, o) => acc + o.totalBars6000, 0);
  const grandTotalWeight = Math.round(ordersByColor.reduce((acc, o) => acc + o.totalWeightKg, 0) * 10) / 10;
  const grandTotalTons = (grandTotalWeight / 1000).toFixed(3);
  const grandTotalAmount = ordersByColor.reduce((acc, o) => acc + o.totalAmountR$, 0);

  const colorsList = ordersByColor.map((o) => `${o.color} (${o.totalBars6000} brs, ${o.totalWeightKg} kg)`).join(' • ');

  const itemsLines: string[] = [];
  for (const ord of ordersByColor) {
    itemsLines.push(`\n🎨 *LOTE ACABAMENTO: ${ord.color.toUpperCase()}* (${ord.totalBars6000} barras / ${ord.totalWeightKg} kg):`);
    for (const it of ord.items) {
      itemsLines.push(
        `• *${it.profileCode}* - ${it.profileName} (${it.series}): *${it.totalBars6000} barras 6m* | ${it.commercialBundlesCount} fardo(s) | ${it.totalWeightKg} kg`
      );
    }
  }

  return `Olá, *${extruder.repContact.name}*! Tudo bem?
Aqui é da equipe de Compras & PCP da *SANCHES & MARQUES ESQUADRIAS*.

📋 *SOLICITAÇÃO DE COTAÇÃO & PEDIDO DE COMPRA CONSOLIDADO*
🏢 *Distribuidora / Extrusora:* *${extruder.tradeName}* (${extruder.legalName})
📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}
📁 *Consolidação:* ${ordersCount} Ordem(ns) de Produção Aprovada(s)

─────────────────────
📊 *RESUMO DO LOTE CONSOLIDADO:*
• *Peso Total Estimado:* *${grandTotalWeight} kg* (*${grandTotalTons} toneladas*)
• *Total de Barras 6.000 mm:* *${grandTotalBars} barras*
• *Faixa de Negociação:* *${volumeInfo.currentTier.tierName}* (${volumeInfo.currentTier.badge})
• *Cores Solicitadas:* ${colorsList}
• *Especificação Técnica da Liga:* Alumínio ${extruder.standardAlloy}, barras de 6.000mm com embalagem de proteção

─────────────────────
📦 *RELAÇÃO DE BARRAS POR CÓDIGO E COR:*${itemsLines.join('\n')}

─────────────────────
💰 *CONDIÇÕES COMERCIAIS & NEGOCIAÇÃO POR TONELADA:*
• *Preço Base Consultado:* R$ ${volumeInfo.negotiatedPricePerKg.toFixed(2)}/kg
• *Valor Total Estimado do Lote:* R$ ${grandTotalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• *Prazo Desejado de Entrega:* ${extruder.leadTimeDays} dias úteis
${volumeInfo.nextTier ? `💡 *Oportunidade:* Se incluirmos mais *${volumeInfo.missingKgToNextTier} kg*, atingimos a faixa de *${volumeInfo.nextTier.tierName}* com melhor preço por tonelada.` : ''}

Poderia confirmar a disponibilidade de estoque para faturamento imediato, valor final por tonelada e a previsão de entrega na nossa fábrica?

Fico no aguardo do espelho de faturamento!
*SANCHES & MARQUES ESQUADRIAS & VIDRAÇARIA*
📞 (11) 98765-4321 / (11) 3456-7890
✉️ compras@sanchesemarques.com.br`;
};

/**
 * Cria URL direta para envio via WhatsApp Web / App
 */
export const createExtruderWhatsAppUrl = (phone: string, text: string): string => {
  const digits = phone.replace(/\D/g, '');
  const cleanPhone = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
};
