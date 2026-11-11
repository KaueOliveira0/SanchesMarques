import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useApp, ActiveTab } from './context/AppContext';
import { CollapsibleSidebar } from './components/CollapsibleSidebar';
import { Dashboard } from './components/Dashboard';
import { TypologiesManager } from './components/TypologiesManager';
import { CuttingPlanOptimizer } from './components/CuttingPlanOptimizer';
import { GlassCuttingOptimizer2D } from './components/GlassCuttingOptimizer2D';
import { StockManager } from './components/StockManager';
import { ProductionKanban } from './components/ProductionKanban';
import { RomaneioManager } from './components/RomaneioManager';
import { AnalyticsReports } from './components/AnalyticsReports';
import { CncMachineStudio } from './components/CncMachineStudio';
import { CatalogBatchImporter } from './components/CatalogBatchImporter';
import { AssemblyPlanManager } from './components/AssemblyPlanManager';
import { SiteSurveyManager } from './components/SiteSurveyManager';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';
import { VehicleLoadPlannerModal } from './components/VehicleLoadPlannerModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { WhatsAppProposalModal } from './components/WhatsAppProposalModal';
import { UpsellingSimulatorModal } from './components/UpsellingSimulatorModal';
import { DynamicPricingManager } from './components/DynamicPricingManager';
import { InstallationHardwareCalculatorModal } from './components/InstallationHardwareCalculatorModal';
import { VisualWallSimulator } from './components/VisualWallSimulator';
import { HardwareDrillGuide } from './components/HardwareDrillGuide';
import { DigitalShowcaseCatalog } from './components/DigitalShowcaseCatalog';
import { QrCodeProductionStudio } from './components/QrCodeProductionStudio';
import { FinishesSimulator } from './components/FinishesSimulator';
import { Order } from './types';
import { useAutoBackupRunner } from './hooks/useAutoBackupRunner';
import { getEffectiveCompanyProfile, saveCompanyProfile, CompanyProfile } from './utils/companyProfile';
import { getEffectiveEmblemSrc, setCustomLogo, OFFICIAL_PRESETS, APP_EMBLEM_SRC } from './utils/logoData';
import { saveProfilesCustomPrices, saveGlassCustomPrices, saveAccessoriesCustomPrices, saveColorMultipliers } from './utils/pricingCatalog';
import { saveClearanceConfigs } from './utils/clearanceConfig';
import { printCommercialProposal } from './utils/pdfPrint';
import { filterAndSortOrders } from './utils/orderFilter';
import {
  Sparkles,
  Sliders,
  DollarSign,
  FileText,
  Plus,
  Save,
  CheckCircle2,
  Database,
  Building2,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Printer,
  ChevronRight,
  Trash2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  Truck,
  RotateCcw,
  Search,
  Filter,
  ArrowUpDown,
  Image as ImageIcon,
  Link as LinkIcon,
  MessageCircle,
  Wrench,
  Menu,
  ShoppingBag,
  Box,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    orders,
    selectedOrderId,
    setSelectedOrderId,
    addOrder,
    updateOrder,
    deleteOrder,
    approveOrder,
    advanceProductionStep,
    customProfiles,
    setCustomProfiles,
    customGlass,
    setCustomGlass,
    customAccessories,
    setCustomAccessories,
    colorMultipliers,
    setColorMultipliers,
    clearanceConfigs,
    setClearanceConfigs,
    exportDatabaseJson,
    importDatabaseJson,
    resetToSampleData,
  } = useApp();

  const { activeToast, dismissToast, isBackupModalOpen, setIsBackupModalOpen, runBackupNow } = useAutoBackupRunner();

  // Modais globais
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false);
  const [isLoadPlannerOpen, setIsLoadPlannerOpen] = useState(false);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState<Order | null>(null);
  const [upsellingModalOrder, setUpsellingModalOrder] = useState<Order | null>(null);
  const [isHardwareCalculatorModalOpen, setIsHardwareCalculatorModalOpen] = useState(false);
  const [hardwareCalculatorInitialOrderId, setHardwareCalculatorInitialOrderId] = useState<string | null>(null);
  const [globalToast, setGlobalToast] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => getEffectiveCompanyProfile());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Logo da empresa (cabeçalho, barra lateral, relatórios e branding)
  const [currentLogo, setCurrentLogo] = useState<string>(() => getEffectiveEmblemSrc());
  const [customLogoInput, setCustomLogoInput] = useState<string>(() => getEffectiveEmblemSrc());

  const showGlobalToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 3500);
  };

  // Abre modal de detalhe quando uma OP for selecionada
  useEffect(() => {
    if (selectedOrderId && (activeTab === 'budgets' || activeTab === 'dashboard')) {
      setIsOrderDetailModalOpen(true);
    }
  }, [selectedOrderId, activeTab]);

  // Estado para formulário de novo orçamento
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newColor, setNewColor] = useState<'Branco' | 'Preto' | 'Bronze' | 'Natural' | 'Amadeirado'>('Branco');
  const [newMarginPct, setNewMarginPct] = useState(35);
  const [newLaborM2, setNewLaborM2] = useState(85);

  // Estados para busca, filtragem por categoria/status e ordenação na listagem de orçamentos
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderCategoryFilter, setOrderCategoryFilter] = useState('ALL');
  const [orderSortBy, setOrderSortBy] = useState<'newest' | 'oldest' | 'value_desc' | 'value_asc' | 'client_asc' | 'weight_desc'>('newest');

  const { filteredOrders, summary: ordersSummary } = useMemo(() => {
    return filterAndSortOrders(orders, {
      searchTerm: orderSearchTerm,
      status: orderStatusFilter,
      category: orderCategoryFilter,
      sortBy: orderSortBy,
    });
  }, [orders, orderSearchTerm, orderStatusFilter, orderCategoryFilter, orderSortBy]);

  // Escuta eventos globais
  useEffect(() => {
    const handleOpenBranding = () => {
      setCustomLogoInput(getEffectiveEmblemSrc());
      setIsBrandingModalOpen(true);
    };
    const handleOpenBackup = () => setIsBackupModalOpen(true);
    const handleLogoUpdated = () => {
      const eff = getEffectiveEmblemSrc();
      setCurrentLogo(eff);
      setCustomLogoInput(eff);
    };

    window.addEventListener('sm_open_branding_modal', handleOpenBranding);
    window.addEventListener('desktop-open-backup-modal', handleOpenBackup);
    window.addEventListener('sm_branding_updated', handleLogoUpdated);
    window.addEventListener('storage', handleLogoUpdated);

    return () => {
      window.removeEventListener('sm_open_branding_modal', handleOpenBranding);
      window.removeEventListener('desktop-open-backup-modal', handleOpenBackup);
      window.removeEventListener('sm_branding_updated', handleLogoUpdated);
      window.removeEventListener('storage', handleLogoUpdated);
    };
  }, [setIsBackupModalOpen]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem é muito grande (máx 5MB). Escolha um arquivo menor.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomLogoInput(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    saveCompanyProfile(companyProfile);
    setCustomLogo(customLogoInput);
    setCurrentLogo(getEffectiveEmblemSrc());
    setIsBrandingModalOpen(false);
    showGlobalToast('Logo da empresa e dados corporativos salvos com sucesso!');
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const created = addOrder({
      clientName: newClientName,
      clientPhone: newClientPhone,
      clientAddress: newAddress,
      deliveryDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      status: 'Orçamento',
      productionStep: 'Aguardando Insumos',
      color: newColor,
      marginPercent: newMarginPct,
      laborRatePerM2: newLaborM2,
      taxRatePercent: 6,
      discountValue: 0,
      totalWeightKg: 45.0,
      totalGlassM2: 3.5,
      materialCost: 2100,
      laborCost: 297.5,
      subtotal: 3500,
      finalPrice: 3500,
      items: [
        {
          id: `item_${Date.now()}`,
          typologyId: 'typ_cor2_sup',
          typologyName: 'Janela de Correr 2 Folhas (Suprema)',
          width: 1500,
          height: 1200,
          widthMm: 1500,
          heightMm: 1200,
          quantity: 1,
          roomTag: 'Sala de Estar',
          location: 'Sala de Estar',
          glassId: 'gls_temp_6mm',
          glassType: 'Vidro Temperado 6mm',
          color: newColor,
          aluminumColor: newColor,
          unitPrice: 1650,
          totalPrice: 1650,
        },
      ],
    });

    setIsNewOrderModalOpen(false);
    setSelectedOrderId(created.id);
    setIsOrderDetailModalOpen(true);
    showGlobalToast(`Orçamento OP #${created.number} criado com sucesso!`);
    setNewClientName('');
    setNewClientPhone('');
    setNewAddress('');
  };

  // Renderizador das Views de acordo com activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;

      case 'budgets':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white tracking-wide">
                    Orçamentos Comerciais & Ordens de Produção (OP)
                  </h1>
                  <p className="text-xs text-slate-400">
                    Gere propostas instantâneas com cálculo paramétrico de peso (kg), área de vidro (m²) e margens de lucro.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsPurchaseOrderModalOpen(true)}
                  title="Consolidador de Pedido de Compra de Alumínio para Extrusoras (Belmetal, Hydro, Alcoa, Miranda, CBA)"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-sm hover:border-emerald-500/40"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Consolidar Pedido (Extrusoras)</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    6m / Ton
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHardwareCalculatorInitialOrderId(null);
                    setIsHardwareCalculatorModalOpen(true);
                  }}
                  title="Calculador de Insumos de Fixação (Contramarco, Silicone PU, Espuma e Parafusos)"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-sm hover:border-amber-500/40"
                >
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Insumos de Fixação</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    PU/Grampos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-900/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Orçamento</span>
                </button>
              </div>
            </div>

            {/* Barra de Busca e Filtros de Categoria / Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Campo de Busca Rápida */}
                <div className="md:col-span-4 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    data-testid="orders-search-input"
                    aria-label="Buscar pedidos por cliente, número ou itens"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    placeholder="Buscar por cliente, OP #, telefone, endereço, modelo..."
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
                  />
                  {orderSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setOrderSearchTerm('')}
                      aria-label="Limpar termo de busca"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Filtro por Status */}
                <div className="md:col-span-3">
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      data-testid="orders-status-filter"
                      aria-label="Filtrar por status do pedido"
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="w-full pl-8 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium cursor-pointer appearance-none"
                    >
                      <option value="ALL">Todos os Status</option>
                      <option value="Orçamento">Orçamento</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Em Produção">Em Produção</option>
                      <option value="Concluído">Concluído</option>
                      <option value="Rascunho">Rascunho</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Dropdown Filtro por Categoria / Acabamento */}
                <div className="md:col-span-3">
                  <div className="relative">
                    <Sliders className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      data-testid="orders-category-filter"
                      aria-label="Filtrar por categoria ou acabamento"
                      value={orderCategoryFilter}
                      onChange={(e) => setOrderCategoryFilter(e.target.value)}
                      className="w-full pl-8 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium cursor-pointer appearance-none"
                    >
                      <option value="ALL">Categorias & Cores (Todas)</option>
                      <optgroup label="Acabamentos de Alumínio">
                        <option value="Branco">Branco</option>
                        <option value="Preto">Preto</option>
                        <option value="Bronze">Bronze</option>
                        <option value="Natural">Natural</option>
                        <option value="Amadeirado">Amadeirado</option>
                      </optgroup>
                      <optgroup label="Tipologias & Linhas">
                        <option value="Janela">Janelas</option>
                        <option value="Porta">Portas</option>
                        <option value="Maxim-Ar">Maxim-Ar</option>
                        <option value="Persiana">Persiana / Integrada</option>
                        <option value="Suprema">Linha Suprema</option>
                        <option value="Gold">Linha Gold</option>
                      </optgroup>
                    </select>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Ordenação */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      data-testid="orders-sort-filter"
                      aria-label="Ordenar pedidos"
                      value={orderSortBy}
                      onChange={(e) => setOrderSortBy(e.target.value as any)}
                      className="w-full pl-8 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium cursor-pointer appearance-none"
                    >
                      <option value="newest">Mais Recentes (OP ↓)</option>
                      <option value="oldest">Mais Antigos (OP ↑)</option>
                      <option value="value_desc">Maior Valor (R$ ↓)</option>
                      <option value="value_asc">Menor Valor (R$ ↑)</option>
                      <option value="client_asc">Cliente (A-Z)</option>
                      <option value="weight_desc">Maior Peso (kg ↓)</option>
                    </select>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Barra de Métricas / Resumo dos Filtros Ativos */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-3 text-slate-400">
                  <span>
                    Exibindo <strong className="text-white">{ordersSummary.matchedCount}</strong> de{' '}
                    <strong className="text-white">{ordersSummary.totalCount}</strong> ordens
                  </span>
                  {ordersSummary.matchedCount > 0 && (
                    <span className="hidden sm:inline-block text-slate-600">•</span>
                  )}
                  {ordersSummary.matchedCount > 0 && (
                    <div className="hidden sm:flex items-center gap-3 font-mono text-[11px]">
                      <span>
                        Total: <strong className="text-amber-400">R$ {ordersSummary.totalMatchedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </span>
                      <span>
                        Alumínio: <strong className="text-cyan-400">{ordersSummary.totalMatchedWeightKg} kg</strong>
                      </span>
                      <span>
                        Vidro: <strong className="text-cyan-400">{ordersSummary.totalMatchedGlassM2} m²</strong>
                      </span>
                    </div>
                  )}
                </div>

                {(orderSearchTerm || orderStatusFilter !== 'ALL' || orderCategoryFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderSearchTerm('');
                      setOrderStatusFilter('ALL');
                      setOrderCategoryFilter('ALL');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/20 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpar filtros</span>
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Pedidos Filtrados */}
            {filteredOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Nenhum orçamento encontrado</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {orderSearchTerm || orderStatusFilter !== 'ALL' || orderCategoryFilter !== 'ALL'
                      ? `Nenhum resultado corresponde à busca "${orderSearchTerm || ''}" e aos filtros selecionados.`
                      : 'Ainda não há nenhum pedido ou orçamento cadastrado no sistema.'}
                  </p>
                </div>
                {orderSearchTerm || orderStatusFilter !== 'ALL' || orderCategoryFilter !== 'ALL' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderSearchTerm('');
                      setOrderStatusFilter('ALL');
                      setOrderCategoryFilter('ALL');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                  >
                    Limpar todos os filtros
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsNewOrderModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                  >
                    Criar Primeiro Orçamento
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      setSelectedOrderId(o.id);
                      setIsOrderDetailModalOpen(true);
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-2xl hover:shadow-slate-950/90 hover:border-amber-500/40 cursor-pointer group shadow-lg"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                            OP #{o.number}
                          </span>
                          <h3 className="text-base font-bold text-white group-hover:text-amber-100 transition-colors leading-snug">
                            {o.clientName}
                          </h3>
                          <span className="text-xs text-slate-400">{o.clientPhone || 'Sem telefone'}</span>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border shadow-sm transition-transform group-hover:scale-105 ${
                            o.status === 'Concluído'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : o.status === 'Em Produção'
                              ? 'bg-blue-950 text-blue-300 border-blue-800'
                              : o.status === 'Aprovado'
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800/80 group-hover:border-slate-700/80 space-y-1.5 text-xs font-mono mb-4 transition-colors">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Itens / Vãos:</span>
                          <span className="text-white font-bold">{o.items.length} esquadria(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Peso Estimado:</span>
                          <span className="text-cyan-400 font-bold">{o.totalWeightKg} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Área de Vidro:</span>
                          <span className="text-cyan-400 font-bold">{o.totalGlassM2} m²</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-900">
                          <span className="text-slate-400 font-bold">Total Proposta:</span>
                          <span className="text-amber-400 font-bold text-sm">
                            R$ {o.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(o.id);
                            setIsOrderDetailModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-amber-500/20 active:scale-95"
                        >
                          Abrir / Vãos
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            printCommercialProposal(o);
                          }}
                          title="Imprimir proposta técnica timbrada"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWhatsAppModalOrder(o);
                          }}
                          title="Enviar proposta via WhatsApp com simulação de parcelamento"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpsellingModalOrder(o);
                          }}
                          title="Comparativo de Up-selling 3 Níveis (Suprema ➔ Gold ➔ Minimalista)"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Up-selling</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHardwareCalculatorInitialOrderId(o.id);
                            setIsHardwareCalculatorModalOpen(true);
                          }}
                          title="Calcular Insumos de Fixação e Vedação (Grampos, PU 40, Parafusos)"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-all cursor-pointer active:scale-95"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>

                        {o.status === 'Orçamento' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              approveOrder(o.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            Aprovar OP
                          </button>
                        )}
                        {(o.status === 'Aprovado' || o.status === 'Em Produção') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              advanceProductionStep(o.id);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            <span>Avançar Etapa</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOrder(o.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer active:scale-95"
                        title="Excluir pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'typologies':
        return <TypologiesManager />;

      case 'catalogs_library':
        return <CatalogBatchImporter />;

      case 'clearance_settings':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white tracking-wide">
                    Configuração de Folgas & Descontos das Linhas
                  </h1>
                  <p className="text-xs text-slate-400">
                    Ajuste fino dos descontos de corte de vidros (ΔL / ΔH), transpasses de folhas móveis e folgas de contramarco.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  saveClearanceConfigs(clearanceConfigs);
                  showGlobalToast('Configurações de folgas salvas com sucesso!');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Folgas</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clearanceConfigs.map((cfg, idx) => (
                <div key={cfg.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white">{cfg.series}</h3>
                    <span className="text-xs text-slate-400">{cfg.description}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <label className="text-slate-400 block mb-1 font-sans">Desconto Largura Vidro (ΔL mm)</label>
                      <input
                        type="number"
                        value={cfg.glassDeltaWidthMm}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const next = [...clearanceConfigs];
                          next[idx] = { ...cfg, glassDeltaWidthMm: val };
                          setClearanceConfigs(next);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-sans">Desconto Altura Vidro (ΔH mm)</label>
                      <input
                        type="number"
                        value={cfg.glassDeltaHeightMm}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const next = [...clearanceConfigs];
                          next[idx] = { ...cfg, glassDeltaHeightMm: val };
                          setClearanceConfigs(next);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-sans">Transpasse Folhas Móveis (mm)</label>
                      <input
                        type="number"
                        value={cfg.sashOverlapWidthMm}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const next = [...clearanceConfigs];
                          next[idx] = { ...cfg, sashOverlapWidthMm: val };
                          setClearanceConfigs(next);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-sans">Folga Contramarco (mm)</label>
                      <input
                        type="number"
                        value={cfg.frameClearanceWidthMm}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const next = [...clearanceConfigs];
                          next[idx] = { ...cfg, frameClearanceWidthMm: val, frameClearanceHeightMm: val };
                          setClearanceConfigs(next);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'pricing_table':
        return <DynamicPricingManager showGlobalToast={showGlobalToast} />;

      case 'cutting_plan':
        return <CuttingPlanOptimizer />;

      case 'glass_2d_optimizer':
        return <GlassCuttingOptimizer2D />;

      case 'cnc_studio':
        return <CncMachineStudio />;

      case 'stock':
        return <StockManager />;

      case 'production':
        return <ProductionKanban />;

      case 'qr_labels':
        return <QrCodeProductionStudio />;

      case 'finishes_simulator':
        return <FinishesSimulator />;

      case 'assembly':
        return <AssemblyPlanManager />;

      case 'romaneio':
        return <RomaneioManager />;

      case 'site_survey':
        return <SiteSurveyManager />;

      case 'visual_simulator':
        return <VisualWallSimulator />;

      case 'hardware_drill_guide':
        return <HardwareDrillGuide />;

      case 'digital_showcase':
        return <DigitalShowcaseCatalog />;

      case 'reports':
        return <AnalyticsReports />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
      {/* Menu Lateral Retrátil (Desktop + Gaveta Mobile) */}
      <CollapsibleSidebar
        onOpenBrandingModal={() => setIsBrandingModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Conteúdo Principal com Barra de Ações Rápidas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Topo Global Responsivo */}
        <header className="h-14 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão Hamburger Menu Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Abrir menu de navegação"
              title="Abrir menu principal"
            >
              <Menu className="w-5 h-5 text-amber-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomLogoInput(getEffectiveEmblemSrc());
                setIsBrandingModalOpen(true);
              }}
              title="Personalizar Logotipo & Marca (Clique para abrir as configurações)"
              className="group flex items-center gap-2 p-1 -m-1 rounded-lg hover:bg-slate-900/80 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            >
              <img
                src={currentLogo}
                alt={companyProfile.name || 'Sanches & Marques'}
                className="h-8 sm:h-9 w-auto max-w-[130px] sm:max-w-[170px] object-contain drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)] transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/logo-emblem.png';
                }}
              />
            </button>
            <span className="text-xs text-slate-400 hidden lg:inline">
              Sistema Industrial de Serralheria de Alumínio &amp; PCP (v3.2)
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsLoadPlannerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition-colors cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden md:inline">Planejador de Carga</span>
            </button>

            <button
              type="button"
              onClick={exportDatabaseJson}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Exportar backup completo JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja resetar o banco com dados de exemplo da fábrica?')) {
                  resetToSampleData();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Restaurar dados de exemplo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* View da Tab Atual */}
        <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 pb-24 md:pb-6 scrollbar-thin">
          {renderTabContent()}
        </main>

        {/* Barra de Navegação Inferior Mobile (Bottom Navigation Bar) */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1 flex items-center justify-around shadow-2xl safe-area-pb"
          aria-label="Navegação rápida mobile"
        >
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Painel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('budgets')}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'budgets'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Orçamentos</span>
            {orders.length > 0 && (
              <span className="absolute top-0 right-1 px-1 py-0.2 rounded-full text-[9px] font-mono bg-amber-500 text-slate-950 font-black">
                {orders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visual_simulator')}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'visual_simulator'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-5 h-5 mb-0.5 text-blue-400" />
            <span className="text-[10px]">3D / Foto</span>
            <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 rounded text-[8px] font-mono bg-blue-500 text-white font-bold leading-none">
              360°
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('digital_showcase')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'digital_showcase'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Vitrine</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="Abrir todas as ferramentas"
          >
            <Menu className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="text-[10px]">Mais</span>
          </button>
        </nav>
      </div>

      {/* Modal de Personalização de Marca & Identidade */}
      {isBrandingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Identidade Visual &amp; Dados Corporativos</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsBrandingModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranding} className="p-5 space-y-4 text-xs font-mono max-h-[80vh] overflow-y-auto">
              {/* Seção de Logotipo da Empresa (Upload, URL & Presets Oficiais) */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span className="font-sans font-bold text-sm text-white">Logotipo da Empresa</span>
                  </div>
                  <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {customLogoInput.startsWith('data:') ? 'Imagem Carregada (Upload)' : customLogoInput.includes('logo-full') ? 'Logo Completa Oficial' : 'Monograma SM Oficial'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Pré-visualização */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-lg bg-slate-900 border border-slate-750 text-center gap-2">
                    <span className="text-[10px] text-slate-400 font-sans font-semibold">Pré-visualização</span>
                    <div className="w-full h-20 flex items-center justify-center p-2 rounded bg-slate-950/90 border border-slate-800 overflow-hidden">
                      <img
                        src={customLogoInput || '/logo-emblem.png'}
                        alt="Prévia do Logotipo"
                        className="max-h-full max-w-full object-contain drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]"
                        onError={(e) => {
                          e.currentTarget.src = '/logo-emblem.png';
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-sans">
                      Exibido no Cabeçalho, Menu Lateral &amp; Propostas PDF
                    </span>
                  </div>

                  {/* Upload e URL */}
                  <div className="sm:col-span-8 flex flex-col gap-2.5">
                    {/* Botão de Upload de Arquivo */}
                    <div>
                      <label className="text-slate-300 block mb-1 font-sans font-semibold flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        Upload de Imagem:
                      </label>
                      <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer transition-all font-sans font-semibold text-xs text-center">
                        <Upload className="w-4 h-4 shrink-0" />
                        <span>Selecionar Imagem do Computador</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Campo de URL da Imagem */}
                    <div>
                      <label className="text-slate-400 block mb-1 font-sans flex items-center gap-1.5">
                        <LinkIcon className="w-3 h-3 text-cyan-400" />
                        Ou cole a URL da Imagem:
                      </label>
                      <input
                        type="text"
                        value={customLogoInput}
                        onChange={(e) => setCustomLogoInput(e.target.value)}
                        placeholder="Ex: https://... ou /logo-emblem.png"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Logos Principais Oficiais (Atalhos rápidos) */}
                    <div>
                      <span className="text-[11px] text-slate-400 font-sans block mb-1">
                        Logos Principais Oficiais:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCustomLogoInput('/logo-emblem.png')}
                          className={`px-2 py-1 rounded text-[11px] font-sans border transition-all cursor-pointer ${
                            customLogoInput === '/logo-emblem.png' || customLogoInput === ''
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          ✨ Monograma SM (Transparente)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomLogoInput('/logo-full.png')}
                          className={`px-2 py-1 rounded text-[11px] font-sans border transition-all cursor-pointer ${
                            customLogoInput === '/logo-full.png'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          🏢 Logo Completa SM Esquadrias
                        </button>
                        {customLogoInput !== '/logo-emblem.png' && (
                          <button
                            type="button"
                            onClick={() => setCustomLogoInput('/logo-emblem.png')}
                            className="px-2 py-1 rounded text-[11px] font-sans bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
                          >
                            Restaurar Padrão
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-sans">Razão Social / Nome</label>
                  <input
                    type="text"
                    value={companyProfile.name}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-sans">Slogan / Tagline</label>
                  <input
                    type="text"
                    value={companyProfile.tagline}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-sans">CNPJ</label>
                  <input
                    type="text"
                    value={companyProfile.cnpj}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, cnpj: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-sans">Inscrição Estadual (I.E)</label>
                  <input
                    type="text"
                    value={companyProfile.ie}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, ie: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-sans">Endereço da Fábrica</label>
                <input
                  type="text"
                  value={companyProfile.address}
                  onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-sans">Telefones</label>
                  <input
                    type="text"
                    value={companyProfile.phone}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-sans">E-mail Comercial</label>
                  <input
                    type="email"
                    value={companyProfile.email}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBrandingModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-sans cursor-pointer"
                >
                  Salvar Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Novo Orçamento Rápido */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Criar Novo Orçamento Comercial</h2>
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1 font-sans">Nome do Cliente / Obra</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Condomínio Tamboré - Casa 12"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-sans">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-sans">Endereço da Obra</label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro e cidade"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-sans">Acabamento</label>
                  <select
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-amber-400 font-bold"
                  >
                    <option value="Branco">Branco</option>
                    <option value="Preto">Preto</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Natural">Natural</option>
                    <option value="Amadeirado">Amadeirado</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-sans">Margem Lucro (%)</label>
                  <input
                    type="number"
                    value={newMarginPct}
                    onChange={(e) => setNewMarginPct(parseInt(e.target.value) || 35)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-sans cursor-pointer"
                >
                  Cadastrar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modais Globais */}
      <PurchaseOrderModal
        isOpen={isPurchaseOrderModalOpen}
        onClose={() => setIsPurchaseOrderModalOpen(false)}
      />

      <VehicleLoadPlannerModal
        isOpen={isLoadPlannerOpen}
        onClose={() => setIsLoadPlannerOpen(false)}
      />

      {/* Modal de Detalhes do Orçamento & Edição de Vãos */}
      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={isOrderDetailModalOpen && Boolean(selectedOrderId)}
        onClose={() => {
          setIsOrderDetailModalOpen(false);
          setSelectedOrderId(null);
        }}
        onNavigateToTab={(tab) => {
          setIsOrderDetailModalOpen(false);
          setActiveTab(tab as any);
        }}
      />

      {/* Modal de Proposta Rápida WhatsApp com Simulador de Parcelamento */}
      <WhatsAppProposalModal
        order={whatsAppModalOrder}
        isOpen={Boolean(whatsAppModalOrder)}
        onClose={() => setWhatsAppModalOrder(null)}
      />

      {/* Modal Inteligente de Up-selling (Suprema ➔ Gold ➔ Minimalista) */}
      <UpsellingSimulatorModal
        order={upsellingModalOrder}
        isOpen={Boolean(upsellingModalOrder)}
        onClose={() => setUpsellingModalOrder(null)}
      />

      {/* Modal do Calculador de Insumos de Fixação */}
      {isHardwareCalculatorModalOpen && (
        <InstallationHardwareCalculatorModal
          isOpen={isHardwareCalculatorModalOpen}
          onClose={() => {
            setIsHardwareCalculatorModalOpen(false);
            setHardwareCalculatorInitialOrderId(null);
          }}
          orders={orders}
          initialOrderId={hardwareCalculatorInitialOrderId}
          showToast={showGlobalToast}
        />
      )}

      {/* Toast Notification Geral */}
      {globalToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500/60 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 text-xs text-emerald-300 font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{globalToast}</span>
        </div>
      )}

      {/* Toast Notification de Backup */}
      {activeToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-emerald-500/40 rounded-xl p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">{activeToast.title}</span>
            <span className="text-[11px] text-slate-400 block font-mono">{activeToast.message}</span>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            className="p-1 rounded text-slate-500 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
