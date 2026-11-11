import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileText,
  Scissors,
  Cpu,
  Package,
  Kanban,
  Wrench,
  Truck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Database,
  Sliders,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Grid,
  BookOpen,
  Ruler,
  Camera,
  ShoppingBag,
  X,
  QrCode,
  Palette,
} from 'lucide-react';
import { useApp, ActiveTab } from '../context/AppContext';
import { getEffectiveEmblemSrc } from '../utils/logoData';
import { getEffectiveCompanyProfile } from '../utils/companyProfile';
import '../styles/sidebar.css';

interface CollapsibleSidebarProps {
  onOpenBrandingModal?: () => void;
  onOpenBackupModal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavCategory {
  title: string;
  items: Array<{
    id: ActiveTab;
    label: string;
    shortcut: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }>;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  onOpenBrandingModal,
  onOpenBackupModal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const {
    activeTab,
    setActiveTab,
    orders,
    stockProfiles,
    stockAccessories,
    stockGlass,
    stockConsumables = [],
  } = useApp();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sm_sidebar_collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [logoSrc, setLogoSrc] = useState<string>(() => getEffectiveEmblemSrc());
  const [companyProfile, setCompanyProfile] = useState(() => getEffectiveCompanyProfile());

  // Sincroniza logo e dados da empresa quando a marca é personalizada
  useEffect(() => {
    const handleBrandingUpdated = () => {
      setLogoSrc(getEffectiveEmblemSrc());
      setCompanyProfile(getEffectiveCompanyProfile());
    };
    window.addEventListener('sm_branding_updated', handleBrandingUpdated);
    window.addEventListener('storage', handleBrandingUpdated);
    return () => {
      window.removeEventListener('sm_branding_updated', handleBrandingUpdated);
      window.removeEventListener('storage', handleBrandingUpdated);
    };
  }, []);

  // Salvar estado da sidebar no localStorage
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sm_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const toggleCategory = (catTitle: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catTitle]: !prev[catTitle],
    }));
  };

  // Alertas de estoque
  const lowProfileStock = stockProfiles.filter((p) => p.wholeBarsQty <= p.minBarsThreshold).length;
  const lowAccStock = stockAccessories.filter((a) => a.currentQty <= a.minQty).length;
  const lowGlassStock = stockGlass.filter((g) => g.currentAreaM2 <= g.minAreaM2).length;
  const lowConsumablesStock = stockConsumables.filter((c) => c.currentQty <= c.minQty).length;
  const totalStockAlerts = lowProfileStock + lowAccStock + lowGlassStock + lowConsumablesStock;
  const inProductionCount = orders.filter((o) => o.status === 'Em Produção' || o.status === 'Aprovado').length;

  const categories: NavCategory[] = [
    {
      title: 'Visão Geral',
      items: [
        { id: 'dashboard', label: 'Painel Geral', shortcut: 'Alt+1', icon: Layers },
        { id: 'reports', label: 'Relatórios & BI', shortcut: 'Alt+9', icon: BarChart3, badge: 'BI', badgeColor: 'sidebar-badge-blue' },
      ],
    },
    {
      title: 'Comercial & Vendas',
      items: [
        { id: 'budgets', label: 'Orçamentos & Pedidos', shortcut: 'Alt+2', icon: FileText, badge: orders.length, badgeColor: 'sidebar-badge-amber' },
        { id: 'digital_showcase', label: 'Vitrine Online & Catálogo', shortcut: 'Alt+V', icon: ShoppingBag, badge: 'WhatsApp', badgeColor: 'sidebar-badge-emerald' },
        { id: 'visual_simulator', label: 'Simulador Visual na Foto', shortcut: 'Alt+S', icon: Camera, badge: '3D/Foto', badgeColor: 'sidebar-badge-amber' },
        { id: 'finishes_simulator', label: 'Cores & Acabamentos', shortcut: 'Alt+A', icon: Palette, badge: 'RAL', badgeColor: 'sidebar-badge-amber' },
        { id: 'pricing_table', label: 'Tabela de Preços', shortcut: 'Alt+P', icon: DollarSign, badge: 'R$', badgeColor: 'sidebar-badge-emerald' },
        { id: 'romaneio', label: 'Romaneios & Carga', shortcut: 'Alt+8', icon: Truck },
      ],
    },
    {
      title: 'Engenharia & PCP',
      items: [
        { id: 'typologies', label: 'Tipologias & Catálogo', shortcut: 'Alt+T', icon: Grid },
        { id: 'catalogs_library', label: 'Catálogos Técnicos (10 PDFs)', shortcut: 'Alt+C', icon: BookOpen, badge: '10 PDFs', badgeColor: 'sidebar-badge-blue' },
        { id: 'clearance_settings', label: 'Configuração de Folgas', shortcut: 'Alt+F', icon: Sliders, badge: 'ΔL/ΔH', badgeColor: 'sidebar-badge-amber' },
        { id: 'cutting_plan', label: 'Plano de Corte 1D (Barras)', shortcut: 'Alt+3', icon: Scissors },
        { id: 'glass_2d_optimizer', label: 'Plano 2D Chapas Vidro', shortcut: 'Alt+G', icon: Grid, badge: '2D', badgeColor: 'sidebar-badge-blue' },
        { id: 'cnc_studio', label: 'Máquinas CNC / G-Code', shortcut: 'Alt+4', icon: Cpu, badge: 'CNC', badgeColor: 'sidebar-badge-emerald' },
        { id: 'hardware_drill_guide', label: 'Gabaritos de Usinagem 1:1', shortcut: 'Alt+U', icon: Wrench, badge: '1:1', badgeColor: 'sidebar-badge-blue' },
        { id: 'assembly', label: 'Ficha de Montagem', shortcut: 'Alt+7', icon: Wrench },
        { id: 'site_survey', label: 'Medição de Obra (Vãos)', shortcut: 'Alt+M', icon: Ruler, badge: 'Obra', badgeColor: 'sidebar-badge-amber' },
      ],
    },
    {
      title: 'Fábrica & Estoque',
      items: [
        {
          id: 'stock',
          label: 'Controle de Estoque',
          shortcut: 'Alt+5',
          icon: Package,
          badge: totalStockAlerts > 0 ? totalStockAlerts : undefined,
          badgeColor: 'sidebar-badge-amber',
        },
        {
          id: 'production',
          label: 'Serralheria & Kanban',
          shortcut: 'Alt+6',
          icon: Kanban,
          badge: inProductionCount > 0 ? inProductionCount : undefined,
          badgeColor: 'sidebar-badge-blue',
        },
        {
          id: 'qr_labels',
          label: 'Etiquetas & QR Code PCP',
          shortcut: 'Alt+E',
          icon: QrCode,
          badge: 'Zebra',
          badgeColor: 'sidebar-badge-emerald',
        },
      ],
    },
  ];

  return (
    <>
      {/* 1. Sidebar Desktop (Visível apenas em md+) */}
      <aside
        className={`hidden md:flex sidebar-container ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
        aria-label="Menu Principal de Navegação Desktop"
      >
        {/* Topo: Logo & Botão Recolher */}
        <div className="sidebar-header">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="sidebar-brand-link"
            title="Ir para o Painel Geral"
          >
            <img
              src={logoSrc}
              alt={companyProfile.name || "Sanches & Marques"}
              className="sidebar-logo-img"
              onError={(e) => {
                e.currentTarget.src = '/logo-emblem.png';
              }}
            />
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-title">SANCHES & MARQUES</span>
                <span className="sidebar-brand-sub">ESQUADRIAS PRO</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={toggleCollapse}
            className="sidebar-toggle-btn"
            title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navegação Principal */}
        <nav className="sidebar-nav">
          {categories.map((cat) => {
            const isCategoryCollapsed = collapsedCategories[cat.title] || false;

            return (
              <div key={cat.title} className="sidebar-group">
                {!isCollapsed && (
                  <div
                    className="sidebar-group-header"
                    onClick={() => toggleCategory(cat.title)}
                  >
                    <span>{cat.title}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        isCategoryCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </div>
                )}

                {(!isCategoryCollapsed || isCollapsed) && (
                  <div className="flex flex-col gap-1">
                    {cat.items.map((item) => {
                      const isActive = activeTab === item.id;
                      const IconComponent = item.icon;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          className={`sidebar-item ${isActive ? 'active' : ''}`}
                          data-tooltip={`${item.label} (${item.shortcut})`}
                          title={isCollapsed ? `${item.label} (${item.shortcut})` : undefined}
                        >
                          <span className="sidebar-item-icon">
                            <IconComponent className="w-4 h-4" />
                          </span>

                          {!isCollapsed && (
                            <>
                              <span className="truncate flex-1 text-left">{item.label}</span>
                              {item.badge !== undefined && (
                                <span className={`sidebar-badge ${item.badgeColor || 'sidebar-badge-amber'}`}>
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Rodapé: Atalhos Rápidos & Perfil do Sistema */}
        <div className="sidebar-footer">
          {/* Botão Rápido de Backup */}
          <button
            type="button"
            onClick={() => {
              if (onOpenBackupModal) {
                onOpenBackupModal();
              } else {
                window.dispatchEvent(new CustomEvent('desktop-open-backup-modal'));
              }
            }}
            className={`sidebar-item text-xs ${isCollapsed ? 'justify-center p-2' : ''}`}
            data-tooltip="Agendamento de Backup 24h"
            title={isCollapsed ? 'Backup Automático (24h)' : undefined}
          >
            <Database className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-slate-300">Backup 24h</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Ativo
                </span>
              </div>
            )}
          </button>

          {/* Botão Rápido de Identidade / Marca */}
          <button
            type="button"
            onClick={() => {
              if (onOpenBrandingModal) {
                onOpenBrandingModal();
              } else {
                window.dispatchEvent(new CustomEvent('sm_open_branding_modal'));
              }
            }}
            className={`sidebar-item text-xs ${isCollapsed ? 'justify-center p-2' : ''}`}
            data-tooltip="Identidade Visual & Logo"
            title={isCollapsed ? 'Personalizar Logotipo & Dados' : undefined}
          >
            <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
            {!isCollapsed && (
              <span className="font-semibold text-slate-300">Personalizar Marca</span>
            )}
          </button>

          {/* Card do Usuário / Estação */}
          {!isCollapsed && (
            <div className="sidebar-user-card" title="Estação de Trabalho Desktop">
              <div className="sidebar-avatar">
                SM
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">Estação de Trabalho</span>
                <span className="sidebar-user-role">Serralheria & Usinagem</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Gaveta Lateral Mobile (Off-Canvas Drawer com Backdrop) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Escuro */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Painel da Gaveta */}
          <aside
            className="relative z-50 w-72 max-w-[85vw] h-full bg-[#090e17] border-r border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
            aria-label="Menu Mobile Principal"
          >
            {/* Topo Mobile */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src={logoSrc}
                  alt={companyProfile.name || 'Sanches & Marques'}
                  className="h-8 w-auto max-w-[36px] object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/logo-emblem.png';
                  }}
                />
                <div className="flex flex-col text-left">
                  <span className="font-bold text-xs tracking-wider text-white uppercase">SANCHES & MARQUES</span>
                  <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">ESQUADRIAS PRO</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista com todas as categorias e opções no Mobile */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
              {categories.map((cat) => (
                <div key={cat.title} className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {cat.title}
                  </div>
                  <div className="flex flex-col gap-1">
                    {cat.items.map((item) => {
                      const isActive = activeTab === item.id;
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            if (onCloseMobile) onCloseMobile();
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border border-amber-500/40 font-bold'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                          }`}
                        >
                          <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                item.badgeColor === 'sidebar-badge-emerald'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : item.badgeColor === 'sidebar-badge-blue'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Rodapé Mobile com Ações */}
            <div className="p-3 border-t border-slate-800 bg-[#0b111d] flex flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  if (onOpenBackupModal) onOpenBackupModal();
                  else window.dispatchEvent(new CustomEvent('desktop-open-backup-modal'));
                }}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-xs text-slate-300 border border-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Backup 24h</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Ativo
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  if (onOpenBrandingModal) onOpenBrandingModal();
                  else window.dispatchEvent(new CustomEvent('sm_open_branding_modal'));
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-xs text-slate-300 border border-slate-800 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">Personalizar Marca</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
