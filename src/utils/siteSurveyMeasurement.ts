import { Order, OrderItem } from '../types';
import { getEffectiveCompanyProfile } from './companyProfile';
import { getEffectiveLogoBase64 } from './logoData';

export interface RoughOpeningDimensions {
  widthTopMm: number; // Largura topo
  widthCenterMm: number; // Largura meio
  widthBottomMm: number; // Largura base
  heightLeftMm: number; // Altura esquerda
  heightCenterMm: number; // Altura centro
  heightRightMm: number; // Altura direita
}

export interface DiagonalsMeasurement {
  diagonal1Mm: number; // Canto inferior esquerdo ao superior direito
  diagonal2Mm: number; // Canto inferior direito ao superior esquerdo
}

export interface SquarenessAnalysis {
  diffMm: number;
  theoreticalDiagonalMm: number;
  status: 'PERFECT' | 'TOLERABLE' | 'CRITICAL_OUT_OF_SQUARE';
  statusLabel: string;
  severity: 'success' | 'warning' | 'danger';
  recommendation: string;
  distortionDirection: 'none' | 'tilted_right' | 'tilted_left';
  skewDegrees: number;
}

export interface FrameDeductionResult {
  minRoughWidthMm: number;
  maxRoughWidthMm: number;
  widthVarianceMm: number;
  minRoughHeightMm: number;
  maxRoughHeightMm: number;
  heightVarianceMm: number;
  counterFrameClearanceMm: number; // Padrão: 25mm por lado
  finishedFabricationWidthMm: number; // Medida final da esquadria
  finishedFabricationHeightMm: number;
  counterFrameWidthMm: number; // Medida externa do contramarco
  counterFrameHeightMm: number;
  isOpeningIrregular: boolean;
}

export interface PlumbLevelCheck {
  sillLevelSlopeMm: number; // Desnível da soleira / peitoril
  leftJambPlumbMm: number; // Desvio de prumo montante esquerdo
  rightJambPlumbMm: number; // Desvio de prumo montante direito
  isLevelCompliant: boolean; // <= 2mm por metro
  isPlumbCompliant: boolean;
  notes?: string;
}

export interface SiteSurveyItem {
  id: string;
  orderId: string;
  orderNumber: number;
  clientName: string;
  roomName: string;
  typologyName: string;
  typologyId?: string;
  orderItemId?: string;
  roughOpening: RoughOpeningDimensions;
  diagonals: DiagonalsMeasurement;
  squareness: SquarenessAnalysis;
  deduction: FrameDeductionResult;
  plumbLevel: PlumbLevelCheck;
  wallType: 'Alvenaria Tijolo Cerâmico' | 'Bloco Concreto' | 'Drywall / Steel Frame' | 'Estrutura Metálica' | 'Concreto Armado' | string;
  casingType: 'Arremate Padrão (50mm)' | 'Arremate Duplo L' | 'Sem Arremate (Massa corrida)' | 'Chapa Especial' | string;
  anchorMethod: 'Chumbador Expansivo / Parabolt' | 'Parafuso Philips c/ Bucha Nylon' | 'Grapa de Chumbamento' | 'Grapa de Contramarco' | string;
  photos: string[]; // Imagens em base64 ou URLs
  technicalNotes: string;
  surveyorName: string;
  surveyDate: string;
  isVerifiedForProduction: boolean;
}

/**
 * Analisa a esquadria/retangularidade do vão pelas diagonais (D1 vs D2)
 * Tolerância conforme ABNT NBR 10821 / NBR 14718
 */
