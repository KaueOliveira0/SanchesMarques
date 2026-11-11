/**
 * Módulo de Cálculo de Inércia Estrutural de Montantes e Mãos de Amigo
 * Conforme ABNT NBR 10821-2 (Esquadrias para Edificações) e NBR 6123 (Ventos)
 * Sanches & Marques ERP/PCP - Padrão Industrial
 */

export interface ProfileInertiaSpec {
  code: string;
  name: string;
  series: string;
  ixCm4: number; // Momento de inércia no eixo principal de flexão (cm4)
  weightKgm: number;
  maxRecommendedSpanMm: number;
}

export const KNOWN_PROFILES_INERTIA: ProfileInertiaSpec[] = [
  { code: 'SU-053', name: 'Montante Lateral Folha (Suprema)', series: 'Suprema', ixCm4: 2.85, weightKgm: 0.582, maxRecommendedSpanMm: 1600 },
  { code: 'SU-054', name: 'Montante Central Mão de Amigo (Suprema)', series: 'Suprema', ixCm4: 3.20, weightKgm: 0.612, maxRecommendedSpanMm: 1800 },
  { code: 'CHR-020', name: 'Montante Folha Acústico (Chroma 32mm)', series: 'Chroma', ixCm4: 6.45, weightKgm: 0.720, maxRecommendedSpanMm: 2200 },
  { code: 'CHR-040', name: 'Mão de Amigo Reforçada Acústica (Chroma 32mm)', series: 'Chroma', ixCm4: 14.80, weightKgm: 1.150, maxRecommendedSpanMm: 2800 },
  { code: 'LG-053', name: 'Montante Lateral (Linha Gold 32mm)', series: 'Gold', ixCm4: 7.90, weightKgm: 0.880, maxRecommendedSpanMm: 2400 },
  { code: 'LG-040', name: 'Mão de Amigo Reforçada (Linha Gold 32mm)', series: 'Gold', ixCm4: 18.50, weightKgm: 1.340, maxRecommendedSpanMm: 3000 },
  { code: 'MN-053', name: 'Montante Reforçado Miranda 32mm', series: 'Miranda', ixCm4: 8.10, weightKgm: 0.890, maxRecommendedSpanMm: 2500 },
  { code: 'IV-053', name: 'Montante IV Gold Acústico', series: 'IV Gold', ixCm4: 8.40, weightKgm: 0.910, maxRecommendedSpanMm: 2500 },
  { code: 'BEL-053', name: 'Montante Belmetal 30mm', series: 'Belmetal 30', ixCm4: 4.60, weightKgm: 0.610, maxRecommendedSpanMm: 2000 },
  { code: 'HYD-120', name: 'Montante Hydro Line 32mm', series: 'Hydro Line', ixCm4: 7.20, weightKgm: 0.695, maxRecommendedSpanMm: 2300 },
];

export interface StructuralInertiaCalculation {
  widthMm: number;
  heightMm: number;
  windPressurePa: number; // Pressão de ensaio de segurança (NBR 10821)
  tributaryWidthMm: number; // Largura de influência de vento sobre o montante (mm)
  spanLengthMm: number; // Altura livre do montante (mm)
  admissibleDeflectionMm: number; // Limite L/175 (máx 20mm)
  requiredIxCm4: number; // Inércia mínima necessária (cm4)
  selectedProfile: ProfileInertiaSpec;
  actualIxCm4: number;
  ratioPercent: number; // (actual / required) * 100
  isApproved: boolean;
  estimatedDeflectionMm: number;
  recommendedReinforcement?: string;
  notes: string[];
}

/**
 * Calcula a inércia necessária (cm4) para um montante submetido a vento
 * Equação clássica de vigas biapoiadas: f = (5 * q * L^4) / (384 * E * I)
 * Logo: I_nec = (5 * q * L^4) / (384 * E * f_adm)
 */
