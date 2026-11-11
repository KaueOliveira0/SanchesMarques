import { CutBarPlan, CncMachineProtocol } from '../types';

export interface CncExportFile {
  filename: string;
  mimeType: string;
  content: string;
  protocol: CncMachineProtocol;
  description: string;
}

/**
 * Gera código G-Code / ISO universal para Serras CNC de 1 ou 2 Cabeçotes
 */
export function generateUniversalGCode(bars: CutBarPlan[], orderNumber: number | string): string {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push(`(=====================================================)`);
  lines.push(`( SANCHES & MARQUES ESQUADRIAS - CNC CUTTING PROGRAM  )`);
  lines.push(`( ORDEM DE PRODUCAO: OP-${orderNumber}                    )`);
  lines.push(`( DATA DE GERACAO:   ${now}        )`);
  lines.push(`( TOTAL DE BARRAS:   ${bars.length}                           )`);
  lines.push(`( PADRAO: ISO 6983 / G-CODE DUPLO CABECOTE ESQUADRIAS  )`);
  lines.push(`(=====================================================)`);
  lines.push(`G21 (Modo Milimetrico)`);
  lines.push(`G90 (Coordenadas Absolutas)`);
  lines.push(`G94 (Avanco em mm/min)`);
  lines.push(`M05 (Parar disco de serra por seguranca)`);
  lines.push(`G00 Z150.0 (Recuar cabecotes para posicao segura)`);
  lines.push(``);

  for (const bar of bars) {
    lines.push(`( --------------------------------------------------- )`);
    lines.push(`( BARRA #${bar.barIndex}: ${bar.profileCode} [${bar.color}] )`);
    lines.push(`( COMPRIMENTO INICIAL: ${bar.initialLength}mm | CORTES: ${bar.cuts.length} )`);
    lines.push(`( --------------------------------------------------- )`);
    lines.push(`M00 (PAUSA: Inserir barra ${bar.profileCode} de ${bar.initialLength}mm e pressionar START)`);
    lines.push(`M10 (Acionar garras pneumaticas de fixacao da barra)`);
    lines.push(`G04 P500 (Aguardar 500ms para pressao de ar estavel)`);
    lines.push(`M03 S3200 (Ligar motor do disco de corte a 3200 RPM)`);

    bar.cuts.forEach((cut, cIdx) => {
      const piece = cut.piece;
      lines.push(``);
      lines.push(`  ( CORTANDO PECA ${cIdx + 1}/${bar.cuts.length}: ${piece.description} )`);
      lines.push(`  ( COMPRIMENTO: ${piece.length}mm | ANGULOS: E=${piece.angleLeft} D=${piece.angleRight} )`);
      lines.push(`  ( ETIQUETA: ${piece.barcode} | OP-${piece.orderNumber} )`);

      // Posicionar batente motorizado / cabeçote móvel X
      lines.push(`  G00 X${piece.length.toFixed(2)}`);

      // Orientar cabeçotes angulares (A = Cabeçote Esquerdo, B = Cabeçote Direito)
      lines.push(`  G00 A${piece.angleLeft.toFixed(1)} B${piece.angleRight.toFixed(1)}`);
      lines.push(`  M12 (Travar eixos angulares)`);

      // Avanço de corte hidráulico / pneumático
      lines.push(`  G01 Z0.0 F1400 (Avanco do disco de serra no perfil)`);
      lines.push(`  G04 P200 (Tempo de acabamento)`);
      lines.push(`  G00 Z150.0 (Recuo rapido da lamina)`);

      // Impressão / disparo de etiqueta caso máquina tenha impressora acoplada
      lines.push(`  M60 (PRINT_BARCODE: "${piece.barcode}" | "${piece.profileCode}" | "${piece.length}mm")`);
    });

    lines.push(``);
    lines.push(`M05 (Desligar disco de serra)`);
    lines.push(`M11 (Abrir garras de fixacao)`);
    lines.push(`G00 X0.0 (Retornar batente a origem de alimentacao)`);
    lines.push(`( FIM DA BARRA #${bar.barIndex} - RETALHO ESTIMADO: ${bar.wasteLength}mm )`);
    lines.push(``);
  }

  lines.push(`(=====================================================)`);
  lines.push(`G00 Z200.0`);
  lines.push(`G00 X0.0`);
  lines.push(`M30 (Fim de Programa e Reset)`);
  lines.push(`%`);

  return lines.join('\n');
}

/**
 * Gera arquivo para Serras e Centros de Usinagem Emmegi (.DAT / .CSV)
 */
export function generateEmmegiFormat(bars: CutBarPlan[], orderNumber: number | string): string {
  const lines: string[] = [];
  lines.push(`[EMMEGI_CNC_CUT_LIST_V4]`);
  lines.push(`JOB_ID=OP_${orderNumber}`);
  lines.push(`DATE=${new Date().toLocaleDateString('pt-BR')}`);
  lines.push(`NUM_BARS=${bars.length}`);
  lines.push(`FORMAT=BAR_ID;PROFILE_CODE;COLOR;BAR_LEN;PIECE_NUM;PIECE_LEN;ANG_SX;ANG_DX;TAG;BARCODE;MACHINING`);

  for (const bar of bars) {
    bar.cuts.forEach((cut, idx) => {
      const p = cut.piece;
      const row = [
        `BAR_${String(bar.barIndex).padStart(3, '0')}`,
        bar.profileCode,
        bar.color,
        bar.initialLength,
        idx + 1,
        p.length,
        p.angleLeft,
        p.angleRight,
        `"${p.itemTag}"`,
        p.barcode,
        p.machiningGuide ? `"${p.machiningGuide}"` : '"PADRAO"',
      ].join(';');
      lines.push(row);
    });
  }

  return lines.join('\n');
}

