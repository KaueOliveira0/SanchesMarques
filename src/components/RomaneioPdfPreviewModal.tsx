import React, { useState } from 'react';
import { DeliveryRomaneio } from '../types';
import {
  X,
  Printer,
  Download,
  Share2,
  Check,
  Truck,
  Scale,
  Maximize2,
  Package,
  Layers,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  calculateRomaneioDetailedTotals,
  calculateRomaneioItemMetrics,
  generateRomaneioWhatsAppText,
  printRomaneioPdf,
} from '../utils/romaneioPdf';
import { getEffectiveCompanyProfile } from '../utils/companyProfile';
import { getEffectiveLogoBase64 } from '../utils/logoData';

interface RomaneioPdfPreviewModalProps {
  isOpen: boolean;
  romaneio: DeliveryRomaneio | null;
  onClose: () => void;
  onPrint?: (rom: DeliveryRomaneio) => void;
}

export const RomaneioPdfPreviewModal: React.FC<RomaneioPdfPreviewModalProps> = ({
  isOpen,
  romaneio,
  onClose,
  onPrint,
}) => {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  if (!isOpen || !romaneio) return null;

  const profile = getEffectiveCompanyProfile();
  const logoSrc = getEffectiveLogoBase64();
  const { totals, detailedItems } = calculateRomaneioDetailedTotals(romaneio.items || []);

  const formattedDate = romaneio.date
    ? new Date(romaneio.date).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  const handlePrint = () => {
    if (onPrint) {
      onPrint(romaneio);
    } else {
      printRomaneioPdf(romaneio);
    }
  };

  const handleShareWhatsApp = () => {
    const text = generateRomaneioWhatsAppText(romaneio);
    navigator.clipboard?.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between overflow-y-auto p-2 sm:p-4">
      {/* Barra de Ferramentas Superior */}
      <div className="sticky top-0 z-20 max-w-5xl w-full mx-auto bg-slate-900/95 border border-slate-800 backdrop-blur rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">
                Prévia do Romaneio Nº {romaneio.number || 'Rascunho'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800">
                A4 FORMAT
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {romaneio.clientName || 'Cliente não informado'} · Detalhamento de Área ($m^2$) e Peso (kg)
            </p>
          </div>
        </div>

        {/* Resumo Rápido de Métricas */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Volumes:</span>
            <b className="text-cyan-300">{totals.totalPieces} un</b>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Área:</span>
            <b className="text-emerald-300">{totals.totalAreaM2.toFixed(2)} m²</b>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Peso Bruto:</span>
            <b className="text-amber-300">{totals.totalWeightKg.toFixed(1)} kg</b>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Densidade:</span>
            <b className="text-purple-300">{totals.avgKgPerM2.toFixed(1)} kg/m²</b>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
            title="Compartilhar resumo logístico pelo WhatsApp"
          >
            {copiedWhatsApp ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedWhatsApp ? 'Copiado!' : 'WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            title="Abrir diálogo de impressão e salvar em PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Baixar / Imprimir PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Fechar prévia"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Folha A4 de Prévia */}
      <div className="max-w-[860px] w-full mx-auto bg-white text-slate-900 rounded-sm shadow-2xl p-6 sm:p-10 border border-slate-300 font-sans print:border-none print:shadow-none mb-6">
        {/* Cabeçalho Corporativo Oficial */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            {logoSrc && (
              <img
                src={logoSrc}
                alt={profile.name}
                className="max-h-16 max-w-[150px] object-contain"
              />
            )}
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">
                {profile.name || 'Sanches & Marques Esquadrias'}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">
                {profile.cnpj ? `CNPJ/CPF: ${profile.cnpj} · ` : ''}
                {profile.phone ? `Fone: ${profile.phone} · ` : ''}
                {profile.email || ''}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {profile.address || 'Fábrica e Expedição de Esquadrias de Alto Padrão'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0 bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Expedição & Carga
            </span>
            <div className="text-base font-black text-slate-900 mt-1">
              ROMANEIO Nº {romaneio.number || 'RASCUNHO'}
            </div>
            <div className="text-[11px] text-slate-500">
              Data: <b>{formattedDate}</b>
            </div>
            <div className="text-[10px] text-slate-500">
              Status: <span className="font-semibold text-slate-800">{romaneio.status || 'Pendente'}</span>
            </div>
          </div>
        </div>

        {/* Linha Dourada de Destaque */}
        <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-full my-3"></div>

        {/* Título do Documento */}
        <div className="text-center my-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            Romaneio de Transporte, Carga & Descarregamento de Esquadrias
          </h2>
          <p className="text-[10px] text-slate-500">
            Conferência física de volumes, áreas vidradas ($m^2$) e peso bruto carregado (kg) · Conforme ABNT NBR 10821
          </p>
        </div>

        {/* Blocos de Informação do Cliente e Transporte */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Destinatário / Obra
            </div>
            <div className="text-sm font-bold text-slate-900">{romaneio.clientName || 'Cliente não informado'}</div>
            <div className="text-slate-600 text-[11px] flex items-start gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
              <span>{romaneio.address || 'Endereço da obra a definir'}</span>
            </div>
            <div className="text-[11px] text-slate-600 pt-1">
              Origem da Carga:{' '}
              <b>{romaneio.orderNumber ? `Ordem de Produção #${romaneio.orderNumber}` : 'Expedição Direta'}</b>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Transporte & Logística
            </div>
            <div className="text-[11px] text-slate-700">
              Motorista: <b>{romaneio.driverName || 'Frota Própria / Sanches & Marques'}</b>
            </div>
            <div className="text-[11px] text-slate-700">
              Veículo / Placa: <b>{romaneio.vehiclePlate || 'Não informada'}</b>
            </div>
            <div className="text-[11px] text-slate-700">
              Nota Fiscal (NF-e): <b>{romaneio.invoiceNumber || 'Acompanha romaneio de carga'}</b>
            </div>
            <div className="text-[11px] text-slate-700 pt-1">
              Data de Saída: <b>{formattedDate}</b>
            </div>
          </div>
        </div>

        {/* Tabela Detalhada com 9 Colunas Integrando Peso e Área */}
        <div className="border border-slate-300 rounded overflow-hidden mb-4">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-left">
                <th className="p-2 text-center w-8">#</th>
                <th className="p-2">Descrição do Item / Esquadria</th>
                <th className="p-2">Dimensões (L × A)</th>
                <th className="p-2 text-center w-12">Qtd</th>
                <th className="p-2 text-right">Área Unit (m²)</th>
                <th className="p-2 text-right">Área Total (m²)</th>
                <th className="p-2 text-right">Peso Unit (kg)</th>
                <th className="p-2 text-right">Peso Total (kg)</th>
                <th className="p-2 text-left">Local / Vão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {detailedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-slate-400">
                    Nenhum item adicionado a este romaneio.
                  </td>
                </tr>
              ) : (
                detailedItems.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                    }`}
                  >
                    <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2">
                      <b className="text-slate-900">{item.description}</b>
                    </td>
                    <td className="p-2 font-mono text-[10px] text-slate-700">
                      {item.dimensions}
                    </td>
                    <td className="p-2 text-center font-bold text-amber-700 text-xs">
                      {item.quantity}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600">
                      {item.unitAreaM2 > 0 ? `${item.unitAreaM2.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-800">
                      {item.totalAreaM2 > 0 ? `${item.totalAreaM2.toFixed(2)} m²` : '—'}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600">
                      {item.unitWeightKg > 0 ? `${item.unitWeightKg.toFixed(1)}` : '—'}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      {item.totalWeightKg.toFixed(1)} kg
                    </td>
                    <td className="p-2 text-slate-600 text-[10px]">{item.location || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quadro Consolidado de Totais e Métricas Técnicas */}
        <div className="bg-slate-100 border border-slate-300 rounded p-3 mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center divide-x divide-slate-200">
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Total de Volumes</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {totals.totalPieces} <span className="text-xs font-normal text-slate-600">un</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Área Total de Vãos</div>
              <div className="text-base font-black text-emerald-800 mt-0.5">
                {totals.totalAreaM2.toFixed(2)} <span className="text-xs font-normal text-slate-600">m²</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Peso Bruto da Carga</div>
              <div className="text-base font-black text-amber-700 mt-0.5">
                {totals.totalWeightKg.toFixed(1)} <span className="text-xs font-normal text-slate-600">kg</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Densidade Estrutural</div>
              <div className="text-base font-black text-slate-800 mt-0.5">
                {totals.avgKgPerM2.toFixed(1)} <span className="text-xs font-normal text-slate-600">kg/m²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Termo de Conferência e Responsabilidade de Entrega */}
        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[10px] text-slate-600 leading-relaxed mb-8">
          <div className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Declaração de Conferência e Recebimento no Canteiro de Obras:</span>
          </div>
          <p>
            Declaro ter conferido e recebido no canteiro de obras os volumes, perfis de alumínio, vidros,
            acessórios e materiais descritos neste romaneio. Todos os itens foram descarregados em perfeito
            estado de conservação, com perfis isentos de riscos e avarias na pintura/anodização e vidros
            íntegros, em estrita conformidade com o projeto técnico e os padrões da norma <b>ABNT NBR 10821</b>.
          </p>
        </div>

        {/* Campos Oficiais de Assinatura */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center pt-4">
          <div className="space-y-1">
            <div className="border-t border-slate-900 pt-2 w-3/4 mx-auto font-bold text-xs text-slate-900">
              Assinatura do Recebedor na Obra
            </div>
            <div className="text-[10px] text-slate-500">Nome Legível / CPF / Cargo</div>
          </div>
          <div className="space-y-1">
            <div className="border-t border-slate-900 pt-2 w-3/4 mx-auto font-bold text-xs text-slate-900">
              Assinatura do Motorista / Expedição
            </div>
            <div className="text-[10px] text-slate-500">Responsável pelo Transporte da Carga</div>
          </div>
        </div>

        {/* Rodapé do Documento */}
        <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400">
          Documento Oficial de Expedição e Logística · {profile.name || 'Sanches & Marques Esquadrias'} · Gerado em{' '}
          {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
};
