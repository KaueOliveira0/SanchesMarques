import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Save,
  Camera,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  RotateCcw,
  Layers,
  Palette,
  Package,
  Check,
  ChevronDown,
  Percent,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PricingOcrModal } from './PricingOcrModal';
import {
  saveProfilesCustomPrices,
  saveGlassCustomPrices,
  saveAccessoriesCustomPrices,
  saveColorMultipliers,
} from '../utils/pricingCatalog';
import { PROFILES_CATALOG } from '../data/catalog';

interface DynamicPricingManagerProps {
  showGlobalToast: (msg: string) => void;
}

export const DynamicPricingManager: React.FC<DynamicPricingManagerProps> = ({
  showGlobalToast,
}) => {
  const {
    customProfiles,
    setCustomProfiles,
    customGlass,
    setCustomGlass,
    customAccessories,
    setCustomAccessories,
    colorMultipliers,
    setColorMultipliers,
  } = useApp();

  // Modal de OCR
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // Filtros de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Reajuste em massa (+% ou -%)
  const [bulkAdjustmentPct, setBulkAdjustmentPct] = useState<number>(0);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Salva tudo no localStorage
  const handleSaveAll = () => {
    saveProfilesCustomPrices(customProfiles);
    saveGlassCustomPrices(customGlass);
    saveAccessoriesCustomPrices(customAccessories);
    saveColorMultipliers(colorMultipliers);
    showGlobalToast('Todas as tabelas de preços e multiplicadores foram salvas!');
  };

  // Reajuste percentual em massa para todos os perfis filtrados
  const handleApplyBulkAdjustment = () => {
    if (bulkAdjustmentPct === 0) return;
    const factor = 1 + bulkAdjustmentPct / 100;
    const nextProfiles = customProfiles.map((p) => {
      // Aplica apenas nos filtrados se houver filtro, ou em todos
      const matchesSeries = seriesFilter === 'ALL' || p.series === seriesFilter;
      if (!matchesSeries) return p;
      return {
        ...p,
        pricePerKg: Number((p.pricePerKg * factor).toFixed(2)),
      };
    });

    setCustomProfiles(nextProfiles);
    saveProfilesCustomPrices(nextProfiles);
    showGlobalToast(
      `Reajuste de ${bulkAdjustmentPct > 0 ? '+' : ''}${bulkAdjustmentPct}% aplicado com sucesso!`
    );
    setBulkAdjustmentPct(0);
    setIsBulkOpen(false);
  };

  // Restaura preços de fábrica
  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'Deseja restaurar todos os preços de perfis para os valores padrão de fábrica do catálogo?'
      )
    ) {
      setCustomProfiles(PROFILES_CATALOG);
      saveProfilesCustomPrices(PROFILES_CATALOG);
      showGlobalToast('Preços de perfis restaurados para os padrões originais de fábrica.');
    }
  };

  // Lista de séries disponíveis
  const availableSeries = useMemo(() => {
    const set = new Set<string>();
    customProfiles.forEach((p) => {
      if (p.series) set.add(p.series);
    });
    return Array.from(set);
  }, [customProfiles]);

  // Lista de categorias disponíveis
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    customProfiles.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [customProfiles]);

  // Filtragem dos perfis
  const filteredProfiles = useMemo(() => {
    return customProfiles.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeries = seriesFilter === 'ALL' || p.series === seriesFilter;
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchesSearch && matchesSeries && matchesCategory;
    });
  }, [customProfiles, searchTerm, seriesFilter, categoryFilter]);

  // Estatísticas da tabela
  const stats = useMemo(() => {
    const total = customProfiles.length;
    const avg =
      total > 0
        ? Number(
            (customProfiles.reduce((acc, p) => acc + p.pricePerKg, 0) / total).toFixed(2)
          )
        : 0;
    const min =
      total > 0 ? Math.min(...customProfiles.map((p) => p.pricePerKg)) : 0;
    const max =
      total > 0 ? Math.max(...customProfiles.map((p) => p.pricePerKg)) : 0;
    return { total, avg, min, max };
  }, [customProfiles]);

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">
                Tabela Dinâmica de Preços & Matriz de Extrusão
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {stats.total} Perfis Cadastrados
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Altere os valores por kg de alumínio, m² de vidro, acessórios e acréscimos por acabamento de pintura ou anodização.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão de Destaque: Leitura OCR de Prints */}
          <button
            type="button"
            onClick={() => setIsOcrModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/40 hover:scale-[1.02] cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Leitura OCR de Tabela (Print / Imagem)</span>
          </button>

          {/* Botão de Salvar */}
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Salvar Tudo</span>
          </button>
        </div>
      </div>

      {/* Cartões de Indicadores de Custo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-sans text-[11px] block">Média R$/kg Alumínio</span>
            <span className="text-lg font-black text-white">R$ {stats.avg.toFixed(2)}</span>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-400 opacity-60" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-sans text-[11px] block">Faixa de Preço (Min - Max)</span>
            <span className="text-lg font-black text-amber-400">
              R$ {stats.min.toFixed(0)} - {stats.max.toFixed(0)}
            </span>
          </div>
          <DollarSign className="w-5 h-5 text-amber-400 opacity-60" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-sans text-[11px] block">Linhas Ativas</span>
            <span className="text-lg font-black text-cyan-400">{availableSeries.length} Séries</span>
          </div>
          <Layers className="w-5 h-5 text-cyan-400 opacity-60" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-sans text-[11px] block">Cores de Acabamento</span>
            <span className="text-lg font-black text-purple-400">
              {Object.keys(colorMultipliers).length} Tipos
            </span>
          </div>
          <Palette className="w-5 h-5 text-purple-400 opacity-60" />
        </div>
      </div>

      {/* Multiplicadores por Acabamento / Cor de Pintura */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Multiplicadores por Acabamento / Cor de Pintura
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Fator multiplicador aplicado sobre o valor base do perfil de alumínio.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
          {Object.entries(colorMultipliers).map(([clr, mult]) => {
            const sampleBase = stats.avg || 35.0;
            const computedPrice = (sampleBase * mult).toFixed(2);
            return (
              <div
                key={clr}
                className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold font-sans">{clr}</span>
                  <span className="text-[10px] text-purple-400 font-bold">
                    ~R$ {computedPrice}/kg
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="3.0"
                    value={mult}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 1.0;
                      setColorMultipliers({ ...colorMultipliers, [clr]: val });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-400 font-bold focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-slate-500 text-xs font-bold">x</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela de Perfis de Alumínio */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Matriz de Preços dos Perfis de Alumínio (R$/kg)</span>
            </h3>
            <p className="text-xs text-slate-400">
              O peso da barra de 6 metros é calculado automaticamente multiplicando kg/m × 6 × R$/kg.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Reajuste em Massa */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBulkOpen(!isBulkOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span>Reajuste em Massa</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isBulkOpen && (
                <div className="absolute right-0 top-10 z-20 w-64 p-3 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl space-y-3">
                  <span className="text-xs font-bold text-white block">
                    Reajuste Percentual (%)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="1"
                      placeholder="Ex: 5 ou -3"
                      value={bulkAdjustmentPct || ''}
                      onChange={(e) => setBulkAdjustmentPct(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                    <span className="text-slate-400 text-xs">%</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setBulkAdjustmentPct(5)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
                    >
                      +5%
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkAdjustmentPct(10)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
                    >
                      +10%
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkAdjustmentPct(-5)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
                    >
                      -5%
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyBulkAdjustment}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Aplicar na Série Selecionada
                  </button>
                </div>
              )}
            </div>

            {/* Restaurar Fábrica */}
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Padrões Originais</span>
            </button>
          </div>
        </div>

        {/* Filtros da Tabela */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Filtro de Série */}
            <select
              value={seriesFilter}
              onChange={(e) => setSeriesFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Todas Séries ({availableSeries.length})</option>
              {availableSeries.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Filtro de Categoria */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Todas Categorias</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Exibindo <strong className="text-white">{filteredProfiles.length}</strong> de {customProfiles.length} perfis
          </span>
        </div>

        {/* Grade de Perfis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 font-mono text-xs max-h-[560px] overflow-y-auto pr-1">
          {filteredProfiles.map((prof) => {
            const realIdx = customProfiles.findIndex((p) => p.id === prof.id);
            const barPrice = (prof.pricePerKg * prof.kgm * 6).toFixed(2);
            const whiteMultiplier = colorMultipliers['Branco'] ?? 1.12;
            const whitePriceKg = (prof.pricePerKg * whiteMultiplier).toFixed(2);

            return (
              <div
                key={prof.id}
                className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-2.5 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-amber-400 font-black text-sm tracking-wide">
                      {prof.code}
                    </span>
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                      {prof.series || 'Universal'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-sans line-clamp-1 block" title={prof.name}>
                    {prof.name}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>Peso: {prof.kgm.toFixed(3)} kg/m</span>
                    <span>Barra 6m: R$ {barPrice}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-500 font-sans">
                    <span>Branco: </span>
                    <strong className="text-slate-300">R$ {whitePriceKg}</strong>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-[11px]">R$</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={prof.pricePerKg}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const next = [...customProfiles];
                        if (realIdx >= 0) {
                          next[realIdx] = { ...prof, pricePerKg: val };
                          setCustomProfiles(next);
                        }
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 group-hover:border-slate-600 rounded-lg px-2 py-1 text-white font-bold text-right focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-slate-500 text-[10px]">/kg</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Leitura OCR */}
      <PricingOcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onSuccess={(msg) => {
          showGlobalToast(msg);
        }}
      />
    </div>
  );
};
