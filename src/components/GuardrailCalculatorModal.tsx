import React, { useState, useMemo } from 'react';
import {
  calculateGuardrailCompliance,
  GUARDRAIL_SYSTEM_TYPES,
  GUARDRAIL_GLASS_TYPES,
  BUILDING_USAGE_TYPES,
  ANCHORAGE_TYPES,
  GuardrailComplianceResult,
} from '../utils/guardrailStructural';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Ruler,
  Anchor,
  HelpCircle,
} from 'lucide-react';

interface GuardrailCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuardrailCalculatorModal: React.FC<GuardrailCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [totalLengthM, setTotalLengthM] = useState<number>(4.0);
  const [heightMm, setHeightMm] = useState<number>(1100);
  const [buildingUsage, setBuildingUsage] = useState<string>('residencial_coletivo');
  const [systemType, setSystemType] = useState<string>('pontalete_coluna');
  const [glassType, setGlassType] = useState<string>('laminado_temperado_10mm');
  const [interlayerType, setInterlayerType] = useState<string>('pvb_152');
  const [anchorageType, setAnchorageType] = useState<string>('chumbador_quimico_inox');

  const compliance: GuardrailComplianceResult = useMemo(() => {
    return calculateGuardrailCompliance({
      totalLengthM,
      heightMm,
      buildingUsage,
      systemType,
      glassType,
      interlayerType,
      anchorageType,
    });
  }, [totalLengthM, heightMm, buildingUsage, systemType, glassType, interlayerType, anchorageType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              compliance.overallApproved
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            }`}>
              {compliance.overallApproved ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Dimensionamento Estrutural de Guarda-Corpo (ABNT NBR 14718)
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  compliance.overallApproved
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}>
                  {compliance.overallApproved ? 'ESTRUTURA HOMOLOGADA' : 'REPROVADO PELA NORMA'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verificação mandatória de altura mínima (1100mm), ensaio de impacto 600J e fixação de ancoragem química.
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

        {/* Configuração do Vão */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs shrink-0 font-mono">
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Comprimento Sacada (m)</label>
            <input
              type="number"
              step="0.5"
              value={totalLengthM}
              onChange={(e) => setTotalLengthM(parseFloat(e.target.value) || 2.0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Altura do Guarda-Corpo (mm)</label>
            <input
              type="number"
              step="50"
              value={heightMm}
              onChange={(e) => setHeightMm(parseInt(e.target.value) || 1100)}
              className={`w-full bg-slate-900 border rounded-lg px-2.5 py-1.5 font-bold ${
                heightMm >= 1100 ? 'border-emerald-600 text-emerald-400' : 'border-rose-600 text-rose-400'
              }`}
            />
            {heightMm < 1100 && (
              <span className="text-[10px] text-rose-400 font-sans block mt-1">Mínimo 1100mm (NBR 14718)</span>
            )}
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Uso da Edificação</label>
            <select
              value={buildingUsage}
              onChange={(e) => setBuildingUsage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold"
            >
              {BUILDING_USAGE_TYPES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} ({u.horizontalLoadKnM} kN/m)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Sistema Construtivo</label>
            <select
              value={systemType}
              onChange={(e) => setSystemType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold"
            >
              {GUARDRAIL_SYSTEM_TYPES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Escolha do Vidro e Interlayer */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shrink-0 font-mono">
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Especificação do Vidro</label>
            <select
              value={glassType}
              onChange={(e) => setGlassType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
            >
              {GUARDRAIL_GLASS_TYPES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Película Interlayer</label>
            <select
              value={interlayerType}
              onChange={(e) => setInterlayerType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold"
            >
              <option value="pvb_076">PVB 0,76 mm (Padrão)</option>
              <option value="pvb_152">PVB 1,52 mm (Reforçado)</option>
              <option value="sentryglas">SentryGlas / Estrutural Ionoplast</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Tipo de Fixação / Ancoragem</label>
            <select
              value={anchorageType}
              onChange={(e) => setAnchorageType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-bold"
            >
              {ANCHORAGE_TYPES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alerta de Não Conformidade se Monolítico */}
        {!compliance.glassSafetyApproved && (
          <div className="p-3 bg-rose-950/50 border-b border-rose-800 text-xs font-mono text-rose-300 flex items-center gap-3 shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{compliance.glassSafetyWarning}</span>
          </div>
        )}

        {/* Painel Central com Status dos 4 Ensaios da Norma */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className={`p-3 rounded-xl border ${
              compliance.normativeHeightApproved ? 'bg-slate-950 border-slate-800' : 'bg-rose-950/30 border-rose-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-sans text-[11px]">Altura Mínima</span>
                {compliance.normativeHeightApproved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <span className="text-base font-bold text-white">{heightMm} mm</span>
              <span className="text-[10px] text-slate-500 block mt-1 font-sans">Exigência: ≥ 1100 mm</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              compliance.glassSafetyApproved ? 'bg-slate-950 border-slate-800' : 'bg-rose-950/30 border-rose-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-sans text-[11px]">Vidro de Segurança</span>
                {compliance.glassSafetyApproved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <span className="text-base font-bold text-white truncate block">
                {compliance.glassSafetyApproved ? 'Laminado Aprovado' : 'Proibido pela Norma'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1 font-sans">Obrigatório PVB/Ionoplast</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              compliance.softBodyImpactTestResult.approved ? 'bg-slate-950 border-slate-800' : 'bg-rose-950/30 border-rose-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-sans text-[11px]">Impacto de Corpo Mole</span>
                {compliance.softBodyImpactTestResult.approved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <span className="text-base font-bold text-white">600 Joules</span>
              <span className="text-[10px] text-slate-500 block mt-1 font-sans">Saco de couro 40kg a 1,5m</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              compliance.anchorageApproved ? 'bg-slate-950 border-slate-800' : 'bg-rose-950/30 border-rose-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-sans text-[11px]">Carga de Multidão</span>
                {compliance.anchorageApproved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <span className="text-base font-bold text-white">{compliance.requiredLinearLoadKnM} kN/m</span>
              <span className="text-[10px] text-slate-500 block mt-1 font-sans">Deflexão horizontal ≤ 20mm</span>
            </div>
          </div>

          {/* Lista de Materiais / Lista de Corte Necessária */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-white block mb-3 font-sans">
              Lista Técnica de Materiais Dimensionados para {totalLengthM} metros de Sacada:
            </span>

            <div className="space-y-2">
              {compliance.billOfMaterials.map((mat) => (
                <div
                  key={mat.item}
                  className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="text-white font-bold">{mat.item}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 font-bold">
                      {mat.quantity} {mat.unit}
                    </span>
                    <span className="text-slate-500 text-[11px] font-sans">{mat.notes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 text-[11px]">
            Laudo de conformidade técnica gerado de acordo com a ABNT NBR 14718 (Guarda-corpos para edificações).
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
