import { OrderItem } from '../types';
import { getEffectiveCompanyProfile } from './companyProfile';

export interface ShowcaseProduct {
  id: string;
  name: string;
  category: 'portas_pivotantes' | 'janelas_correr' | 'integradas_motorizadas' | 'guarda_corpos' | 'minimalistas' | 'brises_fachadas';
  categoryLabel: string;
  series: string;
  tagline: string;
  description: string;
  imageUrl: string;
  defaultWidthMm: number;
  defaultHeightMm: number;
  estimatedPriceRange: { min: number; max: number };
  specifications: string[];
  recommendedGlass: string;
  highlights: string[];
}

export interface WishlistItem {
  productId: string;
  productName: string;
  series: string;
  categoryLabel: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  color: string;
  glassType: string;
  customNotes?: string;
  estimatedUnitPrice: number;
}

export const SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  {
    id: 'sc_porta_piv_acm',
    name: 'Porta Pivotante em ACM & Lambri Ripado',
    category: 'portas_pivotantes',
    categoryLabel: 'Portas de Entrada',
    series: 'Linha Premium ACM',
    tagline: 'Imponência moderna com pivô de alta carga e fechadura digital',
    description: 'Porta de entrada residencial de grandes dimensões. Estrutura tubular reforçada com revestimento em ACM (Alumínio Composto) termoacústico e puxador de inox usinado.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    defaultWidthMm: 1400,
    defaultHeightMm: 2800,
    estimatedPriceRange: { min: 4800, max: 7900 },
    specifications: [
      'Pivô de rolamento blindado suporta até 300 kg',
      'Painel em ACM 4mm com núcleo mineral',
      'Puxador barra chata em Inox 304 de 1.80m',
      'Vedação inferior automática guilhotina embutida',
    ],
    recommendedGlass: 'Opção com visor vertical em Vidro Laminado Refletivo 8mm',
    highlights: ['Fechadura Biométrica Compatível', 'Isolamento Acústico 34dB', 'Zero Manutenção'],
  },
  {
    id: 'sc_janela_integrada_mot',
    name: 'Janela de Correr c/ Persiana Integrada Motorizada',
    category: 'integradas_motorizadas',
    categoryLabel: 'Persianas Integradas',
    series: 'Linha Gold / Suprema Integrada',
    tagline: 'Blackout 100% no quarto com controle remoto e motor tubular silencioso',
    description: 'A solução definitiva para dormitórios e home theaters. As palhetas de alumínio injetadas com poliuretano expandido enrolam na caixa superior com acionamento elétrico.',
    imageUrl: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=800&q=80',
    defaultWidthMm: 1500,
    defaultHeightMm: 1400,
    estimatedPriceRange: { min: 2600, max: 3800 },
    specifications: [
      'Motor tubular 110V/220V com controle remoto e botão pulsador',
      'Palhetas de alumínio preenchidas com espuma de poliuretano',
      'Caixa de recolhimento monobloco compacta com isolamento térmico',
      'Compatível com automação residencial (Alexa / Google Home)',
    ],
    recommendedGlass: 'Vidro Temperado ou Laminado 6mm',
    highlights: ['Blackout Total', 'Proteção Térmica e Acústica', 'Acionamento Automático'],
  },
  {
    id: 'sc_porta_minimalista_chroma',
    name: 'Porta de Correr Minimalista Vistas Ultrafinas (Chroma)',
    category: 'minimalistas',
    categoryLabel: 'Linha Minimalista',
    series: 'Linha Chroma Minimal',
    tagline: 'Perfis de apenas 20mm no centro para integração máxima entre interior e exterior',
    description: 'Projetada para residências de alto padrão que priorizam a luz natural e a vista panorâmica. Trilho embutido nivelado ao piso sem ressaltos.',
    imageUrl: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=800&q=80',
    defaultWidthMm: 3600,
    defaultHeightMm: 2600,
    estimatedPriceRange: { min: 8500, max: 14800 },
    specifications: [
      'Montante central ultra-esbelto de apenas 20mm de vista frontal',
      'Trilho inferior oculto no porcelanato (Zero desnível de piso)',
      'Roldanas com rolamentos de aço inox de deslizamento suave com um dedo',
      'Suporta painéis de vidro de até 400kg por folha',
    ],
    recommendedGlass: 'Vidro Laminado Temperado 10mm ou Vidro Duplo Insulado',
    highlights: ['Visual 100% Panorâmico', 'Trilho Oculto no Piso', 'Design Europeu'],
  },
  {
    id: 'sc_guarda_corpo_infinito',
    name: 'Guarda-Corpo Panorâmico em Vidro com Perfil Base Oculto',
    category: 'guarda_corpos',
    categoryLabel: 'Guarda-Corpos & Sacadas',
    series: 'Sistema Torre / Perfil U Embutido',
    tagline: 'Transparência total sem colunas verticais conforme ABNT NBR 14718',
    description: 'Guarda-corpo estrutural autoportante para varandas, mezaninos e escadas. O vidro laminado temperado é engastado diretamente em perfil contínuo de alta inércia.',
    imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=800&q=80',
    defaultWidthMm: 4000,
    defaultHeightMm: 1100,
    estimatedPriceRange: { min: 3200, max: 5900 },
    specifications: [
      'Perfil U de ancoragem estrutural com calços de pressão e drenagem',
      'Vidro Laminado Temperado 8+8mm ou 10+10mm com PVB Structural',
      'Ensaio de impacto de corpo mole e carga estática aprovado (NBR 14718)',
      'Corrimão superior tipo capa slim em alumínio ou fita de borda',
    ],
    recommendedGlass: 'Vidro Laminado Temperado 8+8mm (16.76mm)',
    highlights: ['Vista 100% Livre', 'Segurança Estrutural ABNT', 'Sem Colunas Verticais'],
  },
  {
    id: 'sc_janela_correr_suprema',
    name: 'Janela de Correr 2 Folhas Linha Suprema',
    category: 'janelas_correr',
    categoryLabel: 'Janelas de Correr',
    series: 'Linha Suprema',
    tagline: 'O melhor custo-benefício do mercado com vedação dupla e roldanas de nylon',
    description: 'A linha mais consolidada da arquitetura brasileira. Excelente estanqueidade ao vento e chuva, fecho concha suave e montagem precisa.',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80',
    defaultWidthMm: 1500,
    defaultHeightMm: 1200,
    estimatedPriceRange: { min: 1450, max: 1980 },
    specifications: [
      'Perfis de liga 6060 T5 de alta durabilidade',
      'Escovas de vedação de polipropileno com barreira central de silicone (Fin-Seal)',
      'Fecho concha automático embutido com gatilho de toque suave',
      'Drenos de água inferiores com válvula contra retorno de vento',
    ],
    recommendedGlass: 'Vidro Temperado 6mm Incolor ou Verde',
    highlights: ['Custo-Benefício Campeão', 'Fácil Manutenção', 'Vedação Dupla'],
  },
  {
    id: 'sc_brise_ripado_fachada',
    name: 'Brise de Alumínio Ripado & Fachada Ventilada',
    category: 'brises_fachadas',
    categoryLabel: 'Brises & Fachadas',
    series: 'Linha Brise Tubular / Asa de Avião',
    tagline: 'Conforto térmico, proteção solar e arquitetura escultural na fachada',
    description: 'Tubos retangulares ou perfis asa de avião instalados na fachada para sombreamento de janelas e proteção contra insolação direta nas horas de pico.',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    defaultWidthMm: 3000,
    defaultHeightMm: 2400,
    estimatedPriceRange: { min: 4200, max: 8100 },
    specifications: [
      'Tubos de alumínio 50x25mm ou 100x50mm com pintura efeito madeira sublimada',
      'Redução de até 60% da carga térmica solar sobre a alvenaria e vidros',
      'Fixação invisível por engate rápido em subestrutura oculta',
      'Resistente a maresia, sol e chuva sem empenar nem descascar',
    ],
    recommendedGlass: 'Não aplicável (estrutural vazado)',
    highlights: ['Economia de Ar Condicionado', 'Pintura Amadeirada Eterna', 'Valorização da Fachada'],
  },
];

