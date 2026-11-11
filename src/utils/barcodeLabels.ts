import { CutPiece } from '../types';

export interface ProductionLabel {
  id: string;
  orderNumber: number;
  clientName: string;
  itemTag: string;
  profileCode: string;
  profileName: string;
  lengthMm: number;
  angles: string;
  color: string;
  barcode: string;
  barcodeSvg: string;
}

export const generateBarcodeSvg = (code: string): string => {
  // Gerador de código de barras Code 128 simplificado em SVG
  const bars: Array<{ x: number; w: number }> = [];
  let currentX = 10;

  // Padrão simulado de barras determinístico baseado no hash dos caracteres
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const pattern = [(charCode % 3) + 1, ((charCode >> 1) % 2) + 1, ((charCode >> 2) % 3) + 1];

    for (let p = 0; p < pattern.length; p++) {
      const w = pattern[p];
      if (p % 2 === 0) {
        bars.push({ x: currentX, w });
      }
      currentX += w + 1;
    }
  }

  const svgWidth = currentX + 15;
  const rects = bars
    .map((b) => `<rect x="${b.x}" y="5" width="${b.w}" height="40" fill="#000" />`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} 55" width="100%" height="45">
    <rect width="${svgWidth}" height="55" fill="#fff" />
    ${rects}
    <text x="${svgWidth / 2}" y="50" font-size="8" font-family="monospace" text-anchor="middle" fill="#111">${code}</text>
  </svg>`;
};

export const createLabelsFromCutPieces = (
  pieces: CutPiece[],
  clientName: string = 'Cliente'
): ProductionLabel[] => {
  return pieces.map((piece, idx) => {
    const code = piece.barcode || `SMQ-${piece.orderNumber}-${piece.profileCode}-${piece.length}-${idx + 1}`;
    return {
      id: piece.id,
      orderNumber: piece.orderNumber,
      clientName,
      itemTag: piece.itemTag || 'Geral',
      profileCode: piece.profileCode,
      profileName: piece.profileName || piece.description,
      lengthMm: piece.length,
      angles: `${piece.angleLeft}° / ${piece.angleRight}°`,
      color: piece.color || 'Branco',
      barcode: code,
      barcodeSvg: generateBarcodeSvg(code),
    };
  });
};

export const generatePrintableLabelsHtml = (
  labels: ProductionLabel[],
  layout: 'termica_100x50' | 'a4_adesivo' = 'termica_100x50'
): string => {
  const cardsHtml = labels
    .map(
      (lbl) => `
    <div class="label-card">
      <div class="header">
        <span class="brand">SANCHES & MARQUES</span>
        <span class="order">OP #${lbl.orderNumber}</span>
      </div>
      <div class="main-info">
        <div class="code-box">
          <span class="code">${lbl.profileCode}</span>
          <span class="name">${lbl.profileName}</span>
        </div>
        <div class="dim-box">
          <span class="length">${lbl.lengthMm} mm</span>
          <span class="angles">${lbl.angles}</span>
        </div>
      </div>
      <div class="meta-row">
        <span>Cor: <b>${lbl.color}</b></span>
        <span>Destino: <b>${lbl.itemTag}</b></span>
      </div>
      <div class="barcode-container">
        ${lbl.barcodeSvg}
      </div>
    </div>`
    )
    .join('');

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>Etiquetas de Produção - Sanches &amp; Marques</title>
    <style>
      @page { size: auto; margin: 5mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; background: #fff; color: #111; }
      .grid { display: flex; flex-wrap: wrap; gap: 8mm; justify-content: flex-start; }
      .label-card { width: 95mm; height: 50mm; border: 1.5px dashed #444; border-radius: 4px; padding: 3mm 4mm; box-sizing: border-box; page-break-inside: avoid; display: flex; flex-direction: column; justify-content: space-between; }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 1.5mm; font-size: 10px; font-weight: bold; }
      .order { background: #000; color: #fff; padding: 1px 4px; border-radius: 2px; }
      .main-info { display: flex; justify-content: space-between; align-items: baseline; margin-top: 2mm; }
      .code { font-size: 18px; font-weight: 900; font-family: monospace; }
      .name { font-size: 9px; color: #555; display: block; max-width: 48mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .length { font-size: 22px; font-weight: 900; color: #000; font-family: monospace; }
      .angles { font-size: 11px; font-weight: bold; color: #444; text-align: right; display: block; }
      .meta-row { display: flex; justify-content: space-between; font-size: 9px; margin-top: 1mm; border-top: 1px dotted #ccc; padding-top: 1mm; }
      .barcode-container { margin-top: 1mm; text-align: center; }
    </style>
  </head>
  <body onload="window.print()">
    <div class="grid">
      ${cardsHtml}
    </div>
  </body>
  </html>`;
};
