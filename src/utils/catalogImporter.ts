/**
 * Utilitário de Importação Inteligente de Catálogos e Tabelas de Alumínio
 * Sanches & Marques ERP/PCP - Padrão Industrial
 *
 * Mapeia automaticamente colunas de peso (kg/m ou barra), dimensões,
 * cortes (ângulos e usinagens), custo por kg e tipologias a partir de CSV ou JSON.
 */

import { ProfileDefinition, TypologyItem, TypologyFormula } from '../types';

export interface DetectedColumnMapping {
  codeCol?: string;
  nameCol?: string;
  kgmCol?: string;
  barWeightCol?: string;
  priceKgCol?: string;
  barCostCol?: string;
  dimensionsCol?: string;
  cuttingAnglesCol?: string;
  machiningCol?: string;
  seriesCol?: string;
  categoryCol?: string;
  lengthCol?: string;
}

export interface ProfileImportRow {
  id: string;
  code: string;
  name: string;
  series: string;
  category: string;
  kgm: number;
  defaultLength: number;
  pricePerKg: number;
  dimensions?: string;
  cuttingAngles?: string;
  machiningNote?: string;
  sourceCatalog?: string;
  isValid: boolean;
  validationErrors: string[];
}

export interface CatalogParseResult {
  format: 'csv' | 'json';
  profiles: ProfileImportRow[];
  typologies: TypologyItem[];
  detectedMapping: DetectedColumnMapping;
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  supplierName: string;
  rawHeaders: string[];
}

/**
 * Remove acentos, pontuações e converte para minúsculas para correspondência flexível
 */
export function normalizeHeaderKey(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[\s-]+/g, '_') // converte espaços e hífens em underscores
    .replace(/[^a-z0-9_/$]/g, ''); // mantém apenas alfanuméricos, underscore, slash e cifrão
}

/**
 * Converte valores numéricos em formatos variados (brasileiro 1.250,50 ou 0,745, R$ 38,50, ou americano 1250.50)
 */
export function parseLocaleNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  
  let str = String(value).trim();
  if (!str) return null;

  // Remove símbolos de moeda, unidades de medida e espaços
  str = str
    .replace(/r\$/gi, '')
    .replace(/usd|\$|€/gi, '')
    .replace(/kg\/m|kgm|kg|mm|m|reais/gi, '')
    .trim();

  // Tratamento de formato brasileiro: ponto como milhar e vírgula como decimal
  if (str.includes(',') && str.includes('.')) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Formato brasileiro: 1.250,50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato americano: 1,250.50
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Apenas vírgula: 0,745 ou 38,50
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Detecta automaticamente o mapeamento de colunas inspecionando cabeçalhos CSV ou chaves JSON
 */
