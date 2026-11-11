export interface QualityCheckItem {
  id: string;
  label: string;
  toleranceLimit: string;
  passed: boolean;
  notes?: string;
}

export interface QualityInspectionInput {
  orderNumber: number;
  clientName: string;
  typologyCode: string;
  typologyName: string;
  widthMm: number;
  heightMm: number;
  diagonal1Mm: number;
  diagonal2Mm: number;
  inspectorName?: string;
  checklist?: QualityCheckItem[];
}

export interface QualityInspectionData {
  orderNumber: number;
  clientName: string;
  typologyCode: string;
  typologyName: string;
  widthMm: number;
  heightMm: number;
  diagonal1Mm: number;
  diagonal2Mm: number;
  diagonalDifferenceMm: number;
  isSquareApproved: boolean;
  overallApproved: boolean;
  inspectorName: string;
  inspectionDate: string;
  certificateNumber: string;
  checklist: QualityCheckItem[];
}

export const DEFAULT_QUALITY_CHECKLIST: QualityCheckItem[] = [
  {
    id: 'chk_square',
    label: 'Tolerância Dimensional de Esquadro (Diagonais D1 e D2)',
    toleranceLimit: '|D1 - D2| ≤ 2,0 mm conforme ABNT NBR 10821-2',
    passed: true,
    notes: 'Medição realizada com trena calibrada de precisão.',
  },
  {
    id: 'chk_sliding',
    label: 'Deslizamento Suave e Alinhamento das Roldanas',
    toleranceLimit: 'Força de acionamento inicial ≤ 30 N sem atrito anormal',
    passed: true,
    notes: 'Roldanas reguladas e lubrificadas.',
  },
  {
    id: 'chk_drainage',
    label: 'Usinagem de Drenos e Válvulas Anti-Refluxo',
    toleranceLimit: 'Furos oblongos 5x30mm desobstruídos com pingadeiras',
    passed: true,
    notes: 'Drenos testados com vazão de água na bancada.',
  },
  {
    id: 'chk_seals',
    label: 'Assentamento de Escovas Fin-Seal e Guarnições EPDM',
    toleranceLimit: '100% de contato contínuo sem dobras ou estiramento',
    passed: true,
    notes: 'Vedação perimetral completa.',
  },
  {
    id: 'chk_locks',
    label: 'Travamento e Firmeza do Fecho Concha / Cremona',
    toleranceLimit: 'Engate preciso com folga de recuo ≤ 1,0 mm',
    passed: true,
    notes: 'Gabarito de fechamento verificado.',
  },
  {
    id: 'chk_finish',
    label: 'Inspeção Visual da Pintura Eletrostática / Anodização',
    toleranceLimit: 'Livre de riscos, bolhas, porosidades ou mordidas de morsa',
    passed: true,
    notes: 'Película protetora plástica intacta para transporte.',
  },
];

