import React, { useState, useMemo } from 'react';
import {
  selectGlazingBead,
  GLAZING_BEADS_CATALOG,
  GlazingSelectionResult,
} from '../utils/glazingBeadSelector';
import {
  ShieldCheck,
  X,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Maximize2,
} from 'lucide-react';

interface GlazingBeadSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSeries?: string;
  initialGlassThickness?: number;
  initialGlassCategory?: string;
  onApplyBead?: (beadCode: string, beadName: string) => void;
}

export const GlazingBeadSelectorModal: React.FC<GlazingBeadSelectorModalProps> = ({
  isOpen,
  onClose,
  initialSeries = 'Suprema',
  initialGlassThickness = 6,
  initialGlassCategory = 'Temperado',
  onApplyBead,
}) => {
  const [selectedSeries, setSelectedSeries] = useState<string>(initialSeries);
  const [glassThickness, setGlassThickness] = useState<number>(initialGlassThickness);
  const [glassCategory, setGlassCategory] = useState<string>(initialGlassCategory);

  const glassPresets = [
    { label: '4mm Temperado/Comum', thickness: 4, category: 'Temperado' },
    { label: '6mm Temperado (Padrão)', thickness: 6, category: 'Temperado' },
    { label: '8mm Laminado (4+4mm)', thickness: 8, category: 'Laminado' },
    { label: '10mm Temperado/Laminado (5+5mm)', thickness: 10, category: 'Laminado' },
    { label: '12mm Laminado Acústico (6+6mm)', thickness: 12, category: 'Laminado' },
    { label: '18mm Insulado Duplo (4+10+4mm)', thickness: 18, category: 'Insulado Termoacústico' },
    { label: '22mm Insulado Acústico (6+10+6mm)', thickness: 22, category: 'Insulado Termoacústico' },
  ];

  const result: GlazingSelectionResult = useMemo(() => {
    return selectGlazingBead(selectedSeries, glassThickness, glassCategory);
  }, [selectedSeries, glassThickness, glassCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Seletor Inteligente de Baguetes & Gaxetas de Vedação
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  Câmara da Folha
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evite erros de montagem: dimensione o baguete exato para vidros de 4mm até 22mm insulados.
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

        {/* Seleção de Linha e Espessura */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs shrink-0">
          <div>
            <label className="text-slate-400 block mb-1">Linha da Esquadria</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['Suprema', 'Chroma', 'Gold'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSeries(s)}
                  className={`py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    selectedSeries.toLowerCase() === s.toLowerCase()
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Especificação do Vidro</label>
            <select
              value={glassThickness}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setGlassThickness(val);
                const found = glassPresets.find((g) => g.thickness === val);
                if (found) setGlassCategory(found.category);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-bold focus:outline-none"
            >
              {glassPresets.map((g) => (
                <option key={g.thickness} value={g.thickness}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conteúdo: Diagrama Visual da Câmara */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {/* Card de Encaixe Recomendado */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Baguete Recomendado para {result.series} com Vidro {result.glassThicknessMm}mm:
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Encaixe {result.fitStatus}
              </span>
            </div>

            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-amber-400 text-lg">
                    {result.recommendedBead.code}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    Largura: {result.recommendedBead.beadWidthMm}mm
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">
                  {result.recommendedBead.name}
                </h4>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Gaxeta / Cunha indicada: <b className="text-cyan-400 font-mono">{result.recommendedBead.sealGasketCode}</b>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 block uppercase">Custo Linear</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  R$ {result.recommendedBead.costPerMeter.toFixed(2)}/m
                </span>
                <div className="text-[10px] text-slate-500 font-mono">
                  Peso: {result.recommendedBead.weightKgm} kg/m
                </div>
              </div>
            </div>

            {/* Representação Gráfica da Secção Transversal */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Diagrama de Ocupação da Câmara da Folha ({result.profilePocketDepthMm} mm totais):</span>
                <span className="font-mono font-bold text-slate-200">
                  Total montado: {result.totalPackMm} mm
                </span>
              </div>

              {/* Barra segmentada */}
              <div className="h-9 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex text-[10px] font-mono font-bold">
                {/* Gaxeta Interna */}
                <div
                  className="bg-slate-700 text-slate-300 flex items-center justify-center border-r border-slate-800 truncate px-1"
                  style={{ width: `${(result.innerGasketMm / result.profilePocketDepthMm) * 100}%` }}
                  title={`Gaxeta Interna: ${result.innerGasketMm}mm`}
                >
                  Gaxeta
                </div>

                {/* Vidro */}
                <div
                  className="bg-cyan-600 text-slate-950 flex items-center justify-center border-r border-slate-800 truncate px-1"
                  style={{ width: `${(result.glassThicknessMm / result.profilePocketDepthMm) * 100}%` }}
                  title={`Vidro: ${result.glassThicknessMm}mm`}
                >
                  Vidro {result.glassThicknessMm}mm
                </div>

                {/* Cunha / Vedação externa */}
                <div
                  className="bg-slate-700 text-slate-300 flex items-center justify-center border-r border-slate-800 truncate px-1"
                  style={{ width: `${(result.wedgeGasketMm / result.profilePocketDepthMm) * 100}%` }}
                  title={`Cunha: ${result.wedgeGasketMm}mm`}
                >
                  Cunha
                </div>

                {/* Baguete */}
                <div
                  className="bg-purple-600 text-white flex items-center justify-center truncate px-1 flex-1"
                  title={`Baguete: ${result.recommendedBead.beadWidthMm}mm`}
                >
                  Baguete {result.recommendedBead.code} ({result.recommendedBead.beadWidthMm}mm)
                </div>
              </div>
            </div>

            {/* Notas Técnicas */}
            <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{result.technicianNotes}</span>
            </div>
          </div>

          {/* Baguetes Alternativos */}
          {result.alternativeBeads.length > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-400 block">Outros Baguetes da Linha {result.series}:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.alternativeBeads.map((b) => (
                  <div key={b.code} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-amber-400">{b.code}</span>
                      <div className="text-[11px] text-slate-300 font-semibold">{b.name}</div>
                      <div className="text-[10px] text-slate-500">
                        Vidro: {b.compatibleGlassMinMm} a {b.compatibleGlassMaxMm}mm
                      </div>
                    </div>
                    <span className="font-mono text-emerald-400 text-xs font-bold">
                      {b.beadWidthMm}mm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Ação */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Fechar
          </button>

          {onApplyBead && (
            <button
              type="button"
              onClick={() => {
                onApplyBead(result.recommendedBead.code, result.recommendedBead.name);
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aplicar Baguete {result.recommendedBead.code} ao Orçamento</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