export function detectColumnMapping(headers: string[]): DetectedColumnMapping {
  const mapping: DetectedColumnMapping = {};

  for (const rawHeader of headers) {
    const key = normalizeHeaderKey(rawHeader);

    // 1. Código do Perfil
    if (!mapping.codeCol && (
      key === 'codigo' ||
      key === 'cod' ||
      key === 'code' ||
      key === 'ref' ||
      key === 'referencia' ||
      key === 'id_perfil' ||
      key === 'perfil' ||
      key === 'item' ||
      key.startsWith('ref') ||
      key.includes('codigo') ||
      key.includes('referencia') ||
      (key.includes('perfil') && !key.includes('tipo') && !key.includes('linha'))
    )) {
      mapping.codeCol = rawHeader;
      continue;
    }

    // 2. Nome / Descrição
    if (!mapping.nameCol && (
      key === 'nome' ||
      key === 'descricao' ||
      key === 'denominacao' ||
      key === 'description' ||
      key === 'name' ||
      key === 'especificacao' ||
      key.includes('descricao') ||
      key.includes('denominacao')
    )) {
      mapping.nameCol = rawHeader;
      continue;
    }

    // 3. Peso Linear (kg/m)
    if (!mapping.kgmCol && (
      key === 'kg/m' ||
      key === 'kg_m' ||
      key === 'kgm' ||
      key === 'peso_metro' ||
      key === 'pesometro' ||
      key === 'pesolinear' ||
      key === 'peso_linear' ||
      key === 'peso_especifico' ||
      key === 'linear_weight' ||
      key === 'peso_kg_m' ||
      key === 'massa_linear' ||
      key === 'peso' ||
      key === 'weight'
    )) {
      mapping.kgmCol = rawHeader;
      continue;
    }

    // 4. Peso Barra 6m (caso o fornecedor informe apenas o peso da barra completa)
    if (!mapping.barWeightCol && (
      key.includes('pesobarra') ||
      key.includes('peso_barra') ||
      key.includes('peso6m') ||
      key.includes('bar_weight')
    )) {
      mapping.barWeightCol = rawHeader;
      continue;
    }

    // 5. Custo / Preço por Kg
    if (!mapping.priceKgCol && (
      key === 'custo_kg' ||
      key === 'preco_kg' ||
      key === 'custo_por_kg' ||
      key === 'preco_por_kg' ||
      key === 'custokg' ||
      key === 'precokg' ||
      key === 'preco' ||
      key === 'custo' ||
      key === 'valor_kg' ||
      key === 'valorkg' ||
      key === 'price_per_kg' ||
      key === 'price_kg' ||
      key.includes('r$/kg') ||
      key.includes('custo_kg') ||
      key.includes('preco_kg') ||
      key.includes('valor_kg') ||
      ((key.includes('custo') || key.includes('preco') || key.includes('price')) && !key.includes('barra'))
    )) {
      mapping.priceKgCol = rawHeader;
      continue;
    }

    // 6. Custo da Barra (opcional)
    if (!mapping.barCostCol && (
      key.includes('custobarra') ||
      key.includes('custo_barra') ||
      key.includes('precobarra') ||
      key.includes('preco_barra') ||
      key.includes('bar_cost')
    )) {
      mapping.barCostCol = rawHeader;
      continue;
    }

    // 7. Dimensões / Medidas da Seção
    if (!mapping.dimensionsCol && (
      key === 'dimensoes' ||
      key === 'dimensao' ||
      key === 'medidas' ||
      key === 'secao' ||
      key === 'bitola' ||
      key === 'dimensions' ||
      key === 'medida_mm' ||
      key.includes('dimensao') ||
      key.includes('dimensoes') ||
      key.includes('medida') ||
      key.includes('bitola') ||
      key.includes('secao')
    )) {
      mapping.dimensionsCol = rawHeader;
      continue;
    }

    // 8. Cortes / Ângulos
    if (!mapping.cuttingAnglesCol && (
      key === 'corte' ||
      key === 'cortes' ||
      key === 'angulo' ||
      key === 'angulos' ||
      key === 'corte_tipo' ||
      key === 'grau' ||
      key === 'graus' ||
      key === 'cutting_angles' ||
      key.includes('corte') ||
      key.includes('angulo')
    )) {
      mapping.cuttingAnglesCol = rawHeader;
      continue;
    }

    // 9. Usinagem / Machining Guide
    if (!mapping.machiningCol && (
      key === 'usinagem' ||
      key === 'usinagens' ||
      key === 'machining' ||
      key === 'detalhe_corte' ||
      key === 'estampo' ||
      key === 'dreno' ||
      key.includes('usinag')
    )) {
      mapping.machiningCol = rawHeader;
      continue;
    }

    // 10. Série / Linha
    if (!mapping.seriesCol && (
      key === 'serie' ||
      key === 'linha' ||
      key === 'sistema' ||
      key === 'series' ||
      key === 'family' ||
      key.includes('serie') ||
      key.includes('linha')
    )) {
      mapping.seriesCol = rawHeader;
      continue;
    }

    // 11. Categoria / Função
    if (!mapping.categoryCol && (
      key === 'categoria' ||
      key === 'tipo_perfil' ||
      key === 'funcao' ||
      key === 'category' ||
      key.includes('categoria') ||
      key.includes('funcao')
    )) {
      mapping.categoryCol = rawHeader;
      continue;
    }

    // 12. Comprimento da Barra
    if (!mapping.lengthCol && (
      key === 'comprimento' ||
      key === 'length' ||
      key === 'tamanho_barra' ||
      key.includes('comprimento')
    )) {
      mapping.lengthCol = rawHeader;
      continue;
    }
  }

  return mapping;
}

/**
 * Normaliza e categoriza um perfil a partir da descrição ou código caso a categoria esteja vazia
 */
