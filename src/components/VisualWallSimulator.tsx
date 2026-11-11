import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Download,
  MessageCircle,
  Copy,
  Check,
  Sliders,
  Move,
  Maximize2,
  Eye,
  Layers,
  RotateCcw,
  Sun,
  Shield,
  Palette,
  CheckCircle2,
  Building2,
  RefreshCw,
  Plus,
  Box,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TYPOLOGIES_CATALOG } from '../data/catalog';
import { ColorFinish } from '../types';
import {
  WALL_SAMPLE_PHOTOS,
  GLASS_TINT_STYLES,
  ALUMINUM_COLOR_PALETTE,
  DEFAULT_SIMULATION_STATE,
  VisualSimulationState,
  generateSimulationWhatsAppMessage,
} from '../utils/visualWallSimulator';
import { sanitizeWhatsAppPhone, createWhatsAppShareUrl } from '../utils/whatsappProposal';
import { ArExportModal } from './ArExportModal';
import { Interactive3DExplodedViewer } from './Interactive3DExplodedViewer';

interface VisualWallSimulatorProps {
  onApplyToOrder?: (typologyId: string, color: ColorFinish) => void;
}

export const VisualWallSimulator: React.FC<VisualWallSimulatorProps> = ({ onApplyToOrder }) => {
  const { orders, setActiveTab, setSelectedOrderId } = useApp();

  const [state, setState] = useState<VisualSimulationState>(DEFAULT_SIMULATION_STATE);
  const [activeTabMode, setActiveTabMode] = useState<'SPLIT' | 'AFTER' | 'BEFORE' | '3D_EXPLODED'>('SPLIT');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [clientName, setClientName] = useState('Dr. Roberto Miranda');
  const [clientPhone, setClientPhone] = useState('(11) 98765-4321');
  const [isArModalOpen, setIsArModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectSamplePhoto = (sampleId: string) => {
    const sample = WALL_SAMPLE_PHOTOS.find((s) => s.id === sampleId);
    if (!sample) return;
    setState((prev) => ({
      ...prev,
      photoUrl: sample.url,
      isCustomPhoto: false,
      positionX: sample.defaultOpening.xPct,
      positionY: sample.defaultOpening.yPct,
      scaleWidth: sample.defaultOpening.widthPct,
      scaleHeight: sample.defaultOpening.heightPct,
    }));
    showToast(`Cenário "${sample.title}" selecionado.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setState((prev) => ({
          ...prev,
          photoUrl: result,
          isCustomPhoto: true,
          positionX: 25,
          positionY: 20,
          scaleWidth: 50,
          scaleHeight: 60,
        }));
        showToast('Foto da obra carregada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyWhatsApp = () => {
    const text = generateSimulationWhatsAppMessage(state, clientName, '1042');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
    } catch {}
    setCopiedWhatsApp(true);
    showToast('Proposta de simulação visual copiada para o WhatsApp!');
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const handleSendWhatsApp = () => {
    const text = generateSimulationWhatsAppMessage(state, clientName, '1042');
    const sanitized = sanitizeWhatsAppPhone(clientPhone);
    const url = createWhatsAppShareUrl(sanitized, text);
    window.open(url, '_blank');
  };

  const currentGlass = GLASS_TINT_STYLES[state.glassTint];
  const currentColor = ALUMINUM_COLOR_PALETTE[state.aluminumColor];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500/60 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 text-xs text-emerald-300 font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Topo / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">
                Simulador Visual na Foto da Parede (Antes &amp; Depois)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PROPOSTA 3D / FOTO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sobreponha esquadrias em escala real sobre a foto da alvenaria do cliente e mostre o resultado estético de acabamentos e vidros.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-sm hover:border-amber-500/40 active:scale-95"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Carregar Foto da Obra</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={() => setIsArModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/40 cursor-pointer active:scale-95 border border-blue-400/30"
          >
            <Box className="w-4 h-4 text-blue-200" />
            <span>Exportar 3D &amp; AR (USDZ / GLB)</span>
          </button>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {copiedWhatsApp ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedWhatsApp ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Área de Visualização e Painel de Controles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Lado Esquerdo: Canvas Interativo de Visualização (8 colunas) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Barra de Modos de Exibição */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
              <span className="text-slate-400 font-semibold px-1 sm:px-2 shrink-0 hidden sm:inline">Modo:</span>
              <button
                type="button"
                onClick={() => setActiveTabMode('SPLIT')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTabMode === 'SPLIT'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                Antes &amp; Depois
              </button>
              <button
                type="button"
                onClick={() => setActiveTabMode('AFTER')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTabMode === 'AFTER'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                Instalada
              </button>
              <button
                type="button"
                onClick={() => setActiveTabMode('BEFORE')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTabMode === 'BEFORE'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                Vão Bruto
              </button>
              <button
                type="button"
                onClick={() => setActiveTabMode('3D_EXPLODED')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTabMode === '3D_EXPLODED'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                <Box className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>Studio 3D &amp; Explodida</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-500/20 text-blue-200 border border-blue-400/30 shrink-0">
                  360°
                </span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block shrink-0">
              {activeTabMode === '3D_EXPLODED'
                ? 'Escala Real 1:1 • PBR Studio'
                : `${state.scaleWidth}% × ${state.scaleHeight}% • (${state.positionX}%, ${state.positionY}%)`}
            </span>
          </div>

          {activeTabMode === '3D_EXPLODED' ? (
            <Interactive3DExplodedViewer
              config={{
                typologyId: state.typologyId,
                typologyName: state.typologyName,
                series: state.series,
                widthMm: 1500,
                heightMm: 1200,
                depthMm: 80,
                aluminumColor: state.aluminumColor,
                glassTint: state.glassTint,
              }}
              heightClass="h-[360px] sm:h-[460px]"
              initialAutoRotate={true}
            />
          ) : (
            <div
              ref={previewContainerRef}
              className="relative w-full aspect-[16/10] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none"
            >
            {/* Foto de Fundo (Parede / Vão Bruto) */}
            <img
              src={state.photoUrl}
              alt="Ambiente da Obra"
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* Overlay da Esquadria Montada */}
            {activeTabMode !== 'BEFORE' && (
              <div
                style={{
                  clipPath:
                    activeTabMode === 'SPLIT'
                      ? `inset(0 0 0 ${state.splitViewPosition}%)`
                      : 'none',
                }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Elemento Posicionável da Esquadria */}
                <div
                  style={{
                    left: `${state.positionX}%`,
                    top: `${state.positionY}%`,
                    width: `${state.scaleWidth}%`,
                    height: `${state.scaleHeight}%`,
                    opacity: state.opacity,
                    boxShadow: `0 0 ${state.shadowIntensity}px rgba(0,0,0,0.85), inset 0 0 8px rgba(0,0,0,0.5)`,
                  }}
                  className="absolute rounded border-2 transition-all duration-75 flex flex-col overflow-hidden"
                >
                  {/* Marco Externo de Alumínio */}
                  <div
                    style={{
                      backgroundColor: currentColor.hex,
                      borderColor: currentColor.borderHex,
                    }}
                    className="w-full h-full p-2 border-2 rounded flex flex-col justify-between relative shadow-2xl"
                  >
                    {/* Folhas da Esquadria com Vidro */}
                    <div className="w-full h-full flex gap-1 relative overflow-hidden rounded">
                      {/* Folha 1 */}
                      <div
                        style={{
                          borderColor: currentColor.borderHex,
                        }}
                        className={`flex-1 h-full border-2 rounded relative flex items-center justify-center overflow-hidden ${currentGlass.bgClass}`}
                      >
                        {/* Brilho e Reflexo do Vidro */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none" />

                        {/* Puxador ou Fecho Concha */}
                        <div
                          style={{ backgroundColor: currentColor.hex }}
                          className="w-1.5 h-10 rounded-full border border-slate-400/50 absolute right-1.5 shadow-sm"
                        />
                      </div>

                      {/* Folha 2 (Transpassada) */}
                      <div
                        style={{
                          borderColor: currentColor.borderHex,
                        }}
                        className={`flex-1 h-full border-2 rounded relative flex items-center justify-center overflow-hidden shadow-lg ${currentGlass.bgClass}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
                        <div
                          style={{ backgroundColor: currentColor.hex }}
                          className="w-1.5 h-10 rounded-full border border-slate-400/50 absolute left-1.5 shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Selo / Marca d'água de Simulação */}
                    <div className="absolute bottom-1 right-2 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-amber-400 border border-amber-500/30">
                      {state.series} • {currentColor.name.split(' ')[0]}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Linha Divisória de Comparação (Modo SPLIT) */}
            {activeTabMode === 'SPLIT' && (
              <>
                <div
                  style={{ left: `${state.splitViewPosition}%` }}
                  className="absolute inset-y-0 w-0.5 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] z-20 pointer-events-none flex items-center justify-center"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-[10px] font-black shadow-lg">
                    ⇄
                  </div>
                </div>

                {/* Etiquetas Antes vs Depois */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono font-bold text-slate-300 border border-slate-700 pointer-events-none z-10">
                  ANTES: VÃO BRUTO
                </div>
                <div className="absolute top-3 right-3 bg-emerald-950/90 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono font-bold text-emerald-400 border border-emerald-600/50 pointer-events-none z-10">
                  DEPOIS: ESQUADRIA INSTALADA
                </div>
              </>
            )}
          </div>
          )}

          {/* Slider de Posição do Split "Antes & Depois" */}
          {activeTabMode === 'SPLIT' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3 text-xs">
              <span className="text-slate-400 font-semibold text-[11px] shrink-0">Deslizar Antes/Depois:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={state.splitViewPosition}
                onChange={(e) => setState({ ...state, splitViewPosition: parseInt(e.target.value) || 50 })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-amber-400 font-mono font-bold shrink-0">{state.splitViewPosition}%</span>
            </div>
          )}

          {/* Galeria de Fotos de Exemplo da Obra */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Ou escolha um ambiente de amostra:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {WALL_SAMPLE_PHOTOS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSamplePhoto(sample.id)}
                  className={`group relative rounded-lg overflow-hidden border p-1 text-left transition-all cursor-pointer ${
                    state.photoUrl === sample.url
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                  }`}
                >
                  <img
                    src={sample.url}
                    alt={sample.title}
                    className="w-full h-16 object-cover rounded"
                  />
                  <span className="text-[10px] font-semibold text-slate-300 block mt-1 line-clamp-1">
                    {sample.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Banner de Realidade Aumentada (AR) */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-indigo-950/50 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">Visualização em Realidade Aumentada (AR) na Parede</h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      iOS &amp; Android
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Gere o modelo 3D em escala real (1:1) nos formatos <strong>USDZ (Apple Quick Look)</strong> ou <strong>GLB (Google Scene Viewer)</strong> para o cliente projetar com a câmera do celular.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTabMode('3D_EXPLODED')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver 3D Explodido</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsArModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-blue-400/30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Exportar AR</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Painel de Controles e Configurações (4 colunas) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: Tipologia & Linha */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                1. Tipologia da Esquadria
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 block text-[11px]">Modelo do Catálogo</label>
              <select
                value={state.typologyId}
                onChange={(e) => {
                  const typo = TYPOLOGIES_CATALOG.find((t) => t.id === e.target.value);
                  if (typo) {
                    setState({
                      ...state,
                      typologyId: typo.id,
                      typologyName: typo.name,
                      series: typo.series,
                    });
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium cursor-pointer"
              >
                {TYPOLOGIES_CATALOG.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.series})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card: Cor do Alumínio & Tonalidade do Vidro */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Palette className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                2. Acabamento do Alumínio
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ALUMINUM_COLOR_PALETTE) as ColorFinish[]).map((cKey) => {
                const colorInfo = ALUMINUM_COLOR_PALETTE[cKey];
                const isSelected = state.aluminumColor === cKey;
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => setState({ ...state, aluminumColor: cKey })}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 text-white font-bold'
                        : 'border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-950'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: colorInfo.hex, borderColor: colorInfo.borderHex }}
                      className="w-4 h-4 rounded-full border shadow-sm shrink-0"
                    />
                    <span className="text-[11px] truncate">{cKey}</span>
                  </button>
                );
              })}
            </div>

            {/* Tonalidade do Vidro */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="text-slate-400 block text-[11px] font-semibold">Tonalidade do Vidro</label>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {(Object.keys(GLASS_TINT_STYLES) as VisualSimulationState['glassTint'][]).map((gKey) => {
                  const glassInfo = GLASS_TINT_STYLES[gKey];
                  const isSelected = state.glassTint === gKey;
                  return (
                    <button
                      key={gKey}
                      type="button"
                      onClick={() => setState({ ...state, glassTint: gKey })}
                      className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500/10 text-white font-bold'
                          : 'border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded border ${glassInfo.borderColor} ${glassInfo.bgClass}`} />
                        <span className="text-[11px]">{glassInfo.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{glassInfo.lightTransmission}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card: Ajuste Fino do Encaixe no Vão */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  3. Encaixe no Vão
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  setState({
                    ...state,
                    positionX: 25,
                    positionY: 20,
                    scaleWidth: 50,
                    scaleHeight: 60,
                  })
                }
                title="Centralizar esquadria"
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resetar</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Largura (%)</span>
                <span className="font-mono text-white">{state.scaleWidth}%</span>
              </div>
              <input
                type="range"
                min="15"
                max="85"
                value={state.scaleWidth}
                onChange={(e) => setState({ ...state, scaleWidth: parseInt(e.target.value) || 45 })}
                className="w-full accent-amber-500 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Altura (%)</span>
                <span className="font-mono text-white">{state.scaleHeight}%</span>
              </div>
              <input
                type="range"
                min="15"
                max="85"
                value={state.scaleHeight}
                onChange={(e) => setState({ ...state, scaleHeight: parseInt(e.target.value) || 50 })}
                className="w-full accent-amber-500 cursor-pointer"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-slate-400 block text-[10px] mb-1">Posição X (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={state.positionX}
                    onChange={(e) => setState({ ...state, positionX: parseInt(e.target.value) || 0 })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px] mb-1">Posição Y (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={state.positionY}
                    onChange={(e) => setState({ ...state, positionY: parseInt(e.target.value) || 0 })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Enviar ao Cliente */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-amber-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
              Encantar Cliente no WhatsApp
            </span>

            <div className="space-y-1.5 text-xs">
              <input
                type="text"
                placeholder="Nome do Cliente ou Arquiteto"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
              <input
                type="text"
                placeholder="Telefone WhatsApp (DDD + Número)"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Proposta Visual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Realidade Aumentada (AR) & Exportação USDZ / GLB */}
      <ArExportModal
        isOpen={isArModalOpen}
        onClose={() => setIsArModalOpen(false)}
        initialConfig={{
          typologyId: state.typologyId,
          typologyName: state.typologyName,
          series: state.series,
          aluminumColor: state.aluminumColor,
          glassTint: state.glassTint,
        }}
      />
    </div>
  );
};
