import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DeliveryRomaneio } from '../types';
import {
  Truck,
  Plus,
  Printer,
  Copy,
  Trash2,
  CheckCircle,
  Clock,
  User,
  MapPin,
  FileCheck,
  Search,
  PackagePlus,
  Boxes,
  PlusCircle,
  Sparkles,
  Eye,
} from 'lucide-react';
import { openPrintWindow, renderCorporatePdfHeader } from '../utils/pdfPrint';
import { VehicleLoadPlannerModal } from './VehicleLoadPlannerModal';
import { RomaneioPdfPreviewModal } from './RomaneioPdfPreviewModal';
import { printRomaneioPdf, calculateRomaneioDetailedTotals } from '../utils/romaneioPdf';

export const RomaneioManager: React.FC = () => {
  const {
    romaneios,
    orders,
    addRomaneio,
    updateRomaneio,
    deleteRomaneio,
  } = useApp();

  const [selectedRomaneioId, setSelectedRomaneioId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadPlannerOpen, setIsLoadPlannerOpen] = useState(false);
  const [previewRomaneio, setPreviewRomaneio] = useState<DeliveryRomaneio | null>(null);

  // Formulário do Romaneio
  const [formData, setFormData] = useState<Partial<DeliveryRomaneio>>({
    clientName: '',
    address: '',
    date: new Date().toISOString().slice(0, 10),
    driverName: '',
    vehiclePlate: '',
    invoiceNumber: '',
    status: 'Pendente',
    items: [],
  });

  const [selectedOrderIdToImport, setSelectedOrderIdToImport] = useState<string>('');

  // Estado para Adicionar Item Avulso / Extra (Ex: 500 Chumbadores, Contra-marco, etc.)
  const [customItemDesc, setCustomItemDesc] = useState('');
  const [customItemDim, setCustomItemDim] = useState('Padrão');
  const [customItemQty, setCustomItemQty] = useState<number>(500);
  const [customItemLoc, setCustomItemLoc] = useState('Obra / Alvenaria');
  const [customItemWeight, setCustomItemWeight] = useState<number>(15);

  // Modal para adicionar item avulso a romaneio já salvo
  const [quickAddRomaneioId, setQuickAddRomaneioId] = useState<string | null>(null);

  // Toast in-app notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Presets de itens avulsos comuns em serralheria e obras
  const QUICK_MATERIAL_PRESETS = [
    { desc: '500 Chumbadores de Aço com Bucha 8mm', dim: '5/16" × 75mm', qty: 500, loc: 'Fixação / Alvenaria', weight: 18 },
    { desc: 'Contra-marcos de Alumínio Linha Suprema', dim: '1500 × 1200 mm', qty: 4, loc: 'Vãos Térreo', weight: 12 },
    { desc: 'Tubos de Silicone Neutro Industrial 300g', dim: '300 ml / Preto', qty: 12, loc: 'Vedação Caixilhos', weight: 4.2 },
    { desc: 'Espuma Expansiva de Poliuretano 500ml', dim: '500 ml / 480g', qty: 6, loc: 'Preenchimento Vão', weight: 3.0 },
    { desc: 'Calços de Apoio de Borracha EPDM (NBR 7199)', dim: '5 × 25 × 100 mm', qty: 100, loc: 'Envidraçamento', weight: 2.5 },
    { desc: 'Presilhas e Grampos de Fixação em Nylon', dim: 'Padrão Suprema', qty: 50, loc: 'Cantos do Marco', weight: 1.0 },
    { desc: 'Parafusos Inox Cabeça Panela AISI 304', dim: '4.8 × 50 mm', qty: 200, loc: 'Montagem e Fixação', weight: 2.2 },
    { desc: 'Tampas Plásticas de Dreno com Membrana', dim: 'Oblongo 5×20mm', qty: 40, loc: 'Soleiras Externas', weight: 0.5 },
  ];

  // Importar esquadrias de um pedido
  const handleImportFromOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const importedItems = order.items.map((it) => {
      const area = (it.width * it.height * it.quantity) / 1000000;
      const weightEst = Math.round(area * 14 * 10) / 10; // estimativa kg
      return {
        description: `${it.typologyName} (${it.color})`,
        dimensions: `${it.width} × ${it.height} mm`,
        quantity: it.quantity,
        location: it.roomTag || 'Geral',
        weightKg: weightEst,
      };
    });

    setFormData((prev) => ({
      ...prev,
      orderId: order.id,
      orderNumber: order.number,
      clientName: prev.clientName || order.clientName,
      address: prev.address || order.clientAddress,
      items: [...(prev.items || []), ...importedItems],
    }));

    showToast(`✔ ${importedItems.length} esquadria(s) do Pedido #${order.number} adicionadas ao romaneio!`);
  };

  // Adicionar item avulso ao formulário atual
  const handleAddCustomItemToForm = () => {
    if (!customItemDesc.trim()) {
      showToast('Informe a descrição do item (ex: 500 Chumbadores, Contra-marco, etc.)');
      return;
    }

    const newItem = {
      description: customItemDesc.trim(),
      dimensions: customItemDim.trim() || 'Avulso',
      quantity: Math.max(1, customItemQty),
      location: customItemLoc.trim() || 'Geral',
      weightKg: Math.max(0, customItemWeight),
    };

    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));

    // Resetar campos
    setCustomItemDesc('');
    setCustomItemQty(1);
    setCustomItemDim('Padrão');
    setCustomItemWeight(2);
  };

  // Aplicar preset rápido
  const handleApplyPreset = (preset: typeof QUICK_MATERIAL_PRESETS[0]) => {
    setCustomItemDesc(preset.desc);
    setCustomItemDim(preset.dim);
    setCustomItemQty(preset.qty);
    setCustomItemLoc(preset.loc);
    setCustomItemWeight(preset.weight);
  };

  // Remover item do romaneio
  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  };

  // Adicionar item avulso a romaneio já salvo
  const handleQuickAddExtraToSavedRomaneio = (romId: string) => {
    const rom = romaneios.find((r) => r.id === romId);
    if (!rom) return;

    if (!customItemDesc.trim()) {
      showToast('Informe a descrição do item avulso.');
      return;
    }

    const newItem = {
      description: customItemDesc.trim(),
      dimensions: customItemDim.trim() || 'Avulso',
      quantity: Math.max(1, customItemQty),
      location: customItemLoc.trim() || 'Obra',
      weightKg: Math.max(0, customItemWeight),
    };

    updateRomaneio({
      ...rom,
      items: [...rom.items, newItem],
    });

    setQuickAddRomaneioId(null);
    setCustomItemDesc('');
    showToast(`✔ Item "${newItem.description}" adicionado com sucesso ao Romaneio Nº ${rom.number}!`);
  };

  const handleSaveRomaneio = () => {
    if (!formData.clientName?.trim() || !formData.items || formData.items.length === 0) {
      showToast('Informe o cliente/obra e adicione pelo menos um item (esquadria ou material avulso) ao romaneio.');
      return;
    }

    if (isEditing && selectedRomaneioId) {
      const existing = romaneios.find((r) => r.id === selectedRomaneioId);
      if (existing) {
        updateRomaneio({
          ...existing,
          ...formData,
        } as DeliveryRomaneio);
      }
      setIsEditing(false);
      setSelectedRomaneioId(null);
    } else {
      addRomaneio({
        orderId: formData.orderId || '',
        orderNumber: formData.orderNumber || 0,
        clientName: formData.clientName.trim(),
        address: formData.address || '',
        date: formData.date || new Date().toISOString().slice(0, 10),
        driverName: formData.driverName || '',
        vehiclePlate: formData.vehiclePlate || '',
        invoiceNumber: formData.invoiceNumber || '',
        status: formData.status || 'Pendente',
        items: formData.items || [],
      });
      setIsEditing(false);
    }

    showToast('✔ Romaneio salvo com sucesso!');
  };

  // Impressão Oficial do Romaneio com dados completos de m² e peso
  const handlePrintRomaneio = (rom: DeliveryRomaneio) => {
    printRomaneioPdf(rom);
  };

  // Prévia do formulário em edição no formato oficial A4
  const handlePreviewCurrentForm = () => {
    if (!formData.items || formData.items.length === 0) {
      showToast('Adicione pelo menos um item ao romaneio para visualizar a prévia em PDF.');
      return;
    }

    const draftRomaneio: DeliveryRomaneio = {
      id: selectedRomaneioId || 'draft',
      number: selectedRomaneioId
        ? (romaneios.find((r) => r.id === selectedRomaneioId)?.number || 1)
        : (romaneios.length > 0 ? Math.max(...romaneios.map((r) => r.number)) + 1 : 1),
      orderId: formData.orderId || '',
      orderNumber: formData.orderNumber || 0,
      clientName: formData.clientName?.trim() || 'Cliente / Obra em Edição',
      address: formData.address || '',
      date: formData.date || new Date().toISOString().slice(0, 10),
      driverName: formData.driverName || '',
      vehiclePlate: formData.vehiclePlate || '',
      invoiceNumber: formData.invoiceNumber || '',
      status: formData.status || 'Pendente',
      items: formData.items || [],
    };

    setPreviewRomaneio(draftRomaneio);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-amber-300 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Romaneios de Carga & Expedição</h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                LOGÍSTICA LIVRE
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Controle de transporte, romaneios com esquadrias do pedido e inclusão livre de qualquer material (chumbadores, contra-marcos, silicones).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLoadPlannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
            title="Simular distribuição de esquadrias e vidros nos cavaletes em A e veículo"
          >
            <Truck className="w-4 h-4" />
            <span>Simulador de Cavaletes & Carga</span>
          </button>

          <button
            onClick={() => {
              setFormData({
                clientName: '',
                address: '',
                date: new Date().toISOString().slice(0, 10),
                driverName: '',
                vehiclePlate: '',
                invoiceNumber: '',
                status: 'Pendente',
                items: [],
              });
              setIsEditing(true);
              setSelectedRomaneioId(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Romaneio</span>
          </button>
        </div>
      </div>

      {/* Formulário de Criação / Edição de Romaneio */}
      {isEditing && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-purple-400" />
              <span>{selectedRomaneioId ? 'Editar Romaneio de Carga' : 'Montagem do Romaneio de Carga'}</span>
            </h2>
            <button
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-white p-1 text-sm cursor-pointer"
            >
              ✕ Fechar
            </button>
          </div>

          {/* Dados Gerais da Carga */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Destinatário / Obra *</label>
              <input
                type="text"
                placeholder="Ex: Condomínio Alphaville - Lote 14"
                value={formData.clientName || ''}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Endereço de Entrega</label>
              <input
                type="text"
                placeholder="Rua, número, bairro e cidade"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Motorista</label>
              <input
                type="text"
                placeholder="Nome do motorista / transportador"
                value={formData.driverName || ''}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Veículo / Placa</label>
              <input
                type="text"
                placeholder="Ex: Iveco Daily - ABC-1234"
                value={formData.vehiclePlate || ''}
                onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Data da Expedição</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nota Fiscal (NF-e)</label>
              <input
                type="text"
                placeholder="Ex: NF-e 004821"
                value={formData.invoiceNumber || ''}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Status da Carga</label>
              <select
                value={formData.status || 'Pendente'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="Pendente">Pendente</option>
                <option value="Separado">Separado no Galpão</option>
                <option value="Em Trânsito">Em Trânsito / Rota</option>
                <option value="Entregue">Entregue na Obra</option>
              </select>
            </div>
          </div>

          {/* Importação Opcional de Pedido */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Importar Esquadrias de um Pedido Existente (Opcional):
            </label>
            <div className="flex gap-2">
              <select
                value={selectedOrderIdToImport}
                onChange={(e) => setSelectedOrderIdToImport(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="">Selecione um pedido para importar esquadrias...</option>
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    Pedido #{ord.number} - {ord.clientName} ({ord.items.length} esquadrias)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleImportFromOrder(selectedOrderIdToImport)}
                disabled={!selectedOrderIdToImport}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-400 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Importar Itens
              </button>
            </div>
          </div>

          {/* SEÇÃO PRINCIPAL SOLICITADA: ADICIONAR QUALQUER ITEM AVULSO (Chumbadores, Contra-marco, etc.) */}
          <div className="bg-purple-950/20 border border-purple-800/60 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Adicionar Qualquer Material ou Item Fora do Orçamento
                </h3>
              </div>
              <span className="text-[10px] text-purple-400 font-mono">Chumbadores, Contra-marcos, Silicones, etc.</span>
            </div>

            {/* Chips de Atalhos Rápidos */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block">Atalhos de 1 clique para materiais frequentes:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_MATERIAL_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-purple-900/60 text-slate-300 hover:text-purple-200 border border-slate-800 hover:border-purple-700 text-[11px] transition-colors cursor-pointer"
                  >
                    + {p.desc.split(' ')[0]} {p.desc.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs do Item Avulso */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-400 block mb-0.5">Descrição do Item *</label>
                <input
                  type="text"
                  placeholder="Ex: 500 Chumbadores de Aço / Contra-marco"
                  value={customItemDesc}
                  onChange={(e) => setCustomItemDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Dimensão / Medida</label>
                <input
                  type="text"
                  placeholder="Ex: 5/16 x 75mm / 1500x1200"
                  value={customItemDim}
                  onChange={(e) => setCustomItemDim(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Qtd (unidades)</label>
                <input
                  type="number"
                  min="1"
                  value={customItemQty}
                  onChange={(e) => setCustomItemQty(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold text-cyan-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Peso Estimado (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={customItemWeight}
                  onChange={(e) => setCustomItemWeight(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <input
                type="text"
                placeholder="Local / Pavimento / Observação (Ex: Alvenaria Térreo, Caixa de Acessórios)"
                value={customItemLoc}
                onChange={(e) => setCustomItemLoc(e.target.value)}
                className="w-2/3 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />

              <button
                type="button"
                onClick={handleAddCustomItemToForm}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Adicionar ao Romaneio</span>
              </button>
            </div>
          </div>

          {/* Tabela de Itens Carregados no Romaneio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Itens e Materiais Inclusos no Romaneio ({formData.items?.length || 0})
              </h3>
              <span className="text-xs text-cyan-400 font-bold">
                Peso Total da Carga: {(formData.items?.reduce((s, i) => s + i.weightKg, 0) || 0).toFixed(1)} kg
              </span>
            </div>

            {(!formData.items || formData.items.length === 0) ? (
              <div className="py-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                Nenhum item adicionado ainda. Use a caixa roxa acima para adicionar 500 chumbadores, contra-marcos ou importe esquadrias de um pedido.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Descrição do Produto / Material</th>
                      <th className="py-2.5 px-3">Dimensões / Especificação</th>
                      <th className="py-2.5 px-3 text-center">Quantidade</th>
                      <th className="py-2.5 px-3">Local / Destino</th>
                      <th className="py-2.5 px-3 text-right">Peso (kg)</th>
                      <th className="py-2.5 px-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {formData.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-white">{it.description}</td>
                        <td className="py-2 px-3 font-mono text-cyan-300">{it.dimensions}</td>
                        <td className="py-2 px-3 text-center font-bold text-amber-300 text-sm">{it.quantity} un</td>
                        <td className="py-2 px-3 text-slate-400">{it.location}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-200">{it.weightKg.toFixed(1)} kg</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                            title="Remover este item do romaneio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePreviewCurrentForm}
              className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              title="Visualizar documento oficial A4 com cálculo detalhado de m² e peso antes de salvar"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Prévia & Detalhes A4</span>
            </button>
            <button
              type="button"
              onClick={handleSaveRomaneio}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer"
            >
              Salvar Romaneio Completo
            </button>
          </div>
        </div>
      )}

      {/* Grid de Romaneios Salvos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {romaneios.map((rom) => {
          const statusColors: Record<string, string> = {
            Pendente: 'border-amber-500 text-amber-400 bg-amber-950/40',
            Separado: 'border-cyan-500 text-cyan-400 bg-cyan-950/40',
            'Em Trânsito': 'border-purple-500 text-purple-400 bg-purple-950/40',
            Entregue: 'border-emerald-500 text-emerald-400 bg-emerald-950/40',
          };

          const { totals } = calculateRomaneioDetailedTotals(rom.items);

          return (
            <div
              key={rom.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-purple-400">
                    ROMANEIO Nº {rom.number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      statusColors[rom.status] || 'border-slate-700 text-slate-300'
                    }`}
                  >
                    {rom.status}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-sm text-slate-100">{rom.clientName}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{rom.address || 'Sem endereço especificado'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Motorista:</span>
                    <b>{rom.driverName || 'Frota Própria'}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Veículo:</span>
                    <b>{rom.vehiclePlate || '—'}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Itens / Volumes:</span>
                    <b className="text-cyan-400">{totals.totalPieces} volume(s)</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Área de Esquadrias:</span>
                    <b className="text-emerald-400">{totals.totalAreaM2.toFixed(2)} m²</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Peso Bruto:</span>
                    <b className="text-amber-400">{totals.totalWeightKg.toFixed(1)} kg</b>
                  </div>
                </div>

                {/* Lista prévia dos itens no romaneio */}
                <div className="text-[11px] text-slate-400 space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                  {rom.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center py-0.5 border-b border-slate-850">
                      <span className="truncate text-slate-300">• {it.description}</span>
                      <span className="font-mono font-bold text-purple-300 shrink-0 ml-2">{it.quantity} un</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações do Card */}
              <div className="pt-3 flex flex-wrap items-center justify-between border-t border-slate-800 gap-2">
                <select
                  value={rom.status}
                  onChange={(e) => updateRomaneio({ ...rom, status: e.target.value as any })}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Separado">Separado</option>
                  <option value="Em Trânsito">Em Trânsito</option>
                  <option value="Entregue">Entregue</option>
                </select>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      setQuickAddRomaneioId(rom.id);
                      setCustomItemDesc('500 Chumbadores de Aço');
                      setCustomItemQty(500);
                      setCustomItemDim('5/16" × 75mm');
                    }}
                    title="Adicionar item avulso rápido a este romaneio (Ex: Chumbadores, Contra-marco)"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 hover:bg-purple-900 transition-colors cursor-pointer text-[11px] font-semibold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Item</span>
                  </button>

                  <button
                    onClick={() => setPreviewRomaneio(rom)}
                    title="Visualizar documento oficial A4 com cálculo detalhado de peso e área m² antes de baixar/imprimir"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer text-[11px] font-bold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Prévia & PDF</span>
                  </button>

                  <button
                    onClick={() => handlePrintRomaneio(rom)}
                    title="Imprimir / Salvar PDF direto"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Excluir o romaneio Nº ${rom.number}?`)) {
                        deleteRomaneio(rom.id);
                      }
                    }}
                    title="Excluir romaneio"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Inclusão Rápida de Item Avulso em Romaneio Salvo */}
      {quickAddRomaneioId && (() => {
        const rom = romaneios.find((r) => r.id === quickAddRomaneioId);
        if (!rom) return null;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PackagePlus className="w-4 h-4 text-purple-400" />
                  <span>Adicionar Material ao Romaneio Nº {rom.number}</span>
                </h3>
                <button
                  onClick={() => setQuickAddRomaneioId(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Descrição do Item *</label>
                  <input
                    type="text"
                    value={customItemDesc}
                    onChange={(e) => setCustomItemDesc(e.target.value)}
                    placeholder="Ex: 500 Chumbadores de Aço / Contra-marco"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      value={customItemQty}
                      onChange={(e) => setCustomItemQty(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Especificação / Medida</label>
                    <input
                      type="text"
                      value={customItemDim}
                      onChange={(e) => setCustomItemDim(e.target.value)}
                      placeholder="Ex: 5/16 x 75mm"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Destino / Local</label>
                    <input
                      type="text"
                      value={customItemLoc}
                      onChange={(e) => setCustomItemLoc(e.target.value)}
                      placeholder="Ex: Obra / Alvenaria"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Peso Estimado (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={customItemWeight}
                      onChange={(e) => setCustomItemWeight(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickAddRomaneioId(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddExtraToSavedRomaneio(rom.id)}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Confirmar Inclusão
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Simulação de Carga e Cavaletes */}
      <VehicleLoadPlannerModal
        isOpen={isLoadPlannerOpen}
        onClose={() => setIsLoadPlannerOpen(false)}
        romaneio={romaneios.find((r) => r.id === selectedRomaneioId) || romaneios[0]}
      />

      {/* Modal de Prévia Interativa e Exportação PDF do Romaneio */}
      <RomaneioPdfPreviewModal
        isOpen={Boolean(previewRomaneio)}
        romaneio={previewRomaneio}
        onClose={() => setPreviewRomaneio(null)}
        onPrint={printRomaneioPdf}
      />
    </div>
  );
};
