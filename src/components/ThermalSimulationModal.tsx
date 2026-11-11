import React, { useState, useMemo } from 'react';
import {
  calculateWindowThermalPerformance,
  FRAME_THERMAL_PRESETS,
  GLAZING_THERMAL_PRESETS,
  WindowThermalSimulationResult,
} from '../utils/thermalCalculator';
import {
  X,
  Thermometer,
  Zap,
  Leaf,
  ShieldCheck,
  AlertTriangle,
  Award,
  BarChart3,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';

interface ThermalSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWidth?: number;
  initialHeight?: number;
}

export const ThermalSimulationModal: React.FC<ThermalSimulationModalProps> = ({
  isOpen,
  onClose,
  initialWidth = 1500,
  initialHeight = 1200,
}) => {
  const [widthMm, setWidthMm] = useState<number>(initialWidth);
  const [heightMm, setHeightMm] = useState<number>(initialHeight);
  const [frameType, setFrameType] = useState<string>('alum_sem_ruptura');
  const [glassType, setGlassType] = useState<string>('duplo_insulado_ar');
  const [bioclimaticZone, setBioclimaticZone] = useState<number>(3); // ZB3 (São Paulo / Campinas)

  const simulation: WindowThermalSimulationResult = useMemo(() => {
    return calculateWindowThermalPerformance({
      widthMm,
      heightMm,
      frameType: frameType as any,
      glassType: glassType as any,
      bioclimaticZone,
    });
  }, [widthMm, heightMm, frameType, glassType, bioclimaticZone]);

  if (!isOpen) return null;

  const compliance = simulation.nbr15575Compliance;
  const isApproved = compliance.status !== 'Não Atende';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isApproved
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            }`}>
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Simulação Térmica & Eficiência Energética (NBR 15575 / ISO 10077)
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isApproved
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}>
                  Etiqueta PBE: {simulation.procelRating}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transmitância térmica global (Uw), Fator Solar (FS/SHGC) e economia de ar condicionado (kWh/ano).
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

        {/* Parâmetros do Vão */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs shrink-0 font-mono">
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Largura Vão (mm)</label>
            <input
              type="number"
              step="50"
              value={widthMm}
              onChange={(e) => setWidthMm(parseInt(e.target.value) || 1500)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Altura Vão (mm)</label>
            <input
              type="number"
              step="50"
              value={heightMm}
              onChange={(e) => setHeightMm(parseInt(e.target.value) || 1200)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Tipo de Caixilho / Perfil</label>
            <select
              value={frameType}
              onChange={(e) => setFrameType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold"
            >
              {FRAME_THERMAL_PRESETS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (Uf = {f.uf})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Composição do Vidro</label>
            <select
              value={glassType}
              onChange={(e) => setGlassType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold"
            >
              {GLAZING_THERMAL_PRESETS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} (Ug = {g.ug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Zona Bioclimática NBR 15220</label>
            <select
              value={bioclimaticZone}
              onChange={(e) => setBioclimaticZone(parseInt(e.target.value) || 3)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-bold"
            >
              <option value="1">ZB1 - Curitiba / Serras do Sul</option>
              <option value="2">ZB2 - Porto Alegre / Caxias</option>
              <option value="3">ZB3 - São Paulo / Campinas</option>
              <option value="4">ZB4 - Belo Horizonte / Brasília</option>
              <option value="5">ZB5 - Rio de Janeiro / Santos</option>
              <option value="6">ZB6 - Salvador / Goiânia</option>
              <option value="7">ZB7 - Cuiabá / Teresina</option>
              <option value="8">ZB8 - Manaus / Belém / Recife</option>
            </select>
          </div>
        </div>

        {/* Indicadores Principais */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono shrink-0">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Transmitância Global Uw</span>
            <span className={`text-2xl font-black ${simulation.uWindowW_M2K <= 3.2 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {simulation.uWindowW_M2K} <span className="text-xs font-normal text-slate-400">W/m²K</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Quanto menor, mais isolante</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Fator Solar (SHGC / FS)</span>
            <span className="text-2xl font-black text-cyan-400">
              {simulation.solarHeatGainCoeff} <span className="text-xs font-normal text-slate-400">({Math.round(simulation.solarHeatGainCoeff * 100)}% calor)</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Entrada de radiação direta</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Conformidade NBR 15575</span>
            <span className={`text-base font-bold ${isApproved ? 'text-emerald-400' : 'text-rose-400'}`}>
              {compliance.status}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Critério ZB{bioclimaticZone}: Uw ≤ 5.7 W/m²K</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Economia de Energia Climatização</span>
            <span className="text-2xl font-black text-emerald-400">
              {compliance.annualKwhSavedPerM2} <span className="text-xs font-normal text-slate-400">kWh/m²·ano</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Redução na conta de luz</span>
          </div>
        </div>

        {/* Tabela Comparativa de Opções de Vidro & Caixilho */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          <span className="text-xs font-bold text-slate-300 block font-mono">
            Comparativo de Eficiência Energética para este Vão ({simulation.totalAreaM2} m²):
          </span>

          <div className="space-y-2">
            {simulation.comparativeOptions.map((opt: { name: string; uWindow: number; solarFactor: number; savingVsBaselinePercent: number; description: string }, idx: number) => (
              <div
                key={opt.name}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <span className="text-white font-bold block">{opt.name}</span>
                    <span className="text-[11px] text-slate-400 block font-sans">{opt.description}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Uw Global</span>
                    <span className="text-sm font-bold text-amber-400">{opt.uWindow} W/m²K</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Fator Solar</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-900 text-cyan-400 border border-slate-700">
                      FS {opt.solarFactor}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Economia</span>
                    <span className="text-sm font-bold text-emerald-400">+{opt.savingVsBaselinePercent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dica da Norma */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
            <Leaf className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Certificação Verde & Selo Procel Edifica:</span>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans leading-relaxed">
                Janelas e portas com vidro duplo insulado ou Low-E reduzem a carga térmica dos aparelhos de ar-condicionado em até 38%, pontuando para certificações LEED, AQUA e Selo Azul Caixa Econômica Federal.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 text-[11px]">
            Metodologia conforme ISO 10077-1 e NBR 15575-4 (Desempenho Térmico de Edificações Habitacionais).
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