export function inferCategory(name: string, code: string): string {
  const lower = `${name} ${code}`.toLowerCase();
  if (lower.includes('marco') || lower.includes('batente') || lower.includes('quadro')) return 'Marco';
  if (lower.includes('folha') || lower.includes('folhas')) return 'Folha';
  if (lower.includes('trilho') || lower.includes('guia')) return 'Trilho';
  if (lower.includes('travessa') || lower.includes('reforco')) return 'Travessa';
  if (lower.includes('baguete') || lower.includes('baguate')) return 'Baguate';
  if (lower.includes('montante') || lower.includes('mao de amigo') || lower.includes('lateral')) return 'Montante';
  if (lower.includes('contramarco') || lower.includes('contra marco')) return 'Contramarco';
  if (lower.includes('arremate') || lower.includes('alizar') || lower.includes('guarnicao')) return 'Arremate';
  if (lower.includes('tubo') || lower.includes('cantoneira') || lower.includes('barra chata') || lower.includes('perfil u') || lower.includes('perfil t')) return 'Comercial';
  return 'Comercial';
}

/**
 * Infere a série da esquadria se não vier explícita
 */
export function inferSeries(code: string, name: string, fallback: string = 'Universal'): string {
  const upper = `${code} ${name}`.toUpperCase();
  if (upper.includes('CHR') || upper.includes('CHROMA')) return 'Chroma';
  if (upper.includes('SU-') || upper.includes('SUPREMA')) return 'Suprema';
  if (upper.includes('LG-') || upper.includes('GL-') || upper.includes('GOLD')) return 'Gold';
  if (upper.includes('IV-') || upper.includes('IVGOLD')) return 'IV Gold';
  if (upper.includes('MN-') || upper.includes('MIRANDA')) return 'Miranda';
  if (upper.includes('BEN-') || upper.includes('BENDINI')) return 'Bendini';
  if (upper.includes('L25') || upper.includes('L-25') || upper.includes('LINHA 25')) return 'Linha 25';
  if (upper.includes('L30') || upper.includes('L-30') || upper.includes('LINHA 30')) return 'Linha 30';
  if (upper.includes('INT-') || upper.includes('INTEGRADA')) return 'Integrada';
  if (upper.includes('FAC-') || upper.includes('FACHADA')) return 'Fachada';
  return fallback;
}

/**
 * Normaliza os ângulos de corte a partir de textos livres
 */
export function normalizeCuttingAngle(text: string | undefined): string {
  if (!text) return '45° / 45° ou 90° / 90°';
  const clean = text.replace(/\s+/g, ' ').trim().toLowerCase();
  if (clean.includes('45') && clean.includes('90')) return '45° / 90° (Misto)';
  if (clean.includes('45')) return '45° / 45° (Meia-esquadria)';
  if (clean.includes('90') || clean.includes('reto')) return '90° / 90° (Corte Reto)';
  return text;
}

/**
 * Parser de texto CSV com suporte a delimitadores automáticos (vírgula, ponto-e-vírgula, tabulação)
 */
