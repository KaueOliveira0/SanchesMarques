import React, { useState, useMemo } from 'react';
import { TYPOLOGIES_CATALOG, PROFILES_CATALOG, ACCESSORIES_CATALOG } from '../data/catalog';
import { TypologyItem } from '../types';
import { downloadDxfFile } from '../utils/dxfExporter';
import { LineBenchmarkingModal } from './LineBenchmarkingModal';
import { StructuralInertiaModal } from './StructuralInertiaModal';
import { GlazingBeadSelectorModal } from './GlazingBeadSelectorModal';
import { GlassNesting2dModal } from './GlassNesting2dModal';
import { ThermalSimulationModal } from './ThermalSimulationModal';
import { GuardrailCalculatorModal } from './GuardrailCalculatorModal';
import {
  Layers,
  Search,
  Scissors,
  Wrench,
  Maximize2,
  Eye,
  Sliders,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Download,
  SlidersHorizontal,
  ShieldCheck,
  FileCode,
  Thermometer,
  ShieldAlert,
  Grid,
  Camera,
  Image as ImageIcon,
  Wind,
  Droplets,
  Volume2,
  CheckCircle2,
  Building2,
  Info,
} from 'lucide-react';

export const TypologiesManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string>('Todas');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [listDisplayMode, setListDisplayMode] = useState<'photos' | 'schematics'>('photos');
  const [detailViewMode, setDetailViewMode] = useState<'photo' | 'cad' | 'specs'>('photo');

  const [isBenchmarkingOpen, setIsBenchmarkingOpen] = useState(false);
  const [isInertiaOpen, setIsInertiaOpen] = useState(false);
  const [isGlazingBeadOpen, setIsGlazingBeadOpen] = useState(false);
  const [isNesting2dOpen, setIsNesting2dOpen] = useState(false);
  const [isThermalOpen, setIsThermalOpen] = useState(false);
  const [isGuardrailOpen, setIsGuardrailOpen] = useState(false);

  // Combina tipologias de catálogo com importadas em massa
  const allTypologies = useMemo(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('sm_custom_typologies_v1') : null;
      if (raw) {
        const customList: TypologyItem[] = JSON.parse(raw);
        const map = new Map<string, TypologyItem>();
        TYPOLOGIES_CATALOG.forEach((t) => map.set(t.code, t));
        customList.forEach((t) => {
          if (!map.has(t.code)) {
            map.set(t.code, t);
          }
        });
        return Array.from(map.values());
      }
    } catch {
      // ignore
    }
    return TYPOLOGIES_CATALOG;
  }, []);

  const [selectedTypologyId, setSelectedTypologyId] = useState<string>(
    allTypologies[0]?.id || TYPOLOGIES_CATALOG[0]?.id || ''
  );

  // Medidas de teste dinâmico
  const [testWidth, setTestWidth] = useState<number | string>(1500);
  const [testHeight, setTestHeight] = useState<number | string>(1200);

  const numTestWidth = typeof testWidth === 'number' ? testWidth : Number(testWidth) || 100;
  const numTestHeight = typeof testHeight === 'number' ? testHeight : Number(testHeight) || 100;

  const selectedTypology =
    allTypologies.find((t) => t.id === selectedTypologyId) || allTypologies[0] || TYPOLOGIES_CATALOG[0];

  const seriesList = [
    'Todas',
    'Suprema',
    'Gold',
    'Chroma',
    'Linha 25',
    'Linha 30',
    'Integrada',
    'Fachada',
    'Hydro Line',
  ];

  const categoryFilters = [
    { id: 'TODAS', label: 'Todas as Esquadrias' },
    { id: 'JANELAS', label: 'Janelas' },
    { id: 'PORTAS', label: 'Portas' },
    { id: 'INTEGRADAS', label: 'Persianas Integradas' },
    { id: 'FACHADAS', label: 'Fachadas & Guarda-Corpos' },
  ];

  const filteredTypologies = useMemo(() => {
    return allTypologies.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeries = selectedSeries === 'Todas' || t.series === selectedSeries;

      let matchesCategory = true;
      if (selectedCategory === 'JANELAS') {
        matchesCategory = t.category.includes('Janela') || t.category.includes('Maxim') || t.category.includes('Basculante');
      } else if (selectedCategory === 'PORTAS') {
        matchesCategory = t.category.includes('Porta');
      } else if (selectedCategory === 'INTEGRADAS') {
        matchesCategory = t.category.includes('Integrada');
      } else if (selectedCategory === 'FACHADAS') {
        matchesCategory = t.category.includes('Fachada') || t.category.includes('Guarda') || t.category.includes('Portão');
      }

      return matchesSearch && matchesSeries && matchesCategory;
    });
  }, [allTypologies, searchTerm, selectedSeries, selectedCategory]);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-3">
      {/* Cabeçalho */}
      <div className="shrink-0 flex flex-col gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Catálogo de Tipologias & Engenharia de Esquadrias
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                  {allTypologies.length} TIPOLOGIAS INDUSTRIAIS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Modelos completos com fotos reais, desenhos vetoriais CAD, fórmulas paramétricas de corte e kits de montagem.
              </p>
            </div>
          </div>

          {/* Busca e Filtro de Linha */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              {seriesList.map((s) => (
                <option key={s} value={s}>
                  {s === 'Todas' ? 'Todas as Linhas' : `Linha ${s}`}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar código, nome ou linha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 w-44 sm:w-60"
              />
            </div>
          </div>
        </div>

        {/* Barra de Filtros Rápidos de Categoria */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            {categoryFilters.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Modo de Visualização da Lista Lateral */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setListDisplayMode('photos')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
                listDisplayMode === 'photos'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Fotos Reais</span>
            </button>
            <button
              type="button"
              onClick={() => setListDisplayMode('schematics')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
                listDisplayMode === 'schematics'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Desenho 2D</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Lista de Tipologias à Esquerda + Detalhes de Engenharia à Direita */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        {/* Lista de Modelos */}
        <div className="h-full overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          <div className="text-[11px] text-slate-400 font-semibold px-1 flex items-center justify-between">
            <span>{filteredTypologies.length} modelos encontrados</span>
            <span className="text-slate-500 font-mono">Clique para inspecionar</span>
          </div>

          {filteredTypologies.map((t) => {
            const isSelected = t.id === selectedTypology?.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTypologyId(t.id)}
                className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-amber-500/60 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/30'
                    : 'bg-slate-900/70 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                {/* Visualização: Foto Real ou Vetor Técnico */}
                {listDisplayMode === 'photos' && t.imageUrl ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-700/80 bg-slate-950 shadow-md relative group">
                    <img
                      src={t.imageUrl}
                      alt={t.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 bg-slate-950 rounded-xl p-2 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner"
                    dangerouslySetInnerHTML={{
                      __html: t.previewSvg && t.previewSvg.includes('<svg') ? t.previewSvg : '<svg viewBox="0 0 100 80" class="w-full h-full stroke-amber-400 fill-none"><rect x="10" y="10" width="80" height="60" stroke="#f59e0b" stroke-width="2"/></svg>',
                    }}
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-amber-400 font-mono tracking-tight">{t.code}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {t.series}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 truncate mt-1 leading-snug">{t.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span className="truncate">{t.category}</span>
                    {t.technicalSpecs?.leafCount && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="text-cyan-400 font-mono">{t.technicalSpecs.leafCount}F</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredTypologies.length === 0 && (
            <div className="text-center py-10 px-4 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-600" />
              <p>Nenhuma tipologia encontrada para o filtro selecionado.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSeries('Todas');
                  setSelectedCategory('TODAS');
                }}
                className="text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>

        {/* Detalhes de Engenharia do Modelo Selecionado */}
        {selectedTypology && (
          <div className="lg:col-span-2 h-full overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {/* Cartão de Apresentação & Foto Showcase */}
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedTypology.code}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {selectedTypology.name}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedTypology.description}</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs shrink-0">
                  <span className="text-slate-400 font-medium">Linha / Sistema:</span>
                  <span className="font-bold text-amber-400">{selectedTypology.series}</span>
                </div>
              </div>

              {/* Showcase Visual com Seletor: Foto Real / Elevação Vetorial / Ficha Técnica */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Visualização Arquitetônica & Construtiva</span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setDetailViewMode('photo')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
                        detailViewMode === 'photo'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Foto Real</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailViewMode('cad')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
                        detailViewMode === 'cad'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Desenho Vetorial CAD</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailViewMode('specs')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
                        detailViewMode === 'specs'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Ficha Técnica NBR</span>
                    </button>
                  </div>
                </div>

                {/* Exibição em Modo Foto Real */}
                {detailViewMode === 'photo' && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl h-64 sm:h-72 w-full group">
                    <img
                      src={selectedTypology.imageUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80'}
                      alt={selectedTypology.name}
                      className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    {/* Badges Flutuantes sobre a Foto */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-amber-300 font-bold font-mono text-[11px] border border-amber-500/40 shadow-lg">
                        {selectedTypology.code}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white font-semibold text-[11px] border border-slate-700 shadow-lg">
                        {selectedTypology.series}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 backdrop-blur-md text-cyan-300 font-semibold text-[11px] border border-cyan-500/40 shadow-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Foto Arquitetônica Real</span>
                      </span>
                    </div>

                    {/* Legenda na Base da Foto */}
                    <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white text-sm">{selectedTypology.name}</div>
                        <div className="text-slate-400 text-[11px]">
                          {selectedTypology.technicalSpecs?.recommendedGlass || 'Vidro Temperado ou Laminado'} · {selectedTypology.category}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-300">
                        {selectedTypology.technicalSpecs?.acousticReduction && (
                          <div className="flex items-center gap-1 font-mono text-cyan-300">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{selectedTypology.technicalSpecs.acousticReduction}</span>
                          </div>
                        )}
                        {selectedTypology.technicalSpecs?.waterTightness && (
                          <div className="flex items-center gap-1 font-mono text-emerald-300">
                            <Droplets className="w-3.5 h-3.5" />
                            <span>{selectedTypology.technicalSpecs.waterTightness.split(' ')[0]} Pa</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Exibição em Modo Desenho Vetorial CAD */}
                {detailViewMode === 'cad' && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[280px] shadow-2xl relative">
                    <div className="w-full max-w-md h-52 flex items-center justify-center">
                      <div
                        className="w-full h-full flex items-center justify-center p-2"
                        dangerouslySetInnerHTML={{
                          __html: selectedTypology.previewSvg && selectedTypology.previewSvg.includes('<svg')
                            ? selectedTypology.previewSvg
                            : '<svg viewBox="0 0 100 80" class="w-full h-full stroke-amber-400 fill-none"><rect x="10" y="10" width="80" height="60" stroke="#f59e0b" stroke-width="2"/></svg>',
                        }}
                      />
                    </div>
                    {/* Cotas Dinâmicas ao Vivo */}
                    <div className="flex items-center justify-between w-full max-w-md mt-3 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
                      <span>Largura Vão: <b className="text-amber-400">{numTestWidth} mm</b></span>
                      <span>Altura Vão: <b className="text-amber-400">{numTestHeight} mm</b></span>
                      <span>Área: <b className="text-cyan-400">{((numTestWidth * numTestHeight) / 1000000).toFixed(2)} m²</b></span>
                    </div>
                  </div>
                )}

                {/* Exibição em Modo Ficha Técnica NBR */}
                {detailViewMode === 'specs' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                        <Droplets className="w-4 h-4" />
                        <span>Estanqueidade à Água (NBR 10821)</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {selectedTypology.technicalSpecs?.waterTightness || '450 Pa (Estanqueidade avançada)'}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Câmara de descompressão com drenos de alívio e escovas com barreira central de silicone.
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                        <Wind className="w-4 h-4" />
                        <span>Pressão de Vento (NBR 10821)</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {selectedTypology.technicalSpecs?.windLoadClass || 'Classe C3 / 1400 Pa'}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Montantes calculados para flecha máxima L/175 conforme zona de vento da ABNT.
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                        <Volume2 className="w-4 h-4" />
                        <span>Desempenho Acústico (Rw)</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {selectedTypology.technicalSpecs?.acousticReduction || '30 dB Rw'}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Atenuação de ruídos urbanos e tráfego com vedação perimetral contínua em EPDM.
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Vidro Indicado</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {selectedTypology.technicalSpecs?.recommendedGlass || 'Vidro Temperado 6mm / Laminado 8mm'}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Calços de apoio inferiores em EPDM 80 Shore A conforme norma ABNT NBR 7199.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de Ferramentas Avançadas de Engenharia */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    downloadDxfFile({
                      typologyCode: selectedTypology.code,
                      typologyName: selectedTypology.name,
                      series: selectedTypology.series,
                      widthMm: numTestWidth,
                      heightMm: numTestHeight,
                      leafCount: selectedTypology.name.includes('4')
                        ? 4
                        : selectedTypology.name.includes('3')
                        ? 3
                        : 2,
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-bold text-xs border border-cyan-700 transition-all cursor-pointer"
                  title="Baixar desenho técnico vetorial 2D em padrão AutoCAD DXF"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Baixar CAD DXF 2D</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBenchmarkingOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold text-xs border border-amber-700 transition-all cursor-pointer"
                  title="Comparar custo, peso de alumínio e atenuação acústica entre 5 linhas"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Comparar Linhas (Benchmarking)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInertiaOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-700 transition-all cursor-pointer"
                  title="Calcular inércia necessária contra vento da região (NBR 10821)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inércia do Montante (NBR 10821)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsGlazingBeadOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 font-bold text-xs border border-purple-700 transition-all cursor-pointer"
                  title="Selecionar baguete compatível para vidros de 4mm até 22mm insulados"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Seletor de Baguetes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNesting2dOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-bold text-xs border border-cyan-700 transition-all cursor-pointer"
                  title="Otimizar corte de chapas brutas de vidro 2D (3210x2250mm)"
                >
                  <Grid className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nesting 2D Chapas Vidro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsThermalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-950/80 hover:bg-orange-900 text-orange-300 font-bold text-xs border border-orange-700 transition-all cursor-pointer"
                  title="Calcular transmitância térmica Uw e eficiência energética NBR 15575"
                >
                  <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                  <span>Eficiência Térmica (NBR 15575)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsGuardrailOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-700 transition-all cursor-pointer"
                  title="Dimensionar guarda-corpos e sacadas com ensaio de impacto NBR 14718"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Guarda-Corpos (NBR 14718)</span>
                </button>
              </div>

              {/* Simulador de Medidas para Teste de Corte */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Simular Medidas do Vão
                  </span>
                  <span className="text-[10px] text-slate-500">Altere para recalcular as fórmulas em tempo real</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400">Largura Vão (L)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={testWidth}
                        onChange={(e) => setTestWidth(e.target.value)}
                        onBlur={() => {
                          const n = Number(testWidth);
                          if (!n || n < 100) setTestWidth(100);
                          else setTestWidth(Math.round(n));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-slate-500 font-mono">mm</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Altura Vão (H)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={testHeight}
                        onChange={(e) => setTestHeight(e.target.value)}
                        onBlur={() => {
                          const n = Number(testHeight);
                          if (!n || n < 100) setTestHeight(100);
                          else setTestHeight(Math.round(n));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-slate-500 font-mono">mm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Cortes de Perfis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    Lista de Corte de Perfis de Alumínio
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {selectedTypology.formula.cuts.length} componentes de corte
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-[10px] text-slate-400 font-mono uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Código</th>
                        <th className="py-2 px-3">Descrição da Peça</th>
                        <th className="py-2 px-3 text-center">Qtd</th>
                        <th className="py-2 px-3 text-center">Ângulos</th>
                        <th className="py-2 px-3 text-right">Comprimento Calculado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {selectedTypology.formula.cuts.map((cut, idx) => {
                        const calculatedLen = Math.round(cut.formula(numTestWidth, numTestHeight));
                        return (
                          <tr key={idx} className="hover:bg-slate-850/50">
                            <td className="py-2 px-3 font-mono font-bold text-amber-400">{cut.profileCode}</td>
                            <td className="py-2 px-3 text-slate-200">{cut.description}</td>
                            <td className="py-2 px-3 text-center font-mono font-bold">{cut.quantity}x</td>
                            <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-400">
                              {cut.angleLeft}° / {cut.angleRight}°
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                              {calculatedLen} mm
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Especificação dos Vidros */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    Medidas dos Vidros (Com Folgas de Dilatação)
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {selectedTypology.formula.glass.length} plano(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTypology.formula.glass.map((g, idx) => {
                    const gw = Math.round(g.formulaW(numTestWidth, numTestHeight));
                    const gh = Math.round(g.formulaH(numTestWidth, numTestHeight));
                    const m2 = ((gw * gh) / 1000000).toFixed(2);

                    return (
                      <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="font-semibold text-slate-200 text-xs block truncate">
                          {g.description}
                        </span>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Qtd: {g.quantity} un</span>
                          <span className="text-cyan-400 font-bold">
                            {gw} × {gh} mm
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">Área: {m2} m² / peça</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kit de Acessórios & Componentes */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  Acessórios & Ferragens do Modelo
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedTypology.formula.accessories.map((acc, idx) => {
                    const accDef = ACCESSORIES_CATALOG.find((a) => a.id === acc.accessoryId);
                    const qty = acc.formulaQuantity(numTestWidth, numTestHeight, 1);

                    return (
                      <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <span className="font-medium text-slate-200 truncate block">
                          {accDef?.name || acc.accessoryId}
                        </span>
                        <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                          <span className="text-slate-500">{accDef?.code}</span>
                          <span className="text-amber-400 font-bold">
                            {qty} {accDef?.unit || 'un'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modais de Engenharia Avançada */}
      <LineBenchmarkingModal
        isOpen={isBenchmarkingOpen}
        onClose={() => setIsBenchmarkingOpen(false)}
        initialWidth={numTestWidth}
        initialHeight={numTestHeight}
      />

      <StructuralInertiaModal
        isOpen={isInertiaOpen}
        onClose={() => setIsInertiaOpen(false)}
        initialWidth={numTestWidth}
        initialHeight={numTestHeight}
        initialSeries={selectedTypology.series}
      />

      <GlazingBeadSelectorModal
        isOpen={isGlazingBeadOpen}
        onClose={() => setIsGlazingBeadOpen(false)}
        initialSeries={selectedTypology.series}
      />

      <GlassNesting2dModal
        isOpen={isNesting2dOpen}
        onClose={() => setIsNesting2dOpen(false)}
      />

      <ThermalSimulationModal
        isOpen={isThermalOpen}
        onClose={() => setIsThermalOpen(false)}
        initialWidth={numTestWidth}
        initialHeight={numTestHeight}
      />

      <GuardrailCalculatorModal
        isOpen={isGuardrailOpen}
        onClose={() => setIsGuardrailOpen(false)}
      />
    </div>
  );
};
