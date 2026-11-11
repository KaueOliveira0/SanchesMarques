import { ColorFinish } from '../types';
import { getEffectiveCompanyProfile } from './companyProfile';

export interface WallSamplePhoto {
  id: string;
  title: string;
  category: 'alvenaria_obra' | 'sala_estar' | 'varanda_gourmet' | 'fachada_moderna';
  url: string;
  defaultOpening: {
    xPct: number;
    yPct: number;
    widthPct: number;
    heightPct: number;
  };
}

export const WALL_SAMPLE_PHOTOS: WallSamplePhoto[] = [
  {
    id: 'wall_alvenaria_1',
    title: 'Vão Bruto em Alvenaria (Obra)',
    category: 'alvenaria_obra',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80',
    defaultOpening: { xPct: 28, yPct: 22, widthPct: 44, heightPct: 56 },
  },
  {
    id: 'wall_sala_moderna',
    title: 'Sala de Estar Contemporânea',
    category: 'sala_estar',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    defaultOpening: { xPct: 20, yPct: 15, widthPct: 60, heightPct: 65 },
  },
  {
    id: 'wall_varanda_gourmet',
    title: 'Varanda Gourmet Integrada',
    category: 'varanda_gourmet',
    url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
    defaultOpening: { xPct: 15, yPct: 10, widthPct: 70, heightPct: 78 },
  },
  {
    id: 'wall_fachada_sobrado',
    title: 'Fachada Sobrado Alto Padrão',
    category: 'fachada_moderna',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    defaultOpening: { xPct: 35, yPct: 25, widthPct: 38, heightPct: 52 },
  },
];

export interface VisualSimulationState {
  photoUrl: string;
  isCustomPhoto: boolean;
  typologyId: string;
  typologyName: string;
  series: string;
  aluminumColor: ColorFinish;
  glassTint: 'incolor' | 'verde' | 'fume' | 'refletivo_champagne' | 'refletivo_azul';
  positionX: number; // Porcentagem (0 - 100)
  positionY: number; // Porcentagem (0 - 100)
  scaleWidth: number; // Porcentagem (10 - 90)
  scaleHeight: number; // Porcentagem (10 - 90)
  opacity: number; // (0.5 - 1.0)
  shadowIntensity: number; // (0 - 30px)
  showDividers: boolean;
  splitViewPosition: number; // (0 - 100) para o slider Antes vs Depois
}

export const DEFAULT_SIMULATION_STATE: VisualSimulationState = {
  photoUrl: WALL_SAMPLE_PHOTOS[0].url,
  isCustomPhoto: false,
  typologyId: 'typ_cor2_gold',
  typologyName: 'Porta de Correr 2 Folhas Móveis (Linha Gold)',
  series: 'Linha Gold',
  aluminumColor: 'Preto',
  glassTint: 'incolor',
  positionX: 28,
  positionY: 22,
  scaleWidth: 44,
  scaleHeight: 56,
  opacity: 0.98,
  shadowIntensity: 18,
  showDividers: true,
  splitViewPosition: 50,
};

export const GLASS_TINT_STYLES: Record<
  VisualSimulationState['glassTint'],
  { name: string; bgClass: string; borderColor: string; lightTransmission: string }
> = {
  incolor: {
    name: 'Vidro Incolor 6mm',
    bgClass: 'bg-cyan-500/15',
    borderColor: 'border-cyan-300/40',
    lightTransmission: '88% luz natural',
  },
  verde: {
    name: 'Vidro Verde 6mm (Aconchego)',
    bgClass: 'bg-emerald-600/25',
    borderColor: 'border-emerald-400/50',
    lightTransmission: '72% luz natural',
  },
  fume: {
    name: 'Vidro Fumê 6mm (Privacidade)',
    bgClass: 'bg-slate-900/50',
    borderColor: 'border-slate-600/60',
    lightTransmission: '45% luz natural',
  },
  refletivo_champagne: {
    name: 'Refletivo Habitat Champanhe',
    bgClass: 'bg-amber-600/30 backdrop-blur-[1px]',
    borderColor: 'border-amber-300/60',
    lightTransmission: 'Bloqueio térmico 68%',
  },
  refletivo_azul: {
    name: 'Refletivo Habitat Azul Royal',
    bgClass: 'bg-blue-600/30 backdrop-blur-[1px]',
    borderColor: 'border-blue-300/60',
    lightTransmission: 'Bloqueio térmico 71%',
  },
};

export const ALUMINUM_COLOR_PALETTE: Record<
  ColorFinish,
  { name: string; hex: string; borderHex: string }
> = {
  Preto: { name: 'Preto Fosco Microtexturizado', hex: '#18181b', borderHex: '#3f3f46' },
  Branco: { name: 'Branco Neve Eletrostático', hex: '#f8fafc', borderHex: '#cbd5e1' },
  Bronze: { name: 'Bronze 1003 Acetinado', hex: '#453229', borderHex: '#785340' },
  Natural: { name: 'Alumínio Natural Anodizado', hex: '#94a3b8', borderHex: '#cbd5e1' },
  Amadeirado: { name: 'Amadeirado Sublimado Nogueira', hex: '#5c3822', borderHex: '#8b5a36' },
};

export function generateSimulationWhatsAppMessage(
  sim: VisualSimulationState,
  clientName = 'Cliente',
  orderNumber?: number | string
): string {
  const company = getEffectiveCompanyProfile();
  const opLabel = orderNumber ? `• OP #${orderNumber}` : '';
  const glass = GLASS_TINT_STYLES[sim.glassTint];
  const color = ALUMINUM_COLOR_PALETTE[sim.aluminumColor];

  let text = `📸 *SIMULAÇÃO VISUAL DE ESQUADRIA (ANTES & DEPOIS)*\n`;
  text += `🏭 *${company.name}* ${opLabel}\n`;
  text += `👤 *Cliente:* ${clientName}\n`;
  text += `───────────────────────\n`;
  text += `✨ *Modelo:* ${sim.typologyName}\n`;
  text += `🎨 *Acabamento do Alumínio:* ${color.name}\n`;
  text += `🪟 *Vidro:* ${glass.name} (${glass.lightTransmission})\n`;
  text += `📐 *Linha Técnica:* ${sim.series}\n`;
  text += `───────────────────────\n`;
  text += `💡 *Visualização em Escala Real:* A esquadria foi posicionada sobre o vão do seu ambiente para antecipar o resultado estético e luminosidade.\n\n`;
  text += `Deseja aprovar esta configuração ou testar outra cor de perfil/vidro?`;

  return text;
}
