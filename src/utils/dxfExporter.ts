export interface DxfExportOptions {
  typologyCode: string;
  typologyName: string;
  series: string;
  widthMm: number;
  heightMm: number;
  leafCount?: number;
  orderNumber?: number;
  clientName?: string;
}

export const generateEsquadriaDxf = (options: DxfExportOptions): string => {
  const { typologyCode, typologyName, series, widthMm, heightMm, leafCount = 2, orderNumber = 101, clientName = '' } = options;

  const lines: string[] = [];

  // DXF Header
  lines.push('0', 'SECTION');
  lines.push('2', 'HEADER');
  lines.push('9', '$ACADVER');
  lines.push('1', 'AC1009');
  lines.push('0', 'ENDSEC');

  // DXF Tables / Layers
  lines.push('0', 'SECTION');
  lines.push('2', 'TABLES');
  lines.push('0', 'TABLE');
  lines.push('2', 'LAYER');
  lines.push('70', '5');

  const layers = [
    { name: 'MARCO_EXTERNO', color: 1 }, // Vermelho
    { name: 'FOLHAS_MOVEL', color: 3 }, // Verde
    { name: 'VIDRO_TEMPERADO', color: 4 }, // Ciano
    { name: 'COTAS_MEDIDAS', color: 7 }, // Branco
    { name: 'TEXTOS_LEGENDA', color: 2 }, // Amarelo
  ];

  for (const lyr of layers) {
    lines.push('0', 'LAYER');
    lines.push('2', lyr.name);
    lines.push('70', '0');
    lines.push('62', String(lyr.color));
    lines.push('6', 'CONTINUOUS');
  }

  lines.push('0', 'ENDTAB');
  lines.push('0', 'ENDSEC');

  // Entities Section
  lines.push('0', 'SECTION');
  lines.push('2', 'ENTITIES');

  // Desenhar Marco Externo (Retângulo em MARCO_EXTERNO)
  const addPolylineRect = (x: number, y: number, w: number, h: number, layer: string) => {
    lines.push('0', 'POLYLINE');
    lines.push('8', layer);
    lines.push('66', '1');
    lines.push('70', '1'); // Fechada

    const pts = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];

    for (const [px, py] of pts) {
      lines.push('0', 'VERTEX');
      lines.push('8', layer);
      lines.push('10', String(px));
      lines.push('20', String(py));
      lines.push('30', '0.0');
    }

    lines.push('0', 'SEQEND');
  };

  // Marco externo
  addPolylineRect(0, 0, widthMm, heightMm, 'MARCO_EXTERNO');

  // Folhas móveis e vidros
  const leafW = (widthMm + 26) / leafCount;
  for (let i = 0; i < leafCount; i++) {
    const lx = i * (leafW - 26);
    addPolylineRect(lx + 20, 35, leafW - 40, heightMm - 70, 'FOLHAS_MOVEL');
    addPolylineRect(lx + 50, 65, leafW - 100, heightMm - 130, 'VIDRO_TEMPERADO');
  }

  // Linhas de Cotas
  const addText = (text: string, x: number, y: number, height: number, layer: string) => {
    lines.push('0', 'TEXT');
    lines.push('8', layer);
    lines.push('10', String(x));
    lines.push('20', String(y));
    lines.push('30', '0.0');
    lines.push('40', String(height));
    lines.push('1', text);
  };

  addText(`L = ${widthMm} mm`, widthMm / 2 - 80, -60, 30, 'COTAS_MEDIDAS');
  addText(`H = ${heightMm} mm`, widthMm + 30, heightMm / 2, 30, 'COTAS_MEDIDAS');

  // Legenda Técnica
  addText(`SANCHES & MARQUES ESQUADRIAS - ${typologyName} (${typologyCode})`, 0, heightMm + 120, 35, 'TEXTOS_LEGENDA');
  addText(`Linha: ${series} | Pedido: #${orderNumber} | Cliente: ${clientName || 'Geral'}`, 0, heightMm + 70, 25, 'TEXTOS_LEGENDA');

  lines.push('0', 'ENDSEC');
  lines.push('0', 'EOF');

  return lines.join('\n');
};

const downloadRawDxf = (filename: string, content: string) => {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.dxf') ? filename : `${filename}.dxf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function downloadDxfFile(optionsOrFilename: DxfExportOptions | string, content?: string) {
  if (typeof optionsOrFilename === 'object') {
    const dxfString = generateEsquadriaDxf(optionsOrFilename);
    const fname = `desenho_cad_${optionsOrFilename.typologyCode}_${optionsOrFilename.widthMm}x${optionsOrFilename.heightMm}.dxf`;
    downloadRawDxf(fname, dxfString);
  } else {
    downloadRawDxf(optionsOrFilename, content || '');
  }
}
