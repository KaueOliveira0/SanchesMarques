import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Search,
  Printer,
  Copy,
  Check,
  Cpu,
  Layers,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Bookmark,
  Building2,
  ArrowRight,
} from 'lucide-react';
import {
  HARDWARE_DRILL_TEMPLATES,
  HardwareTemplate,
  filterHardwareTemplates,
} from '../utils/hardwareDrillTemplates';

export const HardwareDrillGuide: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    HARDWARE_DRILL_TEMPLATES[0].id
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [seriesFilter, setSeriesFilter] = useState<string>('ALL');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredTemplates = useMemo(() => {
    return filterHardwareTemplates(HARDWARE_DRILL_TEMPLATES, {
      searchTerm,
      manufacturer: manufacturerFilter,
      category: categoryFilter,
      series: seriesFilter,
    });
  }, [searchTerm, manufacturerFilter, categoryFilter, seriesFilter]);

  const activeTemplate: HardwareTemplate = useMemo(() => {
    return (
      filteredTemplates.find((t) => t.id === selectedTemplateId) ||
      filteredTemplates[0] ||
      HARDWARE_DRILL_TEMPLATES[0]
    );
  }, [filteredTemplates, selectedTemplateId]);

  const handleCopySpecs = () => {
    const text = `🔧 *GABARITO DE USINAGEM - ${activeTemplate.name}*\n` +
      `Fabricante: ${activeTemplate.manufacturer} | Linhas: ${activeTemplate.compatibleSeries.join(', ')}\n` +
      `Perfis: ${activeTemplate.compatibleProfiles.join(', ')}\n` +
      `Altura do Piso: ${activeTemplate.standardHeightFromFloorMm}mm\n` +
      `Rasgo Frontal: ${activeTemplate.faceSlotDimensions.lengthMm} x ${activeTemplate.faceSlotDimensions.widthMm}mm (${activeTemplate.faceSlotDimensions.cornerType})\n` +
      `Punção/Fresagem: Broca Ø ${activeTemplate.recommendedTooling.routerMillingBitMm}mm @ ${activeTemplate.recommendedTooling.rotationalSpeedRpm}\n` +
      `Estampo: ${activeTemplate.recommendedTooling.pressMachineStation || 'Fresadora Copiadora'}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
    } catch {}
    setCopiedSuccess(true);
    showToast('Parâmetros de furação copiados com sucesso!');
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handlePrint1to1 = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Gabarito 1:1 - ${activeTemplate.name}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #000; margin: 0; padding: 0; }
    .header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 14pt; }
    .header p { margin: 2px 0 0; font-size: 9pt; color: #555; }
    .notice { background: #eee; padding: 6px 10px; font-size: 8.5pt; font-weight: bold; border-left: 3px solid #000; margin-bottom: 15px; }
    
    /* Escala 1:1 real milimétrica */
    .blueprint-box {
      width: 80mm;
      height: ${Math.max(220, activeTemplate.faceSlotDimensions.lengthMm + 40)}mm;
      border: 1px dashed #666;
      margin: 10px auto;
      position: relative;
      background: #fafafa;
    }
    .profile-axis {
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 1px;
      background: #000;
      transform: translateX(-50%);
    }
    .slot-cut {
      position: absolute;
      left: 50%;
      top: 50%;
      width: ${activeTemplate.faceSlotDimensions.widthMm}mm;
      height: ${activeTemplate.faceSlotDimensions.lengthMm}mm;
      transform: translate(-50%, -50%);
      border: 2px solid #e11d48;
      background: #fff;
      border-radius: ${activeTemplate.faceSlotDimensions.cornerRadiusMm || 0}mm;
    }
    .hole {
      position: absolute;
      left: 50%;
      transform: translate(-50%, -50%);
      border: 1.5px solid #2563eb;
      background: #fff;
      border-radius: 50%;
    }
    .cota-line {
      position: absolute;
      font-size: 7pt;
      font-weight: bold;
      color: #000;
    }
    .meta-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 8.5pt; }
    .meta-table td, .meta-table th { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
    .meta-table th { background: #f0f0f0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>GABARITO DE USINAGEM ESCALA 1:1 (IMPRESSÃO REAL)</h1>
    <p>Acessório: ${activeTemplate.name} • Fabricante: ${activeTemplate.manufacturer} • Perfis: ${activeTemplate.compatibleProfiles.join(', ')}</p>
  </div>

  <div class="notice">
    ⚠️ ATENÇÃO: Verifique com uma régua de aço se a escala está exata após a impressão (Configuração da impressora em: Escala 100% / Não ajustar à página).
  </div>

  <div class="blueprint-box">
    <div class="profile-axis"></div>
    <div class="slot-cut"></div>
    ${activeTemplate.fixingHoles.map(h => `
      <div class="hole" style="top: calc(50% + ${h.yOffsetMm}mm); width: ${h.drillBitMm}mm; height: ${h.drillBitMm}mm;"></div>
    `).join('')}
  </div>

  <table class="meta-table">
    <tr><th>Dimensão do Rasgo</th><td>${activeTemplate.faceSlotDimensions.lengthMm} × ${activeTemplate.faceSlotDimensions.widthMm} mm (${activeTemplate.faceSlotDimensions.cornerType})</td></tr>
    <tr><th>Altura Recomendada do Piso</th><td>${activeTemplate.standardHeightFromFloorMm} mm até o centro</td></tr>
    <tr><th>Broca / Fresa Indicada</th><td>Ø ${activeTemplate.recommendedTooling.routerMillingBitMm} mm • ${activeTemplate.recommendedTooling.rotationalSpeedRpm}</td></tr>
    <tr><th>Estampo / Prensa</th><td>${activeTemplate.recommendedTooling.pressMachineStation || 'Fresadora Copiadora Pantográfica'}</td></tr>
  </table>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 350);
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

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">
                Gabaritos de Usinagem &amp; Furação de Fechaduras (1:1)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                CHÃO DE FÁBRICA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cotas milimétricas, prensas de estampo e desenhos para fechos concha, fechaduras bico de papagaio e roldanas (Udinese, Fermax, Papaiz).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopySpecs}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-sm active:scale-95"
          >
            {copiedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copiedSuccess ? 'Copiado!' : 'Copiar Parâmetros'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint1to1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-900/30 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Gabarito 1:1</span>
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por acessório ou perfil (ex: SU-053, Papaiz)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={manufacturerFilter}
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium"
            >
              <option value="ALL">Todos os Fabricantes</option>
              <option value="Udinese">Udinese</option>
              <option value="Fermax">Fermax</option>
              <option value="Papaiz">Papaiz</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="fecho_concha">Fechos Concha</option>
              <option value="fechadura_bico_papagaio">Fechaduras Bico Papagaio</option>
              <option value="puxador_cava">Puxadores Cava Embutidos</option>
              <option value="roldana_regulavel">Roldanas com Regulagem</option>
            </select>
          </div>

          <div>
            <select
              value={seriesFilter}
              onChange={(e) => setSeriesFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium"
            >
              <option value="ALL">Todas as Linhas</option>
              <option value="Linha Suprema">Linha Suprema</option>
              <option value="Linha Gold">Linha Gold</option>
              <option value="Chroma Minimalista">Chroma Minimalista</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid: Lista de Acessórios (Esquerda) e Desenho Técnico CAD 2D (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Lista de Acessórios (4 colunas) */}
        <div className="lg:col-span-4 space-y-2.5">
          {filteredTemplates.map((tpl) => {
            const isSelected = tpl.id === activeTemplate.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/80 shadow-md shadow-amber-950/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {tpl.manufacturer}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">
                    {tpl.faceSlotDimensions.lengthMm} × {tpl.faceSlotDimensions.widthMm}mm
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white leading-snug">
                  {tpl.name}
                </h4>

                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400">
                  <span>Perfis:</span>
                  {tpl.compatibleProfiles.map((p) => (
                    <span key={p} className="px-1.5 py-0.2 rounded bg-slate-950 text-slate-300 font-mono">
                      {p}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Desenho Técnico Blueprint CAD 2D & Parâmetros (8 colunas) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            {/* Header do Acessório Ativo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  {activeTemplate.manufacturer} • {activeTemplate.compatibleSeries.join(' / ')}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {activeTemplate.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  Cota Piso: <strong className="text-amber-400">{activeTemplate.standardHeightFromFloorMm}mm</strong>
                </span>
              </div>
            </div>

            {/* Visualizador CAD Técnico 2D do Rasgo e Furação */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center relative min-h-[260px] overflow-hidden">
              {/* Eixo Central Marcador */}
              <div className="absolute inset-y-4 left-1/2 w-px border-l border-dashed border-slate-700 pointer-events-none" />

              {/* Perfil Alumínio Representado em Corte Frontal */}
              <div className="w-44 bg-slate-900 border-2 border-slate-700 rounded-lg p-4 relative flex flex-col items-center justify-center shadow-2xl">
                {/* Rasgo Usinado na Face */}
                <div
                  style={{
                    height: `${Math.min(180, activeTemplate.faceSlotDimensions.lengthMm * 0.9)}px`,
                    width: `${Math.max(28, activeTemplate.faceSlotDimensions.widthMm * 1.4)}px`,
                    borderRadius:
                      activeTemplate.faceSlotDimensions.cornerType === 'rounded'
                        ? `${activeTemplate.faceSlotDimensions.cornerRadiusMm || 10}px`
                        : '2px',
                  }}
                  className="bg-rose-950/60 border-2 border-rose-500 flex flex-col items-center justify-center relative shadow-inner"
                >
                  <span className="text-[9px] font-mono font-bold text-rose-300">
                    {activeTemplate.faceSlotDimensions.lengthMm}×{activeTemplate.faceSlotDimensions.widthMm}
                  </span>

                  {/* Furação do Cilindro (se houver) */}
                  {activeTemplate.cylinderHole && (
                    <div className="w-5 h-5 rounded-full border-2 border-cyan-400 bg-cyan-950/80 my-1 flex items-center justify-center">
                      <span className="text-[7px] text-cyan-300 font-mono">Ø17</span>
                    </div>
                  )}
                </div>

                {/* Furos de Fixação dos Parafusos */}
                {activeTemplate.fixingHoles.map((hole, hIdx) => (
                  <div
                    key={hIdx}
                    style={{
                      marginTop: hIdx === 0 ? '-6px' : '6px',
                    }}
                    className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 bg-amber-950/80 flex items-center justify-center shadow-sm"
                    title={hole.description}
                  >
                    <span className="text-[7px] font-mono text-amber-300 font-bold">
                      Ø{hole.drillBitMm}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cotas Laterais Milimétricas */}
              <div className="mt-3 flex items-center gap-4 text-[11px] font-mono text-slate-400">
                <span>Comprimento: <strong className="text-white">{activeTemplate.faceSlotDimensions.lengthMm} mm</strong></span>
                <span>•</span>
                <span>Largura: <strong className="text-white">{activeTemplate.faceSlotDimensions.widthMm} mm</strong></span>
                <span>•</span>
                <span>Tipo: <strong className="text-white">{activeTemplate.faceSlotDimensions.cornerType === 'rounded' ? 'Cantos Arredondados' : 'Cantos Vivos'}</strong></span>
              </div>
            </div>

            {/* Parâmetros de Máquina & Ferramentas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">
                  Estampo / Prensa
                </span>
                <span className="text-amber-400 font-bold block text-[11px] leading-tight">
                  {activeTemplate.recommendedTooling.pressMachineStation || 'Fresadora Copiadora'}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">
                  Fresa Indicada
                </span>
                <span className="text-emerald-400 font-bold block text-[11px]">
                  Broca/Fresa Ø {activeTemplate.recommendedTooling.routerMillingBitMm} mm
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {activeTemplate.recommendedTooling.rotationalSpeedRpm}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">
                  Lubrificação de Corte
                </span>
                <span className="text-cyan-400 font-bold block text-[11px] leading-tight">
                  {activeTemplate.recommendedTooling.lubricant}
                </span>
              </div>
            </div>

            {/* Passo a Passo da Usinagem */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instruções de Furação &amp; Montagem na Fábrica:</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                {activeTemplate.stepByStepInstructions.map((step, sIdx) => (
                  <li key={sIdx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Nota Técnica */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 flex items-start gap-2.5 text-xs text-slate-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Recomendação da Serralheria:</strong>{' '}
                {activeTemplate.technicalNotes}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
