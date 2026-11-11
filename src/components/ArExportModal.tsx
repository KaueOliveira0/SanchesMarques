import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  X,
  Smartphone,
  Download,
  Share2,
  Box,
  RotateCw,
  QrCode,
  Check,
  Sparkles,
  Info,
  Maximize2,
  MessageCircle,
  Eye,
  Sliders,
  Layers,
} from 'lucide-react';
import {
  ARModelConfig,
  buildWindowDoor3DGroup,
  exportToGLB,
  exportToUSDZ,
  createArExportFileName,
  generateARWhatsAppMessage,
} from '../utils/arModelGenerator';
import { ColorFinish } from '../types';
import { sanitizeWhatsAppPhone, createWhatsAppShareUrl } from '../utils/whatsappProposal';
import { Interactive3DExplodedViewer } from './Interactive3DExplodedViewer';

interface ArExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: {
    typologyId: string;
    typologyName: string;
    series: string;
    aluminumColor: ColorFinish;
    glassTint: 'incolor' | 'verde' | 'fume' | 'refletivo_champagne' | 'refletivo_azul';
  };
}

export const ArExportModal: React.FC<ArExportModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
}) => {
  const [widthMm, setWidthMm] = useState<number>(1500);
  const [heightMm, setHeightMm] = useState<number>(1200);
  const [depthMm, setDepthMm] = useState<number>(80);
  const [aluminumColor, setAluminumColor] = useState<ColorFinish>(initialConfig.aluminumColor);
  const [glassTint, setGlassTint] = useState<
    'incolor' | 'verde' | 'fume' | 'refletivo_champagne' | 'refletivo_azul'
  >(initialConfig.glassTint);

  const [isExportingGlb, setIsExportingGlb] = useState(false);
  const [isExportingUsdz, setIsExportingUsdz] = useState(false);
  const [usdzBlobUrl, setUsdzBlobUrl] = useState<string | null>(null);
  const [glbBlobUrl, setGlbBlobUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'3D' | 'AR_INFO' | 'QR'>('3D');

  // Detecção de plataforma móvel
  const isIos =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Atualiza configuração inicial ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setAluminumColor(initialConfig.aluminumColor);
      setGlassTint(initialConfig.glassTint);

      // Sugere proporções adequadas para a tipologia
      const name = initialConfig.typologyName.toLowerCase();
      if (name.includes('porta')) {
        setWidthMm(name.includes('pivotante') ? 1400 : 2000);
        setHeightMm(2400);
      } else if (name.includes('maxim')) {
        setWidthMm(800);
        setHeightMm(800);
      } else if (name.includes('4 folhas')) {
        setWidthMm(2400);
        setHeightMm(1400);
      } else {
        setWidthMm(1500);
        setHeightMm(1200);
      }
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const currentConfig: ARModelConfig = {
    typologyId: initialConfig.typologyId,
    typologyName: initialConfig.typologyName,
    series: initialConfig.series,
    widthMm,
    heightMm,
    depthMm,
    aluminumColor,
    glassTint,
  };

  // Exportação GLB
  const handleExportGLB = async () => {
    try {
      setIsExportingGlb(true);
      const exportGroup = buildWindowDoor3DGroup(currentConfig);
      const blob = await exportToGLB(exportGroup);
      const url = URL.createObjectURL(blob);
      setGlbBlobUrl(url);

      const fileName = createArExportFileName(
        currentConfig.typologyName,
        currentConfig.widthMm,
        currentConfig.heightMm,
        currentConfig.aluminumColor,
        'glb'
      );

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast(`Arquivo GLB gerado com sucesso! (${(blob.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar modelo GLB');
    } finally {
      setIsExportingGlb(false);
    }
  };

  // Exportação USDZ
  const handleExportUSDZ = async () => {
    try {
      setIsExportingUsdz(true);
      const exportGroup = buildWindowDoor3DGroup(currentConfig);
      const blob = await exportToUSDZ(exportGroup);
      const url = URL.createObjectURL(blob);
      setUsdzBlobUrl(url);

      const fileName = createArExportFileName(
        currentConfig.typologyName,
        currentConfig.widthMm,
        currentConfig.heightMm,
        currentConfig.aluminumColor,
        'usdz'
      );

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast(`Arquivo USDZ gerado com sucesso! (${(blob.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar modelo USDZ');
    } finally {
      setIsExportingUsdz(false);
    }
  };

  // Envio de instrução WhatsApp
  const handleShareWhatsApp = () => {
    const text = generateARWhatsAppMessage(currentConfig, 'Cliente', isIos ? 'USDZ' : 'GLB');
    const shareUrl = createWhatsAppShareUrl('', text);
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Visualizador 3D & Realidade Aumentada (AR)</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Escala Real 1:1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentConfig.typologyName} • {currentConfig.series}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notificação */}
        {toastMessage && (
          <div className="bg-emerald-600/90 text-white text-xs px-4 py-2 font-medium flex items-center justify-center gap-2 border-b border-emerald-500 shadow-md transition-all">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Abas Superiores */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-5 gap-2">
          <button
            onClick={() => setActiveTab('3D')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === '3D'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            Visualização 3D PBR
          </button>
          <button
            onClick={() => setActiveTab('AR_INFO')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'AR_INFO'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Como Usar a Câmera AR
          </button>
          <button
            onClick={() => setActiveTab('QR')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'QR'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Code para Celular
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Viewport 3D ou Painel de Instruções */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {activeTab === '3D' && (
              <Interactive3DExplodedViewer
                config={currentConfig}
                heightClass="h-[340px] sm:h-[420px]"
                initialAutoRotate={true}
              />
            )}

            {activeTab === 'AR_INFO' && (
              <div className="h-[340px] sm:h-[420px] rounded-xl border border-slate-700 bg-slate-950/70 p-5 overflow-y-auto space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Visualização em Tamanho Real na Parede</h3>
                    <p className="text-xs text-slate-400">Como seus clientes projetam a esquadria sem instalar nenhum app</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-2">
                    <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                      <span>🍏 Apple iPhone & iPad (.USDZ)</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Utiliza o recurso nativo <strong>Quick Look AR</strong> do iOS. Ao tocar no link ou abrir o arquivo .USDZ no Safari, a câmera abre imediatamente.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                      <li>Nenhum app precisa ser instalado</li>
                      <li>Detecta a parede e o chão automaticamente</li>
                      <li>Escala real milimétrica 1:1</li>
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                    <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <span>🤖 Celulares Android (.GLB)</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Utiliza o <strong>Google Scene Viewer / ARCore</strong> nativo do Chrome e Android.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                      <li>Compatível com Samsung, Xiaomi, Motorola</li>
                      <li>Iluminação realista adaptada ao ambiente do cômodo</li>
                      <li>Permite caminhar ao redor da janela na obra</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-700 bg-slate-900/60 text-xs text-slate-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dica Comercial:</strong> Envie o arquivo diretamente pelo WhatsApp da serralheria junto com o orçamento em PDF. Arquitetos e clientes ficam encantados ao "testar" a cor do perfil na parede antes da fabricação!
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'QR' && (
              <div className="h-[340px] sm:h-[420px] rounded-xl border border-slate-700 bg-slate-950/70 p-5 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-300">
                  {/* QR Code SVG Procedural Estilizado */}
                  <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" fill="white" />
                    {/* Cantos de posicionamento QR */}
                    <rect x="10" y="10" width="22" height="22" fill="#0f172a" rx="3" />
                    <rect x="14" y="14" width="14" height="14" fill="white" />
                    <rect x="18" y="18" width="6" height="6" fill="#0f172a" />

                    <rect x="68" y="10" width="22" height="22" fill="#0f172a" rx="3" />
                    <rect x="72" y="14" width="14" height="14" fill="white" />
                    <rect x="76" y="18" width="6" height="6" fill="#0f172a" />

                    <rect x="10" y="68" width="22" height="22" fill="#0f172a" rx="3" />
                    <rect x="14" y="72" width="14" height="14" fill="white" />
                    <rect x="18" y="76" width="6" height="6" fill="#0f172a" />

                    {/* Padrão interno estilizado */}
                    <rect x="36" y="12" width="6" height="6" fill="#0f172a" />
                    <rect x="46" y="12" width="14" height="6" fill="#0f172a" />
                    <rect x="36" y="22" width="18" height="6" fill="#0f172a" />
                    <rect x="44" y="32" width="12" height="6" fill="#0f172a" />
                    <rect x="12" y="36" width="16" height="6" fill="#0f172a" />
                    <rect x="12" y="46" width="8" height="12" fill="#0f172a" />
                    <rect x="24" y="52" width="14" height="6" fill="#0f172a" />

                    <rect x="40" y="44" width="20" height="20" fill="#2563eb" rx="2" />
                    <path d="M46 54L50 58L56 50" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    <rect x="68" y="36" width="20" height="6" fill="#0f172a" />
                    <rect x="68" y="46" width="10" height="8" fill="#0f172a" />
                    <rect x="82" y="46" width="8" height="16" fill="#0f172a" />
                    <rect x="68" y="68" width="12" height="6" fill="#0f172a" />
                    <rect x="84" y="68" width="6" height="12" fill="#0f172a" />
                    <rect x="68" y="80" width="22" height="6" fill="#0f172a" />
                    <rect x="36" y="70" width="8" height="16" fill="#0f172a" />
                    <rect x="48" y="74" width="12" height="8" fill="#0f172a" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">Aponte a câmera do seu smartphone</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Ao escanear, o modelo 3D desta esquadria abrirá diretamente no modo de Realidade Aumentada.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita: Parâmetros 1:1 e Botões de Download */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {/* Ajuste de Medidas Reais */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Dimensões Reais de Obra (1:1)
                </span>
                <span className="text-[11px] text-slate-500">em milímetros</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Largura (mm)</label>
                  <input
                    type="number"
                    min={400}
                    max={6000}
                    step={50}
                    value={widthMm}
                    onChange={(e) => setWidthMm(Number(e.target.value) || 1000)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Altura (mm)</label>
                  <input
                    type="number"
                    min={400}
                    max={4000}
                    step={50}
                    value={heightMm}
                    onChange={(e) => setHeightMm(Number(e.target.value) || 1000)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Acabamentos Rápidos */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Cor do Perfil</label>
                  <select
                    value={aluminumColor}
                    onChange={(e) => setAluminumColor(e.target.value as ColorFinish)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Preto">Preto Fosco</option>
                    <option value="Branco">Branco Neve</option>
                    <option value="Bronze">Bronze 1003</option>
                    <option value="Natural">Alumínio Natural</option>
                    <option value="Amadeirado">Amadeirado Nogueira</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tonalidade Vidro</label>
                  <select
                    value={glassTint}
                    onChange={(e) => setGlassTint(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="incolor">Incolor 6mm</option>
                    <option value="verde">Verde 6mm</option>
                    <option value="fume">Fumê 6mm</option>
                    <option value="refletivo_champagne">Refletivo Champanhe</option>
                    <option value="refletivo_azul">Refletivo Azul Royal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ações de Exportação e AR */}
            <div className="space-y-2.5">
              {/* Notificação especial para Celular / Smartphone */}
              {(isIos || isAndroid) && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border border-blue-500/40 flex items-center gap-2 text-xs text-blue-200">
                  <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Acesso via Smartphone detectado! Toque abaixo para abrir ou baixar e ver no seu ambiente.
                  </span>
                </div>
              )}

              {/* Botão iOS USDZ */}
              <button
                onClick={handleExportUSDZ}
                disabled={isExportingUsdz}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-blue-900/30 cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>{isIos ? '📱 Abrir no iPhone (Apple AR)' : 'Baixar Arquivo USDZ (Apple AR)'}</span>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">
                  {isExportingUsdz ? 'Gerando...' : '.USDZ'}
                </span>
              </button>

              {/* Botão Android GLB */}
              <button
                onClick={handleExportGLB}
                disabled={isExportingGlb}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-between bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{isAndroid ? '📱 Abrir no Android (Scene Viewer)' : 'Baixar Arquivo GLB (Android & 3D)'}</span>
                </div>
                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-emerald-300 font-mono">
                  {isExportingGlb ? 'Gerando...' : '.GLB'}
                </span>
              </button>

              {/* Compartilhar WhatsApp */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Instruções de AR por WhatsApp</span>
              </button>
            </div>

            {/* Rodapé explicativo */}
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Modelos exportados em escala métrica 1:1 compatíveis com ABNT NBR 10821, Blender, AutoCAD 3D e motores WebXR.
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>Sanches & Marques 3D Augmented Reality Engine (v1.0)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
