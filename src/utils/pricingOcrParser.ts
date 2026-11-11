import { ProfileDefinition } from '../types';

export interface OcrDetectedPriceItem {
  code: string;
  name?: string;
  series?: string;
  category?: string;
  kgm?: number;
  pricePerKg: number;
  barPrice6m?: number;
  colorPrices?: {
    Natural?: number;
    Branco?: number;
    Preto?: number;
    Bronze?: number;
    Amadeirado?: number;
    [key: string]: number | undefined;
  };
  confidence?: number;
  notes?: string;
}

export interface OcrPricingMatrixRow {
  id: string;
  code: string;
  name: string;
  series: string;
  category: string;
  kgm: number;
  detectedPricePerKg: number;
  currentPricePerKg: number | null;
  priceDiff: number;
  variancePct: number;
  barPrice6m: number;
  colorPrices: Record<string, number>;
  matchedProfileId?: string;
  isNewProfile: boolean;
  selected: boolean;
  confidence: number;
}

export interface OcrPricingMatrixResult {
  supplier: string;
  date?: string;
  effectiveDate?: string;
  detectedBaseKgPrice?: number;
  colorMultipliers?: Record<string, number>;
  rows: OcrPricingMatrixRow[];
  summary: {
    totalDetected: number;
    matchedCount: number;
    newCount: number;
    avgDetectedPricePerKg: number;
    avgCurrentPricePerKg: number;
    avgVariancePct: number;
  };
}

/**
 * Normaliza o código do perfil removendo pontuações estranhas e padronizando hífens
 * Ex: 'su001' -> 'SU-001', 'gl 002' -> 'GL-002', 'mn053' -> 'MN-053'
 */
export const normalizeProfileCode = (rawCode: string): string => {
  if (!rawCode) return '';
  let clean = rawCode.trim().toUpperCase().replace(/[_\s.]+/g, '-');

  // Adiciona hífen em códigos compactos conhecidos (ex: SU001 -> SU-001, GL002 -> GL-002)
  const prefixMatch = clean.match(/^([A-Z]{2,4})(\d{2,4}[A-Z]?)$/);
  if (prefixMatch) {
    clean = `${prefixMatch[1]}-${prefixMatch[2]}`;
  }

  return clean;
};

/**
 * Localiza perfil correspondente no catálogo atual usando tolerância a hífens e maiúsculas
 */
export const findMatchingProfile = (
  code: string,
  catalog: ProfileDefinition[]
): ProfileDefinition | undefined => {
  if (!code || !catalog || catalog.length === 0) return undefined;

  const targetClean = normalizeProfileCode(code);
  const targetStripped = targetClean.replace(/[^A-Z0-9]/g, '');

  // 1. Busca exata de código
  let found = catalog.find((p) => normalizeProfileCode(p.code) === targetClean);
  if (found) return found;

  // 2. Busca sem hífens/espaços (ex: SU001 == SU-001)
  found = catalog.find((p) => p.code.replace(/[^A-Z0-9]/gi, '').toUpperCase() === targetStripped);
  if (found) return found;

  // 3. Busca por id
  found = catalog.find((p) => p.id.toUpperCase() === targetStripped);
  return found;
};

/**
 * Constrói a matriz de preços comparativa calculando diferenças e percentuais de variação
 */
