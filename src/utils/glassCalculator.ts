import { TypologyItem } from '../types';

export interface WindPressureResult {
  windSpeedMs: number;
  pressurePa: number;
  pressureKgfM2: number;
  description: string;
}

export type WindRegion = 'I' | 'II' | 'III' | 'IV' | 'V';
export type HeightCategory = 'terreo_5m' | 'ate_10m' | 'ate_15m' | 'ate_20m' | 'ate_30m' | 'ate_60m' | 'acima_60m';
export type ExposureTerrain = 'urbano_denso' | 'suburbano_normal' | 'aberto_campo' | 'litoral_aberto';

export const calculateWindPressure = (
  region: WindRegion = 'III',
  heightCategory: HeightCategory = 'terreo_5m',
  exposureTerrain: ExposureTerrain = 'suburbano_normal'
): WindPressureResult => {
  const baseSpeeds: Record<WindRegion, number> = {
    I: 30,
    II: 35,
    III: 40,
    IV: 45,
    V: 50,
  };

  const heightFactors: Record<HeightCategory, number> = {
    terreo_5m: 1.0,
    ate_10m: 1.15,
    ate_15m: 1.22,
    ate_20m: 1.3,
    ate_30m: 1.42,
    ate_60m: 1.55,
    acima_60m: 1.85,
  };

  const terrainFactors: Record<ExposureTerrain, number> = {
    urbano_denso: 0.85,
    suburbano_normal: 1.0,
    aberto_campo: 1.15,
    litoral_aberto: 1.35,
  };

  const v0 = baseSpeeds[region] || 40;
  const s2 = heightFactors[heightCategory] || 1.0;
  const s3 = terrainFactors[exposureTerrain] || 1.0;

  const vk = v0 * s2 * s3 * 0.95; // Velocidade característica
  const qPa = 0.613 * vk * vk; // Pressão dinâmica q = 0.613 * V² (Pa)
  const pressureKgfM2 = qPa / 9.80665;

  return {
    windSpeedMs: Math.round(vk * 10) / 10,
    pressurePa: Math.round(qPa),
    pressureKgfM2: Math.round(pressureKgfM2 * 10) / 10,
    description: `Região ${region} - ${heightCategory.replace('_', ' ')} (${exposureTerrain.replace('_', ' ')})`,
  };
};

export interface GlassWeightResult {
  weightPerM2Kg: number;
  totalWeightKg: number;
}

export const calculateGlassWeight = (
  areaM2: number,
  thicknessMm: number,
  category: 'Comum' | 'Temperado' | 'Laminado' | 'Insulado' | 'Refletivo' | string = 'Comum'
): GlassWeightResult => {
  const glassDensity = 2.5; // kg / (m² · mm)
  let weightPerM2 = thicknessMm * glassDensity;

  if (category === 'Laminado') {
    // Interlayer PVB adiciona cerca de 0.8 kg/m²
    weightPerM2 += 0.8;
  } else if (category === 'Insulado') {
    // Perfil separador de alumínio + dessecante + selante
    weightPerM2 += 1.2;
  }

  const totalWeight = Math.round(areaM2 * weightPerM2 * 10) / 10;

  return {
    weightPerM2Kg: Math.round(weightPerM2 * 10) / 10,
    totalWeightKg: totalWeight,
  };
};

export interface GlassThicknessResult {
  minimumTheoreticalMm: number;
  recommendedCommercialMm: number;
}

export const calculateRequiredGlassThickness = (
  spanWMm: number,
  spanHMm: number,
  pressurePa: number,
  category: string = 'Temperado'
): GlassThicknessResult => {
  const minSide = Math.min(spanWMm, spanHMm);
  const maxSide = Math.max(spanWMm, spanHMm);
  const ratio = maxSide / minSide;

  // Coeficiente empírico de flexão de placa apoiada nos 4 lados (NBR 7199)
  const alpha = Math.min(0.08, 0.04 + (ratio - 1) * 0.015);
  // t_min = b * sqrt(alpha * q / sigma_adm)
  // sigma_adm: Temperado ~50 MPa, Comum ~15 MPa
  const sigmaAdm = category === 'Temperado' || category.includes('Temperado') ? 50 : 18;
  const theoretical = (minSide / 1000) * Math.sqrt((alpha * pressurePa) / (sigmaAdm * 1000)) * 1000;

  const safeThick = Math.max(3.5, theoretical * 1.15);

  const commercialSteps = [4, 6, 8, 10, 12, 16, 20];
  const recommended = commercialSteps.find((s) => s >= safeThick) || 12;

  return {
    minimumTheoreticalMm: Math.round(safeThick * 10) / 10,
    recommendedCommercialMm: recommended,
  };
};

export interface GlassDimensionsExtract {
  widthMm: number;
  heightMm: number;
  quantityPerItem: number;
  areaM2: number;
}

