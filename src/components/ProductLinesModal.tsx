import React, { useState } from 'react';
import { ProductLineConfig, OpeningType } from '../types';
import {
  OPENING_TYPES_LIST,
  saveProductLinesConfig,
  resetProductLinesConfig,
} from '../utils/productLinesConfig';
import {
  Layers,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  RotateCcw,
  X,
  Sliders,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface ProductLinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  productLines: ProductLineConfig[];
  onUpdateLines: (newLines: ProductLineConfig[]) => void;
  onToast: (msg: string) => void;
}

export const ProductLinesModal: React.FC<ProductLinesModalProps> = ({
  isOpen,
  onClose,
  productLines,
  onUpdateLines,
  onToast,
}) => {
  const [lines, setLines] = useState<ProductLineConfig[]>(productLines);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newLineName, setNewLineName] = useState<string>('');
  const [newLineThickness, setNewLineThickness] = useState<number>(30);
  const [newLineDesc, setNewLineDesc] = useState<string>('');
  const [newLineOpenings, setNewLineOpenings] = useState<OpeningType[]>([
    'janela_correr',
    'maximar',
    'porta_correr',
  ]);

  if (!isOpen) return null;

  const handleToggleOpening = (lineId: string, opening: OpeningType) => {
    const updated = lines.map((l) => {
      if (l.id !== lineId) return l;
      const exists = l.allowedOpenings.includes(opening);
      const newOpenings = exists
        ? l.allowedOpenings.filter((o) => o !== opening)
        : [...l.allowedOpenings, opening];
      return { ...l, allowedOpenings: newOpenings };
    });
    setLines(updated);
    saveProductLinesConfig(updated);
    onUpdateLines(updated);
  };

  const handleAddNewLine = () => {
    if (!newLineName.trim()) {
      onToast('Informe o nome da nova linha de produtos.');
      return;
    }
    const newLine: ProductLineConfig = {
      id: `line_custom_${Date.now()}`,
      name: newLineName.trim(),
      nominalThicknessMm: Number(newLineThickness) || 25,
      categoryBadge: `Linha ${newLineThickness}mm Personalizada`,
      description:
        newLineDesc.trim() ||
        `Linha de produtos personalizada para esquadrias de ${newLineThickness}mm.`,
      allowedOpenings: newLineOpenings,
      isCustom: true,
    };
    const updated = [...lines, newLine];
    setLines(updated);
    saveProductLinesConfig(updated);
    onUpdateLines(updated);
    setIsAddingNew(false);
    setNewLineName('');
    setNewLineDesc('');
    onToast(`✔ Linha "${newLine.name}" adicionada com sucesso!`);
  };

  const handleDeleteLine = (id: string, name: string) => {
    if (confirm(`Deseja remover a linha de produto "${name}"?`)) {
      const updated = lines.filter((l) => l.id !== id);
      setLines(updated);
      saveProductLinesConfig(updated);
      onUpdateLines(updated);
      onToast(`Linha "${name}" removida.`);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Restaurar as linhas de produtos para as configurações padrão de fábrica (Suprema, Gold, Linha 25, etc.)?')) {
      const defs = resetProductLinesConfig();
      setLines(defs);
      onUpdateLines(defs);
      onToast('✔ Configurações de linhas restauradas ao padrão de fábrica.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Utilitário de Linhas de Produtos & Aberturas Permitidas</span>
              </h2>
              <p className="text-xs text-slate-400">
                Pré-configure 'Suprema', 'Gold', etc., e defina quais aberturas (janela, maxim-ar, porta, basculante) são permitidas em cada linha para agilizar orçamentos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              title="Restaurar linhas de fábrica"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Restaurar Padrões</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo com Lista de Linhas */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Botão Adicionar Nova Linha */}
          {!isAddingNew ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-300">
                Você pode criar novas linhas de alumínio (ex: <b>Linha Euro 45</b>, <b>Linha Imperial</b>) ou editar as existentes abaixo.
              </div>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Nova Linha de Alumínio</span>
              </button>
            </div>
          ) : (
            /* Formulário de Criação de Nova Linha */
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Cadastrar Nova Linha de Produto
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">Nome da Linha *</label>
                  <input
                    type="text"
                    placeholder="Ex: Linha Elegance 45, Linha Euro, etc."
                    value={newLineName}
                    onChange={(e) => setNewLineName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Espessura Nominal (mm)</label>
                  <input
                    type="number"
                    value={newLineThickness}
                    onChange={(e) => setNewLineThickness(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Descrição Técnica / Aplicação</label>
                <input
                  type="text"
                  placeholder="Ex: Linha reforçada com câmara europeia para esquadrias acústicas de alto padrão."
                  value={newLineDesc}
                  onChange={(e) => setNewLineDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">
                  Tipos de Abertura Permitidos nesta Nova Linha:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {OPENING_TYPES_LIST.map((op) => {
                    const checked = newLineOpenings.includes(op.id);
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => {
                          if (checked) {
                            setNewLineOpenings(newLineOpenings.filter((o) => o !== op.id));
                          } else {
                            setNewLineOpenings([...newLineOpenings, op.id]);
                          }
                        }}
                        className={`p-2 rounded-lg border text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                          checked
                            ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="truncate">{op.shortLabel}</span>
                        {checked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddNewLine}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Salvar Nova Linha
                </button>
              </div>
            </div>
          )}

          {/* Cards das Linhas Existentes */}
          <div className="space-y-3">
            {lines.map((line) => {
              const activeCount = line.allowedOpenings.length;

              return (
                <div
                  key={line.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  {/* Cabeçalho da Linha */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400 font-black text-xs">
                        {line.nominalThicknessMm}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">
                            Linha {line.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                            {line.categoryBadge || `${line.nominalThicknessMm} mm`}
                          </span>
                          {line.isCustom && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{line.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[11px] font-mono px-2 py-0.8 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        <b>{activeCount}</b> aberturas ativas
                      </span>
                      {line.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLine(line.id, line.name)}
                          title="Excluir esta linha personalizada"
                          className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-950 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Matriz de Tipos de Abertura Permitidos */}
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-2">
                      Tipos de Abertura Permitidos no Orçamento para a Linha {line.name}:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {OPENING_TYPES_LIST.map((op) => {
                        const isAllowed = line.allowedOpenings.includes(op.id);
                        return (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() => handleToggleOpening(line.id, op.id)}
                            className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                              isAllowed
                                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                                : 'bg-slate-900/60 border-slate-850 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-mono">{op.defaultOpeningIcon}</span>
                              {isAllowed ? (
                                <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-[11px] leading-tight">
                                {op.shortLabel}
                              </div>
                              <span
                                className={`text-[9px] block mt-1 font-mono uppercase font-semibold ${
                                  isAllowed ? 'text-cyan-400' : 'text-slate-600'
                                }`}
                              >
                                {isAllowed ? 'Permitido' : 'Bloqueado'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            As alterações são salvas automaticamente e refletem imediatamente no fluxo do orçamento.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-cyan-500/20"
          >
            Concluir & Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
