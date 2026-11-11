import React, { useState, useMemo } from 'react';
import {
  evaluateQualityInspection,
  generateWarrantyCertificateHtml,
  QualityInspectionData,
  QualityCheckItem,
  DEFAULT_QUALITY_CHECKLIST,
} from '../utils/qualityControlCert';
import {
  X,
  ShieldCheck,
  Printer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  FileText,
  UserCheck,
} from 'lucide-react';

interface QualityControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber?: number;
  clientName?: string;
  typologyCode?: string;
  typologyName?: string;
  initialWidth?: number;
  initialHeight?: number;
}

export const QualityControlModal: React.FC<QualityControlModalProps> = ({
  isOpen,
  onClose,
  orderNumber = 101,
  clientName = 'Residencial Alphaville',
  typologyCode = 'J-COR-2F-SUP',
  typologyName = 'Janela de Correr 2 Folhas Suprema',
  initialWidth = 1500,
  initialHeight = 1200,
}) => {
  const [widthMm, setWidthMm] = useState<number>(initialWidth);
  const [heightMm, setHeightMm] = useState<number>(initialHeight);
  
  // Cálculo teórico da diagonal pela hipotenusa: sqrt(w^2 + h^2)
  const theoreticalDiag = Math.round(Math.sqrt(widthMm * widthMm + heightMm * heightMm) * 10) / 10;
  const [diag1Mm, setDiag1Mm] = useState<number>(theoreticalDiag);
  const [diag2Mm, setDiag2Mm] = useState<number>(theoreticalDiag + 0.8);
  const [inspectorName, setInspectorName] = useState<string>('Carlos Eduardo (CQ Fábrica)');
  const [checklist, setChecklist] = useState<QualityCheckItem[]>(DEFAULT_QUALITY_CHECKLIST);

  const inspectionData: QualityInspectionData = useMemo(() => {
    return evaluateQualityInspection({
      orderNumber,
      clientName,
      typologyCode,
      typologyName,
      widthMm,
      heightMm,
      diagonal1Mm: diag1Mm,
      diagonal2Mm: diag2Mm,
      inspectorName,
      checklist,
    });
  }, [orderNumber, clientName, typologyCode, typologyName, widthMm, heightMm, diag1Mm, diag2Mm, inspectorName, checklist]);

  if (!isOpen) return null;

  const toggleCheckItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((it) => (it.id === id ? { ...it, passed: !it.passed } : it))
    );
  };

  const handlePrintCertificate = () => {
    const html = generateWarrantyCertificateHtml(inspectionData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              inspectionData.overallApproved
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Controle de Qualidade (CQ) & Certificado NBR 10821
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  inspectionData.overallApproved
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}>
                  {inspectionData.overallApproved ? 'QUALIDADE APROVADA' : 'PENDÊNCIA DETECTADA'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspeção dimensional de esquadro (|ΔD| ≤ 2,0 mm), testes de vedação e termo de garantia de 5 anos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintCertificate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Certificado</span>
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

        {/* Medição das Diagonais e Esquadro */}
        <div className="p-3.5 bg-slate-900 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs shrink-0 font-mono">
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Largura Vão (mm)</label>
            <input
              type="number"
              value={widthMm}
              onChange={(e) => setWidthMm(parseInt(e.target.value) || 1500)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Altura Vão (mm)</label>
            <input
              type="number"
              value={heightMm}
              onChange={(e) => setHeightMm(parseInt(e.target.value) || 1200)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Diagonal 1 (D1 mm)</label>
            <input
              type="number"
              step="0.1"
              value={diag1Mm}
              onChange={(e) => setDiag1Mm(parseFloat(e.target.value) || theoreticalDiag)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans">Diagonal 2 (D2 mm)</label>
            <input
              type="number"
              step="0.1"
              value={diag2Mm}
              onChange={(e) => setDiag2Mm(parseFloat(e.target.value) || theoreticalDiag)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold"
            />
          </div>
        </div>

        {/* Avaliação do Esquadro */}
        <div className={`p-3 border-b flex items-center justify-between text-xs shrink-0 font-mono ${
          inspectionData.isSquareApproved
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            : 'bg-rose-950/40 border-rose-800 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {inspectionData.isSquareApproved ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>
              <b>Esquadro NBR 10821:</b> |D1 - D2| = <b>{inspectionData.diagonalDifferenceMm} mm</b>
              {inspectionData.isSquareApproved ? ' (Dentro do limite de 2,0 mm)' : ' (EXCEDE limite de 2,0 mm! Reposicione cantoneiras)'}
            </span>
          </div>

          <span className="text-[11px] font-sans">
            Auditor: <b>{inspectionData.inspectorName}</b>
          </span>
        </div>

        {/* Checklist de Bancada */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          <span className="text-xs font-bold text-slate-300 block">
            Checklist de Liberação de Bancada (Clique para alternar Conforme/Não Conforme):
          </span>

          <div className="space-y-2">
            {inspectionData.checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheckItem(item.id)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  item.passed
                    ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    : 'bg-rose-950/20 border-rose-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    item.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {item.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{item.label}</span>
                    <span className="text-[11px] text-slate-400 block">{item.toleranceLimit}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-mono font-bold ${item.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.passed ? 'CONFORME' : 'NÃO CONFORME'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{item.notes}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Garantia AFEAL */}
          <div className="bg-amber-950/30 p-3.5 rounded-xl border border-amber-800/60 flex items-start gap-3 text-xs text-amber-200">
            <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-300">Termo de Garantia Estendida de 5 Anos:</span>
              <p className="text-[11px] text-amber-200/80 mt-0.5 font-sans leading-relaxed">
                Ao imprimir o laudo, o cliente recebe o Certificado de Garantia oficial com recomendações de limpeza sem produtos abrasivos e manutenção preventiva das roldanas.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 text-[11px]">
            Conformidade assegurada pelo departamento técnico Sanches & Marques Esquadrias.
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
