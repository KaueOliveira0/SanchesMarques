import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  optimizeGlassCutting,
  DEFAULT_GLASS_OPTIONS,
  GLASS_SHEET_PRESETS,
  GlassCutPieceInput,
  GlassOptimizationOptions,
  extractGlassPiecesFromOrders,
} from '../utils/glass2DOptimizer';
import { printGlassCuttingPlanMap } from '../utils/pdfPrint';
import {
  Scissors,
  Layers,
  Printer,
  RotateCw,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  Sparkles,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Box,
  FileSpreadsheet,
  Grid,
} from 'lucide-react';

export const GlassCuttingOptimizer2D: React.FC = () => {
  const { orders, customProfiles, setActiveTab } = useApp();

  // Opções de configuração da chapa bruta
  const [options, setOptions] = useState<GlassOptimizationOptions>(DEFAULT_GLASS_OPTIONS);
  const [selectedPreset, setSelectedPreset] = useState<string>('comercial');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [glassTypeFilter, setGlassTypeFilter] = useState<string>('TODOS');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lista de peças para corte
  const [pieces, setPieces] = useState<GlassCutPieceInput[]>(() => {
    // Tenta carregar dos orçamentos ativos por padrão
    const extracted = extractGlassPiecesFromOrders(orders, []);
    if (extracted.length > 0) return extracted;

    // Exemplos práticos caso não haja pedidos
    return [
      {
        id: 'glass_demo_1',
        label: 'Janela 2F Suprema (Sala)',
        widthMm: 655,
        heightMm: 1055,
        quantity: 2,
        allowRotation: true,
        orderNumber: 101,
        clientName: 'Residencial Alphaville',
        roomTag: 'Sala de Estar',
        glassType: 'Vidro Incolor 4mm',
      },
      {
        id: 'glass_demo_2',
        label: 'Porta Balcão Gold (Varanda)',
        widthMm: 880,
        heightMm: 2040,
        quantity: 2,
        allowRotation: false,
        orderNumber: 101,
        clientName: 'Residencial Alphaville',
        roomTag: 'Varanda Gourmet',
        glassType: 'Vidro Laminado 6mm',
      },
      {
        id: 'glass_demo_3',
        label: 'Maxim-Ar (Banheiro Suíte)',
        widthMm: 480,
        heightMm: 480,
        quantity: 2,
        allowRotation: true,
        orderNumber: 102,
        clientName: 'Dra. Camila Vasconcelos',
        roomTag: 'Suíte Master',
        glassType: 'Vidro Mini Boreal 4mm',
      },
      {
        id: 'glass_demo_4',
        label: 'Janela Quarto 1 Suprema',
        widthMm: 555,
        heightMm: 1155,
        quantity: 2,
        allowRotation: true,
        orderNumber: 102,
        clientName: 'Dra. Camila Vasconcelos',
        roomTag: 'Quarto 1',
        glassType: 'Vidro Incolor 4mm',
      },
    ];
  });

  // Formulário para adicionar nova peça manual
  const [newPieceLabel, setNewPieceLabel] = useState('');
  const [newPieceWidth, setNewPieceWidth] = useState(600);
  const [newPieceHeight, setNewPieceHeight] = useState(1000);
  const [newPieceQty, setNewPieceQty] = useState(1);
  const [newPieceAllowRotation, setNewPieceAllowRotation] = useState(true);
  const [newPieceGlassType, setNewPieceGlassType] = useState('Vidro Incolor 4mm');

  // Tipos de vidro distintos para filtro
  const availableGlassTypes = useMemo(() => {
    const set = new Set<string>();
    pieces.forEach((p) => {
      if (p.glassType) set.add(p.glassType);
    });
    return Array.from(set);
  }, [pieces]);

  // Peças filtradas para cálculo
  const filteredPieces = useMemo(() => {
    if (glassTypeFilter === 'TODOS') return pieces;
    return pieces.filter((p) => p.glassType === glassTypeFilter);
  }, [pieces, glassTypeFilter]);

  // Executa otimização 2D de guilhotina
  const optimizationResult = useMemo(() => {
    return optimizeGlassCutting(filteredPieces, options);
  }, [filteredPieces, options]);

  // Garante índice válido da chapa ativa
  useEffect(() => {
    if (activeSheetIndex >= optimizationResult.sheets.length) {
      setActiveSheetIndex(Math.max(0, optimizationResult.sheets.length - 1));
    }
  }, [optimizationResult.sheets.length, activeSheetIndex]);

  const activeSheet = optimizationResult.sheets[activeSheetIndex] || null;

  // Importar vidros dos orçamentos do sistema
  const handleImportFromOrders = () => {
    // Usamos typologies de catálogo se existirem ou extraímos do histórico
    const extracted = extractGlassPiecesFromOrders(orders, []);
    if (extracted.length === 0) {
      showToast('Nenhuma peça de vidro encontrada nos pedidos aprovados ou em produção.');
      return;
    }
    setPieces((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newOnly = extracted.filter((p) => !existingIds.has(p.id));
      if (newOnly.length === 0) {
        showToast('Todas as peças dos pedidos já estão adicionadas ao plano.');
        return prev;
      }
      showToast(`${newOnly.length} lote(s) de vidros importados dos pedidos com sucesso!`);
      return [...prev, ...newOnly];
    });
  };

  // Adicionar peça manual
  const handleAddManualPiece = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPieceLabel.trim() || newPieceWidth <= 0 || newPieceHeight <= 0) {
      showToast('Preencha um nome e dimensões válidas.');
      return;
    }
    const newPiece: GlassCutPieceInput = {
      id: `manual_${Date.now()}`,
      label: newPieceLabel.trim(),
      widthMm: Math.round(newPieceWidth),
      heightMm: Math.round(newPieceHeight),
      quantity: Math.max(1, newPieceQty),
      allowRotation: newPieceAllowRotation,
      glassType: newPieceGlassType,
    };
    setPieces((prev) => [newPiece, ...prev]);
    setNewPieceLabel('');
    showToast(`Peça "${newPiece.label}" adicionada ao plano de corte 2D!`);
  };

  // Remover peça
  const handleRemovePiece = (id: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== id));
  };

  // Alterar preset de chapa
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const found = GLASS_SHEET_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setOptions((prev) => ({
        ...prev,
        sheetWidthMm: found.widthMm,
        sheetHeightMm: found.heightMm,
      }));
    }
  };

  // Salvar retalhos úteis no estoque (simulação prática / notificação)
  const handleSaveRemnantsToStock = () => {
    if (!activeSheet || activeSheet.remnants.filter((r) => r.isUseful).length === 0) {
      showToast('Nenhum retalho útil nesta chapa para salvar.');
      return;
    }
    const usefulCount = activeSheet.remnants.filter((r) => r.isUseful).length;
    showToast(`${usefulCount} retalho(s) de vidro registrado(s) para reutilização no estoque!`);
  };

  return (
    <div className="h-full flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
      {/* Toast flutuante */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho Principal do Otimizador 2D */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950 border border-slate-800 shadow-xl shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight">
                  Otimizador 2D de Chapas de Vidro
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Vidraçaria &amp; Guilhotina 2D
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Encaixe inteligente de peças em chapas padrão (Jumbo/Comercial) com mapa de corte cotado e sobras aproveitáveis.
              </p>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleImportFromOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="Puxar vidros dos pedidos aprovados no sistema"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Importar de Pedidos</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="Configurar dimensões da chapa, refilo e kerf"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Configurar Chapa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const presetDesc = `${options.sheetWidthMm}×${options.sheetHeightMm}mm (Refilo: ${options.edgeTrimMm}mm)`;
              printGlassCuttingPlanMap(optimizationResult, presetDesc);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
            title="Imprimir mapa de corte para a mesa do vidraceiro"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Mapa 2D</span>
          </button>
        </div>
      </div>

      {/* Barra de Métricas & KPIs da Otimização */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 shrink-0">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans font-semibold">Chapas Necessárias</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-white">{optimizationResult.totalSheets}</span>
            <span className="text-xs text-slate-400">un ({options.sheetWidthMm}×{options.sheetHeightMm})</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans font-semibold">Aproveitamento Geral</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xl font-black ${optimizationResult.overallUtilizationPct >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {optimizationResult.overallUtilizationPct}%
            </span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${optimizationResult.overallUtilizationPct >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, optimizationResult.overallUtilizationPct)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans font-semibold">Área Cortada Útil</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-cyan-400">{optimizationResult.totalUsedAreaM2.toFixed(2)}</span>
            <span className="text-xs text-slate-400">m² ({optimizationResult.totalPiecesPlaced} peças)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-sans font-semibold">Retalhos Reutilizáveis</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-emerald-400">{optimizationResult.totalRemnantAreaM2.toFixed(2)}</span>
            <span className="text-xs text-slate-400">m² aproveitáveis</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 font-sans font-semibold">Sucata / Refilo</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-rose-400">{optimizationResult.totalScrapAreaM2.toFixed(2)}</span>
            <span className="text-xs text-slate-400">m² perda</span>
          </div>
        </div>
      </div>

      {/* Área Central: Diagrama Visual 2D + Navegação de Chapas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[460px]">
        {/* Painel Esquerdo: Canvas SVG do Diagrama da Chapa */}
        <div className="lg:col-span-8 flex flex-col rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-xl">
          {/* Navegação entre chapas */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                Chapa {optimizationResult.sheets.length > 0 ? activeSheetIndex + 1 : 0} de {optimizationResult.sheets.length}
              </span>
              {activeSheet && (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {activeSheet.sheetWidth} × {activeSheet.sheetHeight} mm (Aproveitamento: {activeSheet.utilizationPct}%)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activeSheetIndex === 0}
                onClick={() => setActiveSheetIndex((prev) => Math.max(0, prev - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Chapa Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={activeSheetIndex >= optimizationResult.sheets.length - 1}
                onClick={() => setActiveSheetIndex((prev) => Math.min(optimizationResult.sheets.length - 1, prev + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Próxima Chapa"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSaveRemnantsToStock}
                className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer"
                title="Salvar retalhos úteis desta chapa no estoque"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Salvar Sobra</span>
              </button>
            </div>
          </div>

          {/* Diagrama Visual 2D da Chapa */}
          <div className="flex-1 flex items-center justify-center p-3 bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden relative">
            {activeSheet ? (
              <div className="w-full h-full max-h-[420px] flex items-center justify-center">
                <svg
                  viewBox={`0 0 ${activeSheet.sheetWidth} ${activeSheet.sheetHeight}`}
                  className="w-full h-full max-h-full drop-shadow-2xl"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Fundo da Chapa Bruta */}
                  <rect
                    x="0"
                    y="0"
                    width={activeSheet.sheetWidth}
                    height={activeSheet.sheetHeight}
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="4"
                    rx="6"
                  />

                  {/* Margem de Refilo das Bordas */}
                  {options.edgeTrimMm > 0 && (
                    <rect
                      x={options.edgeTrimMm}
                      y={options.edgeTrimMm}
                      width={activeSheet.usableWidth}
                      height={activeSheet.usableHeight}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="8 6"
                      strokeOpacity="0.4"
                    />
                  )}

                  {/* Retalhos Livres / Sobras */}
                  {activeSheet.remnants.map((r) => {
                    const isSelected = selectedPieceId === r.id;
                    return (
                      <g
                        key={r.id}
                        onClick={() => setSelectedPieceId(r.id)}
                        className="cursor-pointer transition-opacity hover:opacity-90"
                      >
                        <rect
                          x={r.x}
                          y={r.y}
                          width={r.width}
                          height={r.height}
                          fill={r.isUseful ? '#10b981' : '#1e293b'}
                          fillOpacity={r.isUseful ? (isSelected ? 0.4 : 0.25) : 0.6}
                          stroke={r.isUseful ? '#059669' : '#334155'}
                          strokeWidth="2"
                          strokeDasharray={r.isUseful ? '6 4' : undefined}
                        />
                        {r.width >= 180 && r.height >= 100 && (
                          <text
                            x={r.x + r.width / 2}
                            y={r.y + r.height / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={Math.min(r.width / 12, 32)}
                            fontWeight="bold"
                            fill={r.isUseful ? '#34d399' : '#64748b'}
                          >
                            {r.isUseful ? `Sobra Útil (${r.width}×${r.height})` : 'Refilo / Perda'}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Peças de Vidro Posicionadas */}
                  {activeSheet.placedPieces.map((p) => {
                    const isSelected = selectedPieceId === p.id;
                    const fontSize = Math.max(14, Math.min(p.width / 14, p.height / 8, 38));

                    return (
                      <g
                        key={p.id}
                        onClick={() => setSelectedPieceId(p.id)}
                        className="cursor-pointer transition-transform hover:brightness-110"
                      >
                        <rect
                          x={p.x}
                          y={p.y}
                          width={p.width}
                          height={p.height}
                          fill={p.colorCode}
                          fillOpacity={isSelected ? 0.75 : 0.45}
                          stroke={isSelected ? '#ffffff' : p.colorCode}
                          strokeWidth={isSelected ? 4 : 2.5}
                          rx="4"
                        />

                        {/* Rótulo da Peça */}
                        {p.width >= 120 && p.height >= 80 && (
                          <>
                            <text
                              x={p.x + p.width / 2}
                              y={p.y + p.height / 2 - fontSize * 0.4}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={fontSize}
                              fontWeight="900"
                              fill="#ffffff"
                            >
                              {p.label}
                            </text>

                            <text
                              x={p.x + p.width / 2}
                              y={p.y + p.height / 2 + fontSize * 0.8}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={fontSize * 0.8}
                              fontFamily="monospace"
                              fontWeight="bold"
                              fill="#e2e8f0"
                            >
                              {p.width} × {p.height} mm {p.rotated ? '↻ 90°' : ''}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500/60" />
                <p>Nenhuma chapa gerada. Adicione peças à lista ou ajuste o tamanho da chapa.</p>
              </div>
            )}
          </div>

          {/* Legenda de Cores e Guias de Corte */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 text-xs border-t border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500/60 border border-cyan-400" />
                <span className="text-slate-300">Peças a Cortar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-400 border-dashed" />
                <span className="text-slate-300">Retalhos Úteis (Aproveitáveis)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
                <span className="text-slate-400">Refilo / Descarte</span>
              </div>
            </div>

            <span className="text-slate-400 font-mono text-[11px]">
              {activeSheet ? `${activeSheet.placedPieces.length} peças nesta chapa` : ''}
            </span>
          </div>
        </div>

        {/* Painel Direito: Peças Alocadas nesta Chapa & Sequência de Corte */}
        <div className="lg:col-span-4 flex flex-col rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-cyan-400" />
              Peças da Chapa Atual
            </h2>
            <span className="text-xs text-slate-400">
              {activeSheet?.placedPieces.length || 0} corte(s)
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
            {activeSheet && activeSheet.placedPieces.length > 0 ? (
              activeSheet.placedPieces.map((p, idx) => {
                const isSelected = selectedPieceId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPieceId(p.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: p.colorCode }}
                        />
                        <span className="font-bold text-white truncate max-w-[170px]">{p.label}</span>
                      </div>
                      <span className="font-mono text-cyan-400 font-bold">
                        {p.width} × {p.height} mm
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                      <span>{p.roomTag || 'Sem ambiente'}</span>
                      <div className="flex items-center gap-1.5">
                        {p.rotated && (
                          <span className="text-amber-400 font-mono">↻ Rotacionada 90°</span>
                        )}
                        {p.orderNumber && (
                          <span className="font-mono text-slate-300">OP #{p.orderNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">Nenhuma peça nesta chapa.</p>
            )}

            {/* Retalhos Úteis desta Chapa */}
            {activeSheet && activeSheet.remnants.filter((r) => r.isUseful).length > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-emerald-400 block mb-1.5">
                  Sobras Úteis Aproveitáveis:
                </span>
                {activeSheet.remnants
                  .filter((r) => r.isUseful)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-2 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex justify-between items-center mb-1 font-mono"
                    >
                      <span>Retalho #{r.id.split('_')[2]}</span>
                      <span className="font-bold">{r.width} × {r.height} mm ({((r.width * r.height) / 1000000).toFixed(2)} m²)</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seção Inferior: Tabela de Todas as Peças do Lote + Adição Manual */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Lote de Peças para Corte de Vidro ({pieces.length} itens)</h2>
          </div>

          {/* Filtro por Tipo de Vidro */}
          {availableGlassTypes.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Tipo de Vidro:</span>
              <select
                value={glassTypeFilter}
                onChange={(e) => setGlassTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="TODOS">Todos os Tipos ({pieces.length} peças)</option>
                {availableGlassTypes.map((gt) => (
                  <option key={gt} value={gt}>
                    {gt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tabela de Peças */}
        <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-56 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Identificação / Peça</th>
                <th className="py-2 px-3">Largura (mm)</th>
                <th className="py-2 px-3">Altura (mm)</th>
                <th className="py-2 px-3 text-center">Qtd</th>
                <th className="py-2 px-3">Tipo de Vidro</th>
                <th className="py-2 px-3 text-center">Permite Giro</th>
                <th className="py-2 px-3">Origem</th>
                <th className="py-2 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              {pieces.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 font-bold text-white font-sans">{p.label}</td>
                  <td className="py-2 px-3 text-cyan-400 font-bold">{p.widthMm}</td>
                  <td className="py-2 px-3 text-cyan-400 font-bold">{p.heightMm}</td>
                  <td className="py-2 px-3 text-center text-amber-400 font-bold">{p.quantity}</td>
                  <td className="py-2 px-3 text-slate-300 font-sans">{p.glassType || 'Incolor'}</td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPieces((prev) =>
                          prev.map((item) =>
                            item.id === p.id ? { ...item, allowRotation: !item.allowRotation } : item
                          )
                        );
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold cursor-pointer transition-colors ${
                        p.allowRotation
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {p.allowRotation ? 'Livre (90°)' : 'Bloqueado'}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-slate-400">{p.orderNumber ? `OP #${p.orderNumber}` : 'Manual'}</td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemovePiece(p.id)}
                      className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all cursor-pointer"
                      title="Excluir peça do plano"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Formulário Rápido para Inserir Nova Peça */}
        <form onSubmit={handleAddManualPiece} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex-1 min-w-[140px]">
            <input
              type="text"
              placeholder="Ex: Vidro Fixo Superior"
              value={newPieceLabel}
              onChange={(e) => setNewPieceLabel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-sans focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="w-24">
            <input
              type="number"
              placeholder="Larg (mm)"
              value={newPieceWidth || ''}
              onChange={(e) => setNewPieceWidth(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-cyan-400 font-bold focus:outline-none"
            />
          </div>

          <div className="w-24">
            <input
              type="number"
              placeholder="Alt (mm)"
              value={newPieceHeight || ''}
              onChange={(e) => setNewPieceHeight(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-cyan-400 font-bold focus:outline-none"
            />
          </div>

          <div className="w-16">
            <input
              type="number"
              placeholder="Qtd"
              min="1"
              value={newPieceQty}
              onChange={(e) => setNewPieceQty(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-amber-400 font-bold focus:outline-none"
            />
          </div>

          <div className="w-36">
            <input
              type="text"
              placeholder="Tipo de Vidro"
              value={newPieceGlassType}
              onChange={(e) => setNewPieceGlassType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 font-sans focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer font-sans text-xs px-2">
            <input
              type="checkbox"
              checked={newPieceAllowRotation}
              onChange={(e) => setNewPieceAllowRotation(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-500"
            />
            <span>Giro 90°</span>
          </label>

          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-sans transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Peça</span>
          </button>
        </form>
      </div>

      {/* Modal de Configuração de Chapa & Refilo */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Parâmetros de Corte da Vidraçaria</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Presets de Chapas Padrão */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 font-sans">
                Presets de Chapas Padrão de Vidro:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GLASS_SHEET_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedPreset === preset.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs block">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensões Customizadas */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Largura da Chapa (mm):</label>
                <input
                  type="number"
                  value={options.sheetWidthMm}
                  onChange={(e) => {
                    setSelectedPreset('custom');
                    setOptions({ ...options, sheetWidthMm: Number(e.target.value) });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Altura da Chapa (mm):</label>
                <input
                  type="number"
                  value={options.sheetHeightMm}
                  onChange={(e) => {
                    setSelectedPreset('custom');
                    setOptions({ ...options, sheetHeightMm: Number(e.target.value) });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Refilo de Borda (mm):</label>
                <input
                  type="number"
                  value={options.edgeTrimMm}
                  onChange={(e) => setOptions({ ...options, edgeTrimMm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Espessura do Corte Kerf (mm):</label>
                <input
                  type="number"
                  value={options.kerfMm}
                  onChange={(e) => setOptions({ ...options, kerfMm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Largura Mín. Retalho Útil (mm):</label>
                <input
                  type="number"
                  value={options.minUsefulRemnantWidthMm}
                  onChange={(e) => setOptions({ ...options, minUsefulRemnantWidthMm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Altura Mín. Retalho Útil (mm):</label>
                <input
                  type="number"
                  value={options.minUsefulRemnantHeightMm}
                  onChange={(e) => setOptions({ ...options, minUsefulRemnantHeightMm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Aplicar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
