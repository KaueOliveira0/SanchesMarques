export type ColorFinish = 'Branco' | 'Preto' | 'Bronze' | 'Natural' | 'Amadeirado';

export interface ProfileDefinition {
  id: string;
  code: string; // Ex: SU-001, GL-002, CHR-002, MN-053
  name: string;
  series: 'Suprema' | 'Gold' | 'Linha 25' | 'Linha 30' | 'Integrada' | 'Fachada' | 'Chroma' | 'Universal' | string;
  kgm: number; // kg por metro
  defaultLength: number; // 6000 mm
  pricePerKg: number; // R$/kg base
  category: 'Marco' | 'Folha' | 'Travessa' | 'Baguate' | 'Trilho' | 'Arremate' | 'Montante' | 'Contramarco' | 'Comercial' | string;
  machiningNote?: string;
  svgSection?: string;
  sourceCatalog?: string;
}

export interface AccessoryDefinition {
  id: string;
  code: string;
  name: string;
  unit: 'un' | 'm' | 'par' | 'kit';
  price: number;
  category: 'Roldana' | 'Fecho' | 'Vedação' | 'Parafusos' | 'Fechadura' | 'Braço' | 'Motor' | 'Puxador' | 'Guarnição' | 'Outros' | string;
  minStock: number;
  sourceCatalog?: string;
}

export interface GlassDefinition {
  id: string;
  name: string;
  thicknessMm: number;
  pricePerM2: number;
  category: 'Comum' | 'Temperado' | 'Laminado' | 'Insulado' | 'Refletivo';
}

export interface TypologyFormula {
  cuts: Array<{
    profileId: string;
    profileCode: string;
    formula: (w: number, h: number) => number;
    angleLeft: 45 | 90 | -45;
    angleRight: 45 | 90 | -45;
    quantity: number;
    description: string;
    machiningGuide?: string;
  }>;
  glass: Array<{
    formulaW: (w: number, h: number) => number;
    formulaH: (w: number, h: number) => number;
    quantity: number;
    description: string;
  }>;
  accessories: Array<{
    accessoryId: string;
    formulaQuantity: (w: number, h: number, qty: number) => number;
  }>;
}

export type OpeningType =
  | 'janela_correr'
  | 'porta_correr'
  | 'maximar'
  | 'basculante'
  | 'porta_giro'
  | 'integrada'
  | 'fixo_bandeira';

export interface ProductLineConfig {
  id: string;
  name: string;
  nominalThicknessMm: number;
  categoryBadge: string;
  description: string;
  allowedOpenings: OpeningType[];
  isCustom?: boolean;
}

export interface ExtraMaterialItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface CustomMaterialsConfig {
  rollerType?: string;
  lockType?: string;
  sealType?: string;
  counterFrameIncluded?: boolean;
  fastenerType?: string;
  siliconeGlazing?: boolean;
  glassFinish?: string;
  extraNotes?: string;
  extraMaterials?: ExtraMaterialItem[];
}

export interface TypologyItem {
  id: string;
  code: string;
  name: string;
  series: 'Suprema' | 'Gold' | 'Linha 25' | 'Linha 30' | 'Integrada' | 'Fachada' | (string & {});
  category:
    | 'Janela de Correr'
    | 'Porta de Correr'
    | 'Maxim-Ar'
    | 'Porta de Giro'
    | 'Integrada Persiana'
    | 'Basculante'
    | 'Fixo / Bandeira'
    | 'Portão'
    | 'Fachada Pele de Vidro'
    | (string & {});
  previewSvg: string;
  imageUrl?: string;
  technicalSpecs?: {
    recommendedGlass?: string;
    waterTightness?: string;
    windLoadClass?: string;
    acousticReduction?: string;
    leafCount?: number;
    defaultWidthMm?: number;
    defaultHeightMm?: number;
  };
  description: string;
  formula: TypologyFormula;
}

export interface OrderItem {
  id: string;
  typologyId: string;
  typologyName: string;
  width: number; // mm
  height: number; // mm
  widthMm?: number; // Alias para width
  heightMm?: number; // Alias para height
  quantity: number;
  roomTag: string; // Ex: "Quarto 1", "Sala Principal"
  location?: string; // Alias para roomTag
  color: ColorFinish;
  aluminumColor?: string; // Alias para color
  glassId: string;
  glassType?: string; // Alias descritivo
  unitPrice?: number;
  totalPrice?: number;
  glassUnitPrice?: number;
  weightKg?: number;
  glassAreaM2?: number;
  notes?: string;
  customMaterials?: CustomMaterialsConfig;
}

export interface Order {
  id: string;
  number: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  address?: string; // Alias
  projectAddress?: string; // Alias para clientAddress
  createdAt: string;
  date?: string; // Alias para createdAt
  deliveryDate: string;
  status: 'Rascunho' | 'Orçamento' | 'Aprovado' | 'Em Produção' | 'Concluído' | 'Cancelado';
  items: OrderItem[];
  color: ColorFinish;
  marginPercent?: number; // Margem padrão (ex: 35%)
  marginPct?: number; // Alias
  laborRatePerM2?: number; // Mão de obra por m² (ex: R$ 160)
  laborCostPerM2?: number; // Alias
  taxRatePercent?: number; // Impostos (ex: 6%)
  taxPct?: number; // Alias
  discountValue?: number; // Desconto em R$
  discountAmount?: number; // Alias
  totalWeightKg: number;
  totalGlassM2: number;
  materialCost: number;
  laborCost: number;
  subtotal: number;
  finalPrice: number;
  productionStep?: ProductionStage;
  responsibleWorker?: string;
  sellerName?: string;
  paymentMethod?: string;
  paymentTerms?: string; // Alias
  notes?: string;
  history: Array<{ date: string; action: string }>;
}

