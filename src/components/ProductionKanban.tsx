import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductionStage, Order } from '../types';
import { printProductionOrderSheet, printBarcodeLabels } from '../utils/pdfPrint';
import { extractPiecesFromOrders } from '../utils/cutOptimizer';
import {
  Kanban,
  Clock,
  Printer,
  Barcode,
  ArrowRight,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Info,
  Maximize2,
  Layers,
} from 'lucide-react';

const PRODUCTION_STAGES: ProductionStage[] = [
  'Aguardando Insumos',
  'Corte CNC',
  'Usinagem / Furação',
  'Montagem de Esquadrias',
  'Envidraçamento & Vedação',
  'Controle de Qualidade',
  'Expedição / Concluído',
];

export const ProductionKanban: React.FC = () => {
  const { orders, advanceProductionStep, updateOrder, setActiveTab, setSelectedOrderId } = useApp();

  const [activeMachiningOrder, setActiveMachiningOrder] = useState<Order | null>(null);

  // Filtrar pedidos que estão no ciclo fabril
  const activeOrders = orders.filter((o) => o.status !== 'Cancelado' && o.status !== 'Orçamento');

  const todayStr = new Date().toISOString().slice(0, 10);

  const getOrdersForStage = (stage: ProductionStage) => {
    return activeOrders.filter((o) => {
      const current = o.productionStep || 'Aguardando Insumos';
      return current === stage;
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Kanban className="w-5 h-5 text-blue-400" />
            <span>Chão de Fábrica · Serralheria & PCP em Tempo Real</span>
          </h1>
          <p className="text-xs text-slate-400">
            Acompanhamento de corte, usinagem de estampos, montagem de quadros e controle ABNT
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            {activeOrders.length} OP(s) no fluxo fabril
          </span>
        </div>
      </div>

      {/* Colunas do Kanban Fabril */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar min-h-[550px]">
        {PRODUCTION_STAGES.map((stage) => {
          const stageOrders = getOrdersForStage(stage);

          const stageHeaderColors: Record<ProductionStage, string> = {
            'Aguardando Insumos': 'border-t-amber-500',
            'Corte CNC': 'border-t-cyan-500',
            'Usinagem / Furação': 'border-t-indigo-500',
            'Montagem de Esquadrias': 'border-t-blue-500',
            'Envidraçamento & Vedação': 'border-t-purple-500',
            'Controle de Qualidade': 'border-t-emerald-500',
            'Expedição / Concluído': 'border-t-slate-500',
          };

          return (
            <div
              key={stage}
              className={`w-72 shrink-0 bg-slate-900 border border-slate-800 border-t-4 ${stageHeaderColors[stage]} rounded-2xl flex flex-col`}
            >
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="font-bold text-xs text-white">{stage}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono font-bold text-cyan-300">
                  {stageOrders.length}
                </span>
              </div>

              {/* Cards de OPs na coluna */}
              <div className="p-2 space-y-2.5 flex-1 overflow-y-auto">
                {stageOrders.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-600">
                    Nenhuma OP nesta etapa
                  </div>
                ) : (
                  stageOrders.map((order) => {
                    const isLate = order.deliveryDate < todayStr && order.productionStep !== 'Expedição / Concluído';
                    const pieces = extractPiecesFromOrders([order]);

                    return (
                      <div
                        key={order.id}
                        className={`p-3 rounded-xl bg-slate-950 border transition-all space-y-2 ${
                          isLate ? 'border-rose-800 shadow-rose-950/20 shadow-md' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-cyan-400">OP-{order.number}</span>
                          <span
                            className={`text-[10px] font-semibold flex items-center gap-1 ${
                              isLate ? 'text-rose-400' : 'text-slate-400'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                            {isLate && ' (ATRASO)'}
                          </span>
                        </div>

                        <div>
                          <div className="font-semibold text-xs text-slate-100 truncate">
                            {order.clientName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {order.items.reduce((s, i) => s + i.quantity, 0)} esquadria(s) · {order.color}
                          </div>
                        </div>

                        {/* Responsável da Linha */}
                        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-850">
                          <span>Operador:</span>
                          <select
                            value={order.responsibleWorker || ''}
                            onChange={(e) => updateOrder({ ...order, responsibleWorker: e.target.value })}
                            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-cyan-300 focus:outline-none"
                          >
                            <option value="">Não atribuído</option>
                            <option value="Carlos Eduardo (CNC)">Carlos Eduardo (CNC)</option>
                            <option value="Marcos Vinicius (Montador)">Marcos Vinicius (Montador)</option>
                            <option value="Paulo Roberto (Envidraçador)">Paulo Roberto (Envidraçador)</option>
                            <option value="Danilo Almeida (Qualidade)">Danilo Almeida (Qualidade)</option>
                          </select>
                        </div>

                        {/* Ações Técnicas da OP */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-1 border-t border-slate-850">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => printProductionOrderSheet(order, pieces)}
                              title="Imprimir folha de produção ABNT"
                              className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => printBarcodeLabels(pieces)}
                              title="Imprimir etiquetas de código de barras das peças"
                              className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300"
                            >
                              <Barcode className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setActiveMachiningOrder(order)}
                              title="Ver manual de furação e estampos"
                              className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-amber-400 hover:text-amber-300"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {order.productionStep !== 'Expedição / Concluído' && (
                            <button
                              onClick={() => advanceProductionStep(order.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              <span>Avançar</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Técnico de Usinagens, Furações e Estampos */}
      {activeMachiningOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Manual de Usinagem & Furação de Estampos (OP-{activeMachiningOrder.number})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cotas e instruções de estamparia para fechos concha, drenagem de água e roldanas
                </p>
              </div>
              <button
                onClick={() => setActiveMachiningOrder(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {/* Usinagem 1: Fecho Concha */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-400 flex items-center justify-between">
                  <span>1. Rasgo para Fecho Concha Automático (SU-053 / Gold)</span>
                  <span className="font-mono text-[10px] text-slate-400">Fresa Ø 6.0 mm</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Usinar rasgo oblongo central de <b>120 × 22 mm</b> no montante da folha. Furação de fixação superior e inferior com broca Ø 4.2 mm para parafuso cabeça chata 4.2x19mm inox.
                </p>
                <div className="bg-slate-900 p-2 rounded font-mono text-[11px] text-emerald-400 border border-slate-850">
                  COTA: Altura H / 2 ± 0.5 mm do piso até centro do fecho | Profundidade de corte: 18 mm
                </div>
              </div>

              {/* Usinagem 2: Drenagem de Água */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-400 flex items-center justify-between">
                  <span>2. Drenagem de Água e Deságues (Trilho Inferior SU-003 / Gold)</span>
                  <span className="font-mono text-[10px] text-slate-400">Estampo Oblongo 25x5mm</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Rasgos usinados na calha externa para escoamento de água de chuva. Instalar válvula pingadeira com aleta de silicone para vedação contra vento conforme norma ABNT NBR 10821.
                </p>
                <div className="bg-slate-900 p-2 rounded font-mono text-[11px] text-emerald-400 border border-slate-850">
                  POSICIONAMENTO: 1 dreno a 100mm de cada ponta + 1 dreno central a cada 600mm de vão
                </div>
              </div>

              {/* Usinagem 3: Roldana na Travessa */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-400 flex items-center justify-between">
                  <span>3. Encaixe de Roldana Dupla com Regulagem (Travessa SU-068 / GL-035)</span>
                  <span className="font-mono text-[10px] text-slate-400">Usinagem de Topo</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Rasgo no fundo da travessa inferior da folha para alojamento da caixa de nylon e acesso ao parafuso Allen de regulagem vertical de altura da folha.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveMachiningOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Fechar Manual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