export function parseCsvRows(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleanText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!cleanText) return { headers: [], rows: [] };

  const lines = cleanText.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Detecta o delimitador na primeira linha
  const firstLine = lines[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semicolonCount > commaCount && semicolonCount >= tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  }

  // Função interna para separar campos respeitando aspas
  const splitRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++; // pula aspa duplicada
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = splitRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = splitRow(lines[i]);
    // Ignora linhas vazias ou apenas delimitadores
    if (fields.every((f) => f === '')) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = fields[idx] !== undefined ? fields[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Converte linhas mapeadas para ProfileImportRow
 */
export function mapRowsToProfiles(
  rows: Record<string, string>[],
  mapping: DetectedColumnMapping,
  defaultSeries: string = 'Universal',
  defaultSupplier: string = 'Fornecedor Externo'
): ProfileImportRow[] {
  return rows.map((row, index) => {
    const rawCode = mapping.codeCol ? row[mapping.codeCol]?.trim() : '';
    const rawName = mapping.nameCol ? row[mapping.nameCol]?.trim() : '';
    
    // Cálculo de peso por metro (kg/m)
    let kgm = mapping.kgmCol ? parseLocaleNumber(row[mapping.kgmCol]) : null;
    if ((kgm === null || kgm === 0) && mapping.barWeightCol) {
      const barWeight = parseLocaleNumber(row[mapping.barWeightCol]);
      if (barWeight && barWeight > 0) {
        kgm = Number((barWeight / 6).toFixed(3));
      }
    }

    // Custo por kg
    let priceKg = mapping.priceKgCol ? parseLocaleNumber(row[mapping.priceKgCol]) : null;
    if ((priceKg === null || priceKg === 0) && mapping.barCostCol && kgm && kgm > 0) {
      const barCost = parseLocaleNumber(row[mapping.barCostCol]);
      if (barCost && barCost > 0) {
        priceKg = Number((barCost / (kgm * 6)).toFixed(2));
      }
    }

    // Comprimento da barra
    const lengthMm = mapping.lengthCol ? parseLocaleNumber(row[mapping.lengthCol]) || 6000 : 6000;

    // Dimensões
    const dimensions = mapping.dimensionsCol ? row[mapping.dimensionsCol]?.trim() : undefined;

    // Cortes
    const cuttingRaw = mapping.cuttingAnglesCol ? row[mapping.cuttingAnglesCol]?.trim() : undefined;
    const cuttingAngles = cuttingRaw ? normalizeCuttingAngle(cuttingRaw) : undefined;

    // Usinagem
    const machiningNote = mapping.machiningCol ? row[mapping.machiningCol]?.trim() : undefined;

    // Série
    const explicitSeries = mapping.seriesCol ? row[mapping.seriesCol]?.trim() : '';
    const series = explicitSeries || inferSeries(rawCode || '', rawName || '', defaultSeries);

    // Categoria
    const explicitCategory = mapping.categoryCol ? row[mapping.categoryCol]?.trim() : '';
    const category = explicitCategory || inferCategory(rawName || '', rawCode || '');

    // Validações
    const validationErrors: string[] = [];
    if (!rawCode) {
      validationErrors.push('Código do perfil não identificado na linha');
    }
    if (!kgm || kgm <= 0) {
      validationErrors.push('Peso linear (kg/m) inválido ou zero');
    }

    const code = rawCode || `PRF-${String(index + 1).padStart(3, '0')}`;
    const name = rawName || `Perfil de Alumínio ${code}`;
    const finalKgm = kgm && kgm > 0 ? kgm : 0.500;
    const finalPrice = priceKg && priceKg > 0 ? priceKg : 36.50;

    return {
      id: `imp_${code.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_${index}`,
      code,
      name,
      series,
      category,
      kgm: finalKgm,
      defaultLength: lengthMm,
      pricePerKg: finalPrice,
      dimensions: dimensions || undefined,
      cuttingAngles,
      machiningNote,
      sourceCatalog: defaultSupplier,
      isValid: validationErrors.length === 0,
      validationErrors,
    };
  });
}

/**
 * Gera um SVG técnico vetorial limpo como preview de qualquer tipologia
 */
export function generateDefaultTypologySvg(code: string, category: string): string {
  const isDoor = (category || '').toLowerCase().includes('porta') || (code || '').toUpperCase().startsWith('P-');
  const isMaximar = (category || '').toLowerCase().includes('maxim') || (code || '').toUpperCase().includes('MAX');
  const isIntegrada = (category || '').toLowerCase().includes('integ');
  
  if (isDoor) {
    return `<svg viewBox="0 0 100 90" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="15" y="5" width="70" height="80" rx="2" stroke="#3b82f6" stroke-width="3" fill="#0f172a"/>
      <rect x="19" y="9" width="31" height="72" stroke="#60a5fa" fill="#3b82f6" fill-opacity="0.15"/>
      <rect x="50" y="9" width="31" height="72" stroke="#60a5fa" fill="#3b82f6" fill-opacity="0.15"/>
      <rect x="46" y="42" width="3" height="12" fill="#93c5fd" rx="1"/>
    </svg>`;
  }
  if (isMaximar) {
    return `<svg viewBox="0 0 100 80" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="15" y="10" width="70" height="60" rx="2" stroke="#3b82f6" stroke-width="3" fill="#0f172a"/>
      <rect x="22" y="17" width="56" height="46" stroke="#60a5fa" fill="#3b82f6" fill-opacity="0.15"/>
      <line x1="22" y1="17" x2="50" y2="40" stroke="#f59e0b" stroke-dasharray="2 2"/>
      <line x1="78" y1="17" x2="50" y2="40" stroke="#f59e0b" stroke-dasharray="2 2"/>
      <circle cx="50" cy="56" r="3" fill="#e2e8f0"/>
    </svg>`;
  }
  if (isIntegrada) {
    return `<svg viewBox="0 0 100 90" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
      <rect x="10" y="5" width="80" height="80" rx="2" stroke="#475569" stroke-width="3" fill="#0f172a"/>
      <rect x="14" y="9" width="72" height="22" stroke="#94a3b8" fill="#334155" rx="1"/>
      <line x1="16" y1="14" x2="84" y2="14" stroke="#64748b" stroke-width="1.5"/>
      <line x1="16" y1="19" x2="84" y2="19" stroke="#64748b" stroke-width="1.5"/>
      <line x1="16" y1="24" x2="84" y2="24" stroke="#64748b" stroke-width="1.5"/>
      <rect x="14" y="34" width="34" height="47" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.15"/>
      <rect x="52" y="34" width="34" height="47" stroke="#38bdf8" fill="#0284c7" fill-opacity="0.15"/>
    </svg>`;
  }
  // Janela de correr padrão 2 folhas
  return `<svg viewBox="0 0 100 80" class="w-full h-full stroke-slate-300 fill-none" stroke-width="2">
    <rect x="5" y="5" width="90" height="70" rx="2" stroke="#3b82f6" stroke-width="3" fill="#0f172a"/>
    <rect x="9" y="9" width="43" height="62" stroke="#60a5fa" fill="#3b82f6" fill-opacity="0.15"/>
    <rect x="48" y="9" width="43" height="62" stroke="#60a5fa" fill="#3b82f6" fill-opacity="0.15"/>
    <line x1="28" y1="36" x2="28" y2="44" stroke="#e2e8f0" stroke-width="2"/>
    <line x1="72" y1="36" x2="72" y2="44" stroke="#e2e8f0" stroke-width="2"/>
  </svg>`;
}

/**
 * Cria uma fórmula padrão segura para tipologias importadas a partir de cortes
 */
export function buildFormulaFromCuts(
  cutsList: Array<{
    profileCode: string;
    description: string;
    quantity?: number;
    angleLeft?: 45 | 90 | -45;
    angleRight?: 45 | 90 | -45;
    formulaExpr?: string; // ex: "W", "H", "W - 30", "H - 45", "W / 2"
    machiningGuide?: string;
  }>
): TypologyFormula {
  const cuts = cutsList.map((c, idx) => {
    const expr = (c.formulaExpr || '').trim().toLowerCase();
    let fn: (w: number, h: number) => number;

    if (expr === 'w' || expr === 'largura') {
      fn = (w) => w;
    } else if (expr === 'h' || expr === 'altura') {
      fn = (_w, h) => h;
    } else if (expr.startsWith('w') || expr.startsWith('largura')) {
      const matchSub = expr.match(/[+-]\s*(\d+(\.\d+)?)/);
      const delta = matchSub ? parseFloat(matchSub[0].replace(/\s/g, '')) : 0;
      fn = (w) => Math.max(50, w + delta);
    } else if (expr.startsWith('h') || expr.startsWith('altura')) {
      const matchSub = expr.match(/[+-]\s*(\d+(\.\d+)?)/);
      const delta = matchSub ? parseFloat(matchSub[0].replace(/\s/g, '')) : 0;
      fn = (_w, h) => Math.max(50, h + delta);
    } else if (expr.includes('/ 2') || expr.includes('/2')) {
      fn = (w) => Math.max(50, Math.round(w / 2));
    } else {
      // Default: se a descrição sugerir altura ou marco lateral usa H, senão W
      const isHeight = c.description.toLowerCase().includes('lateral') || c.description.toLowerCase().includes('altura') || c.description.toLowerCase().includes('montante');
      fn = isHeight ? (_w, h) => h : (w) => w;
    }

    return {
      profileId: c.profileCode.toLowerCase(),
      profileCode: c.profileCode,
      description: c.description || `Componente ${idx + 1}`,
      quantity: c.quantity || 2,
      angleLeft: c.angleLeft || 90,
      angleRight: c.angleRight || 90,
      formula: fn,
      machiningGuide: c.machiningGuide || 'Usinagem padrão de montagem',
    };
  });

  return {
    cuts,
    glass: [
      {
        description: 'Vidro Padrão',
        quantity: 2,
        formulaW: (w) => Math.max(50, Math.round(w / 2 - 50)),
        formulaH: (_w, h) => Math.max(50, Math.round(h - 90)),
      },
    ],
    accessories: [],
  };
}

/**
 * Processa arquivos JSON (podem ser arrays de perfis ou objeto estruturado com perfis e tipologias)
 */
export function parseJsonCatalog(jsonText: string): CatalogParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(`JSON inválido: ${(err as Error).message}`);
  }

  let rawProfiles: Array<Record<string, unknown>> = [];
  const typologies: TypologyItem[] = [];
  let supplierName = 'Catálogo JSON Importado';

  if (Array.isArray(parsed)) {
    rawProfiles = parsed as Array<Record<string, unknown>>;
  } else if (typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.supplier === 'string') supplierName = obj.supplier;
    if (typeof obj.fornecedor === 'string') supplierName = obj.fornecedor;
    if (typeof obj.catalogo === 'string') supplierName = obj.catalogo;

    if (Array.isArray(obj.profiles)) {
      rawProfiles = obj.profiles as Array<Record<string, unknown>>;
    } else if (Array.isArray(obj.perfis)) {
      rawProfiles = obj.perfis as Array<Record<string, unknown>>;
    } else if (Array.isArray(obj.items)) {
      rawProfiles = obj.items as Array<Record<string, unknown>>;
    }

    // Suporte a tipologias no mesmo arquivo JSON
    const rawTypologies = Array.isArray(obj.typologies) ? obj.typologies : (Array.isArray(obj.tipologias) ? obj.tipologias : []);
    rawTypologies.forEach((t: any, idx: number) => {
      const code = t.code || t.codigo || `TYP-IMP-${idx + 1}`;
      const name = t.name || t.nome || `Tipologia ${code}`;
      const series = t.series || t.serie || 'Universal';
      const category = t.category || t.categoria || 'Janela de Correr';
      const description = t.description || t.descricao || `Tipologia importada do catálogo ${supplierName}`;

      let formula: TypologyFormula;
      if (t.cuts || t.cortes) {
        formula = buildFormulaFromCuts(t.cuts || t.cortes);
      } else {
        formula = {
          cuts: [],
          glass: [],
          accessories: [],
        };
      }

      typologies.push({
        id: `typ_${code.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_${Date.now()}_${idx}`,
        code,
        name,
        series,
        category,
        description,
        previewSvg: (t.previewSvg && t.previewSvg.includes('<svg')) ? t.previewSvg : generateDefaultTypologySvg(code, category),
        formula,
      });
    });
  }

  // Mapeamento automático dos campos dos perfis no JSON
  const headers = rawProfiles.length > 0 ? Object.keys(rawProfiles[0]) : [];
  const mapping = detectColumnMapping(headers);

  // Converte linhas JSON para Record<string, string>
  const stringifiedRows: Record<string, string>[] = rawProfiles.map((p) => {
    const row: Record<string, string> = {};
    Object.keys(p).forEach((k) => {
      row[k] = p[k] !== undefined && p[k] !== null ? String(p[k]) : '';
    });
    return row;
  });

  const profiles = mapRowsToProfiles(stringifiedRows, mapping, 'Universal', supplierName);

  const validCount = profiles.filter((p) => p.isValid).length;
  const errorCount = profiles.filter((p) => !p.isValid).length;
  const warningCount = profiles.filter((p) => p.isValid && p.validationErrors.length > 0).length;

  return {
    format: 'json',
    profiles,
    typologies,
    detectedMapping: mapping,
    totalRows: profiles.length,
    validCount,
    warningCount,
    errorCount,
    supplierName,
    rawHeaders: headers,
  };
}