export const analyzeSquareness = (
  diagonal1Mm: number,
  diagonal2Mm: number,
  avgWidthMm: number,
  avgHeightMm: number
): SquarenessAnalysis => {
  const d1 = Math.max(0, diagonal1Mm);
  const d2 = Math.max(0, diagonal2Mm);
  const diffMm = Math.round(Math.abs(d1 - d2) * 10) / 10;

  const w = Math.max(1, avgWidthMm);
  const h = Math.max(1, avgHeightMm);
  const theoreticalDiagonalMm = Math.round(Math.sqrt(w * w + h * h) * 10) / 10;

  // Cálculo angular aproximado do paralelogramo
  let skewDegrees = 0;
  if (d1 > 0 && d2 > 0 && w > 0 && h > 0) {
    // tan(theta) ~ delta_D / (2 * sqrt(W^2 + H^2))
    skewDegrees = Math.round((Math.atan(diffMm / (2 * theoreticalDiagonalMm)) * (180 / Math.PI)) * 100) / 100;
  }

  let distortionDirection: 'none' | 'tilted_right' | 'tilted_left' = 'none';
  if (diffMm > 3) {
    distortionDirection = d1 > d2 ? 'tilted_right' : 'tilted_left';
  }

  // Tolerâncias industriais:
  // <= 3mm: Excelente
  // 3 a 8mm: Tolerável com arremate
  // > 8mm: Crítico! Alerta vermelho
  if (diffMm <= 3.0) {
    return {
      diffMm,
      theoreticalDiagonalMm,
      status: 'PERFECT',
      statusLabel: 'No Esquadro (Perfeito)',
      severity: 'success',
      recommendation: 'Vão aprovado sem restrições. Fabricação na medida padrão de projeto.',
      distortionDirection: 'none',
      skewDegrees,
    };
  }

  if (diffMm <= 8.0) {
    return {
      diffMm,
      theoreticalDiagonalMm,
      status: 'TOLERABLE',
      statusLabel: 'Tolerável (Compensar no Contramarco)',
      severity: 'warning',
      recommendation: `Diferença de ${diffMm}mm absorvida pela folga do contramarco e arremate de 50mm. Utilizar calços de nylon na instalação.`,
      distortionDirection,
      skewDegrees,
    };
  }

  return {
    diffMm,
    theoreticalDiagonalMm,
    status: 'CRITICAL_OUT_OF_SQUARE',
    statusLabel: 'CRÍTICO: Vão Fora de Esquadro!',
    severity: 'danger',
    recommendation: `ATENÇÃO: Vão com diferença de ${diffMm}mm entre diagonais! A alvenaria deve ser requadrada ou a esquadria deve ser reduzida para o menor retângulo inscrito com arremate reforçado.`,
    distortionDirection,
    skewDegrees,
  };
};

/**
 * Calcula as medidas de fabricação a partir dos 6 pontos de medição do vão bruto
 * Aplicando as folgas de contramarco (ex: 25mm por lado)
 */
export const calculateFinishedDimensions = (
  rough: RoughOpeningDimensions,
  clearancePerSideMm: number = 25
): FrameDeductionResult => {
  const widths = [rough.widthTopMm, rough.widthCenterMm, rough.widthBottomMm].filter((v) => v > 0);
  const heights = [rough.heightLeftMm, rough.heightCenterMm, rough.heightRightMm].filter((v) => v > 0);

  const minRoughWidthMm = widths.length > 0 ? Math.min(...widths) : 0;
  const maxRoughWidthMm = widths.length > 0 ? Math.max(...widths) : 0;
  const widthVarianceMm = maxRoughWidthMm - minRoughWidthMm;

  const minRoughHeightMm = heights.length > 0 ? Math.min(...heights) : 0;
  const maxRoughHeightMm = heights.length > 0 ? Math.max(...heights) : 0;
  const heightVarianceMm = maxRoughHeightMm - minRoughHeightMm;

  // A esquadria de acabamento deve ser calculada baseando-se no MENOR vão real encontrado
  // Deduzindo folga do contramarco (2 * clearancePerSideMm)
  const totalClearanceWidthMm = clearancePerSideMm * 2;
  const totalClearanceHeightMm = clearancePerSideMm * 2;

  const finishedFabricationWidthMm = Math.max(0, minRoughWidthMm - totalClearanceWidthMm);
  const finishedFabricationHeightMm = Math.max(0, minRoughHeightMm - totalClearanceHeightMm);

  // O contramarco externo tem folga intermediária (ex: 10mm menor que a alvenaria bruta)
  const counterFrameWidthMm = Math.max(0, minRoughWidthMm - 20);
  const counterFrameHeightMm = Math.max(0, minRoughHeightMm - 20);

  const isOpeningIrregular = widthVarianceMm > 6 || heightVarianceMm > 6;

  return {
    minRoughWidthMm,
    maxRoughWidthMm,
    widthVarianceMm,
    minRoughHeightMm,
    maxRoughHeightMm,
    heightVarianceMm,
    counterFrameClearanceMm: clearancePerSideMm,
    finishedFabricationWidthMm,
    finishedFabricationHeightMm,
    counterFrameWidthMm,
    counterFrameHeightMm,
    isOpeningIrregular,
  };
};

