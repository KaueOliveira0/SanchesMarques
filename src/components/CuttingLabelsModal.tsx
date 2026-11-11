import React, { useState, useMemo } from 'react';
import { CutPiece } from '../types';
import {
  createLabelsFromCutPieces,
  generatePrintableLabelsHtml,
  ProductionLabel,
} from '../utils/barcodeLabels';
import {
  X,
  Barcode,
  Printer,
  Tag,
  CheckCircle2,
  Copy,
  Layers,
} from 'lucide-react';

interface CuttingLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pieces?: CutPiece[];
  orderNumber?: number;
  clientName?: string;
}

export const CuttingLabelsModal: React.FC<CuttingLabelsModalProps> = ({
  isOpen,
  onClose,
  pieces = [],
  orderNumber = 101,
  clientName = 'Cliente',
}) => {
  const [layout, setLayout] = useState<'termica_100x50' | 'a4_adesivo'>('termica_100x50');
  const [selectedProfileFilter, setSelectedProfileFilter] = useState<string>('TODOS');

  const allLabels = useMemo(() => {
    return createLabelsFromCutPieces(pieces, clientName);
  }, [pieces, clientName]);

  const uniqueProfiles = useMemo(() => {
    const set = new Set<string>();
    pieces.forEach((p) => set.add(p.profileCode));
    return ['TODOS', ...Array.from(set)];
  }, [pieces]);

  const filteredLabels = useMemo(() => {
    if (selectedProfileFilter === 'TODOS') return allLabels;
    return allLabels.filter((l) => l.profileCode === selectedProfileFilter);
  }, [allLabels, selectedProfileFilter]);

  if (!isOpen) return null;

  const handlePrintLabels = () => {
    const html = generatePrintableLabelsHtml(filteredLabels, layout);
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Etiquetas Industriais de Corte com Código de Barras
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  OP #{orderNumber} - {clientName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rastreabilidade de cada perfil cortado: ambiente, código da barra, comprimento exato e ângulos 45°/90°.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintLabels}
              disabled={filteredLabels.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-amber-900/30 disabled:opacity-40"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir {filteredLabels.length} Etiqueta(s)</span>
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

        {/* Barra de Filtros e Layout */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-sans">Perfil:</span>
            <select
              value={selectedProfileFilter}
              onChange={(e) => setSelectedProfileFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 font-bold"
            >
              {uniqueProfiles.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-sans">Formato:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setLayout('termica_100x50')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  layout === 'termica_100x50'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Térmica 100 × 50 mm (Zebra/Argox)
              </button>
              <button
                type="button"
                onClick={() => setLayout('a4_adesivo')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  layout === 'a4_adesivo'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Folha A4 Adesiva Pimaco
              </button>
            </div>
          </div>
        </div>

        {/* Grade de Preview das Etiquetas */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredLabels.map((lbl) => (
              <div
                key={lbl.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-all font-mono"
              >
                <div>
                  <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-slate-800 text-slate-400">
                    <span className="font-bold text-white">SANCHES &amp; MARQUES</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                      OP #{lbl.orderNumber}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline my-2">
                    <div>
                      <span className="text-base font-black text-cyan-400">{lbl.profileCode}</span>
                      <span className="text-[10px] text-slate-400 block font-sans truncate max-w-[130px]">
                        {lbl.profileName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-white">{lbl.lengthMm} mm</span>
                      <span className="text-[10px] text-slate-400 block">{lbl.angles}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-900 font-sans">
                    <span>Cor: <b>{lbl.color}</b></span>
                    <span>Destino: <b>{lbl.itemTag}</b></span>
                  </div>
                </div>

                <div
                  className="mt-2 text-center overflow-hidden bg-white p-1 rounded"
                  dangerouslySetInnerHTML={{ __html: lbl.barcodeSvg }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 text-[11px]">
            Etiquetas compatíveis com leitores de código de barras USB/Bluetooth na linha de montagem e expedição.
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