/**
 * Ponto de entrada universal para processamento de arquivo bruto (CSV ou JSON)
 */
export function parseRawCatalogFile(content: string, filename?: string): CatalogParseResult {
  const trimmed = content.trim();
  const isJson = (filename && filename.toLowerCase().endsWith('.json')) || trimmed.startsWith('{') || trimmed.startsWith('[');

  if (isJson) {
    return parseJsonCatalog(trimmed);
  }

  // Parse CSV
  const { headers, rows } = parseCsvRows(trimmed);
  if (headers.length === 0) {
    throw new Error('Nenhuma coluna ou linha foi encontrada no arquivo CSV.');
  }

  const mapping = detectColumnMapping(headers);
  const supplierName = filename ? filename.replace(/\.[^/.]+$/, '') : 'Catálogo CSV Importado';
  const profiles = mapRowsToProfiles(rows, mapping, 'Universal', supplierName);

  const validCount = profiles.filter((p) => p.isValid).length;
  const errorCount = profiles.filter((p) => !p.isValid).length;
  const warningCount = profiles.filter((p) => p.isValid && p.validationErrors.length > 0).length;

  return {
    format: 'csv',
    profiles,
    typologies: [],
    detectedMapping: mapping,
    totalRows: profiles.length,
    validCount,
    warningCount,
    errorCount,
    supplierName,
    rawHeaders: headers,
  };
}

