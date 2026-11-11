import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  DEFAULT_OPTIMIZATION_OPTIONS,
  OptimizationOptions,
  extractPiecesFromOrders,
  optimizeCutList,
} from '../utils/cutOptimizer';
import {
  printBarcodeLabels,
  printCuttingPlanMap,
  printProductionOrderSheet,
} from '../utils/pdfPrint';
import {
  Scissors,
  Cpu,
  Layers,
  Printer,
  Barcode,
  Settings,
  RefreshCw,
  Sliders,
  CheckCircle2,
  PackagePlus,
  HelpCircle,
  Tag,
  PackageCheck,
} from 'lucide-react';
import { CuttingLabelsModal } from './CuttingLabelsModal';
import { PurchaseOrderModal } from './PurchaseOrderModal';

export const CuttingPlanOptimizer: React.FC = () => {
  const {
    orders,
    stockProfiles,
    selectedOrderId,
    addRemnantToStock,
    setActiveTab,
  } = useApp();

  // Pedidos selecionados para o lote de corte
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>(() => {
    if (selectedOrderId && selectedOrderId !== 'new') return [selectedOrderId];
    const approved = orders.filter((o) => o.status === 'Aprovado' || o.status === 'Em Produção');
    return approved.length > 0 ? [approved[0].id] : orders.slice(0, 1).map((o) => o.id);
  });

  // Parâmetros do otimizador de corte
  const [options, setOptions] = useState<OptimizationOptions>(DEFAULT_OPTIMIZATION_OPTIONS);
  const [showSettings, setShowSettings] = useState(false);
  const [filterProfile, setFilterProfile] = useState<string>('TODOS');
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);
  const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Extrair peças e calcular otimização
  const selectedOrders = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  const rawPieces = useMemo(() => {
    return extractPiecesFromOrders(selectedOrders);
  }, [selectedOrders]);

  const optimizationResult = useMemo(() => {
    return optimizeCutList(rawPieces, stockProfiles, options);
  }, [rawPieces, stockProfiles, options]);

  // Lista de perfis presentes no plano
  const uniqueProfiles = useMemo(() => {
    const set = new Set<string>();
    optimizationResult.bars.forEach((b) => set.add(b.profileCode));
    return ['TODOS', ...Array.from(set)];
  }, [optimizationResult]);

  const filteredBars = useMemo(() => {
    if (filterProfile === 'TODOS') return optimizationResult.bars;
    return optimizationResult.bars.filter((b) => b.profileCode === filterProfile);
  }, [optimizationResult, filterProfile]);

  // Guardar todos os retalhos úteis no estoque
  const handleSaveAllRemnants = () => {
    let count = 0;
    for (const rem of optimizationResult.newRemnantsToStock) {
      addRemnantToStock(rem.profileCode, rem.color, rem.lengthMm);
      count++;
    }
    showToast(`${count} retalho(s) >= ${options.minReusableRemnantMm}mm adicionados com sucesso ao estoque!`);
  };

  // Cores dinâmicas para as peças nas barras
  const segmentColors = [
    'bg-cyan-600 border-cyan-400',
    'bg-blue-600 border-blue-400',
    'bg-indigo-600 border-indigo-400',
    'bg-emerald-600 border-emerald-400',
    'bg-amber-600 border-amber-400',
    'bg-purple-600 border-purple-400',
    'bg-teal-600 border-teal-400',
  ];

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-3">
      {/* Cabeçalho */}
      <div className="shrink-0 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-cyan-400" />
            <span>Otimizador Linear de Barras 1D (Plano de Corte)</span>
          </h1>
          <p className="text-xs text-slate-400">
            Nesting automático para barras de 6.000 mm, corte em ângulo (45°/90°) e reaproveitamento de sobras
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ajustar Parâmetros da Serra</span>
          </button>

          <button
            onClick={() => {
              if (selectedOrders.length > 0) {
                printCuttingPlanMap(optimizationResult.bars, selectedOrders[0].number);
              }
            }}
            disabled={optimizationResult.bars.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Mapa de Corte</span>
          </button>

          <button
            onClick={() => setIsLabelsModalOpen(true)}
            disabled={optimizationResult.pieces.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-40"
            title="Abrir gerador de etiquetas industriais com QR Code e Code 128"
          >
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span>Etiquetas com Código ({optimizationResult.pieces.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cnc_studio')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Exportar p/ Máquina CNC</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {/* Seletor de Pedidos para Otimizar em Lote */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Selecione as Ordens de Produção (OPs) para Otimizar em Conjunto:</span>
            </span>
          <span className="text-xs text-slate-400">
            Dica: Combinar múltiplos pedidos eleva a eficiência do corte acima de 98%
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {orders.map((o) => {
            const isChecked = selectedOrderIds.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  if (isChecked) {
                    if (selectedOrderIds.length > 1) {
                      setSelectedOrderIds(selectedOrderIds.filter((id) => id !== o.id));
                    }
                  } else {
                    setSelectedOrderIds([...selectedOrderIds, o.id]);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                    isChecked ? 'bg-cyan-500 border-cyan-400 text-black font-bold' : 'border-slate-600'
                  }`}
                >
                  {isChecked && '✓'}
                </div>
                <span className="font-mono font-bold text-cyan-400">OP-{o.number}</span>
                <span className="truncate max-w-[140px] text-slate-200">{o.clientName}</span>
                <span className="text-[11px] text-slate-400">({o.items.length} itens)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel Expansível de Parâmetros Técnicos da Serra */}
      {showSettings && (
        <div className="bg-slate-850 border border-slate-700 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
          <div>
            <label className="text-xs text-slate-300 block mb-1 font-semibold">
              Espessura do Disco (Kerf)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="1"
                max="8"
                value={options.sawBladeKerfMm}
                onChange={(e) => setOptions({ ...options, sawBladeKerfMm: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400">mm</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Desconto da lâmina a cada corte</span>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1 font-semibold">
              Margem de Garra / Topo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="1"
                min="0"
                max="50"
                value={options.clampMarginMm}
                onChange={(e) => setOptions({ ...options, clampMarginMm: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400">mm</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Refile de ponta e fixação pneumática</span>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1 font-semibold">
              Tamanho Nominal da Barra
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="100"
                value={options.standardBarLengthMm}
                onChange={(e) => setOptions({ ...options, standardBarLengthMm: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400">mm</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Padrão da indústria: 6.000 mm</span>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1 font-semibold">
              Retalho Útil Mínimo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="50"
                value={options.minReusableRemnantMm}
                onChange={(e) => setOptions({ ...options, minReusableRemnantMm: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400">mm</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Sobras &gt;= salvam no estoque</span>
          </div>
        </div>
      )}

      {/* Indicadores Principais de Aproveitamento */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] text-slate-400">Barras 6m Novas</div>
          <div className="text-xl font-extrabold text-cyan-400">
            {optimizationResult.totalBars6m}
          </div>
          <div className="text-[10px] text-slate-500">barras inteiras</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] text-slate-400">Retalhos Reusados</div>
          <div className="text-xl font-extrabold text-emerald-400">
            {optimizationResult.totalRemnantsUsed}
          </div>
          <div className="text-[10px] text-emerald-400/80">economizou novas barras</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] text-slate-400">Peças a Cortar</div>
          <div className="text-xl font-extrabold text-white">
            {optimizationResult.totalPieces}
          </div>
          <div className="text-[10px] text-slate-500">total de perfis</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] text-slate-400">Comprimento Útil</div>
          <div className="text-xl font-extrabold text-purple-300">
            {(optimizationResult.totalLengthCutMm / 1000).toFixed(1)} m
          </div>
          <div className="text-[10px] text-slate-500">alumínio em esquadrias</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] text-slate-400">Sobras & Sucata</div>
          <div className="text-xl font-extrabold text-rose-400">
            {optimizationResult.totalScrapKg} kg
          </div>
          <div className="text-[10px] text-rose-300/80">{(optimizationResult.totalWasteMm / 1000).toFixed(1)} m de perdas</div>
        </div>

        <div className="bg-slate-900 border border-cyan-800/60 rounded-xl p-3 bg-gradient-to-br from-slate-900 to-cyan-950/40">
          <div className="text-[11px] text-cyan-300 font-semibold">Eficiência do Corte</div>
          <div className="text-xl font-black text-cyan-300">
            {optimizationResult.overallEfficiencyPercent}%
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">ABNT NBR 10821</div>
        </div>
      </div>

      {/* Botão de Armazenar Retalhos no Estoque se houver sobras úteis */}
      {optimizationResult.newRemnantsToStock.length > 0 && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-200">
          <div className="flex items-center gap-3">
            <PackagePlus className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-xs">
                {optimizationResult.newRemnantsToStock.length} retalho(s) com mais de {options.minReusableRemnantMm}mm gerados neste plano!
              </div>
              <div className="text-[11px] text-emerald-300/80">
                Você pode registrar essas sobras no catálogo de estoque para reutilizar em futuros pedidos.
              </div>
            </div>
          </div>
          <button
            onClick={handleSaveAllRemnants}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
          >
            Guardar Retalhos no Estoque
          </button>
        </div>
      )}

      {/* Filtro por Perfil e Lista Gráfica das Barras */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Visualização Gráfica das Barras ({filteredBars.length} barras)</span>
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filtrar Perfil:</span>
            <select
              value={filterProfile}
              onChange={(e) => setFilterProfile(e.target.value)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              {uniqueProfiles.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diagramas de Barras */}
        {filteredBars.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Nenhuma barra para os pedidos ou filtros selecionados.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBars.map((bar) => {
              const wastePct = (bar.wasteLength / bar.initialLength) * 100;

              return (
                <div
                  key={bar.barIndex}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 font-bold font-mono text-[11px] flex items-center justify-center border border-cyan-800">
                        {bar.barIndex}
                      </span>
                      <b className="text-slate-100 font-mono text-sm">{bar.profileCode}</b>
                      <span className="text-slate-400 truncate max-w-[220px]">{bar.profileName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {bar.color}
                      </span>
                      {bar.isRemnant && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          RETALHO DO ESTOQUE ({bar.initialLength}mm)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span>
                        Cortes: <b>{bar.cuts.length} pçs</b>
                      </span>
                      <span>
                        Aproveitamento: <b className="text-emerald-400">{bar.efficiencyPercent}%</b>
                      </span>
                      <span>
                        Sobra: <b className="text-rose-400">{bar.wasteLength} mm</b>
                      </span>
                    </div>
                  </div>

                  {/* Barra 1D com Segmentos Coloridos Proporcionais */}
                  <div className="h-9 w-full bg-slate-900 rounded-lg p-1 border border-slate-800 flex overflow-hidden shadow-inner">
                    {bar.cuts.map((cut, cIdx) => {
                      const widthPct = (cut.length / bar.initialLength) * 100;
                      const colorClass = segmentColors[cIdx % segmentColors.length];

                      return (
                        <div
                          key={cIdx}
                          style={{ width: `${widthPct}%` }}
                          title={`Peça: ${cut.piece.description} | ${cut.piece.length}mm | Ângulos: ${cut.piece.angleLeft}°/${cut.piece.angleRight}° | OP-${cut.piece.orderNumber}`}
                          className={`h-full ${colorClass} border-r text-[10px] font-mono font-bold text-white flex items-center justify-center px-1 overflow-hidden transition-all hover:brightness-125 cursor-pointer relative group`}
                        >
                          <span className="truncate">{cut.piece.length}</span>

                          {/* Tooltip flutuante ao passar mouse */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 p-2 rounded bg-slate-900 text-slate-100 text-[10px] border border-slate-700 shadow-xl whitespace-nowrap pointer-events-none">
                            <div className="font-bold text-cyan-400">{cut.piece.description}</div>
                            <div>Comprimento: {cut.piece.length} mm</div>
                            <div>Ângulos: E={cut.piece.angleLeft}° | D={cut.piece.angleRight}°</div>
                            <div className="text-slate-400 font-mono">Etiqueta: {cut.piece.barcode}</div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Sobra / Retalho */}
                    {bar.wasteLength > 0 && (
                      <div
                        style={{ width: `${wastePct}%` }}
                        title={`Sobra de corte: ${bar.wasteLength} mm ${bar.canStockRemnant ? '(Retalho Reutilizável)' : '(Sucata)'}`}
                        className={`h-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                          bar.canStockRemnant
                            ? 'bg-amber-950/80 text-amber-300 border-l border-dashed border-amber-600'
                            : 'bg-rose-950/40 text-rose-400 border-l border-dashed border-rose-800'
                        }`}
                      >
                        {bar.wasteLength > 200 && `${bar.wasteLength}mm`}
                      </div>
                    )}
                  </div>

                  {/* Lista de Peças e Ângulos da Barra */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                    {bar.cuts.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono"
                      >
                        {i + 1}º: <b className="text-white">{c.piece.length}mm</b> ({c.piece.angleLeft}°/{c.piece.angleRight}°)
                      </span>
                    ))}
                    {bar.canStockRemnant && (
                      <button
                        onClick={() => {
                          addRemnantToStock(bar.profileCode, bar.color, bar.wasteLength);
                          showToast(`Retalho de ${bar.wasteLength}mm salvo no estoque!`);
                        }}
                        className="ml-auto text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80 cursor-pointer"
                      >
                        + Salvar Retalho de {bar.wasteLength}mm no Estoque
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>

      {/* Modal de Emissão de Etiquetas Industriais */}
      <CuttingLabelsModal
        isOpen={isLabelsModalOpen}
        onClose={() => setIsLabelsModalOpen(false)}
        pieces={optimizationResult.pieces}
        orderNumber={selectedOrders[0]?.number || 101}
        clientName={selectedOrders[0]?.clientName || 'Cliente'}
      />

      {/* Modal de Consolidação de Compras de Alumínio */}
      <PurchaseOrderModal
        isOpen={isPurchaseOrderModalOpen}
        onClose={() => setIsPurchaseOrderModalOpen(false)}
        pieces={optimizationResult.pieces}
      />

      {/* Toast flutuante */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-emerald-500/60 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 text-xs text-emerald-300 font-semibold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
