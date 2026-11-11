import React, { useState } from 'react';
import {
  PUNCH_PRESS_MACHINES,
  getPunchOperationsForProfile,
  PunchPressMachine,
  PunchOperation,
} from '../utils/punchToolingGuide';
import {
  X,
  Cpu,
  Wrench,
  Gauge,
  Droplet,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface PunchToolingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfileCode?: string;
}

export const PunchToolingModal: React.FC<PunchToolingModalProps> = ({
  isOpen,
  onClose,
  initialProfileCode,
}) => {
  const [selectedMachineIdx, setSelectedMachineIdx] = useState<number>(0);
  const [searchProfile, setSearchProfile] = useState<string>(initialProfileCode || '');

  if (!isOpen) return null;

  const currentMachine = PUNCH_PRESS_MACHINES[selectedMachineIdx] || PUNCH_PRESS_MACHINES[0];

  const filteredStations = currentMachine.stations.filter((st) => {
    if (!searchProfile.trim()) return true;
    const term = searchProfile.toLowerCase().trim();
    return (
      st.operationName.toLowerCase().includes(term) ||
      st.targetProfiles.some((p) => p.toLowerCase().includes(term)) ||
      st.purpose.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Guia de Estampos Pneumáticos, Matrizes & Furação de Bancada
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Manual de Fábrica Sanches & Marques
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Setup das estações de estampagem para linhas Suprema, Gold e Chroma: rasgos de fecho, drenos e alívio de roldanas.
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

        {/* Seleção da Prensa e Busca de Perfil */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs shrink-0 font-mono">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-400 font-sans">Estampo:</span>
            <div className="flex gap-1.5">
              {PUNCH_PRESS_MACHINES.map((m, idx) => (
                <button
                  key={m.machineModel}
                  type="button"
                  onClick={() => setSelectedMachineIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedMachineIdx === idx
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {m.series}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pressão Ar: <b>{currentMachine.recommendedAirPressureBar} bar</b></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Droplet className="w-3.5 h-3.5 text-amber-400" />
              <span>Lubrificação: <b>{currentMachine.oilLubricationIntervalHours}h</b></span>
            </div>
          </div>
        </div>

        {/* Filtro por Perfil */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs font-mono">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar por código de perfil (ex: SU-053, CHR-020, GL-028) ou operação..."
            value={searchProfile}
            onChange={(e) => setSearchProfile(e.target.value)}
            className="w-full bg-transparent border-none text-white focus:outline-none placeholder:text-slate-600"
          />
          {searchProfile && (
            <button
              type="button"
              onClick={() => setSearchProfile('')}
              className="text-slate-500 hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Lista de Estações do Estampo */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredStations.map((station) => (
              <div
                key={station.stationNumber}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-emerald-400 text-xs font-mono flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">
                        {station.stationNumber}
                      </span>
                      {station.operationName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {station.strokePressureBar}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">
                    {station.purpose}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {station.targetProfiles.map((prof) => (
                      <span
                        key={prof}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800"
                      >
                        {prof}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 font-sans">
                  <b>Nota do Operador:</b> {station.notes}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 text-[11px]">
            {currentMachine.machineModel} ({currentMachine.manufacturer}) • Mantenha o filtro de ar e dreno de água limpos diariamente.
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
