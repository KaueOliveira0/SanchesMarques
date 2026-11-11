/**
 * Base de Dados Técnica e Metadados dos 10 Catálogos Oficiais de Fabricantes
 * Sanches & Marques Esquadrias Pro
 * 
 * Contém o mapeamento oficial dos 10 PDFs fornecidos, com links diretos para
 * visualização/download e o banco mestre de perfis e ferragens extraídos.
 */

import { ProfileDefinition, AccessoryDefinition } from '../types';

export interface OfficialPdfCatalog {
  id: string;
  title: string;
  filename: string;
  manufacturer: string;
  edition: string;
  series: 'Chroma' | 'Suprema' | 'Gold' | 'Linha 25' | 'Universal';
  fileSizeMb: number;
  pages: number;
  description: string;
  pdfUrl: string; // /public/assets/aistudio/...
  badge: string;
  badgeColor: 'emerald' | 'cyan' | 'amber' | 'yellow' | 'blue' | 'purple' | 'indigo' | 'orange' | 'slate' | 'rose';
  highlights: string[];
}

export const OFFICIAL_PDF_CATALOGS: OfficialPdfCatalog[] = [
  {
    id: 'chroma_curso_2025',
    title: 'Apostila Curso Sistema Chroma 2025',
    filename: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf',
    manufacturer: 'Perfil Alumínio do Brasil S.A.',
    edition: 'Curso Técnico Oficial 2025',
    series: 'Chroma',
    fileSizeMb: 16.04,
    pages: 127,
    description: 'Manual prático e detalhado de fabricação de esquadrias da Linha Chroma: fórmulas matemáticas de corte, usinagens de drenos, gabarito de estampos, folgas de vidros e kits de componentes para 2, 3 e 4 folhas.',
    pdfUrl: '/public/assets/aistudio/Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf',
    badge: 'Fórmulas & Usinagens',
    badgeColor: 'emerald',
    highlights: [
      'Trilhos 2, 3 e 4 folhas (CHR-002, CHR-012, CHR-019)',
      'Montantes centrais reforçados (CHR-040, CHR-042)',
      'Fórmulas exatas de corte de perfis e vidros',
      'Esquemas de montagem e furação na bancada'
    ]
  },
  {
    id: 'chroma_tecnico_2024',
    title: 'Catálogo Técnico Chroma e Club Chroma (Ed. 10)',
    filename: 'Catalogo_Tecnico_Chroma_e_Club_Chroma_Ed_10_Abril_2024_10_03bd9418.pdf',
    manufacturer: 'Perfil Alumínio do Brasil S.A.',
    edition: 'Edição 10 (Abril 2024)',
    series: 'Chroma',
    fileSizeMb: 45.26,
    pages: 248,
    description: 'Catálogo técnico oficial completo do Sistema Chroma e Club Chroma. Seções transversais com momentos de inércia (Jx, Jy), pesos lineares (kg/m), tabelas de vento ABNT NBR 10821 e certificações.',
    pdfUrl: '/public/assets/aistudio/Catalogo_Tecnico_Chroma_e_Club_Chroma_Ed_10_Abril_2024_10_03bd9418.pdf',
    badge: 'Engenharia Completa',
    badgeColor: 'cyan',
    highlights: [
      'Seções técnicas em escala 1:1 de toda a Linha Chroma',
      'Gráficos de momentos de inércia para grandes vãos',
      'Opções de marcos de 2, 3 e 4 planos deslizantes',
      'Linha Club Chroma para portas pesadas'
    ]
  },
  {
    id: 'alcoa_suprema',
    title: 'Catálogo Técnico Linha Suprema Oficial',
    filename: 'SUPREMA_ea969330.pdf',
    manufacturer: 'Alcoa / Hydro Alumínio',
    edition: 'Catálogo Consolidado GMPE 009',
    series: 'Suprema',
    fileSizeMb: 9.71,
    pages: 135,
    description: 'A norma e especificação de referência da Linha Suprema 25mm. Tabelas de marcos (SU-001/002/003/040), folhas (SU-053/054/068), baguetes e componentes homologados.',
    pdfUrl: '/public/assets/aistudio/SUPREMA_ea969330.pdf',
    badge: 'Padrão ABNT NBR 10821',
    badgeColor: 'amber',
    highlights: [
      'Perfis padrão SU-001, SU-002, SU-003, SU-053, SU-054',
      'Janela e porta de correr 2, 3 e 4 folhas',
      'Maxim-ar MN-001/002 com pingadeira',
      'Tabelas de pressões de ensaio de vento'
    ]
  },
  {
    id: 'alcoa_gold',
    title: 'Catálogo Técnico Linha Gold Oficial',
    filename: 'catalogo_gold__1__8c3c4c71.pdf',
    manufacturer: 'Alcoa Alumínio',
    edition: 'Edição Técnica Linha 32mm',
    series: 'Gold',
    fileSizeMb: 20.99,
    pages: 172,
    description: 'Projeto completo para esquadrias de alto padrão Linha Gold: perfis robustos de 32mm, trilhos embutidos em aço inox, montantes pesados com puxador incorporado e sistemas de correr e giro.',
    pdfUrl: '/public/assets/aistudio/catalogo_gold__1__8c3c4c71.pdf',
    badge: 'Alto Padrão 32mm',
    badgeColor: 'yellow',
    highlights: [
      'Perfis pesados GL-001, GL-003, GL-011, GL-022, GL-035',
      'Trilho inferior com pista de aço inox embutida',
      'Folhas para vidros duplos insulados e laminados pesados',
      'Usinagem para fechaduras bico de papagaio e conchas'
    ]
  },
  {
    id: 'inovamais_ivgold',
    title: 'Catálogo Técnico Linha IV Gold (R06)',
    filename: 'catalogo_ivgold-r06_c66435a5.pdf',
    manufacturer: 'Inovamais Alumínio',
    edition: 'Revisão 06 (IV Gold Industrial)',
    series: 'Gold',
    fileSizeMb: 19.48,
    pages: 180,
    description: 'Evolução moderna do sistema Gold com reforços estruturais para pressão de vento litorânea, vedações acústicas especiais, roldanas duplas tandem ajustáveis e gabaritos de usinagem.',
    pdfUrl: '/public/assets/aistudio/catalogo_ivgold-r06_c66435a5.pdf',
    badge: 'Reforço Estrutural',
    badgeColor: 'blue',
    highlights: [
      'Gabaritos de estampagem rápida',
      'Vedações acústicas adicionais contra ruído',
      'Roldanas tandem de alta capacidade (até 200kg/folha)',
      'Tabelas de limites dimensionais por pressão de vento'
    ]
  },
  {
    id: 'miranda_2025',
    title: 'Catálogo Geral 2025 Miranda Alumínios (V4)',
    filename: 'Cat_logo_2025_-_Miranda_Alum_nios_V4__1_-1_e28e5fdf.pdf',
    manufacturer: 'Miranda Alumínios',
    edition: 'Versão 4 (2025)',
    series: 'Universal',
    fileSizeMb: 79.86,
    pages: 312,
    description: 'Catálogo geral de grande porte com fornecimento completo de perfis para Suprema, Gold, Linha 25, Linha 30, tubos estruturais, barras chatas, cantoneiras e perfis de fachada.',
    pdfUrl: '/public/assets/aistudio/Cat_logo_2025_-_Miranda_Alum_nios_V4__1_-1_e28e5fdf.pdf',
    badge: 'Distribuidor Master',
    badgeColor: 'purple',
    highlights: [
      'Tabelas de pesos nominais e tolerâncias industriais',
      'Linha completa de tubos redondos, quadrados e retangulares',
      'Cantoneiras de abas iguais e desiguais',
      'Perfis para Linha 25, 30 e Fachada Pele de Vidro'
    ]
  },
  {
    id: 'bendini_2026',
    title: 'Catálogo Bendini Perfis de Alumínio 2026',
    filename: 'Cata_logo_Bendini_2026_c1610461.pdf',
    manufacturer: 'Bendini Alumínio',
    edition: 'Edição Industrial 2026',
    series: 'Universal',
    fileSizeMb: 38.08,
    pages: 140,
    description: 'Distribuidora referência da região Sul (SC/PR) com tabela técnica de perfis homologados, pesos exatos por metro, acabamentos anodizados e pintura eletrostática a pó.',
    pdfUrl: '/public/assets/aistudio/Cata_logo_Bendini_2026_c1610461.pdf',
    badge: 'Distribuidor Regional SC',
    badgeColor: 'indigo',
    highlights: [
      'Tabelas de pesos atualizadas para Santa Catarina e Paraná',
      'Perfis especiais para litoral com alta resistência à corrosão',
      'Acabamentos Branco, Preto, Bronze e Amadeirado',
      'Linha de contramarcos e arremates'
    ]
  },
  {
    id: 'presidente_perfis',
    title: 'Catálogo Geral Presidente Perfis & Esquadrias',
    filename: 'CAT_LOGO_PRESIDENTE_0d0f6150.pdf',
    manufacturer: 'Presidente Alumínio',
    edition: 'Edição Linhas & Componentes',
    series: 'Linha 25',
    fileSizeMb: 37.21,
    pages: 196,
    description: 'Perfis para Linha 25 tradicional, vidro temperado 8mm e 10mm (BX-1571, BX-209, CB-266), contramarcos, cantoneiras com escova e montantes especiais.',
    pdfUrl: '/public/assets/aistudio/CAT_LOGO_PRESIDENTE_0d0f6150.pdf',
    badge: 'Linha 25 & Temperado',
    badgeColor: 'orange',
    highlights: [
      'Perfis Linha 25 (25-677, CM-008, L25-01/02)',
      'Kits de vidro temperado 8mm e 10mm (BX-1571, CB-266)',
      'Cantoneiras preparadas para escova de vedação',
      'Montantes com puxador integrado'
    ]
  },
  {
    id: 'catalogo_perfis_geral',
    title: 'Catálogo de Perfis Comerciais & Estruturais',
    filename: 'CAT_LOGO_-_PERFIS_72b6f9d2.pdf',
    manufacturer: 'Indústria Brasileira de Alumínio',
    edition: 'Edição de Referência',
    series: 'Universal',
    fileSizeMb: 15.16,
    pages: 110,
    description: 'Relação de barras comerciais: tubos redondos e retangulares, perfis U de vedação, cantoneiras de abas iguais/desiguais, perfis T e arremates.',
    pdfUrl: '/public/assets/aistudio/CAT_LOGO_-_PERFIS_72b6f9d2.pdf',
    badge: 'Perfis Comerciais',
    badgeColor: 'slate',
    highlights: [
      'Tubos industriais e estruturais',
      'Barras chatas para reforços internos',
      'Cantoneiras para fixação e contramarcos',
      'Perfis U e T para serralheria pesada'
    ]
  },
  {
    id: 'catalogo_acessorios_geral',
    title: 'Catálogo de Acessórios, Puxadores & Ferragens',
    filename: 'CAT_LOGO_-_ACESS_RIOS_b3979971.pdf',
    manufacturer: 'Fornecedores de Ferragens para Esquadrias',
    edition: 'Edição Acessórios & Componentes',
    series: 'Universal',
    fileSizeMb: 37.24,
    pages: 165,
    description: 'Catálogo de ferragens finas: puxadores tubulares e barra chata em aço inox 304, roldanas especiais, fechos de toque rápido, alavancas e gaxetas.',
    pdfUrl: '/public/assets/aistudio/CAT_LOGO_-_ACESS_RIOS_b3979971.pdf',
    badge: 'Ferragens & Puxadores',
    badgeColor: 'rose',
    highlights: [
      'Puxadores em aço inox 304 (Barra Chata, Tubular, em S)',
      'Fechos concha automáticos e toque leve',
      'Dobradiças reforçadas com anel de nylon/rolamento',
      'Braços articulados inox para maxim-ar'
    ]
  }
];

