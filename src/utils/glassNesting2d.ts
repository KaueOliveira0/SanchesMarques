export interface GlassPaneToNest {
  id: string;
  orderNumber: number;
  clientName: string;
  description: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  glassType: string;
  thicknessMm: number;
}

export interface PlacedGlassPane {
  paneId: string;
  orderNumber: number;
  clientName: string;
  description: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  isRotated: boolean;
  glassType: string;
  thicknessMm: number;
  colorHex: string;
}

export interface GlassSheetNesting {
  sheetIndex: number;
  sheetWidthMm: number;
  sheetHeightMm: number;
  placedPanes: PlacedGlassPane[];
  usableAreaM2: number;
  usedAreaM2: number;
  scrapAreaM2: number;
  efficiencyPercent: number;
  svgContent: string;
}

export interface GlassNestingResult {
  sheets: GlassSheetNesting[];
  totalSheetsRequired: number;
  totalPanesRequested: number;
  totalPanesPlaced: number;
  overallEfficiencyPercent: number;
  totalScrapAreaM2: number;
  rawSheetDimensions: { widthMm: number; heightMm: number };
}

const PANE_COLORS = [
  '#0284c7', // Sky
  '#0d9488', // Teal
  '#16a34a', // Green
  '#ca8a04', // Amber
  '#9333ea', // Purple
  '#e11d48', // Rose
  '#2563eb', // Blue
  '#d97706', // Orange
];

