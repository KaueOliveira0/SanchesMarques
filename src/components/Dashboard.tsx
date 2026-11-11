import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getEffectiveEmblemSrc } from '../utils/logoData';
import {
  TrendingUp,
  Package,
  Scissors,
  Cpu,
  Layers,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
  BarChart3,
  AlertTriangle,
  BellRing,
  Volume2,
  VolumeX,
  ShoppingCart,
  ShieldAlert,
  Boxes,
  BookOpen,
  Grid,
} from 'lucide-react';
import { printCommercialProposal } from '../utils/pdfPrint';

export const Dashboard: React.FC = () => {
  const {
    orders,
    stockProfiles,
    stockAccessories,
    stockGlass,
    setActiveTab,
    setSelectedOrderId,
    updateStockProfileQty,
  } = useApp();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const approvedOrders = orders.filter((o) => o.status === 'Aprovado' || o.status === 'Em Produção' || o.status === 'Concluído');
  const totalRevenue = approvedOrders.reduce((sum, o) => sum + o.finalPrice, 0);
  const totalWeightKg = approvedOrders.reduce((sum, o) => sum + o.totalWeightKg, 0);
  const totalGlassM2 = approvedOrders.reduce((sum, o) => sum + o.totalGlassM2, 0);

  const totalWholeBars = stockProfiles.reduce((sum, p) => sum + p.wholeBarsQty, 0);
  const totalRemnants = stockProfiles.reduce((sum, p) => sum + p.remnants.length, 0);

  const inProductionOrders = orders.filter((o) => o.status === 'Em Produção' || o.status === 'Aprovado');

  // Alertas de estoque
  const lowProfiles = stockProfiles.filter((p) => p.wholeBarsQty <= p.minBarsThreshold);
  const lowAccessories = stockAccessories.filter((a) => a.currentQty <= a.minQty);
  const lowGlass = stockGlass.filter((g) => g.currentAreaM2 <= g.minAreaM2);
  const totalAlerts = lowProfiles.length + lowAccessories.length + lowGlass.length;

  // Logo corporativa dinâmica
  const [logoSrc, setLogoSrc] = useState<string>(() => getEffectiveEmblemSrc());
  useEffect(() => {
    const handleUpdate = () => setLogoSrc(getEffectiveEmblemSrc());
    window.addEventListener('sm_branding_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('sm_branding_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <div className="h-full flex flex-col justify-between gap-2.5 overflow-hidden min-h-0">
      {/* Banner Principal Compacto com Atalhos Rápidos */}
      <div className="shrink-0 relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950 px-4 py-2.5 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt="Sanches & Marques Esquadrias"
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain bg-transparent border-none drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)] shrink-0 transition-transform hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/logo-emblem.png';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Sanches & Marques Esquadrias
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                  <Sparkles className="w-3 h-3" />
                  Estação PCP & CNC
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1">
                Gestão de serralheria industrial de esquadrias (Suprema, Gold, Linha 25 e Integrada).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedOrderId('new');
                setActiveTab('budgets');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Novo Orçamento</span>
            </button>

            <button
              onClick={() => setActiveTab('cutting_plan')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-100 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5 text-cyan-400" />
              <span>Plano 1D</span>
            </button>

            <button
              onClick={() => setActiveTab('glass_2d_optimizer')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-semibold text-xs border border-cyan-800 transition-all cursor-pointer"
              title="Otimizador 2D de Chapas de Vidro (Vidraçaria)"
            >
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
              <span>Plano 2D Vidro</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing_table')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-100 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Preços</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-100 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>BI</span>
            </button>

            <button
              onClick={() => setActiveTab('catalogs_library')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-bold text-xs border border-cyan-700 shadow-sm transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>10 Catálogos (PDFs)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Industriais Compacto */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vendas Fechadas</span>
            <div className="text-lg font-bold text-white leading-tight">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400">
              {approvedOrders.length} pedido(s)
            </div>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Em Fabricação</span>
            <div className="text-lg font-bold text-cyan-300 leading-tight">
              {totalWeightKg.toFixed(1)} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {totalGlassM2.toFixed(1)} m² de vidro
            </div>
          </div>
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Estoque Barras 6m</span>
            <div className="text-lg font-bold text-amber-300 leading-tight">
              {totalWholeBars} <span className="text-xs font-normal text-slate-400">un</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              +{totalRemnants} retalhos úteis
            </div>
          </div>
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Rendimento de Corte</span>
            <div className="text-lg font-bold text-purple-300 leading-tight">
              97.8% <span className="text-xs font-normal text-slate-400">eficiência</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Perda média &lt; 2.2%
            </div>
          </div>
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
            <Scissors className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-rose-300 animate-bounce">
          <BellRing className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sistema de Notificações Visuais Urgentes (Perfis ≤ 10% do Estoque Mínimo) */}
      {(() => {
        const critical10PercentProfiles = stockProfiles.filter(
          (p) => p.wholeBarsQty <= Math.max(1, Math.ceil(p.minBarsThreshold * 0.1))
        );

        if (critical10PercentProfiles.length === 0) {
          return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Estoque de Alumínio Seguro</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                      NENHUM PERFIL ≤ 10%
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Todos os perfis monitorados estão com volume acima do limiar crítico de ruptura.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const target = stockProfiles.find((p) => p.code === 'GL-003') || stockProfiles[0];
                  if (target) {
                    updateStockProfileQty(target.id, -target.wholeBarsQty + 1);
                    showToast(`Simulação ativada: Perfil ${target.code} reduzido para 1 barra (≤ 10% do mínimo).`);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Simular Alerta Crítico (10%)</span>
              </button>
            </div>
          );
        }

        return (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950 via-red-950 to-slate-950 border-2 border-rose-500 p-5 shadow-2xl shadow-rose-950/70">
            {/* Faixa Superior com Beacon Pulsante */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-rose-800/80">
              <div className="flex items-start gap-3.5">
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-rose-600/50">
                    🚨
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-slate-950"></span>
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-black text-white tracking-wide">
                      ALERTA URGENTE: ESTOQUE EM NÍVEL CRÍTICO DE RUPTURA
                    </h2>
                    <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold tracking-wider animate-pulse">
                      ≤ 10% DO ESTOQUE MÍNIMO
                    </span>
                  </div>
                  <p className="text-xs text-rose-200/90 mt-1">
                    Detectado(s) <b>{critical10PercentProfiles.length} perfil(is) de alumínio</b> abaixo de 10% da reserva de segurança. Risco iminente de paralisação nas linhas de corte e montagem!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                <button
                  type="button"
                  onClick={() => {
                    critical10PercentProfiles.forEach((p) => {
                      updateStockProfileQty(p.id, p.minBarsThreshold * 2);
                    });
                    showToast('✔ Todos os perfis críticos foram recompostos para estoque de segurança!');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-600/60 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Repor Todos (+Reserva)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('stock')}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-rose-500/40 cursor-pointer flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-slate-950" />
                  <span>Emitir Compra de Emergência</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Grid dos Perfis em Nível de Ruptura com Barra Visual de Capacidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4">
              {critical10PercentProfiles.map((p) => {
                const percentOfMin = Math.round((p.wholeBarsQty / p.minBarsThreshold) * 100);
                const safeTarget = p.minBarsThreshold * 2;

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-slate-950/90 border-2 border-rose-600/80 flex flex-col justify-between gap-3 shadow-xl"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-rose-300 text-base">{p.code}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-900/90 text-rose-100 border border-rose-700">
                            {percentOfMin}% do mínimo
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Linha {p.series}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-100">{p.name}</div>
                      <div className="text-[11px] text-slate-400">Acabamento: <b className="text-slate-200">{p.color}</b></div>

                      {/* Barra Visual de Alerta (Gauge de Capacidade com Marcador 10%) */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-rose-400 font-bold">
                            Saldo: {p.wholeBarsQty} barra(s)
                          </span>
                          <span className="text-slate-400">
                            Mínimo: {p.minBarsThreshold} barras
                          </span>
                        </div>
                        <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(5, percentOfMin))}%` }}
                          />
                          {/* Linha indicadora do limiar de 10% */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
                            style={{ left: '10%' }}
                            title="Limiar Crítico de 10%"
                          />
                        </div>
                        <div className="text-[10px] text-rose-300/80 flex justify-between">
                          <span>Zona Vermelha de Ruptura</span>
                          <span>Alvo seguro: {safeTarget} barras</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações Rápidas por Perfil */}
                    <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateStockProfileQty(p.id, 10);
                          showToast(`✔ Reposição de +10 barras registrada para ${p.code}!`);
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Repor (+10 barras)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('stock')}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                        title="Abrir no Módulo de Estoque"
                      >
                        Ver Estoque
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Alerta Geral de Estoque Mínimo */}
      {totalAlerts > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-sm">
                Atenção: {totalAlerts} item(ns) atingiram o nível de estoque mínimo de segurança!
              </div>
              <div className="text-xs text-amber-300/80">
                {lowProfiles.length > 0 && `${lowProfiles.length} perfil(is) de alumínio, `}
                {lowAccessories.length > 0 && `${lowAccessories.length} acessório(s), `}
                {lowGlass.length > 0 && `${lowGlass.length} tipo(s) de vidro.`}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('stock')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
          >
            Ver Estoque Completo
          </button>
        </div>
      )}

      {/* Seção Principal: Pedidos Recentes & Andamento de Fábrica (Fit to screen com rolagem interna isolada) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2.5 overflow-hidden">
        {/* Tabela de Pedidos Recentes */}
        <div className="lg:col-span-2 h-full flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm space-y-2 overflow-hidden">
          <div className="shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Orçamentos e OPs Recentes</span>
                <span className="text-[10px] font-mono font-normal text-slate-400 px-2 py-0.2 rounded bg-slate-800">
                  {orders.length} cadastrados
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Controle comercial e ordens de fabricação ativas</p>
            </div>

            <button
              onClick={() => setActiveTab('budgets')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2 px-2.5">OP / Nº</th>
                  <th className="py-2 px-2.5">Cliente / Obra</th>
                  <th className="py-2 px-2.5">Itens</th>
                  <th className="py-2 px-2.5">Valor Total</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {orders.map((order) => {
                  const statusColors: Record<string, string> = {
                    Orçamento: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    Aprovado: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    'Em Produção': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                    Concluído: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    Cancelado: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  };

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-2.5 font-mono font-bold text-cyan-400">
                        OP-{order.number}
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-100 text-xs">{order.clientName}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {order.clientAddress}
                        </div>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="font-semibold text-xs">{order.items.reduce((s, i) => s + i.quantity, 0)} pçs</span>
                        <div className="text-[10px] text-slate-400">{order.items.length} tipologia(s)</div>
                      </td>
                      <td className="py-2 px-2.5 font-semibold text-slate-100 text-xs">
                        R$ {order.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                            statusColors[order.status] || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => printCommercialProposal(order)}
                            title="Imprimir proposta técnica"
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                          >
                            🖨️
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              setActiveTab('budgets');
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[10px] transition-colors"
                          >
                            Abrir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Andamento da Serralheria & Chão de Fábrica */}
        <div className="h-full flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm space-y-2 overflow-hidden">
          <div className="shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Chão de Fábrica (PCP)</span>
              </h2>
              <p className="text-[11px] text-slate-400">Etapas de fabricação em tempo real</p>
            </div>
            <button
              onClick={() => setActiveTab('production')}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              Abrir Kanban
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 scrollbar-thin pr-1">
            {inProductionOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhum pedido em produção no momento.</p>
            ) : (
              inProductionOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-2.5 rounded-lg bg-slate-850 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-400">OP-{order.number}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Prazo: {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="font-medium text-slate-200 truncate">
                    {order.clientName}
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Etapa:</span>
                    <span className="font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                      {order.productionStep || 'Corte CNC'}
                    </span>
                  </div>

                  <div className="pt-0.5 flex justify-end gap-2 text-[10px]">
                    <button
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setActiveTab('cutting_plan');
                      }}
                      className="text-cyan-400 hover:underline"
                    >
                      Ver Cortes
                    </button>
                    <span className="text-slate-700">•</span>
                    <button
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setActiveTab('cnc_studio');
                      }}
                      className="text-emerald-400 hover:underline"
                    >
                      Enviar p/ CNC
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
