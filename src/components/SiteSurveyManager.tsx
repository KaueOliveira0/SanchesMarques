import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  SiteSurveyItem,
  getStoredSurveys,
  saveSurveys,
  createSiteSurveyItem,
  printSiteSurveySheet,
  analyzeSquareness,
  calculateFinishedDimensions,
  RoughOpeningDimensions,
} from '../utils/siteSurveyMeasurement';
import {
  Ruler,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit3,
  Printer,
  Camera,
  Layers,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Info,
  Calendar,
  User,
  Sliders,
  Check,
  Building2,
  MapPin,
  RefreshCw,
  Search,
  Maximize2,
  Wrench,
} from 'lucide-react';
import { InstallationHardwareCalculatorModal } from './InstallationHardwareCalculatorModal';

export const SiteSurveyManager: React.FC = () => {
  const { orders, updateOrder } = useApp();

  const [surveys, setSurveys] = useState<SiteSurveyItem[]>(() => getStoredSurveys(orders));
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrderIdFilter, setSelectedOrderIdFilter] = useState<string>('ALL');
  const [isHardwareCalculatorOpen, setIsHardwareCalculatorOpen] = useState<boolean>(false);
  const [hardwareCalculatorInitialOrderId, setHardwareCalculatorInitialOrderId] = useState<string | null>(null);

  // Notificação toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sincroniza estado de vistorias
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setSurveys(e.detail);
    };
    window.addEventListener('sm_surveys_updated', handleUpdate);
    return () => window.removeEventListener('sm_surveys_updated', handleUpdate);
  }, []);

  // Form state para edição / nova medição
  const [editingItem, setEditingItem] = useState<Partial<SiteSurveyItem> | null>(null);

  // Vão ativo sob edição ou visualização
  const activeSurvey = useMemo(() => {
    return surveys.find((s) => s.id === selectedSurveyId) || surveys[0];
  }, [surveys, selectedSurveyId]);

  // Lista filtrada
  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      if (selectedOrderIdFilter !== 'ALL' && s.orderId !== selectedOrderIdFilter) return false;
      if (statusFilter !== 'ALL' && s.squareness.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchClient = s.clientName.toLowerCase().includes(term);
        const matchRoom = s.roomName.toLowerCase().includes(term);
        const matchTypo = s.typologyName.toLowerCase().includes(term);
        const matchOp = `op #${s.orderNumber}`.includes(term) || String(s.orderNumber).includes(term);
        if (!matchClient && !matchRoom && !matchTypo && !matchOp) return false;
      }
      return true;
    });
  }, [surveys, selectedOrderIdFilter, statusFilter, searchTerm]);

  // Contadores de diagnóstico
  const stats = useMemo(() => {
    const total = surveys.length;
    const perfect = surveys.filter((s) => s.squareness.status === 'PERFECT').length;
    const tolerable = surveys.filter((s) => s.squareness.status === 'TOLERABLE').length;
    const critical = surveys.filter((s) => s.squareness.status === 'CRITICAL_OUT_OF_SQUARE').length;
    return { total, perfect, tolerable, critical };
  }, [surveys]);

  const handleOpenNewSurveyModal = () => {
    const firstOrder = orders[0] || { id: 'ord_sample', number: 101, clientName: 'Cliente Obra' };
    const initialItem = createSiteSurveyItem({
      orderId: firstOrder.id,
      orderNumber: firstOrder.number,
      clientName: firstOrder.clientName,
      roomName: 'Novo Vão',
      typologyName: 'Janela de Correr 2 Folhas Suprema',
      widthTopMm: 1550,
      widthCenterMm: 1550,
      widthBottomMm: 1550,
      heightLeftMm: 1250,
      heightCenterMm: 1250,
      heightRightMm: 1250,
      clearanceMm: 25,
      technicalNotes: '',
    });
    setEditingItem(initialItem);
    setIsEditorOpen(true);
  };

  const handleEditSurvey = (item: SiteSurveyItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
    setIsEditorOpen(true);
  };

  const handleDeleteSurvey = (id: string) => {
    const updated = surveys.filter((s) => s.id !== id);
    setSurveys(updated);
    saveSurveys(updated);
    showToast('Medição excluída com sucesso.');
  };

  const handleSaveEditor = () => {
    if (!editingItem) return;

    // Recalcula diagonais, esquadro e folgas
    const wTop = editingItem.roughOpening?.widthTopMm || 1200;
    const wCenter = editingItem.roughOpening?.widthCenterMm || wTop;
    const wBottom = editingItem.roughOpening?.widthBottomMm || wTop;
    const hLeft = editingItem.roughOpening?.heightLeftMm || 1200;
    const hCenter = editingItem.roughOpening?.heightCenterMm || hLeft;
    const hRight = editingItem.roughOpening?.heightRightMm || hLeft;

    const avgW = (wTop + wCenter + wBottom) / 3;
    const avgH = (hLeft + hCenter + hRight) / 3;

    const d1 = editingItem.diagonals?.diagonal1Mm || Math.round(Math.sqrt(avgW * avgW + avgH * avgH));
    const d2 = editingItem.diagonals?.diagonal2Mm || Math.round(Math.sqrt(avgW * avgW + avgH * avgH));

    const clearance = editingItem.deduction?.counterFrameClearanceMm || 25;

    const roughOpening: RoughOpeningDimensions = {
      widthTopMm: wTop,
      widthCenterMm: wCenter,
      widthBottomMm: wBottom,
      heightLeftMm: hLeft,
      heightCenterMm: hCenter,
      heightRightMm: hRight,
    };

    const squareness = analyzeSquareness(d1, d2, avgW, avgH);
    const deduction = calculateFinishedDimensions(roughOpening, clearance);

    const updatedItem: SiteSurveyItem = {
      ...(editingItem as SiteSurveyItem),
      roughOpening,
      diagonals: { diagonal1Mm: d1, diagonal2Mm: d2 },
      squareness,
      deduction,
      plumbLevel: {
        sillLevelSlopeMm: Math.abs(hLeft - hRight),
        leftJambPlumbMm: Math.abs(wTop - wCenter),
        rightJambPlumbMm: Math.abs(wBottom - wCenter),
        isLevelCompliant: Math.abs(hLeft - hRight) <= 4,
        isPlumbCompliant: Math.abs(wTop - wBottom) <= 4,
      },
    };

    const exists = surveys.some((s) => s.id === updatedItem.id);
    let nextSurveys: SiteSurveyItem[];
    if (exists) {
      nextSurveys = surveys.map((s) => (s.id === updatedItem.id ? updatedItem : s));
    } else {
      nextSurveys = [updatedItem, ...surveys];
    }

    setSurveys(nextSurveys);
    saveSurveys(nextSurveys);
    setIsEditorOpen(false);
    setEditingItem(null);
    showToast('Medição de vistoria salva com sucesso!');
  };

  const handleApplyDimensionsToOrder = (survey: SiteSurveyItem) => {
    const targetOrder = orders.find((o) => o.id === survey.orderId || o.number === survey.orderNumber);
    if (!targetOrder) {
      showToast('OP correspondente não localizada para aplicar medidas.');
      return;
    }

    // Atualiza dimensões do item correspondente na OP
    const updatedItems = targetOrder.items.map((it) => {
      if (survey.orderItemId && it.id === survey.orderItemId) {
        return {
          ...it,
          width: survey.deduction.finishedFabricationWidthMm,
          height: survey.deduction.finishedFabricationHeightMm,
          notes: `${it.notes ? it.notes + ' • ' : ''}Medidas conferidas na obra (Vão Bruto: ${survey.deduction.minRoughWidthMm}×${survey.deduction.minRoughHeightMm}mm, Folga: ${survey.deduction.counterFrameClearanceMm}mm)`,
        };
      }
      return it;
    });

    updateOrder({
      ...targetOrder,
      items: updatedItems,
      history: [
        ...targetOrder.history,
        {
          date: new Date().toISOString().slice(0, 10),
          action: `Medidas de campo da vistoria técnica aplicadas ao vão ${survey.roomName} (${survey.deduction.finishedFabricationWidthMm}×${survey.deduction.finishedFabricationHeightMm}mm).`,
        },
      ],
    });

    showToast(`Medidas de fabricação atualizadas com sucesso na OP #${targetOrder.number}!`);
  };

  const handleAddSamplePhoto = (surveyId: string) => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=600&q=80',
    ];
    const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];

    const updated = surveys.map((s) => {
      if (s.id === surveyId) {
        return { ...s, photos: [...s.photos, randomPhoto] };
      }
      return s;
    });
    setSurveys(updated);
    saveSurveys(updated);
    showToast('Foto do vão adicionada ao registro da vistoria.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500/60 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 text-xs text-emerald-300 font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Ruler className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                Vistoria Técnica &amp; Medição de Vãos na Obra
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                CAMPO / MOBILE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Validação de esquadro por diagonais cruzadas (D1 vs D2), nível, prumo e dedução de contramarco (NBR 10821)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setHardwareCalculatorInitialOrderId(selectedOrderIdFilter !== 'ALL' ? selectedOrderIdFilter : null);
              setIsHardwareCalculatorOpen(true);
            }}
            title="Calculador de Insumos de Fixação (Contramarco, Silicone PU, Espuma e Parafusos)"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-sm hover:border-amber-500/40 active:scale-95"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Insumos de Fixação (PU/Contramarco)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewSurveyModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-900/30 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Medição de Vão</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo & Estatísticas de Diagnóstico */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total de Vãos</span>
            <span className="text-xl font-bold text-white font-mono">{stats.total}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">No Esquadro (OK)</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{stats.perfect}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Tolerável (Δ ≤ 8mm)</span>
            <span className="text-xl font-bold text-amber-400 font-mono">{stats.tolerable}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Crítico (Fora Esquadro)</span>
            <span className="text-xl font-bold text-red-400 font-mono">{stats.critical}</span>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, ambiente, OP #, tipologia..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos os Diagnósticos</option>
            <option value="PERFECT">Apenas no Esquadro (Perfeito)</option>
            <option value="TOLERABLE">Apenas Toleráveis</option>
            <option value="CRITICAL_OUT_OF_SQUARE">Apenas Críticos / Fora de Esquadro</option>
          </select>

          <select
            value={selectedOrderIdFilter}
            onChange={(e) => setSelectedOrderIdFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todas as OPs</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                OP #{o.number} - {o.clientName.slice(0, 20)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Vãos Medidos */}
      {filteredSurveys.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Ruler className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhuma medição de vão encontrada</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Clique no botão "Nova Medição de Vão" para registrar as dimensões de alvenaria e conferir o esquadro no local da obra.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSurveys.map((survey) => {
            const isCritical = survey.squareness.status === 'CRITICAL_OUT_OF_SQUARE';
            const isTolerable = survey.squareness.status === 'TOLERABLE';

            return (
              <div
                key={survey.id}
                className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xl transition-all relative overflow-hidden ${
                  isCritical
                    ? 'border-red-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/20'
                    : isTolerable
                    ? 'border-amber-500/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                        OP #{survey.orderNumber}
                      </span>
                      <h3 className="text-base font-bold text-white">{survey.roomName}</h3>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">
                      {survey.clientName} • <span className="text-slate-300 font-medium">{survey.typologyName}</span>
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border flex items-center gap-1 ${
                      isCritical
                        ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                        : isTolerable
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {isCritical ? (
                      <XCircle className="w-3 h-3" />
                    ) : isTolerable ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    <span>{survey.squareness.statusLabel}</span>
                  </span>
                </div>

                {/* Grid Visual de Medição */}
                <div className="grid grid-cols-2 gap-3 my-3 text-xs font-mono">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-sans text-slate-400 block font-semibold">
                      VÃO BRUTO (MENOR PONTO)
                    </span>
                    <div className="text-sm font-bold text-white">
                      {survey.deduction.minRoughWidthMm} × {survey.deduction.minRoughHeightMm} mm
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Topo: {survey.roughOpening.widthTopMm} | Base: {survey.roughOpening.widthBottomMm} mm
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-sans text-emerald-400 block font-semibold">
                      MEDIDA FINAL FABRICAÇÃO
                    </span>
                    <div className="text-sm font-black text-emerald-400">
                      {survey.deduction.finishedFabricationWidthMm} × {survey.deduction.finishedFabricationHeightMm} mm
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Contramarco: -{survey.deduction.counterFrameClearanceMm * 2}mm ({survey.deduction.counterFrameClearanceMm}mm/lado)
                    </div>
                  </div>
                </div>

                {/* Diagnóstico de Diagonais (Esquadro) */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-sans">Diagonais:</span>
                    <span className="text-emerald-400 font-bold">D1: {survey.diagonals.diagonal1Mm} mm</span>
                    <span className="text-blue-400 font-bold">D2: {survey.diagonals.diagonal2Mm} mm</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-slate-400 font-sans text-[11px]">Diferença:</span>
                    <span
                      className={`text-sm ${
                        isCritical ? 'text-red-400' : isTolerable ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      Δ {survey.squareness.diffMm} mm
                    </span>
                  </div>
                </div>

                {/* Recomendação Técnica */}
                <div className="my-2.5 text-[11px] text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{survey.squareness.recommendation}</span>
                </div>

                {/* Fotos e Detalhes da Alvenaria */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Parede: <b className="text-slate-300 font-sans">{survey.wallType}</b></span>
                    <span>•</span>
                    <span>Arremate: <b className="text-slate-300 font-sans">{survey.casingType}</b></span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddSamplePhoto(survey.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Adicionar foto da alvenaria na obra"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    {survey.photos.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        {survey.photos.length} foto(s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de Ações do Card */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditSurvey(survey)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => printSiteSurveySheet(survey)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                      title="Imprimir Ficha Técnica de Vistoria (PDF)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHardwareCalculatorInitialOrderId(survey.orderId);
                        setIsHardwareCalculatorOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 cursor-pointer"
                      title="Calcular Insumos de Fixação (Grampos, PU, Parafusos) para esta OP"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSurvey(survey.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 cursor-pointer"
                      title="Excluir medição"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyDimensionsToOrder(survey)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
                    title="Aplica a medida final deduzida direto ao pedido de produção"
                  >
                    <span>Aplicar à OP #{survey.orderNumber}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Editor / Nova Medição de Vão (Mobile-Friendly) */}
      {isEditorOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            
            {/* Topo do Modal */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Ruler className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem.id?.startsWith('survey_') && editingItem.roomName !== 'Novo Vão'
                      ? `Editar Medição: ${editingItem.roomName}`
                      : 'Nova Medição de Vão na Obra'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Preencha as medidas reais da alvenaria para calcular folgas e esquadro
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Editor */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin text-xs">
              
              {/* Vínculo de Ordem & Ambiente */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Ordem de Produção (OP):
                  </label>
                  <select
                    value={editingItem.orderId}
                    onChange={(e) => {
                      const selected = orders.find((o) => o.id === e.target.value);
                      if (selected) {
                        setEditingItem({
                          ...editingItem,
                          orderId: selected.id,
                          orderNumber: selected.number,
                          clientName: selected.clientName,
                        });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        OP #{o.number} - {o.clientName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Ambiente / Vão:
                  </label>
                  <input
                    type="text"
                    value={editingItem.roomName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, roomName: e.target.value })}
                    placeholder="Ex: Sala de Estar - Vão 01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Tipologia Projetada:
                  </label>
                  <input
                    type="text"
                    value={editingItem.typologyName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, typologyName: e.target.value })}
                    placeholder="Ex: Janela 2F Suprema"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Medidas de Vão Bruto da Alvenaria (6 Pontos) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Medição do Vão Bruto (Alvenaria Real em mm)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    3 larguras e 3 alturas para detectar barriga na parede
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Largura Topo (mm):</label>
                    <input
                      type="number"
                      value={editingItem.roughOpening?.widthTopMm || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          roughOpening: {
                            ...editingItem.roughOpening!,
                            widthTopMm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-bold font-mono text-white focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Largura Meio (mm):</label>
                    <input
                      type="number"
                      value={editingItem.roughOpening?.widthCenterMm || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          roughOpening: {
                            ...editingItem.roughOpening!,
                            widthCenterMm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-bold font-mono text-white focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Largura Base (mm):</label>
                    <input
                      type="number"
                      value={editingItem.roughOpening?.widthBottomMm || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          roughOpening: {
                            ...editingItem.roughOpening!,
                            widthBottomMm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-bold font-mono text-white focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Altura Esquerda (mm):</label>
                    <input
                      type="number"
                      value={editingItem.roughOpening?.heightLeftMm || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          roughOpening: {
                            ...editingItem.roughOpening!,
                            heightLeftMm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-bold font-mono text-white focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Altura Centro (mm):</label>
                    <input
                      type="number"
                      value={editingItem.roughOpening?.heightCenterMm || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          roughOpening: {
                            ...editingItem.roughOpening!,
                            heightCenterMm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-bold font-mono text-white focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Altura Direita (mm):</label>
                    <input
                      type="number"
                      value={editingItem.roughOpening?.heightRightMm || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          roughOpening: {
                            ...editingItem.roughOpening!,
                            heightRightMm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-bold font-mono text-white focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Verificador de Esquadro pelas Diagonais Cruzadas */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verificação de Esquadro (Diagonais Cruzadas D1 vs D2)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const w = editingItem.roughOpening?.widthTopMm || 1200;
                      const h = editingItem.roughOpening?.heightLeftMm || 1200;
                      const ideal = Math.round(Math.sqrt(w * w + h * h));
                      setEditingItem({
                        ...editingItem,
                        diagonals: { diagonal1Mm: ideal, diagonal2Mm: ideal },
                      });
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline cursor-pointer"
                  >
                    Auto-calcular diagonal teórica perfeita
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      Diagonal 1 (Inf. Esq ➔ Sup. Dir):
                    </label>
                    <input
                      type="number"
                      value={editingItem.diagonals?.diagonal1Mm || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          diagonals: {
                            ...editingItem.diagonals!,
                            diagonal1Mm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-bold font-mono text-emerald-400 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      Diagonal 2 (Inf. Dir ➔ Sup. Esq):
                    </label>
                    <input
                      type="number"
                      value={editingItem.diagonals?.diagonal2Mm || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          diagonals: {
                            ...editingItem.diagonals!,
                            diagonal2Mm: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-bold font-mono text-blue-400 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Resultado do Esquadro em Tempo Real */}
                {editingItem.diagonals?.diagonal1Mm && editingItem.diagonals?.diagonal2Mm ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-sans">Diferença de Esquadro:</span>
                      <span
                        className={`text-base font-black ${
                          Math.abs(editingItem.diagonals.diagonal1Mm - editingItem.diagonals.diagonal2Mm) > 8
                            ? 'text-red-400'
                            : Math.abs(editingItem.diagonals.diagonal1Mm - editingItem.diagonals.diagonal2Mm) > 3
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        Δ {Math.abs(editingItem.diagonals.diagonal1Mm - editingItem.diagonals.diagonal2Mm)} mm
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        Math.abs(editingItem.diagonals.diagonal1Mm - editingItem.diagonals.diagonal2Mm) > 8
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : Math.abs(editingItem.diagonals.diagonal1Mm - editingItem.diagonals.diagonal2Mm) > 3
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {Math.abs(editingItem.diagonals.diagonal1Mm - editingItem.diagonals.diagonal2Mm) > 8
                        ? 'CRÍTICO: FORA DE ESQUADRO'
                        : Math.abs(editingItem.diagonals.diagonal1Mm - editingItem.diagonals.diagonal2Mm) > 3
                        ? 'TOLERÁVEL COM ARREMATE'
                        : 'PERFEITO NO ESQUADRO'}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Folga de Contramarco, Alvenaria e Arremate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Folga de Contramarco (mm/lado):
                  </label>
                  <select
                    value={editingItem.deduction?.counterFrameClearanceMm || 25}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        deduction: {
                          ...editingItem.deduction!,
                          counterFrameClearanceMm: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value={20}>20 mm (folga justa)</option>
                    <option value={25}>25 mm (padrão Brasil)</option>
                    <option value={30}>30 mm (alvenaria irregular)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Tipo de Parede / Estrutura:
                  </label>
                  <select
                    value={editingItem.wallType || 'Alvenaria Tijolo Cerâmico'}
                    onChange={(e) => setEditingItem({ ...editingItem, wallType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Alvenaria Tijolo Cerâmico">Alvenaria Tijolo Cerâmico</option>
                    <option value="Bloco Concreto">Bloco de Concreto</option>
                    <option value="Concreto Armado">Concreto Armado</option>
                    <option value="Drywall / Steel Frame">Drywall / Steel Frame</option>
                    <option value="Estrutura Metálica">Estrutura Metálica</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Modelo de Arremate:
                  </label>
                  <select
                    value={editingItem.casingType || 'Arremate Padrão (50mm)'}
                    onChange={(e) => setEditingItem({ ...editingItem, casingType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Arremate Padrão (50mm)">Arremate Padrão (50mm)</option>
                    <option value="Arremate Duplo L">Arremate Duplo L</option>
                    <option value="Sem Arremate (Massa corrida)">Sem Arremate (Massa corrida)</option>
                    <option value="Chapa Especial">Chapa Especial</option>
                  </select>
                </div>
              </div>

              {/* Observações Técnicas */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Observações Técnicas de Campo &amp; Recomendações:
                </label>
                <textarea
                  rows={2}
                  value={editingItem.technicalNotes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, technicalNotes: e.target.value })}
                  placeholder="Ex: Necessário arremate duplo, ponto de ancoragem reforçado na coluna esquerda, piso com inclinação de 3mm..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveEditor}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-900/30 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Salvar Medição de Vão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Calculador de Insumos de Fixação */}
      {isHardwareCalculatorOpen && (
        <InstallationHardwareCalculatorModal
          isOpen={isHardwareCalculatorOpen}
          onClose={() => setIsHardwareCalculatorOpen(false)}
          orders={orders}
          initialOrderId={hardwareCalculatorInitialOrderId}
          initialSurveys={surveys}
          showToast={showToast}
        />
      )}
    </div>
  );
};