export const optimizeGlassNesting2D = (
  panes: GlassPaneToNest[],
  sheetDimensions: { sheetWidthMm: number; sheetHeightMm: number } = { sheetWidthMm: 3210, sheetHeightMm: 2250 },
  options: { kerfMm?: number; edgeTrimMm?: number; allowRotation?: boolean } = {}
): GlassNestingResult => {
  const kerf = options.kerfMm ?? 4;
  const edgeTrim = options.edgeTrimMm ?? 15;
  const allowRotation = options.allowRotation ?? true;

  const sheetW = sheetDimensions.sheetWidthMm;
  const sheetH = sheetDimensions.sheetHeightMm;
  const usableW = sheetW - 2 * edgeTrim;
  const usableH = sheetH - 2 * edgeTrim;

  // Expandir todas as unidades
  const individualPanes: Array<{
    id: string;
    originalId: string;
    orderNumber: number;
    clientName: string;
    description: string;
    w: number;
    h: number;
    glassType: string;
    thicknessMm: number;
    colorHex: string;
  }> = [];

  panes.forEach((p, pIdx) => {
    const colorHex = PANE_COLORS[pIdx % PANE_COLORS.length];
    for (let q = 0; q < p.quantity; q++) {
      individualPanes.push({
        id: `${p.id}_${q + 1}`,
        originalId: p.id,
        orderNumber: p.orderNumber,
        clientName: p.clientName,
        description: p.description,
        w: p.widthMm,
        h: p.heightMm,
        glassType: p.glassType,
        thicknessMm: p.thicknessMm,
        colorHex,
      });
    }
  });

  // Ordenar peças por área decrescente (Guillotine First-Fit Decreasing)
  individualPanes.sort((a, b) => b.w * b.h - a.w * a.h);

  const sheets: GlassSheetNesting[] = [];
  const unplaced = [...individualPanes];

  while (unplaced.length > 0) {
    const currentPlaced: PlacedGlassPane[] = [];
    // Algoritmo de Guilhotina em Níveis (Shelf Next-Fit / Best-Fit)
    // Uma prateleira (shelf) horizontal que avança em Y
    let currentShelfY = edgeTrim;
    let currentShelfH = 0;
    let currentShelfX = edgeTrim;

    const remainingForNextSheet: typeof unplaced = [];

    for (let i = 0; i < unplaced.length; i++) {
      const pane = unplaced[i];
      let pw = pane.w;
      let ph = pane.h;
      let rotated = false;

      // Verificar rotação para melhor aproveitamento
      if (allowRotation && pw > ph && pw > usableW - currentShelfX && ph <= usableW - currentShelfX) {
        pw = pane.h;
        ph = pane.w;
        rotated = true;
      }

      // Se cabe na prateleira atual
      if (currentShelfX + pw <= sheetW - edgeTrim && currentShelfY + ph <= sheetH - edgeTrim) {
        currentPlaced.push({
          paneId: pane.id,
          orderNumber: pane.orderNumber,
          clientName: pane.clientName,
          description: pane.description,
          xMm: currentShelfX,
          yMm: currentShelfY,
          widthMm: pw,
          heightMm: ph,
          isRotated: rotated,
          glassType: pane.glassType,
          thicknessMm: pane.thicknessMm,
          colorHex: pane.colorHex,
        });

        currentShelfX += pw + kerf;
        currentShelfH = Math.max(currentShelfH, ph);
      } else {
        // Tentar abrir nova prateleira para cima
        const nextShelfY = currentShelfY + currentShelfH + kerf;
        if (nextShelfY + ph <= sheetH - edgeTrim && edgeTrim + pw <= sheetW - edgeTrim) {
          currentShelfY = nextShelfY;
          currentShelfX = edgeTrim;
          currentShelfH = ph;

          currentPlaced.push({
            paneId: pane.id,
            orderNumber: pane.orderNumber,
            clientName: pane.clientName,
            description: pane.description,
            xMm: currentShelfX,
            yMm: currentShelfY,
            widthMm: pw,
            heightMm: ph,
            isRotated: rotated,
            glassType: pane.glassType,
            thicknessMm: pane.thicknessMm,
            colorHex: pane.colorHex,
          });

          currentShelfX += pw + kerf;
        } else {
          remainingForNextSheet.push(pane);
        }
      }
    }

    if (currentPlaced.length === 0) {
      // Caso a peça seja maior que a chapa inteira
      const p = remainingForNextSheet.shift()!;
      currentPlaced.push({
        paneId: p.id,
        orderNumber: p.orderNumber,
        clientName: p.clientName,
        description: p.description,
        xMm: edgeTrim,
        yMm: edgeTrim,
        widthMm: p.w,
        heightMm: p.h,
        isRotated: false,
        glassType: p.glassType,
        thicknessMm: p.thicknessMm,
        colorHex: p.colorHex,
      });
    }

    unplaced.length = 0;
    unplaced.push(...remainingForNextSheet);

    // Métricas da chapa
    const usableM2 = (sheetW * sheetH) / 1000000;
    const usedM2 = currentPlaced.reduce((acc, p) => acc + (p.widthMm * p.heightMm) / 1000000, 0);
    const scrapM2 = Math.max(0, usableM2 - usedM2);
    const efficiency = (usedM2 / usableM2) * 100;

    // Gerar SVG da chapa
    const svgRects = currentPlaced
      .map((p) => {
        return `
        <g class="pane-group">
          <rect x="${p.xMm}" y="${p.yMm}" width="${p.widthMm}" height="${p.heightMm}" fill="${p.colorHex}" fill-opacity="0.25" stroke="${p.colorHex}" stroke-width="3" rx="2" />
          <text x="${p.xMm + p.widthMm / 2}" y="${p.yMm + p.heightMm / 2 - 10}" fill="#f8fafc" font-size="28" font-weight="bold" text-anchor="middle" font-family="monospace">
            ${p.widthMm} x ${p.heightMm} mm
          </text>
          <text x="${p.xMm + p.widthMm / 2}" y="${p.yMm + p.heightMm / 2 + 18}" fill="#94a3b8" font-size="20" text-anchor="middle" font-family="sans-serif">
            #${p.orderNumber} - ${p.description.slice(0, 18)}
          </text>
        </g>`;
      })
      .join('\n');

    const svg = `<svg viewBox="0 0 ${sheetW} ${sheetH}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto bg-slate-950 rounded-lg">
      <rect x="0" y="0" width="${sheetW}" height="${sheetH}" fill="#090d16" stroke="#334155" stroke-width="4" rx="4" />
      <rect x="${edgeTrim}" y="${edgeTrim}" width="${usableW}" height="${usableH}" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="10 10" />
      ${svgRects}
    </svg>`;

    sheets.push({
      sheetIndex: sheets.length + 1,
      sheetWidthMm: sheetW,
      sheetHeightMm: sheetH,
      placedPanes: currentPlaced,
      usableAreaM2: Math.round(usableM2 * 100) / 100,
      usedAreaM2: Math.round(usedM2 * 100) / 100,
      scrapAreaM2: Math.round(scrapM2 * 100) / 100,
      efficiencyPercent: Math.round(efficiency * 10) / 10,
      svgContent: svg,
    });
  }

  const totalRequested = panes.reduce((acc, p) => acc + p.quantity, 0);
  const totalPlaced = sheets.reduce((acc, s) => acc + s.placedPanes.length, 0);
  const totalSheetArea = sheets.length * ((sheetW * sheetH) / 1000000);
  const totalUsedArea = sheets.reduce((acc, s) => acc + s.usedAreaM2, 0);
  const totalScrap = Math.max(0, totalSheetArea - totalUsedArea);
  const overallEff = totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;

  return {
    sheets,
    totalSheetsRequired: sheets.length,
    totalPanesRequested: totalRequested,
    totalPanesPlaced: totalPlaced,
    overallEfficiencyPercent: Math.round(overallEff * 10) / 10,
    totalScrapAreaM2: Math.round(totalScrap * 100) / 100,
    rawSheetDimensions: { widthMm: sheetW, heightMm: sheetH },
  };
};