export const buildPricingMatrix = (
  detectedItems: OcrDetectedPriceItem[],
  currentProfiles: ProfileDefinition[],
  detectedMultipliers?: Record<string, number>,
  supplierName: string = 'Extrusora / Distribuidora'
): OcrPricingMatrixResult => {
  const rows: OcrPricingMatrixRow[] = detectedItems.map((item, index) => {
    const normCode = normalizeProfileCode(item.code);
    const matched = findMatchingProfile(normCode, currentProfiles);
    const isNew = !matched;

    // Se o preço por kg foi detectado como zero mas o preço da barra foi dado
    let pricePerKg = item.pricePerKg;
    const kgm = item.kgm ?? matched?.kgm ?? 0.7;

    if ((!pricePerKg || pricePerKg <= 0) && item.barPrice6m && item.barPrice6m > 0 && kgm > 0) {
      pricePerKg = Number((item.barPrice6m / (kgm * 6)).toFixed(2));
    }
    if (!pricePerKg || pricePerKg <= 0) {
      pricePerKg = matched ? matched.pricePerKg : 35.0;
    }

    const currentPricePerKg = matched ? matched.pricePerKg : null;
    const priceDiff = currentPricePerKg !== null ? Number((pricePerKg - currentPricePerKg).toFixed(2)) : 0;
    const variancePct =
      currentPricePerKg && currentPricePerKg > 0
        ? Number((((pricePerKg - currentPricePerKg) / currentPricePerKg) * 100).toFixed(1))
        : 0;

    const barPrice6m = item.barPrice6m ?? Number((pricePerKg * kgm * 6).toFixed(2));

    // Constrói mapa de preços por cor
    const colorPrices: Record<string, number> = {};
    if (item.colorPrices) {
      Object.entries(item.colorPrices).forEach(([color, price]) => {
        if (typeof price === 'number' && price > 0) {
          colorPrices[color] = price;
        }
      });
    }

    return {
      id: `ocr_row_${index}_${normCode}`,
      code: normCode,
      name: item.name || matched?.name || `Perfil ${normCode}`,
      series: item.series || matched?.series || 'Universal',
      category: item.category || matched?.category || 'Outros',
      kgm: Number(kgm.toFixed(3)),
      detectedPricePerKg: Number(pricePerKg.toFixed(2)),
      currentPricePerKg,
      priceDiff,
      variancePct,
      barPrice6m,
      colorPrices,
      matchedProfileId: matched?.id,
      isNewProfile: isNew,
      selected: true,
      confidence: item.confidence ?? 0.95,
    };
  });

  // Cálculo de resumos estatísticos
  const totalDetected = rows.length;
  const matchedCount = rows.filter((r) => !r.isNewProfile).length;
  const newCount = rows.filter((r) => r.isNewProfile).length;

  const validDetectedPrices = rows.map((r) => r.detectedPricePerKg).filter((p) => p > 0);
  const avgDetectedPricePerKg =
    validDetectedPrices.length > 0
      ? Number((validDetectedPrices.reduce((a, b) => a + b, 0) / validDetectedPrices.length).toFixed(2))
      : 0;

  const validCurrentPrices = rows
    .map((r) => r.currentPricePerKg)
    .filter((p): p is number => p !== null && p > 0);
  const avgCurrentPricePerKg =
    validCurrentPrices.length > 0
      ? Number((validCurrentPrices.reduce((a, b) => a + b, 0) / validCurrentPrices.length).toFixed(2))
      : 0;

  const validVariances = rows
    .filter((r) => r.currentPricePerKg !== null && r.currentPricePerKg > 0)
    .map((r) => r.variancePct);
  const avgVariancePct =
    validVariances.length > 0
      ? Number((validVariances.reduce((a, b) => a + b, 0) / validVariances.length).toFixed(1))
      : 0;

  return {
    supplier: supplierName,
    detectedBaseKgPrice: avgDetectedPricePerKg,
    colorMultipliers: detectedMultipliers,
    rows,
    summary: {
      totalDetected,
      matchedCount,
      newCount,
      avgDetectedPricePerKg,
      avgCurrentPricePerKg,
      avgVariancePct,
    },
  };
};

/**
 * Aplica a seleção da matriz de preços sobre a lista de perfis do sistema
 */
