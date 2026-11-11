/**
 * Módulo de Engenharia Térmica & Eficiência Energética de Esquadrias
 * Conforme ABNT NBR 15575 (Desempenho Térmico de Edificações),
 * ISO 10077-1 e Programa Brasileiro de Etiquetagem PBE Edifica.
 */

export interface ThermalWindowInput {
  widthMm: number;
  heightMm: number;
  frameType: 'alum_sem_ruptura' | 'alum_com_ruptura' | 'pvc_camaras' | 'madeira';
  glassType: 'comum_incolor' | 'temperado_6mm' | 'laminado_8mm' | 'duplo_insulado_ar' | 'duplo_insulado_argonio' | 'low_e_insulado';
  frameProfileFaceWidthMm?: number; // Largura aparente dos perfis (ex: 60mm)
  sealGasketsCount?: number; // 2 ou 3 planos de vedação EPDM
  bioclimaticZone?: number; // Zona bioclimática 1 a 8 NBR 15220 / NBR 15575
}

export interface ThermalWindowResult {
  totalAreaM2: number;
  frameAreaM2: number;
  glassAreaM2: number;
  frameRatioPercent: number; // Porcentagem de alumínio no vão
  glassRatioPercent: number; // Porcentagem de vidro
  uFrameW_M2K: number;       // Uf do caixilho (W/m²·K)
  uGlassW_M2K: number;       // Ug do vidro (W/m²·K)
  linearSpacerPsiW_MK: number; // Psi da borda quente / intercalador (W/m·K)
  uWindowW_M2K: number;      // Uw total da esquadria
  solarHeatGainCoeff: number;// Fator Solar (FS / SHGC) 0 a 1
  visibleLightTransmittance: number; // VLT %
  procelRating: 'A' | 'B' | 'C' | 'D' | 'E';
  acousticAttenuationDb: number; // dB estimado
  nbr15575Compliance: {
    status: 'Conforme - Nível Superior' | 'Conforme - Nível Intermediário' | 'Conforme - Nível Mínimo' | 'Não Atende';
    description: string;
    annualKwhSavedPerM2: number; // Economia estimada de ar-condicionado em kWh/(m²·ano)
  };
  comparativeOptions: Array<{
    name: string;
    uWindow: number;
    solarFactor: number;
    savingVsBaselinePercent: number;
    description: string;
  }>;
}

// Coeficientes térmicos de perfis (Uf) em W/(m²·K)
export const FRAME_THERMAL_PROPERTIES = {
  alum_sem_ruptura: { name: 'Alumínio Convencional (Sem Ruptura Térmica)', uf: 6.8, psi: 0.08 },
  alum_com_ruptura: { name: 'Alumínio com Ruptura Térmica (Thermal Break)', uf: 3.2, psi: 0.06 },
  pvc_camaras: { name: 'PVC com Câmaras de Ar Internas', uf: 2.2, psi: 0.04 },
  madeira: { name: 'Madeira Maciça Certificada', uf: 2.0, psi: 0.04 },
};

// Coeficientes térmicos de vidros (Ug) e Fator Solar (FS)
export const GLASS_THERMAL_PROPERTIES = {
  comum_incolor: { name: 'Vidro Float Incolor 4mm', ug: 5.8, fs: 0.82, vlt: 88, rwDb: 29 },
  temperado_6mm: { name: 'Vidro Temperado 6mm', ug: 5.7, fs: 0.80, vlt: 87, rwDb: 31 },
  laminado_8mm: { name: 'Vidro Laminado 4+4mm c/ PVB', ug: 5.4, fs: 0.76, vlt: 85, rwDb: 35 },
  duplo_insulado_ar: { name: 'Duplo Insulado 4+12+4mm (Câmara Ar Seco)', ug: 2.7, fs: 0.70, vlt: 78, rwDb: 36 },
  duplo_insulado_argonio: { name: 'Duplo Insulado 4+16+4mm com Gás Argônio', ug: 2.3, fs: 0.68, vlt: 77, rwDb: 38 },
  low_e_insulado: { name: 'Insulado 6mm Low-E + 14mm + 6mm Temperado', ug: 1.4, fs: 0.38, vlt: 65, rwDb: 40 },
};

export type WindowThermalSimulationResult = ThermalWindowResult;

export const FRAME_THERMAL_PRESETS = Object.entries(FRAME_THERMAL_PROPERTIES).map(([id, prop]) => ({
  id,
  name: prop.name,
  uf: prop.uf,
}));

export const GLAZING_THERMAL_PRESETS = Object.entries(GLASS_THERMAL_PROPERTIES).map(([id, prop]) => ({
  id,
  name: prop.name,
  ug: prop.ug,
}));

/**
 * Calcula a Transmitância Térmica Global Uw da Janela / Fachada
 * Fórmula: Uw = (Af * Uf + Ag * Ug + lg * Psi) / (Af + Ag)
 */
