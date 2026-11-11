import { DeliveryRomaneio } from '../types';
import { getEffectiveCompanyProfile } from './companyProfile';
import { getEffectiveLogoBase64 } from './logoData';
import { escapeHtml, openPrintWindow } from './pdfPrint';

export interface DetailedRomaneioItem {
  description: string;
  dimensions: string;
  quantity: number;
  location: string;
  weightKg: number;
  widthMm?: number;
  heightMm?: number;
  unitAreaM2: number;
  totalAreaM2: number;
  unitWeightKg: number;
  totalWeightKg: number;
  isEsquadria: boolean;
}

export interface RomaneioDetailedTotals {
  totalPieces: number;
  totalAreaM2: number;
  totalWeightKg: number;
  avgKgPerM2: number;
  esquadriasCount: number;
  accessoriesCount: number;
}

/**
 * Faz o parse seguro de dimensões em string (ex: '1500 × 1200 mm', '2000x2400', '1.5 x 1.2m')
 */
export const parseDimensions = (dimStr: string): { widthMm: number; heightMm: number } | null => {
  if (!dimStr) return null;

  // Normaliza separadores (x, X, ×, *)
  const clean = dimStr.replace(/\s+/g, ' ').trim();
  const matchMm = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:[xX×*])\s*(\d+(?:[.,]\d+)?)/);

  if (!matchMm) return null;

  let w = parseFloat(matchMm[1].replace(',', '.'));
  let h = parseFloat(matchMm[2].replace(',', '.'));

  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return null;

  // Se o valor estiver em metros (ex: 1.5 x 1.2), converte para milímetros
  if (w <= 10 && h <= 10) {
    w = Math.round(w * 1000);
    h = Math.round(h * 1000);
  }

  return { widthMm: Math.round(w), heightMm: Math.round(h) };
};

/**
 * Calcula detalhadamente os dados de peso e área de um item do romaneio
 */
export const calculateRomaneioItemMetrics = (
  item: DeliveryRomaneio['items'][0]
): DetailedRomaneioItem => {
  const qty = Math.max(1, item.quantity || 1);
  const parsed = parseDimensions(item.dimensions);

  let unitAreaM2 = 0;
  let totalAreaM2 = 0;
  let isEsquadria = false;

  if (parsed && parsed.widthMm > 0 && parsed.heightMm > 0) {
    unitAreaM2 = Math.round(((parsed.widthMm * parsed.heightMm) / 1000000) * 1000) / 1000;
    totalAreaM2 = Math.round(unitAreaM2 * qty * 100) / 100;
    isEsquadria = true;
  }

  // Peso unitário e peso total
  const totalWeightKg = Math.max(0, item.weightKg || 0);
  let unitWeightKg = Math.round((totalWeightKg / qty) * 100) / 100;

  // Se o peso unitário for 0 mas houver área (esquadria sem peso informado), estima 14kg/m²
  if (unitWeightKg === 0 && unitAreaM2 > 0) {
    unitWeightKg = Math.round(unitAreaM2 * 14 * 10) / 10;
  }

  const calculatedTotalWeight = totalWeightKg > 0 ? totalWeightKg : Math.round(unitWeightKg * qty * 10) / 10;

  return {
    description: item.description,
    dimensions: item.dimensions,
    quantity: qty,
    location: item.location || 'Geral',
    weightKg: calculatedTotalWeight,
    widthMm: parsed?.widthMm,
    heightMm: parsed?.heightMm,
    unitAreaM2,
    totalAreaM2,
    unitWeightKg,
    totalWeightKg: calculatedTotalWeight,
    isEsquadria,
  };
};

/**
 * Calcula os totais agregados de peso, área e volumes do romaneio
 */
export const calculateRomaneioDetailedTotals = (
  items: DeliveryRomaneio['items']
): {
  detailedItems: DetailedRomaneioItem[];
  totals: RomaneioDetailedTotals;
} => {
  const detailedItems = (items || []).map(calculateRomaneioItemMetrics);

  const totalPieces = detailedItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalAreaM2 = Math.round(detailedItems.reduce((acc, it) => acc + it.totalAreaM2, 0) * 100) / 100;
  const totalWeightKg = Math.round(detailedItems.reduce((acc, it) => acc + it.totalWeightKg, 0) * 10) / 10;

  const esquadriasCount = detailedItems.filter((it) => it.isEsquadria).reduce((acc, it) => acc + it.quantity, 0);
  const accessoriesCount = detailedItems.filter((it) => !it.isEsquadria).reduce((acc, it) => acc + it.quantity, 0);

  const avgKgPerM2 = totalAreaM2 > 0 ? Math.round((totalWeightKg / totalAreaM2) * 10) / 10 : 0;

  return {
    detailedItems,
    totals: {
      totalPieces,
      totalAreaM2,
      totalWeightKg,
      avgKgPerM2,
      esquadriasCount,
      accessoriesCount,
    },
  };
};

