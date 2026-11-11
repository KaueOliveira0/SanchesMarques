/**
 * ============================================================================
 * Sanches & Marques Esquadrias Pro - Ficha de Produção, Montagem & Usinagem
 * Arquivo: src/services/factoryAssemblyPdfService.ts
 * ============================================================================
 */

import { renderCorporatePdfHeader, openPrintWindow } from '../utils/pdfPrint';
import { Order, OrderItem } from '../types';
import { TYPOLOGIES_CATALOG, PROFILES_CATALOG, ACCESSORIES_CATALOG } from '../data/catalog';

export interface MachiningProfileItem {
  profileCode: string;
  profileName: string;
  cutAngle: '45°' | '90°' | '45° / 90°' | '45° / 45°';
  lengthMm: number;
  quantity: number;
  weightKg: number;
  machiningInstructions: string; // Ex: "Furo Ø10mm p/ dreno + rasgo 120x22mm fecho concha"
}

export interface AccessoryComponentItem {
  code: string;
  description: string;
  category: 'PARAFUSO' | 'ROLDANA' | 'VEDACAO' | 'FECHO' | 'BRACO' | 'OUTRO';
  quantity: number;
  unit: string;
  applicationNotes: string; // Ex: "Aplicar nas 4 pontas do marco com silicone neutro"
}

export interface FactoryWorkOrderPayload {
  workOrderNumber: string;
  clientName: string;
  projectModel: string;
  aluminumColor: string;
  quantityUnits: number;
  widthMm: number;
  heightMm: number;
  installationNotes: string;
  profiles: MachiningProfileItem[];
  accessories: AccessoryComponentItem[];
  qualityChecklist?: string[];
}

/**
 * Gera e abre a Ficha de Produção e Usinagem em formato de impressão de alta resolução para oficina.
 */