export function calculateWindowThermalPerformance(
  input: ThermalWindowInput
): ThermalWindowResult {
  const widthM = input.widthMm / 1000;
  const heightM = input.heightMm / 1000;
  const totalAreaM2 = Math.max(0.1, widthM * heightM);

  const faceW = (input.frameProfileFaceWidthMm || 65) / 1000;
  const perimeterM = 2 * (widthM + heightM);

  // Área do caixilho (marco + folhas aparentes)
  const glassWidthM = Math.max(0.1, widthM - 2 * faceW);
  const glassHeightM = Math.max(0.1, heightM - 2 * faceW);
  const glassAreaM2 = Math.min(totalAreaM2 * 0.9, glassWidthM * glassHeightM);
  const frameAreaM2 = Math.max(0.05, totalAreaM2 - glassAreaM2);

  const frameRatioPercent = Math.round((frameAreaM2 / totalAreaM2) * 100);
  const glassRatioPercent = 100 - frameRatioPercent;

  const frameProp = FRAME_THERMAL_PROPERTIES[input.frameType] || FRAME_THERMAL_PROPERTIES.alum_sem_ruptura;
  const glassProp = GLASS_THERMAL_PROPERTIES[input.glassType] || GLASS_THERMAL_PROPERTIES.temperado_6mm;

  // Perímetro linear de contato vidro-perfil (intercalador)
  const glassPerimeterM = 2 * (glassWidthM + glassHeightM);
  const linearPsi = frameProp.psi;

  // Cálculo da fórmula ISO 10077-1
  const uwNumerator = (frameAreaM2 * frameProp.uf) + (glassAreaM2 * glassProp.ug) + (glassPerimeterM * linearPsi);
  const uWindowW_M2K = Math.round((uwNumerator / totalAreaM2) * 100) / 100;

  // Fator Solar ponderado
  const solarHeatGainCoeff = Math.round(((glassAreaM2 / totalAreaM2) * glassProp.fs + (frameAreaM2 / totalAreaM2) * 0.05) * 100) / 100;

  // Classificação Procel Edifica / PBE
  let procelRating: 'A' | 'B' | 'C' | 'D' | 'E' = 'C';
  if (uWindowW_M2K <= 2.2 && solarHeatGainCoeff <= 0.45) procelRating = 'A';
  else if (uWindowW_M2K <= 3.2 && solarHeatGainCoeff <= 0.60) procelRating = 'B';
  else if (uWindowW_M2K <= 4.5) procelRating = 'C';
  else if (uWindowW_M2K <= 5.5) procelRating = 'D';
  else procelRating = 'E';

  // NBR 15575 avaliação
  let status: ThermalWindowResult['nbr15575Compliance']['status'] = 'Conforme - Nível Mínimo';
  let description = '';
  let annualKwhSavedPerM2 = 0;

  if (uWindowW_M2K <= 2.4) {
    status = 'Conforme - Nível Superior';
    description = 'Excelente isolamento térmico. Reduz drasticamente a entrada de calor solar no verão e perda de calor no inverno.';
    annualKwhSavedPerM2 = 58;
  } else if (uWindowW_M2K <= 3.8) {
    status = 'Conforme - Nível Intermediário';
    description = 'Boa eficiência térmica com vidro duplo ou laminado refletivo, atingindo desempenho intermediário da NBR 15575.';
    annualKwhSavedPerM2 = 34;
  } else if (uWindowW_M2K <= 5.7) {
    status = 'Conforme - Nível Mínimo';
    description = 'Atende aos critérios mínimos de transmitância para as Zonas Bioclimáticas brasileiras (ZB 1 a ZB 8).';
    annualKwhSavedPerM2 = 12;
  } else {
    status = 'Não Atende';
    description = 'Transmitância térmica muito alta. Recomenda-se vidro com melhor desempenho ou persiana integrada para sombreamento.';
    annualKwhSavedPerM2 = 0;
  }

  // Comparações com opções superiores
  const baselineUw = 5.6; // Janela comum
  const comparativeOptions = [
    {
      name: 'Padrão Vidro Comum 4mm',
      uWindow: 5.6,
      solarFactor: 0.81,
      savingVsBaselinePercent: 0,
      description: 'Alta perda térmica e alto ganho solar indesejado.',
    },
    {
      name: 'Laminado Acústico 8mm',
      uWindow: 4.9,
      solarFactor: 0.74,
      savingVsBaselinePercent: 12,
      description: 'Melhora de atenuação acústica com isolamento térmico intermediário.',
    },
    {
      name: 'Duplo Insulado 4+12+4mm',
      uWindow: 2.9,
      solarFactor: 0.65,
      savingVsBaselinePercent: 48,
      description: 'Câmara de ar hermética reduz o fluxo de calor pela metade.',
    },
    {
      name: 'Insulado com Vidro Low-E',
      uWindow: 1.8,
      solarFactor: 0.36,
      savingVsBaselinePercent: 68,
      description: 'Máxima tecnologia: bloqueia 64% da radiação solar e reduz custos de climatização.',
    },
  ];

  return {
    totalAreaM2: Math.round(totalAreaM2 * 100) / 100,
    frameAreaM2: Math.round(frameAreaM2 * 100) / 100,
    glassAreaM2: Math.round(glassAreaM2 * 100) / 100,
    frameRatioPercent,
    glassRatioPercent,
    uFrameW_M2K: frameProp.uf,
    uGlassW_M2K: glassProp.ug,
    linearSpacerPsiW_MK: linearPsi,
    uWindowW_M2K,
    solarHeatGainCoeff,
    visibleLightTransmittance: glassProp.vlt,
    procelRating,
    acousticAttenuationDb: glassProp.rwDb,
    nbr15575Compliance: {
      status,
      description,
      annualKwhSavedPerM2,
    },
    comparativeOptions,
  };
}