export type ProductionStage = 
  | 'Aguardando Insumos'
  | 'Corte CNC'
  | 'Usinagem / Furação'
  | 'Montagem de Esquadrias'
  | 'Envidraçamento & Vedação'
  | 'Controle de Qualidade'
  | 'Expedição / Concluído';

export interface CutPiece {
  id: string;
  orderNumber: number;
  itemTag: string;
  profileCode: string;
  profileName: string;
  length: number; // mm
  angleLeft: 45 | 90 | -45;
  angleRight: 45 | 90 | -45;
  description: string;
  machiningGuide?: string;
  color: ColorFinish;
  barcode: string;
}

export interface CutBarPlan {
  id?: string;
  barIndex: number;
  barNumber?: number; // Alias para barIndex
  profileCode: string;
  profileName: string;
  color: ColorFinish;
  initialLength: number; // 6000mm ou comprimento do retalho
  barLengthMm?: number; // Alias
  isRemnant: boolean; // Se foi usado um retalho do estoque
  cuts: Array<{
    piece: CutPiece;
    startPosition: number;
    length: number;
    kerf: number;
    // Propriedades amigáveis opcionais
    pieceId?: string;
    orderNumber?: number;
    lengthMm?: number;
    startMm?: number;
    endMm?: number;
    angleLeft?: number;
    angleRight?: number;
    description?: string;
  }>;
  pieces?: CutPiece[];
  usedLength: number;
  wasteLength: number;
  scrapMm?: number; // Alias para wasteLength
  efficiencyPercent: number;
  canStockRemnant: boolean; // se sobra >= 800mm
}

export interface StockProfile {
  id: string;
  code: string;
  name: string;
  series: string;
  color: ColorFinish;
  wholeBarsQty: number; // barras inteiras de 6m
  remnants: Array<{
    id: string;
    lengthMm: number;
    registeredAt: string;
  }>;
  minBarsThreshold: number;
  kgm: number;
  costPerKg?: number;
  supplier?: string;
}

export interface StockAccessory {
  id: string;
  code: string;
  name: string;
  unit: 'un' | 'm' | 'par' | 'kit';
  currentQty: number;
  minQty: number;
  price: number;
  costPerUnit?: number;
  supplier?: string;
  category?: AccessoryDefinition['category'] | string;
}

export interface StockGlass {
  id: string;
  name: string;
  code?: string;
  type?: string;
  thicknessMm: number;
  currentAreaM2: number;
  minAreaM2: number;
  pricePerM2: number;
  costPerM2?: number;
  supplier?: string;
}

export interface StockConsumable {
  id: string;
  code: string;
  name: string;
  category: 'Selantes & Silicones' | 'Fixadores & Parafusos' | 'Embalagem & Proteção' | 'Consumíveis & Oficina' | 'Fitas & Vedação' | 'Outros';
  unit: 'un' | 'tubo' | 'cx' | 'rolo' | 'cento' | 'kg' | 'l' | 'par' | 'm';
  currentQty: number;
  minQty: number;
  price: number;
  unitCost?: number;
  supplier?: string;
  notes?: string;
}

export interface DeliveryRomaneio {
  id: string;
  number: number;
  orderId: string;
  orderNumber: number;
  clientName: string;
  address: string;
  date: string;
  driverName: string;
  vehiclePlate: string;
  invoiceNumber: string;
  status: 'Pendente' | 'Separado' | 'Em Trânsito' | 'Entregue';
  items: Array<{
    description: string;
    dimensions: string;
    quantity: number;
    location: string;
    weightKg: number;
  }>;
  receiverName?: string;
  receiverDocument?: string;
  notes?: string;
}

export type CncMachineProtocol = 'UNIVERSAL_GCODE' | 'EMMEGI' | 'FOM_INDUSTRIE' | 'ELUMATEC' | 'CSV_TABULAR';

export type BackupFrequency = 'diaria' | 'semanal' | 'ao_alterar';
export type CloudStorageProvider = 'google_drive' | 'onedrive' | 'sanches_cloud' | 'custom_webhook';

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  sizeKb: number;
  ordersCount: number;
  stockItemsCount: number;
  romaneiosCount: number;
  checksum: string;
  status: 'sincronizado' | 'pendente' | 'erro';
  storageTarget: string;
}

export interface CloudBackupConfig {
  enabled: boolean;
  frequency: BackupFrequency;
  provider: CloudStorageProvider;
  endpointUrl: string;
  authToken: string;
  driveFolder: string;
  syncOrders: boolean;
  syncStock: boolean;
  syncRomaneios: boolean;
  lastBackupAt: string | null;
  lastBackupStatus: 'idle' | 'syncing' | 'success' | 'error';
  snapshots: BackupSnapshot[];
}
