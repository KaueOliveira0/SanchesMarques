import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import {
  calculateOrderUpselling,
  generateComparativeWhatsAppText,
  applyTierUpgradeToOrder,
  printComparativeProposalHtml,
  UpsellingTierId,
  UPSELLING_TIERS,
} from '../utils/upsellingComparator';
import { formatMoney, createWhatsAppShareUrl, sanitizeWhatsAppPhone } from '../utils/whatsappProposal';
import {
  X,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Check,
  Copy,
  MessageCircle,
  Printer,
  ChevronRight,
  ArrowUpRight,
  Layers,
  Wind,
  VolumeX,
  Gauge,
  Sliders,
  Award,
  CheckCircle2,
} from 'lucide-react';

interface UpsellingSimulatorModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpgraded?: (newOrder: Order) => void;
}

export const UpsellingSimulatorModal: React.FC<UpsellingSimulatorModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpgraded,
}) => {
  const { updateOrder } = useApp();

  const [activeTab, setActiveTab] = useState<'cards' | 'specs' | 'rooms' | 'whatsapp'>('cards');
  const [selectedRecommendedTier, setSelectedRecommendedTier] = useState<UpsellingTierId>('gold');
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(order?.clientPhone || '');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const comparison = useMemo(() => {
    if (!order) return null;
    return calculateOrderUpselling(order);
  }, [order]);

  const whatsappMessage = useMemo(() => {
    if (!comparison) return '';
    return generateComparativeWhatsAppText(comparison, selectedRecommendedTier);
  }, [comparison, selectedRecommendedTier]);

  const shareUrl = useMemo(() => {
    return createWhatsAppShareUrl(phone, whatsappMessage);
  }, [phone, whatsappMessage]);

  if (!isOpen || !order || !comparison) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopyWhatsApp = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(whatsappMessage);
      } else {
        const el = document.createElement('textarea');
        el.value = whatsappMessage;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch {
      // fallback
    } finally {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleApplyUpgrade = (targetTierId: UpsellingTierId) => {
    const updated = applyTierUpgradeToOrder(order, targetTierId);
    updateOrder(updated);
    if (onOrderUpgraded) {
      onOrderUpgraded(updated);
    }
    showToast(`Upgrade para ${UPSELLING_TIERS[targetTierId].name} aplicado com sucesso na OP #${order.number}!`);
  };

  const currentTierId = comparison.currentTierId;
  const tSuprema = comparison.tiers.suprema;
  const tGold = comparison.tiers.gold;
  const tMini = comparison.tiers.minimalista;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-400 text-sm">OP #{order.number}</span>
                <h2 className="text-base font-bold text-white leading-tight">
                  Simulador de Up-selling 3 Níveis
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  Suprema ➔ Gold ➔ Minimalista
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cliente: <span className="text-slate-200 font-medium">{order.clientName}</span> • Acabamento: <span className="text-slate-200 font-medium">{order.color}</span> • Linha atual: <span className="text-amber-300 font-semibold uppercase">{UPSELLING_TIERS[currentTierId].seriesName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printComparativeProposalHtml(comparison)}
              title="Imprimir Proposta Comparativa 3 Níveis em PDF"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Imprimir Estudo PDF</span>
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

        {/* Toast Feedback */}
        {toastMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-800/80 text-emerald-300 px-4 py-2 text-xs flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {toastMsg}
            </span>
            <button onClick={() => setToastMsg(null)} className="text-emerald-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* ROI Sales Pitch Banner */}
        <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border-b border-amber-500/20 px-4 py-3 shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-300 uppercase tracking-wide mr-1.5">Estratégia Comercial:</span>
              <span className="text-slate-300">
                Por apenas <strong className="text-white">+{formatMoney(tGold.monthlyDiffFromBaseline10x)}/mês</strong> na parcela em 10x, você faz o up-selling para a <strong className="text-amber-400">Linha Gold (+42% alumínio, trilho inox macio e +7 dB de silêncio)</strong>.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Gerar Proposta WhatsApp</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950/50 border-b border-slate-800 px-4 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cards'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Comparativo Lado a Lado (3 Níveis)
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'specs'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Matriz Técnica de Engenharia
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'rooms'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Detalhamento por Vão ({order.items.length})
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            4. WhatsApp &amp; Proposta Pronta
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {/* TAB 1: 3 CARDS SIDE BY SIDE */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. SUPREMA */}
                <div
                  className={`relative rounded-xl border flex flex-col justify-between p-4 transition-all ${
                    currentTierId === 'suprema'
                      ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {tSuprema.tier.badge}
                      </span>
                      {currentTierId === 'suprema' && (
                        <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Linha Atual
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-white">{tSuprema.tier.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 min-h-[32px]">{tSuprema.tier.tagline}</p>

                    {/* Preço e Parcelas */}
                    <div className="my-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Valor Total</div>
                      <div className="text-2xl font-black text-white font-mono mt-0.5">
                        {formatMoney(tSuprema.totalPrice)}
                      </div>
                      <div className="text-xs font-bold text-cyan-400 mt-1">
                        10x de {formatMoney(tSuprema.installments10x)} sem juros
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        ou entrada de {formatMoney(tSuprema.downpaymentAndSplit.downpayment50)} + 3x
                      </div>
                    </div>

                    {/* Ficha Rápida */}
                    <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-400" /> Profundidade:
                        </span>
                        <span className="font-semibold text-white">25 mm</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" /> Peso Estrutural:
                        </span>
                        <span className="font-semibold text-white font-mono">{tSuprema.totalWeightKg.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-slate-400" /> Pressão Vento:
                        </span>
                        <span className="font-semibold text-white">1.050 Pa (Classe 2)</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <VolumeX className="w-3.5 h-3.5 text-slate-400" /> Isolamento Acústico:
                        </span>
                        <span className="font-semibold text-white">25 dB (4 a 6mm)</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-slate-400" /> Garantia:
                        </span>
                        <span className="font-semibold text-white">3 anos</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    {currentTierId === 'suprema' ? (
                      <button
                        disabled
                        className="w-full py-2 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold cursor-default text-center"
                      >
                        OP já orçada nesta linha
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyUpgrade('suprema')}
                        className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                      >
                        Recalcular para Suprema
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. GOLD (FEATURED / BEST SELLER) */}
                <div
                  className={`relative rounded-xl border-2 flex flex-col justify-between p-4 transition-all shadow-xl ${
                    currentTierId === 'gold'
                      ? 'bg-amber-950/20 border-amber-400 shadow-amber-950/30'
                      : 'bg-gradient-to-b from-amber-950/30 to-slate-900 border-amber-500/70 hover:border-amber-400'
                  }`}
                >
                  <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Mais Vendida • Recomendada
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Linha 32mm Premium
                      </span>
                      {currentTierId === 'gold' && (
                        <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Linha Atual
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                      {tGold.tier.name}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 min-h-[32px]">{tGold.tier.tagline}</p>

                    {/* Preço e Parcelas */}
                    <div className="my-3 p-3 rounded-lg bg-slate-950/80 border border-amber-500/40 text-center">
                      <div className="text-[10px] uppercase font-bold text-amber-400">Valor Total do Pedido</div>
                      <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                        {formatMoney(tGold.totalPrice)}
                      </div>
                      <div className="text-xs font-bold text-emerald-400 mt-1">
                        10x de {formatMoney(tGold.installments10x)} sem juros
                      </div>
                      <div className="mt-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-300 inline-block">
                        Apenas +{formatMoney(tGold.monthlyDiffFromBaseline10x)}/mês vs Suprema
                      </div>
                    </div>

                    {/* Ficha Rápida */}
                    <div className="space-y-2 text-xs border-t border-amber-500/20 pt-3">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-400" /> Profundidade:
                        </span>
                        <span className="font-semibold text-white">32 mm (+28%)</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-amber-400" /> Peso Estrutural:
                        </span>
                        <span className="font-semibold text-amber-300 font-mono">
                          {tGold.totalWeightKg.toFixed(1)} kg (+{tGold.weightPercentDiffFromBaseline}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-amber-400" /> Pressão Vento:
                        </span>
                        <span className="font-semibold text-white">1.950 Pa (Classe 4)</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <VolumeX className="w-3.5 h-3.5 text-amber-400" /> Isolamento Acústico:
                        </span>
                        <span className="font-semibold text-emerald-300">32 dB (+7 dB / 8mm)</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Trilho Deslize:
                        </span>
                        <span className="font-semibold text-white">Aço Inox AISI 304</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-400" /> Garantia:
                        </span>
                        <span className="font-semibold text-white">5 anos</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-500/20">
                    {currentTierId === 'gold' ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 cursor-default text-center"
                      >
                        ✓ Pedido já está na Linha Gold
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyUpgrade('gold')}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-950/40 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Fazer Upgrade da OP p/ Linha Gold</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. MINIMALISTA CHROMA */}
                <div
                  className={`relative rounded-xl border flex flex-col justify-between p-4 transition-all ${
                    currentTierId === 'minimalista'
                      ? 'bg-purple-950/30 border-purple-400 shadow-lg shadow-purple-950/30'
                      : 'bg-slate-900/50 border-purple-500/40 hover:border-purple-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {tMini.tier.badge}
                      </span>
                      {currentTierId === 'minimalista' && (
                        <span className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Linha Atual
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-white">{tMini.tier.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 min-h-[32px]">{tMini.tier.tagline}</p>

                    {/* Preço e Parcelas */}
                    <div className="my-3 p-3 rounded-lg bg-slate-950 border border-purple-500/30 text-center">
                      <div className="text-[10px] uppercase font-bold text-purple-300">Valor Total</div>
                      <div className="text-2xl font-black text-white font-mono mt-0.5">
                        {formatMoney(tMini.totalPrice)}
                      </div>
                      <div className="text-xs font-bold text-purple-400 mt-1">
                        10x de {formatMoney(tMini.installments10x)} sem juros
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        +{formatMoney(tMini.monthlyDiffFromBaseline10x)}/mês vs Suprema
                      </div>
                    </div>

                    {/* Ficha Rápida */}
                    <div className="space-y-2 text-xs border-t border-purple-500/20 pt-3">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-purple-400" /> Profundidade:
                        </span>
                        <span className="font-semibold text-white">45 mm Oculto</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-purple-400" /> Peso Estrutural:
                        </span>
                        <span className="font-semibold text-purple-300 font-mono">
                          {tMini.totalWeightKg.toFixed(1)} kg (+{tMini.weightPercentDiffFromBaseline}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-purple-400" /> Pressão Vento:
                        </span>
                        <span className="font-semibold text-white">2.800 Pa (Classe 5+)</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <VolumeX className="w-3.5 h-3.5 text-purple-400" /> Isolamento Acústico:
                        </span>
                        <span className="font-semibold text-purple-300">38 dB (Termoacústico)</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Trilho Deslize:
                        </span>
                        <span className="font-semibold text-white">Piso Nível Zero</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-purple-400" /> Garantia:
                        </span>
                        <span className="font-semibold text-white">10 anos</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-purple-500/20">
                    {currentTierId === 'minimalista' ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-lg bg-purple-950 text-purple-300 text-xs font-semibold cursor-default text-center border border-purple-800"
                      >
                        ✓ Pedido já está na Linha Minimalista
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyUpgrade('minimalista')}
                        className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all border border-purple-500 shadow-md shadow-purple-950/40 cursor-pointer"
                      >
                        Fazer Upgrade p/ Minimalista Slim
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL SPECS MATRIX */}
          {activeTab === 'specs' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Matriz Técnica Comparativa de Engenharia (ABNT NBR 10821 &amp; NBR 7199)
                </span>
                <span className="text-[11px] text-slate-400">Normas Técnicas Brasileiras</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                      <th className="p-3">Critério de Desempenho</th>
                      <th className="p-3 text-slate-200">Linha Suprema (25mm)</th>
                      <th className="p-3 text-amber-400 bg-amber-950/20 font-bold">Linha Gold (32mm) ⭐</th>
                      <th className="p-3 text-purple-300">Chroma Minimalista (Slim)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Profundidade do Perfil</td>
                      <td className="p-3">25 mm</td>
                      <td className="p-3 font-bold text-amber-300 bg-amber-950/10">32 mm (+28%)</td>
                      <td className="p-3 text-purple-300">45 mm embutido</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Espessura das Paredes de Alumínio</td>
                      <td className="p-3">1.2 a 1.4 mm</td>
                      <td className="p-3 font-bold text-amber-300 bg-amber-950/10">1.6 a 2.0 mm (alta rigidez)</td>
                      <td className="p-3 text-purple-300">2.0 a 2.5 mm (alta inércia)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Resistência ao Vento (NBR 10821)</td>
                      <td className="p-3">1.050 Pa (até 130 km/h)</td>
                      <td className="p-3 font-bold text-amber-300 bg-amber-950/10">1.950 Pa (até 175 km/h)</td>
                      <td className="p-3 text-purple-300">2.800 Pa (até 215 km/h)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Isolamento Acústico Ponderado (Rw)</td>
                      <td className="p-3">25 dB</td>
                      <td className="p-3 font-bold text-emerald-400 bg-amber-950/10">32 dB (+7 dB de redução)</td>
                      <td className="p-3 text-purple-300">38 dB (Termoacústico)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Capacidade de Vidros</td>
                      <td className="p-3">Comum / Temperado 4 a 6mm</td>
                      <td className="p-3 font-bold text-amber-300 bg-amber-950/10">Laminado / Temperado 8 a 10mm</td>
                      <td className="p-3 text-purple-300">Insulados Duplos até 24mm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Trilho Inferior e Rolamento</td>
                      <td className="p-3">Trilho alumínio / Roldana nylon 30kg</td>
                      <td className="p-3 font-bold text-amber-300 bg-amber-950/10">Trilho Inox 304 / Roldana agulha 120kg</td>
                      <td className="p-3 text-purple-300">Nível Zero / Roletes blindados 250kg</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Fechos e Puxadores</td>
                      <td className="p-3">Fecho concha lateral padrão</td>
                      <td className="p-3 font-bold text-amber-300 bg-amber-950/10">Cremona multiponto + Puxador inox</td>
                      <td className="p-3 text-purple-300">Travamento magnético embutido</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">Garantia Estrutural de Fábrica</td>
                      <td className="p-3">3 Anos</td>
                      <td className="p-3 font-bold text-amber-300 bg-amber-950/10">5 Anos Garantidos</td>
                      <td className="p-3 text-purple-300">10 Anos High-End</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BREAKDOWN PER ROOM / OPENING */}
          {activeTab === 'rooms' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Comparativo de Valores por Vão da Obra ({order.items.length} itens)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Valores proporcionais por ambiente
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                      <th className="p-3">Ambiente</th>
                      <th className="p-3">Dimensões (L x A)</th>
                      <th className="p-3">Qtd</th>
                      <th className="p-3 text-slate-200">Suprema (25mm)</th>
                      <th className="p-3 text-amber-400 bg-amber-950/20 font-bold">Gold (32mm) ⭐</th>
                      <th className="p-3 text-purple-300">Minimalista Slim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {tSuprema.items.map((it, idx) => {
                      const goldIt = tGold.items[idx];
                      const miniIt = tMini.items[idx];
                      return (
                        <tr key={it.id} className="hover:bg-slate-900/40">
                          <td className="p-3">
                            <span className="font-bold text-white">{it.roomTag}</span>
                            <div className="text-[10px] text-slate-400">{it.typologyName}</div>
                          </td>
                          <td className="p-3 font-mono">
                            {it.width} x {it.height} mm
                          </td>
                          <td className="p-3 font-bold font-mono">{it.quantity} un</td>
                          <td className="p-3 font-mono">{formatMoney(it.totalPrice)}</td>
                          <td className="p-3 font-mono font-bold text-amber-400 bg-amber-950/10">
                            {formatMoney(goldIt?.totalPrice || 0)}
                          </td>
                          <td className="p-3 font-mono text-purple-300">
                            {formatMoney(miniIt?.totalPrice || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 font-bold border-t-2 border-slate-700 text-white font-mono">
                      <td colSpan={3} className="p-3 uppercase">Total Geral do Pedido</td>
                      <td className="p-3">{formatMoney(tSuprema.totalPrice)}</td>
                      <td className="p-3 text-amber-400 bg-amber-950/30 font-black">
                        {formatMoney(tGold.totalPrice)}
                      </td>
                      <td className="p-3 text-purple-300">{formatMoney(tMini.totalPrice)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP PROPOSAL GENERATOR */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      Proposta Comercial Comparativa p/ WhatsApp
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Texto estruturado com destaque para os 3 níveis, parcelamento em 10x e vantagens técnicas.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Linha em destaque:</span>
                    <select
                      value={selectedRecommendedTier}
                      onChange={(e) => setSelectedRecommendedTier(e.target.value as UpsellingTierId)}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-amber-400 font-bold"
                    >
                      <option value="gold">Linha Gold (Recomendada)</option>
                      <option value="minimalista">Linha Minimalista (Luxo)</option>
                      <option value="suprema">Linha Suprema (Custo-Benefício)</option>
                    </select>
                  </div>
                </div>

                {/* Input de telefone */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      WhatsApp do Cliente:
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Preview da Mensagem */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed border-l-4 border-l-emerald-500">
                  {whatsappMessage}
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar Texto Completo'}</span>
                  </button>

                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Abrir Conversa no WhatsApp</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            <span>Sanches &amp; Marques Pro • Estimativas baseadas em catálogo de peso e ligas de alumínio ABNT NBR 10821.</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => printComparativeProposalHtml(comparison)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Imprimir PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
