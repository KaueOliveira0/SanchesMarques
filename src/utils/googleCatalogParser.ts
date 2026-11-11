/**
 * Utilitário de Processamento e Conversão de Catálogos do Google Drive, Google Sheets e Documentos
 * Sanches & Marques ERP/PCP - Padrão Industrial
 */

import { ProfileDefinition, AccessoryDefinition } from '../types';

export interface GoogleDriveUrlDetails {
  originalUrl: string;
  normalizedUrl: string;
  serviceType: 'drive_file' | 'google_sheets' | 'google_docs' | 'direct_web_url' | 'unknown';
  fileId?: string;
  directDownloadUrl: string;
}

export interface ExtractedCatalogData {
  supplierName: string;
  catalogTitle: string;
  detectedSeries: string;
  profiles: Array<{
    id?: string;
    code: string;
    name: string;
    series: string;
    category: string;
    kgm: number;
    pricePerKg?: number;
    dimensions?: string;
    machiningNote?: string;
    defaultLength?: number;
    isValid?: boolean;
    validationErrors?: string[];
  }>;
  accessories: Array<{
    id?: string;
    code: string;
    name: string;
    category: string;
    unit: 'un' | 'm' | 'par' | 'kit';
    price?: number;
    description?: string;
    isValid?: boolean;
    validationErrors?: string[];
  }>;
}

/**
 * Converte links compartilhados do Google Drive, Google Sheets e Google Docs em URLs diretas de download/exportação
 */
export function normalizeGoogleDriveUrl(rawUrl: string): GoogleDriveUrlDetails {
  const url = (rawUrl || '').trim();

  // 1. Google Sheets: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
  const sheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetsMatch && sheetsMatch[1]) {
    const fileId = sheetsMatch[1];
    return {
      originalUrl: url,
      normalizedUrl: `https://docs.google.com/spreadsheets/d/${fileId}`,
      serviceType: 'google_sheets',
      fileId,
      directDownloadUrl: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`,
    };
  }

  // 2. Google Docs: https://docs.google.com/document/d/DOC_ID/edit...
  const docsMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch && docsMatch[1]) {
    const fileId = docsMatch[1];
    return {
      originalUrl: url,
      normalizedUrl: `https://docs.google.com/document/d/${fileId}`,
      serviceType: 'google_docs',
      fileId,
      directDownloadUrl: `https://docs.google.com/document/d/${fileId}/export?format=txt`,
    };
  }

  // 3. Google Drive File: https://drive.google.com/file/d/FILE_ID/view... ou /open?id=FILE_ID
  const driveFileMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    const fileId = driveFileMatch[1];
    return {
      originalUrl: url,
      normalizedUrl: `https://drive.google.com/file/d/${fileId}`,
      serviceType: 'drive_file',
      fileId,
      directDownloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    };
  }

  // 4. Link web padrão ou direto
  const isDirectWeb = url.startsWith('http://') || url.startsWith('https://');
  return {
    originalUrl: url,
    normalizedUrl: url,
    serviceType: isDirectWeb ? 'direct_web_url' : 'unknown',
    directDownloadUrl: url,
  };
}

/**
 * Heurística de extração local para linhas de perfis em texto
 * Exemplo: "SU-001 Marco Superior 2 Planos 0,684 kg/m R$ 34,50"
 */
