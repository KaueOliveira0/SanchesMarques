import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ColorFinish, StockProfile, StockAccessory, StockGlass, StockConsumable } from '../types';
import {
  COLOR_SWATCHES,
  PROFILES_CATALOG,
  ACCESSORIES_CATALOG,
  GLASS_CATALOG,
} from '../data/catalog';
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
  Layers,
  Search,
  ShoppingCart,
  CheckCircle,
  PlusCircle,
  X,
  Wrench,
  Sparkles,
  ShieldAlert,
  Boxes,
  FileSpreadsheet,
  TrendingUp,
  BrainCircuit,
  Calendar,
  Clock,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { openPrintWindow, renderCorporatePdfHeader } from '../utils/pdfPrint';
import { exportStockToExcel } from '../utils/excelExport';
import {
  computeStockAlerts,
  validateProfileData,
  validateAccessoryData,
  validateGlassData,
  validateConsumableData,
} from '../utils/stockLogic';
import {
  generatePredictiveStockInsights,
  PredictiveProfileInsight,
  PredictiveStockDashboardSummary,
} from '../utils/predictiveStock';

type StockSubTab = 'profiles' | 'accessories' | 'glass' | 'consumables' | 'predictive';
type AddItemCategory = 'profile' | 'accessory' | 'glass' | 'consumable';

