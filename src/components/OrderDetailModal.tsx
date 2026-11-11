import React, { useState, useEffect } from 'react';
import { Order, OrderItem, ColorFinish } from '../types';
import { useApp } from '../context/AppContext';
import { TYPOLOGIES_CATALOG, GLASS_CATALOG } from '../data/catalog';
import { TechnicalCadViewer2D } from './TechnicalCadViewer2D';
import { printCommercialProposal, printProductionOrderSheet } from '../utils/pdfPrint';
import {
  X,
  Printer,
  Scissors,
  Cpu,
  Plus,
  Trash2,
  Save,
  FileText,
  Layers,
  Ruler,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  Building,
  User,
  Phone,
  Calendar,
  DollarSign,
  AlertCircle,
  MessageCircle,
  Wrench,
} from 'lucide-react';
import { WhatsAppProposalModal } from './WhatsAppProposalModal';
import { UpsellingSimulatorModal } from './UpsellingSimulatorModal';
import { InstallationHardwareCalculatorModal } from './InstallationHardwareCalculatorModal';

interface OrderDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orderId,
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const {
    orders,
    updateOrder,
    approveOrder,
    advanceProductionStep,
    deleteOrder,
    setActiveTab,
    setSelectedOrderId,
    recalculateOrderTotals,
  } = useApp();

  const order = orders.find((o) => o.id === orderId);

  // Form states for order header
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState<Order['status']>('Orçamento');
  const [color, setColor] = useState<ColorFinish>('Branco');
  const [marginPct, setMarginPct] = useState(35);
  const [laborM2, setLaborM2] = useState(85);
  const [discount, setDiscount] = useState(0);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isUpsellingModalOpen, setIsUpsellingModalOpen] = useState(false);
  const [isHardwareCalculatorOpen, setIsHardwareCalculatorOpen] = useState(false);

  // Form state for adding a new item
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedTypologyId, setSelectedTypologyId] = useState(TYPOLOGIES_CATALOG[0]?.id || '');
  const [itemWidth, setItemWidth] = useState(1500);
  const [itemHeight, setItemHeight] = useState(1200);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemRoomTag, setItemRoomTag] = useState('');
  const [itemGlassId, setItemGlassId] = useState(GLASS_CATALOG[0]?.id || '');

  // Preview 2D modal state
  const [previewItem, setPreviewItem] = useState<OrderItem | null>(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    if (order) {
      setClientName(order.clientName || '');
      setClientPhone(order.clientPhone || '');
      setClientAddress(order.clientAddress || order.address || '');
      setDeliveryDate(order.deliveryDate || '');
      setStatus(order.status || 'Orçamento');
      setColor(order.color || 'Branco');
      setMarginPct(order.marginPercent ?? order.marginPct ?? 35);
      setLaborM2(order.laborRatePerM2 ?? order.laborCostPerM2 ?? 85);
      setDiscount(order.discountValue ?? order.discountAmount ?? 0);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSaveHeader = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const totals = recalculateOrderTotals(
      order.items,
      marginPct,
      laborM2,
      order.taxRatePercent || 6,
      discount,
      color
    );

    const updated: Order = {
      ...order,
      clientName,
      clientPhone,
      clientAddress,
      deliveryDate,
      status,
      color,
      marginPercent: marginPct,
      marginPct,
      laborRatePerM2: laborM2,
      laborCostPerM2: laborM2,
      discountValue: discount,
      discountAmount: discount,
      ...totals,
    };

    updateOrder(updated);
    showToast('Dados do orçamento atualizados!');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const typo = TYPOLOGIES_CATALOG.find((t) => t.id === selectedTypologyId);
    if (!typo) return;

    const newItem: OrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      typologyId: typo.id,
      typologyName: typo.name,
      width: itemWidth,
      height: itemHeight,
      widthMm: itemWidth,
      heightMm: itemHeight,
      quantity: itemQuantity,
      roomTag: itemRoomTag.trim() || 'Ambiente Geral',
      location: itemRoomTag.trim() || 'Ambiente Geral',
      color,
      aluminumColor: color,
      glassId: itemGlassId,
      glassType: GLASS_CATALOG.find((g) => g.id === itemGlassId)?.name || 'Incolor',
    };

    const nextItems = [...order.items, newItem];
    const totals = recalculateOrderTotals(
      nextItems,
      marginPct,
      laborM2,
      order.taxRatePercent || 6,
      discount,
      color
    );

    // Rateio proporcional do valor do item
    const itemRatio = (itemWidth * itemHeight * itemQuantity) / Math.max(1, (totals.totalGlassM2 * 1000000));
    const approxUnitPrice = Math.round((totals.finalPrice * itemRatio) / itemQuantity);
    newItem.unitPrice = approxUnitPrice;
    newItem.totalPrice = approxUnitPrice * itemQuantity;

    const updated: Order = {
      ...order,
      items: nextItems,
      ...totals,
    };

    updateOrder(updated);
    setIsAddingItem(false);
    setItemRoomTag('');
    showToast(`"${typo.name}" adicionado ao pedido com sucesso!`);
  };

  const handleRemoveItem = (itemId: string) => {
    const nextItems = order.items.filter((i) => i.id !== itemId);
    const totals = recalculateOrderTotals(
      nextItems,
      marginPct,
      laborM2,
      order.taxRatePercent || 6,
      discount,
      color
    );

    updateOrder({
      ...order,
      items: nextItems,
      ...totals,
    });
    showToast('Item removido do orçamento.');
  };

  const selectedTypology = TYPOLOGIES_CATALOG.find((t) => t.id === selectedTypologyId) || TYPOLOGIES_CATALOG[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho da OP */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg font-mono">
              OP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-400 text-base">#{order.number}</span>
                <h2 className="text-base font-bold text-white leading-tight">{order.clientName}</h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    order.status === 'Concluído'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : order.status === 'Em Produção'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : order.status === 'Aprovado'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {order.status}
                </span>
                {order.productionStep && (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    Etapa: {order.productionStep}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Criado em {order.createdAt || 'recente'} • Entrega: {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Ações Técnicas e de Impressão */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => printCommercialProposal(order)}
              title="Imprimir Proposta Comercial ABNT"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Proposta Comercial</span>
            </button>

            <button
              type="button"
              onClick={() => printProductionOrderSheet(order)}
              title="Imprimir Folha de Fabricação (OP)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Folha OP</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUpsellingModalOpen(true)}
              title="Comparativo de Up-selling 3 Níveis (Suprema ➔ Gold ➔ Minimalista)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 text-xs font-bold transition-all border border-amber-500/40 cursor-pointer shadow-sm shadow-amber-950/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Up-selling (3 Níveis)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWhatsAppModalOpen(true)}
              title="Compartilhar Orçamento via WhatsApp & Simulador de Parcelamento"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp &amp; Pagamento</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(order.id);
                onClose();
                if (onNavigateToTab) onNavigateToTab('site_survey');
                else setActiveTab('site_survey');
              }}
              title="Vistoria técnica, esquadro (D1 vs D2) e medição de vãos na obra"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-xs font-semibold transition-all border border-amber-800 cursor-pointer"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Medição de Obra</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHardwareCalculatorOpen(true)}
              title="Calculador de insumos de fixação (grampos de contramarco, selante PU 40, espuma e parafusos)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold transition-all border border-slate-700 hover:border-amber-500/40 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Insumos de Fixação</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(order.id);
                onClose();
                if (onNavigateToTab) onNavigateToTab('cutting_plan');
                else setActiveTab('cutting_plan');
              }}
              title="Ver plano de corte das barras desta OP"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-xs font-semibold transition-all border border-cyan-800 cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Plano de Corte</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(order.id);
                onClose();
                if (onNavigateToTab) onNavigateToTab('cnc_studio');
                else setActiveTab('cnc_studio');
              }}
              title="Exportar G-Code para Centro de Usinagem CNC"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 text-xs font-semibold transition-all border border-purple-800 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>CNC Studio</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificação Toast */}
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

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {/* Painel de Informações e Parâmetros Comerciais */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                <User className="w-3.5 h-3.5 text-amber-400" /> Dados Comerciais & Parâmetros do Pedido
              </span>
              <button
                type="button"
                onClick={handleSaveHeader}
                className="flex items-center gap-1 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
              >
                <Save className="w-3 h-3" />
                <span>Salvar Alterações</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Cliente / Razão Social</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Endereço da Obra</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Data de Entrega</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Acabamento do Alumínio</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value as ColorFinish)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold"
                >
                  <option value="Branco">Branco Eletrostático</option>
                  <option value="Preto">Preto Fosco Microtexturizado</option>
                  <option value="Bronze">Bronze Anodizado</option>
                  <option value="Natural">Natural Fosco</option>
                  <option value="Amadeirado">Efeito Amadeirado</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Status da Proposta / OP</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Order['status'])}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold"
                >
                  <option value="Orçamento">Orçamento Comercial</option>
                  <option value="Aprovado">Aprovado pelo Cliente</option>
                  <option value="Em Produção">Em Fabricação (PCP)</option>
                  <option value="Concluído">Concluído / Instalado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Margem de Lucro Bruta (%)</label>
                <input
                  type="number"
                  value={marginPct}
                  onChange={(e) => setMarginPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mão de Obra de Fabricação (R$/m²)</label>
                <input
                  type="number"
                  value={laborM2}
                  onChange={(e) => setLaborM2(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-bold font-mono"
                />
              </div>
            </div>
          </div>

          {/* Cards Resumo de Totais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block uppercase">Peso Total Alumínio</span>
              <span className="text-lg font-bold text-cyan-400">{order.totalWeightKg} kg</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block uppercase">Área Total de Vidro</span>
              <span className="text-lg font-bold text-cyan-400">{order.totalGlassM2} m²</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block uppercase">Custo de Materiais</span>
              <span className="text-lg font-bold text-slate-300">
                R$ {order.materialCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/40 bg-gradient-to-br from-slate-950 to-amber-950/20">
              <span className="text-[10px] text-amber-400 font-sans block uppercase font-bold">Valor Total Proposta</span>
              <span className="text-lg font-black text-amber-400">
                R$ {order.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Lista de Vãos / Esquadrias */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Esquadrias do Pedido ({order.items.length} vãos)</span>
                </h3>
                <p className="text-[11px] text-slate-400">Dimensões de vão luz, acabamento e especificações de vidro</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingItem ? 'Fechar Formulário' : '+ Adicionar Vão / Esquadria'}</span>
              </button>
            </div>

            {/* Formulário para Inclusão de Novo Vão */}
            {isAddingItem && (
              <form onSubmit={handleAddItem} className="p-3.5 bg-slate-900 rounded-xl border border-cyan-500/30 space-y-3 animate-in fade-in">
                <span className="text-xs font-bold text-cyan-300 block">Cadastrar Novo Vão na OP #{order.number}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Tipologia / Modelo</label>
                    <select
                      value={selectedTypologyId}
                      onChange={(e) => setSelectedTypologyId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                    >
                      {TYPOLOGIES_CATALOG.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.series})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Local / Ambiente</label>
                    <input
                      type="text"
                      placeholder="Ex: Sala de Jantar, Quarto 2"
                      value={itemRoomTag}
                      onChange={(e) => setItemRoomTag(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Largura Vão (mm)</label>
                    <input
                      type="number"
                      step="10"
                      value={itemWidth}
                      onChange={(e) => setItemWidth(parseInt(e.target.value) || 1000)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Altura Vão (mm)</label>
                    <input
                      type="number"
                      step="10"
                      value={itemHeight}
                      onChange={(e) => setItemHeight(parseInt(e.target.value) || 1000)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Especificação do Vidro</label>
                    <select
                      value={itemGlassId}
                      onChange={(e) => setItemGlassId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-semibold"
                    >
                      {GLASS_CATALOG.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.thicknessMm}mm) - R$ {g.pricePerM2}/m²
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingItem(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all cursor-pointer shadow-md"
                    >
                      + Incluir Vão no Orçamento
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Tabela de Itens */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-900/50">
                    <th className="py-2.5 px-3">Item / Ambiente</th>
                    <th className="py-2.5 px-3">Tipologia / Linha</th>
                    <th className="py-2.5 px-3 text-center">Vão (L × H mm)</th>
                    <th className="py-2.5 px-3 text-center">Qtd</th>
                    <th className="py-2.5 px-3">Vidro & Cor</th>
                    <th className="py-2.5 px-3 text-right">Unitário</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {order.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white block">{item.location || item.roomTag || `Vão #${idx + 1}`}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {item.id.slice(-6)}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-200 block">{item.typologyName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-400">
                        {item.widthMm || item.width} × {item.heightMm || item.height}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-white">
                        {item.quantity} un
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-300 block">{item.glassType || item.glassId}</span>
                        <span className="text-[10px] text-slate-500">{item.aluminumColor || item.color || order.color}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        R$ {(item.unitPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                        R$ {(item.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            title="Visualizar Desenho Técnico 2D CAD"
                            className="p-1 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remover este vão"
                            className="p-1 rounded hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Embutido para Visualização CAD 2D */}
        {previewItem && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-cyan-400" />
                    <span>Desenho Técnico 2D - {previewItem.typologyName}</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Vão: {previewItem.widthMm || previewItem.width} × {previewItem.heightMm || previewItem.height} mm • {previewItem.location || previewItem.roomTag}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                <TechnicalCadViewer2D
                  typology={TYPOLOGIES_CATALOG.find((t) => t.id === previewItem.typologyId) || TYPOLOGIES_CATALOG[0]}
                  width={previewItem.widthMm || previewItem.width}
                  height={previewItem.heightMm || previewItem.height}
                  color={previewItem.color || order.color}
                  glassId={previewItem.glassId}
                  showDetailsToggle={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Interativo de WhatsApp & Simulador de Pagamento */}
      <WhatsAppProposalModal
        order={order}
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      {/* Modal Inteligente de Up-selling 3 Níveis (Suprema ➔ Gold ➔ Minimalista) */}
      <UpsellingSimulatorModal
        order={order}
        isOpen={isUpsellingModalOpen}
        onClose={() => setIsUpsellingModalOpen(false)}
      />

      {/* Modal do Calculador de Insumos de Fixação */}
      {isHardwareCalculatorOpen && (
        <InstallationHardwareCalculatorModal
          isOpen={isHardwareCalculatorOpen}
          onClose={() => setIsHardwareCalculatorOpen(false)}
          orders={orders}
          initialOrderId={order.id}
          showToast={showToast}
        />
      )}
    </div>
  );
};