/**
 * Gera mensagem formatada para WhatsApp contendo a Lista de Desejos do Cliente
 */
export function generateWishlistWhatsAppQuote(
  wishlist: WishlistItem[],
  clientName = 'Cliente',
  clientPhone = '',
  obraAddress = ''
): string {
  const company = getEffectiveCompanyProfile();
  const dateStr = new Date().toLocaleDateString('pt-BR');

  const totalEstimated = wishlist.reduce(
    (acc, it) => acc + (it.estimatedUnitPrice * it.quantity),
    0
  );

  let text = `🌟 *LISTA DE DESEJOS - ESQUADRIAS & VIDROS*\n`;
  text += `🏭 *${company.name}*\n`;
  text += `👤 *Cliente:* ${clientName}\n`;
  if (clientPhone) text += `📞 *Contato:* ${clientPhone}\n`;
  if (obraAddress) text += `📍 *Obra:* ${obraAddress}\n`;
  text += `📅 *Data:* ${dateStr}\n`;
  text += `───────────────────────\n`;
  text += `📋 *ITENS SELECIONADOS NA VITRINE (${wishlist.length} modelo(s)) :*\n\n`;

  wishlist.forEach((item, idx) => {
    const subtotal = item.estimatedUnitPrice * item.quantity;
    text += `${idx + 1}. *${item.productName}*\n`;
    text += `   • Linha: ${item.series}\n`;
    text += `   • Medidas: ${item.widthMm} × ${item.heightMm} mm (Qtd: ${item.quantity})\n`;
    text += `   • Acabamento: ${item.color} | Vidro: ${item.glassType}\n`;
    if (item.customNotes) text += `   • Obs: "${item.customNotes}"\n`;
    text += `   • Estimativa: ~R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
  });

  text += `───────────────────────\n`;
  text += `💰 *VALOR ESTIMADO TOTAL:* R$ ${totalEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  text += `*(Valores preliminares sujeitos a confirmação de medidas na vistoria técnica)*\n\n`;
  text += `Olá! Gostaria de receber uma proposta detalhada para a fabricação e instalação destes itens da minha lista de desejos.`;

  return text;
}
