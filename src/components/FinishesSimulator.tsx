import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ALUMINUM_FINISHES_CATALOG,
  LIGHTING_PRESETS,
  AluminumFinish,
} from '../data/finishesCatalog';
import {
  calculateFinishCostImpact,
  applyFinishToOrder,
  generateFinishTechnicalSpecText,
  findFinishByIdOrCode,
} from '../utils/finishesCalculator';
import { getEffectiveCompanyProfile } from '../utils/companyProfile';
import {
  Palette,
  Sun,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  TrendingUp,
  FileText,
  Printer,
  Copy,
  Sliders,
  Eye,
  Columns,
  Info,
} from 'lucide-react';

export const FinishesSimulator: React.FC = () => {
  const { orders, updateOrder } = useApp();
  const companyProfile = getEffectiveCompanyProfile();

  // Acabamento primário selecionado
  const [selectedFinishId, setSelectedFinishId] = useState<string>('preto-fosco-9005');
  // Acabamento secundário para comparação lado a lado
  const [compareFinishId, setCompareFinishId] = useState<string>('branco-ral-9003');
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Filtro de categoria
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('Todos');

  // Iluminação do simulador
  const [selectedLightingId, setSelectedLightingId] = useState<string>('daylight');
  const [specularAngle, setSpecularAngle] = useState<number>(45);

  // Simulação com Pedido Real
  const [targetOrderId, setTargetOrderId] = useState<string>(() => orders[0]?.id || '');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Tipologia de demonstração no visualizador
  const [demoTypologyType, setDemoTypologyType] = useState<'janela_correr' | 'porta_gold' | 'porta_pivotante'>('janela_correr');

  const selectedFinish =
    ALUMINUM_FINISHES_CATALOG.find((f) => f.id === selectedFinishId) || ALUMINUM_FINISHES_CATALOG[1];
  const compareFinish =
    ALUMINUM_FINISHES_CATALOG.find((f) => f.id === compareFinishId) || ALUMINUM_FINISHES_CATALOG[0];
  const currentLighting =
    LIGHTING_PRESETS.find((l) => l.id === selectedLightingId) || LIGHTING_PRESETS[0];

  const targetOrder = orders.find((o) => o.id === targetOrderId) || orders[0];

  // Cálculo de impacto no pedido selecionado
  const orderBasePrice = targetOrder ? targetOrder.finalPrice || targetOrder.subtotal : 3500;
  // Multiplicador atual estimado do pedido
  const currentOrderMultiplier = targetOrder?.color === 'Amadeirado' ? 1.35 : targetOrder?.color === 'Preto' ? 1.05 : 1.0;
  const costImpact = calculateFinishCostImpact(currentOrderMultiplier, selectedFinish.multiplier, orderBasePrice);

  // Categorias únicas
  const categories = ['Todos', 'Pintura Eletrostática', 'Anodização', 'Amadeirado Sublimação'];

  const filteredFinishes = ALUMINUM_FINISHES_CATALOG.filter((f) => {
    if (activeCategoryFilter === 'Todos') return true;
    return f.category === activeCategoryFilter;
  });

  // Aplicar ao pedido no contexto
  const handleApplyToOrder = () => {
    if (!targetOrder) return;
    const updated = applyFinishToOrder(targetOrder, selectedFinish);
    updateOrder(updated);
    setAppliedFeedback(
      `Acabamento "${selectedFinish.name}" aplicado ao Pedido #${targetOrder.number}! Novo valor: R$ ${updated.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    );
    setTimeout(() => setAppliedFeedback(null), 5000);
  };

  // Copiar laudo técnico
  const handleCopyTechnicalSpec = () => {
    const text = generateFinishTechnicalSpecText(selectedFinish, companyProfile.name);
    navigator.clipboard.writeText(text);
    setAppliedFeedback('Ficha técnica e certificado de garantia copiados para a área de transferência!');
    setTimeout(() => setAppliedFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">
              Simulador Fotorrealista de Cores & Acabamentos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Pinturas RAL • Anodizações • Amadeirados
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Apresentação de amostras arquitetônicas em alta definição, iluminação dinâmica (5500K a 3200K), cálculo de acréscimo comercial e laudos NBR.
          </p>
        </div>

        {/* Botão de Comparação Lado a Lado */}
        <button
          type="button"
          onClick={() => setIsComparing(!isComparing)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            isComparing
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
              : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Columns className="w-4 h-4" />
          {isComparing ? 'Modo Normal (1 Acabamento)' : 'Comparar Lado a Lado (A × B)'}
        </button>
      </div>

      {/* Grade Principal: Visualizador + Configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Visualizador Interativo e Amostra (7 colunas) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card do Visualizador Fotorrealista */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            {/* Topo do Visualizador: Seletor de Modelo e Iluminação */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Tipologia:</span>
                <select
                  value={demoTypologyType}
                  onChange={(e) => setDemoTypologyType(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
                >
                  <option value="janela_correr">Janela de Correr 2 Folhas (Suprema)</option>
                  <option value="porta_gold">Porta de Correr 3 Folhas (Linha Gold)</option>
                  <option value="porta_pivotante">Porta Pivotante Monumental c/ Frisos</option>
                </select>
              </div>

              {/* Seletor de Iluminação */}
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <select
                  value={selectedLightingId}
                  onChange={(e) => setSelectedLightingId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
                >
                  {LIGHTING_PRESETS.map((lp) => (
                    <option key={lp.id} value={lp.id}>
                      {lp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Viewport de Renderização Fotorrealista da Esquadria */}
            <div
              className="relative w-full h-[320px] rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center transition-all duration-300 shadow-inner"
              style={{
                backgroundColor: '#090d16',
                backgroundImage: `radial-gradient(circle at ${specularAngle}% 30%, ${currentLighting.ambientColor} 0%, rgba(15, 23, 42, 0.95) 80%)`,
              }}
            >
              {/* Esquadria Renderizada Vetorial com Acabamento Dinâmico */}
              <div className="relative z-10 w-full max-w-[380px] h-[260px] flex items-center justify-center">
                {demoTypologyType === 'janela_correr' && (
                  <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-2xl">
                    <defs>
                      <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={selectedFinish.secondaryHex || selectedFinish.baseHex} />
                        <stop offset="50%" stopColor={selectedFinish.baseHex} />
                        <stop offset="100%" stopColor={selectedFinish.accentHex || selectedFinish.baseHex} />
                      </linearGradient>
                      <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.15)" />
                        <stop offset="50%" stopColor="rgba(186, 230, 253, 0.25)" />
                        <stop offset="100%" stopColor="rgba(14, 165, 233, 0.10)" />
                      </linearGradient>
                      <filter id="metalNoise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                        <feColorMatrix type="saturate" values="0" />
                        <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
                      </filter>
                    </defs>

                    {/* Marco Superior / Lateral / Inferior */}
                    <rect x="20" y="20" width="360" height="260" rx="4" fill="url(#frameGrad)" stroke="#0f172a" strokeWidth="2" />
                    <rect x="36" y="36" width="328" height="228" fill="#020617" />

                    {/* Folha 1 (Esquerda) */}
                    <g transform="translate(40, 40)">
                      <rect x="0" y="0" width="160" height="220" rx="3" fill="url(#frameGrad)" stroke="#1e293b" strokeWidth="1.5" />
                      <rect x="16" y="16" width="128" height="188" rx="2" fill="url(#glassGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                      {/* Reflexo no vidro */}
                      <line x1="25" y1="25" x2="135" y2="195" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="15,10" />
                      {/* Puxador Concha */}
                      <rect x="135" y="95" width="8" height="30" rx="2" fill="#0f172a" />
                    </g>

                    {/* Folha 2 (Direita) */}
                    <g transform="translate(195, 40)">
                      <rect x="0" y="0" width="165" height="220" rx="3" fill="url(#frameGrad)" stroke="#1e293b" strokeWidth="1.5" />
                      <rect x="16" y="16" width="133" height="188" rx="2" fill="url(#glassGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                      <line x1="25" y1="25" x2="140" y2="195" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="15,10" />
                      <rect x="22" y="95" width="8" height="30" rx="2" fill="#0f172a" />
                    </g>
                  </svg>
                )}

                {demoTypologyType === 'porta_gold' && (
                  <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-2xl">
                    <defs>
                      <linearGradient id="goldFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={selectedFinish.secondaryHex || selectedFinish.baseHex} />
                        <stop offset="50%" stopColor={selectedFinish.baseHex} />
                        <stop offset="100%" stopColor={selectedFinish.accentHex || selectedFinish.baseHex} />
                      </linearGradient>
                    </defs>
                    {/* Marco Três Planos */}
                    <rect x="15" y="15" width="370" height="270" rx="4" fill="url(#goldFrameGrad)" stroke="#0f172a" strokeWidth="2" />
                    <rect x="30" y="30" width="340" height="245" fill="#020617" />
                    {/* 3 Folhas em 3 Trilhos */}
                    {[0, 110, 220].map((offsetX, idx) => (
                      <g key={idx} transform={`translate(${35 + offsetX}, 35)`}>
                        <rect x="0" y="0" width="115" height="235" rx="3" fill="url(#goldFrameGrad)" stroke="#1e293b" strokeWidth="1.5" />
                        <rect x="14" y="14" width="87" height="207" fill="rgba(56, 189, 248, 0.20)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                        <rect x={idx === 0 ? 95 : 10} y="105" width="8" height="35" rx="2" fill="#020617" />
                      </g>
                    ))}
                  </svg>
                )}

                {demoTypologyType === 'porta_pivotante' && (
                  <svg viewBox="0 0 320 300" className="w-full h-full drop-shadow-2xl">
                    <defs>
                      <linearGradient id="pivGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={selectedFinish.secondaryHex || selectedFinish.baseHex} />
                        <stop offset="50%" stopColor={selectedFinish.baseHex} />
                        <stop offset="100%" stopColor={selectedFinish.accentHex || selectedFinish.baseHex} />
                      </linearGradient>
                    </defs>
                    {/* Marco Monumental */}
                    <rect x="30" y="10" width="260" height="280" rx="4" fill="url(#pivGrad)" stroke="#0f172a" strokeWidth="2" />
                    <rect x="42" y="22" width="236" height="260" fill="url(#pivGrad)" />
                    {/* Frisos Horizontais em Alumínio */}
                    {[50, 90, 130, 170, 210, 250].map((y, idx) => (
                      <line key={idx} x1="42" y1={y} x2="278" y2={y} stroke="#0f172a" strokeWidth="2.5" />
                    ))}
                    {/* Puxador Tubular Inox Escovado 1 metro */}
                    <rect x="65" y="70" width="10" height="150" rx="4" fill="linear-gradient(#f8fafc, #94a3b8)" stroke="#475569" strokeWidth="1" />
                  </svg>
                )}
              </div>

              {/* Tag com Nome do Acabamento na Imagem */}
              <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                  style={{ backgroundColor: selectedFinish.baseHex }}
                ></span>
                <span className="text-xs font-bold text-slate-100">{selectedFinish.name}</span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {selectedFinish.multiplier}x (+{Math.round((selectedFinish.multiplier - 1) * 100)}%)
                </span>
              </div>
            </div>

            {/* Slider de Ângulo de Incidência de Luz */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Ângulo de Reflexo Especular:</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={specularAngle}
                onChange={(e) => setSpecularAngle(Number(e.target.value))}
                className="w-48 accent-amber-500 cursor-pointer"
              />
              <span className="text-xs font-mono text-amber-400 font-bold">{specularAngle}°</span>
            </div>
          </div>

          {/* Amostrador de Textura em Macro / Close-Up */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Amostra em Close-Up (Microtextura & Toque)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Amostra Fotorrealista */}
              <div
                className="w-full h-32 rounded-xl border-2 border-white/20 shadow-2xl relative overflow-hidden flex items-center justify-center"
                style={{
                  background: selectedFinish.visualTexture.gradient,
                  boxShadow: `0 10px 25px -5px ${selectedFinish.baseHex}40`,
                }}
              >
                {/* Reflexo especular simulado */}
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    background: `linear-gradient(${specularAngle * 4}deg, transparent 30%, ${selectedFinish.visualTexture.reflectionHighlight} 50%, transparent 70%)`,
                  }}
                ></div>

                <div className="relative z-10 bg-slate-950/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20 text-center">
                  <div className="text-xs font-black text-white">{selectedFinish.commercialCode}</div>
                  <div className="text-[10px] text-slate-300 capitalize">{selectedFinish.category}</div>
                </div>
              </div>

              {/* Dados Físicos da Superfície */}
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Tipo de Processo:</span>
                  <span className="font-semibold text-slate-100">{selectedFinish.spec.processType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Espessura da Camada:</span>
                  <span className="font-mono text-amber-400 font-bold">{selectedFinish.spec.thicknessMicrons}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Ensaio Salt Spray (NBR 8094):</span>
                  <span className="font-bold text-emerald-400">{selectedFinish.spec.saltSprayHours} horas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Garantia UV Sem Desbotar:</span>
                  <span className="font-bold text-slate-100">{selectedFinish.spec.uvResistanceYears} anos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel Direito: Catálogo de Acabamentos, Comparador & Comercial (5 colunas) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filtros de Categoria */}
          <div className="flex flex-wrap gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategoryFilter === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lista de Acabamentos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredFinishes.map((f) => {
              const isSelected = f.id === selectedFinishId;
              const isComparingThis = f.id === compareFinishId && isComparing;

              return (
                <div
                  key={f.id}
                  onClick={() => {
                    if (isComparing) {
                      setCompareFinishId(f.id);
                    } else {
                      setSelectedFinishId(f.id);
                    }
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-slate-100 shadow-md'
                      : isComparingThis
                      ? 'bg-blue-500/15 border-blue-500 text-slate-100 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Swatch circular com borda e sombra */}
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white/30 shadow-md shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: f.visualTexture.gradient }}
                    ></div>
                    <div>
                      <div className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                        {f.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {f.commercialCode} • {f.category}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-amber-400 block text-xs">
                      {f.multiplier}x
                    </span>
                    <span className="text-[10px] text-slate-500">
                      +{Math.round((f.multiplier - 1) * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparador Lado a Lado (Se Ativado) */}
          {isComparing && (
            <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Columns className="w-4 h-4" />
                  Comparação Lado a Lado
                </span>
                <span className="text-[11px] text-slate-400">Acabamento A vs B</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Lado A */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-amber-500/40 space-y-1.5">
                  <div className="font-bold text-amber-400 truncate">A: {selectedFinish.name}</div>
                  <div className="text-slate-400 text-[11px]">Norma: {selectedFinish.spec.norma}</div>
                  <div className="text-slate-400 text-[11px]">Névoa: {selectedFinish.spec.saltSprayHours}h</div>
                  <div className="font-mono font-bold text-slate-200">Mult.: {selectedFinish.multiplier}x</div>
                </div>

                {/* Lado B */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-blue-500/40 space-y-1.5">
                  <div className="font-bold text-blue-400 truncate">B: {compareFinish.name}</div>
                  <div className="text-slate-400 text-[11px]">Norma: {compareFinish.spec.norma}</div>
                  <div className="text-slate-400 text-[11px]">Névoa: {compareFinish.spec.saltSprayHours}h</div>
                  <div className="font-mono font-bold text-slate-200">Mult.: {compareFinish.multiplier}x</div>
                </div>
              </div>
            </div>
          )}

          {/* Simulador de Impacto Financeiro no Pedido Real */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Simular Impacto em Pedido Real
              </label>
              <select
                value={targetOrderId}
                onChange={(e) => setTargetOrderId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1"
              >
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    #{ord.number} - {ord.clientName}
                  </option>
                ))}
              </select>
            </div>

            {/* Quadro de Valores Calculados */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Valor Atual do Pedido</span>
                <span className="text-sm font-bold font-mono text-slate-200">
                  R$ {costImpact.baseMaterialCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Cor atual: {targetOrder?.color || 'Padrão'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Com {selectedFinish.name}</span>
                <span className="text-sm font-black font-mono text-emerald-400">
                  R$ {costImpact.adjustedMaterialCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] font-bold text-amber-400 block">
                  {costImpact.differenceR$ >= 0 ? '+' : ''} R${' '}
                  {costImpact.differenceR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (
                  {costImpact.differencePercent >= 0 ? '+' : ''}
                  {costImpact.differencePercent}%)
                </span>
              </div>
            </div>

            {/* Ação: Aplicar Acabamento ao Pedido */}
            <button
              type="button"
              onClick={handleApplyToOrder}
              disabled={!targetOrder}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aplicar este Acabamento ao Pedido #{targetOrder?.number}
            </button>

            {appliedFeedback && (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-xs text-emerald-300">
                {appliedFeedback}
              </div>
            )}
          </div>

          {/* Ficha Técnica NBR & Certificado de Garantia */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Laudo Técnico NBR & Garantia
              </span>
              <button
                type="button"
                onClick={handleCopyTechnicalSpec}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar Laudo
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {selectedFinish.description}
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="font-bold text-amber-300">Dica de Conservação em Obra:</div>
              <div className="text-slate-400">{selectedFinish.spec.maintenanceTip}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
