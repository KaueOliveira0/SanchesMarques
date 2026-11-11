import React, { useState, useMemo } from 'react';
import { optimizeGlassNesting2D, GlassPaneToNest, GlassNestingResult } from '../utils/glassNesting2d';
import { useApp } from '../context/AppContext';
import {
  X,
  Layers,
  Printer,
  Maximize2,
  Minimize2,
  RotateCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface GlassNesting2dModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RAW_SHEET_PRESETS = [
  { label: 'Padrão Brasil (3210 × 2250 mm)', w: 3210, h: 2250 },
  { label: 'Chapa Jumbo (3210 × 2400 mm)', w: 3210, h: 2400 },
  { label: 'Meia Chapa (1605 × 2250 mm)', w: 1605, h: 2250 },
  { label: 'Especial Box (2200 × 1200 mm)', w: 2200, h: 1200 },
];

export const GlassNesting2dModal: React.FC<GlassNesting2dModalProps> = ({ isOpen, onClose }) => {
  const { orders } = useApp();

  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [kerfMm, setKerfMm] = useState<number>(4);
  const [edgeTrimMm, setEdgeTrimMm] = useState<number>(15);
  const [allowRotation, setAllowRotation] = useState<boolean>(true);
  const [selectedSheetIdx, setSelectedSheetIdx] = useState<number>(0);

  // Extrair vidros dos pedidos ou usar lote demonstrativo padrão
  const [panesList, setPanesList] = useState<GlassPaneToNest[]>(() => {
    return [
      {
        id: 'pane_1',
        orderNumber: 101,
        clientName: 'Residencial Alphaville',
        description: 'Vidro Folha Janela Suprema',
        widthMm: 655,
        heightMm: 1055,
        quantity: 6,
        glassType: 'Temperado Incolor',
        thicknessMm: 6,
      },
      {
        id: 'pane_2',
        orderNumber: 101,
        clientName: 'Residencial Alphaville',
        description: 'Vidro Maxim-Ar Suprema',
        widthMm: 680,
        heightMm: 480,
        quantity: 2,
        glassType: 'Temperado Incolor',
        thicknessMm: 6,
      },
      {
        id: 'pane_3',
        orderNumber: 101,
        clientName: 'Residencial Alphaville',
        description: 'Vidro Porta Balcão Gold',
        widthMm: 1060,
        heightMm: 2225,
        quantity: 2,
        glassType: 'Laminado 8mm',
        thicknessMm: 8,
      },
      {
        id: 'pane_4',
        orderNumber: 102,
        clientName: 'Dra Camila',
        description: 'Vidro Janela Chroma',
        widthMm: 720,
        heightMm: 1252,
        quantity: 4,
        glassType: 'Laminado 8mm',
        thicknessMm: 8,
      },
    ];
  });

  const currentSheetDim = RAW_SHEET_PRESETS[selectedPresetIdx] || RAW_SHEET_PRESETS[0];

  const nestingResult: GlassNestingResult = useMemo(() => {
    return optimizeGlassNesting2D(
      panesList,
      { sheetWidthMm: currentSheetDim.w, sheetHeightMm: currentSheetDim.h },
      { kerfMm, edgeTrimMm, allowRotation }
    );
  }, [panesList, currentSheetDim, kerfMm, edgeTrimMm, allowRotation]);

  if (!isOpen) return null;

  const currentSheet = nestingResult.sheets[selectedSheetIdx] || nestingResult.sheets[0];

  const handlePrintPlan = () => {
    if (typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
    <html>
    <head>
      <title>Plano de Corte 2D Guilhotinado - Sanches & Marques</title>
      <style>
        body { font-family: sans-serif; padding: 20px; color: #111; }
        h1 { margin-bottom: 4px; font-size: 20px; }
        .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
        .sheet-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 25px; page-break-inside: avoid; }
        svg { max-width: 100%; height: auto; border: 1px solid #999; }
      </style>
    </head>
    <body onload="window.print()">
      <h1>SANCHES & MARQUES ESQUADRIAS - PLANO DE CORTE 2D DE VIDROS</h1>
      <div class="meta">Chapa: ${currentSheetDim.label} | Eficiência Geral: ${nestingResult.overallEfficiencyPercent}% | Chapas Requeridas: ${nestingResult.totalSheetsRequired}</div>
      ${nestingResult.sheets
        .map(
          (s) => `
        <div class="sheet-box">
          <h3>Chapa #${s.sheetIndex} (${s.sheetWidthMm} × ${s.sheetHeightMm} mm) - Eficiência: ${s.efficiencyPercent}% - Sobra: ${s.scrapAreaM2} m²</h3>
          ${s.svgContent}
        </div>`
        )
        .join('')}
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Otimizador 2D de Corte de Chapas de Vidro (Guilhotinado)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  NBR 7199 & Padrão Cebrace/Guardian
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Aproveitamento inteligente em chapas Jumbo (3210x2400) e Padrão (3210x2250) com corte de serra/diamante.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-900/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Mapa 2D</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Controles e Presets */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs shrink-0 font-mono">
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Dimensão da Chapa Bruta</label>
            <select
              value={selectedPresetIdx}
              onChange={(e) => setSelectedPresetIdx(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold"
            >
              {RAW_SHEET_PRESETS.map((p, idx) => (
                <option key={p.label} value={idx}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Espessura do Corte / Kerf (mm)</label>
            <input
              type="number"
              value={kerfMm}
              onChange={(e) => setKerfMm(parseInt(e.target.value) || 4)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Refile de Borda / Trim (mm)</label>
            <input
              type="number"
              value={edgeTrimMm}
              onChange={(e) => setEdgeTrimMm(parseInt(e.target.value) || 15)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer font-sans text-slate-300">
              <input
                type="checkbox"
                checked={allowRotation}
                onChange={(e) => setAllowRotation(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
              <span>Permitir rotação 90° das peças</span>
            </label>
          </div>
        </div>

        {/* Resumo de Indicadores */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono shrink-0">
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Chapas Requeridas</span>
            <span className="text-lg font-bold text-cyan-400">{nestingResult.totalSheetsRequired} chapa(s)</span>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Peças Alocadas</span>
            <span className="text-lg font-bold text-white">
              {nestingResult.totalPanesPlaced} / {nestingResult.totalPanesRequested}
            </span>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Eficiência Média</span>
            <span className="text-lg font-bold text-emerald-400">{nestingResult.overallEfficiencyPercent}%</span>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Sobra Total</span>
            <span className="text-lg font-bold text-amber-400">{nestingResult.totalScrapAreaM2} m²</span>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[10px]">Ver Chapa:</span>
              <select
                value={selectedSheetIdx}
                onChange={(e) => setSelectedSheetIdx(parseInt(e.target.value) || 0)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 font-bold"
              >
                {nestingResult.sheets.map((s, idx) => (
                  <option key={s.sheetIndex} value={idx}>
                    Chapa #{s.sheetIndex} ({s.efficiencyPercent}%)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Visualização da Chapa Atual em SVG */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col items-center justify-center bg-slate-950/50 scrollbar-thin">
          {currentSheet && (
            <div className="w-full max-w-4xl bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-3 text-xs font-mono">
                <span className="text-slate-300 font-bold">
                  Mapa de Corte Chapa #{currentSheet.sheetIndex} ({currentSheet.sheetWidthMm} × {currentSheet.sheetHeightMm} mm)
                </span>
                <span className="text-emerald-400">
                  Aproveitamento: <b>{currentSheet.efficiencyPercent}%</b> (Útil: {currentSheet.usedAreaM2} m² | Retalho: {currentSheet.scrapAreaM2} m²)
                </span>
              </div>

              <div
                className="w-full aspect-[3210/2250] max-h-[50vh] flex items-center justify-center overflow-hidden"
                dangerouslySetInnerHTML={{ __html: currentSheet.svgContent }}
              />

              {/* Lista das peças na chapa */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 block mb-2 font-mono">
                  Peças nesta chapa ({currentSheet.placedPanes.length} un):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-mono">
                  {currentSheet.placedPanes.map((pane, idx) => (
                    <div
                      key={pane.paneId}
                      className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: pane.colorHex }}
                        />
                        <span className="text-white font-bold truncate max-w-[140px]">
                          {pane.widthMm} × {pane.heightMm} mm
                        </span>
                      </div>
                      <span className="text-slate-500">#{pane.orderNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 text-[11px]">
            Cortes guilhotinados contínuos que respeitam a linha de corte manual ou mesa CNC automática de vidraçaria.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
