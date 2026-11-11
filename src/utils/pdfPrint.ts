import { getEffectiveCompanyProfile } from './companyProfile';
import { getEffectiveLogoBase64 } from './logoData';
import { CutBarPlan, CutPiece, Order } from '../types';
import { createLabelsFromCutPieces, generatePrintableLabelsHtml } from './barcodeLabels';
import { GlassOptimizationResult } from './glass2DOptimizer';

export const escapeHtml = (unsafe: string | null | undefined): string => {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export interface CorporatePdfHeaderOptions {
  docBadge: string;
  docNumber: string;
  docDate?: string;
  docSubtitle?: string;
  extraLines?: string[];
}

export const renderCorporatePdfHeader = (options: CorporatePdfHeaderOptions): string => {
  const profile = getEffectiveCompanyProfile();
  const logoSrc = getEffectiveLogoBase64();
  const dateStr = options.docDate || new Date().toLocaleDateString('pt-BR');

  const extraLinesHtml = (options.extraLines || [])
    .map((line) => `<div class="extra-line">${escapeHtml(line)}</div>`)
    .join('');

  return `
  <div class="pdf-corporate-header">
    <div class="header-left">
      <img src="${logoSrc}" alt="Sanches &amp; Marques" class="header-logo" />
      <div class="company-text">
        <h1 class="brand-name">SANCHES &amp; MARQUES</h1>
        <div class="brand-sub">ESQUADRIAS DE ALUMÍNIO DE ALTO PADRÃO</div>
        <div class="company-meta">
          <span>CNPJ: ${escapeHtml(profile.cnpj)}</span> | <span>I.E: ${escapeHtml(profile.ie)}</span>
        </div>
        <div class="company-contact">
          <span>${escapeHtml(profile.address)} - ${escapeHtml(profile.cityState)}</span>
          <br/>
          <span>Tel: ${escapeHtml(profile.phone)} | ${escapeHtml(profile.email)}</span>
        </div>
      </div>
    </div>

    <div class="header-right">
      <div class="doc-badge">${escapeHtml(options.docBadge)}</div>
      <div class="doc-number">${escapeHtml(options.docNumber)}</div>
      <div class="doc-date">Data: <b>${escapeHtml(dateStr)}</b></div>
      ${options.docSubtitle ? `<div class="doc-subtitle">${escapeHtml(options.docSubtitle)}</div>` : ''}
      ${extraLinesHtml}
    </div>
  </div>
  <div class="pdf-golden-divider"></div>
  `;
};

export const openPrintWindow = (html: string, _title: string = 'Impressão') => {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

export const printCuttingPlanMap = (bars: CutBarPlan[], orderNumber: number = 101) => {
  const header = renderCorporatePdfHeader({
    docBadge: 'MAPA DE CORTE LINEAR 1D',
    docNumber: `OP #${orderNumber}`,
    docSubtitle: 'Plano de Corte Otimizado com Ângulos de Serra e Posição dos Cortes',
  });

  const barsHtml = bars
    .map((bar) => {
      const cutsRows = bar.cuts
        .map(
          (c, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 4px 6px;">#${idx + 1}</td>
          <td style="padding: 4px 6px; font-weight: bold;">${c.lengthMm ?? c.length} mm</td>
          <td style="padding: 4px 6px;">${c.piece?.angleLeft ?? c.angleLeft ?? 90}° / ${c.piece?.angleRight ?? c.angleRight ?? 90}°</td>
          <td style="padding: 4px 6px; font-family: monospace;">${c.startMm ?? c.startPosition} mm</td>
          <td style="padding: 4px 6px;">${escapeHtml(c.piece?.description ?? c.description ?? '')}</td>
          <td style="padding: 4px 6px;">OP #${c.piece?.orderNumber ?? c.orderNumber ?? orderNumber}</td>
        </tr>`
        )
        .join('');

      return `
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 15px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 6px;">
          <span>Barra #${bar.barNumber ?? bar.barIndex}: ${escapeHtml(bar.profileCode)} (${escapeHtml(bar.color)}) - ${bar.isRemnant ? 'REAPROVEITAMENTO RETALHO' : 'BARRA 6.000mm'}</span>
          <span>Aproveitamento: ${bar.efficiencyPercent}% | Sobra: ${bar.scrapMm ?? bar.wasteLength} mm</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #f1f5f9; font-size: 10px; text-transform: uppercase;">
              <th style="padding: 4px 6px;">Seq</th>
              <th style="padding: 4px 6px;">Comp (mm)</th>
              <th style="padding: 4px 6px;">Ângulos</th>
              <th style="padding: 4px 6px;">Início</th>
              <th style="padding: 4px 6px;">Descrição</th>
              <th style="padding: 4px 6px;">Ordem</th>
            </tr>
          </thead>
          <tbody>
            ${cutsRows}
          </tbody>
        </table>
      </div>`;
    })
    .join('');

  const fullHtml = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>Mapa de Corte - OP #${orderNumber}</title>
    <style>
      @page { size: A4; margin: 10mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 10px; }
      .pdf-corporate-header { display: flex; justify-content: space-between; align-items: center; }
      .header-logo { max-height: 48px; }
      .brand-name { font-size: 18px; margin: 0; font-weight: 900; }
      .brand-sub { font-size: 10px; color: #b45309; font-weight: bold; }
      .pdf-golden-divider { height: 3px; background: #b45309; margin: 10px 0 15px 0; }
      .doc-badge { background: #0f172a; color: #fff; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 3px; display: inline-block; }
      .doc-number { font-size: 16px; font-weight: bold; }
    </style>
  </head>
  <body onload="window.print()">
    ${header}
    ${barsHtml}
  </body>
  </html>`;

  openPrintWindow(fullHtml, `Mapa de Corte - OP #${orderNumber}`);
};

export const printBarcodeLabels = (pieces: CutPiece[]) => {
  const labels = createLabelsFromCutPieces(pieces);
  const html = generatePrintableLabelsHtml(labels, 'termica_100x50');
  openPrintWindow(html, 'Etiquetas de Produção');
};

export const printProductionOrderSheet = (order: Order, pieces?: CutPiece[]) => {
  const header = renderCorporatePdfHeader({
    docBadge: 'ORDEM DE PRODUÇÃO (OP)',
    docNumber: `OP #${order.number}`,
    docSubtitle: `Cliente: ${order.clientName} | Entrega: ${order.deliveryDate || 'A Combinar'}`,
    extraLines: [
      `Vendedor: ${order.sellerName || 'Marcos Sanches'}`,
      `Cor Alumínio: ${order.color}`,
      `Status Atual: ${order.productionStep || 'Liberado'}`,
    ],
  });

  const itemsHtml = order.items
    .map(
      (item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
      <td style="padding: 8px;">#${idx + 1}</td>
      <td style="padding: 8px; font-weight: bold;">${escapeHtml(item.location ?? item.roomTag)}</td>
      <td style="padding: 8px; font-family: monospace;">${item.width} × ${item.height} mm</td>
      <td style="padding: 8px; font-weight: bold;">${item.quantity} un</td>
      <td style="padding: 8px;">${escapeHtml(item.typologyId)}</td>
      <td style="padding: 8px;">${escapeHtml(item.color || order.color)}</td>
    </tr>`
    )
    .join('');

  const fullHtml = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>Ordem de Produção - OP #${order.number}</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 10px; }
      .pdf-corporate-header { display: flex; justify-content: space-between; align-items: center; }
      .header-logo { max-height: 48px; }
      .brand-name { font-size: 18px; margin: 0; font-weight: 900; }
      .brand-sub { font-size: 10px; color: #b45309; font-weight: bold; }
      .pdf-golden-divider { height: 3px; background: #b45309; margin: 10px 0 15px 0; }
      .doc-badge { background: #0f172a; color: #fff; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 3px; display: inline-block; }
      .doc-number { font-size: 16px; font-weight: bold; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th { background: #0f172a; color: #fff; font-size: 10px; text-transform: uppercase; padding: 6px 8px; text-align: left; }
    </style>
  </head>
  <body onload="window.print()">
    ${header}
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Ambiente / Local</th>
          <th>Vão (L × H)</th>
          <th>Qtd</th>
          <th>Tipologia</th>
          <th>Acabamento</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <div style="margin-top: 20px; font-size: 11px; color: #64748b;">
      Observações da Fábrica: ${escapeHtml(order.notes || 'Nenhuma observação informada.')}
    </div>
  </body>
  </html>`;

  openPrintWindow(fullHtml, `OP #${order.number}`);
};

export const printCommercialProposal = (order: Order): void => {
  const profile = getEffectiveCompanyProfile();
  const docDate = order.date || order.createdAt || new Date().toISOString();
  const address = order.projectAddress || order.clientAddress || order.address;
  const header = renderCorporatePdfHeader({
    docBadge: 'PROPOSTA COMERCIAL & TÉCNICA',
    docNumber: `ORÇ #${order.number}`,
    docDate: new Date(docDate).toLocaleDateString('pt-BR'),
    docSubtitle: `Cliente: ${order.clientName}`,
    extraLines: [
      address ? `Obra: ${address}` : '',
      order.clientPhone ? `Contato: ${order.clientPhone}` : '',
      `Prazo Previsto: ${new Date(order.deliveryDate).toLocaleDateString('pt-BR')}`,
    ].filter(Boolean),
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const itemsRows = order.items
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
      <td>
        <div style="font-weight: bold; color: #0f172a;">${escapeHtml(item.typologyName)}</div>
        <div style="font-size: 10px; color: #64748b;">Ambiente: ${escapeHtml(item.location || item.roomTag || 'Geral')}</div>
      </td>
      <td style="text-align: center; font-family: monospace;">${item.widthMm || item.width} × ${item.heightMm || item.height} mm</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="font-size: 11px;">${escapeHtml(item.glassType || item.glassId || 'Incolor')}</td>
      <td style="font-size: 11px;">${escapeHtml(item.aluminumColor || item.color || 'Branco')}</td>
      <td style="text-align: right; font-family: monospace;">${formatCurrency(item.unitPrice || 0)}</td>
      <td style="text-align: right; font-weight: bold; font-family: monospace;">${formatCurrency(item.totalPrice || 0)}</td>
    </tr>
  `
    )
    .join('');

  const fullHtml = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>Orçamento Comercial - #${order.number} - Sanches & Marques</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
      .pdf-corporate-header { display: flex; justify-content: space-between; align-items: center; }
      .header-logo { max-height: 48px; }
      .brand-name { font-size: 18px; margin: 0; font-weight: 900; }
      .brand-sub { font-size: 10px; color: #b45309; font-weight: bold; }
      .pdf-golden-divider { height: 3px; background: #b45309; margin: 10px 0 15px 0; }
      .doc-badge { background: #0f172a; color: #fff; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 3px; display: inline-block; }
      .doc-number { font-size: 16px; font-weight: bold; }
      .doc-date { font-size: 11px; margin-top: 4px; }
      .doc-subtitle { font-size: 12px; font-weight: bold; margin-top: 4px; color: #1e293b; }
      .extra-line { font-size: 11px; color: #475569; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
      th { background: #0f172a; color: #fff; font-size: 10px; text-transform: uppercase; padding: 8px 6px; text-align: left; letter-spacing: 0.5px; }
      td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) { background-color: #f8fafc; }
      .totals-panel { margin-top: 20px; display: flex; justify-content: space-between; gap: 20px; }
      .terms-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 11px; color: #475569; background: #f8fafc; }
      .terms-box h4 { margin: 0 0 6px 0; font-size: 11px; color: #0f172a; text-transform: uppercase; }
      .summary-box { width: 260px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #fff; font-size: 12px; }
      .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
      .summary-total { display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 2px solid #0f172a; font-size: 15px; font-weight: bold; color: #0f172a; }
      .signatures { margin-top: 40px; display: flex; justify-content: space-between; gap: 30px; }
      .sig-line { flex: 1; text-align: center; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11px; color: #475569; }
    </style>
  </head>
  <body onload="window.print()">
    ${header}
    <table>
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">Item</th>
          <th>Tipologia / Vão</th>
          <th style="text-align: center;">Larg. × Alt.</th>
          <th style="width: 40px; text-align: center;">Qtd</th>
          <th>Vidro</th>
          <th>Acabamento</th>
          <th style="text-align: right;">Unitário</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals-panel">
      <div class="terms-box">
        <h4>Condições Comerciais &amp; Normativas</h4>
        <p style="margin: 0 0 4px 0;">• <b>Normas Técnicas:</b> Fabricação em total conformidade com ABNT NBR 10821, NBR 14718 e NBR 7199.</p>
        <p style="margin: 0 0 4px 0;">• <b>Garantia:</b> 5 anos contra defeitos de fabricação e anodização/pintura eletrostática.</p>
        <p style="margin: 0 0 4px 0;">• <b>Pagamento:</b> ${escapeHtml(order.paymentTerms || 'Sinal de 50% na aprovação + 50% na entrega e instalação técnica.')}</p>
        <p style="margin: 0;">• <b>Validade da Proposta:</b> 15 dias a contar da data de emissão.</p>
      </div>

      <div class="summary-box">
        <div class="summary-row">
          <span>Peso Total de Alumínio:</span>
          <b>${(order.totalWeightKg || 0).toFixed(1)} kg</b>
        </div>
        <div class="summary-row">
          <span>Área Total de Vidro:</span>
          <b>${(order.totalGlassM2 || 0).toFixed(2)} m²</b>
        </div>
        <div class="summary-row">
          <span>Quantidade de Peças:</span>
          <b>${order.items.reduce((s, i) => s + i.quantity, 0)} un</b>
        </div>
        <div class="summary-total">
          <span>VALOR TOTAL:</span>
          <span>${formatCurrency(order.finalPrice)}</span>
        </div>
      </div>
    </div>

    <div class="signatures">
      <div class="sig-line">
        <b>SANCHES &amp; MARQUES ESQUADRIAS</b><br/>
        Responsável Técnico / Comercial
      </div>
      <div class="sig-line">
        <b>${escapeHtml(order.clientName)}</b><br/>
        De acordo com a proposta
      </div>
    </div>
  </body>
  </html>`;

  openPrintWindow(fullHtml, `Proposta Comercial #${order.number}`);
};

/**
 * Imprime o Mapa Técnico 2D de Corte de Chapas de Vidro para a Mesa de Corte
 */
export const printGlassCuttingPlanMap = (result: GlassOptimizationResult, optionsDesc?: string): void => {
  const header = renderCorporatePdfHeader({
    docBadge: 'PLANO DE CORTE 2D - VIDRAÇARIA',
    docNumber: `MAPA 2D #${Math.floor(Date.now() / 1000).toString().slice(-4)}`,
    docDate: new Date().toLocaleDateString('pt-BR'),
    docSubtitle: `Chapas Requeridas: ${result.totalSheets} un | Aproveitamento: ${result.overallUtilizationPct}%`,
    extraLines: [
      optionsDesc ? `Configuração: ${optionsDesc}` : '',
      `Total de Peças: ${result.totalPiecesPlaced} de ${result.totalPiecesRequested} peças alocadas`,
      `Área Útil Cortada: ${result.totalUsedAreaM2.toFixed(2)} m² | Retalhos Úteis: ${result.totalRemnantAreaM2.toFixed(2)} m²`,
    ].filter(Boolean),
  });

  const sheetsHtml = result.sheets
    .map((sheet) => {
      // Gera SVG do diagrama da chapa
      const svgWidth = 720;
      const scale = svgWidth / sheet.sheetWidth;
      const svgHeight = sheet.sheetHeight * scale;

      const piecesSvg = sheet.placedPieces
        .map((p) => {
          const px = p.x * scale;
          const py = p.y * scale;
          const pw = p.width * scale;
          const ph = p.height * scale;
          return `
            <g>
              <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${p.colorCode}" fill-opacity="0.25" stroke="${p.colorCode}" stroke-width="1.5" />
              <text x="${px + pw / 2}" y="${py + ph / 2 - 4}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">
                ${escapeHtml(p.label)}
              </text>
              <text x="${px + pw / 2}" y="${py + ph / 2 + 10}" font-size="9" font-family="monospace" fill="#334155" text-anchor="middle" dominant-baseline="middle">
                ${p.width} × ${p.height} mm
              </text>
            </g>
          `;
        })
        .join('');

      const remnantsSvg = sheet.remnants
        .map((r) => {
          const rx = r.x * scale;
          const ry = r.y * scale;
          const rw = r.width * scale;
          const rh = r.height * scale;
          if (r.isUseful) {
            return `
              <g>
                <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="#10b981" fill-opacity="0.15" stroke="#059669" stroke-width="1" stroke-dasharray="3,3" />
                <text x="${rx + rw / 2}" y="${ry + rh / 2}" font-size="9" fill="#047857" font-weight="bold" text-anchor="middle" dominant-baseline="middle">
                  REAPROVEITÁVEL (${r.width}×${r.height}mm)
                </text>
              </g>
            `;
          }
          return `
            <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="#f1f5f9" fill-opacity="0.5" stroke="#cbd5e1" stroke-width="0.5" />
          `;
        })
        .join('');

      const piecesListRows = sheet.placedPieces
        .map(
          (p, idx) => `
          <tr>
            <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
            <td style="font-weight: bold;">${escapeHtml(p.label)}</td>
            <td style="text-align: center; font-family: monospace;">${p.width} × ${p.height} mm</td>
            <td style="text-align: center;">${p.rotated ? 'Sim (90°)' : 'Não'}</td>
            <td>${escapeHtml(p.roomTag || '-')}</td>
            <td style="text-align: center;">${p.orderNumber ? `OP #${p.orderNumber}` : '-'}</td>
          </tr>
        `
        )
        .join('');

      return `
        <div style="page-break-after: always; margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; font-size: 14px; color: #0f172a;">
              Chapa ${sheet.sheetIndex} de ${result.totalSheets} — Dimensões: ${sheet.sheetWidth} × ${sheet.sheetHeight} mm
            </h3>
            <span style="font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px; background: #e0f2fe; color: #0369a1;">
              Aproveitamento: ${sheet.utilizationPct}% (${sheet.usedAreaM2.toFixed(2)} m²)
            </span>
          </div>

          <!-- Diagrama 2D -->
          <div style="text-align: center; margin-bottom: 14px; background: #fafafa; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="max-width: 100%; height: auto;">
              <!-- Fundo da chapa bruta -->
              <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
              ${piecesSvg}
              ${remnantsSvg}
            </svg>
          </div>

          <!-- Tabela de Peças Cortadas nesta Chapa -->
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 5px; text-align: center;">#</th>
                <th style="padding: 5px; text-align: left;">Identificação</th>
                <th style="padding: 5px; text-align: center;">Cotas (L × A)</th>
                <th style="padding: 5px; text-align: center;">Giro</th>
                <th style="padding: 5px; text-align: left;">Ambiente</th>
                <th style="padding: 5px; text-align: center;">Origem</th>
              </tr>
            </thead>
            <tbody>
              ${piecesListRows}
            </tbody>
          </table>
        </div>
      `;
    })
    .join('');

  const fullHtml = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>Plano de Corte 2D - Chapas de Vidro - Sanches & Marques</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 10px; }
      .pdf-corporate-header { display: flex; justify-content: space-between; align-items: center; }
      .header-logo { max-height: 48px; }
      .brand-name { font-size: 18px; margin: 0; font-weight: 900; }
      .brand-sub { font-size: 10px; color: #b45309; font-weight: bold; }
      .pdf-golden-divider { height: 3px; background: #b45309; margin: 10px 0 15px 0; }
      .doc-badge { background: #0f172a; color: #fff; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 3px; display: inline-block; }
      .doc-number { font-size: 16px; font-weight: bold; }
    </style>
  </head>
  <body>
    ${header}
    ${sheetsHtml}
    <div style="font-size: 10px; color: #64748b; text-align: center; margin-top: 15px;">
      Documento gerado automaticamente pelo Sistema Industrial Sanches & Marques Esquadrias e Vidraçaria.
    </div>
  </body>
  </html>`;

  openPrintWindow(fullHtml, `Plano de Corte 2D de Vidros`);
};

/**
 * Imprime o Pedido de Compra Consolidado de Matéria-Prima (Extrusoras & Distribuidoras)
 */
export const printConsolidatedPurchaseOrder = (
  ordersByColor: any[],
  extruder: any,
  volumeInfo: any,
  ordersIncludedCount: number = 1
): void => {
  const grandTotalBars = ordersByColor.reduce((acc: number, o: any) => acc + o.totalBars6000, 0);
  const grandTotalWeight = Math.round(ordersByColor.reduce((acc: number, o: any) => acc + o.totalWeightKg, 0) * 10) / 10;
  const grandTotalTons = (grandTotalWeight / 1000).toFixed(3);
  const grandTotalAmount = ordersByColor.reduce((acc: number, o: any) => acc + o.totalAmountR$, 0);

  const header = renderCorporatePdfHeader({
    docBadge: 'PEDIDO DE COMPRA DE ALUMÍNIO (EXTRUSÃO)',
    docNumber: `PC-EXT #${Math.floor(Date.now() / 1000).toString().slice(-4)}`,
    docDate: new Date().toLocaleDateString('pt-BR'),
    docSubtitle: `Distribuidora: ${extruder.tradeName} (${extruder.legalName}) | CNPJ: ${extruder.cnpj}`,
    extraLines: [
      `Consolidação de Ordens: ${ordersIncludedCount} OP(s) de Produção Aprovada(s)`,
      `Peso Total: ${grandTotalWeight} kg (${grandTotalTons} ton) | Total de Barras 6m: ${grandTotalBars} barras`,
      `Faixa Negociada: ${volumeInfo.currentTier.tierName} (${volumeInfo.currentTier.badge}) - Preço: R$ ${volumeInfo.negotiatedPricePerKg.toFixed(2)}/kg`,
    ],
  });

  const batchesHtml = ordersByColor
    .map((batch: any) => {
      const itemsRows = batch.items
        .map(
          (it: any) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 6px 8px; font-weight: bold; font-family: monospace; color: #047857;">${escapeHtml(it.profileCode)}</td>
          <td style="padding: 6px 8px;">${escapeHtml(it.profileName)}</td>
          <td style="padding: 6px 8px; color: #475569;">${escapeHtml(it.series)}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold;">${it.totalBars6000} brs</td>
          <td style="padding: 6px 8px; text-align: center; color: #64748b;">${it.commercialBundlesCount} amarr.</td>
          <td style="padding: 6px 8px; text-align: right; color: #334155;">${(it.totalBars6000 * 6).toFixed(1)} m</td>
          <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: #0f172a;">${it.totalWeightKg.toFixed(2)} kg</td>
          <td style="padding: 6px 8px; text-align: right; color: #64748b;">R$ ${it.pricePerKg.toFixed(2)}</td>
          <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: #b45309;">R$ ${it.totalCostR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        </tr>`
        )
        .join('');

      return `
      <div style="margin-bottom: 18px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; page-break-inside: avoid;">
        <div style="background: #0f172a; color: #fff; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: bold;">
          <span>LOTE DE ACABAMENTO: ${escapeHtml(batch.color.toUpperCase())}</span>
          <span>${batch.totalBars6000} barras (6m) | ${batch.totalWeightKg.toFixed(1)} kg | R$ ${batch.totalAmountR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #f8fafc; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 6px 8px;">Código</th>
              <th style="padding: 6px 8px;">Descrição Perfil</th>
              <th style="padding: 6px 8px;">Linha</th>
              <th style="padding: 6px 8px; text-align: center;">Barras 6m</th>
              <th style="padding: 6px 8px; text-align: center;">Fardos (4x)</th>
              <th style="padding: 6px 8px; text-align: right;">Metros</th>
              <th style="padding: 6px 8px; text-align: right;">Peso (kg)</th>
              <th style="padding: 6px 8px; text-align: right;">R$/kg</th>
              <th style="padding: 6px 8px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>`;
    })
    .join('');

  const fullHtml = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>Pedido de Compra de Alumínio - Sanches &amp; Marques</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 10px; }
      .pdf-corporate-header { display: flex; justify-content: space-between; align-items: center; }
      .header-logo { max-height: 48px; }
      .brand-name { font-size: 18px; margin: 0; font-weight: 900; }
      .brand-sub { font-size: 10px; color: #b45309; font-weight: bold; }
      .pdf-golden-divider { height: 3px; background: #b45309; margin: 10px 0 15px 0; }
      .doc-badge { background: #047857; color: #fff; padding: 3px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; display: inline-block; }
      .doc-number { font-size: 16px; font-weight: bold; }
      .company-meta { font-size: 10px; color: #475569; margin-top: 3px; }
      .company-contact { font-size: 9px; color: #64748b; margin-top: 2px; }
      .header-right { text-align: right; }
      .doc-date { font-size: 10px; margin-top: 4px; }
      .doc-subtitle { font-size: 10px; color: #334155; font-weight: 600; margin-top: 2px; }
      .extra-line { font-size: 9px; color: #475569; margin-top: 1px; }
      .totals-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid; }
      .terms-section { font-size: 10px; color: #475569; margin-top: 15px; line-height: 1.4; page-break-inside: avoid; }
      .signatures { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
      .sig-line { width: 45%; border-top: 1px solid #0f172a; text-align: center; padding-top: 6px; font-size: 11px; }
    </style>
  </head>
  <body onload="window.print()">
    ${header}
    ${batchesHtml}

    <div class="totals-summary">
      <div>
        <div style="font-size: 11px; color: #64748b;">FORNECEDOR DESTINATÁRIO:</div>
        <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${escapeHtml(extruder.legalName)}</div>
        <div style="font-size: 11px; color: #475569;">Representante: ${escapeHtml(extruder.repContact.name)} • Tel: ${escapeHtml(extruder.repContact.phone)}</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Especificação: Barras de 6.000 mm, Liga ${escapeHtml(extruder.standardAlloy)}, acabamento conforme especificado nos lotes.</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: #64748b;">VALOR TOTAL DO PEDIDO CONSOLIDADO:</div>
        <div style="font-size: 20px; font-weight: 900; color: #047857;">R$ ${grandTotalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        <div style="font-size: 11px; font-weight: bold; color: #b45309;">${grandTotalBars} barras 6m | ${grandTotalWeight.toFixed(1)} kg (${grandTotalTons} ton)</div>
        ${volumeInfo.totalSavingsR$ > 0 ? `<div style="font-size: 10px; color: #059669; font-weight: bold;">Economia de Volume: R$ ${volumeInfo.totalSavingsR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${volumeInfo.savingsPercent}%)</div>` : ''}
      </div>
    </div>

    <div class="terms-section">
      <b>Condições de Fornecimento &amp; Faturamento:</b>
      <div>• <b>Prazo de Entrega:</b> ${extruder.leadTimeDays} dias úteis no pátio de recebimento da Sanches &amp; Marques.</div>
      <div>• <b>Controle de Qualidade:</b> Perfis sem riscos superficiais, amassados ou torções axiais. Barras identificadas com etiquetas de lote e cor.</div>
      <div>• <b>Condição de Faturamento:</b> Faturamento direto no CNPJ da fábrica, boleto 28/42 ddl conforme linha de crédito ativa.</div>
    </div>

    <div class="signatures">
      <div class="sig-line">
        <b>SANCHES &amp; MARQUES ESQUADRIAS &amp; VIDRAÇARIA</b><br/>
        Departamento de Suprimentos &amp; Compras
      </div>
      <div class="sig-line">
        <b>${escapeHtml(extruder.tradeName)}</b><br/>
        Aceite Comercial &amp; Confirmação de Entrega
      </div>
    </div>
  </body>
  </html>`;

  openPrintWindow(fullHtml, `Pedido de Compra - ${extruder.tradeName}`);
};


