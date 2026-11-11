import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TYPOLOGIES_CATALOG } from '../data/catalog';
import { generateAssemblyPlan, AssemblyPlanData } from '../utils/assemblyPlan';
import { QualityControlModal } from './QualityControlModal';
import { PunchToolingModal } from './PunchToolingModal';
import {
  Wrench,
  Printer,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  Hammer,
} from 'lucide-react';

export const AssemblyPlanManager: React.FC = () => {
  const { orders } = useApp();

  const [selectedTypologyId, setSelectedTypologyId] = useState<string>(TYPOLOGIES_CATALOG[0].id);
  const [widthMm, setWidthMm] = useState<number>(1500);
  const [heightMm, setHeightMm] = useState<number>(1200);
  const [color, setColor] = useState<string>('Branco');
  const [quantity, setQuantity] = useState<number>(2);
  const [isQcOpen, setIsQcOpen] = useState<boolean>(false);
  const [isToolingOpen, setIsToolingOpen] = useState<boolean>(false);

  const selectedTypology = useMemo(() => {
    return TYPOLOGIES_CATALOG.find((t) => t.id === selectedTypologyId) || TYPOLOGIES_CATALOG[0];
  }, [selectedTypologyId]);

  const plan: AssemblyPlanData = useMemo(() => {
    return generateAssemblyPlan(
      selectedTypology,
      widthMm,
      heightMm,
      color,
      quantity,
      101,
      'Residencial Alphaville',
      'Dormitórios'
    );
  }, [selectedTypology, widthMm, heightMm, color, quantity]);

  const handlePrintPlan = () => {
    if (typeof window === 'undefined') return;
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Topo / Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide">
              Ficha & Instruções Técnicas de Montagem (PCP / Bancada)
            </h1>
            <p className="text-xs text-slate-400">
              Passo a passo padronizado de montagem, posicionamento de calços de vidro (NBR 7199) e parafusos de fixação.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsToolingOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Guia de Estampos</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQcOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>CQ & Certificado</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPlan}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-900/30 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </button>
        </div>
      </div>

      {/* Seletor de Tipologia e Parâmetros */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-mono">
        <div className="sm:col-span-2">
          <label className="text-slate-400 block mb-1 font-sans">Modelo de Tipologia</label>
          <select
            value={selectedTypologyId}
            onChange={(e) => setSelectedTypologyId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-bold"
          >
            {TYPOLOGIES_CATALOG.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.series})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1 font-sans">Largura Vão (mm)</label>
          <input
            type="number"
            value={widthMm}
            onChange={(e) => setWidthMm(parseInt(e.target.value) || 1500)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-cyan-400 font-bold"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1 font-sans">Altura Vão (mm)</label>
          <input
            type="number"
            value={heightMm}
            onChange={(e) => setHeightMm(parseInt(e.target.value) || 1200)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-cyan-400 font-bold"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1 font-sans">Acabamento / Cor</label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-amber-400 font-bold"
          >
            <option value="Branco">Branco</option>
            <option value="Preto">Preto</option>
            <option value="Bronze">Bronze</option>
            <option value="Natural">Natural</option>
            <option value="Amadeirado">Amadeirado</option>
          </select>
        </div>
      </div>

      {/* Fases Sequenciais de Montagem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plan.steps.map((st) => (
          <div
            key={st.stepNumber}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">
                    {st.stepNumber}
                  </span>
                  {st.phase}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  {st.toolsRequired.join(', ')}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-2">{st.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
                {st.description}
              </p>

              {st.criticalNotice && (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{st.criticalNotice}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
              Componentes: <b>{st.componentsInvolved.join(' • ')}</b>
            </div>
          </div>
        ))}
      </div>

      {/* Regras de Calçamento de Vidro e Parafusos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* Calçamento de Vidro */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3 text-white font-bold">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Regras de Calçamento de Vidro (ABNT NBR 7199)</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 mb-3 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px]">Posicionamento Obrigatório:</span>
              <span>{plan.glassSettingRules.description}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">Calços Inferiores (Borda):</span>
                <span className="font-bold text-cyan-400">{plan.glassSettingRules.bottomBlocksQty} unidades</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Calços Laterais / Diagonal:</span>
                <span className="font-bold text-cyan-400">{plan.glassSettingRules.sideBlocksQty} unidades</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-rose-950/30 border border-rose-800/50 rounded-lg text-rose-300 text-[11px]">
            <b>Atenção:</b> {plan.glassSettingRules.warning}
          </div>
        </div>

        {/* Lista de Parafusos & Fixadores */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3 text-white font-bold">
            <Hammer className="w-4 h-4 text-emerald-400" />
            <span>Parafusos e Fixadores Inox Necessários</span>
          </div>

          <div className="space-y-2">
            {plan.fastenersList.map((f) => (
              <div
                key={f.name}
                className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-white font-bold block">{f.name}</span>
                  <span className="text-[10px] text-slate-500 font-sans">{f.purpose}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-400">{f.totalQuantity} un</span>
                  <span className="text-[10px] text-slate-500 block">{f.spec}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modais */}
      <QualityControlModal
        isOpen={isQcOpen}
        onClose={() => setIsQcOpen(false)}
        typologyCode={selectedTypology.code}
        typologyName={selectedTypology.name}
        initialWidth={widthMm}
        initialHeight={heightMm}
      />

      <PunchToolingModal
        isOpen={isToolingOpen}
        onClose={() => setIsToolingOpen(false)}
      />
    </div>
  );
};
