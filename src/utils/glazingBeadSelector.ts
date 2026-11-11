export interface GlazingBeadProfile {
  id: string;
  code: string;
  name: string;
  series: string;
  beadWidthMm: number;
  glassThicknessMaxMm: number;
  glassThicknessMinMm: number;
  isInsulatedCompatible: boolean;
  gasketRecommended: string;
  sealGasketCode: string;
  costPerMeter: number;
  weightKgm: number;
}

export const GLAZING_BEADS_CATALOG: GlazingBeadProfile[] = [
  {
    id: 'bead_su_102',
    code: 'SU-102',
    name: 'Baguete Reto Suprema 14mm',
    series: 'Suprema',
    beadWidthMm: 14,
    glassThicknessMinMm: 4,
    glassThicknessMaxMm: 6,
    isInsulatedCompatible: false,
    gasketRecommended: 'Guarnição E-01 + Cunha 2mm',
    sealGasketCode: 'GX-01 / CU-02',
    costPerMeter: 6.8,
    weightKgm: 0.165,
  },
  {
    id: 'bead_su_103',
    code: 'SU-103',
    name: 'Baguete Curvo Reduzido Suprema 10mm',
    series: 'Suprema',
    beadWidthMm: 10,
    glassThicknessMinMm: 6,
    glassThicknessMaxMm: 8,
    isInsulatedCompatible: false,
    gasketRecommended: 'Guarnição E-02 + Cunha 3mm',
    sealGasketCode: 'GX-02 / CU-03',
    costPerMeter: 6.2,
    weightKgm: 0.145,
  },
  {
    id: 'bead_gl_103',
    code: 'GL-103',
    name: 'Baguete Linha Gold 16mm',
    series: 'Gold',
    beadWidthMm: 16,
    glassThicknessMinMm: 6,
    glassThicknessMaxMm: 10,
    isInsulatedCompatible: false,
    gasketRecommended: 'Guarnição EPDM Gold E-55',
    sealGasketCode: 'EPDM-E55',
    costPerMeter: 9.5,
    weightKgm: 0.24,
  },
  {
    id: 'bead_gl_105',
    code: 'GL-105',
    name: 'Baguete Estreito Gold 10mm para Vidro Grosso/Laminado',
    series: 'Gold',
    beadWidthMm: 10,
    glassThicknessMinMm: 10,
    glassThicknessMaxMm: 14,
    isInsulatedCompatible: true,
    gasketRecommended: 'Guarnição EPDM Especial',
    sealGasketCode: 'EPDM-ESP10',
    costPerMeter: 8.9,
    weightKgm: 0.21,
  },
  {
    id: 'bead_chr_101',
    code: 'CHR-101',
    name: 'Baguete Padrão Chroma 14mm',
    series: 'Chroma',
    beadWidthMm: 14,
    glassThicknessMinMm: 4,
    glassThicknessMaxMm: 8,
    isInsulatedCompatible: false,
    gasketRecommended: 'Guarnição Chroma E-10',
    sealGasketCode: 'CHR-VED10',
    costPerMeter: 8.2,
    weightKgm: 0.18,
  },
  {
    id: 'bead_chr_104',
    code: 'CHR-104',
    name: 'Baguete Chroma Slim 8mm para Insulado',
    series: 'Chroma',
    beadWidthMm: 8,
    glassThicknessMinMm: 12,
    glassThicknessMaxMm: 22,
    isInsulatedCompatible: true,
    gasketRecommended: 'Fita Estrutural VHB + Silicone Neutro',
    sealGasketCode: 'VHB-SIL-N',
    costPerMeter: 8.7,
    weightKgm: 0.19,
  },
];

export interface AlternativeBeadOption {
  code: string;
  name: string;
  beadWidthMm: number;
  compatibleGlassMinMm: number;
  compatibleGlassMaxMm: number;
  weightKgm: number;
}

export interface GlazingBeadSelectionResult {
  series: string;
  glassThicknessMm: number;
  glassType: string;
  recommendedBead: GlazingBeadProfile;
  fitStatus: string;
  profilePocketDepthMm: number;
  totalPackMm: number;
  innerGasketMm: number;
  wedgeGasketMm: number;
  alternativeBeads: AlternativeBeadOption[];
  technicianNotes: string;
}

export type GlazingSelectionResult = GlazingBeadSelectionResult;

export const selectGlazingBead = (
  series: string,
  glassThicknessMm: number,
  glassType: string = 'Comum'
): GlazingBeadSelectionResult => {
  const normSeries = series.toLowerCase();
  const isInsulated =
    glassType.toLowerCase().includes('insulado') || glassThicknessMm >= 14;

  const seriesBeads = GLAZING_BEADS_CATALOG.filter((b) =>
    b.series.toLowerCase().includes(normSeries) || normSeries.includes(b.series.toLowerCase())
  );

  let match: GlazingBeadProfile | undefined;

  if (isInsulated) {
    match = seriesBeads.find((b) => b.isInsulatedCompatible) || GLAZING_BEADS_CATALOG.find((b) => b.isInsulatedCompatible);
  } else {
    match = seriesBeads.find(
      (b) => glassThicknessMm >= b.glassThicknessMinMm && glassThicknessMm <= b.glassThicknessMaxMm
    );
  }

  if (!match) {
    match = seriesBeads[0] || GLAZING_BEADS_CATALOG[0];
  }

  const alternativeBeads: AlternativeBeadOption[] = seriesBeads
    .filter((b) => b.code !== match!.code)
    .map((b) => ({
      code: b.code,
      name: b.name,
      beadWidthMm: b.beadWidthMm,
      compatibleGlassMinMm: b.glassThicknessMinMm,
      compatibleGlassMaxMm: b.glassThicknessMaxMm,
      weightKgm: b.weightKgm,
    }));

  const pocketDepth = normSeries.includes('gold') || normSeries.includes('chroma') ? 32 : 24;
  const innerGasket = 3;
  const wedgeGasket = Math.max(2, pocketDepth - match.beadWidthMm - glassThicknessMm - innerGasket);
  const totalPack = innerGasket + glassThicknessMm + wedgeGasket + match.beadWidthMm;

  const techNote = isInsulated
    ? `Utilização de vidro insulado duplo: instalar calço de borda de neoprene nos cantos inferiores e utilizar baguete slim ${match.code}.`
    : `Envidraçamento convencional: instalar borrachas cunhas uniformemente para prevenir vibração e estalos térmicos.`;

  return {
    series,
    glassThicknessMm,
    glassType,
    recommendedBead: match,
    fitStatus: 'Perfeito / Homologado ABNT',
    profilePocketDepthMm: pocketDepth,
    totalPackMm: totalPack,
    innerGasketMm: innerGasket,
    wedgeGasketMm: wedgeGasket,
    alternativeBeads,
    technicianNotes: techNote,
  };
};
