import { getEffectiveCompanyProfile } from './companyProfile';
import { getEffectiveLogoBase64 } from './logoData';

export interface InstallationHardwareConfig {
  clampSpacingMm: number; // Espaçamento entre grampos (padrão: 400mm)
  cornerOffsetMm: number; // Distância do primeiro grampo ao canto (padrão: 150mm)
  includeSillAnchors: boolean; // Se inclui grampos no peitoril (janelas sim, portas geralmente não)
  jointWidthMm: number; // Largura do cordão de vedação PU/silicone (padrão: 6mm)
  jointDepthMm: number; // Profundidade do cordão (padrão: 6mm)
  cartridgeVolumeMl: number; // Volume do tubo de selante (padrão: 310ml ou sachê 600ml)
  sealantWastePct: number; // Margem de perda/purga/limpeza (padrão: 15%)
  useExpandingFoam: boolean; // Preenchimento com espuma expansiva (sim/não)
  foamGapDepthMm: number; // Profundidade do vão a preencher com espuma (padrão: 50mm)
  foamGapWidthMm: number; // Espessura da folga alvenaria/contramarco (padrão: 15mm)
  foamCanVolumeMl: number; // Volume lata espuma (500ml rende ~20L a 25L expandidos)
  screwsPerClamp: number; // Parafusos por ponto de fixação (padrão: 2)
  unitPrices: {
    clamp: number; // R$ / un
    screwAndPlug: number; // R$ / un (parafuso inox + bucha)
    sealantTube: number; // R$ / un (PU 40 / silicone neutro 400g/310ml)
    foamCan: number; // R$ / un (espuma 500ml)
    maskingTapeRoll: number; // R$ / rolo 50m
    levelingWedgePack: number; // R$ / pct c/ 50 calços
  };
}

export const DEFAULT_HARDWARE_CONFIG: InstallationHardwareConfig = {
  clampSpacingMm: 400,
  cornerOffsetMm: 150,
  includeSillAnchors: true,
  jointWidthMm: 6,
  jointDepthMm: 6,
  cartridgeVolumeMl: 310,
  sealantWastePct: 15,
  useExpandingFoam: true,
  foamGapDepthMm: 50,
  foamGapWidthMm: 15,
  foamCanVolumeMl: 500,
  screwsPerClamp: 2,
  unitPrices: {
    clamp: 1.25, // R$ 1,25 por grampo chumbador com garra
    screwAndPlug: 0.65, // R$ 0,65 por parafuso inox + bucha nylon S8
    sealantTube: 26.50, // R$ 26,50 por tubo PU 40 / silicone 400g/310ml
    foamCan: 38.00, // R$ 38,00 por lata de espuma PU 500ml
    maskingTapeRoll: 12.00, // R$ 12,00 por rolo fita crepe 24mm x 50m
    levelingWedgePack: 18.00, // R$ 18,00 por pct calços plásticos
  },
};

export interface OpeningHardwareInput {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  quantity?: number;
  isDoorOrFloorToCeiling?: boolean;
}

export interface OpeningHardwareResult {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  perimeterLinearM: number;
  totalPerimeterLinearM: number;
  clampsPerUnit: number;
  totalClamps: number;
  screwsAndPlugsPerUnit: number;
  totalScrewsAndPlugs: number;
  sealantTubesRaw: number;
  sealantTubesRounded: number;
  foamCansRaw: number;
  foamCansRounded: number;
  maskingTapeMeters: number;
  levelingWedgesCount: number;
  estimatedCost: number;
}

export interface AggregatedHardwareSummary {
  totalOpenings: number;
  totalUnits: number;
  totalPerimeterM: number;
  totalClamps: number;
  totalScrewsAndPlugs: number;
  totalSealantTubes: number;
  totalFoamCans: number;
  totalMaskingTapeRolls: number;
  totalLevelingWedgePacks: number;
  costBreakdown: {
    clampsCost: number;
    screwsCost: number;
    sealantCost: number;
    foamCost: number;
    tapeCost: number;
    wedgesCost: number;
    totalCost: number;
  };
  averageCostPerOpening: number;
  items: OpeningHardwareResult[];
  config: InstallationHardwareConfig;
}

