import React, { useState, useMemo } from 'react';
import {
  consolidatePurchaseOrders,
  exportPurchaseOrderCsv,
  generateExtruderWhatsAppQuote,
  createExtruderWhatsAppUrl,
  calculateVolumeNegotiation,
  filterOrdersForConsolidation,
  EXTRUDERS_DIRECTORY,
  ExtruderCompany,
  PeriodFilter,
  SupplierPurchaseOrder,
} from '../utils/purchaseOrderConsolidator';
import { printConsolidatedPurchaseOrder } from '../utils/pdfPrint';
import { useApp } from '../context/AppContext';
import { CutPiece, Order } from '../types';
import { extractPiecesFromOrders } from '../utils/cutOptimizer';
import {
  X,
  PackageCheck,
  Download,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Truck,
  TrendingUp,
  Percent,
  MessageCircle,
  Copy,
  Printer,
  Sparkles,
  ShieldCheck,
  Phone,
  Mail,
  ChevronRight,
  Filter,
  Check,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pieces?: CutPiece[];
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  pieces,
}) => {
  const { stockProfiles, orders } = useApp();

  // Filtros de Consolidação
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('last_30_days');
  const [includeOnlyApproved, setIncludeOnlyApproved] = useState<boolean>(true);
  const [selectedExtruderId, setSelectedExtruderId] = useState<string>('belmetal');
  const [selectedColorTab, setSelectedColorTab] = useState<string>('ALL');
  const [safetyMargin, setSafetyMargin] = useState<number>(5);
  const [excludedOrderIds, setExcludedOrderIds] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Extrusora selecionada
  const activeExtruder: ExtruderCompany = useMemo(() => {
    return EXTRUDERS_DIRECTORY.find((e) => e.id === selectedExtruderId) || EXTRUDERS_DIRECTORY[0];
  }, [selectedExtruderId]);

  // Pedidos elegíveis para consolidação
  const eligibleOrders = useMemo(() => {
    return filterOrdersForConsolidation(orders, {
      period: periodFilter,
      includeOnlyApproved,
    });
  }, [orders, periodFilter, includeOnlyApproved]);

  // Pedidos ativos após desmarcar itens individuais
  const consolidatedOrders = useMemo(() => {
    return eligibleOrders.filter((o) => !excludedOrderIds.includes(o.id));
  }, [eligibleOrders, excludedOrderIds]);

  // Peças ativas para consolidação
  const activePieces: CutPiece[] = useMemo(() => {
    if (pieces && pieces.length > 0) return pieces;
    return extractPiecesFromOrders(consolidatedOrders);
  }, [pieces, consolidatedOrders]);

  // Executa consolidação com a extrusora ativa e margem configurada
  const rawPurchaseOrders = useMemo(() => {
    return consolidatePurchaseOrders(activePieces, stockProfiles, {
      safetyMarginPercent: safetyMargin,
      extruderId: activeExtruder.id,
    });
  }, [activePieces, stockProfiles, safetyMargin, activeExtruder.id]);

  // Cores disponíveis nos lotes
  const availableColors = useMemo(() => {
    const set = new Set<string>();
    for (const ord of rawPurchaseOrders) {
      set.add(ord.color);
    }
    return Array.from(set);
  }, [rawPurchaseOrders]);

  // Lotes filtrados pela aba de cor
  const displayedOrders = useMemo(() => {
    if (selectedColorTab === 'ALL') return rawPurchaseOrders;
    return rawPurchaseOrders.filter((o) => o.color === selectedColorTab);
  }, [rawPurchaseOrders, selectedColorTab]);

  // Métricas Totais do Lote
  const totalWeightKg = useMemo(() => {
    return Math.round(rawPurchaseOrders.reduce((sum, o) => sum + o.totalWeightKg, 0) * 10) / 10;
  }, [rawPurchaseOrders]);

  const totalBars6m = useMemo(() => {
    return rawPurchaseOrders.reduce((sum, o) => sum + o.totalBars6000, 0);
  }, [rawPurchaseOrders]);

  const totalAmountR$ = useMemo(() => {
    return rawPurchaseOrders.reduce((sum, o) => sum + o.totalAmountR$, 0);
  }, [rawPurchaseOrders]);

  // Cálculo da negociação por tonelada
  const volumeNegotiation = useMemo(() => {
    return calculateVolumeNegotiation(totalWeightKg, activeExtruder);
  }, [totalWeightKg, activeExtruder]);

  if (!isOpen) return null;

  const toggleOrderInclusion = (id: string) => {
    setExcludedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDownloadCsv = () => {
    if (rawPurchaseOrders.length === 0) return;
    // Concatena ou exporta o lote da extrusora
    const combinedRows: string[] = [];
    combinedRows.push(`FORNECEDOR;CNPJ;PRAZO_ENTREGA;LIGA_ALUMINIO;PESO_TOTAL_KG;VALOR_TOTAL_RS`);
    combinedRows.push(
      `"${activeExtruder.legalName}";"${activeExtruder.cnpj}";"${activeExtruder.leadTimeDays} dias";"${activeExtruder.standardAlloy}";${totalWeightKg};${totalAmountR$.toFixed(2)}`
    );
    combinedRows.push('');
    combinedRows.push(`Codigo_Perfil;Descricao;Serie;Cor_Acabamento;Barras_6000mm;Metros_Lineares;Fardos_4x;Peso_Kg;Preco_Kg_RS;Valor_Total_RS`);

    for (const batch of rawPurchaseOrders) {
      for (const it of batch.items) {
        const totalM = (it.totalBars6000 * 6).toFixed(1);
        combinedRows.push(
          `"${it.profileCode}";"${it.profileName}";"${it.series}";"${it.color}";${it.totalBars6000};${totalM};${it.commercialBundlesCount};${it.totalWeightKg};${it.pricePerKg.toFixed(2)};${it.totalCostR$.toFixed(2)}`
        );
      }
    }

    const csvContent = combinedRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pedido_Compra_${activeExtruder.tradeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintDocument = () => {
    printConsolidatedPurchaseOrder(
      rawPurchaseOrders,
      activeExtruder,
      volumeNegotiation,
      consolidatedOrders.length
    );
  };

  const whatsAppText = generateExtruderWhatsAppQuote(
    rawPurchaseOrders,
    activeExtruder,
    volumeNegotiation,
    consolidatedOrders.length
  );

  const handleCopyQuote = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(whatsAppText);
      } else {
        const el = document.createElement('textarea');
        el.value = whatsAppText;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch {
      // Ignora erro
    } finally {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const handleSendWhatsApp = () => {
    const url = createExtruderWhatsAppUrl(activeExtruder.repContact.phone, whatsAppText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Cabeçalho do Modal */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Consolidador de Pedido de Compra de Alumínio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  EXTRUSORAS NACIONAIS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Junta os orçamentos aprovados da semana/mês e gera o pedido consolidado por código, cor e tonelada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintDocument}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              title="Imprimir espelho de compra timbrado Sanches & Marques"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Imprimir Pedido</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={rawPurchaseOrders.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
              title="Exportar planilha CSV formatada para distribuidora"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
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

        {/* Barra de Filtros: Período, Status das OPs e Margem de Segurança */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-400 mr-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-300">Período:</span>
            </div>

            <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setPeriodFilter('this_week')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                  periodFilter === 'this_week'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Esta Semana
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('this_month')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                  periodFilter === 'this_month'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Este Mês
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('last_30_days')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                  periodFilter === 'last_30_days'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Últimos 30 Dias
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                  periodFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas as OPs
              </button>
            </div>

            <label className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={includeOnlyApproved}
                onChange={(e) => setIncludeOnlyApproved(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-0"
              />
              <span className="text-[11px]">Apenas Aprovadas / Produção</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">Margem de Segurança:</span>
              <select
                value={safetyMargin}
                onChange={(e) => setSafetyMargin(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
              >
                <option value={3}>+3% (corte preciso)</option>
                <option value={5}>+5% (padrão de fábrica)</option>
                <option value={8}>+8% (margem reforçada)</option>
                <option value={10}>+10% (obras complexas)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chips de Ordens Incluídas na Consolidação */}
        {eligibleOrders.length > 0 && (
          <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-thin">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0">
              OPs Selecionadas ({consolidatedOrders.length} de {eligibleOrders.length}):
            </span>
            <div className="flex items-center gap-1.5">
              {eligibleOrders.map((ord) => {
                const isExcluded = excludedOrderIds.includes(ord.id);
                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => toggleOrderInclusion(ord.id)}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                      isExcluded
                        ? 'bg-slate-800 text-slate-500 line-through opacity-60'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                    }`}
                    title={isExcluded ? 'Clique para incluir no pedido' : 'Clique para remover do pedido'}
                  >
                    <span>OP #{ord.number}</span>
                    <span className="text-[10px] opacity-75 font-sans">({ord.clientName.slice(0, 15)})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Seletor de Extrusoras / Distribuidoras */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-thin">
          <span className="text-xs font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Extrusora:</span>
          </span>
          {EXTRUDERS_DIRECTORY.map((ext) => (
            <button
              key={ext.id}
              onClick={() => setSelectedExtruderId(ext.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedExtruderId === ext.id
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
              }`}
            >
              <span>{ext.tradeName}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/30">
                {ext.leadTimeDays}d úteis
              </span>
            </button>
          ))}
        </div>

        {/* Conteúdo Principal com Scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          
          {/* Card de Negociação por Tonelada / Escala de Volume */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Simulador de Preço por Tonelada
                  </span>
                  <span className="text-xs text-slate-400">
                    {activeExtruder.tradeName} ({activeExtruder.cnpj})
                  </span>
                </div>
                <h3 className="text-xl font-black text-white flex items-center gap-2 font-mono">
                  <span>{volumeNegotiation.totalTons.toFixed(3)} ton</span>
                  <span className="text-xs font-normal text-slate-400 font-sans">
                    ({totalWeightKg.toLocaleString('pt-BR')} kg de alumínio líquido)
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Faixa Atingida: <b className="text-emerald-400">{volumeNegotiation.currentTier.tierName}</b> • Preço:{' '}
                  <b className="text-white font-mono">R$ {volumeNegotiation.negotiatedPricePerKg.toFixed(2)}/kg</b>{' '}
                  <span className="text-emerald-400 font-bold">({volumeNegotiation.currentTier.badge})</span>
                </p>
              </div>

              {/* Economia Obtida e Preço Total */}
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shrink-0">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">VALOR NEGOCIADO</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    R$ {totalAmountR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {volumeNegotiation.totalSavingsR$ > 0 && (
                  <div className="pl-3 border-l border-slate-800">
                    <span className="text-[10px] text-emerald-400 uppercase font-mono block flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      ECONOMIA NO LOTE
                    </span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      R$ {volumeNegotiation.totalSavingsR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Alerta de Oportunidade para a Próxima Faixa de Tonelada */}
            {volumeNegotiation.nextTier && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Faltam <b>{volumeNegotiation.missingKgToNextTier} kg</b> para atingir a faixa{' '}
                    <b>{volumeNegotiation.nextTier.tierName}</b> (R$ {volumeNegotiation.nextTier.pricePerKg.toFixed(2)}/kg).
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Potencial de economia extra:{' '}
                  <strong className="text-emerald-400">
                    R$ {volumeNegotiation.potentialNextTierSavingsR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Abas de Cores / Acabamentos do Lote */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 mr-1">Filtrar Lote:</span>
              <button
                type="button"
                onClick={() => setSelectedColorTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedColorTab === 'ALL'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Todas as Cores ({rawPurchaseOrders.length} lotes)
              </button>
              {availableColors.map((color) => {
                const batch = rawPurchaseOrders.find((b) => b.color === color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColorTab(color)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedColorTab === color
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span>{color}</span>
                    <span className="text-[10px] font-mono opacity-80">
                      ({batch?.totalBars6000 || 0} brs)
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Total: <b className="text-white">{totalBars6m} barras</b> (6.000 mm) •{' '}
              <b className="text-cyan-400">{totalWeightKg} kg</b>
            </div>
          </div>

          {/* Tabelas de Perfis por Lote de Cor */}
          {displayedOrders.length > 0 ? (
            <div className="space-y-4">
              {displayedOrders.map((batch, batchIdx) => (
                <div
                  key={batchIdx}
                  className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
                >
                  {/* Cabeçalho do Lote de Cor */}
                  <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-300 shadow-sm shadow-emerald-500/50" />
                      <h4 className="text-sm font-bold text-white">
                        Lote de Acabamento: <span className="text-emerald-400">{batch.color.toUpperCase()}</span>
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">
                        ({batch.items.length} perfis distintos)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span>
                        Barras: <b className="text-white">{batch.totalBars6000} un (6m)</b>
                      </span>
                      <span>
                        Peso: <b className="text-cyan-400">{batch.totalWeightKg.toFixed(1)} kg</b>
                      </span>
                      <span>
                        Subtotal: <b className="text-amber-400">R$ {batch.totalAmountR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>
                      </span>
                    </div>
                  </div>

                  {/* Tabela dos Perfis */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Código Perfil</th>
                          <th className="py-2.5 px-3">Descrição Comercial</th>
                          <th className="py-2.5 px-3">Linha</th>
                          <th className="py-2.5 px-3 text-right">Metros Corte</th>
                          <th className="py-2.5 px-3 text-center">Barras 6m</th>
                          <th className="py-2.5 px-3 text-center">Fardos (4x)</th>
                          <th className="py-2.5 px-3 text-right">Peso Total</th>
                          <th className="py-2.5 px-3 text-right">Preço/kg</th>
                          <th className="py-2.5 px-3 text-right">Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-mono text-slate-200">
                        {batch.items.map((item, itemIdx) => (
                          <tr key={itemIdx} className="hover:bg-slate-850/40 transition-colors">
                            <td className="py-2 px-3 font-bold text-emerald-400">{item.profileCode}</td>
                            <td className="py-2 px-3 font-sans text-slate-200">{item.profileName}</td>
                            <td className="py-2 px-3 font-sans text-slate-400">{item.series}</td>
                            <td className="py-2 px-3 text-right text-slate-400">
                              {item.totalLinearMetersNeeded} m
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-white bg-slate-900/40">
                              {item.totalBars6000} brs
                            </td>
                            <td className="py-2 px-3 text-center text-slate-400">
                              {item.commercialBundlesCount} fardo(s)
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-cyan-400">
                              {item.totalWeightKg.toFixed(2)} kg
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400">
                              R$ {item.pricePerKg.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-amber-400">
                              R$ {item.totalCostR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <PackageCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">Nenhum corte ou perfil encontrado no período selecionado</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Selecione outro período (ex: "Todas as OPs") ou marque a opção de incluir orçamentos em negociação.
              </p>
            </div>
          )}

          {/* Dados de Contato e Faturamento da Distribuidora */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  {activeExtruder.legalName} • {activeExtruder.location}
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  Representante: {activeExtruder.repContact.name} • Tel: {activeExtruder.repContact.phone} • Email: {activeExtruder.repContact.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                Liga: <b>{activeExtruder.standardAlloy}</b>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                Prazo: <b>{activeExtruder.leadTimeDays} dias úteis</b>
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal com Ações Rápidas de Fechamento de Compra */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyQuote}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isCopied
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Texto de Cotação Copiado!' : 'Copiar Texto Cotação'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintDocument}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Imprimir Pedido Timbrado</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/50 transition-all cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>Enviar Cotação no WhatsApp ({activeExtruder.tradeName})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