export function generateFactoryAssemblyReport(payload: FactoryWorkOrderPayload): void {
  const headerHtml = renderCorporatePdfHeader({
    docBadge: 'FICHA DE PRODUÇÃO & USINAGEM - CHÃO DE FÁBRICA',
    docNumber: `OS #${payload.workOrderNumber}`,
    docSubtitle: 'Serralharia de Alta Precisão & Usinagem CNC',
  });

  const totalProfileWeight = payload.profiles.reduce(
    (sum, p) => sum + p.weightKg * p.quantity,
    0
  );

  const profilesTableRows = payload.profiles
    .map(
      (p, i) => `
    <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 7px 10px; font-weight: 700; font-family: monospace; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
        ${p.profileCode}
        <div style="font-size: 10px; color: #64748b; font-weight: normal;">${p.profileName}</div>
      </td>
      <td style="padding: 7px 10px; text-align: center; font-weight: 600; color: #d97706; border-bottom: 1px solid #e2e8f0;">
        ${p.cutAngle}
      </td>
      <td style="padding: 7px 10px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
        ${p.lengthMm} mm
      </td>
      <td style="padding: 7px 10px; text-align: right; font-family: monospace; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
        ${p.quantity}
      </td>
      <td style="padding: 7px 10px; text-align: right; font-family: monospace; color: #475569; border-bottom: 1px solid #e2e8f0;">
        ${p.weightKg.toFixed(2)} kg
      </td>
      <td style="padding: 7px 10px; font-size: 10.5px; color: #1e293b; background-color: ${i % 2 === 0 ? '#fffbeb' : '#fef3c7'}; border-bottom: 1px solid #e2e8f0;">
        <strong>🔧 ${p.machiningInstructions}</strong>
      </td>
    </tr>
  `
    )
    .join('');

  const accessoriesTableRows = payload.accessories
    .map(
      (a, i) => `
    <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 6px 10px; font-family: monospace; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
        ${a.code}
      </td>
      <td style="padding: 6px 10px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">
        ${a.description}
      </td>
      <td style="padding: 6px 10px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
        ${a.quantity} ${a.unit}
      </td>
      <td style="padding: 6px 10px; font-size: 10.5px; color: #475569; border-bottom: 1px solid #e2e8f0;">
        ${a.applicationNotes}
      </td>
    </tr>
  `
    )
    .join('');

  const defaultChecklist = payload.qualityChecklist || [
    'Verificação de esquadro: diferença entre diagonais ≤ 1,5 mm',
    'Furações de desaguamento (drenos) desobstruídas e testadas com água',
    'Escovas de vedação e borrachas EPDM instaladas sem estiramento longitudinal',
    'Roldanas reguladas e travadas com trava-rosca ou contra-porca',
    'Fechos e puxadores alinhados sem atrito excessivo com o contra-fecho',
    'Película de proteção de fábrica preservada para transporte',
  ];

  const checklistHtml = defaultChecklist
    .map(
      (item) => `
    <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; font-size: 10.5px; color: #334155;">
      <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #64748b; border-radius: 3px; flex-shrink: 0; margin-top: 1px;"></span>
      <span>${item}</span>
    </div>
  `
    )
    .join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Ficha de Produção - OS ${payload.workOrderNumber}</title>
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        th { background-color: #0f172a; color: #ffffff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; padding: 7px 10px; }
        .box-info { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }
      </style>
    </head>
    <body>
      ${headerHtml}

      <!-- Cabeçalho da Obra -->
      <div class="box-info">
        <div style="display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr; gap: 12px;">
          <div>
            <span style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700;">Cliente / Obra</span>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${payload.clientName}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">Projeto: <strong>${payload.projectModel}</strong></div>
          </div>
          <div>
            <span style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700;">Dimensões da Esquadria</span>
            <div style="font-size: 14px; font-weight: 800; font-family: monospace; color: #d97706;">
              ${payload.widthMm} x ${payload.heightMm} mm
            </div>
            <div style="font-size: 10.5px; color: #475569;">Qtd Peças: <strong>${payload.quantityUnits} un</strong></div>
          </div>
          <div>
            <span style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700;">Acabamento / Cor</span>
            <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${payload.aluminumColor}</div>
            <div style="font-size: 10px; color: #64748b;">Peso Alumínio: ~${totalProfileWeight.toFixed(1)} kg</div>
          </div>
          <div>
            <span style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700;">Observação Obra</span>
            <div style="font-size: 10px; color: #334155; line-height: 1.3;">${payload.installationNotes || 'Instalação convencional em contramarco.'}</div>
          </div>
        </div>
      </div>

      <!-- Tabela 1: Perfis & Usinagem -->
      <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 6px; display: flex; justify-content: space-between;">
        <span>1. ROTEIRO DE CORTE & USINAGEM DE PERFIS DE ALUMÍNIO</span>
        <span style="font-size: 10px; color: #d97706;">Atenção rigorosa aos cortes de 45° e aos drenos</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="text-align: left; width: 22%;">Código & Perfil</th>
            <th style="text-align: center; width: 10%;">Ângulo</th>
            <th style="text-align: right; width: 14%;">Medida (mm)</th>
            <th style="text-align: right; width: 8%;">Qtd</th>
            <th style="text-align: right; width: 10%;">Peso Unit.</th>
            <th style="text-align: left; width: 36%;">Instruções Detalhadas de Usinagem</th>
          </tr>
        </thead>
        <tbody>
          ${profilesTableRows}
        </tbody>
      </table>

      <!-- Tabela 2 & Checklist Lado a Lado -->
      <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 14px;">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
            2. ACESSÓRIOS, COMPONENTES & GAXETAS
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left; width: 20%;">Código</th>
                <th style="text-align: left; width: 45%;">Descrição do Componente</th>
                <th style="text-align: right; width: 15%;">Qtd</th>
                <th style="text-align: left; width: 20%;">Aplicação</th>
              </tr>
            </thead>
            <tbody>
              ${accessoriesTableRows}
            </tbody>
          </table>
        </div>

        <div>
          <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
            3. CONTROLE DE QUALIDADE & EXPEDIÇÃO (NBR 10821)
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px;">
            ${checklistHtml}
            <div style="margin-top: 14px; border-top: 1px dashed #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9.5px; color: #475569;">
              <div>Resp. Serralheiro: ___________________</div>
              <div>Resp. CQ: ___________________</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  openPrintWindow(fullHtml, `Ficha_Producao_OS_${payload.workOrderNumber}`);
}

/**
 * Constrói o payload completo de Ordem de Serviço / Ficha de Usinagem
 * a partir de um OrderItem e dados da obra.
 */
export function buildWorkOrderPayloadFromItem(
  item: OrderItem,
  orderNumber?: number,
  clientName?: string,
  color?: string
): FactoryWorkOrderPayload {
  const typo = TYPOLOGIES_CATALOG.find((t) => t.id === item.typologyId);
  const typologyName = typo?.name || item.typologyName || 'Esquadria de Alumínio';
  const effectiveColor = color || item.color || 'Branco';
  const effectiveClient = clientName || 'Produção de Fábrica';
  const osNumber = orderNumber ? `${orderNumber}` : `AVULSO-${item.id.slice(-4)}`;

  const profiles: MachiningProfileItem[] = [];

  if (typo?.formula?.cuts) {
    typo.formula.cuts.forEach((cut) => {
      const singleLen = cut.formula(item.width, item.height);
      const prof = PROFILES_CATALOG.find((p) => p.code === cut.profileCode);
      const angle =
        cut.angleLeft === 45 && cut.angleRight === 45
          ? '45° / 45°'
          : cut.angleLeft === 45 || cut.angleRight === 45
          ? '45° / 90°'
          : '90°';

      let machining = 'Corte no esquadro exato. Desbaste e rebarbação com disco de acabamento.';
      const codeUpper = cut.profileCode.toUpperCase();

      if (codeUpper.includes('SU-001') || codeUpper.includes('GL-001')) {
        machining = 'Rasgo central 120×22mm para fecho concha a 1000mm da base + furos guia Ø4.2mm';
      } else if (codeUpper.includes('SU-002') || codeUpper.includes('GL-002') || codeUpper.includes('SU-053')) {
        machining = 'Usinagem de encaixe na base inferior para alojamento de roldana blindada + dreno oblongo';
      } else if (codeUpper.includes('SU-003') || codeUpper.includes('GL-003')) {
        machining = 'Furações de fixação Ø4.2mm p/ chumbador/contra-marco espaçadas a cada 400mm';
      } else if (codeUpper.includes('SU-005') || codeUpper.includes('GL-005') || cut.description.toLowerCase().includes('inferior')) {
        machining = 'Furação de drenagem nos trilhos inferiores (oblongo 25×5mm com válvula pingadeira)';
      } else if (codeUpper.includes('SU-004') || codeUpper.includes('GL-004') || cut.description.toLowerCase().includes('superior')) {
        machining = 'Encaixe superior guia deslizante e limitador de batente';
      } else if (angle.includes('45°')) {
        machining = 'Corte em 45° para montagem em esquadria c/ presilhas e cantoneiras de travamento';
      }

      const weightKg = (singleLen / 1000) * (prof?.kgm || 0.45);

      profiles.push({
        profileCode: cut.profileCode,
        profileName: cut.description || prof?.name || 'Perfil de Alumínio',
        cutAngle: angle,
        lengthMm: singleLen,
        quantity: cut.quantity * item.quantity,
        weightKg: Number(weightKg.toFixed(2)),
        machiningInstructions: machining,
      });
    });
  }

  const accessories: AccessoryComponentItem[] = [];

  if (typo?.formula?.accessories) {
    typo.formula.accessories.forEach((acc) => {
      const accDef = ACCESSORIES_CATALOG.find((a) => a.id === acc.accessoryId);
      const qty = acc.formulaQuantity(item.width, item.height, item.quantity);
      let cat: AccessoryComponentItem['category'] = 'OUTRO';
      const idUpper = acc.accessoryId.toUpperCase();
      if (idUpper.includes('ROL') || idUpper.includes('ROLD')) cat = 'ROLDANA';
      else if (idUpper.includes('FECHO') || idUpper.includes('CONCHA')) cat = 'FECHO';
      else if (idUpper.includes('VED') || idUpper.includes('EPDM') || idUpper.includes('ESCOVA')) cat = 'VEDACAO';
      else if (idUpper.includes('PARAF') || idUpper.includes('FIX')) cat = 'PARAFUSO';
      else if (idUpper.includes('BRACO')) cat = 'BRACO';

      accessories.push({
        code: acc.accessoryId,
        description: accDef?.name || acc.accessoryId,
        category: cat,
        quantity: qty,
        unit: accDef?.unit || 'un',
        applicationNotes: `Instalar conforme roteiro de montagem (${cat.toLowerCase()})`,
      });
    });
  }

  // Componentes personalizados (se houver)
  if (item.customMaterials) {
    if (item.customMaterials.rollerType) {
      accessories.push({
        code: 'MAT-ROL',
        description: item.customMaterials.rollerType,
        category: 'ROLDANA',
        quantity: item.quantity * 2,
        unit: 'un',
        applicationNotes: 'Roldana personalizada na base das folhas móveis',
      });
    }
    if (item.customMaterials.lockType) {
      accessories.push({
        code: 'MAT-LOCK',
        description: item.customMaterials.lockType,
        category: 'FECHO',
        quantity: item.quantity,
        unit: 'un',
        applicationNotes: 'Fecho no montante lateral de engate',
      });
    }
    if (item.customMaterials.sealType) {
      accessories.push({
        code: 'MAT-SEAL',
        description: item.customMaterials.sealType,
        category: 'VEDACAO',
        quantity: item.quantity,
        unit: 'kit',
        applicationNotes: 'Guarnições nos perímetros e batedores',
      });
    }
  }

  return {
    workOrderNumber: osNumber,
    clientName: effectiveClient,
    projectModel: `${typologyName} (${item.roomTag || 'Vão Geral'})`,
    aluminumColor: effectiveColor,
    quantityUnits: item.quantity,
    widthMm: item.width,
    heightMm: item.height,
    installationNotes: item.notes || `Instalação com calços NBR 7199 e fixadores padrão. Ambiente: ${item.roomTag || 'Geral'}.`,
    profiles,
    accessories,
  };
}

/**
 * Imprime a Ficha de Produção & Usinagem para um item específico de pedido.
 */
export function printFactoryProductionPdfForItem(
  item: OrderItem,
  orderNumber?: number,
  clientName?: string,
  color?: string
): void {
  const payload = buildWorkOrderPayloadFromItem(item, orderNumber, clientName, color);
  generateFactoryAssemblyReport(payload);
}

/**
 * Imprime a Ficha de Produção & Usinagem completa para todo o pedido.
 */
export function printFactoryProductionPdfForOrder(order: Order): void {
  if (!order.items || order.items.length === 0) return;
  // Se o pedido tiver um item ou vários, podemos gerar a ficha consolidada ou do primeiro item
  const combinedProfiles: MachiningProfileItem[] = [];
  const combinedAccessories: AccessoryComponentItem[] = [];

  order.items.forEach((item) => {
    const itemPayload = buildWorkOrderPayloadFromItem(item, order.number, order.clientName, order.color);
    combinedProfiles.push(...itemPayload.profiles);
    combinedAccessories.push(...itemPayload.accessories);
  });

  const payload: FactoryWorkOrderPayload = {
    workOrderNumber: `${order.number}`,
    clientName: order.clientName,
    projectModel: `${order.items.length} esquadria(s) do pedido`,
    aluminumColor: order.color,
    quantityUnits: order.items.reduce((sum, it) => sum + it.quantity, 0),
    widthMm: order.items[0]?.width || 1500,
    heightMm: order.items[0]?.height || 1200,
    installationNotes: `Obra: ${order.clientAddress || order.clientName}. Total de ${order.items.length} esquadrias programadas para fábrica.`,
    profiles: combinedProfiles,
    accessories: combinedAccessories,
  };

  generateFactoryAssemblyReport(payload);
}