/**
 * Calcula quantidade de grampos em uma lateral ou travessa
 * Regra técnica:
 * - 1 grampo a cornerOffsetMm de cada extremidade
 * - Grampos intermediários distribuídos com passo <= spacingMm
 */
export function calculateSideClamps(lengthMm: number, spacingMm = 400, cornerOffsetMm = 150): number {
  if (lengthMm <= 0) return 0;
  if (lengthMm <= cornerOffsetMm * 2) {
    // Vão muito pequeno (ex: basculante 250mm) recebe no mínimo 1 ou 2 grampos
    return lengthMm < 200 ? 1 : 2;
  }
  const span = lengthMm - cornerOffsetMm * 2;
  const intermediateClamps = Math.max(0, Math.ceil(span / spacingMm) - 1);
  return 2 + intermediateClamps;
}

/**
 * Calcula os insumos de fixação e vedação para um único vão
 */
export function calculateSingleOpeningHardware(
  opening: OpeningHardwareInput,
  userConfig?: Partial<InstallationHardwareConfig>
): OpeningHardwareResult {
  const cfg: InstallationHardwareConfig = {
    ...DEFAULT_HARDWARE_CONFIG,
    ...userConfig,
    unitPrices: {
      ...DEFAULT_HARDWARE_CONFIG.unitPrices,
      ...(userConfig?.unitPrices || {}),
    },
  };

  const qty = Math.max(1, opening.quantity || 1);
  const w = Math.max(100, opening.widthMm);
  const h = Math.max(100, opening.heightMm);

  // Perímetro em metros lineares
  const perimeterLinearM = ((w + h) * 2) / 1000;
  const totalPerimeterLinearM = perimeterLinearM * qty;

  // Grampos chumbadores:
  // - 2 montantes laterais (esquerda e direita)
  // - 1 travessa superior (topo)
  // - 1 peitoril (base) se for janela e includeSillAnchors for true
  const leftJambClamps = calculateSideClamps(h, cfg.clampSpacingMm, cfg.cornerOffsetMm);
  const rightJambClamps = calculateSideClamps(h, cfg.clampSpacingMm, cfg.cornerOffsetMm);
  const headClamps = calculateSideClamps(w, cfg.clampSpacingMm, cfg.cornerOffsetMm);
  
  let sillClamps = 0;
  if (cfg.includeSillAnchors && !opening.isDoorOrFloorToCeiling) {
    sillClamps = calculateSideClamps(w, cfg.clampSpacingMm, cfg.cornerOffsetMm);
  }

  const clampsPerUnit = leftJambClamps + rightJambClamps + headClamps + sillClamps;
  const totalClamps = clampsPerUnit * qty;

  // Parafusos e buchas:
  // 2 por grampo chumbador + reforço de cantos (4 cantos x 1)
  const screwsAndPlugsPerUnit = clampsPerUnit * cfg.screwsPerClamp + 4;
  const totalScrewsAndPlugs = screwsAndPlugsPerUnit * qty;

  // Selante PU 40 / Silicone Neutro:
  // Área da seção transversal do cordão em mm² (ex: 6mm x 6mm = 36mm² = 36ml por metro)
  // Consumo por metro linear (ml/m) = largura * profundidade
  const beadVolumePerMeterMl = cfg.jointWidthMm * cfg.jointDepthMm;
  const totalMetersWithWaste = totalPerimeterLinearM * (1 + cfg.sealantWastePct / 100);
  const totalSealantMl = totalMetersWithWaste * beadVolumePerMeterMl;
  const sealantTubesRaw = totalSealantMl / Math.max(1, cfg.cartridgeVolumeMl);
  const sealantTubesRounded = Math.ceil(sealantTubesRaw);

  // Espuma Expansiva de PU:
  // Preenchimento de fresta entre alvenaria e contramarco (15mm x 50mm = 750ml por metro = 0.75L/m)
  // Lata de 500ml rende aproximadamente 20.000ml a 25.000ml (22L) de espuma curada
  let foamCansRaw = 0;
  let foamCansRounded = 0;
  if (cfg.useExpandingFoam) {
    const gapVolumePerMeterLiters = (cfg.foamGapWidthMm * cfg.foamGapDepthMm) / 1000; // L/m
    const expandedYieldPerCanLiters = (cfg.foamCanVolumeMl * 45) / 1000; // ~22.5L curados
    const totalFoamLitersNeeded = totalPerimeterLinearM * gapVolumePerMeterLiters;
    foamCansRaw = totalFoamLitersNeeded / Math.max(1, expandedYieldPerCanLiters);
    foamCansRounded = Math.ceil(foamCansRaw);
  }

  // Fita crepe para mascaramento:
  // 2 fitas por perímetro (um lado no alumínio, outro lado na alvenaria)
  const maskingTapeMeters = totalPerimeterLinearM * 2;

  // Calços de nivelamento: 2 por vão na base + 2 nos cantos superiores
  const levelingWedgesCount = 4 * qty;

  // Custos parciais
  const costClamps = totalClamps * cfg.unitPrices.clamp;
  const costScrews = totalScrewsAndPlugs * cfg.unitPrices.screwAndPlug;
  const costSealant = sealantTubesRounded * cfg.unitPrices.sealantTube;
  const costFoam = foamCansRounded * cfg.unitPrices.foamCan;
  const costTape = (maskingTapeMeters / 50) * cfg.unitPrices.maskingTapeRoll;
  const costWedges = (levelingWedgesCount / 50) * cfg.unitPrices.levelingWedgePack;

  const estimatedCost = Math.round((costClamps + costScrews + costSealant + costFoam + costTape + costWedges) * 100) / 100;

  return {
    id: opening.id,
    name: opening.name,
    widthMm: w,
    heightMm: h,
    quantity: qty,
    perimeterLinearM: Math.round(perimeterLinearM * 100) / 100,
    totalPerimeterLinearM: Math.round(totalPerimeterLinearM * 100) / 100,
    clampsPerUnit,
    totalClamps,
    screwsAndPlugsPerUnit,
    totalScrewsAndPlugs,
    sealantTubesRaw: Math.round(sealantTubesRaw * 100) / 100,
    sealantTubesRounded,
    foamCansRaw: Math.round(foamCansRaw * 100) / 100,
    foamCansRounded,
    maskingTapeMeters: Math.round(maskingTapeMeters * 10) / 10,
    levelingWedgesCount,
    estimatedCost,
  };
}

