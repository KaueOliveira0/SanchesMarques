import React, { useState, useMemo } from 'react';
import {
  planVehicleLoading,
  TRANSPORT_FLEET,
  TransportVehicle,
  CargoItemToLoad,
  VehicleLoadPlan,
} from '../utils/vehicleLoadPlanner';
import { DeliveryRomaneio } from '../types';
import {
  Truck,
  X,
  Package,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowDownUp,
  Scale,
  Printer,
  Info,
} from 'lucide-react';

interface VehicleLoadPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  romaneio?: DeliveryRomaneio;
}

export const VehicleLoadPlannerModal: React.FC<VehicleLoadPlannerModalProps> = ({
  isOpen,
  onClose,
  romaneio,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(TRANSPORT_FLEET[1].id); // HR padrão

  // Converte itens do romaneio ou gera itens de carga
  const cargoItems: CargoItemToLoad[] = useMemo(() => {
    if (romaneio && romaneio.items.length > 0) {
      return romaneio.items.map((it, idx) => ({
        id: `cargo-${idx}`,
        orderNumber: romaneio.orderNumber,
        clientName: romaneio.clientName,
        destinationAddress: romaneio.address,
        deliverySequence: idx + 1,
        description: it.description,
        widthMm: 1500,
        heightMm: 1200,
        weightKg: it.weightKg || 25,
        isFragileGlass: it.description.toLowerCase().includes('vidro') || it.description.toLowerCase().includes('janela'),
      }));
    }

    // Exemplos industriais realistas
    return [
      {
        id: 'c-1',
        orderNumber: 101,
        clientName: 'Residencial Alphaville (Casa 42)',
        destinationAddress: 'Alameda das Figueiras, 42 - Santana de Parnaíba',
        deliverySequence: 1,
        description: 'Janela 2F Suprema 1500x1200 (Branco)',
        widthMm: 1500,
        heightMm: 1200,
        weightKg: 42.5,
        isFragileGlass: true,
      },
      {
        id: 'c-2',
        orderNumber: 101,
        clientName: 'Residencial Alphaville (Casa 42)',
        destinationAddress: 'Alameda das Figueiras, 42 - Santana de Parnaíba',
        deliverySequence: 1,
        description: 'Porta 3F Chroma Acústica 2400x2200 (Preto)',
        widthMm: 2400,
        heightMm: 2200,
        weightKg: 88.0,
        isFragileGlass: true,
      },
      {
        id: 'c-3',
        orderNumber: 102,
        clientName: 'Condomínio Tamboré (Lote 15)',
        destinationAddress: 'Av. Tamboré 120 - Barueri',
        deliverySequence: 2,
        description: 'Janela Maxim-Ar Dupla Vedação 800x600',
        widthMm: 800,
        heightMm: 600,
        weightKg: 18.2,
        isFragileGlass: true,
      },
      {
        id: 'c-4',
        orderNumber: 102,
        clientName: 'Condomínio Tamboré (Lote 15)',
        destinationAddress: 'Av. Tamboré 120 - Barueri',
        deliverySequence: 2,
        description: 'Porta Balcão 4F Gold Reforçada 2800x2400',
        widthMm: 2800,
        heightMm: 2400,
        weightKg: 115.0,
        isFragileGlass: true,
      },
      {
        id: 'c-5',
        orderNumber: 103,
        clientName: 'Edifício Jardim Europa (Apto 81)',
        destinationAddress: 'Rua Bela Cintra 900 - SP',
        deliverySequence: 3,
        description: 'Porta de Giro Acústica 900x2100 c/ Vidro Laminado',
        widthMm: 900,
        heightMm: 2100,
        weightKg: 48.0,
        isFragileGlass: false,
      },
    ];
  }, [romaneio]);

  const chosenVehicle = TRANSPORT_FLEET.find((v) => v.id === selectedVehicleId) || TRANSPORT_FLEET[1];

  const plan: VehicleLoadPlan = useMemo(() => {
    return planVehicleLoading(chosenVehicle, cargoItems);
  }, [chosenVehicle, cargoItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Simulador de Romaneio de Carga & Cavaletes de Transporte
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                  LIFO Sequenciado
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Distribuição nos cavaletes em A, equilíbrio lateral de peso e desembarque sem manobras arriscadas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor de Veículo & Resumo da Frota */}
        <div className="p-3.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Veículo / Baú:</span>
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              {TRANSPORT_FLEET.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    selectedVehicleId === v.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {v.name} ({v.maxPayloadKg} kg)
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-slate-400">Placa: <b className="text-slate-200">{chosenVehicle.plate}</b></span>
            <span className="text-slate-400">Baú: <b className="text-cyan-400">{chosenVehicle.cargoLengthMm}×{chosenVehicle.cargoWidthMm}×{chosenVehicle.cargoHeightMm} mm</b></span>
          </div>
        </div>

        {/* Métricas de Carga */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Peso Total da Carga</span>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {plan.totalCargoWeightKg} <small className="text-xs text-slate-400">kg</small>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Capacidade máx: {chosenVehicle.maxPayloadKg} kg
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            plan.isOverweight
              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <span className="text-[10px] uppercase font-mono">Ocupação da Carga</span>
            <div className="text-base font-bold font-mono mt-0.5">
              {plan.payloadUsagePercent}%
            </div>
            <span className="text-[10px] font-mono">
              {plan.isOverweight ? 'SOBREPESO CRÍTICO' : 'Dentro do limite legal'}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Eixo Dianteiro (est.)</span>
            <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
              {plan.frontAxleWeightKg} <small className="text-xs">kg</small>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">~48% da carga</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Eixo Traseiro (est.)</span>
            <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
              {plan.rearAxleWeightKg} <small className="text-xs">kg</small>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">~52% da carga</span>
          </div>
        </div>

        {/* Visualização dos Cavaletes em A (Esquerda / Direita) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Distribuição nos Cavaletes em 'A' (Fundo ➔ Traseira / Porta)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Sequenciamento LIFO: Entregas 1 ficam próximas à porta
              </span>
            </div>

            {/* Grid dos dois lados do cavalete */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Lado Esquerdo */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-cyan-400">Lado Esquerdo do Cavalete</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {plan.slots.filter((s) => s.rackSide === 'Esquerdo').reduce((a, b) => a + b.item.weightKg, 0).toFixed(1)} kg
                  </span>
                </div>

                <div className="space-y-2">
                  {plan.slots.filter((s) => s.rackSide === 'Esquerdo').map((slot) => (
                    <div
                      key={slot.item.id}
                      className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between hover:border-slate-700"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">
                            Entr. #{slot.item.deliverySequence}
                          </span>
                          <span className="font-bold text-slate-200 truncate max-w-[180px]">
                            {slot.item.description}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {slot.item.clientName}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-400">{slot.item.weightKg} kg</span>
                        <div className="text-[9px] text-slate-500 font-mono">Ordem carga: #{slot.loadOrder}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lado Direito */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400">Lado Direito do Cavalete</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {plan.slots.filter((s) => s.rackSide === 'Direito').reduce((a, b) => a + b.item.weightKg, 0).toFixed(1)} kg
                  </span>
                </div>

                <div className="space-y-2">
                  {plan.slots.filter((s) => s.rackSide === 'Direito').map((slot) => (
                    <div
                      key={slot.item.id}
                      className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between hover:border-slate-700"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded border border-amber-800">
                            Entr. #{slot.item.deliverySequence}
                          </span>
                          <span className="font-bold text-slate-200 truncate max-w-[180px]">
                            {slot.item.description}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {slot.item.clientName}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-400">{slot.item.weightKg} kg</span>
                        <div className="text-[9px] text-slate-500 font-mono">Ordem carga: #{slot.loadOrder}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Instruções de Amarração e Segurança */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Instruções de Expedição & Transporte Seguro:</span>
            </span>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
              {plan.loadingInstructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-400">
            Ordem de Carregamento LIFO minimiza tempo de espera e evita tombamento em curvas.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