export function extractProfilesFromTextHeuristic(
  text: string,
  defaultSeries: string = 'Universal',
  supplier: string = 'Catálogo Importado'
): ExtractedCatalogData['profiles'] {
  const lines = text.split(/\r?\n/);
  const profiles: ExtractedCatalogData['profiles'] = [];

  // Padrão de código de perfil (ex: SU-001, GL-002, CHR-020, MN-053, MP-340, AL-100, etc.)
  const codeRegex = /\b([A-Z]{1,4}[-_]?[0-9]{2,4}[A-Z]?)\b/i;
  // Padrão de peso (ex: 0,684 ou 0.684 ou 1,250 kg/m ou kgm)
  const weightRegex = /(\d+[.,]\d{2,4})\s*(?:kg\/m|kgm|kg)?/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.length < 5) continue;

    const codeMatch = line.match(codeRegex);
    if (!codeMatch) continue;

    const code = codeMatch[1].toUpperCase();

    // Extrai peso se existir
    let kgm = 0.65; // fallback razoável
    const weightMatch = line.match(weightRegex);
    if (weightMatch) {
      const parsedWeight = parseFloat(weightMatch[1].replace(',', '.'));
      if (parsedWeight > 0.05 && parsedWeight < 15.0) {
        kgm = parsedWeight;
      }
    }

    // Limpa código e números para achar o nome
    let name = line
      .replace(codeMatch[0], '')
      .replace(weightRegex, '')
      .replace(/r\$\s*[\d.,]+/gi, '')
      .replace(/[|;\t]+/g, ' ')
      .trim();

    if (!name || name.length < 3) {
      name = `Perfil ${code}`;
    }

    // Dedução de categoria
    let category = 'Outros';
    const lower = `${name} ${code}`.toLowerCase();
    if (lower.includes('trilho')) category = 'Trilho';
    else if (lower.includes('marco')) category = 'Marco';
    else if (lower.includes('folha') || lower.includes('montante')) category = 'Folha';
    else if (lower.includes('travessa')) category = 'Travessa';
    else if (lower.includes('baguete') || lower.includes('baguate')) category = 'Baguate';
    else if (lower.includes('arremate')) category = 'Arremate';
    else if (lower.includes('contramarco')) category = 'Contramarco';

    // Dedução de linha
    let series = defaultSeries;
    if (code.startsWith('SU') || lower.includes('suprema')) series = 'Suprema';
    else if (code.startsWith('GL') || lower.includes('gold')) series = 'Gold';
    else if (code.startsWith('CHR') || lower.includes('chroma') || lower.includes('minimal')) series = 'Chroma';
    else if (code.startsWith('L25') || lower.includes('linha 25')) series = 'Linha 25';
    else if (code.startsWith('L30') || lower.includes('linha 30')) series = 'Linha 30';

    profiles.push({
      code,
      name,
      series,
      category,
      kgm,
      pricePerKg: 35.0,
      defaultLength: 6000,
      isValid: true,
      validationErrors: [],
    });
  }

  // Deduplicação por código
  const uniqueMap = new Map<string, ExtractedCatalogData['profiles'][0]>();
  for (const p of profiles) {
    if (!uniqueMap.has(p.code)) {
      uniqueMap.set(p.code, p);
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Heurística de extração local para acessórios e peças em texto
 * Exemplo: "ROL-01 Roldana Dupla com Rolamento Nylon par R$ 24,00"
 */
export function extractAccessoriesFromTextHeuristic(text: string): ExtractedCatalogData['accessories'] {
  const lines = text.split(/\r?\n/);
  const accessories: ExtractedCatalogData['accessories'] = [];

  const accessoryKeywords = [
    'roldana', 'fecho', 'fechadura', 'puxador', 'concha', 'cremona',
    'escova', 'vedacao', 'guarnicao', 'epdm', 'borracha', 'parafuso',
    'braco', 'dobradica', 'cantoneira', 'bucha', 'rebite', 'silicone'
  ];

  const codeRegex = /\b([A-Z0-9]{2,8}[-_]?[A-Z0-9]{2,8})\b/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();
    const hasKeyword = accessoryKeywords.some((kw) => lower.includes(kw));
    if (!hasKeyword) continue;

    const codeMatch = line.match(codeRegex);
    const code = codeMatch ? codeMatch[1].toUpperCase() : `ACC-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Categoria
    let category = 'Outros';
    if (lower.includes('roldana')) category = 'Roldana';
    else if (lower.includes('fecho') || lower.includes('concha') || lower.includes('cremona')) category = 'Fecho';
    else if (lower.includes('fechadura')) category = 'Fechadura';
    else if (lower.includes('puxador')) category = 'Puxador';
    else if (lower.includes('escova') || lower.includes('guarnicao') || lower.includes('epdm') || lower.includes('vedacao')) category = 'Vedação';
    else if (lower.includes('parafuso') || lower.includes('rebite') || lower.includes('bucha')) category = 'Parafusos';
    else if (lower.includes('braco')) category = 'Braço';

    // Unidade
    let unit: 'un' | 'm' | 'par' | 'kit' = 'un';
    if (lower.includes('par') || category === 'Roldana') unit = 'par';
    else if (lower.includes('/m') || lower.includes('metro') || category === 'Vedação') unit = 'm';
    else if (lower.includes('kit') || lower.includes('jogo')) unit = 'kit';

    // Preço
    let price = 20.0;
    const priceMatch = line.match(/r\$\s*([\d.,]+)/i);
    if (priceMatch) {
      const parsed = parseFloat(priceMatch[1].replace(',', '.'));
      if (parsed > 0) price = parsed;
    }

    accessories.push({
      code,
      name: line.replace(/[|;\t]+/g, ' ').slice(0, 70),
      category,
      unit,
      price,
      isValid: true,
      validationErrors: [],
    });
  }

  const unique = new Map<string, ExtractedCatalogData['accessories'][0]>();
  for (const acc of accessories) {
    if (!unique.has(acc.code)) {
      unique.set(acc.code, acc);
    }
  }

  return Array.from(unique.values());
}