/**
 * Integra perfis importados à lista atual desduplicando por código
 */
export function integrateImportedProfiles(
  importedProfiles: ProfileImportRow[],
  currentProfiles: ProfileDefinition[]
): {
  updatedProfiles: ProfileDefinition[];
  addedCount: number;
  updatedCount: number;
} {
  const profileMap = new Map<string, ProfileDefinition>();
  currentProfiles.forEach((p) => profileMap.set(p.code.toUpperCase(), p));

  let addedCount = 0;
  let updatedCount = 0;

  for (const imp of importedProfiles) {
    const key = imp.code.toUpperCase();
    const existing = profileMap.get(key);

    const newDef: ProfileDefinition = {
      id: existing ? existing.id : imp.id,
      code: imp.code,
      name: imp.name,
      series: imp.series,
      category: imp.category,
      kgm: imp.kgm,
      defaultLength: imp.defaultLength,
      pricePerKg: imp.pricePerKg,
      machiningNote: imp.machiningNote || imp.cuttingAngles ? `${imp.cuttingAngles ? `[${imp.cuttingAngles}] ` : ''}${imp.machiningNote || ''}` : existing?.machiningNote,
      sourceCatalog: imp.sourceCatalog || existing?.sourceCatalog,
    };

    if (existing) {
      updatedCount++;
    } else {
      addedCount++;
    }

    profileMap.set(key, newDef);
  }

  return {
    updatedProfiles: Array.from(profileMap.values()),
    addedCount,
    updatedCount,
  };
}