/**
 * Gera arquivo para Serras FOM Industrie (Moxie, Blitz, Deka) no formato DataCut
 */
export function generateFomIndustrieFormat(bars: CutBarPlan[], orderNumber: number | string): string {
  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<FomDataCut Version="2.6">`);
  lines.push(`  <Header>`);
  lines.push(`    <JobNumber>OP-${orderNumber}</JobNumber>`);
  lines.push(`    <Created>${new Date().toISOString()}</Created>`);
  lines.push(`    <Software>Sanches & Marques Esquadrias - CNC</Software>`);
  lines.push(`    <TotalBars>${bars.length}</TotalBars>`);
  lines.push(`  </Header>`);
  lines.push(`  <CuttingList>`);

  for (const bar of bars) {
    lines.push(`    <Bar Id="${bar.barIndex}" Profile="${bar.profileCode}" Length="${bar.initialLength}" Color="${bar.color}">`);
    for (const cut of bar.cuts) {
      const p = cut.piece;
      lines.push(`      <Piece>`);
      lines.push(`        <Length>${p.length}</Length>`);
      lines.push(`        <AngleLeft>${p.angleLeft}</AngleLeft>`);
      lines.push(`        <AngleRight>${p.angleRight}</AngleRight>`);
      lines.push(`        <Barcode>${p.barcode}</Barcode>`);
      lines.push(`        <Description>${escapeXml(p.description)}</Description>`);
      lines.push(`        <Tag>${escapeXml(p.itemTag)}</Tag>`);
      lines.push(`      </Piece>`);
    }
    lines.push(`    </Bar>`);
  }

  lines.push(`  </CuttingList>`);
  lines.push(`</FomDataCut>`);

  return lines.join('\n');
}

/**
 * Gera arquivo para Serras Elumatec (.POS / .ELU)
 */
export function generateElumatecFormat(bars: CutBarPlan[], orderNumber: number | string): string {
  const lines: string[] = [];
  lines.push(`*ELUMATEC_DG_POS_TABLE*`);
  lines.push(`PROG_NAME: OP_${orderNumber}`);
  lines.push(`DATE: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`COLUMNS: BAR_NO | PROFILE | CUT_POS_MM | LEN_MM | ANG_L | ANG_R | BARCODE | INFO`);

  for (const bar of bars) {
    bar.cuts.forEach((cut, i) => {
      const p = cut.piece;
      lines.push(
        `${String(bar.barIndex).padStart(2, '0')}\t${bar.profileCode}\t${cut.startPosition}\t${p.length}\t${p.angleLeft}\t${p.angleRight}\t${p.barcode}\t${p.description}`
      );
    });
  }

  return lines.join('\n');
}

/**
 * Gera arquivo CSV / TSV Universal para máquinas com porta USB / Pen-Drive
 */
export function generateUniversalCsvFormat(bars: CutBarPlan[], orderNumber: number | string): string {
  const headers = [
    'NUM_BARRA',
    'PERFIL_CODIGO',
    'NOME_PERFIL',
    'COR',
    'COMPRIMENTO_BARRA_MM',
    'POSICAO_NA_BARRA',
    'COMPRIMENTO_CORTE_MM',
    'ANGULO_ESQUERDO',
    'ANGULO_DIREITO',
    'DESCRICAO_PECA',
    'TAG_ESQUADRIA',
    'CODIGO_BARRAS',
    'USINAGEM',
  ];

  const rows: string[] = [headers.join(';')];

  for (const bar of bars) {
    bar.cuts.forEach((cut, idx) => {
      const p = cut.piece;
      const row = [
        bar.barIndex,
        bar.profileCode,
        `"${bar.profileName}"`,
        bar.color,
        bar.initialLength,
        idx + 1,
        p.length,
        p.angleLeft,
        p.angleRight,
        `"${p.description}"`,
        `"${p.itemTag}"`,
        p.barcode,
        p.machiningGuide ? `"${p.machiningGuide}"` : '""',
      ];
      rows.push(row.join(';'));
    });
  }

  return rows.join('\r\n');
}

/**
 * Converte XML strings escapadas
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Dispara o download de um arquivo no navegador
 */
export function downloadCncFile(file: CncExportFile): void {
  const blob = new Blob([file.content], { type: `${file.mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Envia comandos diretamente via Web Serial API para controladora USB/Serial da serra
 */
export async function sendViaWebSerial(
  content: string,
  onProgress?: (percent: number, currentLine: string) => void
): Promise<{ success: boolean; message: string }> {
  // @ts-ignore
  if (!('serial' in navigator)) {
    return {
      success: false,
      message: 'Seu navegador não suporta a Web Serial API. Utilize o Google Chrome, Edge ou o aplicativo Sanches & Marques Esquadrias.',
    };
  }

  try {
    // @ts-ignore
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none' });

    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] + '\r\n';
      await writer.write(encoder.encode(line));
      if (onProgress) {
        onProgress(Math.round(((i + 1) / lines.length) * 100), lines[i]);
      }
      // Pequeno intervalo para buffer de CLP
      await new Promise((r) => setTimeout(r, 20));
    }

    writer.releaseLock();
    await port.close();

    return {
      success: true,
      message: `Comandos CNC enviados com sucesso (${lines.length} linhas transmitidas)!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Falha ao comunicar com a porta serial da máquina.',
    };
  }
}
