import React, { useState, useMemo } from 'react';
import { compareLinesForSpan } from '../utils/lineBenchmarking';
import {
  X,
  SlidersHorizontal,
  Scale,
  Volume2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface LineBenchmarkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWidth?: number;
  initialHeight?: number;
}

export const LineBenchmarkingModal: React.FC<LineBenchmarkingModalProps> = ({
  isOpen,
  onClose,
  initialWidth = 1600,
  initialHeight = 1400,
}) => {
  const [widthMm, setWidthMm] = useState<number>(initialWidth);
  const [heightMm, setHeightMm] = useState<number>(initialHeight);
  const [windPressure, setWindPressure] = useState<number>(45);
  const [openingType, setOpeningType] = useState<'janela' | 'porta'>('janela');

  const comparisons = useMemo(() => {
    return compareLinesForSpan(widthMm, heightMm, windPressure, openingType);
  }, [widthMm, heightMm, windPressure, openingType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Comparativo Técnico Multi-Linhas (Benchmarking de Esquadrias)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  Suprema vs Gold vs Chroma vs Linha 25/30
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Análise paramétrica comparativa de peso por m², atenuação acústica (dB), momentos de inércia e custo sugerido.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Painel de Parâmetros de Entrada */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs shrink-0 font-mono">
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Largura do Vão (mm)</label>
            <input
              type="number"
              step="50"
              value={widthMm}
              onChange={(e) => setWidthMm(parseInt(e.target.value) || 1000)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Altura do Vão (mm)</label>
            <input
              type="number"
              step="50"
              value={heightMm}
              onChange={(e) => setHeightMm(parseInt(e.target.value) || 1000)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Pressão Vento (kgf/m²)</label>
            <input
              type="number"
              step="5"
              value={windPressure}
              onChange={(e) => setWindPressure(parseInt(e.target.value) || 35)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Tipo de Vão</label>
            <select
              value={openingType}
              onChange={(e) => setOpeningType(e.target.value as 'janela' | 'porta')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold"
            >
              <option value="janela">Janela de Correr / Maxim-ar</option>
              <option value="porta">Porta Balcão / Entrada Pesada</option>
            </select>
          </div>
        </div>

        {/* Tabela Comparativa de 5 Linhas */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {comparisons.map((item) => {
              const spec = item.spec;
              const isRecommended = item.isSpanRecommended;

              return (
                <div
                  key={spec.series}
                  className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                    isRecommended
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      : 'bg-rose-950/20 border-rose-900/40 opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm">{spec.series}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isRecommended
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {isRecommended ? 'Aprovado' : 'Limitado'}
                      </span>
                    </div>

                    <span className="text-[11px] text-amber-400 font-medium block mb-3">
                      {spec.category} • {spec.nominalDepthMm}mm
                    </span>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Peso Total:</span>
                        <span className="font-bold text-white">{item.estimatedWeightKg} kg</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Atenuação:</span>
                        <span className="font-bold text-emerald-400">{spec.acousticAttenuationDb} dB</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Inércia Ix:</span>
                        <span className="font-bold text-cyan-400">{spec.momentOfInertiaIxCm4} cm⁴</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Capacidade:</span>
                        <span className="font-bold text-slate-300">{spec.maxLeafWeightKg} kg/folha</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Custo Mat.:</span>
                        <span className="font-bold text-slate-300">R$ {item.materialCost}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Preço Sugerido</span>
                    <span className="text-base font-bold text-amber-400 font-mono">
                      R$ {item.suggestedSalePrice.toLocaleString('pt-BR')}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-2 text-left font-sans leading-tight">
                      {item.notes}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dica Técnica */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
            <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Orientação para Proposta Comercial:</span>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans leading-relaxed">
                Utilize o comparativo em reuniões com arquitetos e clientes finais para evidenciar o ganho acústico (ex: Chroma +9dB sobre Suprema) ou a robustez estrutural da Linha Gold em portas com mais de 2,20m de altura.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 text-[11px]">
            Algoritmo de dimensionamento e cálculo de peso baseado nos catálogos oficiais Alcoa/Hydro e Perfil Alumínio.
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
