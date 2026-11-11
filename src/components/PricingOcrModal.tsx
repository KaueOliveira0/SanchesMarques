import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
  FileText,
  DollarSign,
  Palette,
  Clipboard,
  Check,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  OcrPricingMatrixResult,
  OcrPricingMatrixRow,
  buildPricingMatrix,
  applyPricingMatrix,
  applyColorMultipliersUpdate,
  SAMPLE_OCR_DATASETS,
} from '../utils/pricingOcrParser';
import { saveProfilesCustomPrices, saveColorMultipliers } from '../utils/pricingCatalog';

interface PricingOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const PricingOcrModal: React.FC<PricingOcrModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    customProfiles,
    setCustomProfiles,
    colorMultipliers,
    setColorMultipliers,
  } = useApp();

  // Abas de entrada: 'image' | 'text' | 'samples'
  const [activeInputTab, setActiveInputTab] = useState<'image' | 'text' | 'samples'>('image');

  // Estados de upload e captura
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [supplierHint, setSupplierHint] = useState<string>('');

  // Estados de processamento
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resultado da matriz OCR
  const [ocrResult, setOcrResult] = useState<OcrPricingMatrixResult | null>(null);
  const [editableRows, setEditableRows] = useState<OcrPricingMatrixRow[]>([]);
  const [updateMultipliers, setUpdateMultipliers] = useState<boolean>(true);
  const [addNewProfiles, setAddNewProfiles] = useState<boolean>(true);

  // Filtros na visualização da matriz
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [seriesFilter, setSeriesFilter] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Escuta evento de Colar (Ctrl+V) de imagens enquanto o modal estiver aberto
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Ignora se estiver digitando em campo de texto
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleImageSelected(file);
            setActiveInputTab('image');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Processa arquivo de imagem selecionado
  const handleImageSelected = (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Carrega exemplo pronto de extrusora nacional
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_OCR_DATASETS.find((s) => s.id === sampleId);
    if (!sample) return;

    setSupplierHint(sample.supplier);
    const matrix = buildPricingMatrix(
      sample.items,
      customProfiles,
      sample.colorMultipliers,
      sample.supplier
    );
    setOcrResult(matrix);
    setEditableRows(matrix.rows);
    setErrorMessage(null);
  };

  // Executa o envio para o endpoint do Gemini 3.8 Flash Vision
  const handleRunOcr = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStep('Preparando documento de tabela para análise multimodal...');

    try {
      let imageBase64: string | undefined = undefined;
      let mimeType: string | undefined = undefined;

      if (imagePreview && imagePreview.includes('base64,')) {
        const parts = imagePreview.split('base64,');
        imageBase64 = parts[1];
        const mimeMatch = imagePreview.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64/);
        mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      }

      setProcessingStep('Consultando Gemini 3.8 Flash Vision (Extração estruturada de perfis e R$/kg)...');

      const response = await fetch('/api/pricing/ocr-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          rawText: rawText.trim() || undefined,
          supplierHint: supplierHint.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro desconhecido na leitura OCR.');
      }

      setProcessingStep('Cruzando dados detectados com o catálogo dinâmico de esquadrias...');

      const detectedItems = data.items || [];
      const supplier = data.supplier || supplierHint || 'Extrusora / Distribuidora';
      const matrix = buildPricingMatrix(detectedItems, customProfiles, data.colorMultipliers, supplier);

      setOcrResult(matrix);
      setEditableRows(matrix.rows);
    } catch (err) {
      console.error('Erro na leitura OCR:', err);
      setErrorMessage((err as Error).message);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Alterna seleção individual de item
  const handleToggleRow = (rowId: string) => {
    setEditableRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, selected: !r.selected } : r))
    );
  };

  // Alterna selecionar todos
  const handleToggleAll = (select: boolean) => {
    setEditableRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  // Atualização direta do preço por kg detectado
  const handlePriceChange = (rowId: string, newPrice: number) => {
    setEditableRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const current = r.currentPricePerKg;
        const priceDiff = current !== null ? Number((newPrice - current).toFixed(2)) : 0;
        const variancePct =
          current && current > 0 ? Number((((newPrice - current) / current) * 100).toFixed(1)) : 0;
        const barPrice6m = Number((newPrice * r.kgm * 6).toFixed(2));
        return {
          ...r,
          detectedPricePerKg: newPrice,
          priceDiff,
          variancePct,
          barPrice6m,
        };
      })
    );
  };

  // Aplica a matriz de preços selecionada no sistema
  const handleApplyPricing = () => {
    const selectedRows = editableRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      setErrorMessage('Selecione ao menos um perfil para aplicar os preços.');
      return;
    }

    const { updatedProfiles, updatedCount, addedCount } = applyPricingMatrix(
      customProfiles,
      selectedRows,
      { addNewProfiles }
    );

    // Salva perfis atualizados no estado e localStorage
    setCustomProfiles(updatedProfiles);
    saveProfilesCustomPrices(updatedProfiles);

    // Atualiza multiplicadores de acabamento se ativado
    let multipliersMsg = '';
    if (updateMultipliers && ocrResult?.colorMultipliers) {
      const updatedMultipliers = applyColorMultipliersUpdate(
        colorMultipliers,
        ocrResult.colorMultipliers
      );
      setColorMultipliers(updatedMultipliers);
      saveColorMultipliers(updatedMultipliers);
      multipliersMsg = ' e multiplicadores de cor';
    }

    onSuccess(
      `Tabela Dinâmica atualizada com sucesso! ${updatedCount} perfis atualizados, ${addedCount} novos perfis cadastrados${multipliersMsg}.`
    );
    onClose();
  };

  // Filtragem da lista
  const filteredRows = editableRows.filter((row) => {
    const matchesSearch =
      searchTerm === '' ||
      row.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeries = seriesFilter === 'ALL' || row.series === seriesFilter;
    return matchesSearch && matchesSeries;
  });

  const availableSeries = Array.from(new Set(editableRows.map((r) => r.series).filter(Boolean)));
  const selectedCount = editableRows.filter((r) => r.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Leitura OCR de Tabelas de Preços de Alumínio
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Gemini 3.8 Flash Vision
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Selecione ou cole prints de tabelas (Belmetal, Hydro, Alcoa, CBA) e converta em matriz para a Tabela Dinâmica.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs">
          {/* Alertas de erro */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold text-sm">Atenção no processamento</p>
                <p className="text-xs text-rose-200/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Se ainda não processou uma matriz ou quer mudar a imagem */}
          {!ocrResult ? (
            <div className="space-y-5">
              {/* Abas de Entrada */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveInputTab('image')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    activeInputTab === 'image'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Print / Imagem da Tabela</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInputTab('text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    activeInputTab === 'text'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Texto / CSV Colado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInputTab('samples')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    activeInputTab === 'samples'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Exemplos de Extrusoras (Teste Rápido)</span>
                </button>
              </div>

              {/* Aba Imagem */}
              {activeInputTab === 'image' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                      imagePreview
                        ? 'border-emerald-500/50 bg-emerald-950/10'
                        : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-slate-900/60'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageSelected(file);
                      }}
                    />

                    {imagePreview ? (
                      <div className="space-y-3 max-w-md w-full">
                        <div className="relative rounded-2xl overflow-hidden border border-slate-700 max-h-60 mx-auto shadow-lg bg-black">
                          <img
                            src={imagePreview}
                            alt="Pré-visualização do print"
                            className="w-full h-auto object-contain max-h-60"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="truncate max-w-[200px] font-mono">{selectedFile?.name || 'Imagem colada'}</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Pronto para OCR
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-emerald-400">
                          <Upload className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white">
                            Arraste ou clique para selecionar a imagem da tabela
                          </p>
                          <p className="text-xs text-slate-400">
                            Suporta prints capturados da tela (Windows Snipping Tool, Mac) ou fotos nítidas de catálogos.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-medium">
                          <Clipboard className="w-3.5 h-3.5" />
                          <span>Dica: Você pode simplesmente dar <strong>Ctrl + V</strong> em qualquer lugar aqui!</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Nome do Fornecedor / Extrusora (Opcional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Extrusora / Distribuidora (Opcional):
                      </label>
                      <input
                        type="text"
                        value={supplierHint}
                        onChange={(e) => setSupplierHint(e.target.value)}
                        placeholder="Ex: Belmetal, Hydro, Alcoa, Miranda, Perfil Alumínio..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Aba Texto / CSV Colado */}
              {activeInputTab === 'text' && (
                <div className="space-y-3">
                  <label className="block text-slate-400 font-bold">
                    Cole as linhas da tabela de preços (com código, peso kg/m e valor R$):
                  </label>
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Exemplo:\nSU-001 | Trilho Superior 2 Planos | 0.684 kg/m | R$ 38,50\nGL-002 | Marco Inferior Gold | 1.280 kg/m | R$ 37,80\nBranco: 1.12 | Preto: 1.15 | Amadeirado: 1.45`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none leading-relaxed"
                  />
                </div>
              )}

              {/* Aba Exemplos Prontos */}
              {activeInputTab === 'samples' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SAMPLE_OCR_DATASETS.map((sample) => (
                    <div
                      key={sample.id}
                      onClick={() => handleLoadSample(sample.id)}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                          {sample.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
                          {sample.items.length} Perfis
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs">{sample.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                        <span>Fornecedor: <strong className="text-slate-300">{sample.supplier}</strong></span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Carregar Exemplo →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão de Disparo OCR */}
              {activeInputTab !== 'samples' && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={isProcessing || (!imagePreview && !rawText.trim())}
                    onClick={handleRunOcr}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl cursor-pointer ${
                      isProcessing || (!imagePreview && !rawText.trim())
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40 hover:scale-[1.02]'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                        <span>Processando com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Escanear Tabela & Gerar Matriz</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Visualização da Matriz Extraída & Comparador */
            <div className="space-y-5">
              {/* Barra de Resumo da Extrusora */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{ocrResult.supplier}</span>
                    {ocrResult.effectiveDate && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        Vigência: {ocrResult.effectiveDate}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {ocrResult.summary.totalDetected} perfis identificados no documento ({ocrResult.summary.matchedCount} no catálogo, {ocrResult.summary.newCount} novos)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Preço Médio Detectado */}
                  <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Média Detectada</span>
                    <span className="text-sm font-mono font-black text-white">
                      R$ {ocrResult.summary.avgDetectedPricePerKg.toFixed(2)}/kg
                    </span>
                  </div>

                  {/* Variação Média */}
                  <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Variação Média</span>
                    <span
                      className={`text-sm font-mono font-black flex items-center justify-end gap-0.5 ${
                        ocrResult.summary.avgVariancePct > 0
                          ? 'text-amber-400'
                          : ocrResult.summary.avgVariancePct < 0
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {ocrResult.summary.avgVariancePct > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-amber-400" />
                      ) : ocrResult.summary.avgVariancePct < 0 ? (
                        <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                      {ocrResult.summary.avgVariancePct > 0 ? '+' : ''}
                      {ocrResult.summary.avgVariancePct}%
                    </span>
                  </div>

                  {/* Botão de Re-escanear */}
                  <button
                    type="button"
                    onClick={() => {
                      setOcrResult(null);
                      setEditableRows([]);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Outro Print</span>
                  </button>
                </div>
              </div>

              {/* Seção de Multiplicadores Detectados */}
              {ocrResult.colorMultipliers && Object.keys(ocrResult.colorMultipliers).length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-white text-xs">
                        Multiplicadores por Acabamento Detectados no Print
                      </span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                      <input
                        type="checkbox"
                        checked={updateMultipliers}
                        onChange={(e) => setUpdateMultipliers(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Atualizar multiplicadores do sistema com estes valores</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                    {Object.entries(ocrResult.colorMultipliers).map(([clr, mult]) => (
                      <div key={clr} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[11px] text-slate-400 font-sans block">{clr}</span>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-amber-400 font-black">{mult.toFixed(2)}x</span>
                          <span className="text-[10px] text-slate-500">
                            Atual: {colorMultipliers[clr]?.toFixed(2) ?? '1.00'}x
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controles da Tabela: Pesquisa, Filtro de Linha e Seleção */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filtrar por código ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-sans"
                    />
                  </div>

                  {availableSeries.length > 1 && (
                    <select
                      value={seriesFilter}
                      onChange={(e) => setSeriesFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                    >
                      <option value="ALL">Todas as Linhas ({availableSeries.length})</option>
                      {availableSeries.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAll(true)}
                    className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
                  >
                    Marcar Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAll(false)}
                    className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
                  >
                    Desmarcar
                  </button>
                  <span className="text-slate-500 text-[11px]">|</span>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addNewProfiles}
                      onChange={(e) => setAddNewProfiles(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500"
                    />
                    <span>Cadastrar novos perfis não encontrados</span>
                  </label>
                </div>
              </div>

              {/* Tabela Comparativa de Preços */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider sticky top-0 z-10 font-sans">
                      <tr>
                        <th className="p-3 w-8">
                          <input
                            type="checkbox"
                            checked={filteredRows.length > 0 && filteredRows.every((r) => r.selected)}
                            onChange={(e) => handleToggleAll(e.target.checked)}
                            className="rounded border-slate-700 text-emerald-500"
                          />
                        </th>
                        <th className="p-3">Código & Linha</th>
                        <th className="p-3">Descrição da Peça</th>
                        <th className="p-3 text-right">Peso (kg/m)</th>
                        <th className="p-3 text-right">Preço Atual</th>
                        <th className="p-3 text-right">Preço Detectado</th>
                        <th className="p-3 text-right">Variação</th>
                        <th className="p-3 text-right">Barra 6m</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-900/60 transition-colors ${
                            row.selected ? 'bg-slate-950' : 'opacity-40 bg-slate-950/40'
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() => handleToggleRow(row.id)}
                              className="rounded border-slate-700 text-emerald-500 cursor-pointer"
                            />
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-amber-400">{row.code}</span>
                              <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                {row.series}
                              </span>
                            </div>
                          </td>

                          <td className="p-3 font-sans max-w-[200px] truncate text-slate-300">
                            {row.name}
                          </td>

                          <td className="p-3 text-right text-slate-400">
                            {row.kgm.toFixed(3)}
                          </td>

                          <td className="p-3 text-right text-slate-400">
                            {row.currentPricePerKg !== null
                              ? `R$ ${row.currentPricePerKg.toFixed(2)}`
                              : <span className="text-slate-600">—</span>}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-slate-500">R$</span>
                              <input
                                type="number"
                                step="0.5"
                                value={row.detectedPricePerKg}
                                onChange={(e) =>
                                  handlePriceChange(row.id, parseFloat(e.target.value) || 0)
                                }
                                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white font-bold text-right focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            {row.currentPricePerKg !== null ? (
                              <span
                                className={`font-bold inline-flex items-center gap-0.5 ${
                                  row.variancePct > 0
                                    ? 'text-rose-400'
                                    : row.variancePct < 0
                                    ? 'text-emerald-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {row.variancePct > 0 ? '+' : ''}
                                {row.variancePct}%
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-sans text-[11px]">Novo</span>
                            )}
                          </td>

                          <td className="p-3 text-right text-slate-300 font-bold">
                            R$ {row.barPrice6m.toFixed(2)}
                          </td>

                          <td className="p-3 text-center">
                            {row.isNewProfile ? (
                              <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                Novo Perfil
                              </span>
                            ) : (
                              <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Atualização
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-20">
          <div className="text-xs text-slate-400">
            {ocrResult && (
              <span>
                <strong className="text-white">{selectedCount}</strong> de {editableRows.length} perfis selecionados para atualização.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer text-xs"
            >
              Fechar
            </button>

            {ocrResult && (
              <button
                type="button"
                onClick={handleApplyPricing}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-950/40 cursor-pointer text-xs uppercase tracking-wider"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Aplicar {selectedCount} Preços na Tabela Dinâmica</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
