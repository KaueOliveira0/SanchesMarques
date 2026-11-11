import React, { useState, useMemo } from 'react';
import {
  calculateRequiredInertia,
  KNOWN_PROFILES_INERTIA,
  StructuralInertiaCalculation,
} from '../utils/structuralInertia';
import { BRAZIL_CITY_PRESETS, CityPreset } from '../utils/nbr10821';
import { calculateWindPressure } from '../utils/glassCalculator';
import {
  ShieldAlert,
  ShieldCheck,
  X,
  Wind,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Wrench,
  Compass,
} from 'lucide-react';

interface StructuralInertiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWidth?: number;
  initialHeight?: number;
  initialSeries?: string;
}

export const StructuralInertiaModal: React.FC<StructuralInertiaModalProps> = ({
  isOpen,
  onClose,
  initialWidth = 1600,
  initialHeight = 2200,
  initialSeries = 'Suprema',
}) => {
  const [widthMm, setWidthMm] = useState<number>(initialWidth);
  const [heightMm, setHeightMm] = useState<number>(initialHeight);
  const [selectedCityName, setSelectedCityName] = useState<string>('São Paulo');
  const [buildingHeightM, setBuildingHeightM] = useState<number>(18);
  const [selectedProfileCode, setSelectedProfileCode] = useState<string>(
    initialSeries.toLowerCase().includes('chroma') ? 'CHR-020' : 'SU-053'
  );

  // Seleção de cidade predefinida da NBR 6123
  const cityPreset: CityPreset = useMemo(() => {
    return BRAZIL_CITY_PRESETS.find((c) => c.cityName === selectedCityName) || BRAZIL_CITY_PRESETS[0];
  }, [selectedCityName]);

  // Calcula pressão de vento conforme NBR 6123 e NBR 10821
  const windPressureResult = useMemo(() => {
    const windRegion = (cityPreset.windZone === 'IV' ? 'IV' : cityPreset.windZone === 'III' ? 'III' : 'II') as any;
    const heightCategory = buildingHeightM <= 5 ? 'terreo_5m' : buildingHeightM <= 15 ? 'ate_15m' : buildingHeightM <= 30 ? 'ate_30m' : buildingHeightM <= 60 ? 'ate_60m' : 'acima_60m';
    const terrain = cityPreset.defaultTerrain === 'II_litoral' ? 'litoral_aberto' : 'suburbano_normal';
    return calculateWindPressure(windRegion, heightCategory, terrain);
  }, [cityPreset, buildingHeightM]);

  // Calcula inércia do montante
  const inertiaCalc: StructuralInertiaCalculation = useMemo(() => {
    return calculateRequiredInertia(
      widthMm,
      heightMm,
      windPressureResult.pressurePa,
      selectedProfileCode
    );
  }, [widthMm, heightMm, windPressureResult.pressurePa, selectedProfileCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              inertiaCalc.isApproved
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            }`}>
              {inertiaCalc.isApproved ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Verificação de Inércia Estrutural de Montantes (NBR 10821-2)
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  inertiaCalc.isApproved
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}>
                  {inertiaCalc.isApproved ? 'APROVADO' : 'RISCO DE FLECHA EXCESSIVA'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dimensione montantes e mãos de amigo para resistir às pressões de vento da sua região sem empenamento.
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

        {/* Parâmetros do Vão e Região */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs shrink-0">
          <div>
            <label className="text-slate-400 block mb-1">Largura do Vão (mm)</label>
            <input
              type="number"
              step={50}
              min={600}
              max={6000}
              value={widthMm}
              onChange={(e) => setWidthMm(Math.max(600, parseInt(e.target.value) || 1600))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Altura / Vão Livre (mm)</label>
            <input
              type="number"
              step={50}
              min={600}
              max={4000}
              value={heightMm}
              onChange={(e) => setHeightMm(Math.max(600, parseInt(e.target.value) || 2200))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Cidade / Região de Vento</label>
            <select
              value={selectedCityName}
              onChange={(e) => setSelectedCityName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              {BRAZIL_CITY_PRESETS.map((p) => (
                <option key={p.cityName} value={p.cityName}>
                  {p.cityName} - {p.state} (Região {p.windZone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Altura do Andar (m)</label>
            <input
              type="number"
              min={1}
              max={150}
              value={buildingHeightM}
              onChange={(e) => setBuildingHeightM(Math.max(1, parseInt(e.target.value) || 18))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {/* Seletor do Montante a Avaliar */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Selecione o Montante / Mão de Amigo em Análise:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {KNOWN_PROFILES_INERTIA.length} perfis cadastrados com momento de inércia (Ix)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {KNOWN_PROFILES_INERTIA.map((prof) => {
                const isSelected = selectedProfileCode === prof.code;
                return (
                  <button
                    key={prof.code}
                    type="button"
                    onClick={() => setSelectedProfileCode(prof.code)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-md text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-amber-400">{prof.code}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {prof.series}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold truncate mt-0.5">{prof.name}</div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                      <span>Ix: <b className="text-emerald-400">{prof.ixCm4.toFixed(2)} cm⁴</b></span>
                      <span>{prof.weightKgm} kg/m</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards de Resultado da NBR 10821 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Pressão de Vento (P)</span>
              <div className="text-base font-bold text-cyan-400 font-mono mt-1">
                {windPressureResult.pressurePa} <small className="text-xs">Pa</small>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {(windPressureResult.pressurePa * 0.10197).toFixed(1)} kgf/m²
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Inércia Necessária (I nec)</span>
              <div className="text-base font-bold text-amber-400 font-mono mt-1">
                {inertiaCalc.requiredIxCm4.toFixed(2)} <small className="text-xs">cm⁴</small>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                f_adm = {inertiaCalc.admissibleDeflectionMm.toFixed(1)} mm
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Inércia Real do Perfil</span>
              <div className="text-base font-bold text-white font-mono mt-1">
                {inertiaCalc.actualIxCm4.toFixed(2)} <small className="text-xs">cm⁴</small>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedProfileCode} ({inertiaCalc.selectedProfile.series})
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${
              inertiaCalc.isApproved
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}>
              <span className="text-[10px] uppercase font-mono">Flecha Máxima Estimada</span>
              <div className="text-base font-bold font-mono mt-1">
                {inertiaCalc.estimatedDeflectionMm} <small className="text-xs">mm</small>
              </div>
              <span className="text-[10px] font-mono">
                Capacidade: {inertiaCalc.ratioPercent}%
              </span>
            </div>
          </div>

          {/* Barra de Progresso / Margem Estrutural */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Índice de Aproveitamento da Inércia:</span>
              <span className={`font-mono font-bold ${inertiaCalc.isApproved ? 'text-emerald-400' : 'text-rose-400'}`}>
                {inertiaCalc.actualIxCm4.toFixed(2)} / {inertiaCalc.requiredIxCm4.toFixed(2)} cm⁴ ({inertiaCalc.ratioPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all rounded-full ${
                  inertiaCalc.isApproved
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-amber-500 to-rose-500'
                }`}
                style={{ width: `${Math.min(100, inertiaCalc.ratioPercent)}%` }}
              />
            </div>
          </div>

          {/* Diagnóstico & Recomendações */}
          <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
            inertiaCalc.isApproved
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
              : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {inertiaCalc.isApproved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{inertiaCalc.isApproved ? 'Parecer Técnico de Engenharia: APROVADO' : 'Parecer Técnico de Engenharia: NÃO CONFORME'}</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-300">
              {inertiaCalc.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
            {inertiaCalc.recommendedReinforcement && (
              <div className="mt-2 p-2.5 bg-amber-950/40 border border-amber-800/70 rounded-lg text-amber-300 text-[11px] flex items-start gap-2">
                <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Solução Recomendada de Engenharia:</span> {inertiaCalc.recommendedReinforcement}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-400">
            Fórmula de vigas elásticas: f = (5·q·L⁴)/(384·E·I) com E = 70.000 MPa (Alumínio).
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