/**
 * Salva tipologias importadas no localStorage para persistência permanente
 */
export function saveCustomTypologiesToStorage(newTypologies: TypologyItem[]): number {
  if (typeof localStorage === 'undefined' || newTypologies.length === 0) return 0;
  try {
    const STORAGE_KEY = 'sm_custom_typologies_v1';
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: TypologyItem[] = raw ? JSON.parse(raw) : [];

    const map = new Map<string, TypologyItem>();
    existing.forEach((t) => map.set(t.code, t));

    let added = 0;
    newTypologies.forEach((t) => {
      if (!map.has(t.code)) {
        added++;
      }
      map.set(t.code, t);
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(map.values())));
    return added;
  } catch (err) {
    console.error('Erro ao salvar tipologias:', err);
    return 0;
  }
}

/**
 * Gera um modelo padrão em CSV para download ou teste
 */
export function generateSampleCsv(): string {
  return [
    'Codigo;Descricao;Serie;Categoria;Dimensoes;Peso_kg_m;Custo_R$_kg;Cortes;Usinagem',
    'BEL-001;Marco Lateral 2 Planos;Belmetal 30;Marco;30x65mm;0,720;38,50;90° / 90°;Furação Ø5mm e drenos superiores',
    'BEL-002;Marco Superior 2 Planos;Belmetal 30;Marco;30x60mm;0,685;38,50;90° / 90°;Fixação nos cantos com parafuso inox',
    'BEL-003;Trilho Inferior 2 Planos c/ Dreno;Belmetal 30;Trilho;30x55mm;0,740;38,50;90° / 90°;Drenos oblongos 25x5mm',
    'BEL-053;Montante Lateral Folha Fecho;Belmetal 30;Montante;32x50mm;0,610;38,50;90° / 90°;Rasgo para fecho concha central',
    'BEL-054;Montante Mão de Amigo Central;Belmetal 30;Montante;32x52mm;0,640;38,50;90° / 90°;Encaixe para escova 5x5mm',
    'BEL-070;Travessa Superior Folha;Belmetal 30;Travessa;30x42mm;0,530;38,50;90° / 90°;Usinagem para roldanas e cantoneiras',
    'BEL-071;Travessa Inferior Folha Roldana;Belmetal 30;Travessa;30x48mm;0,560;38,50;90° / 90°;Alojamento para roldana blindada',
    'BEL-102;Baguete Reto de Pressão p/ Vidro 6mm;Belmetal 30;Baguate;12x14mm;0,165;38,50;45° / 45°;Encaixe de pressão frontal',
  ].join('\n');
}

