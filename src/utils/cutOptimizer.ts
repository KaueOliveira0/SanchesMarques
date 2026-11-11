import { CutPiece, CutBarPlan, Order, StockProfile } from '../types';
import { TYPOLOGIES_CATALOG, PROFILES_CATALOG } from '../data/catalog';

export interface OptimizationOptions {
  sawBladeKerfMm: number;
  clampMarginMm: number;
  standardBarLengthMm: number;
  minReusableRemnantMm: number;
  useStockRemnants?: boolean;
}

export const DEFAULT_OPTIMIZATION_OPTIONS: OptimizationOptions = {
  sawBladeKerfMm: 4,
  clampMarginMm: 15,
  standardBarLengthMm: 6000,
  minReusableRemnantMm: 600,
  useStockRemnants: true,
};

export interface OptimizationResult {
  pieces: CutPiece[];
  bars: CutBarPlan[];
  totalBars6m: number;
  totalRemnantsUsed: number;
  overallEfficiencyPercent: number;
  totalScrapKg: number;
  totalLengthCutMm: number;
  totalWeightAluminumKg: number;
  newRemnantsToStock: Array<{ profileCode: string; color: string; lengthMm: number }>;
  reusableRemnantsCount: number;
  scrapLossKg: number;
  totalPieces: number;
  totalWasteMm: number;
}

export const extractPiecesFromOrders = (orders: Order[]): CutPiece[] => {
  const pieces: CutPiece[] = [];

  for (const order of orders) {
    for (const item of order.items) {
      const typo = TYPOLOGIES_CATALOG.find((t) => t.id === item.typologyId);
      if (!typo) continue;

      for (const cut of typo.formula.cuts) {
        const prof = PROFILES_CATALOG.find(
          (p) => p.id === cut.profileId || p.code === cut.profileCode
        );
        const length = cut.formula(item.width, item.height);
        const totalQty = cut.quantity * item.quantity;

        for (let i = 0; i < totalQty; i++) {
          pieces.push({
            id: `cut_${order.number}_${cut.profileCode}_${pieces.length + 1}`,
            orderNumber: order.number,
            itemTag: `${item.location} (#${i + 1})`,
            profileCode: cut.profileCode,
            profileName: prof?.name || cut.description,
            length: Math.round(length),
            angleLeft: cut.angleLeft,
            angleRight: cut.angleRight,
            description: cut.description,
            color: item.color || order.color,
            barcode: `${order.number}-${cut.profileCode}-${Math.round(length)}-${i + 1}`,
          });
        }
      }
    }
  }

  return pieces;
};