export const applyPricingMatrix = (
  currentProfiles: ProfileDefinition[],
  selectedRows: OcrPricingMatrixRow[],
  options: { addNewProfiles?: boolean } = { addNewProfiles: true }
): {
  updatedProfiles: ProfileDefinition[];
  updatedCount: number;
  addedCount: number;
} => {
  const result: ProfileDefinition[] = [...currentProfiles];
  let updatedCount = 0;
  let addedCount = 0;

  // Mapa de códigos normalizados para índice
  const profileIndexMap = new Map<string, number>();
  result.forEach((p, index) => {
    profileIndexMap.set(normalizeProfileCode(p.code), index);
    profileIndexMap.set(p.code.replace(/[^A-Z0-9]/gi, '').toUpperCase(), index);
  });

  selectedRows.forEach((row) => {
    if (!row.selected) return;

    const normCode = normalizeProfileCode(row.code);
    const stripped = normCode.replace(/[^A-Z0-9]/g, '');

    const existingIndex = profileIndexMap.get(normCode) ?? profileIndexMap.get(stripped);

    if (existingIndex !== undefined) {
      // Atualiza preço por kg do perfil existente
      result[existingIndex] = {
        ...result[existingIndex],
        pricePerKg: row.detectedPricePerKg,
      };
      updatedCount++;
    } else if (options.addNewProfiles) {
      // Adiciona novo perfil cadastrado via OCR
      const newProfile: ProfileDefinition = {
        id: `prof_ocr_${Date.now()}_${addedCount}`,
        code: normCode,
        name: row.name || `Perfil ${normCode}`,
        series: (row.series as any) || 'Universal',
        category: (row.category as any) || 'Outros',
        kgm: row.kgm > 0 ? row.kgm : 0.65,
        defaultLength: 6000,
        pricePerKg: row.detectedPricePerKg,
      };
      result.push(newProfile);
      profileIndexMap.set(normCode, result.length - 1);
      addedCount++;
    }
  });

  return {
    updatedProfiles: result,
    updatedCount,
    addedCount,
  };
};

/**
 * Mescla e valida multiplicadores de cor extraídos via OCR
 */
export const applyColorMultipliersUpdate = (
  currentMultipliers: Record<string, number>,
  detectedMultipliers?: Record<string, number>
): Record<string, number> => {
  if (!detectedMultipliers) return currentMultipliers;

  const updated = { ...currentMultipliers };
  Object.entries(detectedMultipliers).forEach(([key, val]) => {
    if (typeof val === 'number' && Number.isFinite(val) && val >= 1.0 && val <= 3.0) {
      updated[key] = Number(val.toFixed(2));
    }
  });

  return updated;
};

/**
 * Parser heurístico local para tabelas de preços em texto, logs ou OCR em texto puro
 */