/**
 * Gera um modelo completo em JSON com perfis e tipologia integrada
 */
export function generateSampleJson(): string {
  return JSON.stringify(
    {
      fornecedor: 'Hydro Alumínio Brasil - Catálogo 2026',
      versao: '2.4',
      perfis: [
        {
          codigo: 'HYD-101',
          nome: 'Marco Superior Perimetral 32mm',
          serie: 'Hydro Line',
          categoria: 'Marco',
          dimensoes: '32x70mm',
          kg_m: 0.81,
          preco_kg: 39.2,
          corte: '45° / 45°',
          usinagem: 'Canto meia-esquadria com cantoneira mecânica de aperto rápido',
        },
        {
          codigo: 'HYD-102',
          nome: 'Marco Inferior Soleira com Dreno Oculto',
          serie: 'Hydro Line',
          categoria: 'Trilho',
          dimensoes: '32x68mm',
          kg_m: 0.89,
          preco_kg: 39.2,
          corte: '45° / 45°',
          usinagem: 'Válvula de retenção de água e dreno inferior direcionado',
        },
        {
          codigo: 'HYD-120',
          nome: 'Montante Folha de Correr Acústico',
          serie: 'Hydro Line',
          categoria: 'Montante',
          dimensoes: '32x55mm',
          kg_m: 0.695,
          preco_kg: 39.2,
          corte: '90° / 90°',
          usinagem: 'Rasgo duplo para concha multiponto',
        },
        {
          codigo: 'HYD-130',
          nome: 'Travessa Folha de Correr Reforçada',
          serie: 'Hydro Line',
          categoria: 'Travessa',
          dimensoes: '32x50mm',
          kg_m: 0.63,
          preco_kg: 39.2,
          corte: '90° / 90°',
          usinagem: 'Furação de topo para encaixe mecânico',
        },
      ],
      tipologias: [
        {
          codigo: 'J-COR-2F-HYD',
          nome: 'Janela de Correr 2 Folhas Hydro Line 32mm',
          serie: 'Hydro Line',
          categoria: 'Janela de Correr',
          descricao: 'Esquadria de alto desempenho termoacústico com marco meia-esquadria e dreno oculto.',
          previewSvg: generateDefaultTypologySvg('J-COR-2F-HYD', 'Janela de Correr'),
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=85',
          cortes: [
            {
              profileCode: 'HYD-101',
              description: 'Marco Superior',
              formulaExpr: 'W',
              angleLeft: 45,
              angleRight: 45,
              quantity: 1,
              machiningGuide: 'Corte meia-esquadria nas duas extremidades',
            },
            {
              profileCode: 'HYD-102',
              description: 'Trilho Inferior c/ Dreno',
              formulaExpr: 'W',
              angleLeft: 45,
              angleRight: 45,
              quantity: 1,
              machiningGuide: 'Drenos direcionados com válvula antifluxo',
            },
            {
              profileCode: 'HYD-120',
              description: 'Montante Lateral Folhas',
              formulaExpr: 'H - 42',
              angleLeft: 90,
              angleRight: 90,
              quantity: 4,
              machiningGuide: 'Rasgo de fecho e furação de topo',
            },
            {
              profileCode: 'HYD-130',
              description: 'Travessas Superior/Inferior Folhas',
              formulaExpr: 'W / 2 + 10',
              angleLeft: 90,
              angleRight: 90,
              quantity: 4,
              machiningGuide: 'Encaixe de roldanas duplas',
            },
          ],
        },
      ],
    },
    null,
    2
  );
}
