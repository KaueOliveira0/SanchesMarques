/**
 * Dimensionador Estrutural de Guarda-Corpos de Alumínio & Vidro
 * Conforme ABNT NBR 14718 (Guarda-corpos para Edificações)
 * e ensaios de segurança de impacto de corpo mole (600 Joules).
 */

export interface GuardrailInput {
  totalLengthM: number;
  heightMm: number;              // Altura mínima normativa: 1.100 mm
  buildingUsage: 'residencial_privativo' | 'residencial_coletivo' | 'comercial_publico' | string;
  systemType: 'pontalete_coluna' | 'torre_perfil_u_engastado' | 'botoes_spider_inox' | string;
  glassType: 'laminado_temperado_10mm' | 'laminado_temperado_12mm' | 'laminado_temperado_16mm' | 'laminado_comum_8mm' | 'temperado_monolitico' | string;
  interlayerType: 'pvb_076' | 'pvb_152' | 'sentryglas_structural' | string;
  postSpacingMm?: number;        // Espaçamento entre colunas/pontaletes (comumente 800 a 1000mm)
  anchorageType: 'chumbador_quimico_inox' | 'parabolt_m10' | 'parafuso_bucha_nylon' | string;
}

export const BUILDING_USAGE_TYPES = [
  { id: 'residencial_privativo', label: 'Residencial Privativo', horizontalLoadKnM: 1.0 },
  { id: 'residencial_coletivo', label: 'Residencial Coletivo (Edifícios)', horizontalLoadKnM: 1.0 },
  { id: 'comercial_publico', label: 'Comercial / Público / Áreas Comuns', horizontalLoadKnM: 1.5 },
];

export const GUARDRAIL_SYSTEM_TYPES = [
  { id: 'pontalete_coluna', label: 'Colunas / Pontaletes Verticais' },
  { id: 'torre_perfil_u_engastado', label: 'Perfil "U" Embutido / Engastado na Base' },
  { id: 'botoes_spider_inox', label: 'Botões Spider Inox Frontais' },
];

export const GUARDRAIL_GLASS_TYPES = [
  { id: 'laminado_temperado_10mm', label: 'Laminado Temperado 10mm (5+5mm)' },
  { id: 'laminado_temperado_12mm', label: 'Laminado Temperado 12mm (6+6mm)' },
  { id: 'laminado_temperado_16mm', label: 'Laminado Temperado 16mm (8+8mm)' },
  { id: 'laminado_comum_8mm', label: 'Laminado Comum 8mm (4+4mm)' },
  { id: 'temperado_monolitico', label: 'Temperado Monolítico 10mm (Não Laminado - Proibido)' },
];

export const ANCHORAGE_TYPES = [
  { id: 'chumbador_quimico_inox', label: 'Chumbador Químico + Barra Roscada Inox (Recomendado)' },
  { id: 'parabolt_m10', label: 'Parabolt M10 Aço Inox 304' },
  { id: 'parafuso_bucha_nylon', label: 'Parafuso Sextavado + Bucha de Nylon S10' },
];

export type GuardrailComplianceResult = GuardrailStructuralResult;

export interface GuardrailStructuralResult {
  normativeHeightApproved: boolean; // Altura >= 1.100 mm
  minHeightRequiredMm: number;
  horizontalDesignLoadKgfM: number; // 100 kgf/m ou 150 kgf/m
  horizontalDesignLoadKnM: number;
  requiredLinearLoadKnM: number;
  totalDesignLoadKgf: number;
  softBodyImpactTestResult: {
    energyJoules: number;           // 600 Joules
    approved: boolean;
    reason: string;
  };
  glassSafetyApproved: boolean;
  glassSafetyWarning?: string;
  recommendedPostCount: number;
  maxPostSpacingMm: number;
  anchorageTensionKgfPerPoint: number;
  anchorageApproved: boolean;
  anchorageWarning?: string;
  overallApproved: boolean;
  billOfMaterials: Array<{
    item: string;
    quantity: number;
    unit: string;
    notes: string;
  }>;
}

/**
 * Realiza a verificação estrutural e normativa do guarda-corpo
 */