export const extractPricingFromTextHeuristic = (
  text: string
): {
  items: OcrDetectedPriceItem[];
  supplier?: string;
  colorMultipliers?: Record<string, number>;
} => {
  if (!text) return { items: [] };

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: OcrDetectedPriceItem[] = [];

  // Tenta detectar fornecedor
  let detectedSupplier = 'Tabela de Extrusão';
  const supplierRegex = /(belmetal|hydro|alcoa|alumbra|cba|perfil alum[ií]nio|alumbra|miranda|esquadrias)/i;
  for (const line of lines.slice(0, 5)) {
    const m = line.match(supplierRegex);
    if (m) {
      detectedSupplier = m[0].toUpperCase();
      break;
    }
  }

  // Tenta detectar multiplicadores de cores
  const colorMultipliers: Record<string, number> = {};
  const whiteMatch = text.match(/branc[oa]\s*[:=]?\s*([12][.,]\d{1,2})/i);
  if (whiteMatch) colorMultipliers['Branco'] = parseFloat(whiteMatch[1].replace(',', '.'));

  const blackMatch = text.match(/pret[oa]\s*[:=]?\s*([12][.,]\d{1,2})/i);
  if (blackMatch) colorMultipliers['Preto'] = parseFloat(blackMatch[1].replace(',', '.'));

  const bronzeMatch = text.match(/bronze\s*[:=]?\s*([12][.,]\d{1,2})/i);
  if (bronzeMatch) colorMultipliers['Bronze'] = parseFloat(bronzeMatch[1].replace(',', '.'));

  const woodMatch = text.match(/(amadeirado|madeira)\s*[:=]?\s*([12][.,]\d{1,2})/i);
  if (woodMatch) colorMultipliers['Amadeirado'] = parseFloat(woodMatch[2].replace(',', '.'));

  // Regex para capturar linhas de tabelas de preços
  lines.forEach((line) => {
    // 1. Tenta formato com colunas separadas por pipe (|), ponto-e-vírgula ou tabulação
    if (line.includes('|') || line.includes('\t') || line.includes(';')) {
      const parts = line.split(/[|\t;]+/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const potentialCode = normalizeProfileCode(parts[0]);
        if (/^[A-Z]{2,4}-\d{2,4}[A-Z]?$/.test(potentialCode) || /^[A-Z]{2,4}\d{2,4}$/.test(parts[0].trim().toUpperCase())) {
          let name = '';
          let kgm = 0.7;
          let price = 0;

          for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            const priceMatch = part.match(/(?:R\$\s*)?([0-9]+[.,][0-9]{2})/);
            const kgmMatch = part.match(/([0-9]+[.,][0-9]{2,3})\s*(?:kg\/m|kg)/i);

            if (kgmMatch) {
              kgm = parseFloat(kgmMatch[1].replace(',', '.'));
            } else if (priceMatch && price === 0) {
              const val = parseFloat(priceMatch[1].replace(',', '.'));
              if (val >= 10 && val <= 300) {
                price = val;
              }
            } else if (!name && !/^[0-9.,\s]+$/.test(part)) {
              name = part;
            }
          }

          if (price > 0) {
            items.push({
              code: potentialCode,
              name: name || `Perfil ${potentialCode}`,
              kgm,
              pricePerKg: price,
              confidence: 0.92,
            });
            return;
          }
        }
      }
    }

    // 2. Fallback de regex para texto corrido
    const regex = /([A-Z]{2,4}[-\s]?\d{2,4}[A-Z]?)\s+([A-Za-z0-9\sÀ-ÿ-]{3,40}?)\s+([0-9]+[.,][0-9]{2,3})\s*(?:kg\/m|kg)?\s*(?:R\$\s*)?([0-9]+[.,][0-9]{2})/i;
    const match = line.match(regex);
    if (match) {
      const code = normalizeProfileCode(match[1]);
      const name = match[2].trim();
      const kgm = parseFloat(match[3].replace(',', '.'));
      const pricePerKg = parseFloat(match[4].replace(',', '.'));

      if (pricePerKg >= 15 && pricePerKg <= 200) {
        items.push({
          code,
          name: name.length > 2 ? name : `Perfil ${code}`,
          kgm,
          pricePerKg,
          confidence: 0.9,
        });
      }
    }
  });

  return {
    items,
    supplier: detectedSupplier,
    colorMultipliers: Object.keys(colorMultipliers).length > 0 ? colorMultipliers : undefined,
  };
};

/**
 * Exemplos pré-carregados de tabelas de preços de extrusoras nacionais para teste imediato
 */
