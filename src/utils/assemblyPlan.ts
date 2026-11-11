/**
 * Módulo de Plano de Montagem de Esquadrias de Alumínio
 * Normas ABNT NBR 10821 e NBR 7199
 * Sanches & Marques Esquadrias
 */

import type { TypologyItem } from '../types/index.ts';

export interface AssemblyStep {
  stepNumber: number;
  phase: 'Usinagem & Preparação' | 'Montagem do Marco' | 'Montagem das Folhas' | 'Envidraçamento' | 'Ferragens & Acessórios' | 'Controle de Qualidade (CQ)';
  title: string;
  description: string;
  criticalNotice?: string;
  toolsRequired: string[];
  componentsInvolved: string[];
}

export interface AssemblyPlanData {
  typologyName: string;
  series: string;
  widthMm: number;
  heightMm: number;
  color: string;
  orderNumber?: number;
  clientName?: string;
  roomTag?: string;
  quantity: number;
  steps: AssemblyStep[];
  fastenersList: Array<{ name: string; spec: string; quantityPerUnit: number; totalQuantity: number; purpose: string }>;
  gasketsAndSeals: Array<{ name: string; type: string; approximateQuantity: string; application: string }>;
  glassSettingRules: {
    description: string;
    bottomBlocksQty: number;
    sideBlocksQty: number;
    blockType: string;
    warning: string;
  };
  qualityChecklist: Array<{ item: string; tolerance: string; method: string }>;
}

/**
 * Gera o Plano de Montagem completo para qualquer tipologia e dimensões
 */