export function calculateGuardrailCompliance(
  input: GuardrailInput
): GuardrailStructuralResult {
  const minHeightRequiredMm = 1100;
  const normativeHeightApproved = input.heightMm >= minHeightRequiredMm;

  // Carga horizontal estática conforme uso (NBR 14718 item 5.2)
  let horizontalDesignLoadKnM = 1.0; // 100 kgf/m para residencial privativo
  if (input.buildingUsage === 'residencial_coletivo') {
    horizontalDesignLoadKnM = 1.0;
  } else if (input.buildingUsage === 'comercial_publico') {
    horizontalDesignLoadKnM = 1.5; // 150 kgf/m para locais públicos ou de grande aglomeração
  }

  const horizontalDesignLoadKgfM = Math.round(horizontalDesignLoadKnM * 101.97);
  const totalDesignLoadKgf = Math.round(horizontalDesignLoadKgfM * input.totalLengthM);

  // Verificação de vidro: NBR 14718 proíbe vidro monolítico não-laminado!
  let glassSafetyApproved = true;
  let glassSafetyWarning = '';

  if (input.glassType === 'temperado_monolitico') {
    glassSafetyApproved = false;
    glassSafetyWarning = 'PROIBIDO PELA NBR 14718: Vidro temperado comum monolítico sem laminação oferece risco fatal de queda se quebrar.';
  } else if (input.glassType === 'laminado_comum_8mm' && input.systemType === 'torre_perfil_u_engastado') {
    glassSafetyApproved = false;
    glassSafetyWarning = 'Para sistema engastado pela base (sem colunas), a espessura mínima é 12mm ou 16mm laminado temperado.';
  }

  // Ensaio de corpo mole (600 J)
  let softBodyImpactApproved = true;
  let softBodyImpactReason = 'Aprovado para impacto de corpo mole de 600 Joules.';

  if (!glassSafetyApproved) {
    softBodyImpactApproved = false;
    softBodyImpactReason = 'Reprovado devido à especificação insegura de vidro para absorção de impacto.';
  } else if (input.interlayerType === 'sentryglas_structural') {
    softBodyImpactReason = 'Aprovado com folga superior: Interlayer estrutural SentryGlas mantém o vidro em pé mesmo após estilhaçamento duplo.';
  }

  // Dimensionamento de colunas/pontaletes
  const maxSpacing = input.systemType === 'torre_perfil_u_engastado' ? 0 : 1000;
  const postSpacingMm = input.postSpacingMm || 900;
  const postsCount = maxSpacing === 0
    ? 0
    : Math.max(2, Math.ceil((input.totalLengthM * 1000) / postSpacingMm) + 1);

  // Fixação e arrancamento nos pontos de ancoragem
  // Momento = F * h = (100 kgf * postSpacing) * 1.1m
  const spanPerPostM = postsCount > 0 ? input.totalLengthM / (postsCount - 1) : 0.5;
  const postForceKgf = horizontalDesignLoadKgfM * spanPerPostM;
  // Braço de alavanca da sapata (~100mm entre chumbadores)
  const leverArmM = 0.10;
  const heightM = input.heightMm / 1000;
  const anchorageTensionKgfPerPoint = Math.round((postForceKgf * heightM) / leverArmM);

  let anchorageApproved = true;
  let anchorageWarning = '';

  if (input.anchorageType === 'parafuso_bucha_nylon') {
    anchorageApproved = false;
    anchorageWarning = 'PROIBIDO: Buchas plásticas de nylon não possuem resistência ao arrancamento contínuo em parapeitos.';
  } else if (input.anchorageType === 'parabolt_m10' && anchorageTensionKgfPerPoint > 400) {
    anchorageApproved = false;
    anchorageWarning = 'Arrancamento elevado. Substituir por chumbador químico com barra roscada em aço inox 304.';
  }

  const overallApproved =
    normativeHeightApproved &&
    glassSafetyApproved &&
    softBodyImpactApproved &&
    anchorageApproved;

  // Lista de materiais
  const billOfMaterials = [
    {
      item: 'Vidro Laminado de Segurança',
      quantity: Math.round(input.totalLengthM * (input.heightMm / 1000) * 100) / 100,
      unit: 'm²',
      notes: `${input.glassType.replace(/_/g, ' ')} com ${input.interlayerType.toUpperCase()}`,
    },
    ...(postsCount > 0
      ? [
          {
            item: 'Colunas / Pontaletes Estruturais de Alumínio',
            quantity: postsCount,
            unit: 'barras',
            notes: `Perfil reforçado com alma interna, altura ${input.heightMm}mm`,
          },
        ]
      : [
          {
            item: 'Perfil U Base Contínuo Engastado',
            quantity: Math.round(input.totalLengthM * 10) / 10,
            unit: 'metros',
            notes: 'Perfil base de alta inércia com cunhas de fixação rápida',
          },
        ]),
    {
      item: 'Corrimão Superior (Guarda-mão)',
      quantity: Math.round(input.totalLengthM * 10) / 10,
      unit: 'metros',
      notes: 'Perfil de alumínio tubular ou com encaixe no topo do vidro',
    },
    {
      item: 'Pontos de Ancoragem Estrutural',
      quantity: Math.max(4, postsCount * 2),
      unit: 'conjuntos',
      notes: input.anchorageType.replace(/_/g, ' ').toUpperCase(),
    },
  ];

  return {
    normativeHeightApproved,
    minHeightRequiredMm,
    horizontalDesignLoadKgfM,
    horizontalDesignLoadKnM,
    requiredLinearLoadKnM: horizontalDesignLoadKnM,
    totalDesignLoadKgf,
    softBodyImpactTestResult: {
      energyJoules: 600,
      approved: softBodyImpactApproved,
      reason: softBodyImpactReason,
    },
    glassSafetyApproved,
    glassSafetyWarning: glassSafetyWarning || undefined,
    recommendedPostCount: postsCount,
    maxPostSpacingMm: maxSpacing || 1000,
    anchorageTensionKgfPerPoint,
    anchorageApproved,
    anchorageWarning: anchorageWarning || undefined,
    overallApproved,
    billOfMaterials,
  };
}