export function calculateRequiredInertia(
  widthMm: number,
  heightMm: number,
  windPressurePa: number,
  profileCode?: string
): StructuralInertiaCalculation {
  // Encontra especificação do perfil ou adota montante padrão
  const profile = KNOWN_PROFILES_INERTIA.find(
    (p) => p.code.toUpperCase() === (profileCode || 'SU-053').toUpperCase()
  ) || {
    code: profileCode || 'GEN-01',
    name: 'Montante Genérico de Alumínio',
    series: 'Universal',
    ixCm4: 4.0,
    weightKgm: 0.65,
    maxRecommendedSpanMm: 2000,
  };

  // Largura de influência (para janela/porta de correr de 2 a 4 folhas, a influência central é metade da largura das folhas adjacentes)
  const tributaryWidthMm = Math.max(200, widthMm / 2);
  const spanLengthMm = heightMm;

  // Limite normativo de flecha da ABNT NBR 10821: f_adm = L / 175, limitado a no máximo 20 mm
  const admissibleDeflectionMm = Math.min(20, spanLengthMm / 175);

  // Conversão de unidades para o cálculo em kgf e cm:
  // 1 Pa = 1 N/m² = 0.10197 kgf/m²
  // Carga distribuída q (kgf/cm) = (pressão em kgf/m² * largura_influencia em m) / 100
  const pressureKgfM2 = windPressurePa * 0.1019716;
  const tributaryWidthM = tributaryWidthMm / 1000;
  const qKgfPerCm = (pressureKgfM2 * tributaryWidthM) / 100;

  // L em cm
  const spanCm = spanLengthMm / 10;

  // Módulo de elasticidade do alumínio: E = 70.000 MPa = 713.800 kgf/cm²
  const EAlumKgfCm2 = 713800;

  // f_adm em cm
  const fAdmCm = admissibleDeflectionMm / 10;

  // I_nec = (5 * q * L^4) / (384 * E * f_adm) em cm4
  const requiredIxCm4Raw = (5 * qKgfPerCm * Math.pow(spanCm, 4)) / (384 * EAlumKgfCm2 * fAdmCm);
  const requiredIxCm4 = Number(Math.max(0.1, requiredIxCm4Raw).toFixed(2));

  const actualIxCm4 = profile.ixCm4;
  const ratioPercent = Number(((actualIxCm4 / requiredIxCm4) * 100).toFixed(1));
  const isApproved = actualIxCm4 >= requiredIxCm4;

  // Flecha real estimada (mm) com o perfil escolhido
  const estimatedDeflectionCm = (5 * qKgfPerCm * Math.pow(spanCm, 4)) / (384 * EAlumKgfCm2 * actualIxCm4);
  const estimatedDeflectionMm = Number((estimatedDeflectionCm * 10).toFixed(2));

  const notes: string[] = [];
  let recommendedReinforcement: string | undefined;

  if (isApproved) {
    notes.push(`Montante atende com folga de segurança (${ratioPercent}% da inércia necessária).`);
    notes.push(`Flecha estimada de ${estimatedDeflectionMm} mm está abaixo do limite admissível de ${admissibleDeflectionMm.toFixed(1)} mm.`);
  } else {
    const deficitCm4 = (requiredIxCm4 - actualIxCm4).toFixed(2);
    notes.push(`ATENÇÃO: Inércia insuficiente! Déficit estrutural de ${deficitCm4} cm⁴.`);
    notes.push(`Risco de flecha excessiva (${estimatedDeflectionMm} mm > ${admissibleDeflectionMm.toFixed(1)} mm), travamento das roldanas ou quebra de vidro.`);
    
    // Sugere reforços
    if (requiredIxCm4 <= 15) {
      recommendedReinforcement = 'Substituir por Mão de Amigo Reforçada Chroma (CHR-040: 14.8 cm⁴) ou Gold (LG-040: 18.5 cm⁴).';
    } else {
      recommendedReinforcement = 'Inserir alma interna de tubo de aço galvanizado SAE 1020 (mínimo 30x20x1.5mm) ou fracionar em mais panos.';
    }
  }

  return {
    widthMm,
    heightMm,
    windPressurePa,
    tributaryWidthMm,
    spanLengthMm,
    admissibleDeflectionMm,
    requiredIxCm4,
    selectedProfile: profile,
    actualIxCm4,
    ratioPercent,
    isApproved,
    estimatedDeflectionMm,
    recommendedReinforcement,
    notes,
  };
}