export function generateAssemblyPlan(
  typology: TypologyItem,
  widthMm: number,
  heightMm: number,
  color: string = 'Branco',
  quantity: number = 1,
  orderNumber?: number,
  clientName?: string,
  roomTag?: string
): AssemblyPlanData {
  const isSliding = typology.category.includes('Correr');
  const isCasement = typology.category.includes('Giro') || typology.category.includes('Abrir');
  const isMaximAr = typology.category.includes('Maxim-ar');
  const isIntegrated = typology.name.toLowerCase().includes('integrada');

  // 1. Passos sequenciais de montagem baseados no tipo de esquadria
  const steps: AssemblyStep[] = [];

  // Fase 1: Usinagem
  steps.push({
    stepNumber: 1,
    phase: 'Usinagem & Preparação',
    title: 'Conferência de Cortes e Usinagem de Drenos e Cantos',
    description: `Verificar todos os perfis cortados conforme o Plano de Corte. Executar furação nos montantes e cabeceiras utilizando o estampo pneumático específico da Linha ${typology.series}. Na soleira (trilho inferior), usinar os 2 a 4 rasgos de dreno com oblongo de 5x20mm voltados para o lado externo, mantendo distância de 60mm das extremidades.`,
    criticalNotice: 'Drenos na soleira são obrigatórios segundo a NBR 10821 para evitar infiltração de água da chuva para o interior do imóvel.',
    toolsRequired: ['Estampo pneumático da Linha', 'Furadeira de bancada / broca 5mm', 'Trena calibrada', 'Rebarbador'],
    componentsInvolved: ['Marco Cabeceira', 'Marco Soleira', 'Montantes do Marco'],
  });

  // Fase 2: Marco
  steps.push({
    stepNumber: 2,
    phase: 'Montagem do Marco',
    title: 'Montagem e Vedação dos Cantos do Marco Perimetral',
    description: `Aplicar cordão generoso de selante de silicone neutro industrial nas juntas de topo de 45° ou 90° entre os montantes laterais e as cabeceiras/soleiras antes de parafusar. Parafusar os cantos utilizando parafusos em aço inox AISI 304 com aperto cruzado. Limpar imediatamente o excesso de silicone externamente.`,
    criticalNotice: 'A vedação no topo do marco é a principal garantia contra vazamentos nos cantos da alvenaria.',
    toolsRequired: ['Parafusadeira elétrica com embreagem', 'Bits Phillips PH2 / Torx', 'Pistola de silicone', 'Pano com álcool isopropílico'],
    componentsInvolved: ['Parafusos inox 4.8x50mm', 'Silicone neutro estrutural', 'Presilhas de travamento (se Linha Gold)'],
  });

  // Fase 3: Folhas
  if (isSliding) {
    steps.push({
      stepNumber: 3,
      phase: 'Montagem das Folhas',
      title: 'Inserção de Escovas e Montagem dos Quadros das Folhas de Correr',
      description: `Inserir as fitas de escova de vedação 5x5mm (com lâmina plástica Fin-Seal) nos canais dos montantes e travessas antes de fechar os quadros. Fixar as roldanas com regulagem de altura na travessa inferior de cada folha móvel. Encaixar os montantes lateral e central/puxador nas travessas e fixar com parafusos inox 4.2x38mm.`,
      criticalNotice: 'Nunca deixe a ponta da escova solta. Pressionar a ponta do canal com alicate para travar a escova definitivamente.',
      toolsRequired: ['Martelo de borracha ou nylon', 'Alicate de bico', 'Parafusadeira', 'Chave Allen 3mm para regulagem de roldana'],
      componentsInvolved: ['Roldanas duplas blindadas com rolamento', 'Escova vedação 5x5mm', 'Montantes e Travessas de folha'],
    });
  } else if (isMaximAr) {
    steps.push({
      stepNumber: 3,
      phase: 'Montagem das Folhas',
      title: 'Montagem do Quadro da Folha Móvel e Braços Articulados',
      description: `Montar o quadro da folha móvel em corte a 45° com cantoneira interna de fixação (cunha ou parafuso Allen). Instalar o par de braços articulados de fricção em aço inox no marco e na folha móvel, respeitando o ângulo de abertura de 30° a 45°.`,
      criticalNotice: 'Apertar o parafuso de regulagem de fricção dos braços para que a folha não bata com rajadas de vento.',
      toolsRequired: ['Chave Allen 2.5mm e 4mm', 'Parafusadeira', 'Esquadro magnético 90°'],
      componentsInvolved: ['Par de braços articulados inox', 'Cantoneiras de união 45°', 'Folha móvel'],
    });
  } else {
    steps.push({
      stepNumber: 3,
      phase: 'Montagem das Folhas',
      title: 'Montagem do Quadro da Folha e Dobradiças / Pivôs',
      description: `Montar os perfis da folha de abrir garantindo o esquadro perfeito. Fixar as dobradiças reforçadas de alumínio com 3 parafusos cada, posicionando a primeira a 150mm do topo, a segunda a 150mm da base e a terceira ao centro.`,
      criticalNotice: 'Garantir que os calços internos de reforço de nylon/alumínio estejam posicionados dentro da câmara do perfil onde a dobradiça será parafusada.',
      toolsRequired: ['Gabarito de dobradiça', 'Parafusadeira com limitador de torque', 'Broca 3.5mm'],
      componentsInvolved: ['Dobradiças de alumínio com pino inox', 'Reforços internos', 'Folha de giro'],
    });
  }

  // Fase 4: Envidraçamento
  steps.push({
    stepNumber: 4,
    phase: 'Envidraçamento',
    title: 'Calçamento Técnico do Vidro e Instalação dos Baguetes',
    description: `Posicionar os calços de apoio de borracha EPDM (dureza 80 Shore A) na travessa inferior a 50mm dos cantos. Assentar a chapa de vidro com auxílio de ventosas duplas industriais. Encaixar os contra-calços laterais para evitar deslocamento. Aplicar a guarnição externa de EPDM e encaixar os baguetes de alumínio sob pressão com martelo de nylon.`,
    criticalNotice: 'O vidro NUNCA pode ter contato direto metal-com-vidro. O calçamento incorreto é a causa de 90% das trincas espontâneas em esquadrias.',
    toolsRequired: ['Ventosas industriais duplas', 'Martelo de nylon com ponta macia', 'Espátula plástica para borracha de vedação', 'Estilete'],
    componentsInvolved: ['Calços de EPDM 80 Shore', 'Chapa de Vidro especificada', 'Baguetes de alumínio', 'Borracha guarnição EPDM'],
  });

  // Fase 5: Ferragens & Acessórios
  steps.push({
    stepNumber: 5,
    phase: 'Ferragens & Acessórios',
    title: 'Instalação de Fechos, Guias Superiores e Acabamentos',
    description: isSliding
      ? `Instalar o fecho concha lateral com gatilho automático no montante da folha móvel. Instalar o batedor com lingueta no marco lateral alinhando perfeitamente a altura. Instalar os guias superiores deslizantes de nylon e encaixar as tampas protetoras plásticas nos drenos inferiores com aleta anti-vento.`
      : isMaximAr
      ? `Instalar o fecho cremona ou fecho de toque central na travessa inferior da folha, com calço de nylon e contra-fecho no marco.`
      : `Instalar a fechadura multiponto / trinco rolete e maçaneta de alumínio ou inox. Conferir folga perimetral de 3mm entre folha e marco.`,
    criticalNotice: 'Testar o travamento do fecho pelo menos 5 vezes antes de liberar para a expedição.',
    toolsRequired: ['Chave Philips', 'Gabarito de furação de fecho', 'Parafusos 3.5x16mm inox'],
    componentsInvolved: ['Fecho concha / Cremona', 'Batedores', 'Guias de nylon', 'Tampas de dreno'],
  });

  // Fase 6: CQ
  steps.push({
    stepNumber: 6,
    phase: 'Controle de Qualidade (CQ)',
    title: 'Inspeção Final de Esquadro, Diagonais, Vedação e Deslizamento',
    description: `Medir as duas diagonais do marco e das folhas com trena de precisão. A diferença entre as diagonais (D1 e D2) deve ser inferior a 1,5 mm. Verificar suavidade do deslizamento, alinhamento das frestas de luz e ausência de riscos na pintura/anodização. Fixar etiqueta adesiva de identificação e código de lote Sanches & Marques.`,
    criticalNotice: 'Esquadrias fora de diagonal geram travamento no deslizamento e reclamação na obra.',
    toolsRequired: ['Trena milimetrada', 'Gabarito de folga', 'Pano de microfibra com cera protetiva'],
    componentsInvolved: ['Etiqueta de rastreabilidade', 'Embalagem protetora / plástico bolha'],
  });

  // 2. Fixadores e Parafusos
  const fastenersList = [
    {
      name: 'Parafuso Inox Cabeça Panela',
      spec: '4.8 x 50 mm AISI 304',
      quantityPerUnit: isSliding ? 8 : 12,
      totalQuantity: (isSliding ? 8 : 12) * quantity,
      purpose: 'União dos cantos do marco superior/inferior aos montantes',
    },
    {
      name: 'Parafuso Inox Auto-atarraxante',
      spec: '4.2 x 38 mm AISI 304',
      quantityPerUnit: isSliding ? 16 : 8,
      totalQuantity: (isSliding ? 16 : 8) * quantity,
      purpose: 'União das folhas móveis (travessas aos montantes)',
    },
    {
      name: 'Parafuso Inox Cabeça Chata',
      spec: '3.5 x 16 mm AISI 304',
      quantityPerUnit: 6,
      totalQuantity: 6 * quantity,
      purpose: 'Fixação de fechos concha, batedores e roldanas',
    },
    {
      name: 'Parafuso Brocante Flangeado',
      spec: '4.2 x 19 mm Zincado/Inox',
      quantityPerUnit: 8,
      totalQuantity: 8 * quantity,
      purpose: 'Fixação de guias de nylon e reforços',
    },
  ];

  // 3. Vedações e Insumos
  const perimeterMeters = ((widthMm + heightMm) * 2) / 1000;
  const gasketsAndSeals = [
    {
      name: 'Escova de Vedação com Barreira Plástica (Fin-Seal)',
      type: '5 x 5 mm Polipropileno Hidrorrepelente',
      approximateQuantity: `${(perimeterMeters * (isSliding ? 4 : 2) * quantity).toFixed(1)} metros`,
      application: 'Canais internos dos montantes e travessas para estanqueidade ao vento e poeira',
    },
    {
      name: 'Silicone Neutro Industrial de Alta Performance',
      type: 'Cura Neutra / Elasticidade 25%',
      approximateQuantity: `${Math.ceil((quantity * perimeterMeters) / 12)} tubo(s) de 300g`,
      application: 'Vedação interna e externa nas juntas de topo de 45°/90° do marco perimetral',
    },
    {
      name: 'Borracha Guarnição de EPDM para Envidraçamento',
      type: 'Perfil EPDM Preto ou Branco - Resistente UV',
      approximateQuantity: `${(perimeterMeters * (isSliding ? 2 : 1) * quantity).toFixed(1)} metros`,
      application: 'Amortecimento perimetral e vedação entre o vidro e o perfil de alumínio',
    },
    {
      name: 'Calços de Apoio e Contra-calços',
      type: 'Borracha EPDM Dureza 80 Shore A (5x25x100mm)',
      approximateQuantity: `${(isSliding ? 4 : 2) * quantity} unidades`,
      application: 'Suporte de carga do vidro na base e estabilização lateral',
    },
  ];

  // 4. Regras de calçamento
  const glassSettingRules = {
    description: isSliding
      ? 'Em folhas de correr, posicionar 2 calços de apoio na base a 50mm das bordas inferiores. Adicionar 2 calços espaçadores laterais no topo para travar o vidro dentro do canal.'
      : isCasement
      ? 'Em folhas de abrir (giro), aplicar calçamento diagonal: 1 calço de apoio na base junto ao lado da dobradiça, e 1 contra-calço no topo junto ao lado do fecho/maçaneta para suportar o peso em balanço.'
      : 'Em janelas maxim-ar, aplicar 2 calços na travessa inferior a 1/4 da largura das extremidades.',
    bottomBlocksQty: isSliding ? 2 : isCasement ? 1 : 2,
    sideBlocksQty: isSliding ? 2 : isCasement ? 1 : 2,
    blockType: 'Borracha EPDM ou Neoprene 80 Shore A (não usar madeira nem isopor)',
    warning: 'Nunca permitir contato direto do vidro com o parafuso ou com o alumínio bruto da esquadria.',
  };

  // 5. Checklist de Qualidade
  const qualityChecklist = [
    { item: 'Conferência de Vão e Medidas Nominais', tolerance: '± 1.0 mm', method: 'Trena milimetrada nas duas pontas e no meio' },
    { item: 'Diferença entre Diagonais (Esquadro)', tolerance: 'Máximo 1.5 mm', method: 'Trena cruzada de canto a canto (D1 vs D2)' },
    { item: 'Usinagem dos Drenos de Água', tolerance: 'Desobstruídos', method: 'Inspeção visual e teste de escoamento' },
    { item: 'Deslizamento / Abertura da Folha Móvel', tolerance: 'Suave sem atrito', method: 'Teste manual de deslizamento por 3 ciclos' },
    { item: 'Funcionamento do Fecho e Travamento', tolerance: '100% de precisão', method: 'Engate e desengate do trinco' },
    { item: 'Acabamento e Pintura / Anodização', tolerance: 'Zero riscos', method: 'Inspeção visual sob luz 500 lumens' },
  ];

  return {
    typologyName: typology.name,
    series: typology.series,
    widthMm,
    heightMm,
    color,
    orderNumber,
    clientName,
    roomTag,
    quantity,
    steps,
    fastenersList,
    gasketsAndSeals,
    glassSettingRules,
    qualityChecklist,
  };
}
