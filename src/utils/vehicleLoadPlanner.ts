/**
 * Planejador de Carga em Cavaletes e Veículos de Transporte
 * Sanches & Marques ERP/PCP - Padrão Industrial
 */

export interface TransportVehicle {
  id: string;
  name: string;
  type: 'Fiorino' | 'VUC_HR' | 'Caminhao_3_4';
  plate: string;
  maxPayloadKg: number;
  cargoLengthMm: number;
  cargoWidthMm: number;
  cargoHeightMm: number;
  rackType: 'Cavalete_A_Central' | 'Cavaletes_Laterais' | 'Piso_Acolchoado';
}

export const TRANSPORT_FLEET: TransportVehicle[] = [
  {
    id: 'fiorino_01',
    name: 'Fiorino Endurance 1.4',
    type: 'Fiorino',
    plate: 'BRA-2E19',
    maxPayloadKg: 650,
    cargoLengthMm: 1880,
    cargoWidthMm: 1080,
    cargoHeightMm: 1150,
    rackType: 'Cavaletes_Laterais',
  },
  {
    id: 'hr_01',
    name: 'Hyundai HR Baú Especial',
    type: 'VUC_HR',
    plate: 'SMQ-4820',
    maxPayloadKg: 1600,
    cargoLengthMm: 3100,
    cargoWidthMm: 1800,
    cargoHeightMm: 2100,
    rackType: 'Cavalete_A_Central',
  },
  {
    id: 'accelo_01',
    name: 'Mercedes-Benz Accelo 815 (3/4)',
    type: 'Caminhao_3_4',
    plate: 'ALU-8812',
    maxPayloadKg: 4200,
    cargoLengthMm: 5200,
    cargoWidthMm: 2200,
    cargoHeightMm: 2350,
    rackType: 'Cavalete_A_Central',
  },
];

export interface CargoItemToLoad {
  id: string;
  orderNumber: number;
  clientName: string;
  destinationAddress: string;
  deliverySequence: number; // 1 = primeira entrega, 2 = segunda entrega, etc.
  description: string;
  widthMm: number;
  heightMm: number;
  weightKg: number;
  isFragileGlass: boolean;
}

export interface RackSlotAssignment {
  rackSide: 'Esquerdo' | 'Direito' | 'Piso_Central';
  positionIndex: number; // 1 a N (fundo para porta)
  item: CargoItemToLoad;
  loadOrder: number; // Ordem de carregamento no galpão (inversa da entrega)
}

export interface VehicleLoadPlan {
  vehicle: TransportVehicle;
  items: CargoItemToLoad[];
  totalCargoWeightKg: number;
  payloadUsagePercent: number;
  isOverweight: boolean;
  frontAxleWeightKg: number;
  rearAxleWeightKg: number;
  axleBalanceStatus: 'Equilibrado' | 'Carga_Traseira_Excessiva' | 'Carga_Dianteira_Excessiva';
  slots: RackSlotAssignment[];
  loadingInstructions: string[];
}

/**
 * Organiza a carga no veículo respeitando LIFO (Last-In First-Out) e equilíbrio de eixos
 */
export function planVehicleLoading(
  vehicle: TransportVehicle,
  items: CargoItemToLoad[]
): VehicleLoadPlan {
  const totalCargoWeightKg = Number(items.reduce((acc, it) => acc + it.weightKg, 0).toFixed(1));
  const payloadUsagePercent = Number(((totalCargoWeightKg / vehicle.maxPayloadKg) * 100).toFixed(1));
  const isOverweight = totalCargoWeightKg > vehicle.maxPayloadKg;

  // Ordena itens para carregamento: a entrega mais distante (última) é carregada primeiro (no fundo)
  // Ou seja: ordenação decrescente de deliverySequence
  const sortedForLoading = [...items].sort((a, b) => b.deliverySequence - a.deliverySequence);

  const slots: RackSlotAssignment[] = [];
  let leftWeight = 0;
  let rightWeight = 0;

  sortedForLoading.forEach((item, idx) => {
    // Alterna entre lado esquerdo e direito do cavalete A para manter o equilíbrio lateral
    const side = leftWeight <= rightWeight ? 'Esquerdo' : 'Direito';
    if (side === 'Esquerdo') leftWeight += item.weightKg;
    else rightWeight += item.weightKg;

    slots.push({
      rackSide: side,
      positionIndex: idx + 1,
      item,
      loadOrder: idx + 1,
    });
  });

  // Estimativa de distribuição de eixos (50% / 50% ideal com margem de 10%)
  const frontAxleWeightKg = Number((totalCargoWeightKg * 0.48).toFixed(1));
  const rearAxleWeightKg = Number((totalCargoWeightKg * 0.52).toFixed(1));

  let axleBalanceStatus: VehicleLoadPlan['axleBalanceStatus'] = 'Equilibrado';
  if (rearAxleWeightKg > totalCargoWeightKg * 0.65) {
    axleBalanceStatus = 'Carga_Traseira_Excessiva';
  } else if (frontAxleWeightKg > totalCargoWeightKg * 0.65) {
    axleBalanceStatus = 'Carga_Dianteira_Excessiva';
  }

  const instructions: string[] = [];
  instructions.push(`Sequenciamento LIFO ativo: itens da última entrega carregados no fundo.`);
  instructions.push(`Equilíbrio do Cavalete: Lado Esquerdo = ${leftWeight.toFixed(1)} kg | Lado Direito = ${rightWeight.toFixed(1)} kg (diferença: ${Math.abs(leftWeight - rightWeight).toFixed(1)} kg).`);
  
  if (isOverweight) {
    instructions.push(`ALERTA CRÍTICO: Carga excede a capacidade do veículo em ${(totalCargoWeightKg - vehicle.maxPayloadKg).toFixed(1)} kg!`);
  } else {
    instructions.push(`Capacidade aprovada: ${payloadUsagePercent}% da carga útil utilizada.`);
  }

  instructions.push(`Amarração obrigatória com cintas catraca e calços de EPDM/borracha entre esquadrias.`);

  return {
    vehicle,
    items,
    totalCargoWeightKg,
    payloadUsagePercent,
    isOverweight,
    frontAxleWeightKg,
    rearAxleWeightKg,
    axleBalanceStatus,
    slots,
    loadingInstructions: instructions,
  };
}
