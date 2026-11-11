import QRCode from 'qrcode';
import { Order, OrderItem, TypologyItem } from '../types';
import { CompanyProfile } from './companyProfile';

export interface ProductionLabelData {
  orderId: string;
  orderNumber: number;
  itemId: string;
  clientName: string;
  projectAddress?: string;
  roomTag: string;
  typologyCode: string;
  typologyName: string;
  series: string;
  widthMm: number;
  heightMm: number;
  areaM2: number;
  color: string;
  glassDescription: string;
  estimatedWeightKg: number;
  deliveryDate: string;
  productionStep: string;
  batchNumber: string;
  qrPayload: string;
  qrCodeDataUrl?: string;
}

/**
 * Serializa a identificação do vão em um payload compacto para o QR Code
 * Formato: SMPRO:O{orderNumber}:I{itemId}
 */
export function generateItemQrPayload(orderNumber: number, itemId: string): string {
  return `SMPRO:O${orderNumber}:I${itemId}`;
}

/**
 * Decodifica o payload do QR code
 */
export function parseItemQrPayload(payload: string): { orderNumber: number; itemId: string } | null {
  if (!payload || typeof payload !== 'string') return null;
  const clean = payload.trim();

  // Formato: SMPRO:O1001:Iitem_1 ou SMPRO:ORD1001:ITEM1 ou JSON
  if (clean.startsWith('{')) {
    try {
      const data = JSON.parse(clean);
      if (data.orderNumber && data.itemId) {
        return { orderNumber: Number(data.orderNumber), itemId: String(data.itemId) };
      }
    } catch {}
  }

  // Regex compatível com vários formatos de prefixo
  const match = clean.match(/SMPRO:O(?:RD)?(\d+):I(?:TEM)?([a-zA-Z0-9_-]+)/i);
  if (match) {
    return {
      orderNumber: parseInt(match[1], 10),
      itemId: match[2],
    };
  }

  // Fallback para caso seja apenas o número do pedido ou ID puro
  const numMatch = clean.match(/#?(\d{3,6})/);
  if (numMatch) {
    return {
      orderNumber: parseInt(numMatch[1], 10),
      itemId: '',
    };
  }

  return null;
}

/**
 * Calcula a área em m² e peso estimado do item caso não estejam preenchidos
 */
export function calculateLabelMetrics(widthMm: number, heightMm: number, weightKg?: number): { areaM2: number; weightKg: number } {
  const safeW = Math.max(100, widthMm || 1000);
  const safeH = Math.max(100, heightMm || 1000);
  const areaM2 = Math.round((safeW / 1000) * (safeH / 1000) * 100) / 100;

  // Se não foi informado o peso, estima ~15kg/m² para esquadria de alumínio + vidro
  const estimatedWeight = weightKg && weightKg > 0 ? weightKg : Math.round(areaM2 * 14.5 * 10) / 10;

  return { areaM2, weightKg: estimatedWeight };
}

/**
 * Gera os dados estruturados de uma etiqueta de produção
 */
export function formatProductionLabelData(
  order: Order,
  item: OrderItem,
  companyProfile?: CompanyProfile
): ProductionLabelData {
  const widthMm = item.widthMm || item.width || 1200;
  const heightMm = item.heightMm || item.height || 1200;
  const metrics = calculateLabelMetrics(widthMm, heightMm, item.weightKg);

  const qrPayload = generateItemQrPayload(order.number, item.id);
  const batchYear = new Date(order.createdAt || Date.now()).getFullYear();
  const batchMonth = String(new Date(order.createdAt || Date.now()).getMonth() + 1).padStart(2, '0');
  const batchNumber = `LOTE-${batchYear}${batchMonth}-P${order.number}`;

  return {
    orderId: order.id,
    orderNumber: order.number,
    itemId: item.id,
    clientName: order.clientName || 'Cliente sem nome',
    projectAddress: order.projectAddress || order.clientAddress || order.address || 'Obra Padrão',
    roomTag: item.roomTag || item.location || 'Vão Geral',
    typologyCode: item.typologyId || 'ESQ-01',
    typologyName: item.typologyName || 'Esquadria de Alumínio',
    series: item.typologyName?.includes('Gold') ? 'Linha Gold 32mm' : item.typologyName?.includes('Chroma') ? 'Linha Chroma 20mm' : 'Linha Suprema 25mm',
    widthMm,
    heightMm,
    areaM2: metrics.areaM2,
    color: item.aluminumColor || item.color || order.color || 'Branco',
    glassDescription: item.glassType || 'Vidro 6mm Incolor',
    estimatedWeightKg: metrics.weightKg,
    deliveryDate: order.deliveryDate || 'A definir',
    productionStep: order.productionStep || 'Corte CNC',
    batchNumber,
    qrPayload,
  };
}

/**
 * Gera DataURL do QR Code em alta resolução para impressão térmica nítida
 */
export async function generateQrCodeDataUrl(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR Code DataURL:', err);
    return '';
  }
}