export const optimizeCutList = (
  pieces: CutPiece[],
  stockProfiles: StockProfile[] = [],
  optionsInput: Partial<OptimizationOptions> = {}
): OptimizationResult => {
  const options = { ...DEFAULT_OPTIMIZATION_OPTIONS, ...optionsInput };
  const kerf = options.sawBladeKerfMm;
  const trim = options.clampMarginMm;
  const standardBarLength = options.standardBarLengthMm;
  const minReusableMm = options.minReusableRemnantMm;

  // Agrupar peças por Perfil e Cor
  const groups = new Map<string, CutPiece[]>();
  for (const piece of pieces) {
    const key = `${piece.profileCode}|${piece.color}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(piece);
  }

  const allBars: CutBarPlan[] = [];
  const newRemnantsToStock: Array<{ profileCode: string; color: string; lengthMm: number }> = [];
  let total6m = 0;
  let totalRemnants = 0;
  let totalUsableLength = 0;
  let totalCutLength = 0;
  let totalScrapWeightKg = 0;
  let totalAlumWeightKg = 0;

  for (const [key, groupPieces] of groups.entries()) {
    const [profileCode, color] = key.split('|');
    const stock = stockProfiles.find((s) => s.code === profileCode && s.color === color);
    const profDef = PROFILES_CATALOG.find((p) => p.code === profileCode);
    const kgm = stock?.kgm || profDef?.kgm || 0.65;

    // Ordenar peças em ordem decrescente (First-Fit Decreasing)
    const sorted = [...groupPieces].sort((a, b) => b.length - a.length);

    // Sobras disponíveis no estoque
    const availableRemnants =
      options.useStockRemnants && stock?.remnants
        ? [...stock.remnants].sort((a, b) => a.lengthMm - b.lengthMm)
        : [];

    const remainingPieces = [...sorted];

    // Passo 1: Tentar encaixar peças em sobras (remnants)
    for (const rem of availableRemnants) {
      if (remainingPieces.length === 0) break;

      let currentUsable = rem.lengthMm - trim;
      const barPieces: CutPiece[] = [];
      const cutsPositions: Array<{
        piece: CutPiece;
        startPosition: number;
        length: number;
        kerf: number;
        pieceId: string;
        orderNumber: number;
        lengthMm: number;
        startMm: number;
        endMm: number;
        angleLeft: number;
        angleRight: number;
        description: string;
      }> = [];

      let currentPos = trim;
      let piecePlaced = false;

      for (let i = 0; i < remainingPieces.length; i++) {
        const piece = remainingPieces[i];
        const needed = piece.length + kerf;

        if (needed <= currentUsable) {
          barPieces.push(piece);
          cutsPositions.push({
            piece,
            startPosition: currentPos,
            length: piece.length,
            kerf,
            pieceId: piece.id,
            orderNumber: piece.orderNumber,
            lengthMm: piece.length,
            startMm: currentPos,
            endMm: currentPos + piece.length,
            angleLeft: piece.angleLeft,
            angleRight: piece.angleRight,
            description: piece.description,
          });

          currentPos += piece.length + kerf;
          currentUsable -= needed;
          remainingPieces.splice(i, 1);
          i--;
          piecePlaced = true;
        }
      }

      if (piecePlaced) {
        const scrapMm = Math.max(0, currentUsable);
        const efficiency = ((rem.lengthMm - scrapMm) / rem.lengthMm) * 100;

        allBars.push({
          id: `bar_rem_${allBars.length + 1}`,
          barIndex: allBars.length + 1,
          barNumber: allBars.length + 1,
          profileCode,
          profileName: profDef?.name || profileCode,
          color: color as any,
          initialLength: rem.lengthMm,
          barLengthMm: rem.lengthMm,
          isRemnant: true,
          pieces: barPieces,
          cuts: cutsPositions,
          usedLength: rem.lengthMm - scrapMm,
          wasteLength: scrapMm,
          scrapMm,
          efficiencyPercent: Math.round(efficiency * 10) / 10,
          canStockRemnant: scrapMm >= minReusableMm,
        });

        totalRemnants++;
        totalUsableLength += rem.lengthMm;
        totalCutLength += rem.lengthMm - scrapMm;
        totalScrapWeightKg += (scrapMm / 1000) * kgm;
        totalAlumWeightKg += (rem.lengthMm / 1000) * kgm;
      }
    }

    // Passo 2: Peças restantes em barras novas de 6000mm
    while (remainingPieces.length > 0) {
      let currentUsable = standardBarLength - trim;
      let currentPos = trim;
      const barPieces: CutPiece[] = [];
      const cutsPositions: Array<{
        piece: CutPiece;
        startPosition: number;
        length: number;
        kerf: number;
        pieceId: string;
        orderNumber: number;
        lengthMm: number;
        startMm: number;
        endMm: number;
        angleLeft: number;
        angleRight: number;
        description: string;
      }> = [];

      for (let i = 0; i < remainingPieces.length; i++) {
        const piece = remainingPieces[i];
        const needed = piece.length + kerf;

        if (needed <= currentUsable) {
          barPieces.push(piece);
          cutsPositions.push({
            piece,
            startPosition: currentPos,
            length: piece.length,
            kerf,
            pieceId: piece.id,
            orderNumber: piece.orderNumber,
            lengthMm: piece.length,
            startMm: currentPos,
            endMm: currentPos + piece.length,
            angleLeft: piece.angleLeft,
            angleRight: piece.angleRight,
            description: piece.description,
          });

          currentPos += piece.length + kerf;
          currentUsable -= needed;
          remainingPieces.splice(i, 1);
          i--;
        }
      }

      const scrapMm = Math.max(0, currentUsable);
      const efficiency = ((standardBarLength - scrapMm) / standardBarLength) * 100;

      if (scrapMm >= minReusableMm) {
        newRemnantsToStock.push({
          profileCode,
          color,
          lengthMm: scrapMm,
        });
      }

      allBars.push({
        id: `bar_6m_${allBars.length + 1}`,
        barIndex: allBars.length + 1,
        barNumber: allBars.length + 1,
        profileCode,
        profileName: profDef?.name || profileCode,
        color: color as any,
        initialLength: standardBarLength,
        barLengthMm: standardBarLength,
        isRemnant: false,
        pieces: barPieces,
        cuts: cutsPositions,
        usedLength: standardBarLength - scrapMm,
        wasteLength: scrapMm,
        scrapMm,
        efficiencyPercent: Math.round(efficiency * 10) / 10,
        canStockRemnant: scrapMm >= minReusableMm,
      });

      total6m++;
      totalUsableLength += standardBarLength;
      totalCutLength += standardBarLength - scrapMm;
      totalScrapWeightKg += (scrapMm / 1000) * kgm;
      totalAlumWeightKg += (standardBarLength / 1000) * kgm;
    }
  }

  const overallEfficiency = totalUsableLength > 0 ? (totalCutLength / totalUsableLength) * 100 : 0;

  return {
    pieces,
    bars: allBars,
    totalBars6m: total6m,
    totalRemnantsUsed: totalRemnants,
    overallEfficiencyPercent: Math.round(overallEfficiency * 10) / 10,
    totalScrapKg: Math.round(totalScrapWeightKg * 10) / 10,
    totalLengthCutMm: totalCutLength,
    totalWeightAluminumKg: Math.round(totalAlumWeightKg * 10) / 10,
    newRemnantsToStock,
    reusableRemnantsCount: newRemnantsToStock.length,
    scrapLossKg: Math.round(totalScrapWeightKg * 10) / 10,
    totalPieces: pieces.length,
    totalWasteMm: Math.round(totalUsableLength - totalCutLength),
  };
};
