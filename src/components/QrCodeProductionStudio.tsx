import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderItem, ProductionStage, TypologyItem } from '../types';
import { TYPOLOGIES_CATALOG } from '../data/catalog';
import {
  formatProductionLabelData,
  generateQrCodeDataUrl,
  parseItemQrPayload,
  ProductionLabelData,
} from '../utils/qrLabelGenerator';
import { getEffectiveCompanyProfile } from '../utils/companyProfile';
import { getEffectiveEmblemSrc } from '../utils/logoData';
import {
  Printer,
  QrCode,
  Scan,
  CheckCircle2,
  AlertCircle,
  Camera,
  Layers,
  Wrench,
  Scissors,
  CheckSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Package,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Volume2,
} from 'lucide-react';

type LabelFormat = 'zebra_100x50' | 'compact_80x40' | 'a4_sheet';

// Efeito sonoro sintético de bipe industrial via Web Audio API
function playScannerBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {
    // Silently ignore audio restrictions
  }
}

export const QrCodeProductionStudio: React.FC = () => {
  const { orders, updateOrder } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'labels' | 'workstation'>('labels');

  // Seleção para impressão de etiquetas
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => orders[0]?.id || '');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [labelFormat, setLabelFormat] = useState<LabelFormat>('zebra_100x50');
  const [labelsData, setLabelsData] = useState<ProductionLabelData[]>([]);
  const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Estados do Scanner / Posto de Trabalho
  const [scannerInput, setScannerInput] = useState('');
  const [scannedItemData, setScannedItemData] = useState<{
    order: Order;
    item: OrderItem;
    label: ProductionLabelData;
  } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [qcChecklist, setQcChecklist] = useState<Record<string, boolean>>({
    squareness: false,
    seals: false,
    gliding: false,
    surface: false,
  });
  const [workstationMessage, setWorkstationMessage] = useState<string | null>(null);

  const companyProfile = getEffectiveCompanyProfile();
  const companyLogo = getEffectiveEmblemSrc();

  const currentOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  // Quando o pedido muda, seleciona todos os seus itens por padrão
  useEffect(() => {
    if (currentOrder && currentOrder.items.length > 0) {
      setSelectedItemIds(currentOrder.items.map((i) => i.id));
    } else {
      setSelectedItemIds([]);
    }
  }, [currentOrder]);

  // Gera dados das etiquetas e códigos QR
  useEffect(() => {
    if (!currentOrder || selectedItemIds.length === 0) {
      setLabelsData([]);
      return;
    }

    let isMounted = true;
    setIsLoadingQr(true);

    const generateAll = async () => {
      const itemsToPrint = currentOrder.items.filter((i) => selectedItemIds.includes(i.id));
      const results: ProductionLabelData[] = [];

      for (const item of itemsToPrint) {
        const baseData = formatProductionLabelData(currentOrder, item, companyProfile);
        const qrUrl = await generateQrCodeDataUrl(baseData.qrPayload);
        results.push({
          ...baseData,
          qrCodeDataUrl: qrUrl,
        });
      }

      if (isMounted) {
        setLabelsData(results);
        setIsLoadingQr(false);
      }
    };

    generateAll();

    return () => {
      isMounted = false;
    };
  }, [selectedOrderId, selectedItemIds, currentOrder]);

  // Alterna item individual na seleção
  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    if (currentOrder) {
      setSelectedItemIds(currentOrder.items.map((i) => i.id));
    }
  };

  const deselectAllItems = () => {
    setSelectedItemIds([]);
  };

  // Dispara a impressão das etiquetas com folha de estilo de corte limpo
  const handlePrintLabels = () => {
    window.print();
  };

  // Processa a leitura de um código escaneado
  const handleProcessScan = (payload: string) => {
    if (!payload) return;
    const parsed = parseItemQrPayload(payload);
    if (!parsed) {
      setWorkstationMessage('Código não reconhecido. Formato esperado: SMPRO:O{pedido}:I{vão}');
      return;
    }

    // Busca o pedido correspondente
    const foundOrder = orders.find((o) => o.number === parsed.orderNumber);
    if (!foundOrder) {
      setWorkstationMessage(`Pedido #${parsed.orderNumber} não encontrado no sistema.`);
      return;
    }

    // Busca o item ou pega o primeiro
    const foundItem = foundOrder.items.find((i) => i.id === parsed.itemId) || foundOrder.items[0];
    if (!foundItem) {
      setWorkstationMessage(`Item não encontrado no Pedido #${parsed.orderNumber}.`);
      return;
    }

    playScannerBeep();
    const label = formatProductionLabelData(foundOrder, foundItem, companyProfile);
    setScannedItemData({
      order: foundOrder,
      item: foundItem,
      label,
    });
    setWorkstationMessage(`Vão ${foundItem.roomTag || foundItem.id} carregado com sucesso!`);
    setScannerInput('');
  };

  // Scanner de Câmera
  const startCameraScanner = async () => {
    setIsCameraActive(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Câmera não suportada neste navegador.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Erro ao abrir câmera:', err);
      setCameraError('Permissão da câmera recusada ou câmera indisponível. Utilize o leitor manual ou atalhos.');
    }
  };

  const stopCameraScanner = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  // Atalho para abrir direto um vão no scanner da bancada
  const handleQuickOpenWorkstation = (order: Order, item: OrderItem) => {
    const label = formatProductionLabelData(order, item, companyProfile);
    playScannerBeep();
    setScannedItemData({ order, item, label });
    setActiveSubTab('workstation');
    setWorkstationMessage(`Vão "${item.roomTag || item.id}" aberto na Bancada de Usinagem.`);
  };

  // Atualizar etapa de produção do item/pedido
  const handleUpdateStep = (newStep: ProductionStage) => {
    if (!scannedItemData) return;
    const { order } = scannedItemData;
    const updated = {
      ...order,
      productionStep: newStep,
      status: newStep === 'Expedição / Concluído' ? ('Concluído' as const) : ('Em Produção' as const),
      history: [
        ...(order.history || []),
        {
          date: new Date().toISOString(),
          action: `Bancada de Produção: Etapa avançada para "${newStep}" via QR Code`,
        },
      ],
    };
    updateOrder(updated);
    setScannedItemData((prev) => (prev ? { ...prev, order: updated } : null));
    playScannerBeep();
    setWorkstationMessage(`Etapa atualizada com sucesso para: ${newStep}`);
  };

  // Fórmulas de corte do vão aberto na bancada
  const matchingTypology: TypologyItem | null = scannedItemData
    ? TYPOLOGIES_CATALOG.find((t: TypologyItem) => t.id === scannedItemData.item.typologyId) || TYPOLOGIES_CATALOG[0]
    : null;

  const widthMm = scannedItemData?.item.widthMm || scannedItemData?.item.width || 1500;
  const heightMm = scannedItemData?.item.heightMm || scannedItemData?.item.height || 1200;

  const computedCuts = matchingTypology
    ? matchingTypology.formula.cuts.map((c: TypologyItem['formula']['cuts'][number]) => ({
        ...c,
        calculatedLength: Math.round(c.formula(widthMm, heightMm)),
      }))
    : [];

  const computedGlass = matchingTypology
    ? matchingTypology.formula.glass.map((g: TypologyItem['formula']['glass'][number]) => ({
        ...g,
        calculatedW: Math.round(g.formulaW(widthMm, heightMm)),
        calculatedH: Math.round(g.formulaH(widthMm, heightMm)),
      }))
    : [];

  // Filtragem de pedidos
  const filteredOrders = orders.filter((o) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      o.number.toString().includes(q) ||
      o.clientName?.toLowerCase().includes(q) ||
      o.clientAddress?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Estilos específicos de impressão para etiquetadoras térmicas e A4 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-labels-area, #printable-labels-area * {
            visibility: visible;
          }
          #printable-labels-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
          .thermal-label-page {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>

      {/* Cabeçalho do Módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg">
              <QrCode className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">
              Etiquetas de Produção & QR Code de Bancada (PCP)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Padrão Industrial
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Impressão térmica para esquadrias de alumínio (Zebra/Argox/A4) e leitor de bancada para corte, montagem e baixa automática.
          </p>
        </div>

        {/* Alternador de Sub-Abas */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab('labels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'labels'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            1. Emissor de Etiquetas Térmicas
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('workstation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'workstation'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scan className="w-4 h-4" />
            2. Scanner / Posto de Trabalho
          </button>
        </div>
      </div>

      {/* SUB-ABA 1: EMISSOR DE ETIQUETAS */}
      {activeSubTab === 'labels' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Configurações & Seleção de Itens (4 colunas) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Seletor de Pedido */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Selecione o Pedido / Obra
                </label>
                <span className="text-xs text-slate-400">{filteredOrders.length} pedidos</span>
              </div>

              {/* Busca rápida */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filtrar por nº, cliente ou endereço..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Lista suspensa de pedidos */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {filteredOrders.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                      selectedOrderId === ord.id
                        ? 'bg-amber-500/10 border-amber-500/40 text-slate-100 font-medium'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">#{ord.number}</span>
                        <span className="truncate max-w-[150px] font-medium text-slate-200">
                          {ord.clientName}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {ord.items.length} vãos • {ord.status}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Formato da Etiqueta */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-400" />
                Formato da Impressão
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setLabelFormat('zebra_100x50')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                    labelFormat === 'zebra_100x50'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-200">Rolo Térmico 100 × 50 mm</div>
                    <div className="text-[10px] text-slate-400">Padrão Zebra GK420 / ZD220 / Argox</div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">1 Vão/Página</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelFormat('compact_80x40')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                    labelFormat === 'compact_80x40'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-200">Térmica Compacta 80 × 40 mm</div>
                    <div className="text-[10px] text-slate-400">Para perfis estreitos e kits de acessórios</div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">Compacta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelFormat('a4_sheet')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                    labelFormat === 'a4_sheet'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-200">Folha A4 Adesiva (Pimaco / 10 por folha)</div>
                    <div className="text-[10px] text-slate-400">Impressora Laser ou Jato de Tinta comum</div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">Grade 2×5</span>
                </button>
              </div>
            </div>

            {/* Seleção de Vãos / Esquadrias */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  Vãos Selecionados ({selectedItemIds.length}/{currentOrder?.items.length || 0})
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllItems}
                    className="text-[10px] text-amber-400 hover:underline font-medium"
                  >
                    Todos
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={deselectAllItems}
                    className="text-[10px] text-slate-500 hover:underline"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {currentOrder?.items.map((item) => {
                  const isChecked = selectedItemIds.includes(item.id);
                  const w = item.widthMm || item.width || 1200;
                  const h = item.heightMm || item.height || 1200;
                  return (
                    <div
                      key={item.id}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-slate-950 border-emerald-500/40 text-slate-200'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItemSelection(item.id)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                        <div className="truncate">
                          <span className="font-semibold text-slate-200">
                            {item.roomTag || item.id}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({w} × {h} mm)
                          </span>
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleQuickOpenWorkstation(currentOrder, item)}
                        title="Abrir este vão no posto de trabalho da bancada"
                        className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Botão de Disparo da Impressão */}
              <button
                type="button"
                onClick={handlePrintLabels}
                disabled={labelsData.length === 0 || isLoadingQr}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Printer className="w-5 h-5" />
                Imprimir {labelsData.length} Etiqueta(s) Agora
              </button>
            </div>
          </div>

          {/* Coluna Direita: Pré-Visualização em Alta Fidelidade das Etiquetas (8 colunas) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h3 className="text-sm font-bold text-slate-200">
                    Pré-Visualização das Etiquetas de Produção ({labelsData.length} unidades)
                  </h3>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Zoom: 100%</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                    {labelFormat === 'zebra_100x50' ? '100 × 50 mm' : labelFormat === 'compact_80x40' ? '80 × 40 mm' : 'Folha A4 (Grade)'}
                  </span>
                </div>
              </div>

              {isLoadingQr ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <span>Gerando códigos QR de alta resolução...</span>
                </div>
              ) : labelsData.length === 0 ? (
                <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Selecione ao menos um vão para gerar as etiquetas.
                </div>
              ) : (
                <div
                  id="printable-labels-area"
                  className={`space-y-4 max-h-[680px] overflow-y-auto p-4 bg-slate-950/80 rounded-xl border border-slate-800 ${
                    labelFormat === 'a4_sheet' ? 'grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0' : ''
                  }`}
                >
                  {labelsData.map((lbl, idx) => (
                    <div
                      key={lbl.itemId || idx}
                      className={`thermal-label-page bg-white text-slate-900 rounded-lg p-3.5 shadow-md border border-slate-300 relative font-sans transition-transform hover:scale-[1.01] ${
                        labelFormat === 'zebra_100x50'
                          ? 'max-w-[480px] mx-auto min-h-[220px]'
                          : labelFormat === 'compact_80x40'
                          ? 'max-w-[400px] mx-auto min-h-[180px]'
                          : 'w-full min-h-[210px]'
                      }`}
                    >
                      {/* Topo da Etiqueta: Logo + Empresa + Pedido e Lote */}
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={companyLogo}
                            alt="Logo"
                            className="h-7 w-auto object-contain max-w-[90px]"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="font-black text-xs tracking-tight text-slate-900 leading-none">
                              {companyProfile.name || 'SANCHES & MARQUES'}
                            </div>
                            <div className="text-[9px] font-semibold text-slate-600 mt-0.5">
                              Serralheria & Fachadas de Alumínio
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-slate-900 text-white px-2 py-0.5 rounded text-[11px] font-mono font-black inline-block">
                            PEDIDO #{lbl.orderNumber}
                          </div>
                          <div className="text-[8px] font-mono text-slate-600 font-bold mt-0.5">
                            {lbl.batchNumber}
                          </div>
                        </div>
                      </div>

                      {/* Corpo Principal da Etiqueta: Identificação do Vão + Medidas + QR Code */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Dados Técnicos (8 colunas) */}
                        <div className="col-span-8 space-y-1">
                          {/* Nome do Vão em Destaque */}
                          <div className="bg-slate-100 border border-slate-300 rounded px-2 py-1">
                            <div className="text-[9px] font-bold uppercase text-slate-500">
                              Identificação do Vão
                            </div>
                            <div className="text-sm font-black text-slate-950 truncate">
                              {lbl.roomTag}
                            </div>
                          </div>

                          {/* Tipologia & Linha */}
                          <div className="text-[10px] leading-tight">
                            <span className="font-black text-slate-900">{lbl.typologyCode}</span>
                            <span className="text-slate-600 ml-1">({lbl.series})</span>
                          </div>

                          {/* Medidas em Destaque Grande */}
                          <div className="flex items-baseline gap-2 bg-slate-900 text-white px-2 py-1 rounded">
                            <span className="text-[9px] font-bold text-amber-400">MEDIDAS:</span>
                            <span className="text-base font-black tracking-tight font-mono">
                              {lbl.widthMm} × {lbl.heightMm} mm
                            </span>
                          </div>

                          {/* Acabamento / Cor e Vidro */}
                          <div className="grid grid-cols-2 gap-1 text-[9px] leading-tight pt-0.5">
                            <div>
                              <span className="font-bold text-slate-600">COR: </span>
                              <span className="font-bold text-slate-900 truncate block">
                                {lbl.color}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-600">VIDRO: </span>
                              <span className="font-bold text-slate-900 truncate block">
                                {lbl.glassDescription}
                              </span>
                            </div>
                          </div>

                          {/* Cliente e Entrega */}
                          <div className="text-[9px] text-slate-600 truncate border-t border-slate-200 pt-1 flex justify-between">
                            <span className="truncate max-w-[150px]">
                              <b>Cliente:</b> {lbl.clientName}
                            </span>
                            <span>
                              <b>Entrega:</b> {lbl.deliveryDate}
                            </span>
                          </div>
                        </div>

                        {/* QR Code Escaneável + Simulação Código de Barras (4 colunas) */}
                        <div className="col-span-4 flex flex-col items-center justify-center pl-1 border-l border-slate-200">
                          {lbl.qrCodeDataUrl ? (
                            <img
                              src={lbl.qrCodeDataUrl}
                              alt="QR Code"
                              className="w-24 h-24 object-contain rounded border border-slate-300 p-0.5 bg-white shadow-sm"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 border border-slate-300">
                              Gerando...
                            </div>
                          )}

                          <div className="text-[8px] font-mono font-bold text-slate-800 mt-1 tracking-wider text-center">
                            {lbl.qrPayload}
                          </div>

                          {/* Simulação de Código de Barras Linear */}
                          <div className="w-full mt-1 flex flex-col items-center">
                            <div className="h-4 w-full bg-[repeating-linear-gradient(90deg,#000,#000_1px,#fff_1px,#fff_3px)] opacity-90 rounded-xs"></div>
                          </div>
                        </div>
                      </div>

                      {/* Rodapé da Etiqueta: Peso, Área e Etapa */}
                      <div className="mt-2 pt-1 border-t-2 border-slate-900 flex items-center justify-between text-[9px] font-bold text-slate-700">
                        <span>Peso Est.: {lbl.estimatedWeightKg} kg</span>
                        <span>Área: {lbl.areaM2} m²</span>
                        <span className="bg-slate-200 text-slate-900 px-1.5 py-0.2 rounded font-mono">
                          ETAPA: {lbl.productionStep}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 2: SCANNER & POSTO DE TRABALHO DA BANCADA */}
      {activeSubTab === 'workstation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Leitor de QR Code / Entrada Rápida (4 colunas) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Caixa de Entrada do Scanner */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Scan className="w-4 h-4 text-emerald-400" />
                  Bipar Etiqueta da Esquadria
                </label>
                <button
                  type="button"
                  onClick={() => playScannerBeep()}
                  title="Testar som do bip industrial"
                  className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Input com Foco Automático para Leitor USB / Pistola Laser */}
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type="text"
                    value={scannerInput}
                    onChange={(e) => setScannerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleProcessScan(scannerInput);
                      }
                    }}
                    placeholder="Bipe com o leitor ou digite SMPRO:O1001:I..."
                    className="w-full px-3 py-2.5 bg-slate-950 border-2 border-emerald-500/50 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleProcessScan(scannerInput)}
                    className="absolute right-2 top-2 px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400"
                  >
                    Bipar
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Compatível com pistolas laser USB, leitores bluetooth e digitação rápida.
                </p>
              </div>

              {/* Botão de Câmera */}
              <div className="pt-2 border-t border-slate-800">
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={startCameraScanner}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Abrir Câmera do Smartphone / Tablet
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-emerald-500/40 bg-black aspect-video flex items-center justify-center">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                      <div className="absolute inset-0 border-2 border-emerald-400/70 border-dashed rounded pointer-events-none m-4"></div>
                    </div>
                    {cameraError && (
                      <div className="text-[11px] text-amber-400 p-2 bg-amber-500/10 rounded border border-amber-500/30">
                        {cameraError}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={stopCameraScanner}
                      className="w-full py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-lg border border-red-500/40"
                    >
                      Fechar Câmera
                    </button>
                  </div>
                )}
              </div>

              {/* Mensagem de Feedback */}
              {workstationMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{workstationMessage}</span>
                </div>
              )}
            </div>

            {/* Atalhos Rápidos para Simular Leitura Sem Câmera */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Vãos em Produção (Atalhos de 1 Toque)
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {orders.flatMap((ord) =>
                  ord.items.map((it) => (
                    <button
                      key={`${ord.id}-${it.id}`}
                      type="button"
                      onClick={() => handleQuickOpenWorkstation(ord, it)}
                      className="w-full text-left p-2 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-xs transition-all flex items-center justify-between group"
                    >
                      <div className="truncate">
                        <span className="font-bold text-amber-400 mr-1.5">#{ord.number}</span>
                        <span className="text-slate-200 font-medium group-hover:text-emerald-400">
                          {it.roomTag || it.id}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {it.typologyName || it.typologyId} • {it.widthMm || it.width}×{it.heightMm || it.height} mm
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Ficha Técnica Operacional da Bancada (8 colunas) */}
          <div className="lg:col-span-8 space-y-4">
            {!scannedItemData ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
                <Scan className="w-12 h-12 mx-auto text-slate-600" />
                <h3 className="text-base font-bold text-slate-200">
                  Nenhum Vão Escaneado na Bancada
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Aproxime a etiqueta impressa da câmera ou utilize os atalhos rápidos à esquerda para visualizar a ficha de corte, lista de perfis e avançar a etapa de fabricação.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                {/* Banner de Identificação do Vão */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-xs font-mono font-bold">
                        PEDIDO #{scannedItemData.order.number}
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-xs font-bold">
                        {scannedItemData.label.series}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-slate-100">
                      {scannedItemData.item.roomTag || scannedItemData.item.id} — {scannedItemData.item.typologyName}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cliente: <b className="text-slate-200">{scannedItemData.order.clientName}</b> • Local: {scannedItemData.label.projectAddress}
                    </p>
                  </div>

                  {/* Medidas em Placa Grande de Oficina */}
                  <div className="bg-slate-900 border-2 border-amber-500/40 px-4 py-2 rounded-xl text-center shadow-inner">
                    <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                      Vão Nominal (L × H)
                    </div>
                    <div className="text-xl font-black font-mono text-slate-100">
                      {widthMm} × {heightMm} <span className="text-xs font-normal text-slate-400">mm</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Cor: <span className="text-slate-200 font-semibold">{scannedItemData.item.color}</span>
                    </div>
                  </div>
                </div>

                {/* Linha de Avanço Rápido de Etapa de Produção */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Status Atual da Produção:
                    </label>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {scannedItemData.order.productionStep || 'Corte CNC'}
                    </span>
                  </div>

                  {/* Botões de Ação de 1 Toque para o Operador */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {(
                      [
                        { step: 'Corte CNC', label: '1. Concluir Corte', icon: Scissors },
                        { step: 'Usinagem / Furação', label: '2. Usinagem Feita', icon: Wrench },
                        { step: 'Montagem de Esquadrias', label: '3. Quadro Montado', icon: Layers },
                        { step: 'Envidraçamento & Vedação', label: '4. Vidro & EPDM', icon: ShieldCheck },
                        { step: 'Expedição / Concluído', label: '5. CQ & Expedição', icon: CheckCircle2 },
                      ] as const
                    ).map(({ step, label, icon: Icon }) => {
                      const isCurrent = scannedItemData.order.productionStep === step;
                      return (
                        <button
                          key={step}
                          type="button"
                          onClick={() => handleUpdateStep(step)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-1.5 ${
                            isCurrent
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-lg scale-[1.02]'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[11px] leading-tight text-center">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tabela de Corte dos Perfis de Alumínio deste Vão */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                      <Scissors className="w-4 h-4 text-amber-400" />
                      Lista de Corte dos Perfis (Calculado para {widthMm} × {heightMm} mm)
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {computedCuts.length} itens de corte
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="py-2 px-3">Código</th>
                          <th className="py-2 px-3">Descrição da Peça</th>
                          <th className="py-2 px-3 text-center">Qtd</th>
                          <th className="py-2 px-3 text-center">Ângulos</th>
                          <th className="py-2 px-3 text-right">Comprimento (mm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {computedCuts.map((cut: typeof computedCuts[number], idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2 px-3 font-bold text-amber-400">{cut.profileCode}</td>
                            <td className="py-2 px-3 font-sans text-slate-200">{cut.description}</td>
                            <td className="py-2 px-3 text-center text-slate-300 font-bold">
                              {cut.quantity}x
                            </td>
                            <td className="py-2 px-3 text-center text-slate-400 text-[11px]">
                              {cut.angleLeft}° / {cut.angleRight}°
                            </td>
                            <td className="py-2 px-3 text-right font-black text-emerald-400 text-sm">
                              {cut.calculatedLength} mm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vidros & Acessórios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vidros */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      Medidas das Chapas de Vidro
                    </h4>
                    {computedGlass.length > 0 ? (
                      <div className="space-y-1.5 font-mono text-xs">
                        {computedGlass.map((g: typeof computedGlass[number], idx: number) => (
                          <div
                            key={idx}
                            className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center"
                          >
                            <span className="font-sans text-slate-300">{g.description}</span>
                            <span className="font-bold text-blue-400">
                              {g.quantity}x ({g.calculatedW} × {g.calculatedH} mm)
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 p-2 bg-slate-900 rounded">
                        Vidro: {scannedItemData.item.glassType || 'Padrão da linha 6mm'}
                      </div>
                    )}
                  </div>

                  {/* Checklist Rápido de Qualidade na Bancada */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      Inspeção na Bancada (CQ)
                    </h4>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      {[
                        { key: 'squareness', label: 'Esquadro das 4 diagonais conferido (±1mm)' },
                        { key: 'seals', label: 'Borrachas EPDM e escovas de vedação instaladas' },
                        { key: 'gliding', label: 'Deslizamento das roldanas macio e sem ruído' },
                        { key: 'surface', label: 'Inspeção visual: sem arranhões na pintura' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={qcChecklist[key] || false}
                            onChange={(e) =>
                              setQcChecklist((prev) => ({ ...prev, [key]: e.target.checked }))
                            }
                            className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className={qcChecklist[key] ? 'line-through text-slate-500' : ''}>
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
