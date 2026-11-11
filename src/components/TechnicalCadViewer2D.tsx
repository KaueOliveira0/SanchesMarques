import React, { useState } from 'react';
import { TypologyItem, ColorFinish } from '../types';
import { PROFILES_CATALOG, GLASS_CATALOG, COLOR_SWATCHES } from '../data/catalog';
import { Eye, Layers, Compass, Sliders, Ruler, Info } from 'lucide-react';

interface TechnicalCadViewer2DProps {
  width: number; // mm
  height: number; // mm
  typology?: TypologyItem;
  color?: ColorFinish;
  glassId?: string;
  showDetailsToggle?: boolean;
}

export const TechnicalCadViewer2D: React.FC<TechnicalCadViewer2DProps> = ({
  width,
  height,
  typology,
  color = 'Branco',
  glassId,
  showDetailsToggle = true,
}) => {
  const [viewMode, setViewMode] = useState<'cad' | 'visual'>('cad');
  const [showSubframe, setShowSubframe] = useState<boolean>(true);
  const [showCutTable, setShowCutTable] = useState<boolean>(false);

  // Cálculos dimensionais
  const w = Math.max(100, width);
  const h = Math.max(100, height);
  const areaM2 = (w * h) / 1000000;
  const perimeterM = ((w + h) * 2) / 1000;

  // Escala dinâmica para caber no SVG (viewport 360 x 280)
  const maxViewW = 300;
  const maxViewH = 210;
  const scale = Math.min(maxViewW / Math.max(w, 400), maxViewH / Math.max(h, 400));
  const dw = Math.round(w * scale);
  const dh = Math.round(h * scale);

  // Offset para acomodar linhas de cota
  const offsetX = 45;
  const offsetY = 35;
  const svgTotalW = dw + offsetX + 35;
  const svgTotalH = dh + offsetY + 35;

  const glass = GLASS_CATALOG.find((g) => g.id === glassId) || GLASS_CATALOG[0];
  const isGold = typology?.series === 'Gold';
  const profileWall = isGold ? 8 : 6; // espessura gráfica proporcional da parede do perfil
  const sashBorder = isGold ? 7 : 5;

  // Cor gráfica do perfil de alumínio
  const strokeColor = viewMode === 'cad' ? '#38bdf8' : '#e2e8f0';
  const frameFill = viewMode === 'cad' ? '#0f172a' : (COLOR_SWATCHES[color] || '#334155');
  const frameFillOpacity = viewMode === 'cad' ? 0.9 : 0.85;

  // Cor do vidro
  const isFume = glass?.name?.toLowerCase().includes('fumê');
  const glassColor =
    isFume
      ? '#334155'
      : glass?.category === 'Refletivo'
      ? '#0284c7'
      : viewMode === 'cad'
      ? '#0284c7'
      : '#38bdf8';
  const glassOpacity = viewMode === 'cad' ? 0.22 : 0.4;

  const category = typology?.category || 'Janela de Correr';

  // Componentes de cortes calculados para este item
  const cuts = typology?.formula.cuts.map((c) => {
    const prof = PROFILES_CATALOG.find((p) => p.id === c.profileId || p.code === c.profileCode);
    const length = c.formula(w, h);
    return {
      code: c.profileCode,
      desc: c.description,
      qty: c.quantity,
      length,
      angles: `${c.angleLeft}° / ${c.angleRight}°`,
      kgm: prof?.kgm || 0.5,
    };
  }) || [];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Barra Superior do Visualizador Técnico */}
      <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200">Esboço Técnico 2D</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300">
            {w} × {h} mm
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80">
            {typology?.series || 'Suprema'} ({isGold ? '32mm' : '25mm'})
          </span>
        </div>

        {showDetailsToggle && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'cad' ? 'visual' : 'cad')}
              className={`px-2 py-0.8 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                viewMode === 'cad'
                  ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {viewMode === 'cad' ? 'CAD Blueprint' : 'Modo Fotorrealista'}
            </button>

            <button
              type="button"
              onClick={() => setShowSubframe(!showSubframe)}
              title="Exibir ou ocultar contramarco de alvenaria"
              className={`px-2 py-0.8 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                showSubframe
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              Contramarco {showSubframe ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={() => setShowCutTable(!showCutTable)}
              title="Exibir tabela de cortes dos perfis deste vão"
              className={`px-2 py-0.8 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                showCutTable
                  ? 'bg-amber-950 border-amber-700 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {showCutTable ? 'Ocultar Perfis' : 'Perfis de Corte'}
            </button>
          </div>
        )}
      </div>

      {/* Área Gráfica com Grid Milimetrado Blueprint */}
      <div className="relative p-4 flex items-center justify-center bg-slate-950 min-h-[250px] overflow-hidden select-none">
        {/* Grid Técnico de Fundo */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #0891b2 1px, transparent 1px), linear-gradient(to bottom, #0891b2 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        <svg
          width={svgTotalW}
          height={svgTotalH}
          viewBox={`0 0 ${svgTotalW} ${svgTotalH}`}
          className="overflow-visible"
        >
          <defs>
            {/* Marcador de seta de cota */}
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#06b6d4" />
            </marker>
            <marker
              id="arrow-amber"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f59e0b" />
            </marker>
          </defs>

          {/* ================= CONTRAMARCO EXTERNO (Opcional) ================= */}
          {showSubframe && (
            <g opacity="0.65">
              <rect
                x={offsetX - 8}
                y={offsetY - 8}
                width={dw + 16}
                height={dh + 16}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                rx="3"
              />
              <text
                x={offsetX + dw / 2}
                y={offsetY - 12}
                fill="#10b981"
                fontSize="8"
                fontFamily="monospace"
                textAnchor="middle"
              >
                CONTRAMARCO ALVENARIA (VÃO LIVRE: {w + 20}×{h + 20} mm)
              </text>
            </g>
          )}

          {/* ================= MARCO PERIMETRAL EXTERNO ================= */}
          <rect
            x={offsetX}
            y={offsetY}
            width={dw}
            height={dh}
            fill={frameFill}
            fillOpacity={frameFillOpacity}
            stroke={strokeColor}
            strokeWidth="2.2"
            rx="2"
          />

          {/* Vão Interno do Marco */}
          <rect
            x={offsetX + profileWall}
            y={offsetY + profileWall}
            width={Math.max(10, dw - profileWall * 2)}
            height={Math.max(10, dh - profileWall * 2)}
            fill="#020617"
            stroke={strokeColor}
            strokeWidth="1.2"
            strokeDasharray="2 1"
          />

          {/* Drenos de água na soleira inferior */}
          <line
            x1={offsetX + dw * 0.25}
            y1={offsetY + dh - profileWall / 2}
            x2={offsetX + dw * 0.35}
            y2={offsetY + dh - profileWall / 2}
            stroke="#38bdf8"
            strokeWidth="2"
          />
          <line
            x1={offsetX + dw * 0.65}
            y1={offsetY + dh - profileWall / 2}
            x2={offsetX + dw * 0.75}
            y2={offsetY + dh - profileWall / 2}
            stroke="#38bdf8"
            strokeWidth="2"
          />

          {/* ================= FOLHAS E ENCHIMENTOS ESPECÍFICOS ================= */}
          {category === 'Janela de Correr' || category === 'Porta de Correr' ? (
            (() => {
              const isThreeLeaves = typology?.id === 'typ_porta3_gold';
              const isFourLeaves = typology?.id?.includes('cor4');
              const leafCount = isFourLeaves ? 4 : isThreeLeaves ? 3 : 2;
              const innerW = dw - profileWall * 2;
              const leafW = innerW / leafCount;
              const innerH = dh - profileWall * 2;

              return (
                <g>
                  {Array.from({ length: leafCount }).map((_, i) => {
                    const leafX = offsetX + profileWall + i * leafW;
                    const leafY = offsetY + profileWall;
                    const isFixed = isFourLeaves && (i === 0 || i === 3);

                    return (
                      <g key={i}>
                        {/* Vidro da Folha */}
                        <rect
                          x={leafX + sashBorder}
                          y={leafY + sashBorder}
                          width={Math.max(4, leafW - sashBorder * 2)}
                          height={Math.max(4, innerH - sashBorder * 2)}
                          fill={glassColor}
                          fillOpacity={isFixed ? glassOpacity * 0.7 : glassOpacity}
                          stroke="#38bdf8"
                          strokeWidth="0.8"
                        />

                        {/* Reflexo de Vidro Diagonal */}
                        <line
                          x1={leafX + sashBorder + 4}
                          y1={leafY + sashBorder + 8}
                          x2={leafX + leafW - sashBorder - 8}
                          y2={leafY + innerH - sashBorder - 4}
                          stroke="#ffffff"
                          strokeOpacity="0.2"
                          strokeWidth="1.2"
                        />

                        {/* Perfis da Folha (Montantes e Travessas) */}
                        <rect
                          x={leafX}
                          y={leafY}
                          width={leafW}
                          height={innerH}
                          fill="none"
                          stroke={isFixed ? '#94a3b8' : strokeColor}
                          strokeWidth="1.8"
                        />

                        {/* Indicador de Movimento (Setas de Correr ou Fixa) */}
                        {isFixed ? (
                          <text
                            x={leafX + leafW / 2}
                            y={leafY + innerH / 2 + 4}
                            fill="#94a3b8"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            [FIXO]
                          </text>
                        ) : (
                          <g>
                            <text
                              x={leafX + leafW / 2}
                              y={leafY + innerH / 2 + 4}
                              fill="#f8fafc"
                              fontSize="11"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {i % 2 === 0 ? '◄ ──' : '── ►'}
                            </text>
                            {/* Roldana inferior simulada */}
                            <circle
                              cx={leafX + leafW * 0.25}
                              cy={leafY + innerH - 3}
                              r="2"
                              fill="#f59e0b"
                            />
                            <circle
                              cx={leafX + leafW * 0.75}
                              cy={leafY + innerH - 3}
                              r="2"
                              fill="#f59e0b"
                            />
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })()
          ) : category === 'Maxim-Ar' ? (
            (() => {
              const innerW = dw - profileWall * 2;
              const innerH = dh - profileWall * 2;
              const leafX = offsetX + profileWall;
              const leafY = offsetY + profileWall;

              return (
                <g>
                  {/* Vidro Maxim-ar */}
                  <rect
                    x={leafX + sashBorder}
                    y={leafY + sashBorder}
                    width={Math.max(4, innerW - sashBorder * 2)}
                    height={Math.max(4, innerH - sashBorder * 2)}
                    fill={glassColor}
                    fillOpacity={glassOpacity}
                    stroke="#38bdf8"
                    strokeWidth="0.8"
                  />

                  {/* Perfil Folha Móvel */}
                  <rect
                    x={leafX}
                    y={leafY}
                    width={innerW}
                    height={innerH}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2"
                  />

                  {/* Linhas Tracejadas em V de Projeção Articulada (Maxim-ar) */}
                  <line
                    x1={leafX}
                    y1={leafY + innerH}
                    x2={leafX + innerW / 2}
                    y2={leafY}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  <line
                    x1={leafX + innerW}
                    y1={leafY + innerH}
                    x2={leafX + innerW / 2}
                    y2={leafY}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />

                  {/* Fecho Alavanca Inferior */}
                  <rect
                    x={leafX + innerW / 2 - 6}
                    y={leafY + innerH - 8}
                    width="12"
                    height="5"
                    fill="#f59e0b"
                    rx="1"
                  />
                  <text
                    x={leafX + innerW / 2}
                    y={leafY + innerH / 2 + 10}
                    fill="#f59e0b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    MAXIM-AR PROJETANTE
                  </text>
                </g>
              );
            })()
          ) : category === 'Basculante' ? (
            (() => {
              const innerW = dw - profileWall * 2;
              const innerH = dh - profileWall * 2;
              const leafX = offsetX + profileWall;
              const leafY = offsetY + profileWall;

              return (
                <g>
                  {/* Vidro */}
                  <rect
                    x={leafX + sashBorder}
                    y={leafY + sashBorder}
                    width={innerW - sashBorder * 2}
                    height={innerH - sashBorder * 2}
                    fill={glassColor}
                    fillOpacity={glassOpacity}
                  />
                  {/* Eixo horizontal da báscula */}
                  <line
                    x1={leafX}
                    y1={leafY + innerH / 2}
                    x2={leafX + innerW}
                    y2={leafY + innerH / 2}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  {/* Símbolo de rotação */}
                  <circle cx={leafX + innerW / 2} cy={leafY + innerH / 2} r="4" fill="#f59e0b" />
                  <text
                    x={leafX + innerW / 2}
                    y={leafY + innerH / 2 - 8}
                    fill="#f59e0b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    EIXO BASCULANTE
                  </text>
                </g>
              );
            })()
          ) : category === 'Porta de Giro' ? (
            (() => {
              const innerW = dw - profileWall * 2;
              const innerH = dh - profileWall * 2;
              const leafX = offsetX + profileWall;
              const leafY = offsetY + profileWall;

              return (
                <g>
                  {/* Folha */}
                  <rect
                    x={leafX}
                    y={leafY}
                    width={innerW}
                    height={innerH}
                    fill={frameFill}
                    fillOpacity="0.8"
                    stroke={strokeColor}
                    strokeWidth="2"
                  />

                  {/* Vidro central */}
                  <rect
                    x={leafX + 12}
                    y={leafY + 12}
                    width={Math.max(4, innerW - 24)}
                    height={Math.max(4, innerH - 24)}
                    fill={glassColor}
                    fillOpacity={glassOpacity}
                    stroke="#38bdf8"
                    strokeWidth="0.8"
                  />

                  {/* Dobradiças / Pivô no lado esquerdo */}
                  <rect x={leafX - 1} y={leafY + 15} width="3" height="8" fill="#f59e0b" />
                  <rect x={leafX - 1} y={leafY + innerH / 2 - 4} width="3" height="8" fill="#f59e0b" />
                  <rect x={leafX - 1} y={leafY + innerH - 23} width="3" height="8" fill="#f59e0b" />

                  {/* Puxador ou Fechadura */}
                  <rect
                    x={leafX + innerW - 8}
                    y={leafY + innerH / 2 - 16}
                    width="4"
                    height="32"
                    fill="#38bdf8"
                    rx="1"
                  />

                  {/* Arco de Abertura de 90° pontilhado */}
                  <path
                    d={`M ${leafX + innerW} ${leafY + innerH} A ${innerW} ${innerW} 0 0 1 ${leafX} ${leafY + innerH - innerW}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={leafX + innerW / 2}
                    y={leafY + innerH / 2}
                    fill="#f59e0b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    GIRO 90°
                  </text>
                </g>
              );
            })()
          ) : category === 'Integrada Persiana' ? (
            (() => {
              const boxH = Math.min(dh * 0.28, 45);
              const innerW = dw - profileWall * 2;
              const glassH = dh - profileWall * 2 - boxH;

              return (
                <g>
                  {/* Caixa Superior da Persiana */}
                  <rect
                    x={offsetX + profileWall}
                    y={offsetY + profileWall}
                    width={innerW}
                    height={boxH}
                    fill="#1e293b"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  <text
                    x={offsetX + dw / 2}
                    y={offsetY + profileWall + boxH / 2 + 3}
                    fill="#f59e0b"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    CAIXA PERSIANA INTEGRADA
                  </text>

                  {/* Linhas de palhetas da esteira */}
                  {Array.from({ length: 4 }).map((_, pi) => (
                    <line
                      key={pi}
                      x1={offsetX + profileWall + 5}
                      y1={offsetY + profileWall + 4 + pi * (boxH / 5)}
                      x2={offsetX + dw - profileWall - 5}
                      y2={offsetY + profileWall + 4 + pi * (boxH / 5)}
                      stroke="#475569"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Folhas de Vidro Inferiores */}
                  <rect
                    x={offsetX + profileWall}
                    y={offsetY + profileWall + boxH}
                    width={innerW}
                    height={glassH}
                    fill={glassColor}
                    fillOpacity={glassOpacity}
                    stroke={strokeColor}
                    strokeWidth="1.5"
                  />
                </g>
              );
            })()
          ) : (
            /* Quadro fixo padrão */
            <rect
              x={offsetX + profileWall}
              y={offsetY + profileWall}
              width={dw - profileWall * 2}
              height={dh - profileWall * 2}
              fill={glassColor}
              fillOpacity={glassOpacity}
              stroke="#38bdf8"
              strokeWidth="1"
            />
          )}

          {/* ================= COTAS TÉCNICAS (ABNT NBR 6492) ================= */}
          {/* Cota Superior de Largura Total (L = {w} mm) */}
          <g>
            <line
              x1={offsetX}
              y1={offsetY - 14}
              x2={offsetX + dw}
              y2={offsetY - 14}
              stroke="#06b6d4"
              strokeWidth="1.2"
              markerStart="url(#arrow-cyan)"
              markerEnd="url(#arrow-cyan)"
            />
            {/* Linhas de Chamada Verticais */}
            <line
              x1={offsetX}
              y1={offsetY - 18}
              x2={offsetX}
              y2={offsetY - 2}
              stroke="#06b6d4"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            <line
              x1={offsetX + dw}
              y1={offsetY - 18}
              x2={offsetX + dw}
              y2={offsetY - 2}
              stroke="#06b6d4"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            {/* Texto da Cota */}
            <rect
              x={offsetX + dw / 2 - 32}
              y={offsetY - 22}
              width="64"
              height="14"
              fill="#090d16"
              rx="2"
            />
            <text
              x={offsetX + dw / 2}
              y={offsetY - 12}
              fill="#06b6d4"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              L = {w} mm
            </text>
          </g>

          {/* Cota Lateral Esquerda de Altura Total (H = {h} mm) */}
          <g>
            <line
              x1={offsetX - 14}
              y1={offsetY}
              x2={offsetX - 14}
              y2={offsetY + dh}
              stroke="#06b6d4"
              strokeWidth="1.2"
              markerStart="url(#arrow-cyan)"
              markerEnd="url(#arrow-cyan)"
            />
            {/* Linhas de Chamada Horizontais */}
            <line
              x1={offsetX - 18}
              y1={offsetY}
              x2={offsetX - 2}
              y2={offsetY}
              stroke="#06b6d4"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            <line
              x1={offsetX - 18}
              y1={offsetY + dh}
              x2={offsetX - 2}
              y2={offsetY + dh}
              stroke="#06b6d4"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            {/* Texto da Cota Rotacionado */}
            <text
              x={-(offsetY + dh / 2)}
              y={offsetX - 18}
              fill="#06b6d4"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              transform="rotate(-90)"
            >
              H = {h} mm
            </text>
          </g>
        </svg>

        {/* Resumo Rápido no Canto Inferior Direito */}
        <div className="absolute bottom-2 right-2 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 font-mono space-y-0.5 pointer-events-none">
          <div>Área: <b className="text-cyan-300">{areaM2.toFixed(2)} m²</b></div>
          <div>Perímetro: <b className="text-slate-200">{perimeterM.toFixed(2)} m</b></div>
          <div>Vidro: <span className="text-slate-400">{glass?.name.slice(0, 18)}...</span></div>
        </div>
      </div>

      {/* Tabela Técnica de Perfis & Cortes (Quando Expandida) */}
      {showCutTable && cuts.length > 0 && (
        <div className="bg-slate-900 border-t border-slate-800 p-3 space-y-2 max-h-48 overflow-y-auto text-xs">
          <div className="flex items-center justify-between text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <span>Estrutura de Perfis da Esquadria ({typology?.series})</span>
            <span>{cuts.length} componentes</span>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-1">Código</th>
                <th className="py-1">Perfil / Função</th>
                <th className="py-1 text-center">Qtd</th>
                <th className="py-1 text-right">Corte (mm)</th>
                <th className="py-1 text-center">Graus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {cuts.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-1 text-cyan-400 font-bold">{c.code}</td>
                  <td className="py-1 text-slate-300">{c.desc}</td>
                  <td className="py-1 text-center text-slate-200">{c.qty}x</td>
                  <td className="py-1 text-right text-emerald-400 font-bold">{c.length} mm</td>
                  <td className="py-1 text-center text-amber-400">{c.angles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
