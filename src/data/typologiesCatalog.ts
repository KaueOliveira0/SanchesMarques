import { TypologyItem } from '../types';

export const TYPOLOGIES_CATALOG: TypologyItem[] = [
  // 1. Janela de Correr 2 Folhas (Suprema 25mm)
  {
    id: 'typ_cor2_sup',
    code: 'J-COR-2F-SUP',
    name: 'Janela de Correr 2 Folhas Móveis (Suprema)',
    series: 'Suprema',
    category: 'Janela de Correr',
    description: 'Janela de correr com duas folhas móveis sobre marco de 2 planos, Linha Suprema 25mm. Padrão ABNT NBR 10821 com alta estanqueidade.',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Temperado 6mm Incolor / Verde',
      waterTightness: '450 Pa (Estanqueidade classe E4)',
      windLoadClass: 'C3 (Resistência a pressões até 1400 Pa)',
      acousticReduction: '29 dB Rw (Atenuação acústica padrão)',
      leafCount: 2,
      defaultWidthMm: 1500,
      defaultHeightMm: 1200,
    },
    previewSvg: `<svg viewBox="0 0 100 80" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="5" y="5" width="90" height="70" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="9" y="9" width="43" height="62" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.18"/>
      <rect x="48" y="9" width="43" height="62" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.18"/>
      <line x1="28" y1="36" x2="28" y2="44" stroke="#e2e8f0" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="72" y1="36" x2="72" y2="44" stroke="#e2e8f0" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M22 40 L18 40 M20 38 L18 40 L20 42" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M78 40 L82 40 M80 38 L82 40 L80 42" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_su_001',
          profileCode: 'SU-001',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Marco Superior 2 Planos',
        },
        {
          profileId: 'prof_su_002',
          profileCode: 'SU-002',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Trilho Inferior c/ Aba de Drenagem',
        },
        {
          profileId: 'prof_su_003',
          profileCode: 'SU-003',
          formula: (_w, h) => h - 35,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Marco Lateral 2 Planos',
        },
        {
          profileId: 'prof_su_053',
          profileCode: 'SU-053',
          formula: (_w, h) => h - 70,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Montante Folha Lateral Fecho Concha',
        },
        {
          profileId: 'prof_su_054',
          profileCode: 'SU-054',
          formula: (_w, h) => h - 70,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Montante Central Mão de Amigo Interlock',
        },
        {
          profileId: 'prof_su_068',
          profileCode: 'SU-068',
          formula: (w) => Math.round((w + 26) / 2) - 52,
          angleLeft: 90,
          angleRight: 90,
          quantity: 4,
          description: 'Travessa Superior/Inferior Folha',
        },
        {
          profileId: 'prof_su_102',
          profileCode: 'SU-102',
          formula: (w) => Math.round((w + 26) / 2) - 95,
          angleLeft: 90,
          angleRight: 90,
          quantity: 4,
          description: 'Baguete Horizontal',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round((w + 26) / 2) - 95,
          formulaH: (_w, h) => h - 145,
          quantity: 2,
          description: 'Vidro Folha Móvel (6mm)',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_rol_sup',
          formulaQuantity: () => 2,
        },
        {
          accessoryId: 'acc_fecho_sup',
          formulaQuantity: () => 2,
        },
        {
          accessoryId: 'acc_escova_vedacao',
          formulaQuantity: (w, h, qty) => Math.round(((w * 2 + h * 4) / 1000) * qty),
        },
        {
          accessoryId: 'acc_guarnicao_epdm',
          formulaQuantity: (w, h, qty) => Math.round(((w * 2 + h * 4) / 1000) * qty),
        },
      ],
    },
  },

  // 2. Janela de Correr 3 Folhas em 3 Trilhos (Suprema 25mm - Abertura 2/3)
  {
    id: 'typ_cor3_sup',
    code: 'J-COR-3F-SUP',
    name: 'Janela de Correr 3 Folhas Móveis (3 Trilhos Suprema)',
    series: 'Suprema',
    category: 'Janela de Correr',
    description: 'Janela de 3 planos independentes que recolhem todas para um dos lados, proporcionando abertura livre de 66% do vão.',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Temperado 6mm ou Laminado 8mm',
      waterTightness: '450 Pa (Estanqueidade classe E4)',
      windLoadClass: 'C3 (Pressão de ensaio até 1400 Pa)',
      acousticReduction: '30 dB Rw',
      leafCount: 3,
      defaultWidthMm: 2100,
      defaultHeightMm: 1200,
    },
    previewSvg: `<svg viewBox="0 0 100 80" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="4" y="5" width="92" height="70" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="7" y="9" width="30" height="62" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.15"/>
      <rect x="35" y="9" width="30" height="62" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.2"/>
      <rect x="63" y="9" width="30" height="62" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.25"/>
      <line x1="22" y1="36" x2="22" y2="44" stroke="#e2e8f0" stroke-width="2"/>
      <line x1="50" y1="36" x2="50" y2="44" stroke="#e2e8f0" stroke-width="2"/>
      <line x1="78" y1="36" x2="78" y2="44" stroke="#e2e8f0" stroke-width="2"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_su_001',
          profileCode: 'SU-001',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Marco Superior 3 Planos',
        },
        {
          profileId: 'prof_su_002',
          profileCode: 'SU-002',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Trilho Inferior 3 Planos',
        },
        {
          profileId: 'prof_su_003',
          profileCode: 'SU-003',
          formula: (_w, h) => h - 35,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Marco Lateral 3 Planos',
        },
        {
          profileId: 'prof_su_053',
          profileCode: 'SU-053',
          formula: (_w, h) => h - 70,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Montante Folha Lateral Fecho',
        },
        {
          profileId: 'prof_su_054',
          profileCode: 'SU-054',
          formula: (_w, h) => h - 70,
          angleLeft: 90,
          angleRight: 90,
          quantity: 4,
          description: 'Montante Central Mão de Amigo Interlock',
        },
        {
          profileId: 'prof_su_068',
          profileCode: 'SU-068',
          formula: (w) => Math.round((w + 52) / 3) - 52,
          angleLeft: 90,
          angleRight: 90,
          quantity: 6,
          description: 'Travessa Superior/Inferior Folhas',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round((w + 52) / 3) - 95,
          formulaH: (_w, h) => h - 145,
          quantity: 3,
          description: 'Vidro Folhas Móveis (3 un)',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_rol_sup',
          formulaQuantity: () => 3,
        },
        {
          accessoryId: 'acc_fecho_sup',
          formulaQuantity: () => 1,
        },
      ],
    },
  },

  // 3. Janela de Correr 4 Folhas (2 Fixas + 2 Móveis - Suprema)
  {
    id: 'typ_cor4_sup',
    code: 'J-COR-4F-SUP',
    name: 'Janela de Correr 4 Folhas (2 Fixas + 2 Móveis)',
    series: 'Suprema',
    category: 'Janela de Correr',
    description: 'Janela de correr com duas folhas centrais móveis e duas laterais fixas. Linha Suprema 25mm.',
    imageUrl: 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ba98f?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Temperado 6mm Incolor',
      waterTightness: '500 Pa (Estanqueidade classe E4)',
      windLoadClass: 'C3 (Até 1400 Pa)',
      acousticReduction: '31 dB Rw',
      leafCount: 4,
      defaultWidthMm: 2400,
      defaultHeightMm: 1200,
    },
    previewSvg: `<svg viewBox="0 0 100 80" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="5" y="5" width="90" height="70" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="8" y="9" width="21" height="62" stroke="#64748b" fill="#0284c7" fill-opacity="0.1"/>
      <rect x="29" y="9" width="21" height="62" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.2"/>
      <rect x="50" y="9" width="21" height="62" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.2"/>
      <rect x="71" y="9" width="21" height="62" stroke="#64748b" fill="#0284c7" fill-opacity="0.1"/>
      <line x1="39" y1="36" x2="39" y2="44" stroke="#e2e8f0" stroke-width="2"/>
      <line x1="61" y1="36" x2="61" y2="44" stroke="#e2e8f0" stroke-width="2"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_su_001',
          profileCode: 'SU-001',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Marco Superior',
        },
        {
          profileId: 'prof_su_002',
          profileCode: 'SU-002',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Trilho Inferior',
        },
        {
          profileId: 'prof_su_003',
          profileCode: 'SU-003',
          formula: (_w, h) => h - 35,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Marco Lateral',
        },
        {
          profileId: 'prof_su_053',
          profileCode: 'SU-053',
          formula: (_w, h) => h - 70,
          angleLeft: 90,
          angleRight: 90,
          quantity: 4,
          description: 'Montante Folha Lateral Fecho',
        },
        {
          profileId: 'prof_su_054',
          profileCode: 'SU-054',
          formula: (_w, h) => h - 70,
          angleLeft: 90,
          angleRight: 90,
          quantity: 4,
          description: 'Montante Folha Central Mão de Amigo',
        },
        {
          profileId: 'prof_su_068',
          profileCode: 'SU-068',
          formula: (w) => Math.round((w + 52) / 4) - 52,
          angleLeft: 90,
          angleRight: 90,
          quantity: 8,
          description: 'Travessa Superior/Inferior Folha',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round((w + 52) / 4) - 95,
          formulaH: (_w, h) => h - 145,
          quantity: 4,
          description: 'Vidros Folhas (4 un)',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_rol_sup',
          formulaQuantity: () => 2,
        },
        {
          accessoryId: 'acc_fecho_sup',
          formulaQuantity: () => 1,
        },
        {
          accessoryId: 'acc_escova_vedacao',
          formulaQuantity: (w, h, qty) => Math.round(((w * 3 + h * 8) / 1000) * qty),
        },
      ],
    },
  },

  // 4. Janela Maxim-Ar com Braço Inox (Suprema)
  {
    id: 'typ_maximar_sup',
    code: 'J-MAX-1F-SUP',
    name: 'Janela Maxim-Ar com Braço Inox & Pingadeira (Suprema)',
    series: 'Suprema',
    category: 'Maxim-Ar',
    description: 'Janela maxim-ar com pingadeira externa e braço articulado em aço inox. Ideal para banheiros, lavabos e áreas de serviço.',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Mini-Boreal / Pontilhado ou Acidato 6mm',
      waterTightness: '600 Pa (Estanqueidade máxima sob chuva de vento)',
      windLoadClass: 'C4 (Pressão de ensaio até 1800 Pa)',
      acousticReduction: '28 dB Rw',
      leafCount: 1,
      defaultWidthMm: 800,
      defaultHeightMm: 600,
    },
    previewSvg: `<svg viewBox="0 0 100 80" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="15" y="10" width="70" height="60" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="22" y="17" width="56" height="46" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.2"/>
      <line x1="22" y1="17" x2="50" y2="40" stroke="#f59e0b" stroke-dasharray="2 2" stroke-width="1.5"/>
      <line x1="78" y1="17" x2="50" y2="40" stroke="#f59e0b" stroke-dasharray="2 2" stroke-width="1.5"/>
      <circle cx="50" cy="56" r="3" fill="#e2e8f0"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_mn_001',
          profileCode: 'MN-001',
          formula: (w) => w,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Marco Horizontal Maxim-ar',
        },
        {
          profileId: 'prof_mn_001',
          profileCode: 'MN-001',
          formula: (_w, h) => h,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Marco Vertical Maxim-ar',
        },
        {
          profileId: 'prof_mn_053',
          profileCode: 'MN-053',
          formula: (w) => w - 50,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Folha Móvel Horizontal',
        },
        {
          profileId: 'prof_mn_053',
          profileCode: 'MN-053',
          formula: (_w, h) => h - 50,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Folha Móvel Vertical',
        },
      ],
      glass: [
        {
          formulaW: (w) => w - 120,
          formulaH: (_w, h) => h - 120,
          quantity: 1,
          description: 'Vidro Folha Maxim-ar',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_braco_mn',
          formulaQuantity: () => 1,
        },
        {
          accessoryId: 'acc_fecho_mn',
          formulaQuantity: () => 1,
        },
      ],
    },
  },

  // 5. Janela com Persiana Integrada Motorizada (Suprema Integrada)
  {
    id: 'typ_integ_mot_sup',
    code: 'J-INT-MOT-SUP',
    name: 'Janela c/ Persiana Integrada Motorizada Blackout (Suprema)',
    series: 'Integrada',
    category: 'Integrada Persiana',
    description: 'Janela de correr acoplada à caixa monobloco com esteira rolô de alumínio e motor tubular com controle remoto. Blackout 100% no dormitório.',
    imageUrl: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Laminado Acústico 8mm ou Vidro Duplo Insulado',
      waterTightness: '500 Pa (Vedação tripla com escovas Fin-Seal)',
      windLoadClass: 'C4 (Alta inércia com guias laterais reforçadas)',
      acousticReduction: '34 dB Rw (Isolamento acústico superior)',
      leafCount: 2,
      defaultWidthMm: 1500,
      defaultHeightMm: 1400,
    },
    previewSvg: `<svg viewBox="0 0 100 90" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="8" y="5" width="84" height="80" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="12" y="9" width="76" height="22" stroke="#eab308" fill="#ca8a04" fill-opacity="0.3" rx="1"/>
      <line x1="14" y1="14" x2="86" y2="14" stroke="#fef08a" stroke-width="1.5"/>
      <line x1="14" y1="19" x2="86" y2="19" stroke="#fef08a" stroke-width="1.5"/>
      <line x1="14" y1="24" x2="86" y2="24" stroke="#fef08a" stroke-width="1.5"/>
      <rect x="12" y="34" width="36" height="47" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.18"/>
      <rect x="52" y="34" width="36" height="47" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.18"/>
      <line x1="30" y1="54" x2="30" y2="62" stroke="#e2e8f0" stroke-width="2"/>
      <line x1="70" y1="54" x2="70" y2="62" stroke="#e2e8f0" stroke-width="2"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_su_001',
          profileCode: 'SU-001',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Marco Superior com Caixa de Persiana',
        },
        {
          profileId: 'prof_su_002',
          profileCode: 'SU-002',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Trilho Inferior com Dreno Oculto',
        },
        {
          profileId: 'prof_su_003',
          profileCode: 'SU-003',
          formula: (_w, h) => h - 220,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Marco Lateral com Guia Dupla da Esteira',
        },
        {
          profileId: 'prof_su_053',
          profileCode: 'SU-053',
          formula: (_w, h) => h - 260,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Montante Folha Lateral Fecho',
        },
        {
          profileId: 'prof_su_054',
          profileCode: 'SU-054',
          formula: (_w, h) => h - 260,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Montante Central Mão de Amigo',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round((w + 26) / 2) - 95,
          formulaH: (_w, h) => h - 335,
          quantity: 2,
          description: 'Vidro Folhas Móveis (6mm ou Acústico)',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_rol_sup',
          formulaQuantity: () => 2,
        },
        {
          accessoryId: 'acc_fecho_sup',
          formulaQuantity: () => 2,
        },
      ],
    },
  },

  // 6. Janela Basculante com Alavanca e Varão (Linha 25)
  {
    id: 'typ_basc_l25',
    code: 'J-BAS-1F-L25',
    name: 'Janela Basculante com Alavanca & Varão (Linha 25)',
    series: 'Linha 25',
    category: 'Basculante',
    description: 'Janela com palhetas de vidro articuladas acionadas por alavanca mecânica em alumínio. Ventilação permanente com excelente custo-benefício.',
    imageUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Fantasia Mini-Boreal 4mm',
      waterTightness: '300 Pa (Resistente a respingos e chuvas leves)',
      windLoadClass: 'C2 (Pressões até 1000 Pa)',
      acousticReduction: '24 dB Rw',
      leafCount: 1,
      defaultWidthMm: 600,
      defaultHeightMm: 800,
    },
    previewSvg: `<svg viewBox="0 0 100 80" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="20" y="5" width="60" height="70" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="25" y="10" width="50" height="15" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.15"/>
      <rect x="25" y="28" width="50" height="15" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.15"/>
      <rect x="25" y="46" width="50" height="15" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.15"/>
      <line x1="72" y1="12" x2="72" y2="58" stroke="#f59e0b" stroke-width="2"/>
      <circle cx="72" cy="62" r="3" fill="#f59e0b"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_l25_001',
          profileCode: 'L25-001',
          formula: (w) => w,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Marco Horizontal Linha 25',
        },
        {
          profileId: 'prof_l25_001',
          profileCode: 'L25-001',
          formula: (_w, h) => h,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Marco Vertical Linha 25',
        },
      ],
      glass: [
        {
          formulaW: (w) => w - 50,
          formulaH: () => 140,
          quantity: 3,
          description: 'Palhetas de Vidro Mini-Boreal 4mm',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_fecho_sup',
          formulaQuantity: () => 1,
        },
      ],
    },
  },

  // 7. Quadro Fixo Panorâmico (Suprema 25mm)
  {
    id: 'typ_quadro_fixo_sup',
    code: 'Q-FIX-SUP',
    name: 'Quadro Fixo / Bandeira Superior Panorâmica (Suprema)',
    series: 'Suprema',
    category: 'Fixo / Bandeira',
    description: 'Vão fixo envidraçado de alta luminosidade para iluminação zenital, bandeiras sobre portas ou grandes panos de vidro arquitetônicos.',
    imageUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Laminado de Segurança 8mm ou Duplo Insulado',
      waterTightness: '900 Pa (Estanqueidade absoluta sem partes móveis)',
      windLoadClass: 'C5 (Resistência máxima até 2500 Pa)',
      acousticReduction: '36 dB Rw',
      leafCount: 1,
      defaultWidthMm: 1800,
      defaultHeightMm: 1000,
    },
    previewSvg: `<svg viewBox="0 0 100 80" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="8" y="8" width="84" height="64" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="14" y="14" width="72" height="52" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.12"/>
      <line x1="14" y1="14" x2="86" y2="66" stroke="#0284c7" stroke-dasharray="3 3" stroke-width="1"/>
      <line x1="86" y1="14" x2="14" y2="66" stroke="#0284c7" stroke-dasharray="3 3" stroke-width="1"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_su_001',
          profileCode: 'SU-001',
          formula: (w) => w,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Marco Horizontal Quadro Fixo',
        },
        {
          profileId: 'prof_su_001',
          profileCode: 'SU-001',
          formula: (_w, h) => h,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Marco Vertical Quadro Fixo',
        },
      ],
      glass: [
        {
          formulaW: (w) => w - 60,
          formulaH: (_w, h) => h - 60,
          quantity: 1,
          description: 'Vidro Panorâmico Único (8mm)',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_guarnicao_epdm',
          formulaQuantity: (w, h, qty) => Math.round(((w * 2 + h * 2) / 1000) * qty),
        },
      ],
    },
  },

  // 8. Porta de Correr 2 Folhas Móveis (Linha Gold 32mm)
  {
    id: 'typ_porta_cor2_gold',
    code: 'P-COR-2F-GLD',
    name: 'Porta de Correr 2 Folhas Móveis (Linha Gold 32mm)',
    series: 'Gold',
    category: 'Porta de Correr',
    description: 'Porta de correr de grandes dimensões com trilho embutido em aço inox, roldanas duplas com rolamentos blindados e alta inércia estrutural.',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Laminado 8mm ou Temperado 8mm/10mm',
      waterTightness: '500 Pa (Classe E4 com dreno de alta vazão)',
      windLoadClass: 'C4 (Pressão de ensaio até 1800 Pa)',
      acousticReduction: '33 dB Rw',
      leafCount: 2,
      defaultWidthMm: 2200,
      defaultHeightMm: 2400,
    },
    previewSvg: `<svg viewBox="0 0 100 90" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="10" y="5" width="80" height="80" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="14" y="9" width="38" height="72" stroke="#eab308" fill="#ca8a04" fill-opacity="0.18"/>
      <rect x="48" y="9" width="38" height="72" stroke="#eab308" fill="#ca8a04" fill-opacity="0.18"/>
      <rect x="44" y="38" width="4" height="18" fill="#fde047" rx="1.5"/>
      <line x1="28" y1="42" x2="28" y2="52" stroke="#fde047" stroke-width="2"/>
      <line x1="72" y1="42" x2="72" y2="52" stroke="#fde047" stroke-width="2"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_gl_001',
          profileCode: 'GL-001',
          formula: (w) => w,
          angleLeft: 45,
          angleRight: 45,
          quantity: 1,
          description: 'Marco Superior Gold 32mm',
        },
        {
          profileId: 'prof_gl_002',
          profileCode: 'GL-002',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Trilho Inferior Inox Embutido',
        },
        {
          profileId: 'prof_gl_003',
          profileCode: 'GL-003',
          formula: (_w, h) => h,
          angleLeft: 45,
          angleRight: 90,
          quantity: 2,
          description: 'Marco Lateral Gold',
        },
        {
          profileId: 'prof_gl_028',
          profileCode: 'GL-028',
          formula: (_w, h) => h - 82,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Montante Folha Lateral Fecho Multiponto',
        },
        {
          profileId: 'prof_gl_033',
          profileCode: 'GL-033',
          formula: (_w, h) => h - 82,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Montante Central Mão de Amigo Reforçado',
        },
        {
          profileId: 'prof_gl_038',
          profileCode: 'GL-038',
          formula: (w) => Math.round((w + 35) / 2) - 68,
          angleLeft: 90,
          angleRight: 90,
          quantity: 4,
          description: 'Travessa Superior/Inferior Folha Gold',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round((w + 35) / 2) - 115,
          formulaH: (_w, h) => h - 175,
          quantity: 2,
          description: 'Vidro Folha Gold (8mm ou Laminado)',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_rol_gold',
          formulaQuantity: () => 2,
        },
        {
          accessoryId: 'acc_fecho_gold',
          formulaQuantity: () => 1,
        },
      ],
    },
  },

  // 9. Porta de Correr 3 Folhas em 3 Trilhos (Linha Gold 32mm)
  {
    id: 'typ_porta_cor3_gold',
    code: 'P-COR-3F-GLD',
    name: 'Porta de Correr 3 Folhas em 3 Trilhos (Linha Gold 32mm)',
    series: 'Gold',
    category: 'Porta de Correr',
    description: 'Sistema de 3 folhas móveis correndo em 3 trilhos paralelos independentes. Permite recolher 66% das folhas para o canto, integrando salas e varandas.',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Laminado 8mm ou 10mm Acústico',
      waterTightness: '550 Pa (Estanqueidade avançada com trilho inox)',
      windLoadClass: 'C4 (Pressão de ensaio até 1800 Pa)',
      acousticReduction: '34 dB Rw',
      leafCount: 3,
      defaultWidthMm: 3300,
      defaultHeightMm: 2500,
    },
    previewSvg: `<svg viewBox="0 0 100 90" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="5" y="5" width="90" height="80" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="8" y="9" width="29" height="72" stroke="#eab308" fill="#ca8a04" fill-opacity="0.15"/>
      <rect x="35" y="9" width="29" height="72" stroke="#eab308" fill="#ca8a04" fill-opacity="0.2"/>
      <rect x="62" y="9" width="29" height="72" stroke="#eab308" fill="#ca8a04" fill-opacity="0.25"/>
      <rect x="31" y="38" width="4" height="16" fill="#fde047" rx="1"/>
      <rect x="58" y="38" width="4" height="16" fill="#fde047" rx="1"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_gl_001',
          profileCode: 'GL-001',
          formula: (w) => w,
          angleLeft: 45,
          angleRight: 45,
          quantity: 1,
          description: 'Marco Superior 3 Trilhos Gold',
        },
        {
          profileId: 'prof_gl_002',
          profileCode: 'GL-002',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Trilho Inferior Inox Triplo',
        },
        {
          profileId: 'prof_gl_003',
          profileCode: 'GL-003',
          formula: (_w, h) => h,
          angleLeft: 45,
          angleRight: 90,
          quantity: 2,
          description: 'Marco Lateral 3 Planos',
        },
        {
          profileId: 'prof_gl_028',
          profileCode: 'GL-028',
          formula: (_w, h) => h - 82,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Montante Folha Lateral Fecho',
        },
        {
          profileId: 'prof_gl_033',
          profileCode: 'GL-033',
          formula: (_w, h) => h - 82,
          angleLeft: 90,
          angleRight: 90,
          quantity: 4,
          description: 'Montante Central Mão de Amigo Reforçado',
        },
        {
          profileId: 'prof_gl_038',
          profileCode: 'GL-038',
          formula: (w) => Math.round((w + 70) / 3) - 68,
          angleLeft: 90,
          angleRight: 90,
          quantity: 6,
          description: 'Travessa Superior/Inferior Folhas',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round((w + 70) / 3) - 115,
          formulaH: (_w, h) => h - 175,
          quantity: 3,
          description: 'Vidro Folhas Gold (3 un)',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_rol_gold',
          formulaQuantity: () => 3,
        },
        {
          accessoryId: 'acc_fecho_gold',
          formulaQuantity: () => 2,
        },
      ],
    },
  },

  // 10. Porta de Correr 4 Folhas (2 Fixas + 2 Móveis - Linha Gold 32mm)
  {
    id: 'typ_porta_cor4_gold',
    code: 'P-COR-4F-GLD',
    name: 'Porta de Correr 4 Folhas Centrais Móveis (Linha Gold 32mm)',
    series: 'Gold',
    category: 'Porta de Correr',
    description: 'Porta monumental para grandes vãos sociais com abertura central bi-partida. As duas folhas centrais correm sobre as duas fixas laterais.',
    imageUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Laminado de Segurança 8mm ou 10mm',
      waterTightness: '550 Pa (Estanqueidade classe E4)',
      windLoadClass: 'C4 (Pressão de ensaio até 1800 Pa)',
      acousticReduction: '34 dB Rw',
      leafCount: 4,
      defaultWidthMm: 4000,
      defaultHeightMm: 2600,
    },
    previewSvg: `<svg viewBox="0 0 100 90" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="5" y="5" width="90" height="80" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="8" y="9" width="21" height="72" stroke="#ca8a04" fill="#ca8a04" fill-opacity="0.1"/>
      <rect x="29" y="9" width="21" height="72" stroke="#eab308" fill="#ca8a04" fill-opacity="0.22"/>
      <rect x="50" y="9" width="21" height="72" stroke="#eab308" fill="#ca8a04" fill-opacity="0.22"/>
      <rect x="71" y="9" width="21" height="72" stroke="#ca8a04" fill="#ca8a04" fill-opacity="0.1"/>
      <rect x="48" y="38" width="4" height="16" fill="#fde047" rx="1"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_gl_001',
          profileCode: 'GL-001',
          formula: (w) => w,
          angleLeft: 45,
          angleRight: 45,
          quantity: 1,
          description: 'Marco Superior Gold 4 Folhas',
        },
        {
          profileId: 'prof_gl_002',
          profileCode: 'GL-002',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Trilho Inferior Inox Gold',
        },
        {
          profileId: 'prof_gl_003',
          profileCode: 'GL-003',
          formula: (_w, h) => h,
          angleLeft: 45,
          angleRight: 90,
          quantity: 2,
          description: 'Marco Lateral Gold',
        },
        {
          profileId: 'prof_gl_028',
          profileCode: 'GL-028',
          formula: (_w, h) => h - 82,
          angleLeft: 90,
          angleRight: 90,
          quantity: 4,
          description: 'Montante Folha Lateral Fecho / Encontro',
        },
        {
          profileId: 'prof_gl_033',
          profileCode: 'GL-033',
          formula: (_w, h) => h - 82,
          angleLeft: 90,
          angleRight: 90,
          quantity: 4,
          description: 'Montante Central Mão de Amigo',
        },
        {
          profileId: 'prof_gl_038',
          profileCode: 'GL-038',
          formula: (w) => Math.round((w + 70) / 4) - 68,
          angleLeft: 90,
          angleRight: 90,
          quantity: 8,
          description: 'Travessas Folhas Gold',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round((w + 70) / 4) - 115,
          formulaH: (_w, h) => h - 175,
          quantity: 4,
          description: 'Vidro Folhas Gold (4 un)',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_rol_gold',
          formulaQuantity: () => 2,
        },
        {
          accessoryId: 'acc_fecho_gold',
          formulaQuantity: () => 1,
        },
      ],
    },
  },

  // 11. Porta de Giro 1 Folha com Fechadura Rolete (Gold)
  {
    id: 'typ_porta_giro_gold',
    code: 'P-GIR-1F-GLD',
    name: 'Porta de Giro 1 Folha com Fechadura Rolete & Puxador (Gold)',
    series: 'Gold',
    category: 'Porta de Giro',
    description: 'Porta de giro/abrir de alto padrão com dobradiças reforçadas embutidas, fechadura rolete e puxador em aço inox acetinado.',
    imageUrl: 'https://images.unsplash.com/photo-1533779283484-8da49dc92f11?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Laminado de Segurança 8mm ou Painel em Lambril Duplo',
      waterTightness: '600 Pa (Vedação perimetral 4 lados)',
      windLoadClass: 'C4 (Alta rigidez contra torção)',
      acousticReduction: '32 dB Rw',
      leafCount: 1,
      defaultWidthMm: 900,
      defaultHeightMm: 2200,
    },
    previewSvg: `<svg viewBox="0 0 100 90" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="20" y="5" width="60" height="80" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="25" y="10" width="50" height="70" stroke="#eab308" fill="#ca8a04" fill-opacity="0.2"/>
      <line x1="25" y1="10" x2="75" y2="45" stroke="#f59e0b" stroke-dasharray="2 2"/>
      <line x1="25" y1="80" x2="75" y2="45" stroke="#f59e0b" stroke-dasharray="2 2"/>
      <line x1="68" y1="36" x2="68" y2="54" stroke="#fde047" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="70" cy="45" r="2.5" fill="#fde047"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_gl_001',
          profileCode: 'GL-001',
          formula: (w) => w,
          angleLeft: 45,
          angleRight: 45,
          quantity: 1,
          description: 'Marco Superior',
        },
        {
          profileId: 'prof_gl_003',
          profileCode: 'GL-003',
          formula: (_w, h) => h,
          angleLeft: 45,
          angleRight: 90,
          quantity: 2,
          description: 'Marco Lateral',
        },
        {
          profileId: 'prof_gl_028',
          profileCode: 'GL-028',
          formula: (_w, h) => h - 45,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Montante Folha de Giro',
        },
        {
          profileId: 'prof_gl_038',
          profileCode: 'GL-038',
          formula: (w) => w - 90,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Travessa Folha de Giro',
        },
      ],
      glass: [
        {
          formulaW: (w) => w - 160,
          formulaH: (_w, h) => h - 160,
          quantity: 1,
          description: 'Vidro Folha de Giro (8mm)',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_fecho_gold',
          formulaQuantity: () => 1,
        },
      ],
    },
  },

  // 12. Porta Pivotante Luxo em ACM / Ripado com Puxador 1.5m (Linha Gold / ACM)
  {
    id: 'typ_porta_piv_acm_gold',
    code: 'P-PIV-FRIS-GLD',
    name: 'Porta Pivotante Monumental em ACM & Frisos (Gold Luxo)',
    series: 'Gold',
    category: 'Porta de Giro',
    description: 'Porta de entrada social imponente com eixo pivotante de 300 kg, estrutura tubular pesada, revestimento em ACM termoacústico e puxador de inox 1.50m.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Painel Maciço ACM 4mm com Miolo Mineral e Visor Vertical Vidro Refletivo',
      waterTightness: '550 Pa (Com vedação automática guilhotina inferior)',
      windLoadClass: 'C5 (Reforços estruturais anti-torção de 300 Pa)',
      acousticReduction: '35 dB Rw',
      leafCount: 1,
      defaultWidthMm: 1400,
      defaultHeightMm: 2800,
    },
    previewSvg: `<svg viewBox="0 0 100 90" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="15" y="5" width="70" height="80" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="22" y="9" width="58" height="72" stroke="#eab308" fill="#ca8a04" fill-opacity="0.25" rx="1"/>
      <circle cx="32" cy="12" r="2" fill="#fde047"/>
      <circle cx="32" cy="78" r="2" fill="#fde047"/>
      <line x1="32" y1="12" x2="32" y2="78" stroke="#fde047" stroke-dasharray="3 3" stroke-width="1.2"/>
      <line x1="26" y1="26" x2="76" y2="26" stroke="#fef08a" stroke-width="1"/>
      <line x1="26" y1="42" x2="76" y2="42" stroke="#fef08a" stroke-width="1"/>
      <line x1="26" y1="58" x2="76" y2="58" stroke="#fef08a" stroke-width="1"/>
      <line x1="68" y1="24" x2="68" y2="64" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_gl_001',
          profileCode: 'GL-001',
          formula: (w) => w,
          angleLeft: 45,
          angleRight: 45,
          quantity: 1,
          description: 'Marco Superior Pivotante',
        },
        {
          profileId: 'prof_gl_003',
          profileCode: 'GL-003',
          formula: (_w, h) => h,
          angleLeft: 45,
          angleRight: 90,
          quantity: 2,
          description: 'Marco Lateral Pivotante Reforçado',
        },
        {
          profileId: 'prof_gl_028',
          profileCode: 'GL-028',
          formula: (_w, h) => h - 50,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Tubo Estrutural Vertical Folha Pivotante',
        },
        {
          profileId: 'prof_gl_038',
          profileCode: 'GL-038',
          formula: (w) => w - 100,
          angleLeft: 45,
          angleRight: 45,
          quantity: 4,
          description: 'Travessas Estruturais Internas em Tubo',
        },
      ],
      glass: [
        {
          formulaW: (w) => w - 120,
          formulaH: (_w, h) => h - 120,
          quantity: 2,
          description: 'Painéis ACM 4mm Face Interna e Externa',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_fecho_gold',
          formulaQuantity: () => 1,
        },
      ],
    },
  },

  // 13. Porta de Correr Minimalista Vistas Ultrafinas 20mm (Chroma Minimal)
  {
    id: 'typ_porta_cor_min_chr',
    code: 'P-COR-MIN-CHR',
    name: 'Porta de Correr Minimalista Vistas 20mm (Chroma Minimal)',
    series: 'Chroma',
    category: 'Porta de Correr',
    description: 'Sistema minimalista europeu de alto padrão com montante central ultra-fino de 20mm e trilho inferior nivelado ao porcelanato sem degraus.',
    imageUrl: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Laminado Temperado 10mm ou Duplo Insulado 24mm',
      waterTightness: '600 Pa (Canaleta de drenagem de alta performance)',
      windLoadClass: 'C5 (Ensaiado para cargas até 2200 Pa)',
      acousticReduction: '37 dB Rw',
      leafCount: 2,
      defaultWidthMm: 3600,
      defaultHeightMm: 2700,
    },
    previewSvg: `<svg viewBox="0 0 100 90" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="5" y="5" width="90" height="80" rx="2" stroke="#10b981" stroke-width="2.5" fill="#0f172a"/>
      <rect x="7" y="7" width="44" height="76" stroke="#34d399" fill="#10b981" fill-opacity="0.12"/>
      <rect x="49" y="7" width="44" height="76" stroke="#34d399" fill="#10b981" fill-opacity="0.12"/>
      <line x1="49" y1="7" x2="49" y2="83" stroke="#34d399" stroke-width="1.5"/>
      <circle cx="45" cy="45" r="1.5" fill="#34d399"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_chr_001',
          profileCode: 'CHR-MIN-01',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Marco Superior Oculto Minimal',
        },
        {
          profileId: 'prof_chr_002',
          profileCode: 'CHR-MIN-02',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Trilho de Inox Nivelado ao Piso',
        },
        {
          profileId: 'prof_chr_020',
          profileCode: 'CHR-MIN-20',
          formula: (_w, h) => h - 40,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Perfil Slim Central 20mm',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round((w + 20) / 2) - 30,
          formulaH: (_w, h) => h - 60,
          quantity: 2,
          description: 'Vidro Estrutural Laminado Temperado 10mm',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_rol_gold',
          formulaQuantity: () => 2,
        },
      ],
    },
  },

  // 14. Janela de Correr 2 Folhas Chroma (Linha Chroma 32mm)
  {
    id: 'typ_cor2_chr',
    code: 'J-COR-2F-CHR',
    name: 'Janela de Correr 2 Folhas Chroma com Drenagem Oculta',
    series: 'Chroma',
    category: 'Janela de Correr',
    description: 'Sistema Chroma contemporâneo com drenagem oculta, perfil reto facetado e excelente desempenho acústico.',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Laminado 8mm ou Vidro Insulado Térmico',
      waterTightness: '550 Pa (Estanqueidade classe E4)',
      windLoadClass: 'C4 (Pressão de ensaio até 1800 Pa)',
      acousticReduction: '33 dB Rw',
      leafCount: 2,
      defaultWidthMm: 1600,
      defaultHeightMm: 1200,
    },
    previewSvg: `<svg viewBox="0 0 100 80" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="5" y="5" width="90" height="70" rx="2" stroke="#059669" stroke-width="3" fill="#0f172a"/>
      <rect x="9" y="9" width="43" height="62" stroke="#10b981" fill="#10b981" fill-opacity="0.18"/>
      <rect x="48" y="9" width="43" height="62" stroke="#10b981" fill="#10b981" fill-opacity="0.18"/>
      <line x1="28" y1="36" x2="28" y2="44" stroke="#a7f3d0" stroke-width="2"/>
      <line x1="72" y1="36" x2="72" y2="44" stroke="#a7f3d0" stroke-width="2"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_chr_001',
          profileCode: 'CHR-001',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Marco Superior Chroma',
        },
        {
          profileId: 'prof_chr_002',
          profileCode: 'CHR-002',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Trilho Inferior Chroma com Dreno Oculto',
        },
        {
          profileId: 'prof_chr_003',
          profileCode: 'CHR-003',
          formula: (_w, h) => h - 35,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Marco Lateral Chroma',
        },
        {
          profileId: 'prof_chr_020',
          profileCode: 'CHR-020',
          formula: (_w, h) => h - 68,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Montante Folha Lateral Chroma',
        },
        {
          profileId: 'prof_chr_040',
          profileCode: 'CHR-040',
          formula: (_w, h) => h - 68,
          angleLeft: 90,
          angleRight: 90,
          quantity: 2,
          description: 'Montante Central Reforçado Chroma',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round((w + 28) / 2) - 98,
          formulaH: (_w, h) => h - 148,
          quantity: 2,
          description: 'Vidro Folha Chroma',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_rol_sup',
          formulaQuantity: () => 2,
        },
        {
          accessoryId: 'acc_fecho_sup',
          formulaQuantity: () => 1,
        },
      ],
    },
  },

  // 15. Janela de Correr 2 Folhas Hydro Line 32mm (Hydro Line)
  {
    id: 'typ_cor2_hyd',
    code: 'J-COR-2F-HYD',
    name: 'Janela de Correr 2 Folhas Hydro Line 32mm',
    series: 'Hydro Line',
    category: 'Janela de Correr',
    description: 'Esquadria de alto desempenho termoacústico com marco meia-esquadria (45°) e câmara de descompressão para escoamento de água.',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Temperado 6mm ou Laminado 8mm',
      waterTightness: '500 Pa (Estanqueidade classe E4)',
      windLoadClass: 'C4 (Até 1600 Pa)',
      acousticReduction: '31 dB Rw',
      leafCount: 2,
      defaultWidthMm: 1500,
      defaultHeightMm: 1200,
    },
    previewSvg: `<svg viewBox="0 0 100 80" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="5" y="5" width="90" height="70" rx="2" stroke="#2563eb" stroke-width="3" fill="#0f172a"/>
      <rect x="9" y="9" width="43" height="62" stroke="#60a5fa" fill="#2563eb" fill-opacity="0.18"/>
      <rect x="48" y="9" width="43" height="62" stroke="#60a5fa" fill="#2563eb" fill-opacity="0.18"/>
      <line x1="28" y1="36" x2="28" y2="44" stroke="#bfdbfe" stroke-width="2"/>
      <line x1="72" y1="36" x2="72" y2="44" stroke="#bfdbfe" stroke-width="2"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_hyd_001',
          profileCode: 'HYD-101',
          formula: (w) => w,
          angleLeft: 45,
          angleRight: 45,
          quantity: 1,
          description: 'Marco Superior Meia-Esquadria',
        },
        {
          profileId: 'prof_hyd_002',
          profileCode: 'HYD-102',
          formula: (w) => w,
          angleLeft: 45,
          angleRight: 45,
          quantity: 1,
          description: 'Trilho Inferior c/ Dreno Oculto',
        },
        {
          profileId: 'prof_hyd_003',
          profileCode: 'HYD-103',
          formula: (_w, h) => h,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Marco Lateral Meia-Esquadria',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round((w + 26) / 2) - 95,
          formulaH: (_w, h) => h - 145,
          quantity: 2,
          description: 'Vidro Folhas Hydro Line',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_rol_sup',
          formulaQuantity: () => 2,
        },
      ],
    },
  },

  // 16. Fachada Pele de Vidro / Structural Glazing (Fachada Stick)
  {
    id: 'typ_fachada_glazing',
    code: 'F-PELE-GLAZ-FAC',
    name: 'Fachada Pele de Vidro / Structural Glazing Grid',
    series: 'Fachada',
    category: 'Fachada Pele de Vidro',
    description: 'Sistema de fachada cortina com colunas e travessas estruturais. Vidros colados com silicone estrutural bicomponente (Dow Corning / Sikasil) sem alumínio aparente.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Laminado Refletivo de Controle Solar 8mm / 10mm (Habitat/SunGuard)',
      waterTightness: '1200 Pa (Estanqueidade máxima sob teste dinâmico)',
      windLoadClass: 'C5 (Sobrecarga de vento extrema de até 3000 Pa)',
      acousticReduction: '38 dB Rw',
      leafCount: 4,
      defaultWidthMm: 3000,
      defaultHeightMm: 3500,
    },
    previewSvg: `<svg viewBox="0 0 100 90" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="5" y="5" width="90" height="80" rx="2" stroke="#0284c7" stroke-width="2.5" fill="#0f172a"/>
      <rect x="8" y="8" width="40" height="36" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.25"/>
      <rect x="52" y="8" width="40" height="36" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.25"/>
      <rect x="8" y="48" width="40" height="34" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.25"/>
      <rect x="52" y="48" width="40" height="34" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.25"/>
      <line x1="50" y1="5" x2="50" y2="85" stroke="#38bdf8" stroke-width="2"/>
      <line x1="5" y1="46" x2="95" y2="46" stroke="#38bdf8" stroke-width="2"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_fac_coluna',
          profileCode: 'FAC-COL-120',
          formula: (_w, h) => h,
          angleLeft: 90,
          angleRight: 90,
          quantity: 3,
          description: 'Coluna Estrutural Fachada Grid 120mm',
        },
        {
          profileId: 'prof_fac_travessa',
          profileCode: 'FAC-TRAV-80',
          formula: (w) => Math.round(w / 2) - 50,
          angleLeft: 90,
          angleRight: 90,
          quantity: 4,
          description: 'Travessas Horizontais Fachada 80mm',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round(w / 2) - 10,
          formulaH: (_w, h) => Math.round(h / 2) - 10,
          quantity: 4,
          description: 'Vidro Laminado Refletivo 8mm com Borda Preparada para Silicone',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_guarnicao_epdm',
          formulaQuantity: (w, h, qty) => Math.round(((w * 4 + h * 6) / 1000) * qty),
        },
      ],
    },
  },

  // 17. Guarda-Corpo Panorâmico Autoportante em Vidro (NBR 14718)
  {
    id: 'typ_guarda_corpo_pan',
    code: 'G-COR-PAN-14718',
    name: 'Guarda-Corpo Panorâmico Autoportante em Vidro (NBR 14718)',
    series: 'Linha 30',
    category: 'Portão',
    description: 'Guarda-corpo estrutural com perfil contínuo em alumínio embutido no piso, sem colunas verticais. Atende a norma ABNT NBR 14718.',
    imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Vidro Laminado Temperado 8+8mm (16.76mm com PVB Estrutural)',
      waterTightness: 'Drenagem contínua por canais inferiores',
      windLoadClass: 'C5 (Carga horizontal estática de 2.5 kN/m conforme NBR 14718)',
      acousticReduction: '35 dB Rw',
      leafCount: 2,
      defaultWidthMm: 3000,
      defaultHeightMm: 1100,
    },
    previewSvg: `<svg viewBox="0 0 100 80" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="5" y="60" width="90" height="15" rx="1" stroke="#475569" stroke-width="2" fill="#334155"/>
      <rect x="8" y="10" width="40" height="50" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.2"/>
      <rect x="52" y="10" width="40" height="50" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.2"/>
      <line x1="8" y1="10" x2="92" y2="10" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_gc_base',
          profileCode: 'GC-PERF-U',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Perfil Base U Pesado de Fixação Química',
        },
        {
          profileId: 'prof_gc_capa',
          profileCode: 'GC-CAPA-SLIM',
          formula: (w) => w,
          angleLeft: 90,
          angleRight: 90,
          quantity: 1,
          description: 'Corrimão Superior Tipo Capa Slim',
        },
      ],
      glass: [
        {
          formulaW: (w) => Math.round(w / 2) - 10,
          formulaH: (_w, h) => h - 50,
          quantity: 2,
          description: 'Vidro Laminado Temperado 8+8mm (16.76mm)',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_guarnicao_epdm',
          formulaQuantity: (w) => Math.round((w / 1000) * 4),
        },
      ],
    },
  },

  // 18. Porta de Giro com Lambril e Veneziana Ventilada (Linha 25)
  {
    id: 'typ_porta_lambri_l25',
    code: 'P-LAM-GIRO-L25',
    name: 'Porta c/ Lambril & Veneziana Ventilada (Linha 25)',
    series: 'Linha 25',
    category: 'Porta de Giro',
    description: 'Porta de alumínio indicada para lavanderias, áreas técnicas de ar condicionado e depósitos. Combina palhetas ventiladas com painel inferior em lambril rígido.',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=85',
    technicalSpecs: {
      recommendedGlass: 'Painel 100% em Alumínio (Palhetas de ventilação + Lambril)',
      waterTightness: '350 Pa (Com aletas de proteção contra respingos)',
      windLoadClass: 'C3 (Resistência a impactos domésticos)',
      acousticReduction: '22 dB Rw (Com ventilação permanente)',
      leafCount: 1,
      defaultWidthMm: 800,
      defaultHeightMm: 2100,
    },
    previewSvg: `<svg viewBox="0 0 100 90" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="20" y="5" width="60" height="80" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="25" y="10" width="50" height="32" stroke="#64748b" fill="#1e293b"/>
      <line x1="28" y1="16" x2="72" y2="16" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="28" y1="22" x2="72" y2="22" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="28" y1="28" x2="72" y2="28" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="28" y1="34" x2="72" y2="34" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="25" y="46" width="50" height="34" stroke="#64748b" fill="#334155"/>
      <circle cx="68" cy="45" r="2.5" fill="#fde047"/>
    </svg>`,
    formula: {
      cuts: [
        {
          profileId: 'prof_l25_001',
          profileCode: 'L25-001',
          formula: (w) => w,
          angleLeft: 45,
          angleRight: 45,
          quantity: 1,
          description: 'Marco Superior Linha 25',
        },
        {
          profileId: 'prof_l25_001',
          profileCode: 'L25-001',
          formula: (_w, h) => h,
          angleLeft: 45,
          angleRight: 90,
          quantity: 2,
          description: 'Marco Lateral Linha 25',
        },
        {
          profileId: 'prof_l25_028',
          profileCode: 'L25-028',
          formula: (_w, h) => h - 45,
          angleLeft: 45,
          angleRight: 45,
          quantity: 2,
          description: 'Montante Folha de Giro Linha 25',
        },
        {
          profileId: 'prof_l25_038',
          profileCode: 'L25-038',
          formula: (w) => w - 90,
          angleLeft: 45,
          angleRight: 45,
          quantity: 3,
          description: 'Travessas Superior, Central e Inferior',
        },
      ],
      glass: [
        {
          formulaW: (w) => w - 140,
          formulaH: () => 70,
          quantity: 6,
          description: 'Palhetas de Ventilação em Alumínio / Vidro',
        },
      ],
      accessories: [
        {
          accessoryId: 'acc_fecho_sup',
          formulaQuantity: () => 1,
        },
      ],
    },
  },
];
