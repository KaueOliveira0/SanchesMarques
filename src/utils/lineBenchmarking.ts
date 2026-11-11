export interface AluminumLineSpec {
  series: 'Suprema' | 'Gold' | 'Chroma' | 'Linha 25' | 'Linha 30' | string;
  category: 'Econômica' | 'Intermediária' | 'Alto Padrão' | 'Premium Acústica';
  nominalDepthMm: number;
  acousticAttenuationDb: number;
  maxLeafWeightKg: number;
  momentOfInertiaIxCm4: number;
  aluminumBasePricePerKg: number;
  laborFactor: number;
  recommendedMaxHeightMm: number;
}

export const BENCHMARK_LINES: AluminumLineSpec[] = [
  {
    series: 'Linha 25',
    category: 'Econômica',
    nominalDepthMm: 25,
    acousticAttenuationDb: 22,
    maxLeafWeightKg: 25,
    momentOfInertiaIxCm4: 2.1,
    aluminumBasePricePerKg: 32.0,
    laborFactor: 1.0,
    recommendedMaxHeightMm: 1400,
  },
  {
    series: 'Suprema',
    category: 'Intermediária',
    nominalDepthMm: 25,
    acousticAttenuationDb: 26,
    maxLeafWeightKg: 35,
    momentOfInertiaIxCm4: 4.2,
    aluminumBasePricePerKg: 34.5,
    laborFactor: 1.05,
    recommendedMaxHeightMm: 1800,
  },
  {
    series: 'Linha 30',
    category: 'Intermediária',
    nominalDepthMm: 30,
    acousticAttenuationDb: 28,
    maxLeafWeightKg: 50,
    momentOfInertiaIxCm4: 5.8,
    aluminumBasePricePerKg: 36.0,
    laborFactor: 1.1,
    recommendedMaxHeightMm: 2200,
  },
  {
    series: 'Gold',
    category: 'Alto Padrão',
    nominalDepthMm: 32,
    acousticAttenuationDb: 32,
    maxLeafWeightKg: 120,
    momentOfInertiaIxCm4: 12.5,
    aluminumBasePricePerKg: 39.0,
    laborFactor: 1.25,
    recommendedMaxHeightMm: 2800,
  },
  {
    series: 'Chroma',
    category: 'Premium Acústica',
    nominalDepthMm: 32,
    acousticAttenuationDb: 35,
    maxLeafWeightKg: 90,
    momentOfInertiaIxCm4: 14.8,
    aluminumBasePricePerKg: 38.0,
    laborFactor: 1.2,
    recommendedMaxHeightMm: 2600,
  },
];

export interface LineComparisonItem {
  spec: AluminumLineSpec;
  estimatedWeightKg: number;
  suggestedSalePrice: number;
  materialCost: number;
  laborCost: number;
  isSpanRecommended: boolean;
  notes: string;
}

export const compareLinesForSpan = (
  widthMm: number,
  heightMm: number,
  windPressureKgfM2: number = 35,
  openingType: 'janela' | 'porta' = 'janela'
): LineComparisonItem[] => {
  const areaM2 = (widthMm * heightMm) / 1000000;
  const perimeterM = (widthMm * 2 + heightMm * 2) / 1000;

  return BENCHMARK_LINES.map((spec) => {
    // Estimativa de peso por metro linear do perímetro somado a travessas internas
    const weightPerM = spec.nominalDepthMm === 32 ? (spec.series === 'Gold' ? 2.3 : 1.9) : (spec.series === 'Suprema' ? 1.4 : 1.1);
    const estimatedWeight = Math.round(perimeterM * weightPerM * 1.35 * 10) / 10;

    const alumCost = estimatedWeight * spec.aluminumBasePricePerKg;
    const glassCost = areaM2 * (spec.acousticAttenuationDb > 30 ? 260 : 145);
    const accCost = spec.maxLeafWeightKg > 80 ? 280 : 120;
    const directMaterial = alumCost + glassCost + accCost;

    const baseLabor = areaM2 * 80 * spec.laborFactor;
    const salePrice = Math.round((directMaterial + baseLabor) * 1.55);

    const isSpanOk = heightMm <= spec.recommendedMaxHeightMm && (openingType !== 'porta' || spec.maxLeafWeightKg >= 50);

    const notes = isSpanOk
      ? `Atende perfeitamente ao vão de ${widthMm}x${heightMm}mm com isolamento de ${spec.acousticAttenuationDb} dB.`
      : `Vão de ${heightMm}mm excede altura recomendada (${spec.recommendedMaxHeightMm}mm) para a série ${spec.series}.`;

    return {
      spec,
      estimatedWeightKg: estimatedWeight,
      suggestedSalePrice: salePrice,
      materialCost: Math.round(directMaterial),
      laborCost: Math.round(baseLabor),
      isSpanRecommended: isSpanOk,
      notes,
    };
  });
};