/**
 * Agrega o cálculo para múltiplos vãos de uma obra ou orçamento
 */
export function aggregateHardwareRequirements(
  openings: OpeningHardwareInput[],
  userConfig?: Partial<InstallationHardwareConfig>
): AggregatedHardwareSummary {
  const cfg: InstallationHardwareConfig = {
    ...DEFAULT_HARDWARE_CONFIG,
    ...userConfig,
    unitPrices: {
      ...DEFAULT_HARDWARE_CONFIG.unitPrices,
      ...(userConfig?.unitPrices || {}),
    },
  };

  const safeOpenings = openings.length > 0
    ? openings
    : [
        {
          id: 'default_v1',
          name: 'Vão Padrão (Exemplo 1500x1200mm)',
          widthMm: 1500,
          heightMm: 1200,
          quantity: 1,
        },
      ];

  const items = safeOpenings.map((op) => calculateSingleOpeningHardware(op, cfg));

  const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0);
  const totalPerimeterM = Math.round(items.reduce((acc, it) => acc + it.totalPerimeterLinearM, 0) * 100) / 100;
  const totalClamps = items.reduce((acc, it) => acc + it.totalClamps, 0);
  const totalScrewsAndPlugs = items.reduce((acc, it) => acc + it.totalScrewsAndPlugs, 0);

  // Para tubos de selante e latas de espuma do projeto como um todo, somamos as necessidades brutas
  // e arredondamos no total para evitar comprar tubo sobrando por vão fracionado
  const totalSealantMl = items.reduce((acc, it) => {
    const beadVolumePerMeterMl = cfg.jointWidthMm * cfg.jointDepthMm;
    const totalMetersWithWaste = it.totalPerimeterLinearM * (1 + cfg.sealantWastePct / 100);
    return acc + totalMetersWithWaste * beadVolumePerMeterMl;
  }, 0);
  const totalSealantTubes = Math.max(1, Math.ceil(totalSealantMl / Math.max(1, cfg.cartridgeVolumeMl)));

  let totalFoamCans = 0;
  if (cfg.useExpandingFoam) {
    const gapVolumePerMeterLiters = (cfg.foamGapWidthMm * cfg.foamGapDepthMm) / 1000;
    const expandedYieldPerCanLiters = (cfg.foamCanVolumeMl * 45) / 1000;
    const totalFoamLitersNeeded = totalPerimeterM * gapVolumePerMeterLiters;
    totalFoamCans = Math.max(1, Math.ceil(totalFoamLitersNeeded / Math.max(1, expandedYieldPerCanLiters)));
  }

  const totalMaskingTapeMeters = totalPerimeterM * 2;
  const totalMaskingTapeRolls = Math.max(1, Math.ceil(totalMaskingTapeMeters / 50));
  const totalLevelingWedges = totalUnits * 4;
  const totalLevelingWedgePacks = Math.max(1, Math.ceil(totalLevelingWedges / 50));

  const clampsCost = Math.round(totalClamps * cfg.unitPrices.clamp * 100) / 100;
  const screwsCost = Math.round(totalScrewsAndPlugs * cfg.unitPrices.screwAndPlug * 100) / 100;
  const sealantCost = Math.round(totalSealantTubes * cfg.unitPrices.sealantTube * 100) / 100;
  const foamCost = Math.round(totalFoamCans * cfg.unitPrices.foamCan * 100) / 100;
  const tapeCost = Math.round(totalMaskingTapeRolls * cfg.unitPrices.maskingTapeRoll * 100) / 100;
  const wedgesCost = Math.round(totalLevelingWedgePacks * cfg.unitPrices.levelingWedgePack * 100) / 100;

  const totalCost = Math.round((clampsCost + screwsCost + sealantCost + foamCost + tapeCost + wedgesCost) * 100) / 100;
  const averageCostPerOpening = totalUnits > 0 ? Math.round((totalCost / totalUnits) * 100) / 100 : 0;

  return {
    totalOpenings: items.length,
    totalUnits,
    totalPerimeterM,
    totalClamps,
    totalScrewsAndPlugs,
    totalSealantTubes,
    totalFoamCans,
    totalMaskingTapeRolls,
    totalLevelingWedgePacks,
    costBreakdown: {
      clampsCost,
      screwsCost,
      sealantCost,
      foamCost,
      tapeCost,
      wedgesCost,
      totalCost,
    },
    averageCostPerOpening,
    items,
    config: cfg,
  };
}

