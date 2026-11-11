/**
 * Guia de Matrizes, Estampos Pneumáticos e Usinagens
 * Mapeamento das operações em prensas e estampos das linhas
 * Suprema (Estampo Suprema Star), Gold e Chroma (Perfil Alumínio).
 */

export interface PunchOperation {
  stationNumber: number;
  operationName: string;
  targetProfiles: string[];
  purpose: string;
  punchType: 'rasgo_fecho' | 'desponte' | 'dreno' | 'furacao_parafuso' | 'alivio_roldana' | 'corte_canto';
  strokePressureBar: string;
  notes: string;
  diagramSvgSnippet?: string;
}

export interface PunchPressMachine {
  machineModel: string;
  series: string;
  manufacturer: string;
  recommendedAirPressureBar: number;
  oilLubricationIntervalHours: number;
  stations: PunchOperation[];
}

export const PUNCH_PRESS_MACHINES: PunchPressMachine[] = [
  {
    machineModel: 'Estampo Pneumático Suprema Star G2',
    series: 'Linha Suprema',
    manufacturer: 'Smart / Suprema Ferramentas',
    recommendedAirPressureBar: 7.0,
    oilLubricationIntervalHours: 40,
    stations: [
      {
        stationNumber: 1,
        operationName: 'Rasgo do Fecho Concha Automático (FEC-CON)',
        targetProfiles: ['SU-053'],
        purpose: 'Corte do alojamento frontal para encaixe embutido do fecho concha da folha.',
        punchType: 'rasgo_fecho',
        strokePressureBar: '6.5 a 7.5 bar',
        notes: 'Posicionar com batente de 1.000 mm da base do piso para altura ergonômica da maçaneta.',
      },
      {
        stationNumber: 2,
        operationName: 'Desponte do Montante Mão de Amigo Central',
        targetProfiles: ['SU-054'],
        purpose: 'Alívio superior e inferior para ultrapassagem das abas nos trilhos marco.',
        punchType: 'desponte',
        strokePressureBar: '7.0 bar',
        notes: 'Verificar alinhamento da matriz para não amassar a aba de engate da escova.',
      },
      {
        stationNumber: 3,
        operationName: 'Furação de Passagem e Fixação de Travessas',
        targetProfiles: ['SU-053', 'SU-054'],
        purpose: 'Furação dupla com broca/punção escalonado para parafusos inox 4.8 x 50mm.',
        punchType: 'furacao_parafuso',
        strokePressureBar: '6.0 a 7.0 bar',
        notes: 'Garante que a cabeça da chave philips atravesse livremente a câmara externa.',
      },
      {
        stationNumber: 4,
        operationName: 'Alívio para Roldana Blindada com Regulagem',
        targetProfiles: ['SU-068 (Travessa Inferior)'],
        purpose: 'Rasgo oblongo inferior para encaixe da caixa da roldana ROL-SUP.',
        punchType: 'alivio_roldana',
        strokePressureBar: '7.0 bar',
        notes: 'Permite acesso frontal à chave allen/fenda para regular prumo após instalação.',
      },
      {
        stationNumber: 5,
        operationName: 'Usinagem de Drenos de Água c/ Defletor',
        targetProfiles: ['SU-003 (Trilho Inferior)'],
        purpose: 'Furos oblongos de 5x25mm nos canais dos trilhos para evacuação de água pluvial.',
        punchType: 'dreno',
        strokePressureBar: '6.0 bar',
        notes: 'Distribuir a cada 600mm. Instalar válvula pingadeira de silicone para vedar vento.',
      },
    ],
  },
  {
    machineModel: 'Estampo Matriz Chroma 32mm Bicâmara',
    series: 'Sistema Chroma',
    manufacturer: 'Perfil Alumínio do Brasil S.A.',
    recommendedAirPressureBar: 7.5,
    oilLubricationIntervalHours: 30,
    stations: [
      {
        stationNumber: 1,
        operationName: 'Usinagem de Conexão Canto 45° Bicâmara',
        targetProfiles: ['CHR-001', 'CHR-002', 'CHR-003'],
        purpose: 'Furação para cantoneira de tração mecânica com chave allen oculta.',
        punchType: 'corte_canto',
        strokePressureBar: '7.5 bar',
        notes: 'Acoplamento com aperto angular 45° com vedação líquida de silicone neutro.',
      },
      {
        stationNumber: 2,
        operationName: 'Rasgo Fecho Cremona Multiponto',
        targetProfiles: ['CHR-020'],
        purpose: 'Rasgo estendido para mecanismo cremona de segurança com travamento bi-lateral.',
        punchType: 'rasgo_fecho',
        strokePressureBar: '7.0 a 8.0 bar',
        notes: 'Usinagem limpa sem rebarbas para deslizamento suave da barra de tração.',
      },
      {
        stationNumber: 3,
        operationName: 'Desponte Mão de Amigo Acústica Reforçada',
        targetProfiles: ['CHR-040'],
        purpose: 'Corte escalonado para permitir encaixe da dupla escova com fin-seal.',
        punchType: 'desponte',
        strokePressureBar: '7.5 bar',
        notes: 'Perfil com alta inércia (14.8 cm4): manter faca afiada e lubrificada.',
      },
      {
        stationNumber: 4,
        operationName: 'Dreno Escalonado Cascata Anti-Retorno',
        targetProfiles: ['CHR-003'],
        purpose: 'Câmara de descompressão para escoamento rápido sob pressão de vento elevada.',
        punchType: 'dreno',
        strokePressureBar: '6.5 bar',
        notes: 'Essencial para aprovação NBR 10821 sob 1200 Pa de pressão estática.',
      },
    ],
  },
  {
    machineModel: 'Estampo Pneumático Linha Gold 32mm',
    series: 'Linha Gold',
    manufacturer: 'MECAL / Gold Press',
    recommendedAirPressureBar: 8.0,
    oilLubricationIntervalHours: 35,
    stations: [
      {
        stationNumber: 1,
        operationName: 'Alojamento de Fecho Concha e Fechadura Rolete',
        targetProfiles: ['LG-053'],
        purpose: 'Rasgo de grande porte para concha com maçaneta de puxador embutido.',
        punchType: 'rasgo_fecho',
        strokePressureBar: '7.5 a 8.0 bar',
        notes: 'Exige curso completo de 40mm do pistão.',
      },
      {
        stationNumber: 2,
        operationName: 'Desponte Montante Central Gold',
        targetProfiles: ['LG-040'],
        purpose: 'Corte de desponte em perfil espesso (18.5 cm4 de inércia).',
        punchType: 'desponte',
        strokePressureBar: '8.0 bar',
        notes: 'Atenção ao posicionamento do batente regulador milimétrico.',
      },
      {
        stationNumber: 3,
        operationName: 'Furação de Cantoneira e Parafuso de Inox',
        targetProfiles: ['LG-053', 'LG-040', 'LG-068'],
        purpose: 'Montagem mecânica dos cantos com cantoneiras de alumínio fundido injetado.',
        punchType: 'furacao_parafuso',
        strokePressureBar: '7.0 bar',
        notes: 'Garante o esquadro perfeito de 90° na união travessa-montante.',
      },
    ],
  },
];

/**
 * Busca operações de estampo compatíveis com o perfil selecionado
 */
export function getPunchOperationsForProfile(profileCode: string): {
  machine: PunchPressMachine;
  operations: PunchOperation[];
} | null {
  const code = profileCode.trim().toUpperCase();

  for (const m of PUNCH_PRESS_MACHINES) {
    const matchingOps = m.stations.filter((op) =>
      op.targetProfiles.some((p) => p.toUpperCase().includes(code))
    );
    if (matchingOps.length > 0) {
      return {
        machine: m,
        operations: matchingOps,
      };
    }
  }

  // Se não encontrou exato, retorna operações padrão da linha
  const fallbackMachine = code.startsWith('CHR')
    ? PUNCH_PRESS_MACHINES[1]
    : code.startsWith('LG')
    ? PUNCH_PRESS_MACHINES[2]
    : PUNCH_PRESS_MACHINES[0];

  return {
    machine: fallbackMachine,
    operations: fallbackMachine.stations.slice(0, 3),
  };
}
