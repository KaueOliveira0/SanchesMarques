import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  MessageCircle,
  Copy,
  Check,
  Sliders,
  Wrench,
  ShieldCheck,
  Plus,
  Trash2,
  DollarSign,
  Info,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Layers,
  Ruler,
} from 'lucide-react';
import { Order } from '../types';
import {
  InstallationHardwareConfig,
  DEFAULT_HARDWARE_CONFIG,
  OpeningHardwareInput,
  aggregateHardwareRequirements,
  generateInstallationKitWhatsAppMessage,
  printInstallationHardwareSheet,
} from '../utils/installationHardwareCalculator';
import { SiteSurveyItem, getStoredSurveys } from '../utils/siteSurveyMeasurement';
import { sanitizeWhatsAppPhone, createWhatsAppShareUrl } from '../utils/whatsappProposal';

interface InstallationHardwareCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  initialOrderId?: string | null;
  initialSurveys?: SiteSurveyItem[];
  showToast?: (msg: string) => void;
}

export const InstallationHardwareCalculatorModal: React.FC<InstallationHardwareCalculatorModalProps> = ({
  isOpen,
  onClose,
  orders,
  initialOrderId,
  initialSurveys,
  showToast,
}) => {
  if (!isOpen) return null;

  // Seleção de ordem de produção / obra
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || orders[0]?.id || 'CUSTOM');
  const [activeSource, setActiveSource] = useState<'SURVEY' | 'ORDER' | 'CUSTOM'>(
    initialSurveys && initialSurveys.length > 0 ? 'SURVEY' : 'ORDER'
  );

  // Parâmetros técnicos e custos
  const [config, setConfig] = useState<InstallationHardwareConfig>(DEFAULT_HARDWARE_CONFIG);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);

  // Vãos customizados quando em modo avulso
  const [customOpenings, setCustomOpenings] = useState<OpeningHardwareInput[]>([
    { id: 'c1', name: 'Janela J1 - Sala', widthMm: 1500, heightMm: 1200, quantity: 1, isDoorOrFloorToCeiling: false },
    { id: 'c2', name: 'Janela J2 - Cozinha', widthMm: 1200, heightMm: 1000, quantity: 1, isDoorOrFloorToCeiling: false },
    { id: 'c3', name: 'Porta P1 - Varanda Gourmet', widthMm: 2400, heightMm: 2200, quantity: 1, isDoorOrFloorToCeiling: true },
  ]);

  // Novo vão customizado
  const [newOpeningName, setNewOpeningName] = useState('');
  const [newOpeningWidth, setNewOpeningWidth] = useState(1500);
  const [newOpeningHeight, setNewOpeningHeight] = useState(1200);
  const [newOpeningQty, setNewOpeningQty] = useState(1);
  const [newOpeningIsDoor, setNewOpeningIsDoor] = useState(false);

  // Estados de cópia
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Pedido selecionado
  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0];
  }, [orders, selectedOrderId]);

  // Vistorias salvas
  const storedSurveys = useMemo(() => {
    if (initialSurveys && initialSurveys.length > 0) return initialSurveys;
    return getStoredSurveys(orders);
  }, [initialSurveys, orders]);

  // Constrói a lista de vãos com base na fonte selecionada
  const activeOpenings = useMemo<OpeningHardwareInput[]>(() => {
    if (activeSource === 'CUSTOM') {
      return customOpenings;
    }

    if (activeSource === 'SURVEY') {
      const orderSurveys = storedSurveys.filter(
        (s) => selectedOrderId === 'ALL' || s.orderId === selectedOrderId
      );
      if (orderSurveys.length > 0) {
        return orderSurveys.map((s) => ({
          id: s.id,
          name: `${s.roomName || 'Vão'} - ${s.typologyName || 'Esquadria'}`,
          widthMm: s.deduction?.counterFrameWidthMm || s.roughOpening?.widthCenterMm || 1500,
          heightMm: s.deduction?.counterFrameHeightMm || s.roughOpening?.heightCenterMm || 1200,
          quantity: 1,
          isDoorOrFloorToCeiling: s.typologyName.toLowerCase().includes('porta') || s.typologyName.toLowerCase().includes('pivotante'),
        }));
      }
    }

    // Default: itens do orçamento selecionado
    if (selectedOrder && selectedOrder.items) {
      return selectedOrder.items.map((it) => {
        const isDoor = it.typologyName.toLowerCase().includes('porta') || it.typologyName.toLowerCase().includes('pivotante');
        return {
          id: it.id,
          name: `${it.roomTag || it.location || 'Vão'} - ${it.typologyName}`,
          widthMm: it.widthMm || it.width || 1500,
          heightMm: it.heightMm || it.height || 1200,
          quantity: it.quantity || 1,
          isDoorOrFloorToCeiling: isDoor,
        };
      });
    }

    return customOpenings;
  }, [activeSource, selectedOrderId, selectedOrder, storedSurveys, customOpenings]);

  // Executa o cálculo agregado
  const summary = useMemo(() => {
    return aggregateHardwareRequirements(activeOpenings, config);
  }, [activeOpenings, config]);

  const clientName = selectedOrder?.clientName || 'Cliente Particular';
  const opNumber = selectedOrder?.number || 1001;
  const clientAddress = selectedOrder?.clientAddress || 'Endereço da Obra';
  const clientPhone = selectedOrder?.clientPhone || '';

  const handleCopyWhatsApp = () => {
    const text = generateInstallationKitWhatsAppMessage(summary, clientName, opNumber, clientAddress);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          fallbackCopyText(text);
        });
      } else {
        fallbackCopyText(text);
      }
    } catch {
      fallbackCopyText(text);
    }
    setCopiedWhatsApp(true);
    if (showToast) showToast('Lista de insumos copiada para o WhatsApp com sucesso!');
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  function fallbackCopyText(textToCopy: string) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch {}
  }

  const handleSendDirectWhatsApp = () => {
    const text = generateInstallationKitWhatsAppMessage(summary, clientName, opNumber, clientAddress);
    const sanitized = sanitizeWhatsAppPhone(clientPhone);
    const url = createWhatsAppShareUrl(sanitized, text);
    window.open(url, '_blank');
  };

  const handleAddCustomOpening = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpeningName.trim()) return;
    const newItem: OpeningHardwareInput = {
      id: `custom_${Date.now()}`,
      name: newOpeningName.trim(),
      widthMm: Math.max(200, newOpeningWidth),
      heightMm: Math.max(200, newOpeningHeight),
      quantity: Math.max(1, newOpeningQty),
      isDoorOrFloorToCeiling: newOpeningIsDoor,
    };
    setCustomOpenings((prev) => [...prev, newItem]);
    setNewOpeningName('');
  };

  const handleRemoveCustomOpening = (id: string) => {
    setCustomOpenings((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hardware-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="hardware-modal-title" className="text-base font-bold text-white leading-tight">
                  Calculador de Insumos de Fixação & Vedação
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ABNT NBR 10821
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dimensionamento paramétrico de contramarco, selante PU 40, espuma expansiva, parafusos e fita de proteção.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConfigDrawerOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isConfigDrawerOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-900/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Ajustar espaçamento de grampos, cordão de vedação e preços"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Parâmetros & Preços</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtro de Origem e Ordem */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">Origem dos Vãos:</span>
            <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSource('ORDER')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeSource === 'ORDER'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Orçamento / OP ({selectedOrder?.items?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveSource('SURVEY')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeSource === 'SURVEY'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vistoria da Obra ({storedSurveys.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSource('CUSTOM')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeSource === 'CUSTOM'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vãos Avulsos ({customOpenings.length})
              </button>
            </div>

            {activeSource !== 'CUSTOM' && (
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-medium cursor-pointer"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    OP #{o.number} - {o.clientName} ({o.items.length} vãos)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Ações de Exportação */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWhatsApp ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
            </button>

            {clientPhone && (
              <button
                type="button"
                onClick={handleSendDirectWhatsApp}
                title={`Enviar direto para ${clientPhone}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer shadow-md shadow-emerald-950/40 active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar p/ Obra</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => printInstallationHardwareSheet(summary, clientName, opNumber, clientAddress)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Imprimir Ficha</span>
            </button>
          </div>
        </div>

        {/* Drawer de Configurações Técnicas & Preços Unitários */}
        {isConfigDrawerOpen && (
          <div className="bg-slate-950 border-b border-slate-800 p-4 space-y-4 animate-in slide-in-from-top-2 shrink-0">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Configuração de Normas & Preços dos Insumos
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConfig(DEFAULT_HARDWARE_CONFIG)}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Padrão ABNT</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block text-[11px]">Passo Grampos (mm)</label>
                <select
                  value={config.clampSpacingMm}
                  onChange={(e) => setConfig({ ...config, clampSpacingMm: parseInt(e.target.value) || 400 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                >
                  <option value={300}>300 mm (Reforçado)</option>
                  <option value={350}>350 mm</option>
                  <option value={400}>400 mm (Padrão ABNT)</option>
                  <option value={500}>500 mm (Econômico)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block text-[11px]">Cordão Selante (mm)</label>
                <select
                  value={`${config.jointWidthMm}x${config.jointDepthMm}`}
                  onChange={(e) => {
                    const [w, d] = e.target.value.split('x').map(Number);
                    setConfig({ ...config, jointWidthMm: w, jointDepthMm: d });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                >
                  <option value="6x6">6x6 mm (Padrão 36ml/m)</option>
                  <option value="8x8">8x8 mm (Pesado 64ml/m)</option>
                  <option value="10x10">10x10 mm (Grosso 100ml/m)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block text-[11px]">Cartucho Selante</label>
                <select
                  value={config.cartridgeVolumeMl}
                  onChange={(e) => setConfig({ ...config, cartridgeVolumeMl: parseInt(e.target.value) || 310 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                >
                  <option value={310}>Cartucho 400g/310ml</option>
                  <option value={600}>Sachê 600ml</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block text-[11px]">Espuma Expansiva?</label>
                <select
                  value={config.useExpandingFoam ? 'yes' : 'no'}
                  onChange={(e) => setConfig({ ...config, useExpandingFoam: e.target.value === 'yes' })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-cyan-400 font-bold"
                >
                  <option value="yes">Sim (Preenchimento térmico)</option>
                  <option value="no">Não (Apenas argamassa)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block text-[11px]">Preço Grampo (un)</label>
                <input
                  type="number"
                  step="0.05"
                  value={config.unitPrices.clamp}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      unitPrices: { ...config.unitPrices, clamp: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block text-[11px]">Preço PU 40 (tubo)</label>
                <input
                  type="number"
                  step="0.50"
                  value={config.unitPrices.sealantTube}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      unitPrices: { ...config.unitPrices, sealantTube: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-emerald-400 font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Corpo com Rolagem */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Grampos Contramarco
              </span>
              <div className="text-xl font-black text-amber-400 font-mono">
                {summary.totalClamps} <span className="text-xs text-slate-500 font-normal">un</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                R$ {summary.costBreakdown.clampsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Selante PU 40 / Neutro
              </span>
              <div className="text-xl font-black text-emerald-400 font-mono">
                {summary.totalSealantTubes} <span className="text-xs text-slate-500 font-normal">tubos</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                R$ {summary.costBreakdown.sealantCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Espuma Expansiva
              </span>
              <div className="text-xl font-black text-cyan-400 font-mono">
                {summary.config.useExpandingFoam ? summary.totalFoamCans : 0}{' '}
                <span className="text-xs text-slate-500 font-normal">latas</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                R$ {summary.costBreakdown.foamCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Parafusos + Buchas S8
              </span>
              <div className="text-xl font-black text-white font-mono">
                {summary.totalScrewsAndPlugs} <span className="text-xs text-slate-500 font-normal">un</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                R$ {summary.costBreakdown.screwsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Fita Crepe (50m)
              </span>
              <div className="text-xl font-black text-purple-400 font-mono">
                {summary.totalMaskingTapeRolls} <span className="text-xs text-slate-500 font-normal">rolos</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                R$ {summary.costBreakdown.tapeCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-emerald-500/10 p-3.5 rounded-xl border border-amber-500/30 space-y-1">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                Custo Total do Kit
              </span>
              <div className="text-xl font-black text-amber-400 font-mono">
                R$ {summary.costBreakdown.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-emerald-400 font-medium">
                Média R$ {summary.averageCostPerOpening.toFixed(2)} / vão
              </p>
            </div>
          </div>

          {/* Adicionar Vão Customizado (Apenas no Modo Custom) */}
          {activeSource === 'CUSTOM' && (
            <form
              onSubmit={handleAddCustomOpening}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-end gap-3 text-xs"
            >
              <div className="flex-1 min-w-[160px] space-y-1">
                <label className="text-slate-400 block text-[11px]">Identificação do Vão</label>
                <input
                  type="text"
                  placeholder="Ex: J4 - Suíte Master"
                  value={newOpeningName}
                  onChange={(e) => setNewOpeningName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="w-24 space-y-1">
                <label className="text-slate-400 block text-[11px]">Largura (mm)</label>
                <input
                  type="number"
                  value={newOpeningWidth}
                  onChange={(e) => setNewOpeningWidth(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div className="w-24 space-y-1">
                <label className="text-slate-400 block text-[11px]">Altura (mm)</label>
                <input
                  type="number"
                  value={newOpeningHeight}
                  onChange={(e) => setNewOpeningHeight(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div className="w-16 space-y-1">
                <label className="text-slate-400 block text-[11px]">Qtd</label>
                <input
                  type="number"
                  min="1"
                  value={newOpeningQty}
                  onChange={(e) => setNewOpeningQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pb-1.5">
                <label className="flex items-center gap-1.5 text-slate-300 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newOpeningIsDoor}
                    onChange={(e) => setNewOpeningIsDoor(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Porta (sem grampo peitoril)</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Vão</span>
              </button>
            </form>
          )}

          {/* Relação de Vãos e Detalhamento */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white uppercase tracking-wider">
                  Detalhamento por Vão da Obra ({summary.totalUnits} un • {summary.totalPerimeterM}m de perímetro)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Grampos nos montantes/travessa + calços e parafusos inox
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="p-3">Vão / Esquadria</th>
                    <th className="p-3 text-center">Medidas (LxA mm)</th>
                    <th className="p-3 text-center">Qtd</th>
                    <th className="p-3 text-center">Perímetro</th>
                    <th className="p-3 text-center">Grampos Contramarco</th>
                    <th className="p-3 text-center">Parafusos Inox</th>
                    <th className="p-3 text-center">PU 40</th>
                    <th className="p-3 text-right">Custo Estimado</th>
                    {activeSource === 'CUSTOM' && <th className="p-3 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {summary.items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 font-sans font-medium text-slate-200">
                        {it.name}
                      </td>
                      <td className="p-3 text-center text-slate-300">
                        {it.widthMm} x {it.heightMm}
                      </td>
                      <td className="p-3 text-center text-white font-bold">
                        {it.quantity}
                      </td>
                      <td className="p-3 text-center text-slate-300">
                        {it.totalPerimeterLinearM} m
                      </td>
                      <td className="p-3 text-center text-amber-400 font-bold">
                        {it.totalClamps} un{' '}
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({it.clampsPerUnit}/un)
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-300">
                        {it.totalScrewsAndPlugs} un
                      </td>
                      <td className="p-3 text-center text-emerald-400 font-bold">
                        {it.sealantTubesRounded} tb{' '}
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({it.sealantTubesRaw.toFixed(1)})
                        </span>
                      </td>
                      <td className="p-3 text-right text-amber-300 font-bold">
                        R$ {it.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      {activeSource === 'CUSTOM' && (
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomOpening(it.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remover vão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dicas e Recomendações Técnicas da Norma NBR 10821 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-300">
                Regra Técnica de Ancoragem (ABNT NBR 10821 / NBR 6485):
              </span>
              <p>
                Os grampos de contramarco devem ser posicionados a 150mm dos vértices externos, e os intermediários não
                devem exceder 400mm de passo. Para vedações perimetrais com PU 40 ou silicone neutro de cura sem oxima,
                recomenda-se profundidade mínima de 6mm com aplicação prévia de fita crepe para garantir linha reta sem
                manchas na anodização ou pintura eletrostática.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <div className="text-slate-400">
            Total da Obra:{' '}
            <strong className="text-white">{summary.totalUnits} esquadrias</strong> •{' '}
            <strong className="text-amber-400">{summary.totalClamps} grampos</strong> •{' '}
            <strong className="text-emerald-400">{summary.totalSealantTubes} tubos PU</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer flex items-center gap-1.5"
            >
              {copiedWhatsApp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedWhatsApp ? 'Lista Copiada!' : 'Copiar Lista p/ WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