/**
 * BANCO MESTRE DE PERFIS EXTRAÍDOS DOS 10 CATÁLOGOS TÉCNICOS
 */
export const MASTER_CATALOG_PROFILES: ProfileDefinition[] = [
  // ==========================================
  // SISTEMA CHROMA & CLUB CHROMA (Perfil Alumínio do Brasil)
  // ==========================================
  {
    id: 'chr002',
    code: 'CHR-002',
    name: 'Trilho Inferior Porta 2 e 4 Folhas Chroma',
    series: 'Chroma',
    category: 'Trilho',
    kgm: 1.258,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Drenagem oculta de alta vazão e furação para fixação no contramarco',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr003',
    code: 'CHR-003',
    name: 'Trilho Inferior Janela Chroma (2 e 4 Folhas)',
    series: 'Chroma',
    category: 'Trilho',
    kgm: 1.192,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Rasgos oblongos para dreno de água com válvulas antitufão',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr039',
    code: 'CHR-039',
    name: 'Trilho Inferior c/ Pingadeira Chroma',
    series: 'Chroma',
    category: 'Trilho',
    kgm: 1.232,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Pingadeira integrada para escoamento frontal',
    sourceCatalog: 'Catalogo_Tecnico_Chroma_e_Club_Chroma_Ed_10_Abril_2024_10_03bd9418.pdf'
  },
  {
    id: 'chr012',
    code: 'CHR-012',
    name: 'Trilho Inferior Janela 3 Folhas (3 Planos) Chroma',
    series: 'Chroma',
    category: 'Trilho',
    kgm: 1.722,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Drenos escalonados nas 3 pistas deslizantes',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr013',
    code: 'CHR-013',
    name: 'Trilho Inferior Porta 3 Folhas (3 Planos) Chroma',
    series: 'Chroma',
    category: 'Trilho',
    kgm: 1.725,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Pistas para roldana Strong CHRC-011',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr014',
    code: 'CHR-014',
    name: 'Marco Superior Janela / Porta 3 Folhas Chroma',
    series: 'Chroma',
    category: 'Marco',
    kgm: 1.650,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Furação para batente e guias de nylon',
    sourceCatalog: 'Catalogo_Tecnico_Chroma_e_Club_Chroma_Ed_10_Abril_2024_10_03bd9418.pdf'
  },
  {
    id: 'chr019',
    code: 'CHR-019',
    name: 'Trilho Inferior Porta 4 Folhas (4 Planos) Chroma',
    series: 'Chroma',
    category: 'Trilho',
    kgm: 2.310,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Estrutura reforçada de 4 pistas para abertura quase total do vão',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr020',
    code: 'CHR-020',
    name: 'Trilho Inferior Janela 4 Folhas (4 Planos) Chroma',
    series: 'Chroma',
    category: 'Trilho',
    kgm: 2.197,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Drenagem quádrupla para alta pressão de água',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr021',
    code: 'CHR-021',
    name: 'Marco Superior Janela / Porta 4 Folhas Chroma',
    series: 'Chroma',
    category: 'Marco',
    kgm: 2.188,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Guias superiores quadruplas com amortecimento',
    sourceCatalog: 'Catalogo_Tecnico_Chroma_e_Club_Chroma_Ed_10_Abril_2024_10_03bd9418.pdf'
  },
  {
    id: 'chr016',
    code: 'CHR-016',
    name: 'Marco Lateral Janela / Porta 3 Folhas Chroma',
    series: 'Chroma',
    category: 'Marco',
    kgm: 0.960,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Rasgo para contra-fecho lateral CFEC-389',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr023',
    code: 'CHR-023',
    name: 'Marco Lateral Janela / Porta 4 Folhas Chroma',
    series: 'Chroma',
    category: 'Marco',
    kgm: 1.218,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Alojamento para guarnições de batente GUA-115',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr010',
    code: 'CHR-010',
    name: 'Marco Superior / Lateral Janela 2/4 Folhas Chroma',
    series: 'Chroma',
    category: 'Marco',
    kgm: 0.657,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Furação de topo em 90° para montagem rápida',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr120',
    code: 'CHR-120',
    name: 'Perfil Montante Mão de Amigo Central Chroma',
    series: 'Chroma',
    category: 'Montante',
    kgm: 0.118,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Encaixe de vedação GUA-516 e escova acústica',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr027',
    code: 'CHR-027',
    name: 'Montante Lateral com Fecho Chroma',
    series: 'Chroma',
    category: 'Montante',
    kgm: 0.987,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Usinagem de estampo para fecho concha FEC-7411',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr028',
    code: 'CHR-028',
    name: 'Montante Central Liso Chroma',
    series: 'Chroma',
    category: 'Montante',
    kgm: 0.930,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Canais duplos para escovas de vedação',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr030',
    code: 'CHR-030',
    name: 'Travessa Superior / Inferior da Folha Chroma',
    series: 'Chroma',
    category: 'Travessa',
    kgm: 0.754,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Usinagem inferior para caixa de roldana ROL-468',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr115',
    code: 'CHR-115',
    name: 'Mata Junta Perfil de Acabamento Central Chroma',
    series: 'Chroma',
    category: 'Arremate',
    kgm: 0.458,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Encaixe de pressão com guarnição GUA-115',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr031',
    code: 'CHR-031',
    name: 'Travessa Intermediária Estrutural Chroma',
    series: 'Chroma',
    category: 'Travessa',
    kgm: 0.975,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Divisão de folhas mistas vidro/palheta',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr040',
    code: 'CHR-040',
    name: 'Montante Central com Reforço de Aba Dupla Chroma',
    series: 'Chroma',
    category: 'Montante',
    kgm: 1.516,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Alta inércia para portas de sacada de até 2.80m de altura',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'chr042',
    code: 'CHR-042',
    name: 'Montante com Reforço de Aba Simples Chroma',
    series: 'Chroma',
    category: 'Montante',
    kgm: 1.188,
    defaultLength: 6000,
    pricePerKg: 39.50,
    machiningNote: 'Reforço intermediário de vento até 2.40m',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'mp347',
    code: 'MP-347',
    name: 'Contramarco Frontal c/ Guarnição Chroma',
    series: 'Chroma',
    category: 'Contramarco',
    kgm: 0.200,
    defaultLength: 6000,
    pricePerKg: 34.00,
    machiningNote: 'Fixação de grapas e vedação com selante PU',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'cm200',
    code: 'CM-200',
    name: 'Conexão de Canto para Contramarco',
    series: 'Chroma',
    category: 'Contramarco',
    kgm: 0.200,
    defaultLength: 6000,
    pricePerKg: 34.00,
    machiningNote: 'Canto mecânico 90°',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'cl006',
    code: 'CL-006',
    name: 'Arremate Perimetral de Alumínio Chroma',
    series: 'Chroma',
    category: 'Arremate',
    kgm: 1.100,
    defaultLength: 6000,
    pricePerKg: 37.00,
    machiningNote: 'Corte em 45° de meia-esquadria nos cantos',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },
  {
    id: 'cl011',
    code: 'CL-011',
    name: 'Cunha de Arremate e Ajuste',
    series: 'Chroma',
    category: 'Arremate',
    kgm: 0.333,
    defaultLength: 6000,
    pricePerKg: 34.00,
    machiningNote: 'Presilha de encaixe rápido',
    sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf'
  },

  // ==========================================
  // LINHA GOLD & IV GOLD (Alcoa / Inovamais)
  // ==========================================
  {
    id: 'gl001',
    code: 'GL-001',
    name: 'Marco Superior / Lateral Linha Gold',
    series: 'Gold',
    category: 'Marco',
    kgm: 0.985,
    defaultLength: 6000,
    pricePerKg: 38.50,
    machiningNote: 'Furação de estampos para união mecânica M6',
    sourceCatalog: 'catalogo_gold__1__8c3c4c71.pdf'
  },
  {
    id: 'gl003',
    code: 'GL-003',
    name: 'Trilho Inferior Aço Inox Embutido Gold',
    series: 'Gold',
    category: 'Trilho',
    kgm: 1.150,
    defaultLength: 6000,
    pricePerKg: 38.50,
    machiningNote: 'Drenagem oculta de alta vazão',
    sourceCatalog: 'catalogo_gold__1__8c3c4c71.pdf'
  },
  {
    id: 'gl006',
    code: 'GL-006',
    name: 'Trilho Inferior 3 Planos Linha Gold',
    series: 'Gold',
    category: 'Trilho',
    kgm: 1.820,
    defaultLength: 6000,
    pricePerKg: 38.50,
    machiningNote: 'Três planos de correr com pista inox embutida',
    sourceCatalog: 'catalogo_ivgold-r06_c66435a5.pdf'
  },
  {
    id: 'gl011',
    code: 'GL-011',
    name: 'Montante Lateral c/ Puxador Embutido Gold',
    series: 'Gold',
    category: 'Montante',
    kgm: 1.250,
    defaultLength: 6000,
    pricePerKg: 38.50,
    machiningNote: 'Puxador ergonômico extrudado no próprio perfil',
    sourceCatalog: 'catalogo_ivgold-r06_c66435a5.pdf'
  },
  {
    id: 'gl014',
    code: 'GL-014',
    name: 'Travessa Reforçada Porta de Correr Gold',
    series: 'Gold',
    category: 'Travessa',
    kgm: 1.120,
    defaultLength: 6000,
    pricePerKg: 38.50,
    machiningNote: 'Usinagem dupla para roldanas tandem 200kg',
    sourceCatalog: 'catalogo_gold__1__8c3c4c71.pdf'
  },
  {
    id: 'gl017',
    code: 'GL-017',
    name: 'Montante Liso com Puxador Gold',
    series: 'Gold',
    category: 'Montante',
    kgm: 1.050,
    defaultLength: 6000,
    pricePerKg: 38.50,
    machiningNote: 'Alojamento para fechadura multiponto',
    sourceCatalog: 'CAT_LOGO_PRESIDENTE_0d0f6150.pdf'
  },
  {
    id: 'gl020',
    code: 'GL-020',
    name: 'Montante Central e Puxador Gold',
    series: 'Gold',
    category: 'Montante',
    kgm: 1.180,
    defaultLength: 6000,
    pricePerKg: 38.50,
    machiningNote: 'Sobreposição central de alta vedação',
    sourceCatalog: 'CAT_LOGO_PRESIDENTE_0d0f6150.pdf'
  },
  {
    id: 'gl022',
    code: 'GL-022',
    name: 'Montante Reforçado da Folha Gold',
    series: 'Gold',
    category: 'Montante',
    kgm: 0.940,
    defaultLength: 6000,
    pricePerKg: 38.50,
    machiningNote: 'Usinagem para fechadura bico de papagaio Gold',
    sourceCatalog: 'catalogo_gold__1__8c3c4c71.pdf'
  },
  {
    id: 'gl028',
    code: 'GL-028',
    name: 'Montante Central Mão de Amigo Gold',
    series: 'Gold',
    category: 'Montante',
    kgm: 1.040,
    defaultLength: 6000,
    pricePerKg: 38.50,
    machiningNote: 'Gaxeta EPDM e escovas duplas de amortecimento',
    sourceCatalog: 'catalogo_gold__1__8c3c4c71.pdf'
  },
  {
    id: 'gl035',
    code: 'GL-035',
    name: 'Travessa Reforçada Folha Gold',
    series: 'Gold',
    category: 'Travessa',
    kgm: 0.880,
    defaultLength: 6000,
    pricePerKg: 38.50,
    machiningNote: 'Encaixe de roldana dupla blindada até 180kg',
    sourceCatalog: 'catalogo_gold__1__8c3c4c71.pdf'
  },
  {
    id: 'gl048',
    code: 'GL-048',
    name: 'Travessa Intermediária Reforçada Gold',
    series: 'Gold',
    category: 'Travessa',
    kgm: 1.340,
    defaultLength: 6000,
    pricePerKg: 38.50,
    machiningNote: 'Divisória de vidro laminado/temperado para portas altas',
    sourceCatalog: 'catalogo_gold__1__8c3c4c71.pdf'
  },

  // ==========================================
  // LINHA SUPREMA (Alcoa / Hydro / Bendini)
  // ==========================================
  {
    id: 'su001',
    code: 'SU-001',
    name: 'Marco Lateral 2 Planos',
    series: 'Suprema',
    category: 'Marco',
    kgm: 0.582,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Rasgo para parafuso de fixação e dreno superior',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su002',
    code: 'SU-002',
    name: 'Marco Superior 2 Planos',
    series: 'Suprema',
    category: 'Marco',
    kgm: 0.540,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Furação Ø5mm para montagem de cantoneira',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su003',
    code: 'SU-003',
    name: 'Trilho Inferior 2 Planos',
    series: 'Suprema',
    category: 'Trilho',
    kgm: 0.612,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Drenos de água oblongos 25x5mm c/ válvula',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su040',
    code: 'SU-040',
    name: 'Trilho Inferior 3 Planos Suprema',
    series: 'Suprema',
    category: 'Trilho',
    kgm: 0.940,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Trilho de 3 folhas com dreno nos canais internos',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su053',
    code: 'SU-053',
    name: 'Montante Lateral Folha (Fecho)',
    series: 'Suprema',
    category: 'Montante',
    kgm: 0.528,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Rasgo para fecho concha automático 120x22mm',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su054',
    code: 'SU-054',
    name: 'Montante Central Folha (Mão de Amigo)',
    series: 'Suprema',
    category: 'Montante',
    kgm: 0.495,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Encaixe de escova de vedação 7x6mm',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su068',
    code: 'SU-068',
    name: 'Travessa Superior/Inferior da Folha',
    series: 'Suprema',
    category: 'Travessa',
    kgm: 0.442,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Usinagem de roldana na travessa inferior',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su079',
    code: 'SU-079',
    name: 'Baguete de Fixação do Vidro Suprema (Corte 45°)',
    series: 'Suprema',
    category: 'Baguate',
    kgm: 0.185,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Corte em 45° ou 90° para pressão de borracha',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su080',
    code: 'SU-080',
    name: 'Baguete Redondo Suprema',
    series: 'Suprema',
    category: 'Baguate',
    kgm: 0.192,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Design curvo de acabamento',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su081',
    code: 'SU-081',
    name: 'Presilha de Encaixe de Baguete',
    series: 'Suprema',
    category: 'Baguate',
    kgm: 0.110,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Clipagem interna na folha',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su086',
    code: 'SU-086',
    name: 'Pingadeira Superior Suprema',
    series: 'Suprema',
    category: 'Arremate',
    kgm: 0.285,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Proteção contra infiltração no peitoril',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su102',
    code: 'SU-102',
    name: 'Contramarco de Alumínio Suprema',
    series: 'Suprema',
    category: 'Contramarco',
    kgm: 0.235,
    defaultLength: 6000,
    pricePerKg: 34.00,
    machiningNote: 'Fixação em alvenaria antes do reboco',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su103',
    code: 'SU-103',
    name: 'Arremate de Canto Linha Suprema',
    series: 'Suprema',
    category: 'Arremate',
    kgm: 0.410,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Acabamento entre contramarco e alvenaria',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'su187',
    code: 'SU-187',
    name: 'Montante Reforçado Mão de Amigo Suprema',
    series: 'Suprema',
    category: 'Montante',
    kgm: 0.680,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Reforço para portas até 2.40m de altura',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'mn001',
    code: 'MN-001',
    name: 'Marco Maxim-Ar com Pingadeira',
    series: 'Suprema',
    category: 'Marco',
    kgm: 0.510,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Furação para braço de articulação inox',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },
  {
    id: 'mn002',
    code: 'MN-002',
    name: 'Folha Móvel Maxim-Ar',
    series: 'Suprema',
    category: 'Folha',
    kgm: 0.480,
    defaultLength: 6000,
    pricePerKg: 35.80,
    machiningNote: 'Furação do fecho alavanca de sobrepor',
    sourceCatalog: 'SUPREMA_ea969330.pdf'
  },

  // ==========================================
  // LINHA 25 & PRESIDENTE / TEMPERADO
  // ==========================================
  {
    id: 'p25_677',
    code: '25-677',
    name: 'Perfil T com Escova Linha 25',
    series: 'Linha 25',
    category: 'Montante',
    kgm: 0.620,
    defaultLength: 6000,
    pricePerKg: 34.00,
    machiningNote: 'Vedação central para folhas de correr da Linha 25',
    sourceCatalog: 'CAT_LOGO_PRESIDENTE_0d0f6150.pdf'
  },
  {
    id: 'pcm_008',
    code: 'CM-008',
    name: 'Perfil T sem Escova Linha 25',
    series: 'Linha 25',
    category: 'Travessa',
    kgm: 0.580,
    defaultLength: 6000,
    pricePerKg: 34.00,
    machiningNote: 'Divisória de vidro em portas e janelas convencionais',
    sourceCatalog: 'CAT_LOGO_PRESIDENTE_0d0f6150.pdf'
  },
  {
    id: 'l2501',
    code: 'L25-01',
    name: 'Batente Porta de Giro 25',
    series: 'Linha 25',
    category: 'Marco',
    kgm: 0.590,
    defaultLength: 6000,
    pricePerKg: 34.00,
    machiningNote: 'Usinagem de contra-testa para fechadura',
    sourceCatalog: 'Cat_logo_2025_-_Miranda_Alum_nios_V4__1_-1_e28e5fdf.pdf'
  },
  {
    id: 'l2502',
    code: 'L25-02',
    name: 'Montante / Travessa da Folha de Giro 25',
    series: 'Linha 25',
    category: 'Folha',
    kgm: 0.820,
    defaultLength: 6000,
    pricePerKg: 34.00,
    machiningNote: 'Usinagem para fechadura rolete e dobradiças',
    sourceCatalog: 'Cat_logo_2025_-_Miranda_Alum_nios_V4__1_-1_e28e5fdf.pdf'
  },
  {
    id: 'bx209',
    code: 'BX-209',
    name: 'Perfil Cadeirinha 10mm com Duas Escovas',
    series: 'Universal',
    category: 'Comercial',
    kgm: 0.440,
    defaultLength: 6000,
    pricePerKg: 36.00,
    machiningNote: 'Encaixe de vidro temperado 10mm com escovas duplas',
    sourceCatalog: 'CAT_LOGO_PRESIDENTE_0d0f6150.pdf'
  },
  {
    id: 'cb266',
    code: 'CB-266',
    name: 'Perfil Cadeirinha 8mm com Duas Escovas',
    series: 'Universal',
    category: 'Comercial',
    kgm: 0.390,
    defaultLength: 6000,
    pricePerKg: 36.00,
    machiningNote: 'Encaixe de vidro temperado 8mm com escovas',
    sourceCatalog: 'CAT_LOGO_PRESIDENTE_0d0f6150.pdf'
  },

  // ==========================================
  // PERFIS COMERCIAIS & ESTRUTURAIS
  // ==========================================
  {
    id: 'tub_5025',
    code: 'TB-5025',
    name: 'Tubo Retangular 50 x 25 mm',
    series: 'Universal',
    category: 'Comercial',
    kgm: 0.585,
    defaultLength: 6000,
    pricePerKg: 33.50,
    machiningNote: 'Estruturação de portões, grades e reforços',
    sourceCatalog: 'CAT_LOGO_-_PERFIS_72b6f9d2.pdf'
  },
  {
    id: 'tub_5050',
    code: 'TB-5050',
    name: 'Tubo Quadrado 50 x 50 mm',
    series: 'Universal',
    category: 'Comercial',
    kgm: 0.820,
    defaultLength: 6000,
    pricePerKg: 33.50,
    machiningNote: 'Colunas de fixação e portais',
    sourceCatalog: 'CAT_LOGO_-_PERFIS_72b6f9d2.pdf'
  },
  {
    id: 'cant_1x1',
    code: 'CT-2525',
    name: 'Cantoneira Abas Iguais 25 x 25 x 1.5 mm',
    series: 'Universal',
    category: 'Comercial',
    kgm: 0.198,
    defaultLength: 6000,
    pricePerKg: 33.00,
    machiningNote: 'Esquadretas de ancoragem e acabamentos de canto',
    sourceCatalog: 'CAT_LOGO_-_PERFIS_72b6f9d2.pdf'
  }
];

/**
 * BANCO MESTRE DE COMPONENTES E FERRAGENS DOS CATÁLOGOS
 */
export const MASTER_CATALOG_ACCESSORIES: AccessoryDefinition[] = [
  // Ferragens Sistema Chroma
  { id: 'rol_chr468', code: 'ROL-468', name: 'Roldana Rolamento Blindado Chroma (40kg/folha)', unit: 'un', price: 16.50, category: 'Roldana', minStock: 30, sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf' },
  { id: 'rol_chrc011', code: 'CHRC-011', name: 'Roldana Strong Dupla Chroma (120kg/folha)', unit: 'un', price: 42.00, category: 'Roldana', minStock: 20, sourceCatalog: 'Catalogo_Tecnico_Chroma_e_Club_Chroma_Ed_10_Abril_2024_10_03bd9418.pdf' },
  { id: 'fec_chr7411', code: 'FEC-7411', name: 'Fecho Concha Automático Chroma 7411', unit: 'un', price: 32.00, category: 'Fecho', minStock: 25, sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf' },
  { id: 'cfec_chr389', code: 'CFEC-389', name: 'Contra Fecho Lateral Inox Chroma', unit: 'un', price: 14.50, category: 'Fecho', minStock: 25, sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf' },
  { id: 'cfec_chr390', code: 'CFEC-390', name: 'Contra Fecho Leve Toque Chroma', unit: 'un', price: 18.00, category: 'Fecho', minStock: 20, sourceCatalog: 'Catalogo_Tecnico_Chroma_e_Club_Chroma_Ed_10_Abril_2024_10_03bd9418.pdf' },
  { id: 'gua_chr516', code: 'GUA-516', name: 'Guarnição Mão de Amigo EPDM Chroma', unit: 'm', price: 4.20, category: 'Guarnição', minStock: 100, sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf' },
  { id: 'gua_chr115', code: 'GUA-115', name: 'Guarnição Batente Mata Junta Chroma', unit: 'm', price: 3.80, category: 'Guarnição', minStock: 100, sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf' },
  { id: 'chrc_004', code: 'CHRC-004', name: 'Trava e Contra Fecho da Folha Fixa Chroma', unit: 'un', price: 12.00, category: 'Fecho', minStock: 30, sourceCatalog: 'Apostila_Curso_Sistema_Chroma_2025_f096370f.pdf' },

  // Ferragens Linha Gold & IV Gold
  { id: 'rol_gld_tandem', code: 'ROL-GLD-TANDEM', name: 'Roldana Dupla Blindada Tandem Gold (200kg)', unit: 'un', price: 54.00, category: 'Roldana', minStock: 16, sourceCatalog: 'catalogo_ivgold-r06_c66435a5.pdf' },
  { id: 'fec_gld_1064', code: 'FEC-1064', name: 'Fecho Concha Gold com Lingueta TRA-064', unit: 'un', price: 48.00, category: 'Fecho', minStock: 15, sourceCatalog: 'catalogo_ivgold-r06_c66435a5.pdf' },
  { id: 'fec_gld_oculto', code: 'FEC-GLD-OCULTO', name: 'Fecho Oculto p/ Transpasse de Folha Gold', unit: 'un', price: 39.00, category: 'Fecho', minStock: 10, sourceCatalog: 'catalogo_gold__1__8c3c4c71.pdf' },
  { id: 'fch_gld_bico', code: 'FCH-GLD', name: 'Fechadura Bico de Papagaio Porta de Correr Gold', unit: 'un', price: 110.00, category: 'Fechadura', minStock: 8, sourceCatalog: 'catalogo_gold__1__8c3c4c71.pdf' },

  // Ferragens Linha Suprema
  { id: 'rol_sup_blin', code: 'ROL-SUP', name: 'Roldana Rolamento Blindado c/ Regulagem Suprema', unit: 'un', price: 12.50, category: 'Roldana', minStock: 40, sourceCatalog: 'SUPREMA_ea969330.pdf' },
  { id: 'bra_702', code: 'BRA-702', name: 'Braço Articulado Inox 304 300mm Maxim-Ar', unit: 'par', price: 42.00, category: 'Braço', minStock: 12, sourceCatalog: 'SUPREMA_ea969330.pdf' },
  { id: 'bra_725', code: 'BRA-725', name: 'Braço Reforçado Inox 600mm Maxim-Ar Pesado', unit: 'par', price: 78.00, category: 'Braço', minStock: 8, sourceCatalog: 'SUPREMA_ea969330.pdf' },
  { id: 'fec_009', code: 'FEC-009', name: 'Fecho Alavanca Maxim-Ar c/ Trinco Suprema', unit: 'un', price: 22.00, category: 'Fecho', minStock: 15, sourceCatalog: 'SUPREMA_ea969330.pdf' },
  { id: 'con_370', code: 'CON-370', name: 'Contrafecho em Zamak Linha Suprema', unit: 'un', price: 9.50, category: 'Fecho', minStock: 30, sourceCatalog: 'SUPREMA_ea969330.pdf' },
  { id: 'dob_837', code: 'DOB-837', name: 'Dobradiça Reforçada Suprema c/ Pino Inox', unit: 'kit', price: 46.00, category: 'Outros', minStock: 12, sourceCatalog: 'SUPREMA_ea969330.pdf' },

  // Puxadores Inox e Ferragens Especiais (Catálogo Acessórios & Presidente)
  { id: 'pux_chata_60', code: 'PUX-CHATA-60', name: 'Puxador Barra Chata Inox 304 Escovado 60cm', unit: 'par', price: 145.00, category: 'Puxador', minStock: 6, sourceCatalog: 'CAT_LOGO_-_ACESS_RIOS_b3979971.pdf' },
  { id: 'pux_s_3045', code: 'PUX-S-3045', name: 'Puxador Formato S 30 x 45 cm Inox 304', unit: 'par', price: 168.00, category: 'Puxador', minStock: 4, sourceCatalog: 'CAT_LOGO_-_ACESS_RIOS_b3979971.pdf' },
  { id: 'pux_tubular_40', code: 'PUX-TUB-40', name: 'Puxador Arco Tubular Inox 40cm', unit: 'par', price: 89.00, category: 'Puxador', minStock: 8, sourceCatalog: 'CAT_LOGO_-_ACESS_RIOS_b3979971.pdf' },
  { id: 'esc_5x5', code: 'ESC-5X5', name: 'Escova de Vedação com Barreira 5x5mm', unit: 'm', price: 2.10, category: 'Vedação', minStock: 150, sourceCatalog: 'CAT_LOGO_PRESIDENTE_0d0f6150.pdf' },
  { id: 'esc_7x6', code: 'ESC-7X6', name: 'Escova de Vedação com Barreira 7x6mm', unit: 'm', price: 2.60, category: 'Vedação', minStock: 150, sourceCatalog: 'CAT_LOGO_PRESIDENTE_0d0f6150.pdf' },
  { id: 'bor_epd_vidro', code: 'BOR-EPD', name: 'Borracha EPDM Gaxeta de Vedação Vidro', unit: 'm', price: 3.40, category: 'Vedação', minStock: 200, sourceCatalog: 'SUPREMA_ea969330.pdf' },
  { id: 'kit_cant_paraf', code: 'KIT-PAR', name: 'Kit Cantoneiras de Travamento + Parafusos Inox', unit: 'kit', price: 19.50, category: 'Parafusos', minStock: 30, sourceCatalog: 'SUPREMA_ea969330.pdf' }
];