export const getGlassDimensionsForWindow = (
  widthMm: number,
  heightMm: number,
  typology: TypologyItem
): GlassDimensionsExtract => {
  const gCut = typology.formula.glass[0];
  if (!gCut) {
    const w = Math.round(widthMm / 2 - 95);
    const h = Math.round(heightMm - 145);
    return {
      widthMm: w,
      heightMm: h,
      quantityPerItem: 2,
      areaM2: Math.round(((w * h * 2) / 1000000) * 100) / 100,
    };
  }

  const w = gCut.formulaW(widthMm, heightMm);
  const h = gCut.formulaH(widthMm, heightMm);
  const qty = gCut.quantity;
  const area = (w * h * qty) / 1000000;

  return {
    widthMm: w,
    heightMm: h,
    quantityPerItem: qty,
    areaM2: Math.round(area * 100) / 100,
  };
};

export interface HardwareCapacityCheck {
  status: 'ok' | 'warning' | 'danger';
  message: string;
  recommendedHardware: string;
  maxLoadPerLeafKg: number;
}

export const checkHardwareCapacity = (
  weightPerLeafKg: number,
  typology: TypologyItem
): HardwareCapacityCheck => {
  const isGold = typology.series === 'Gold' || typology.name.toLowerCase().includes('gold');
  const maxLoad = isGold ? 120 : 35; // Roldanas Suprema: 30-35kg, Gold: 120kg

  if (weightPerLeafKg <= maxLoad) {
    return {
      status: 'ok',
      message: `Folha com ${weightPerLeafKg}kg dentro do limite (${maxLoad}kg)`,
      recommendedHardware: isGold ? 'Roldana Dupla com Agulha Gold' : 'Roldana Simples Suprema Nylon',
      maxLoadPerLeafKg: maxLoad,
    };
  }

  if (weightPerLeafKg <= maxLoad * 1.3) {
    return {
      status: 'warning',
      message: `Folha com ${weightPerLeafKg}kg excede capacidade padrão (${maxLoad}kg). Recomendado upgrade de roldana dupla ou linha Gold.`,
      recommendedHardware: isGold ? 'Roldana Quadrupla Inox Especial' : 'Roldana Dupla Suprema de Latão/Inox',
      maxLoadPerLeafKg: maxLoad,
    };
  }

  return {
    status: 'danger',
    message: `PERIGO: Peso da folha (${weightPerLeafKg}kg) excede criticamente capacidade (${maxLoad}kg)! Risco de descarrilamento ou desgaste precoce.`,
    recommendedHardware: 'Substituição mandatória para Linha Gold ou Sistema Elevável',
    maxLoadPerLeafKg: maxLoad,
  };
};

export interface FullWindowGlassCalculation {
  sheetWidthMm: number;
  sheetHeightMm: number;
  quantityTotal: number;
  areaPerSheetM2: number;
  totalAreaM2: number;
  weightPerSheetKg: number;
  totalItemGlassWeightKg: number;
  windPressurePa: number;
  recommendedGlassType: string;
  hardwareCheck: HardwareCapacityCheck;
}

export const calculateWindowGlass = (params: {
  windowWidthMm: number;
  windowHeightMm: number;
  itemQuantity?: number;
  windRegion?: WindRegion;
  heightCategory?: HeightCategory;
  exposureTerrain?: ExposureTerrain;
  selectedGlassThicknessMm?: number;
  selectedGlassCategory?: string;
  typology?: TypologyItem;
}): FullWindowGlassCalculation => {
  const itemQty = params.itemQuantity || 1;
  const w = params.windowWidthMm;
  const h = params.windowHeightMm;

  const wind = calculateWindPressure(params.windRegion, params.heightCategory, params.exposureTerrain);
  const thicknessCheck = calculateRequiredGlassThickness(
    w / 2,
    h,
    wind.pressurePa,
    params.selectedGlassCategory || 'Temperado'
  );

  const sheetW = Math.round(w / 2 - 95);
  const sheetH = Math.round(h - 145);
  const areaSheet = (sheetW * sheetH) / 1000000;
  const totalSheets = 2 * itemQty;
  const totalArea = areaSheet * totalSheets;

  const thickness = params.selectedGlassThicknessMm || thicknessCheck.recommendedCommercialMm;
  const weight = calculateGlassWeight(areaSheet, thickness, params.selectedGlassCategory);
  const totalWeight = calculateGlassWeight(totalArea, thickness, params.selectedGlassCategory);

  const dummyTyp: TypologyItem = params.typology || {
    id: 'default',
    code: 'J-COR',
    name: 'Janela de Correr',
    series: 'Suprema',
    category: 'Janela de Correr',
    description: '',
    previewSvg: '',
    formula: { cuts: [], glass: [], accessories: [] },
  };

  const hardware = checkHardwareCapacity(weight.totalWeightKg, dummyTyp);

  return {
    sheetWidthMm: sheetW,
    sheetHeightMm: sheetH,
    quantityTotal: totalSheets,
    areaPerSheetM2: Math.round(areaSheet * 100) / 100,
    totalAreaM2: Math.round(totalArea * 100) / 100,
    weightPerSheetKg: weight.totalWeightKg,
    totalItemGlassWeightKg: totalWeight.totalWeightKg,
    windPressurePa: wind.pressurePa,
    recommendedGlassType: `Vidro ${params.selectedGlassCategory || 'Temperado'} ${thickness}mm`,
    hardwareCheck: hardware,
  };
};