/**
 * Cria ou atualiza um item de vistoria técnica completo
 */
export const createSiteSurveyItem = (
  params: {
    orderId: string;
    orderNumber: number;
    clientName: string;
    roomName: string;
    typologyName?: string;
    typologyId?: string;
    orderItemId?: string;
    widthTopMm: number;
    widthCenterMm?: number;
    widthBottomMm?: number;
    heightLeftMm: number;
    heightCenterMm?: number;
    heightRightMm?: number;
    diagonal1Mm?: number;
    diagonal2Mm?: number;
    clearanceMm?: number;
    wallType?: string;
    casingType?: string;
    anchorMethod?: string;
    technicalNotes?: string;
    surveyorName?: string;
    photos?: string[];
  }
): SiteSurveyItem => {
  const wTop = params.widthTopMm || 1200;
  const wCenter = params.widthCenterMm || wTop;
  const wBottom = params.widthBottomMm || wTop;

  const hLeft = params.heightLeftMm || 1200;
  const hCenter = params.heightCenterMm || hLeft;
  const hRight = params.heightRightMm || hLeft;

  const roughOpening: RoughOpeningDimensions = {
    widthTopMm: wTop,
    widthCenterMm: wCenter,
    widthBottomMm: wBottom,
    heightLeftMm: hLeft,
    heightCenterMm: hCenter,
    heightRightMm: hRight,
  };

  const avgWidth = (wTop + wCenter + wBottom) / 3;
  const avgHeight = (hLeft + hCenter + hRight) / 3;

  // Se as diagonais não foram informadas, calcula a teórica perfeita
  const theoreticalDiag = Math.round(Math.sqrt(avgWidth * avgWidth + avgHeight * avgHeight));
  const d1 = params.diagonal1Mm || theoreticalDiag;
  const d2 = params.diagonal2Mm || theoreticalDiag;

  const diagonals: DiagonalsMeasurement = {
    diagonal1Mm: d1,
    diagonal2Mm: d2,
  };

  const squareness = analyzeSquareness(d1, d2, avgWidth, avgHeight);
  const deduction = calculateFinishedDimensions(roughOpening, params.clearanceMm || 25);

  const plumbLevel: PlumbLevelCheck = {
    sillLevelSlopeMm: Math.abs(hLeft - hRight),
    leftJambPlumbMm: Math.abs(wTop - wCenter),
    rightJambPlumbMm: Math.abs(wBottom - wCenter),
    isLevelCompliant: Math.abs(hLeft - hRight) <= 4,
    isPlumbCompliant: Math.abs(wTop - wBottom) <= 4,
  };

  return {
    id: `survey_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    clientName: params.clientName,
    roomName: params.roomName || 'Vão Principal',
    typologyName: params.typologyName || 'Janela de Correr',
    typologyId: params.typologyId,
    orderItemId: params.orderItemId,
    roughOpening,
    diagonals,
    squareness,
    deduction,
    plumbLevel,
    wallType: params.wallType || 'Alvenaria Tijolo Cerâmico',
    casingType: params.casingType || 'Arremate Padrão (50mm)',
    anchorMethod: params.anchorMethod || 'Grapa de Contramarco',
    photos: params.photos || [],
    technicalNotes: params.technicalNotes || '',
    surveyorName: params.surveyorName || 'Técnico Especialista Sanches & Marques',
    surveyDate: new Date().toISOString().slice(0, 10),
    isVerifiedForProduction: squareness.status !== 'CRITICAL_OUT_OF_SQUARE',
  };
};

const STORAGE_KEY = 'sm_site_surveys_v1';

/**
 * Inicializa medições de vistoria baseadas nas OPs existentes
 */
export const getStoredSurveys = (orders: Order[] = []): SiteSurveyItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Cria vistorias iniciais de amostra com dados reais das OPs
  const sampleSurveys: SiteSurveyItem[] = [];

  for (const order of orders) {
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      // Vão bruto é tipicamente a medida nominal + 50mm de contramarco (25mm por lado)
      const nominalW = item.width || 1200;
      const nominalH = item.height || 1200;
      const roughW = nominalW + 50;
      const roughH = nominalH + 50;

      // Simulamos pequenas variações reais de obra (ex: 2mm de variação em alvenaria)
      const isSecondOrder = order.number === 102;
      const d1Variation = isSecondOrder ? 11 : 2; // OP 102 propositalmente com desvio para demonstrar alerta de esquadro

      const theoretical = Math.round(Math.sqrt(roughW * roughW + roughH * roughH));

      sampleSurveys.push(
        createSiteSurveyItem({
          orderId: order.id,
          orderNumber: order.number,
          clientName: order.clientName,
          roomName: item.roomTag || item.location || `Vão ${i + 1}`,
          typologyName: item.typologyName,
          typologyId: item.typologyId,
          orderItemId: item.id,
          widthTopMm: roughW + (isSecondOrder ? 4 : 0),
          widthCenterMm: roughW,
          widthBottomMm: roughW - (isSecondOrder ? 6 : 1),
          heightLeftMm: roughH,
          heightCenterMm: roughH + 1,
          heightRightMm: roughH - (isSecondOrder ? 5 : 1),
          diagonal1Mm: theoretical + d1Variation,
          diagonal2Mm: theoretical,
          clearanceMm: 25,
          wallType: isSecondOrder ? 'Concreto Armado' : 'Alvenaria Tijolo Cerâmico',
          casingType: isSecondOrder ? 'Arremate Duplo L' : 'Arremate Padrão (50mm)',
          technicalNotes: isSecondOrder
            ? 'Vão da suíte com alvenaria inclinada no canto superior. Requer arremate duplo e calços reforçados.'
            : 'Vão no prumo e esquadro perfeitos. Liberado para produção com contramarco padrão.',
          surveyorName: 'Ricardo Mendes (Técnico de Medição)',
        })
      );
    }
  }

  saveSurveys(sampleSurveys);
  return sampleSurveys;
};

/**
 * Salva a lista de vistorias técnicas no localStorage
 */
export const saveSurveys = (surveys: SiteSurveyItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(surveys));
    window.dispatchEvent(new CustomEvent('sm_surveys_updated', { detail: surveys }));
  } catch {}
};

/**
 * Gera documento HTML para impressão e PDF da Ficha de Vistoria de Obra
 */
export const printSiteSurveySheet = (survey: SiteSurveyItem): void => {
  if (typeof window === 'undefined') return;

  const profile = getEffectiveCompanyProfile();
  const logoSrc = getEffectiveLogoBase64();

  const statusColor =
    survey.squareness.severity === 'success'
      ? '#059669'
      : survey.squareness.severity === 'warning'
      ? '#d97706'
      : '#dc2626';

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>Ficha Técnica de Medição &amp; Vistoria de Obra - ${survey.clientName}</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
      .header-wrap { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #b45309; padding-bottom: 10px; margin-bottom: 12px; }
      .header-logo { max-height: 48px; }
      .company-title { font-size: 18px; font-weight: 900; margin: 0; color: #0f172a; }
      .company-sub { font-size: 10px; color: #b45309; font-weight: bold; }
      .doc-badge { background: #0f172a; color: #fff; padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; display: inline-block; }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
      .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc; }
      .box-title { font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
      .diagram-box { text-align: center; background: #fff; border: 2px dashed #94a3b8; border-radius: 8px; padding: 15px; margin-bottom: 12px; position: relative; }
      .status-banner { background: ${statusColor}15; border: 2px solid ${statusColor}; color: ${statusColor}; padding: 10px; border-radius: 8px; font-size: 12px; font-weight: bold; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
      th, td { padding: 5px 8px; border: 1px solid #e2e8f0; text-align: left; }
      th { background: #f1f5f9; font-weight: bold; color: #334155; }
      .signatures { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
      .sig-line { width: 45%; border-top: 1px solid #0f172a; text-align: center; padding-top: 6px; font-size: 10px; }
    </style>
  </head>
  <body onload="window.print()">
    <div class="header-wrap">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${logoSrc}" class="header-logo" alt="Sanches &amp; Marques"/>
        <div>
          <h1 class="company-title">SANCHES &amp; MARQUES</h1>
          <div class="company-sub">FICHA TÉCNICA DE VISTORIA &amp; MEDIÇÃO DE VÃOS NA OBRA</div>
          <div style="font-size: 9px; color: #64748b;">${profile.phone} • ${profile.email} • ${profile.cityState}</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div class="doc-badge">MEDIÇÃO DE CAMPO</div>
        <div style="font-size: 14px; font-weight: bold; margin-top: 4px;">OP #${survey.orderNumber} - ${survey.roomName}</div>
        <div style="font-size: 10px; color: #475569;">Data Vistoria: <b>${survey.surveyDate}</b></div>
      </div>
    </div>

    <div class="status-banner">
      <div>
        <span style="font-size: 14px;">DIAGNÓSTICO DE ESQUADRO:</span> <b>${survey.squareness.statusLabel}</b>
        <div style="font-size: 11px; font-weight: normal; margin-top: 2px;">${survey.squareness.recommendation}</div>
      </div>
      <div style="font-size: 14px; font-family: monospace;">
        Δ Diagonais: <b>${survey.squareness.diffMm} mm</b>
      </div>
    </div>

    <div class="grid-2">
      <div class="box">
        <div class="box-title">Identificação do Vão &amp; Cliente</div>
        <div><b>Cliente / Obra:</b> ${survey.clientName}</div>
        <div><b>Ambiente / Pavimento:</b> ${survey.roomName}</div>
        <div><b>Tipologia Projetada:</b> ${survey.typologyName}</div>
        <div><b>Técnico de Medição:</b> ${survey.surveyorName}</div>
      </div>

      <div class="box">
        <div class="box-title">Alvenaria, Fixação &amp; Acabamento</div>
        <div><b>Tipo de Parede:</b> ${survey.wallType}</div>
        <div><b>Modelo de Arremate:</b> ${survey.casingType}</div>
        <div><b>Método de Fixação:</b> ${survey.anchorMethod}</div>
        <div><b>Folga Técnica de Contramarco:</b> ${survey.deduction.counterFrameClearanceMm} mm por lado</div>
      </div>
    </div>

    <!-- Diagrama das Dimensões Medidas no Vão Bruto -->
    <div class="diagram-box">
      <div style="font-size: 11px; font-weight: bold; color: #334155; margin-bottom: 8px;">
        VÃO BRUTO REAL DA ALVENARIA (6 PONTOS DE MEDIÇÃO) &amp; DIAGONAIS CRUZADAS
      </div>
      <svg width="480" height="260" viewBox="0 0 480 260" style="margin: 0 auto; display: block;">
        <!-- Retângulo do vão -->
        <rect x="70" y="30" width="340" height="190" fill="#f8fafc" stroke="#334155" stroke-width="2.5" rx="4" />
        
        <!-- Diagonais cruzadas -->
        <line x1="70" y1="220" x2="410" y2="30" stroke="#059669" stroke-width="1.5" stroke-dasharray="4,4" />
        <line x1="70" y1="30" x2="410" y2="220" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4,4" />

        <!-- Larguras (Topo, Meio, Base) -->
        <text x="240" y="20" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Largura Topo: ${survey.roughOpening.widthTopMm} mm</text>
        <text x="240" y="125" font-size="10" font-weight="bold" fill="#475569" text-anchor="middle">Meio: ${survey.roughOpening.widthCenterMm} mm</text>
        <text x="240" y="245" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Largura Base: ${survey.roughOpening.widthBottomMm} mm</text>

        <!-- Alturas (Esquerda, Centro, Direita) -->
        <text x="20" y="125" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" transform="rotate(-90 20 125)">Alt. Esq: ${survey.roughOpening.heightLeftMm} mm</text>
        <text x="240" y="165" font-size="9" fill="#64748b" text-anchor="middle">Alt. Centro: ${survey.roughOpening.heightCenterMm} mm</text>
        <text x="460" y="125" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" transform="rotate(90 460 125)">Alt. Dir: ${survey.roughOpening.heightRightMm} mm</text>

        <!-- Diagonais legend -->
        <text x="160" y="70" font-size="10" font-weight="bold" fill="#059669">D1: ${survey.diagonals.diagonal1Mm} mm</text>
        <text x="280" y="70" font-size="10" font-weight="bold" fill="#2563eb">D2: ${survey.diagonals.diagonal2Mm} mm</text>
      </svg>
    </div>

    <!-- Tabela Comparativa de Fabricação -->
    <table>
      <thead>
        <tr>
          <th>Parâmetro de Medição</th>
          <th style="text-align: center;">Mínimo Medido</th>
          <th style="text-align: center;">Máximo Medido</th>
          <th style="text-align: center;">Variação / Barriga</th>
          <th style="text-align: center; background: #e0f2fe; color: #0369a1;">Medida Externa Contramarco</th>
          <th style="text-align: center; background: #dcfce7; color: #15803d;">Medida Final de Fabricação</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><b>Largura do Vão (L)</b></td>
          <td style="text-align: center;">${survey.deduction.minRoughWidthMm} mm</td>
          <td style="text-align: center;">${survey.deduction.maxRoughWidthMm} mm</td>
          <td style="text-align: center; color: ${survey.deduction.widthVarianceMm > 6 ? '#dc2626' : '#059669'}; font-weight: bold;">${survey.deduction.widthVarianceMm} mm</td>
          <td style="text-align: center; font-weight: bold; background: #f0f9ff;">${survey.deduction.counterFrameWidthMm} mm</td>
          <td style="text-align: center; font-size: 13px; font-weight: 900; color: #15803d; background: #f0fdf4;">${survey.deduction.finishedFabricationWidthMm} mm</td>
        </tr>
        <tr>
          <td><b>Altura do Vão (H)</b></td>
          <td style="text-align: center;">${survey.deduction.minRoughHeightMm} mm</td>
          <td style="text-align: center;">${survey.deduction.maxRoughHeightMm} mm</td>
          <td style="text-align: center; color: ${survey.deduction.heightVarianceMm > 6 ? '#dc2626' : '#059669'}; font-weight: bold;">${survey.deduction.heightVarianceMm} mm</td>
          <td style="text-align: center; font-weight: bold; background: #f0f9ff;">${survey.deduction.counterFrameHeightMm} mm</td>
          <td style="text-align: center; font-size: 13px; font-weight: 900; color: #15803d; background: #f0fdf4;">${survey.deduction.finishedFabricationHeightMm} mm</td>
        </tr>
      </tbody>
    </table>

    ${survey.technicalNotes ? `
    <div class="box" style="margin-top: 10px;">
      <div class="box-title">Observações Técnicas de Campo &amp; Recomendações</div>
      <div style="font-size: 11px; color: #334155;">${survey.technicalNotes}</div>
    </div>` : ''}

    <div class="signatures">
      <div class="sig-line">
        <b>SANCHES &amp; MARQUES ESQUADRIAS</b><br/>
        Técnico de Medição: ${survey.surveyorName}
      </div>
      <div class="sig-line">
        <b>ENGENHEIRO / MESTRE DE OBRAS</b><br/>
        De acordo com as dimensões de vão bruto acima medidas
      </div>
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
    }, 250);
  }
};
