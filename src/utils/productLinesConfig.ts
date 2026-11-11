import { ProductLineConfig, OpeningType } from '../types';

export interface OpeningTypeOption {
  id: OpeningType;
  label: string;
  shortLabel: string;
  category: string;
  description: string;
  defaultOpeningIcon: string;
}

export const OPENING_TYPES_LIST: OpeningTypeOption[] = [
  {
    id: 'janela_correr',
    label: 'Janela de Correr (2, 3, 4 e 6 folhas)',
    shortLabel: 'Janela Correr',
    category: 'Janelas',
    description: 'Movimento horizontal sobre trilhos com roldanas de nylon ou rolamentos inox.',
    defaultOpeningIcon: '🪟',
  },
  {
    id: 'porta_correr',
    label: 'Porta de Correr (2, 3 e 4 folhas)',
    shortLabel: 'Porta Correr',
    category: 'Portas',
    description: 'Vãos amplos para sacadas, varandas gourmet e passagens.',
    defaultOpeningIcon: '🚪',
  },
  {
    id: 'maximar',
    label: 'Maxim-Ar (Projetante)',
    shortLabel: 'Maxim-Ar',
    category: 'Janelas',
    description: 'Abertura para o exterior com braços de articulação em inox.',
    defaultOpeningIcon: '📐',
  },
  {
    id: 'basculante',
    label: 'Basculante Pivotante',
    shortLabel: 'Basculante',
    category: 'Janelas',
    description: 'Eixo giratório horizontal com alavanca de acionamento.',
    defaultOpeningIcon: '🔄',
  },
  {
    id: 'porta_giro',
    label: 'Porta de Giro / Entrada Pivotante',
    shortLabel: 'Porta Giro',
    category: 'Portas',
    description: 'Porta de abrir com dobradiças ou pivot superior e inferior.',
    defaultOpeningIcon: '🚪',
  },
  {
    id: 'integrada',
    label: 'Janela / Porta com Persiana Integrada',
    shortLabel: 'Persiana Integrada',
    category: 'Especiais',
    description: 'Caixa superior com esteira recolhível manual ou motorizada.',
    defaultOpeningIcon: '⚡',
  },
  {
    id: 'fixo_bandeira',
    label: 'Quadro Fixo / Bandeira / Peitoril',
    shortLabel: 'Fixo / Bandeira',
    category: 'Vidros Fixos',
    description: 'Esquadria fixa sem partes móveis para iluminação e isolamento.',
    defaultOpeningIcon: '🖼️',
  },
];

export const DEFAULT_PRODUCT_LINES: ProductLineConfig[] = [
  {
    id: 'suprema',
    name: 'Linha Suprema',
    nominalThicknessMm: 25,
    categoryBadge: 'Residencial Padrão (25mm)',
    description: 'Linha líder de mercado no Brasil para edificações residenciais e prediais de médio porte.',
    allowedOpenings: ['janela_correr', 'porta_correr', 'maximar', 'basculante', 'porta_giro', 'integrada', 'fixo_bandeira'],
  },
  {
    id: 'gold',
    name: 'Linha Gold',
    nominalThicknessMm: 32,
    categoryBadge: 'Alto Padrão / Acústica (32mm)',
    description: 'Bitola robusta com excelente inércia para grandes vãos, folhas pesadas e vidros insulados/laminados.',
    allowedOpenings: ['janela_correr', 'porta_correr', 'maximar', 'porta_giro', 'integrada', 'fixo_bandeira'],
  },
  {
    id: 'chroma',
    name: 'Linha Chroma',
    nominalThicknessMm: 32,
    categoryBadge: 'Minimalista & Acústica Premium',
    description: 'Design contemporâneo com perfis de vistas estreitas e alta performance termoacústica.',
    allowedOpenings: ['janela_correr', 'porta_correr', 'maximar', 'fixo_bandeira'],
  },
  {
    id: 'linha_25',
    name: 'Linha 25 Tradicional',
    nominalThicknessMm: 25,
    categoryBadge: 'Econômica Convencional (25mm)',
    description: 'Linha consagrada de fácil usinagem e ampla disponibilidade de componentes.',
    allowedOpenings: ['janela_correr', 'maximar', 'basculante', 'porta_giro', 'fixo_bandeira'],
  },
  {
    id: 'linha_30',
    name: 'Linha 30 Reforçada',
    nominalThicknessMm: 30,
    categoryBadge: 'Comercial & Residencial Reforçada',
    description: 'Perfil tubular robusto para portas de entrada, passagens comerciais e portões.',
    allowedOpenings: ['porta_giro', 'fixo_bandeira', 'porta_correr'],
  },
  {
    id: 'integrada_master',
    name: 'Integrada Master Persiana',
    nominalThicknessMm: 32,
    categoryBadge: 'Blackout & Automação',
    description: 'Solução completa para dormitórios com caixa de enrolar termoisolante e motor tubular.',
    allowedOpenings: ['integrada', 'janela_correr', 'porta_correr'],
  },
];

const STORAGE_KEY = 'sanches_marques_product_lines_v1';

export const loadProductLinesConfig = (): ProductLineConfig[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRODUCT_LINES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_PRODUCT_LINES;
};

export const saveProductLinesConfig = (lines: ProductLineConfig[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // fallback
  }
};

export const resetProductLinesConfig = (): ProductLineConfig[] => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fallback
  }
  return DEFAULT_PRODUCT_LINES;
};
