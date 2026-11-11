/**
 * Catálogo e Assistente de Kits de Perfis e Componentes de Alumínio
 * Facilita a montagem ágil de esquadrias padrão
 * Sanches & Marques Esquadrias
 */

export interface AluminumProfileKit {
  id: string;
  name: string;
  series: 'Suprema' | 'Gold' | 'Linha 25' | 'Integrada' | 'Linha 30' | 'Fachada' | (string & {});
  category: string;
  defaultTypologyId: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultGlassId: string;
  roomTagSuggestion: string;
  description: string;
  frequentProfiles: Array<{ code: string; role: string }>;
  frequentAccessories: Array<{ name: string; qty: number; unit: string }>;
  isCustom?: boolean;
}

export const DEFAULT_ALUMINUM_KITS: AluminumProfileKit[] = [
  {
    id: 'kit_suprema_janela_2f',
    name: 'Kit Janela 2F Padrão Suprema (1500×1200)',
    series: 'Suprema',
    category: 'Janela de Correr',
    defaultTypologyId: 'typo_janela_2f_suprema',
    defaultWidth: 1500,
    defaultHeight: 1200,
    defaultGlassId: 'gl_temp_6',
    roomTagSuggestion: 'Quarto Social',
    description: 'Kit clássico residencial com 2 folhas de correr, roldanas duplas em nylon c/ rolamento e fecho concha.',
    frequentProfiles: [
      { code: 'SU-001', role: 'Marco lateral e superior' },
      { code: 'SU-002', role: 'Marco soleira com dreno oblongo' },
      { code: 'SU-053', role: 'Montante lateral da folha de correr' },
      { code: 'SU-068', role: 'Travessa superior e inferior' },
      { code: 'SU-102', role: 'Baguete de fixação do vidro' },
    ],
    frequentAccessories: [
      { name: 'Roldana c/ Rolamento Linha Suprema', qty: 4, unit: 'un' },
      { name: 'Fecho Concha Lateral com Gatilho', qty: 2, unit: 'un' },
      { name: 'Escova de Vedação 5x5mm c/ Barreira', qty: 10, unit: 'm' },
      { name: 'Calços EPDM 80 Shore A', qty: 4, unit: 'un' },
    ],
  },
  {
    id: 'kit_gold_porta_3f',
    name: 'Kit Porta Balcão 3F Reforçada Gold (2400×2200)',
    series: 'Gold',
    category: 'Porta de Correr',
    defaultTypologyId: 'typo_porta_3f_gold',
    defaultWidth: 2400,
    defaultHeight: 2200,
    defaultGlassId: 'gl_lam_8',
    roomTagSuggestion: 'Varanda / Living',
    description: 'Kit de alto padrão com trilho triplo 32mm, folhas robustas acústicas, fechadura bico de papagaio e vidro 8mm laminado.',
    frequentProfiles: [
      { code: 'GL-001', role: 'Marco trilho triplo 32mm' },
      { code: 'GL-036', role: 'Montante folha reforçado com puxador' },
      { code: 'GL-055', role: 'Baguete reforçado para vidro grosso' },
    ],
    frequentAccessories: [
      { name: 'Roldana Dupla Inox Blindada 120kg', qty: 6, unit: 'un' },
      { name: 'Fechadura Bico de Papagaio c/ Chave Latão', qty: 1, unit: 'un' },
      { name: 'Guarnição Vedação EPDM Tipo Cunha', qty: 18, unit: 'm' },
    ],
  },
  {
    id: 'kit_suprema_maximar',
    name: 'Kit Maxim-ar Banheiro Suprema (600×600)',
    series: 'Suprema',
    category: 'Maxim-Ar',
    defaultTypologyId: 'typo_maximar_suprema',
    defaultWidth: 600,
    defaultHeight: 600,
    defaultGlassId: 'gl_mini_4',
    roomTagSuggestion: 'Banheiro / Lavabo',
    description: 'Kit compacto para áreas úmidas e ventilação contínua, com braço articulado inox 300mm e fecho central alavanca.',
    frequentProfiles: [
      { code: 'SU-079', role: 'Marco de vedação maxim-ar' },
      { code: 'SU-080', role: 'Folha móvel projetante' },
      { code: 'SU-102', role: 'Baguete de encaixe' },
    ],
    frequentAccessories: [
      { name: 'Braço Articulado Inox Reforçado 300mm', qty: 2, unit: 'un' },
      { name: 'Fecho Central Alavanca Maxim-Ar', qty: 1, unit: 'un' },
      { name: 'Escova 5x5mm', qty: 4, unit: 'm' },
    ],
  },
  {
    id: 'kit_gold_porta_giro_pivot',
    name: 'Kit Porta de Entrada Pivotante Gold (1000×2400)',
    series: 'Gold',
    category: 'Porta de Giro',
    defaultTypologyId: 'typo_porta_giro_gold',
    defaultWidth: 1000,
    defaultHeight: 2400,
    defaultGlassId: 'gl_refl_8',
    roomTagSuggestion: 'Hall de Entrada',
    description: 'Kit imponente para entrada social, montantes tubulares reforçados, pivô inox 150kg e fechadura rolete multiponto.',
    frequentProfiles: [
      { code: 'GL-001', role: 'Marco perimetral com batedor' },
      { code: 'GL-036', role: 'Perfil tubular estrutural' },
    ],
    frequentAccessories: [
      { name: 'Pivô Giratório Inox com Rolamento 150kg', qty: 1, unit: 'kit' },
      { name: 'Fechadura Rolete Multiponto Aço Inox', qty: 1, unit: 'un' },
      { name: 'Puxador Tubular Curvo Inox 80cm', qty: 1, unit: 'par' },
    ],
  },
  {
    id: 'kit_integrada_persiana',
    name: 'Kit Persiana Integrada Motorizada (1600×1400)',
    series: 'Integrada',
    category: 'Integrada Persiana',
    defaultTypologyId: 'typo_integrada_suprema',
    defaultWidth: 1600,
    defaultHeight: 1400,
    defaultGlassId: 'gl_temp_6',
    roomTagSuggestion: 'Suíte Principal',
    description: 'Kit com persiana blackout 100% de alumínio motorizada com controle remoto, caixa compacta e isolamento térmico.',
    frequentProfiles: [
      { code: 'INT-001', role: 'Caixa de recolhimento superior' },
      { code: 'INT-010', role: 'Guia lateral dupla c/ escova' },
      { code: 'SU-053', role: 'Folhas de correr internas' },
    ],
    frequentAccessories: [
      { name: 'Motor Tubular Eletrônico 220V c/ Controle', qty: 1, unit: 'kit' },
      { name: 'Palhetas de Alumínio c/ Poliuretano', qty: 28, unit: 'un' },
      { name: 'Roldanas e Fechos', qty: 1, unit: 'kit' },
    ],
  },
  {
    id: 'kit_linha25_economica',
    name: 'Kit Janela Econômica Linha 25 (1200×1000)',
    series: 'Linha 25',
    category: 'Janela de Correr',
    defaultTypologyId: 'typo_janela_2f_l25',
    defaultWidth: 1200,
    defaultHeight: 1000,
    defaultGlassId: 'gl_comum_4',
    roomTagSuggestion: 'Cozinha / Área de Serviço',
    description: 'Kit econômico para obras de baixo custo, perfil 25mm leve, vidro comum e acessórios simplificados.',
    frequentProfiles: [
      { code: 'L25-001', role: 'Marco convencional' },
      { code: 'L25-002', role: 'Folha móvel leve' },
    ],
    frequentAccessories: [
      { name: 'Roldana Simples Nylon Linha 25', qty: 4, unit: 'un' },
      { name: 'Fecho Concha Nylon Preto', qty: 1, unit: 'un' },
    ],
  },
];
