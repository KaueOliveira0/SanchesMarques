/**
 * Otimizador 2D de Planos de Corte para Chapas de Vidro (Vidraçaria & Esquadrias)
 * Algoritmo industrial Guillotine 2D Bin Packing (Cortes de Guilhotina Ponta a Ponta)
 * Sanches & Marques Esquadrias de Alumínio e Vidraçaria
 */

import { Order, TypologyItem } from '../types';
import { getGlassDimensionsForWindow } from './glassCalculator';

export interface GlassSheetPreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  description: string;
}

export const GLASS_SHEET_PRESETS: GlassSheetPreset[] = [
  {
    id: 'jumbo',
    name: 'Chapa Jumbo (3210 × 2250 mm)',
    widthMm: 3210,
    heightMm: 2250,
    description: 'Padrão industrial para vidros float e laminados de grande porte',
  },
  {
    id: 'comercial',
    name: 'Chapa Padrão Comercial (2200 × 1600 mm)',
    widthMm: 2200,
    heightMm: 1600,
    description: 'Tamanho padrão de distribuidoras para corte manual e automático',
  },
  {
    id: 'box_medio',
    name: 'Chapa Box & Portas (2400 × 1800 mm)',
    widthMm: 2400,
    heightMm: 1800,
    description: 'Otimizada para portas de correr e boxes até 2.20m',
  },
  {
    id: 'chapa_media',
    name: 'Chapa Compacta (2000 × 1500 mm)',
    widthMm: 2000,
    heightMm: 1500,
    description: 'Ideal para vidros menores e oficinas com mesa de corte compacta',
  },
];

export interface GlassCutPieceInput {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  allowRotation: boolean;
  orderNumber?: number;
  clientName?: string;
  roomTag?: string;
  glassType?: string;
  colorFinish?: string;
}

export interface PlacedGlassPiece {
  id: string;
  pieceId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  orderNumber?: number;
  clientName?: string;
  roomTag?: string;
  glassType?: string;
  colorFinish?: string;
  colorCode: string; // Cor hex para diferenciar pedidos no mapa de corte
}

export interface GlassRemnantRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isUseful: boolean; // se é retalho aproveitável para estoque
}

export interface CutStep2D {
  stepNumber: number;
  orientation: 'horizontal' | 'vertical';
  coordinate: number;
  length: number;
  description: string;
}

export interface OptimizedGlassSheet {
  sheetIndex: number;
  sheetWidth: number;
  sheetHeight: number;
  usableWidth: number;
  usableHeight: number;
  placedPieces: PlacedGlassPiece[];
  remnants: GlassRemnantRect[];
  cutSteps: CutStep2D[];
  sheetAreaM2: number;
  usedAreaM2: number;
  usefulRemnantAreaM2: number;
  scrapAreaM2: number;
  utilizationPct: number;
}

export interface GlassOptimizationOptions {
  sheetWidthMm: number;
  sheetHeightMm: number;
  edgeTrimMm: number; // refilo de borda da chapa bruta (geralmente 10-15mm)
  kerfMm: number; // espessura do corte da roldana diamantada (ex: 2-3mm)
  allowGlobalRotation: boolean;
  minUsefulRemnantWidthMm: number; // ex: 350mm
  minUsefulRemnantHeightMm: number; // ex: 350mm
  splitStrategy: 'shorter_axis' | 'longer_axis' | 'min_area';
}

export const DEFAULT_GLASS_OPTIONS: GlassOptimizationOptions = {
  sheetWidthMm: 2200,
  sheetHeightMm: 1600,
  edgeTrimMm: 10,
  kerfMm: 3,
  allowGlobalRotation: true,
  minUsefulRemnantWidthMm: 350,
  minUsefulRemnantHeightMm: 350,
  splitStrategy: 'min_area',
};

export interface GlassOptimizationResult {
  sheets: OptimizedGlassSheet[];
  totalSheets: number;
  totalPiecesRequested: number;
  totalPiecesPlaced: number;
  unplacedPieces: GlassCutPieceInput[];
  totalSheetAreaM2: number;
  totalUsedAreaM2: number;
  totalRemnantAreaM2: number;
  totalScrapAreaM2: number;
  overallUtilizationPct: number;
  executionTimeMs: number;
}

// Cores harmônicas para identificação no mapa de corte 2D
const PALETTE_COLORS = [
  '#0284c7', // sky-600
  '#0d9488', // teal-600
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
];

interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Executa a otimização de corte 2D de chapas de vidro por guilhotina (Guillotine Cutting Stock).
 */
export function optimizeGlassCutting(
  piecesInput: GlassCutPieceInput[],
  options: GlassOptimizationOptions = DEFAULT_GLASS_OPTIONS
): GlassOptimizationResult {
  const startTime = Date.now();

  const usableWidth = Math.max(100, options.sheetWidthMm - 2 * options.edgeTrimMm);
  const usableHeight = Math.max(100, options.sheetHeightMm - 2 * options.edgeTrimMm);
  const kerf = options.kerfMm;

  // Mapa de cores por número de pedido ou ID
  const orderColorMap = new Map<string, string>();
  let colorIdx = 0;

  const getColorForPiece = (p: GlassCutPieceInput): string => {
    const key = p.orderNumber ? `OP-${p.orderNumber}` : p.clientName || p.id;
    if (!orderColorMap.has(key)) {
      orderColorMap.set(key, PALETTE_COLORS[colorIdx % PALETTE_COLORS.length]);
      colorIdx++;
    }
    return orderColorMap.get(key)!;
  };

  // Expande peças com quantidade > 1
  interface SinglePiece {
    original: GlassCutPieceInput;
    instanceIndex: number;
    w: number;
    h: number;
    area: number;
    allowRotation: boolean;
  }

  const individualPieces: SinglePiece[] = [];
  let totalRequested = 0;

  piecesInput.forEach((p) => {
    const qty = Math.max(1, Math.floor(p.quantity));
    totalRequested += qty;
    for (let i = 0; i < qty; i++) {
      individualPieces.push({
        original: p,
        instanceIndex: i + 1,
        w: p.widthMm,
        h: p.heightMm,
        area: p.widthMm * p.heightMm,
        allowRotation: options.allowGlobalRotation && p.allowRotation,
      });
    }
  });

  // Ordena por maior área e maior lado (First Fit Decreasing / Best Fit Decreasing)
  individualPieces.sort((a, b) => {
    if (b.area !== a.area) return b.area - a.area;
    return Math.max(b.w, b.h) - Math.max(a.w, a.h);
  });

  const sheets: OptimizedGlassSheet[] = [];
  const unplacedList: GlassCutPieceInput[] = [];

  const unplacedSingles: SinglePiece[] = [];

  // Otimiza chapa por chapa
  let remainingPieces = [...individualPieces];

  while (remainingPieces.length > 0) {
    // Nova chapa
    let freeRects: FreeRect[] = [
      {
        x: options.edgeTrimMm,
        y: options.edgeTrimMm,
        width: usableWidth,
        height: usableHeight,
      },
    ];

    const placedThisSheet: PlacedGlassPiece[] = [];
    const notPlacedThisSheet: SinglePiece[] = [];
    const cutSteps: CutStep2D[] = [];
    let stepCount = 1;

    for (const piece of remainingPieces) {
      let bestRectIndex = -1;
      let bestFitScore = Number.MAX_SAFE_INTEGER;
      let chosenRotated = false;
      let chosenW = piece.w;
      let chosenH = piece.h;

      // Busca o melhor retângulo livre (Best Short Side Fit)
      for (let i = 0; i < freeRects.length; i++) {
        const fr = freeRects[i];

        // Sem rotação
        if (piece.w <= fr.width && piece.h <= fr.height) {
          const leftoverW = fr.width - piece.w;
          const leftoverH = fr.height - piece.h;
          const shortSideFit = Math.min(leftoverW, leftoverH);

          if (shortSideFit < bestFitScore) {
            bestFitScore = shortSideFit;
            bestRectIndex = i;
            chosenRotated = false;
            chosenW = piece.w;
            chosenH = piece.h;
          }
        }

        // Com rotação (se permitida)
        if (piece.allowRotation && piece.h <= fr.width && piece.w <= fr.height) {
          const leftoverW = fr.width - piece.h;
          const leftoverH = fr.height - piece.w;
          const shortSideFit = Math.min(leftoverW, leftoverH);

          if (shortSideFit < bestFitScore) {
            bestFitScore = shortSideFit;
            bestRectIndex = i;
            chosenRotated = true;
            chosenW = piece.h;
            chosenH = piece.w;
          }
        }
      }

      if (bestRectIndex >= 0) {
        // Encontrou espaço! Posiciona a peça
        const targetRect = freeRects[bestRectIndex];
        freeRects.splice(bestRectIndex, 1);

        placedThisSheet.push({
          id: `${piece.original.id}_${piece.instanceIndex}`,
          pieceId: piece.original.id,
          label: piece.original.quantity > 1 ? `${piece.original.label} #${piece.instanceIndex}` : piece.original.label,
          x: targetRect.x,
          y: targetRect.y,
          width: chosenW,
          height: chosenH,
          rotated: chosenRotated,
          orderNumber: piece.original.orderNumber,
          clientName: piece.original.clientName,
          roomTag: piece.original.roomTag,
          glassType: piece.original.glassType,
          colorFinish: piece.original.colorFinish,
          colorCode: getColorForPiece(piece.original),
        });

        // Guilhotina: Divide o retângulo restante em 2 sub-retângulos limpos
        const remainingW = targetRect.width - chosenW - kerf;
        const remainingH = targetRect.height - chosenH - kerf;

        let rectA: FreeRect | null = null;
        let rectB: FreeRect | null = null;

        // Estratégia de corte de guilhotina:
        // Divisão Horizontal ou Vertical para maximizar retalhos úteis
        const splitHorizArea = (remainingW > 0 ? remainingW * chosenH : 0) + (remainingH > 0 ? targetRect.width * remainingH : 0);
        const splitVertArea = (remainingH > 0 ? chosenW * remainingH : 0) + (remainingW > 0 ? remainingW * targetRect.height : 0);

        let useHorizontalCut = true;
        if (options.splitStrategy === 'min_area') {
          useHorizontalCut = splitHorizArea >= splitVertArea;
        } else if (options.splitStrategy === 'shorter_axis') {
          useHorizontalCut = remainingW <= remainingH;
        } else {
          useHorizontalCut = remainingW > remainingH;
        }

        if (useHorizontalCut) {
          // Corte horizontal primeiro
          if (remainingW > 0) {
            rectA = {
              x: targetRect.x + chosenW + kerf,
              y: targetRect.y,
              width: remainingW,
              height: chosenH,
            };
          }
          if (remainingH > 0) {
            rectB = {
              x: targetRect.x,
              y: targetRect.y + chosenH + kerf,
              width: targetRect.width,
              height: remainingH,
            };
          }
        } else {
          // Corte vertical primeiro
          if (remainingH > 0) {
            rectA = {
              x: targetRect.x,
              y: targetRect.y + chosenH + kerf,
              width: chosenW,
              height: remainingH,
            };
          }
          if (remainingW > 0) {
            rectB = {
              x: targetRect.x + chosenW + kerf,
              y: targetRect.y,
              width: remainingW,
              height: targetRect.height,
            };
          }
        }

        if (rectA && rectA.width > 0 && rectA.height > 0) freeRects.push(rectA);
        if (rectB && rectB.width > 0 && rectB.height > 0) freeRects.push(rectB);

        // Registra passos de corte da guilhotina
        cutSteps.push({
          stepNumber: stepCount++,
          orientation: chosenW < chosenH ? 'vertical' : 'horizontal',
          coordinate: targetRect.x + chosenW,
          length: chosenH,
          description: `Corte ${chosenW}×${chosenH}mm (${piece.original.label})`,
        });
      } else {
        notPlacedThisSheet.push(piece);
      }
    }

    // Se nenhuma peça coube na chapa vazia, são peças grandes demais para esta chapa
    if (placedThisSheet.length === 0) {
      unplacedSingles.push(...remainingPieces);
      break;
    }

    // Avalia sobras e retalhos
    const remnants: GlassRemnantRect[] = freeRects
      .filter((r) => r.width > 5 && r.height > 5)
      .map((r, idx) => {
        const isUseful =
          r.width >= options.minUsefulRemnantWidthMm &&
          r.height >= options.minUsefulRemnantHeightMm;
        return {
          id: `rem_${sheets.length + 1}_${idx + 1}`,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          isUseful,
        };
      });

    // Métricas da chapa
    const sheetAreaM2 = (options.sheetWidthMm * options.sheetHeightMm) / 1000000;
    const usedAreaM2 = placedThisSheet.reduce((acc, p) => acc + (p.width * p.height) / 1000000, 0);
    const usefulRemnantAreaM2 = remnants
      .filter((r) => r.isUseful)
      .reduce((acc, r) => acc + (r.width * r.height) / 1000000, 0);
    const scrapAreaM2 = Math.max(0, sheetAreaM2 - usedAreaM2 - usefulRemnantAreaM2);
    const utilizationPct = sheetAreaM2 > 0 ? (usedAreaM2 / sheetAreaM2) * 100 : 0;

    sheets.push({
      sheetIndex: sheets.length + 1,
      sheetWidth: options.sheetWidthMm,
      sheetHeight: options.sheetHeightMm,
      usableWidth,
      usableHeight,
      placedPieces: placedThisSheet,
      remnants,
      cutSteps,
      sheetAreaM2: Math.round(sheetAreaM2 * 1000) / 1000,
      usedAreaM2: Math.round(usedAreaM2 * 1000) / 1000,
      usefulRemnantAreaM2: Math.round(usefulRemnantAreaM2 * 1000) / 1000,
      scrapAreaM2: Math.round(scrapAreaM2 * 1000) / 1000,
      utilizationPct: Math.round(utilizationPct * 10) / 10,
    });

    remainingPieces = notPlacedThisSheet;
  }

  // Agrupa peças não alocadas
  const unplacedMap = new Map<string, GlassCutPieceInput>();
  unplacedSingles.forEach((s) => {
    if (!unplacedMap.has(s.original.id)) {
      unplacedMap.set(s.original.id, {
        ...s.original,
        quantity: 1,
      });
    } else {
      const cur = unplacedMap.get(s.original.id)!;
      cur.quantity += 1;
    }
  });

  unplacedList.push(...Array.from(unplacedMap.values()));

  const totalSheets = sheets.length;
  const totalPiecesPlaced = sheets.reduce((acc, s) => acc + s.placedPieces.length, 0);
  const totalSheetAreaM2 = sheets.reduce((acc, s) => acc + s.sheetAreaM2, 0);
  const totalUsedAreaM2 = sheets.reduce((acc, s) => acc + s.usedAreaM2, 0);
  const totalRemnantAreaM2 = sheets.reduce((acc, s) => acc + s.usefulRemnantAreaM2, 0);
  const totalScrapAreaM2 = sheets.reduce((acc, s) => acc + s.scrapAreaM2, 0);
  const overallUtilizationPct = totalSheetAreaM2 > 0 ? (totalUsedAreaM2 / totalSheetAreaM2) * 100 : 0;

  return {
    sheets,
    totalSheets,
    totalPiecesRequested: totalRequested,
    totalPiecesPlaced,
    unplacedPieces: unplacedList,
    totalSheetAreaM2: Math.round(totalSheetAreaM2 * 100) / 100,
    totalUsedAreaM2: Math.round(totalUsedAreaM2 * 100) / 100,
    totalRemnantAreaM2: Math.round(totalRemnantAreaM2 * 100) / 100,
    totalScrapAreaM2: Math.round(totalScrapAreaM2 * 100) / 100,
    overallUtilizationPct: Math.round(overallUtilizationPct * 10) / 10,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Extrai automaticamente todas as peças de vidro dos pedidos em produção ou aprovados.
 */
export function extractGlassPiecesFromOrders(
  orders: Order[],
  typologies: TypologyItem[],
  statusFilter: Array<Order['status']> = ['Aprovado', 'Em Produção']
): GlassCutPieceInput[] {
  const pieces: GlassCutPieceInput[] = [];

  const validOrders = orders.filter((o) => statusFilter.includes(o.status));

  validOrders.forEach((order) => {
    order.items.forEach((item, itemIdx) => {
      const typology = typologies.find((t) => t.id === item.typologyId);
      if (!typology) return;

      const glassDims = getGlassDimensionsForWindow(item.width, item.height, typology);
      if (glassDims.widthMm <= 0 || glassDims.heightMm <= 0) return;

      const totalQty = glassDims.quantityPerItem * item.quantity;
      const glassLabel = item.glassType || item.glassId || 'Vidro Incolor 4mm';

      const orderNum = order.number;
      pieces.push({
        id: `ord_${orderNum}_item_${itemIdx}_glass`,
        label: `${item.roomTag || typology.name} (${item.width}×${item.height})`,
        widthMm: glassDims.widthMm,
        heightMm: glassDims.heightMm,
        quantity: totalQty,
        allowRotation: true,
        orderNumber: orderNum,
        clientName: order.clientName,
        roomTag: item.roomTag,
        glassType: glassLabel,
        colorFinish: item.color,
      });
    });
  });

  return pieces;
}