export const evaluateQualityInspection = (
  input: QualityInspectionInput
): QualityInspectionData => {
  const diff = Math.round(Math.abs(input.diagonal1Mm - input.diagonal2Mm) * 10) / 10;
  const isSquareApproved = diff <= 2.0;

  const checklist = input.checklist || DEFAULT_QUALITY_CHECKLIST;
  const allChecksPassed = checklist.every((item) => item.passed);
  const overallApproved = isSquareApproved && allChecksPassed;

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const certNumber = `CQ-${input.orderNumber}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  return {
    orderNumber: input.orderNumber,
    clientName: input.clientName,
    typologyCode: input.typologyCode,
    typologyName: input.typologyName,
    widthMm: input.widthMm,
    heightMm: input.heightMm,
    diagonal1Mm: input.diagonal1Mm,
    diagonal2Mm: input.diagonal2Mm,
    diagonalDifferenceMm: diff,
    isSquareApproved,
    overallApproved,
    inspectorName: input.inspectorName || 'Carlos Eduardo (Inspetor N1 ABNT)',
    inspectionDate: dateStr,
    certificateNumber: certNumber,
    checklist,
  };
};

export const generateWarrantyCertificateHtml = (
  data: QualityInspectionData
): string => {
  const checkRows = data.checklist
    .map(
      (item) => `
    <tr>
      <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <b>${item.label}</b><br/>
        <span style="color: #64748b; font-size: 10px;">${item.toleranceLimit}</span>
      </td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 11px; font-weight: bold; color: ${
        item.passed ? '#059669' : '#dc2626'
      };">
        ${item.passed ? '✓ CONFORME' : '✗ NÃO CONFORME'}
      </td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8"/>
    <title>Certificado de Qualidade & Garantia - ${data.certificateNumber}</title>
    <style>
      @page { size: A4; margin: 15mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #fff; }
      .cert-border { border: 2px solid #0f172a; padding: 20px; border-radius: 8px; position: relative; }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #b45309; padding-bottom: 12px; }
      .brand-title { font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #0f172a; margin: 0; }
      .brand-sub { font-size: 11px; font-weight: 700; color: #b45309; letter-spacing: 2px; }
      .cert-title-box { text-align: right; }
      .cert-title { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0; }
      .cert-no { font-size: 12px; font-family: monospace; color: #475569; }
      .status-stamp { display: inline-block; padding: 6px 16px; border-radius: 6px; font-weight: 900; font-size: 14px; letter-spacing: 1px; margin: 15px 0; border: 2px solid; }
      .approved { background: #ecfdf5; color: #047857; border-color: #059669; }
      .rejected { background: #fef2f2; color: #b91c1c; border-color: #dc2626; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      th { background: #0f172a; color: #fff; padding: 8px 10px; font-size: 11px; text-align: left; }
      .warranty-box { border: 1.5px solid #d97706; background: #fffbeb; padding: 12px; border-radius: 6px; font-size: 11px; margin-bottom: 20px; }
      .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; text-align: center; }
      .sign-line { border-top: 1px solid #0f172a; padding-top: 6px; font-size: 11px; font-weight: bold; }
    </style>
  </head>
  <body onload="window.print()">
    <div class="cert-border">
      <div class="header">
        <div>
          <h1 class="brand-title">SANCHES & MARQUES</h1>
          <div class="brand-sub">ESQUADRIAS DE ALUMÍNIO DE ALTO PADRÃO</div>
        </div>
        <div class="cert-title-box">
          <div class="cert-title">LAUDO TÉCNICO DE CQ &amp; GARANTIA</div>
          <div class="cert-no">${data.certificateNumber}</div>
        </div>
      </div>

      <div style="text-align: center;">
        <div class="status-stamp ${data.overallApproved ? 'approved' : 'rejected'}">
          ${data.overallApproved ? 'QUALIDADE APROVADA - ABNT NBR 10821' : 'INSPEÇÃO NÃO CONFORME'}
        </div>
      </div>

      <div class="info-grid">
        <div>
          <b>Cliente / Obra:</b> ${data.clientName}<br/>
          <b>Ordem de Produção (OP):</b> #${data.orderNumber}<br/>
          <b>Tipologia:</b> ${data.typologyName} (${data.typologyCode})
        </div>
        <div>
          <b>Dimensões Vão:</b> ${data.widthMm} x ${data.heightMm} mm<br/>
          <b>Diagonais Aferidas:</b> D1 = ${data.diagonal1Mm} mm | D2 = ${data.diagonal2Mm} mm<br/>
          <b>Diferença de Esquadro |ΔD|:</b> <b>${data.diagonalDifferenceMm} mm</b> (Limite ≤ 2,0 mm)
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ITEM DE VERIFICAÇÃO / ENSAIO EM BANCADA</th>
            <th style="width: 140px; text-align: center;">RESULTADO</th>
          </tr>
        </thead>
        <tbody>
          ${checkRows}
        </tbody>
      </table>

      <div class="warranty-box">
        <b style="color: #b45309; font-size: 12px;">TERMO DE GARANTIA DE 5 ANOS</b><br/>
        A <b>SANCHES & MARQUES ESQUADRIAS</b> certifica que a esquadria especificada foi produzida sob rigorosos padrões da norma ABNT NBR 10821, utilizando perfis extrudados em liga 6060-T5 com tratamento superficial homologado. A garantia cobre defeitos de fabricação e esquadro pelo prazo legal estendido de 5 (cinco) anos a partir da data de entrega, desde que observadas as recomendações de conservação (limpeza com água e sabão neutro sem esponjas abrasivas).
      </div>

      <div class="signatures">
        <div>
          <div class="sign-line">${data.inspectorName}</div>
          <span style="font-size: 10px; color: #64748b;">Inspetor de Controle de Qualidade (Fábrica)</span>
        </div>
        <div>
          <div class="sign-line">Responsável Técnico / CREA-SP</div>
          <span style="font-size: 10px; color: #64748b;">Sanches &amp; Marques Esquadrias Pro</span>
        </div>
      </div>
    </div>
  </body>
  </html>`;
};