export const SAMPLE_OCR_DATASETS: Array<{
  id: string;
  name: string;
  supplier: string;
  description: string;
  detectedBaseKgPrice: number;
  colorMultipliers: Record<string, number>;
  items: OcrDetectedPriceItem[];
}> = [
  {
    id: 'sample_belmetal_2026',
    name: 'Tabela Belmetal 2026 - Suprema & Gold (Extrusão R$/kg)',
    supplier: 'Belmetal Extrusão & Distribuição',
    description: 'Preços base atualizados para perfis de alta saída Linha Suprema (25mm) e Gold (32mm) com acréscimo de pintura eletrostática.',
    detectedBaseKgPrice: 38.5,
    colorMultipliers: {
      Natural: 1.0,
      Branco: 1.12,
      Preto: 1.15,
      Bronze: 1.2,
      Amadeirado: 1.45,
    },
    items: [
      { code: 'SU-001', name: 'Trilho Superior 2 Planos', series: 'Suprema', category: 'Trilho', kgm: 0.684, pricePerKg: 38.5, barPrice6m: 158.0 },
      { code: 'SU-002', name: 'Trilho Inferior 2 Planos com Aba', series: 'Suprema', category: 'Trilho', kgm: 0.542, pricePerKg: 38.5, barPrice6m: 125.2 },
      { code: 'SU-053', name: 'Montante Lateral Folha', series: 'Suprema', category: 'Folha', kgm: 0.612, pricePerKg: 38.9, barPrice6m: 142.8 },
      { code: 'SU-039', name: 'Mão de Amigo Central Folha', series: 'Suprema', category: 'Folha', kgm: 0.589, pricePerKg: 38.9, barPrice6m: 137.5 },
      { code: 'SU-102', name: 'Baguete de Encaixe Reto', series: 'Suprema', category: 'Baguete', kgm: 0.158, pricePerKg: 42.0, barPrice6m: 39.8 },
      { code: 'GL-001', name: 'Marco Superior 2 Planos Linha Gold', series: 'Gold', category: 'Marco', kgm: 1.15, pricePerKg: 37.8, barPrice6m: 260.8 },
      { code: 'GL-002', name: 'Marco Inferior 2 Planos com Aba Linha Gold', series: 'Gold', category: 'Marco', kgm: 1.28, pricePerKg: 37.8, barPrice6m: 290.3 },
      { code: 'GL-026', name: 'Montante Folha de Correr Linha Gold', series: 'Gold', category: 'Folha', kgm: 1.02, pricePerKg: 37.8, barPrice6m: 231.3 },
      { code: 'GL-038', name: 'Travessa Intermediária Linha Gold', series: 'Gold', category: 'Travessa', kgm: 1.34, pricePerKg: 37.8, barPrice6m: 303.9 },
    ],
  },
  {
    id: 'sample_hydro_chroma',
    name: 'Tabela Hydro Linha Chroma & Minimalista (Alumínio Arquitetônico)',
    supplier: 'Hydro Extrusão Brasil',
    description: 'Tabela de perfis estruturais e minimalistas de alto padrão para esquadrias panorâmicas piso-teto.',
    detectedBaseKgPrice: 44.0,
    colorMultipliers: {
      Natural: 1.0,
      Branco: 1.1,
      Preto: 1.15,
      Bronze: 1.25,
      Amadeirado: 1.5,
    },
    items: [
      { code: 'CHR-001', name: 'Trilho Embutido Triplo Chroma', series: 'Chroma', category: 'Trilho', kgm: 1.85, pricePerKg: 44.0, barPrice6m: 488.4 },
      { code: 'CHR-020', name: 'Montante Lateral Invisível', series: 'Chroma', category: 'Folha', kgm: 1.42, pricePerKg: 44.5, barPrice6m: 379.1 },
      { code: 'CHR-050', name: 'Mão de Amigo Esbelta 20mm', series: 'Chroma', category: 'Folha', kgm: 1.25, pricePerKg: 45.0, barPrice6m: 337.5 },
      { code: 'CM-060', name: 'Contramarco Frontal Reforçado', series: 'Universal', category: 'Contramarco', kgm: 0.38, pricePerKg: 36.0, barPrice6m: 82.0 },
      { code: 'AR-012', name: 'Arremate Duplo de Alvenaria', series: 'Universal', category: 'Arremate', kgm: 0.29, pricePerKg: 39.0, barPrice6m: 67.8 },
    ],
  },
];
