import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import {
  calculatePaymentPlans,
  generateWhatsAppProposalText,
  createWhatsAppShareUrl,
  sanitizeWhatsAppPhone,
  DEFAULT_PAYMENT_SETTINGS,
  PaymentSimulationSettings,
  formatMoney,
} from '../utils/whatsappProposal';
import { printCommercialProposal } from '../utils/pdfPrint';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  Printer,
  Sparkles,
  CreditCard,
  Percent,
  Calculator,
  ShieldCheck,
  Phone,
  Sliders,
  DollarSign,
  ChevronRight,
} from 'lucide-react';

interface WhatsAppProposalModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppProposalModal: React.FC<WhatsAppProposalModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  // Telefone do cliente (inicializado com o do pedido)
  const [phone, setPhone] = useState<string>(() => order.clientPhone || '');

  // Configurações do simulador de pagamento
  const [settings, setSettings] = useState<PaymentSimulationSettings>(() => ({
    ...DEFAULT_PAYMENT_SETTINGS,
    selectedPlanId: 'standard_split',
  }));

  // Feedback de cópia
  const [copied, setCopied] = useState<boolean>(false);

  // Calcula planos de pagamento com base nas configurações atuais
  const paymentPlans = useMemo(() => {
    return calculatePaymentPlans(order.finalPrice, settings);
  }, [order.finalPrice, settings]);

  const activePlan = useMemo(() => {
    return paymentPlans.find((p) => p.id === settings.selectedPlanId) || paymentPlans[1] || paymentPlans[0];
  }, [paymentPlans, settings.selectedPlanId]);

  // Gera o texto formatado para o WhatsApp
  const messageText = useMemo(() => {
    return generateWhatsAppProposalText(order, activePlan, paymentPlans);
  }, [order, activePlan, paymentPlans]);

  // URL para abrir diretamente no WhatsApp
  const shareUrl = useMemo(() => {
    return createWhatsAppShareUrl(phone, messageText);
  }, [phone, messageText]);

  const cleanPhone = sanitizeWhatsAppPhone(phone);

  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(messageText);
      } else {
        const el = document.createElement('textarea');
        el.value = messageText;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch {
      // Ignora erro em ambientes sem permissão
    } finally {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenWhatsApp = () => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Orçamento Rápido via WhatsApp &amp; Simulador
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  OP #{order.number}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cliente: <b className="text-slate-200">{order.clientName}</b> • Total: <b className="text-amber-400 font-mono">{formatMoney(order.finalPrice)}</b>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo em 2 Colunas: Simulador & Prévia WhatsApp */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0">
          {/* Coluna Esquerda: Simulador de Parcelamento & Condições */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Destinatário / Telefone */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-sans">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Telefone / WhatsApp do Cliente:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>Padrão Brasil (+55 automático)</span>
                {cleanPhone && (
                  <span className="font-mono text-emerald-400 font-semibold">
                    Destino: +{cleanPhone}
                  </span>
                )}
              </div>
            </div>

            {/* Simulador de Condições de Pagamento */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5 flex-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white font-sans">
                    Simulador de Condições de Pagamento
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">1-clique p/ mensagem</span>
              </div>

              {/* Seletor de Desconto no PIX */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">
                  Desconto para Pagamento À Vista (PIX):
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 3, 5, 7, 10].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setSettings({ ...settings, pixDiscountPercent: pct })}
                      className={`py-1 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                        settings.pixDiscountPercent === pct
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards Selecionáveis de Condição Comercial */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 block">
                  Escolha a Condição Principal para a Proposta:
                </label>

                {paymentPlans.map((plan) => {
                  const isSelected = settings.selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSettings({ ...settings, selectedPlanId: plan.id })}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-400 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                                : 'border-slate-600 bg-slate-950'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="font-bold text-white">{plan.title}</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold">
                          {formatMoney(plan.totalWithPlan)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 pl-5">
                        {plan.summaryText}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Dica de Fechamento Comercial</span>
                </div>
                <p>
                  Propostas com opções claras de parcelamento e desconto à vista fecham até <b>3.5x mais rápido</b> pelo WhatsApp com arquitetos e clientes finais.
                </p>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Prévia Visual Realista do WhatsApp */}
          <div className="lg:col-span-7 flex flex-col rounded-xl bg-[#0b141a] border border-slate-800 shadow-2xl overflow-hidden min-h-[460px]">
            {/* Barra Superior estilo WhatsApp */}
            <div className="p-3 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                  {order.clientName ? order.clientName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">{order.clientName}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {phone ? phone : 'Número não informado'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                <span>Mensagem Formatada</span>
              </div>
            </div>

            {/* Balão de Mensagem Estilo WhatsApp */}
            <div className="flex-1 p-3 overflow-y-auto bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] flex flex-col justify-end">
              <div className="self-end max-w-[95%] sm:max-w-[90%] bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-sm p-3.5 shadow-md border border-[#02735e] text-xs font-sans whitespace-pre-wrap leading-relaxed select-text">
                {messageText}

                <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-emerald-200/80">
                  <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-sky-300 font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* Barra de Ações Rápidas de Envio */}
            <div className="p-3 bg-[#111b21] border-t border-[#202c33] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    copied
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Mensagem Copiada!' : 'Copiar Texto'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => printCommercialProposal(order)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                  title="Imprimir proposta técnica timbrada"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Imprimir PDF</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/50 transition-all cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