/**
 * Gera o documento HTML do Romaneio de Entrega completo com área, peso e dados corporativos
 */
export const generateRomaneioPdfHtml = (romaneio: DeliveryRomaneio): string => {
  const profile = getEffectiveCompanyProfile();
  const logoSrc = getEffectiveLogoBase64();
  const { detailedItems, totals } = calculateRomaneioDetailedTotals(romaneio.items);

  const formattedDate = romaneio.date
    ? new Date(romaneio.date + 'T12:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  const rowsHtml = detailedItems
    .map(
      (it, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
      <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
      <td style="padding: 6px 8px;">
        <div style="font-weight: bold; color: #0f172a;">${escapeHtml(it.description)}</div>
        ${it.isEsquadria ? '<span style="font-size: 9px; color: #0284c7; background: #e0f2fe; padding: 1px 4px; border-radius: 3px; font-weight: 600;">Esquadria Montada</span>' : '<span style="font-size: 9px; color: #b45309; background: #fef3c7; padding: 1px 4px; border-radius: 3px; font-weight: 600;">Acessório / Insumo</span>'}
      </td>
      <td style="padding: 6px 8px; font-family: monospace; font-size: 11px; color: #334155;">
        ${escapeHtml(it.dimensions)}
      </td>
      <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #0369a1; font-size: 12px;">
        ${it.quantity}
      </td>
      <td style="padding: 6px 8px; text-align: right; font-family: monospace; color: #475569;">
        ${it.unitAreaM2 > 0 ? it.unitAreaM2.toFixed(2) + ' m²' : '—'}
      </td>
      <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">
        ${it.totalAreaM2 > 0 ? it.totalAreaM2.toFixed(2) + ' m²' : '—'}
      </td>
      <td style="padding: 6px 8px; text-align: right; font-family: monospace; color: #475569;">
        ${it.unitWeightKg > 0 ? it.unitWeightKg.toFixed(1) + ' kg' : '—'}
      </td>
      <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #047857;">
        ${it.totalWeightKg.toFixed(1)} kg
      </td>
      <td style="padding: 6px 8px; color: #475569; font-size: 10px;">
        ${escapeHtml(it.location)}
      </td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Romaneio de Entrega #${romaneio.number} - ${escapeHtml(romaneio.clientName)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.35;
    }
    .pdf-corporate-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-logo {
      max-height: 54px;
      max-width: 160px;
      object-fit: contain;
    }
    .company-text {
      text-align: left;
    }
    .brand-name {
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 0.05em;
      margin: 0;
      color: #0f172a;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: #b45309;
      text-transform: uppercase;
    }
    .company-meta, .company-contact {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
    }
    .doc-badge {
      display: inline-block;
      background: #0f172a;
      color: #fbbf24;
      font-weight: 800;
      font-size: 9px;
      letter-spacing: 0.1em;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .doc-number {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 2px;
    }
    .doc-date {
      font-size: 10px;
      color: #475569;
      margin-top: 2px;
    }
    .doc-status {
      font-size: 9px;
      font-weight: 700;
      color: #047857;
      background: #d1fae5;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 3px;
    }
    .pdf-golden-divider {
      height: 3px;
      background: linear-gradient(90deg, #d97706 0%, #fbbf24 50%, #d97706 100%);
      margin: 6px 0 12px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .info-card-title {
      font-size: 9px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .info-line {
      margin-bottom: 3px;
      font-size: 10.5px;
    }
    .info-line strong {
      color: #334155;
    }
    table.romaneio-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    table.romaneio-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 8px;
      font-size: 9.5px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      border-right: 1px solid #334155;
    }
    table.romaneio-table th:last-child {
      border-right: none;
    }
    .totals-bar {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .total-stat {
      display: flex;
      flex-direction: column;
    }
    .total-stat-label {
      font-size: 9px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
    }
    .total-stat-val {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .total-stat-val.accent {
      color: #b45309;
    }
    .total-stat-val.green {
      color: #047857;
    }
    .terms-box {
      border: 1px dashed #cbd5e1;
      background: #fafafa;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 9.5px;
      color: #475569;
      line-height: 1.4;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .signatures-row {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .signature-block {
      width: 44%;
      text-align: center;
      border-top: 1px solid #0f172a;
      padding-top: 6px;
      font-size: 10px;
    }
    .signature-block strong {
      display: block;
      color: #0f172a;
    }
    .doc-footer {
      text-align: center;
      font-size: 8.5px;
      color: #94a3b8;
      margin-top: 18px;
      border-top: 1px solid #f1f5f9;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <!-- Cabeçalho Corporativo Oficial -->
  <div class="pdf-corporate-header">
    <div class="header-left">
      <img src="${logoSrc}" alt="Sanches &amp; Marques" class="header-logo" />
      <div class="company-text">
        <h1 class="brand-name">SANCHES &amp; MARQUES</h1>
        <div class="brand-sub">SISTEMA INDUSTRIAL DE ESQUADRIAS &amp; VIDRAÇARIA</div>
        <div class="company-meta">
          <span>CNPJ: ${escapeHtml(profile.cnpj)}</span> | <span>I.E: ${escapeHtml(profile.ie)}</span>
        </div>
        <div class="company-contact">
          <span>${escapeHtml(profile.address)} - ${escapeHtml(profile.cityState)}</span>
          <br/>
          <span>Tel: ${escapeHtml(profile.phone)} | E-mail: ${escapeHtml(profile.email)}</span>
        </div>
      </div>
    </div>

    <div class="header-right">
      <div class="doc-badge">EXPEDIÇÃO &amp; LOGÍSTICA</div>
      <div class="doc-number">ROMANEIO Nº ${romaneio.number}</div>
      <div class="doc-date">Emissão: <b>${escapeHtml(formattedDate)}</b></div>
      <div class="doc-status">${escapeHtml(romaneio.status.toUpperCase())}</div>
    </div>
  </div>

  <div class="pdf-golden-divider"></div>

  <!-- Cards de Destinatário e Transporte -->
  <div class="info-grid">
    <div class="info-card">
      <div class="info-card-title">1. Dados do Destinatário &amp; Local da Obra</div>
      <div class="info-line"><strong>Cliente / Obra:</strong> ${escapeHtml(romaneio.clientName)}</div>
      <div class="info-line"><strong>Endereço de Entrega:</strong> ${escapeHtml(romaneio.address || 'Conforme cadastro da obra')}</div>
      <div class="info-line">
        <strong>Ordem de Produção:</strong> 
        ${romaneio.orderNumber ? `<span style="font-family:monospace; font-weight:bold; color:#0369a1;">OP #${romaneio.orderNumber}</span>` : 'Expedição Avulsa'}
      </div>
      ${romaneio.notes ? `<div class="info-line"><strong>Observações:</strong> ${escapeHtml(romaneio.notes)}</div>` : ''}
    </div>

    <div class="info-card">
      <div class="info-card-title">2. Dados do Transporte &amp; Veículo</div>
      <div class="info-line"><strong>Motorista Responsável:</strong> ${escapeHtml(romaneio.driverName || 'Frota Própria')}</div>
      <div class="info-line"><strong>Veículo / Placa:</strong> ${escapeHtml(romaneio.vehiclePlate || 'Não informada')}</div>
      <div class="info-line"><strong>Nota Fiscal / Remessa:</strong> ${escapeHtml(romaneio.invoiceNumber || 'Acompanha a Carga')}</div>
      <div class="info-line"><strong>Tipo de Carga:</strong> Esquadrias de Alumínio &amp; Vidros Montados</div>
    </div>
  </div>

  <!-- Tabela Detalhada com Dimensões, Área (m²) e Peso (kg) -->
  <table class="romaneio-table">
    <thead>
      <tr>
        <th style="width: 28px; text-align: center;">#</th>
        <th style="text-align: left;">Descrição da Esquadria / Material</th>
        <th style="width: 95px; text-align: left;">Dimensões</th>
        <th style="width: 40px; text-align: center;">Qtd</th>
        <th style="width: 65px; text-align: right;">Área Unit.</th>
        <th style="width: 65px; text-align: right;">Área Total</th>
        <th style="width: 65px; text-align: right;">Peso Unit.</th>
        <th style="width: 68px; text-align: right;">Peso Total</th>
        <th style="width: 90px; text-align: left;">Local / Vão</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- Barra de Totais Consolidados -->
  <div class="totals-bar">
    <div class="total-stat">
      <span class="total-stat-label">Volumes Totais</span>
      <span class="total-stat-val accent">${totals.totalPieces} un</span>
      <span style="font-size: 9px; color: #64748b;">${totals.esquadriasCount} esquadria(s) • ${totals.accessoriesCount} insumo(s)</span>
    </div>

    <div class="total-stat">
      <span class="total-stat-label">Área Total de Vãos</span>
      <span class="total-stat-val">${totals.totalAreaM2.toFixed(2)} m²</span>
      <span style="font-size: 9px; color: #64748b;">Envidraçamento &amp; Caixilharia</span>
    </div>

    <div class="total-stat">
      <span class="total-stat-label">Peso Bruto Estimado</span>
      <span class="total-stat-val green">${totals.totalWeightKg.toFixed(1)} kg</span>
      <span style="font-size: 9px; color: #64748b;">Alumínio + Vidros + Ferragens</span>
    </div>

    <div class="total-stat">
      <span class="total-stat-label">Densidade da Carga</span>
      <span class="total-stat-val" style="font-size: 13px; color: #475569;">${totals.avgKgPerM2 > 0 ? totals.avgKgPerM2.toFixed(1) + ' kg/m²' : '—'}</span>
      <span style="font-size: 9px; color: #64748b;">Relação Peso / Área</span>
    </div>
  </div>

  <!-- Termo de Recebimento e Conferência na Obra -->
  <div class="terms-box">
    <strong>DECLARAÇÃO DE CONFERÊNCIA &amp; RECEBIMENTO NO LOCAL DA OBRA:</strong><br/>
    Declaro que recebi da <strong>Sanches &amp; Marques Esquadrias</strong> todos os itens, esquadrias e insumos descritos neste romaneio devidamente conferidos, com pintura/anodização intactas, vidros sem riscos ou trincas e acessórios completos. Comprometo-me a armazenar os volumes em local plano, seco e protegido de intempéries e respingos de argamassa ou cimento até a instalação definitiva (conforme ABNT NBR 10821).
  </div>

  <!-- Assinaturas Responsáveis -->
  <div class="signatures-row">
    <div class="signature-block">
      <strong>${escapeHtml(romaneio.receiverName || 'Recebedor na Obra / Encarregado')}</strong>
      <span>Nome Legível / CPF: ${escapeHtml(romaneio.receiverDocument || '___________________________')}</span>
      <div style="font-size: 9px; color: #64748b; margin-top: 3px;">Assinatura do Responsável no Canteiro</div>
    </div>

    <div class="signature-block">
      <strong>${escapeHtml(romaneio.driverName || 'Motorista / Expedição Fábrica')}</strong>
      <span>Placa: ${escapeHtml(romaneio.vehiclePlate || 'Frota Sanches & Marques')}</span>
      <div style="font-size: 9px; color: #64748b; margin-top: 3px;">Responsável pelo Transporte e Descarga</div>
    </div>
  </div>

  <!-- Rodapé do Documento -->
  <div class="doc-footer">
    Documento oficial de logística e controle de carga industrial • Sanches &amp; Marques Esquadrias e Vidraçaria • Gerado via Sistema PCP
  </div>
</body>
</html>`;
};

/**
 * Dispara a impressão / salvamento em PDF do Romaneio
 */
export const printRomaneioPdf = (romaneio: DeliveryRomaneio): void => {
  const html = generateRomaneioPdfHtml(romaneio);
  const clientClean = (romaneio.clientName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
  openPrintWindow(html, `Romaneio_Entrega_${romaneio.number}_${clientClean}`);
};

/**
 * Gera mensagem estruturada para envio de resumo de carga via WhatsApp
 */
export const generateRomaneioWhatsAppText = (romaneio: DeliveryRomaneio): string => {
  const { detailedItems, totals } = calculateRomaneioDetailedTotals(romaneio.items);

  const itemsList = detailedItems
    .map(
      (it, idx) =>
        `${idx + 1}. *${it.description}* - ${it.quantity}un (${it.dimensions})` +
        (it.totalAreaM2 > 0 ? ` [${it.totalAreaM2.toFixed(2)}m² / ${it.totalWeightKg.toFixed(1)}kg]` : ` [${it.totalWeightKg.toFixed(1)}kg]`)
    )
    .join('\n');

  return (
    `🚚 *SANCHES & MARQUES ESQUADRIAS - ROMANEIO DE EXPEDIÇÃO Nº ${romaneio.number}*\n\n` +
    `👤 *Cliente / Obra:* ${romaneio.clientName}\n` +
    `📍 *Endereço:* ${romaneio.address || 'A combinar'}\n` +
    (romaneio.orderNumber ? `📋 *Ordem de Produção:* OP #${romaneio.orderNumber}\n` : '') +
    `🚛 *Motorista / Veículo:* ${romaneio.driverName || 'Frota Própria'} (${romaneio.vehiclePlate || 'Placa em trânsito'})\n` +
    `📑 *Nota Fiscal:* ${romaneio.invoiceNumber || 'Acompanha a carga'}\n\n` +
    `📦 *RESUMO DE CARGA:*\n` +
    `• Volumes: *${totals.totalPieces} unidade(s)*\n` +
    `• Área Total de Esquadrias: *${totals.totalAreaM2.toFixed(2)} m²*\n` +
    `• Peso Bruto da Carga: *${totals.totalWeightKg.toFixed(1)} kg*\n\n` +
    `📋 *ITENS EMBARCADOS:*\n${itemsList}\n\n` +
    `✅ _Carga conferida e pronta para entrega e descarga no local da obra._`
  );
};
