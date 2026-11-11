export interface HardwareTemplate {
  id: string;
  name: string;
  manufacturer: 'Udinese' | 'Fermax' | 'Papaiz' | 'Roto' | 'Alumbra' | 'Genérico';
  category: 'fecho_concha' | 'fechadura_bico_papagaio' | 'puxador_cava' | 'roldana_regulavel' | 'cremona';
  compatibleSeries: string[];
  compatibleProfiles: string[];
  standardHeightFromFloorMm: number; // Ex: 1050mm
  faceSlotDimensions: {
    lengthMm: number;
    widthMm: number;
    cornerType: 'rounded' | 'square';
    cornerRadiusMm?: number;
  };
  fixingHoles: Array<{
    xOffsetMm: number;
    yOffsetMm: number;
    drillBitMm: number;
    description: string;
  }>;
  cylinderHole?: {
    type: 'europrofile' | 'keyhole' | 'none';
    diameterMm: number;
    yCenterMm: number;
  };
  recommendedTooling: {
    pressMachineStation?: string;
    routerMillingBitMm: number;
    rotationalSpeedRpm: string;
    lubricant: string;
  };
  stepByStepInstructions: string[];
  technicalNotes: string;
}

export const HARDWARE_DRILL_TEMPLATES: HardwareTemplate[] = [
  {
    id: 'fec_con_100_udinese',
    name: 'Fecho Concha Automático FEC-CON 100/101 (Udinese)',
    manufacturer: 'Udinese',
    category: 'fecho_concha',
    compatibleSeries: ['Linha Suprema', 'Linha 25'],
    compatibleProfiles: ['SU-053', 'SU-054', 'L-25-053'],
    standardHeightFromFloorMm: 1000,
    faceSlotDimensions: {
      lengthMm: 190,
      widthMm: 25,
      cornerType: 'rounded',
      cornerRadiusMm: 12.5,
    },
    fixingHoles: [
      { xOffsetMm: 0, yOffsetMm: -85, drillBitMm: 3.5, description: 'Furo superior escareado para parafuso M4' },
      { xOffsetMm: 0, yOffsetMm: 85, drillBitMm: 3.5, description: 'Furo inferior escareado para parafuso M4' },
    ],
    recommendedTooling: {
      pressMachineStation: 'Estampo Suprema Star - Estação 1 (Rasgo de Fecho)',
      routerMillingBitMm: 5.0,
      rotationalSpeedRpm: '18.000 a 22.000 RPM (Copiadora)',
      lubricant: 'Óleo vegetal em spray / fluído de corte para alumínio',
    },
    stepByStepInstructions: [
      'Marcar o centro da concha a exatamente 1.000mm da extremidade inferior do perfil montante SU-053.',
      'Encaixar o perfil na prensa de estampar pneumática apoiando firmemente no batente regulado.',
      'Acionar a estação 1 da prensa com pressão entre 6.5 e 7.5 bar.',
      'Em caso de fresadora copiadora, utilizar gabarito mestre nº 190x25 com apalpador de 5mm.',
      'Rebarbar as bordas internas do rasgo com lima fina para não riscar a pintura no encaixe da concha.',
    ],
    technicalNotes: 'Não forçar o fecho com martelo de ferro; utilizar martelo de borracha ou nylon com calço de madeira.',
  },
  {
    id: 'fechadura_323_papaiz_udinese',
    name: 'Fechadura Bico de Papagaio c/ Cilindro Europerfil (Udinese / Papaiz 323)',
    manufacturer: 'Papaiz',
    category: 'fechadura_bico_papagaio',
    compatibleSeries: ['Linha Gold', 'Linha Suprema Portas'],
    compatibleProfiles: ['LG-053', 'LG-054', 'SU-053'],
    standardHeightFromFloorMm: 1050,
    faceSlotDimensions: {
      lengthMm: 160,
      widthMm: 20,
      cornerType: 'square',
    },
    fixingHoles: [
      { xOffsetMm: 0, yOffsetMm: -70, drillBitMm: 4.2, description: 'Furo superior da testa da fechadura' },
      { xOffsetMm: 0, yOffsetMm: 70, drillBitMm: 4.2, description: 'Furo inferior da testa da fechadura' },
      { xOffsetMm: 0, yOffsetMm: 0, drillBitMm: 17.0, description: 'Furo passante do cilindro europeu' },
    ],
    cylinderHole: {
      type: 'europrofile',
      diameterMm: 17.0,
      yCenterMm: 30,
    },
    recommendedTooling: {
      pressMachineStation: 'Estampo Pneumático Linha Gold - Estação Fechadura',
      routerMillingBitMm: 6.0,
      rotationalSpeedRpm: '16.000 a 20.000 RPM',
      lubricant: 'Fluído solúvel de usinagem',
    },
    stepByStepInstructions: [
      'Posicionar o centro da maçaneta a 1.050mm do piso acabado.',
      'Fresar o rebaixo da testa de 160x20mm com profundidade de 2.5mm na aba frontal.',
      'Efetuar o corte passante da caixa de 110x16mm para alojamento interno do mecanismo.',
      'Furar os lados externo e interno do montante para passagem do cilindro chave.',
      'Inserir o cilindro, rosquear o parafuso M5 de retenção lateral e conferir o giro da chave antes de fechar a folha.',
    ],
    technicalNotes: 'Certifique-se de que o bico de papagaio engate suavemente na contra-testa fixada no marco LG-001 sem atrito.',
  },
  {
    id: 'fecho_concha_fermax_fce01',
    name: 'Fecho Concha de Toque Único FCE-01 (Fermax)',
    manufacturer: 'Fermax',
    category: 'fecho_concha',
    compatibleSeries: ['Linha Suprema', 'Linha 25'],
    compatibleProfiles: ['SU-053', 'SU-054'],
    standardHeightFromFloorMm: 1000,
    faceSlotDimensions: {
      lengthMm: 154,
      widthMm: 22,
      cornerType: 'rounded',
      cornerRadiusMm: 11,
    },
    fixingHoles: [
      { xOffsetMm: 0, yOffsetMm: -65, drillBitMm: 3.8, description: 'Furação de garra de ancoragem traseira' },
      { xOffsetMm: 0, yOffsetMm: 65, drillBitMm: 3.8, description: 'Furação de garra de ancoragem traseira' },
    ],
    recommendedTooling: {
      pressMachineStation: 'Estampo Suprema ou Fresadora Copiadora',
      routerMillingBitMm: 5.0,
      rotationalSpeedRpm: '20.000 RPM',
      lubricant: 'Fluído especial para corte de perfis extrudados',
    },
    stepByStepInstructions: [
      'Conferir cota de centro a 1.000mm da base.',
      'Efetuar usinagem de 154 x 22mm com extremidades curvas de raio 11mm.',
      'Encaixar a concha Fermax e apertar os parafusos traseiros de aperto expansivo.',
    ],
    technicalNotes: 'O fecho Fermax possui mola de retorno suave; evitar aperto excessivo dos parafusos de fixação traseiros.',
  },
  {
    id: 'puxador_cava_embutido_gold',
    name: 'Puxador Cava Embutido 400mm Linha Gold / Minimalista',
    manufacturer: 'Udinese',
    category: 'puxador_cava',
    compatibleSeries: ['Linha Gold', 'Chroma Minimalista'],
    compatibleProfiles: ['LG-053', 'CHR-053'],
    standardHeightFromFloorMm: 1050,
    faceSlotDimensions: {
      lengthMm: 400,
      widthMm: 18,
      cornerType: 'rounded',
      cornerRadiusMm: 9,
    },
    fixingHoles: [
      { xOffsetMm: 0, yOffsetMm: -180, drillBitMm: 4.0, description: 'Fixação oculta interna superior' },
      { xOffsetMm: 0, yOffsetMm: 180, drillBitMm: 4.0, description: 'Fixação oculta interna inferior' },
    ],
    recommendedTooling: {
      pressMachineStation: 'Fresadora Copiadora Pantográfica com Guia Dupla',
      routerMillingBitMm: 6.0,
      rotationalSpeedRpm: '18.000 RPM',
      lubricant: 'Micronebulização pneumática',
    },
    stepByStepInstructions: [
      'Alinhar o centro do puxador com o centro da visão (1.050mm do piso).',
      'Travar o perfil na morsa pneumática da fresadora copiadora com protetores de nylon para não marcar a pintura.',
      'Fresar o rasgo contínuo de 400 x 18mm com passe suave de 3mm de profundidade por vez.',
      'Testar encaixe da cava e fixar por trás com os parafusos de contra-chapa.',
    ],
    technicalNotes: 'Proporciona estética contínua e limpa (arquitetura minimalista sem parafusos aparentes).',
  },
  {
    id: 'roldana_regulavel_gold_rol02',
    name: 'Roldana c/ Rolamento Blindado e Regulagem de Altura ROL-GOLD 02',
    manufacturer: 'Udinese',
    category: 'roldana_regulavel',
    compatibleSeries: ['Linha Gold'],
    compatibleProfiles: ['LG-055', 'LG-056'],
    standardHeightFromFloorMm: 0, // instalada na base da folha
    faceSlotDimensions: {
      lengthMm: 78,
      widthMm: 15,
      cornerType: 'square',
    },
    fixingHoles: [
      { xOffsetMm: 0, yOffsetMm: 0, drillBitMm: 6.5, description: 'Furo frontal de acesso para chave Allen de regulagem' },
      { xOffsetMm: 30, yOffsetMm: 0, drillBitMm: 4.2, description: 'Furo de fixação da caixa da roldana na travessa' },
    ],
    recommendedTooling: {
      pressMachineStation: 'Estampo Gold - Estação Alívio de Roldana',
      routerMillingBitMm: 6.0,
      rotationalSpeedRpm: '16.000 RPM',
      lubricant: 'Fluído solúvel',
    },
    stepByStepInstructions: [
      'Usinar o encaixe na parte inferior da travessa LG-055 a 100mm de cada extremidade.',
      'Furar o acesso frontal de Ø 6.5mm alinhado com o parafuso de regulagem da roldana.',
      'Encaixar o bloco da roldana e parafusar.',
      'Após pendurar a folha no trilho da obra, regular a altura e o prumo com chave Allen 4mm.',
    ],
    technicalNotes: 'Capacidade de carga até 180kg por folha com roldana dupla blindada de alta rotação.',
  },
];

/**
 * Filtra templates por série, fabricante ou termo de busca
 */
export function filterHardwareTemplates(
  templates: HardwareTemplate[],
  filters: {
    searchTerm?: string;
    manufacturer?: string;
    category?: string;
    series?: string;
  }
): HardwareTemplate[] {
  return templates.filter((tpl) => {
    if (filters.manufacturer && filters.manufacturer !== 'ALL' && tpl.manufacturer !== filters.manufacturer) {
      return false;
    }
    if (filters.category && filters.category !== 'ALL' && tpl.category !== filters.category) {
      return false;
    }
    if (filters.series && filters.series !== 'ALL' && !tpl.compatibleSeries.includes(filters.series)) {
      return false;
    }
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      const matchName = tpl.name.toLowerCase().includes(term);
      const matchProf = tpl.compatibleProfiles.some((p) => p.toLowerCase().includes(term));
      const matchNotes = tpl.technicalNotes.toLowerCase().includes(term);
      if (!matchName && !matchProf && !matchNotes) return false;
    }
    return true;
  });
}