export const StockManager: React.FC = () => {
  const {
    stockProfiles,
    stockAccessories,
    stockGlass,
    stockConsumables = [],
    orders = [],
    addStockProfile,
    deleteStockProfile,
    updateStockProfileQty,
    addRemnantToStock,
    removeRemnantFromStock,
    addStockAccessory,
    deleteStockAccessory,
    updateAccessoryQty,
    addStockGlass,
    deleteStockGlass,
    updateGlassQty,
    addStockConsumable,
    deleteStockConsumable,
    updateConsumableQty,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<StockSubTab>('profiles');
  const [searchTerm, setSearchTerm] = useState('');
  const [consumableFilter, setConsumableFilter] = useState<string>('todos');
  const [predictiveLeadTimeDays, setPredictiveLeadTimeDays] = useState<number>(10);
  const [predictiveFilterUrgency, setPredictiveFilterUrgency] = useState<string>('todos');

  // Cálculo da Análise Preditiva de Demanda e Estoque
  const predictiveSummary: PredictiveStockDashboardSummary = React.useMemo(() => {
    return generatePredictiveStockInsights(stockProfiles, orders, predictiveLeadTimeDays);
  }, [stockProfiles, orders, predictiveLeadTimeDays]);

  // Modal de adição
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addCategory, setAddCategory] = useState<AddItemCategory>('profile');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Formulário para Perfil
  const [profileForm, setProfileForm] = useState({
    code: '',
    name: '',
    series: 'Suprema' as StockProfile['series'],
    color: 'Branco' as ColorFinish,
    kgm: 0.582,
    wholeBarsQty: 10,
    minBarsThreshold: 4,
  });

  // Formulário para Acessório
  const [accessoryForm, setAccessoryForm] = useState({
    code: '',
    name: '',
    category: 'Roldana' as StockAccessory['category'] | any,
    unit: 'un' as StockAccessory['unit'],
    currentQty: 20,
    minQty: 8,
    price: 15.0,
  });

  // Formulário para Vidro
  const [glassForm, setGlassForm] = useState({
    name: '',
    thicknessMm: 6,
    currentAreaM2: 25.0,
    minAreaM2: 10.0,
    pricePerM2: 120.0,
  });

  // Formulário para Consumível / Outros
  const [consumableForm, setConsumableForm] = useState({
    code: '',
    name: '',
    category: 'Selantes & Silicones' as StockConsumable['category'],
    unit: 'tubo' as StockConsumable['unit'],
    currentQty: 24,
    minQty: 6,
    price: 25.0,
    notes: '',
  });

  // Formulário rápido para adicionar retalho
  const [newRemnantCode, setNewRemnantCode] = useState(stockProfiles[0]?.code || 'SU-001');
  const [newRemnantColor, setNewRemnantColor] = useState<ColorFinish>('Branco');
  const [newRemnantLength, setNewRemnantLength] = useState<number>(1500);

  // Alertas
  const alerts = computeStockAlerts(stockProfiles, stockAccessories, stockGlass, stockConsumables);
  const lowProfiles = stockProfiles.filter((p) => p.wholeBarsQty <= p.minBarsThreshold);
  const lowAccessories = stockAccessories.filter((a) => a.currentQty <= a.minQty);
  const lowGlass = stockGlass.filter((g) => g.currentAreaM2 <= g.minAreaM2);
  const lowConsumables = stockConsumables.filter((c) => c.currentQty <= c.minQty);

  // Filtragem
  const filteredProfiles = stockProfiles.filter(
    (p) =>
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.series.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAccessories = stockAccessories.filter(
    (a) =>
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGlass = stockGlass.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConsumables = stockConsumables.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      consumableFilter === 'todos' || c.category === consumableFilter;

    return matchesSearch && matchesCategory;
  });

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Pre-fill perfil ao selecionar template
  const handleSelectProfileTemplate = (profId: string) => {
    const prof = PROFILES_CATALOG.find((p) => p.id === profId);
    if (!prof) return;
    setProfileForm({
      ...profileForm,
      code: prof.code,
      name: prof.name,
      series: prof.series,
      kgm: prof.kgm,
    });
  };

  // Pre-fill acessório ao selecionar template
  const handleSelectAccessoryTemplate = (accId: string) => {
    const acc = ACCESSORIES_CATALOG.find((a) => a.id === accId);
    if (!acc) return;
    setAccessoryForm({
      ...accessoryForm,
      code: acc.code,
      name: acc.name,
      category: acc.category,
      unit: acc.unit,
      price: acc.price,
      minQty: acc.minStock,
    });
  };

  // Pre-fill vidro ao selecionar template
  const handleSelectGlassTemplate = (glassId: string) => {
    const g = GLASS_CATALOG.find((item) => item.id === glassId);
    if (!g) return;
    setGlassForm({
      ...glassForm,
      name: g.name,
      thicknessMm: g.thicknessMm,
      pricePerM2: g.pricePerM2,
    });
  };

  // Submissão do Modal
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (addCategory === 'profile') {
      const validation = validateProfileData(profileForm);
      if (!validation.isValid) {
        showToast(validation.error || 'Dados inválidos do perfil.');
        return;
      }
      addStockProfile({
        code: profileForm.code.trim().toUpperCase(),
        name: profileForm.name.trim(),
        series: profileForm.series,
        color: profileForm.color,
        wholeBarsQty: Number(profileForm.wholeBarsQty) || 0,
        minBarsThreshold: Number(profileForm.minBarsThreshold) || 1,
        kgm: Number(profileForm.kgm) || 0.5,
      });
      showToast(`Perfil ${profileForm.code.toUpperCase()} adicionado ao estoque.`);
      setIsAddModalOpen(false);
      setActiveSubTab('profiles');
    } else if (addCategory === 'accessory') {
      const validation = validateAccessoryData(accessoryForm);
      if (!validation.isValid) {
        showToast(validation.error || 'Dados inválidos do acessório.');
        return;
      }
      addStockAccessory({
        code: accessoryForm.code.trim().toUpperCase(),
        name: accessoryForm.name.trim(),
        category: accessoryForm.category,
        unit: accessoryForm.unit,
        currentQty: Number(accessoryForm.currentQty) || 0,
        minQty: Number(accessoryForm.minQty) || 1,
        price: Number(accessoryForm.price) || 0,
      });
      showToast(`Acessório ${accessoryForm.name} adicionado ao estoque.`);
      setIsAddModalOpen(false);
      setActiveSubTab('accessories');
    } else if (addCategory === 'glass') {
      const validation = validateGlassData(glassForm);
      if (!validation.isValid) {
        showToast(validation.error || 'Dados inválidos do vidro.');
        return;
      }
      addStockGlass({
        name: glassForm.name.trim(),
        thicknessMm: Number(glassForm.thicknessMm) || 6,
        currentAreaM2: Number(glassForm.currentAreaM2) || 0,
        minAreaM2: Number(glassForm.minAreaM2) || 5,
        pricePerM2: Number(glassForm.pricePerM2) || 0,
      });
      showToast(`Chapa de Vidro ${glassForm.name} adicionada ao estoque.`);
      setIsAddModalOpen(false);
      setActiveSubTab('glass');
    } else if (addCategory === 'consumable') {
      const validation = validateConsumableData(consumableForm);
      if (!validation.isValid) {
        showToast(validation.error || 'Dados inválidos do consumível.');
        return;
      }
      addStockConsumable({
        code: consumableForm.code.trim().toUpperCase(),
        name: consumableForm.name.trim(),
        category: consumableForm.category,
        unit: consumableForm.unit,
        currentQty: Number(consumableForm.currentQty) || 0,
        minQty: Number(consumableForm.minQty) || 1,
        price: Number(consumableForm.price) || 0,
        notes: consumableForm.notes.trim(),
      });
      showToast(`Insumo ${consumableForm.name} adicionado ao estoque.`);
      setIsAddModalOpen(false);
      setActiveSubTab('consumables');
    }
  };

  // Gerar Pedido de Compra Formal para Fornecedores
  const handleGeneratePurchaseOrder = () => {
    const profileRows = lowProfiles
      .map((p) => {
        const suggest = p.minBarsThreshold * 2 - p.wholeBarsQty;
        return `
        <tr>
          <td><b>${p.code}</b></td>
          <td>${p.name} (${p.series})</td>
          <td>${p.color}</td>
          <td style="text-align:center; color:#b91c1c; font-weight:bold;">${p.wholeBarsQty} un</td>
          <td style="text-align:center;">${p.minBarsThreshold} un</td>
          <td style="text-align:center; font-weight:bold; color:#0284c7;">${suggest > 0 ? suggest : p.minBarsThreshold} barras (6m)</td>
        </tr>
      `;
      })
      .join('');

    const accRows = lowAccessories
      .map((a) => {
        const suggest = a.minQty * 2 - a.currentQty;
        return `
        <tr>
          <td><b>${a.code}</b></td>
          <td>${a.name}</td>
          <td style="text-align:center; color:#b91c1c; font-weight:bold;">${a.currentQty} ${a.unit}</td>
          <td style="text-align:center;">${a.minQty} ${a.unit}</td>
          <td style="text-align:center; font-weight:bold; color:#0284c7;">${suggest > 0 ? suggest : a.minQty} ${a.unit}</td>
        </tr>
      `;
      })
      .join('');

    const glassRows = lowGlass
      .map((g) => {
        const suggest = Math.round((g.minAreaM2 * 2 - g.currentAreaM2) * 10) / 10;
        return `
        <tr>
          <td><b>${g.name}</b></td>
          <td>Espessura: ${g.thicknessMm} mm</td>
          <td style="text-align:center; color:#b91c1c; font-weight:bold;">${g.currentAreaM2.toFixed(1)} m²</td>
          <td style="text-align:center;">${g.minAreaM2.toFixed(1)} m²</td>
          <td style="text-align:center; font-weight:bold; color:#0284c7;">${suggest > 0 ? suggest : g.minAreaM2} m²</td>
        </tr>
      `;
      })
      .join('');

    const consumableRows = lowConsumables
      .map((c) => {
        const suggest = c.minQty * 2 - c.currentQty;
        return `
        <tr>
          <td><b>${c.code}</b></td>
          <td>${c.name} (${c.category})</td>
          <td style="text-align:center; color:#b91c1c; font-weight:bold;">${c.currentQty} ${c.unit}</td>
          <td style="text-align:center;">${c.minQty} ${c.unit}</td>
          <td style="text-align:center; font-weight:bold; color:#0284c7;">${suggest > 0 ? suggest : c.minQty} ${c.unit}</td>
        </tr>
      `;
      })
      .join('');

    const html = `
      ${renderCorporatePdfHeader({
        docBadge: 'SUPRIMENTOS & COMPRAS',
        docNumber: 'PEDIDO DE REPOSIÇÃO DE ESTOQUE',
        docSubtitle: 'COMPRA AUTOMÁTICA DE MATÉRIA-PRIMA & INSUMOS',
        docDate: new Date().toLocaleDateString('pt-BR'),
      })}

      <div class="card">
        <b>Instruções ao Fornecedor:</b> Faturar e entregar barras de 6.000 mm com acabamento conforme especificado, embaladas individualmente com película protetora, e insumos com laudo de conformidade técnica.
      </div>

      <h3>1. Perfis de Alumínio em Falta ou Abaixo do Mínimo:</h3>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição do Perfil</th>
            <th>Acabamento</th>
            <th style="text-align:center;">Estoque Atual</th>
            <th style="text-align:center;">Mínimo</th>
            <th style="text-align:center;">Sugestão de Compra</th>
          </tr>
        </thead>
        <tbody>
          ${profileRows || '<tr><td colspan="6" style="text-align:center; color:#64748b;">Nenhum perfil em falta.</td></tr>'}
        </tbody>
      </table>

      <h3>2. Acessórios, Roldanas e Vedações a Repor:</h3>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome do Componente</th>
            <th style="text-align:center;">Estoque Atual</th>
            <th style="text-align:center;">Mínimo</th>
            <th style="text-align:center;">Sugestão de Compra</th>
          </tr>
        </thead>
        <tbody>
          ${accRows || '<tr><td colspan="5" style="text-align:center; color:#64748b;">Nenhum acessório em falta.</td></tr>'}
        </tbody>
      </table>

      <h3>3. Chapas de Vidro a Repor:</h3>
      <table>
        <thead>
          <tr>
            <th>Descrição do Vidro</th>
            <th>Espessura</th>
            <th style="text-align:center;">Área em Estoque</th>
            <th style="text-align:center;">Área Mínima</th>
            <th style="text-align:center;">Sugestão de Compra</th>
          </tr>
        </thead>
        <tbody>
          ${glassRows || '<tr><td colspan="5" style="text-align:center; color:#64748b;">Nenhuma chapa de vidro em falta.</td></tr>'}
        </tbody>
      </table>

      <h3>4. Insumos Gerais, Selantes e Fixadores a Repor:</h3>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição do Insumo</th>
            <th style="text-align:center;">Estoque Atual</th>
            <th style="text-align:center;">Mínimo</th>
            <th style="text-align:center;">Sugestão de Compra</th>
          </tr>
        </thead>
        <tbody>
          ${consumableRows || '<tr><td colspan="5" style="text-align:center; color:#64748b;">Nenhum insumo em falta.</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        Gerado pelo Módulo de Controle de Estoque · Sanches&Marques esquadrias
      </div>
    `;

    openPrintWindow(
      html,
      `Sanches&Marques_Esquadrias_Pedido_Compra_Fornecedor_${new Date().toISOString().slice(0, 10)}`
    );
  };

  const openAddModalWithCategory = (cat: AddItemCategory) => {
    setAddCategory(cat);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-950 border border-emerald-600 text-emerald-200 rounded-xl shadow-2xl text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>Controle de Estoque & Matéria-Prima</span>
          </h1>
          <p className="text-xs text-slate-400">
            Gerenciamento completo de perfis de alumínio (barras de 6m e retalhos), acessórios, chapas de vidro e insumos gerais
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (activeSubTab === 'profiles') openAddModalWithCategory('profile');
              else if (activeSubTab === 'accessories') openAddModalWithCategory('accessory');
              else if (activeSubTab === 'glass') openAddModalWithCategory('glass');
              else openAddModalWithCategory('consumable');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Adicionar Novo Item</span>
          </button>

          <button
            onClick={() => exportStockToExcel(stockProfiles, stockAccessories, stockGlass, stockConsumables)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 text-xs font-bold transition-all cursor-pointer shadow-md"
            title="Exportar inventário completo e balanço contábil em planilha Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Estoque (.xlsx)</span>
          </button>

          {alerts.totalAlerts > 0 && (
            <button
              onClick={handleGeneratePurchaseOrder}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Gerar Pedido de Compras ({alerts.totalAlerts} alertas)</span>
            </button>
          )}
        </div>
      </div>

      {/* Navegação entre Abas do Estoque */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveSubTab('profiles')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'profiles'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Perfis de Alumínio ({stockProfiles.length})</span>
            {alerts.lowProfilesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('accessories')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'accessories'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Acessórios & Vedações ({stockAccessories.length})</span>
            {alerts.lowAccessoriesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('glass')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'glass'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Chapas de Vidro ({stockGlass.length})</span>
            {alerts.lowGlassCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('consumables')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'consumables'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Insumos & Outros ({stockConsumables.length})</span>
            {alerts.lowConsumablesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('predictive')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'predictive'
                ? 'bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-amber-300 hover:text-amber-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Análise Preditiva & Reposição (PCP)</span>
            {predictiveSummary.criticalCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold animate-pulse">
                {predictiveSummary.criticalCount} críticos
              </span>
            ) : predictiveSummary.alertCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-bold">
                {predictiveSummary.alertCount} alerta
              </span>
            ) : null}
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar código, nome ou insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* 1. ABA DE PERFIS E RETALHOS */}
      {activeSubTab === 'profiles' && (
        <div className="space-y-6">
          {/* Tabela de Barras de 6 Metros */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">
                  Barras Inteiras de Alumínio (6.000 mm)
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {stockProfiles.reduce((s, p) => s + p.wholeBarsQty, 0)} barras no total
                </span>
              </div>

              <button
                onClick={() => openAddModalWithCategory('profile')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Perfil</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Nome do Perfil</th>
                    <th className="py-3 px-4">Linha</th>
                    <th className="py-3 px-4">Acabamento</th>
                    <th className="py-3 px-4">Peso Linear</th>
                    <th className="py-3 px-4 text-center">Estoque Atual</th>
                    <th className="py-3 px-4 text-center">Retalhos</th>
                    <th className="py-3 px-4 text-right">Ajustar / Excluir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Nenhum perfil encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => {
                      const isLow = p.wholeBarsQty <= p.minBarsThreshold;

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isLow ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                            {p.code}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-100">{p.name}</div>
                            {isLow && (
                              <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                Abaixo do limite de segurança ({p.minBarsThreshold} barras)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400">{p.series}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-slate-600"
                                style={{ backgroundColor: COLOR_SWATCHES[p.color] || '#fff' }}
                              ></span>
                              {p.color}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">{p.kgm.toFixed(3)} kg/m</td>
                          <td className="py-3 px-4 text-center font-bold text-sm">
                            <span
                              className={
                                isLow
                                  ? 'text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800'
                                  : 'text-slate-100'
                              }
                            >
                              {p.wholeBarsQty} barras
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-emerald-400">
                            {p.remnants && p.remnants.length > 0
                              ? `${p.remnants.length} retalho(s)`
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => updateStockProfileQty(p.id, -1)}
                                title="Dar saída de 1 barra (6m)"
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => updateStockProfileQty(p.id, 1)}
                                title="Dar entrada de 1 barra (6m)"
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Excluir o perfil ${p.code} (${p.name} - ${p.color}) do catálogo de estoque?`
                                    )
                                  ) {
                                    deleteStockProfile(p.id);
                                    showToast(`Perfil ${p.code} removido do estoque.`);
                                  }
                                }}
                                title="Remover perfil do estoque"
                                className="p-1 rounded bg-slate-850 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catálogo de Retalhos / Sobras Úteis */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-emerald-400">♻️</span>
                  <span>Catálogo de Retalhos & Sobras Reutilizáveis</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Sobras &gt;= 300 mm cadastradas para reaproveitamento nos próximos planos de corte
                </p>
              </div>

              {/* Formulário Rápido para Adicionar Retalho Manual */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <select
                  value={newRemnantCode}
                  onChange={(e) => setNewRemnantCode(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                >
                  {stockProfiles.map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>

                <select
                  value={newRemnantColor}
                  onChange={(e) => setNewRemnantColor(e.target.value as ColorFinish)}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                >
                  {(['Branco', 'Preto', 'Bronze', 'Natural', 'Amadeirado'] as ColorFinish[]).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Comp. (mm)"
                  value={newRemnantLength}
                  onChange={(e) => setNewRemnantLength(Number(e.target.value))}
                  className="w-24 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (newRemnantLength < 300) {
                      showToast('Comprimento mínimo do retalho é de 300 mm.');
                      return;
                    }
                    addRemnantToStock(newRemnantCode, newRemnantColor, newRemnantLength);
                    showToast(`Retalho de ${newRemnantLength}mm (${newRemnantCode}) registrado.`);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
                >
                  + Adicionar Retalho
                </button>
              </div>
            </div>

            {/* Grid dos Retalhos em Estoque */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(() => {
                const allRemnants: Array<{
                  profileId: string;
                  code: string;
                  color: string;
                  remId: string;
                  lengthMm: number;
                  date: string;
                }> = [];
                stockProfiles.forEach((p) => {
                  if (p.remnants) {
                    p.remnants.forEach((r) => {
                      allRemnants.push({
                        profileId: p.id,
                        code: p.code,
                        color: p.color,
                        remId: r.id,
                        lengthMm: r.lengthMm,
                        date: r.registeredAt,
                      });
                    });
                  }
                });

                if (allRemnants.length === 0) {
                  return (
                    <div className="col-span-4 py-8 text-center text-slate-500 text-xs">
                      Nenhum retalho registrado no momento.
                    </div>
                  );
                }

                return allRemnants.map((rem) => (
                  <div
                    key={rem.remId}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-cyan-400">{rem.code}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {rem.color}
                        </span>
                      </div>
                      <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                        {rem.lengthMm} mm
                      </div>
                      <div className="text-[10px] text-slate-500">Cadastrado em {rem.date}</div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Remover retalho de ${rem.lengthMm}mm (${rem.code}) do estoque?`)) {
                          removeRemnantFromStock(rem.profileId, rem.remId);
                        }
                      }}
                      title="Descartar retalho"
                      className="p-1.5 rounded-lg bg-slate-850 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 2. ABA DE ACESSÓRIOS E FERRAGENS */}
      {activeSubTab === 'accessories' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">
                Acessórios, Roldanas, Fechos & Vedações
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {stockAccessories.length} itens cadastrados
              </span>
            </div>

            <button
              onClick={() => openAddModalWithCategory('accessory')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Acessório</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Nome do Componente</th>
                  <th className="py-3 px-4">Unidade</th>
                  <th className="py-3 px-4">Preço Médio</th>
                  <th className="py-3 px-4 text-center">Saldo em Estoque</th>
                  <th className="py-3 px-4 text-center">Estoque Mínimo</th>
                  <th className="py-3 px-4 text-right">Ajustar / Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredAccessories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Nenhum acessório encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredAccessories.map((a) => {
                    const isLow = a.currentQty <= a.minQty;

                    return (
                      <tr
                        key={a.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isLow ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                          {a.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-100">{a.name}</div>
                          {isLow && (
                            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              Abaixo do estoque mínimo ({a.minQty} {a.unit})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 uppercase text-slate-400 font-mono">{a.unit}</td>
                        <td className="py-3 px-4 font-semibold text-slate-300">
                          R$ {a.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-sm">
                          <span
                            className={
                              isLow
                                ? 'text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800'
                                : 'text-slate-100'
                            }
                          >
                            {a.currentQty} {a.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">
                          {a.minQty} {a.unit}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => updateAccessoryQty(a.id, -5)}
                              title="Dar saída de 5 unidades"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => updateAccessoryQty(a.id, 5)}
                              title="Dar entrada de 5 unidades"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Excluir o acessório ${a.name} (${a.code}) do estoque?`)) {
                                  deleteStockAccessory(a.id);
                                  showToast(`Acessório ${a.name} removido do estoque.`);
                                }
                              }}
                              title="Excluir acessório do estoque"
                              className="p-1 rounded bg-slate-850 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ABA DE CHAPAS DE VIDRO */}
      {activeSubTab === 'glass' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">
                Chapas de Vidro Float, Temperado, Laminado & Espelhos
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {stockGlass.reduce((s, g) => s + g.currentAreaM2, 0).toFixed(1)} m² no total
              </span>
            </div>

            <button
              onClick={() => openAddModalWithCategory('glass')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Chapa de Vidro</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tipo de Vidro</th>
                  <th className="py-3 px-4">Espessura (mm)</th>
                  <th className="py-3 px-4">Preço Médio (R$/m²)</th>
                  <th className="py-3 px-4 text-center">Área em Estoque</th>
                  <th className="py-3 px-4 text-center">Área Mínima</th>
                  <th className="py-3 px-4 text-right">Ajustar Saldo (m²) / Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredGlass.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Nenhuma chapa de vidro encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredGlass.map((g) => {
                    const isLow = g.currentAreaM2 <= g.minAreaM2;

                    return (
                      <tr
                        key={g.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isLow ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-100">{g.name}</div>
                          {isLow && (
                            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              Abaixo da área mínima de segurança ({g.minAreaM2.toFixed(1)} m²)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono">{g.thicknessMm} mm</td>
                        <td className="py-3 px-4 font-semibold text-slate-300">
                          R$ {g.pricePerM2.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-sm">
                          <span
                            className={
                              isLow
                                ? 'text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800'
                                : 'text-slate-100'
                            }
                          >
                            {g.currentAreaM2.toFixed(1)} m²
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">
                          {g.minAreaM2.toFixed(1)} m²
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => updateGlassQty(g.id, -5)}
                              title="Dar saída de 5m²"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => updateGlassQty(g.id, 5)}
                              title="Dar entrada de 5m²"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Excluir a chapa de vidro "${g.name}" do estoque?`)) {
                                  deleteStockGlass(g.id);
                                  showToast(`Vidro ${g.name} removido do estoque.`);
                                }
                              }}
                              title="Excluir chapa de vidro do estoque"
                              className="p-1 rounded bg-slate-850 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ABA DE INSUMOS & OUTROS ("outras coisas") */}
      {activeSubTab === 'consumables' && (
        <div className="space-y-4">
          {/* Barra de Filtro de Categorias de Insumos */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'todos', label: 'Todos os Insumos' },
                { id: 'Selantes & Silicones', label: 'Selantes & Silicones' },
                { id: 'Fixadores & Parafusos', label: 'Fixadores & Parafusos' },
                { id: 'Embalagem & Proteção', label: 'Embalagem & Proteção' },
                { id: 'Consumíveis & Oficina', label: 'Oficina & Ferramental' },
                { id: 'Fitas & Vedação', label: 'Fitas & Adesivos' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setConsumableFilter(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    consumableFilter === cat.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => openAddModalWithCategory('consumable')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Novo Insumo</span>
            </button>
          </div>

          {/* Tabela de Insumos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Código / Ref</th>
                    <th className="py-3 px-4">Nome do Insumo / Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Unidade</th>
                    <th className="py-3 px-4">Preço Médio</th>
                    <th className="py-3 px-4 text-center">Saldo em Estoque</th>
                    <th className="py-3 px-4 text-center">Mínimo</th>
                    <th className="py-3 px-4 text-right">Ajustar Saldo / Excluir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredConsumables.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Nenhum insumo encontrado nesta categoria.
                      </td>
                    </tr>
                  ) : (
                    filteredConsumables.map((c) => {
                      const isLow = c.currentQty <= c.minQty;

                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isLow ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                            {c.code}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-100">{c.name}</div>
                            {c.notes && (
                              <div className="text-[11px] text-slate-400">{c.notes}</div>
                            )}
                            {isLow && (
                              <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                Reposição urgente recomendada ({c.minQty} {c.unit} mín)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                              {c.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono uppercase text-slate-400">
                            {c.unit}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-300">
                            R$ {c.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-sm">
                            <span
                              className={
                                isLow
                                  ? 'text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800'
                                  : 'text-slate-100'
                              }
                            >
                              {c.currentQty} {c.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-400 font-mono">
                            {c.minQty} {c.unit}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => updateConsumableQty(c.id, -1)}
                                title="Dar saída de 1 unidade"
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => updateConsumableQty(c.id, 1)}
                                title="Dar entrada de 1 unidade"
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Excluir o insumo "${c.name}" do estoque?`)) {
                                    deleteStockConsumable(c.id);
                                    showToast(`Insumo ${c.name} removido do estoque.`);
                                  }
                                }}
                                title="Excluir insumo do estoque"
                                className="p-1 rounded bg-slate-850 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. ABA DE ANÁLISE PREDITIVA DE ESTOQUE & PONTO DE PEDIDO */}
      {activeSubTab === 'predictive' && (
        <div className="space-y-6">
          {/* Topo do Dashboard Preditivo com KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] text-slate-400 block font-semibold">Perfis Monitorados</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {predictiveSummary.totalProfilesMonitored}
              </span>
              <span className="text-[10px] text-slate-500">linhas Suprema, Gold e 25</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] text-rose-400 block font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Risco Crítico (≤ 5 dias)</span>
              </span>
              <span className="text-2xl font-black text-rose-400 mt-1 block animate-pulse">
                {predictiveSummary.criticalCount}
              </span>
              <span className="text-[10px] text-rose-300/80">risco de paralisação</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] text-amber-400 block font-semibold">Em Ponto de Pedido</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                {predictiveSummary.alertCount}
              </span>
              <span className="text-[10px] text-amber-300/80">comprar nos próx. dias</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] text-cyan-400 block font-semibold">Barras a Comprar</span>
              <span className="text-2xl font-black text-cyan-400 mt-1 block">
                {predictiveSummary.totalBarsToBuy} un
              </span>
              <span className="text-[10px] text-slate-500">barras padrão 6 metros</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-[11px] text-emerald-400 block font-semibold">Investimento Sugerido</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">
                R$ {predictiveSummary.totalSuggestedInvestmentR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500">repor lote econômico</span>
            </div>
          </div>

          {/* Barra de Simulação de Lead Time do Fornecedor e Filtros de Urgência */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Simulador de Lead Time da Extrusora:</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { days: 7, label: '7 dias (Express)' },
                  { days: 10, label: '10 dias (Padrão)' },
                  { days: 15, label: '15 dias (Extrusão)' },
                  { days: 21, label: '21 dias (Anodizado)' },
                ].map((lt) => (
                  <button
                    key={lt.days}
                    type="button"
                    onClick={() => {
                      setPredictiveLeadTimeDays(lt.days);
                      showToast(`Lead time simulado ajustado para ${lt.days} dias.`);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      predictiveLeadTimeDays === lt.days
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro de Urgência */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['todos', 'CRITICO', 'ALERTA', 'ATENCAO', 'SAUDAVEL'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPredictiveFilterUrgency(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer uppercase ${
                    predictiveFilterUrgency === lvl
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Ações de Exportação */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportStockToExcel(stockProfiles, stockAccessories, stockGlass, stockConsumables)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar (.xlsx)</span>
              </button>
              <button
                onClick={handleGeneratePurchaseOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Imprimir Pedido Fornecedor</span>
              </button>
            </div>
          </div>

          {/* Tabela Preditiva Detalhada */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Código / Perfil</th>
                    <th className="py-3 px-4">Linha & Acabamento</th>
                    <th className="py-3 px-4 text-center">Estoque Atual</th>
                    <th className="py-3 px-4 text-center">Consumo Diário</th>
                    <th className="py-3 px-4 text-center">Ponto de Pedido (ROP)</th>
                    <th className="py-3 px-4 text-center">Dias até Ruptura</th>
                    <th className="py-3 px-4 text-center">Compra Sugerida</th>
                    <th className="py-3 px-4 text-right">Custo Estimado</th>
                    <th className="py-3 px-4 text-right">Reposição Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {predictiveSummary.topPriorityProfiles
                    .filter((p) => {
                      if (predictiveFilterUrgency !== 'todos' && p.urgencyLevel !== predictiveFilterUrgency) {
                        return false;
                      }
                      if (searchTerm) {
                        const term = searchTerm.toLowerCase();
                        return (
                          p.profileCode.toLowerCase().includes(term) ||
                          p.profileName.toLowerCase().includes(term) ||
                          p.series.toLowerCase().includes(term)
                        );
                      }
                      return true;
                    })
                    .map((item) => {
                      const isCritical = item.urgencyLevel === 'CRITICO';
                      const isAlert = item.urgencyLevel === 'ALERTA';

                      return (
                        <tr
                          key={item.profileCode}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isCritical ? 'bg-rose-950/20' : isAlert ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-cyan-400 text-sm block">
                              {item.profileCode}
                            </span>
                            <span className="text-[11px] text-slate-300">{item.profileName}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold text-[11px] mr-1.5">
                              {item.series}
                            </span>
                            <span className="text-[11px] text-slate-400">{item.color}</span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-white text-sm block">
                              {item.currentBarsQty} barras
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {item.currentMeters}m lineares
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="font-mono font-semibold text-slate-200 block">
                              {item.dailyConsumptionMeters.toFixed(1)} m/dia
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ~{item.monthlyDemandMeters}m/mês
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="font-mono font-bold text-amber-300 block">
                              {item.reorderPointBars} barras
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({item.reorderPointMeters}m)
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1 font-mono ${
                                item.daysUntilStockout <= 5
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                                  : item.daysUntilStockout <= 12
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : item.daysUntilStockout <= 20
                                  ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{item.daysUntilStockout} dias</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="font-extrabold text-cyan-300 text-sm block">
                              +{item.suggestedPurchaseBars} barras
                            </span>
                            <span className="text-[10px] text-slate-400">lote econômico</span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className="font-bold text-emerald-400 block">
                              R$ {item.estimatedPurchaseCostR$.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.supplierRecommended}</span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                const prof = stockProfiles.find((p) => p.code === item.profileCode);
                                if (prof) {
                                  updateStockProfileQty(prof.id, 10);
                                  showToast(`+10 barras adicionadas a ${item.profileCode}`);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-cyan-400 text-xs font-bold transition-all cursor-pointer"
                            >
                              +10 barras
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO NO ESTOQUE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {/* Topo do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Adicionar Item ao Estoque Sanches & Marques
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seleção do Tipo de Item */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Selecione o que deseja adicionar:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'profile', label: 'Perfil de Alumínio', icon: Layers },
                  { id: 'accessory', label: 'Acessório / Ferragem', icon: Package },
                  { id: 'glass', label: 'Chapa de Vidro', icon: Boxes },
                  { id: 'consumable', label: 'Insumo / Outros', icon: Wrench },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = addCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAddCategory(item.id as AddItemCategory)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FORMULÁRIO DINÂMICO CONFORME A CATEGORIA */}
            <form onSubmit={handleAddItemSubmit} className="space-y-4">
              {/* 1. SE PERFIL DE ALUMÍNIO */}
              {addCategory === 'profile' && (
                <div className="space-y-4">
                  {/* Seletor rápido de Catálogo Padrão */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Importar do Catálogo Padrão (Opcional):</span>
                    </span>
                    <select
                      onChange={(e) => handleSelectProfileTemplate(e.target.value)}
                      defaultValue=""
                      className="w-full sm:w-auto px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    >
                      <option value="">Selecione um perfil padrão para preencher...</option>
                      {PROFILES_CATALOG.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name} ({p.series})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Código do Perfil *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: SU-001, GL-005, MN-053..."
                        value={profileForm.code}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, code: e.target.value.toUpperCase() })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Linha / Série *
                      </label>
                      <select
                        value={profileForm.series}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            series: e.target.value as StockProfile['series'],
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Suprema">Linha Suprema</option>
                        <option value="Gold">Linha Gold</option>
                        <option value="Linha 25">Linha 25</option>
                        <option value="Linha 30">Linha 30</option>
                        <option value="Integrada">Integrada Persiana</option>
                        <option value="Fachada">Fachada Pele de Vidro</option>
                        <option value="Universal">Universal / Tubular</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nome / Descrição do Perfil *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Marco Lateral 2 Planos, Trilho Inferior..."
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Acabamento / Cor *
                      </label>
                      <select
                        value={profileForm.color}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            color: e.target.value as ColorFinish,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Branco">Branco Eletrostático</option>
                        <option value="Preto">Preto Anodizado / Fosco</option>
                        <option value="Bronze">Bronze 1003 / 1004</option>
                        <option value="Natural">Natural Fosco (Anodizado)</option>
                        <option value="Amadeirado">Pintura Efeito Madeira</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Peso Linear (kg por metro) *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0.01"
                        required
                        value={profileForm.kgm}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, kgm: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Quantidade de Barras (6.000 mm) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={profileForm.wholeBarsQty}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            wholeBarsQty: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Estoque Mínimo de Segurança *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={profileForm.minBarsThreshold}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            minBarsThreshold: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SE ACESSÓRIO / FERRAGEM */}
              {addCategory === 'accessory' && (
                <div className="space-y-4">
                  {/* Seletor rápido de Catálogo Padrão */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Importar do Catálogo Padrão:</span>
                    </span>
                    <select
                      onChange={(e) => handleSelectAccessoryTemplate(e.target.value)}
                      defaultValue=""
                      className="w-full sm:w-auto px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    >
                      <option value="">Selecione um acessório para preencher...</option>
                      {ACCESSORIES_CATALOG.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Código do Acessório *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: ROL-SUP-01, FEC-CON-02..."
                        value={accessoryForm.code}
                        onChange={(e) =>
                          setAccessoryForm({ ...accessoryForm, code: e.target.value.toUpperCase() })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Categoria *
                      </label>
                      <select
                        value={accessoryForm.category}
                        onChange={(e) =>
                          setAccessoryForm({
                            ...accessoryForm,
                            category: e.target.value as StockAccessory['category'],
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Roldana">Roldanas & Carrinhos</option>
                        <option value="Fecho">Fechos & Conchas</option>
                        <option value="Vedação">Escovas & Borrachas de Vedação</option>
                        <option value="Fechadura">Fechaduras & Cilindros</option>
                        <option value="Braço">Braços de Articulação (Maxim-Ar)</option>
                        <option value="Motor">Motores Tubulares / Automação</option>
                        <option value="Parafusos">Parafusos & Fixadores</option>
                        <option value="Outros">Outros Acessórios</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nome / Descrição do Componente *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Roldana Dupla com Rolamento de Nylon, Fecho Concha..."
                        value={accessoryForm.name}
                        onChange={(e) =>
                          setAccessoryForm({ ...accessoryForm, name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Unidade de Medida *
                      </label>
                      <select
                        value={accessoryForm.unit}
                        onChange={(e) =>
                          setAccessoryForm({
                            ...accessoryForm,
                            unit: e.target.value as StockAccessory['unit'],
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="un">Unidade (un)</option>
                        <option value="m">Metro linear (m)</option>
                        <option value="par">Par</option>
                        <option value="kit">Kit Completo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Preço Médio de Custo (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={accessoryForm.price}
                        onChange={(e) =>
                          setAccessoryForm({
                            ...accessoryForm,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Quantidade Atual em Estoque *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={accessoryForm.currentQty}
                        onChange={(e) =>
                          setAccessoryForm({
                            ...accessoryForm,
                            currentQty: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Estoque Mínimo de Segurança *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={accessoryForm.minQty}
                        onChange={(e) =>
                          setAccessoryForm({
                            ...accessoryForm,
                            minQty: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SE CHAPA DE VIDRO */}
              {addCategory === 'glass' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Importar do Catálogo de Vidros:</span>
                    </span>
                    <select
                      onChange={(e) => handleSelectGlassTemplate(e.target.value)}
                      defaultValue=""
                      className="w-full sm:w-auto px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    >
                      <option value="">Selecione um tipo padrão para preencher...</option>
                      {GLASS_CATALOG.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.thicknessMm}mm)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nome / Descrição da Chapa de Vidro *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Vidro Laminado 4+4mm Incolor, Temperado 8mm Fumê..."
                        value={glassForm.name}
                        onChange={(e) => setGlassForm({ ...glassForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Espessura (mm) *
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="32"
                        required
                        value={glassForm.thicknessMm}
                        onChange={(e) =>
                          setGlassForm({
                            ...glassForm,
                            thicknessMm: parseInt(e.target.value, 10) || 6,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Preço por m² (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={glassForm.pricePerM2}
                        onChange={(e) =>
                          setGlassForm({
                            ...glassForm,
                            pricePerM2: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Área em Estoque (m²) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        value={glassForm.currentAreaM2}
                        onChange={(e) =>
                          setGlassForm({
                            ...glassForm,
                            currentAreaM2: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Área Mínima de Segurança (m²) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        required
                        value={glassForm.minAreaM2}
                        onChange={(e) =>
                          setGlassForm({
                            ...glassForm,
                            minAreaM2: parseFloat(e.target.value) || 5,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. SE INSUMO / OUTROS ("e outras coisas") */}
              {addCategory === 'consumable' && (
                <div className="space-y-4">
                  {/* Sugestões rápidas para um clique */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400 font-semibold block">
                      Sugestões de materiais comuns para preenchimento rápido:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { code: 'SIL-NEU-PT', name: 'Silicone Neutro Preto 280ml', cat: 'Selantes & Silicones', unit: 'tubo', price: 24.5 },
                        { code: 'PU40-BR', name: 'PU40 Construção Branco 400g', cat: 'Selantes & Silicones', unit: 'tubo', price: 28.0 },
                        { code: 'PAR-INOX-42', name: 'Parafuso Auto Brocante Inox 4.2x25', cat: 'Fixadores & Parafusos', unit: 'cento', price: 42.0 },
                        { code: 'REB-REP-416', name: 'Rebite Repuxo Alumínio 4.0x16', cat: 'Fixadores & Parafusos', unit: 'cento', price: 26.0 },
                        { code: 'FITA-VHB-25', name: 'Fita Dupla Face VHB 25mm x 33m', cat: 'Fitas & Vedação', unit: 'rolo', price: 110.0 },
                        { code: 'DISC-COR-350', name: 'Disco Serra Alumínio 350mm Vídea', cat: 'Consumíveis & Oficina', unit: 'un', price: 390.0 },
                      ].map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setConsumableForm({
                              ...consumableForm,
                              code: sug.code,
                              name: sug.name,
                              category: sug.cat as any,
                              unit: sug.unit as any,
                              price: sug.price,
                            });
                          }}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          + {sug.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Código / Referência *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: SIL-NEU-PT, PAR-4219..."
                        value={consumableForm.code}
                        onChange={(e) =>
                          setConsumableForm({
                            ...consumableForm,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Categoria do Insumo *
                      </label>
                      <select
                        value={consumableForm.category}
                        onChange={(e) =>
                          setConsumableForm({
                            ...consumableForm,
                            category: e.target.value as StockConsumable['category'],
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Selantes & Silicones">Selantes & Silicones</option>
                        <option value="Fixadores & Parafusos">Fixadores, Parafusos & Rebites</option>
                        <option value="Embalagem & Proteção">Embalagem, Filme & Proteção</option>
                        <option value="Consumíveis & Oficina">Oficina, Discos de Corte & Ferramentas</option>
                        <option value="Fitas & Vedação">Fitas Dupla Face & Adesivos</option>
                        <option value="Outros">Outros Insumos Gerais</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nome do Insumo / Descrição Técnica *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Silicone Neutro Oxímico Preto 280ml, Disco de Corte 350mm..."
                        value={consumableForm.name}
                        onChange={(e) =>
                          setConsumableForm({ ...consumableForm, name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Unidade de Fornecimento *
                      </label>
                      <select
                        value={consumableForm.unit}
                        onChange={(e) =>
                          setConsumableForm({
                            ...consumableForm,
                            unit: e.target.value as StockConsumable['unit'],
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="un">Unidade (un)</option>
                        <option value="tubo">Tubo / Cartucho</option>
                        <option value="cx">Caixa (cx)</option>
                        <option value="rolo">Rolo</option>
                        <option value="cento">Cento (100 un)</option>
                        <option value="kg">Quilo (kg)</option>
                        <option value="l">Litro (l)</option>
                        <option value="par">Par</option>
                        <option value="m">Metro (m)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Preço Unitário Médio (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={consumableForm.price}
                        onChange={(e) =>
                          setConsumableForm({
                            ...consumableForm,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Quantidade Atual no Estoque *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={consumableForm.currentQty}
                        onChange={(e) =>
                          setConsumableForm({
                            ...consumableForm,
                            currentQty: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Ponto de Reposição Mínimo *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={consumableForm.minQty}
                        onChange={(e) =>
                          setConsumableForm({
                            ...consumableForm,
                            minQty: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Aplicação / Observações Técnicas (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Utilizado na serra de esquadria ou na colagem de pingadeiras"
                        value={consumableForm.notes}
                        onChange={(e) =>
                          setConsumableForm({ ...consumableForm, notes: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botões do Rodapé do Modal */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  Confirmar e Cadastrar no Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