/**
 * Gera mensagem formatada para WhatsApp / Almoxarifado / Equipe de Obra
 */
export function generateInstallationKitWhatsAppMessage(
  summary: AggregatedHardwareSummary,
  clientName = 'Cliente',
  orderNumber?: number | string,
  obraAddress?: string
): string {
  const company = getEffectiveCompanyProfile();
  const opLabel = orderNumber ? `• OP #${orderNumber}` : '';
  const dateStr = new Date().toLocaleDateString('pt-BR');

  let text = `📦 *KIT DE INSUMOS DE FIXAÇÃO & VEDAÇÃO DE OBRA*\n`;
  text += `🏭 *${company.name || 'Sanches & Marques Esquadrias'}* ${opLabel}\n`;
  text += `👤 *Cliente:* ${clientName}\n`;
  if (obraAddress) text += `📍 *Local:* ${obraAddress}\n`;
  text += `📅 *Data da Separação:* ${dateStr}\n`;
  text += `───────────────────────\n`;
  text += `📋 *RESUMO DA OBRA (${summary.totalUnits} vãos / ${summary.totalPerimeterM}m de perímetro)*:\n\n`;

  text += `🔹 *${summary.totalClamps} un* - Grampos Chumbadores c/ Garra (Contramarco)\n`;
  text += `🔹 *${summary.totalScrewsAndPlugs} un* - Parafusos Inox + Buchas Nylon S8\n`;
  text += `🔹 *${summary.totalSealantTubes} tubos* - Selante PU 40 / Silicone Neutro 400g (${summary.config.jointWidthMm}x${summary.config.jointDepthMm}mm c/ 15% margem)\n`;

  if (summary.config.useExpandingFoam && summary.totalFoamCans > 0) {
    text += `🔹 *${summary.totalFoamCans} latas* - Espuma Expansiva de PU 500ml\n`;
  }

  text += `🔹 *${summary.totalMaskingTapeRolls} rolos* - Fita Crepe Automotiva 24mm x 50m\n`;
  text += `🔹 *${summary.totalLevelingWedgePacks} pct* - Calços Plásticos Niveladores (50 un/pct)\n`;
  text += `───────────────────────\n`;

  text += `💰 *CUSTO ESTIMADO DO KIT:* R$ ${summary.costBreakdown.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  text += `📊 *Média por Vão:* R$ ${summary.averageCostPerOpening.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;

  text += `📝 *RELAÇÃO DE VÃOS:*\n`;
  summary.items.forEach((it, idx) => {
    text += `${idx + 1}. *${it.name}* (${it.quantity}x ${it.widthMm}x${it.heightMm}mm) ➔ ${it.totalClamps} grampos, ${it.totalScrewsAndPlugs} parafusos, ${it.sealantTubesRounded} tubo(s) PU\n`;
  });

  text += `\n✅ *Checklist de Carregamento:* Todos os insumos conferidos conforme ABNT NBR 10821.`;

  return text;
}

/**
 * Imprime a Ficha de Separação de Insumos com Layout Corporativo e Caixas de Checagem
 */
export function printInstallationHardwareSheet(
  summary: AggregatedHardwareSummary,
  clientName = 'Cliente',
  orderNumber?: number | string,
  obraAddress?: string
): void {
  const company = getEffectiveCompanyProfile();
  const logoSrc = getEffectiveLogoBase64();
  const dateStr = new Date().toLocaleDateString('pt-BR');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Kit de Insumos de Fixação - ${clientName} - OP #${orderNumber || 'S/N'}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11pt; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
    .logo-box { display: flex; align-items: center; gap: 12px; }
    .logo-img { height: 48px; object-fit: contain; }
    .title-box { text-align: right; }
    .title-box h1 { margin: 0; font-size: 16pt; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
    .title-box p { margin: 2px 0 0; font-size: 9pt; color: #475569; }
    .meta-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; margin-bottom: 16px; font-size: 9.5pt; }
    .meta-item strong { display: block; font-size: 8pt; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
    
    .kpi-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; background: #ffffff; text-align: center; }
    .kpi-val { font-size: 16pt; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .kpi-label { font-size: 7.5pt; text-transform: uppercase; color: #64748b; font-weight: 700; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9pt; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 7px 8px; font-weight: 700; font-size: 8pt; text-transform: uppercase; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    tr:nth-child(even) td { background: #f8fafc; }
    .check-box { width: 14px; height: 14px; border: 1.5px solid #0f172a; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 6px; }

    .checklist-section { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; margin-bottom: 16px; }
    .checklist-title { font-weight: 800; font-size: 10pt; text-transform: uppercase; margin-bottom: 8px; color: #0f172a; display: flex; align-items: center; justify-content: space-between; }
    .checklist-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .check-item { display: flex; align-items: center; font-size: 9.5pt; }

    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 24px; padding-top: 12px; }
    .sig-line { border-top: 1px solid #94a3b8; text-align: center; font-size: 8.5pt; color: #475569; padding-top: 4px; }
    .footer { text-align: center; font-size: 7.5pt; color: #94a3b8; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-box">
      ${logoSrc ? `<img src="${logoSrc}" class="logo-img" alt="Logo">` : ''}
      <div>
        <strong style="font-size: 13pt; display: block; color: #0f172a;">${company.name || 'SANCHES & MARQUES'}</strong>
        <span style="font-size: 8.5pt; color: #64748b;">${company.tagline || 'Esquadrias de Alumínio & Vidros'}</span>
      </div>
    </div>
    <div class="title-box">
      <h1>FICHA DE SEPARAÇÃO: INSUMOS DE FIXAÇÃO</h1>
      <p>Romaneio de Almoxarifado para Obra • NBR 10821</p>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <strong>Cliente & Local da Obra</strong>
      <span>${clientName} • ${obraAddress || 'Endereço da obra'}</span>
    </div>
    <div class="meta-item">
      <strong>Ordem de Produção</strong>
      <span>${orderNumber ? `OP #${orderNumber}` : 'Avulso / Medição'}</span>
    </div>
    <div class="meta-item">
      <strong>Data de Emissão</strong>
      <span>${dateStr}</span>
    </div>
  </div>

  <div class="kpi-cards">
    <div class="kpi-card">
      <div class="kpi-label">Grampos Contramarco</div>
      <div class="kpi-val">${summary.totalClamps} un</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Parafusos Inox + Buchas</div>
      <div class="kpi-val">${summary.totalScrewsAndPlugs} un</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Selante PU 40 (Tubes)</div>
      <div class="kpi-val">${summary.totalSealantTubes} un</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Espuma Expansiva (Latas)</div>
      <div class="kpi-val">${summary.totalFoamCans} un</div>
    </div>
  </div>

  <div class="checklist-section">
    <div class="checklist-title">
      <span>CHECKLIST DE SEPARAÇÃO PARA ALMOXARIFADO</span>
      <span style="font-size: 8pt; color: #64748b; font-weight: normal;">Conferência física na saída</span>
    </div>
    <div class="checklist-grid">
      <div class="check-item"><span class="check-box"></span> <strong>${summary.totalClamps} un</strong> &nbsp;Grampos chumbadores p/ contramarco com garra</div>
      <div class="check-item"><span class="check-box"></span> <strong>${summary.totalScrewsAndPlugs} un</strong> &nbsp;Parafusos Inox 4.2x38 ou 4.8x50 + Buchas Nylon S8</div>
      <div class="check-item"><span class="check-box"></span> <strong>${summary.totalSealantTubes} tubos</strong> &nbsp;Selante PU 40 / Neutro 400g (Vedação Perimetral)</div>
      ${summary.config.useExpandingFoam ? `<div class="check-item"><span class="check-box"></span> <strong>${summary.totalFoamCans} latas</strong> &nbsp;Espuma Expansiva PU 500ml</div>` : ''}
      <div class="check-item"><span class="check-box"></span> <strong>${summary.totalMaskingTapeRolls} rolos</strong> &nbsp;Fita Crepe 24mm x 50m (Proteção perfis)</div>
      <div class="check-item"><span class="check-box"></span> <strong>${summary.totalLevelingWedgePacks} pct</strong> &nbsp;Calços plásticos niveladores de peitoril</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Vão / Cômodo</th>
        <th style="width: 100px;">Larg x Alt (mm)</th>
        <th style="width: 50px; text-align: center;">Qtd</th>
        <th style="width: 70px; text-align: right;">Perímetro</th>
        <th style="width: 70px; text-align: right;">Grampos</th>
        <th style="width: 70px; text-align: right;">Parafusos</th>
        <th style="width: 70px; text-align: right;">PU 40</th>
        <th style="width: 40px; text-align: center;">Conf.</th>
      </tr>
    </thead>
    <tbody>
      ${summary.items.map((it, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${it.name}</strong></td>
          <td>${it.widthMm} x ${it.heightMm}</td>
          <td style="text-align: center;">${it.quantity}</td>
          <td style="text-align: right;">${it.totalPerimeterLinearM} m</td>
          <td style="text-align: right;"><strong>${it.totalClamps}</strong></td>
          <td style="text-align: right;">${it.totalScrewsAndPlugs}</td>
          <td style="text-align: right;">${it.sealantTubesRounded} tb</td>
          <td style="text-align: center;"><span class="check-box" style="margin: 0;"></span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-line">
      Responsável pela Separação (Almoxarifado)
    </div>
    <div class="sig-line">
      Responsável pela Instalação / Técnico na Obra
    </div>
  </div>

  <div class="footer">
    Documento emitido por Sanches & Marques Esquadrias Pro • Diretriz ABNT NBR 10821:2017 - Esquadrias para Edificações.
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  }
}
