import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CncMachineProtocol } from '../types';
import {
  extractPiecesFromOrders,
  optimizeCutList,
} from '../utils/cutOptimizer';
import {
  generateUniversalGCode,
  generateEmmegiFormat,
  generateFomIndustrieFormat,
  generateElumatecFormat,
  generateUniversalCsvFormat,
  downloadCncFile,
  sendViaWebSerial,
} from '../utils/cncExport';
import {
  Cpu,
  Download,
  Play,
  RotateCcw,
  Zap,
  Terminal,
  FileCode,
  Copy,
  Check,
  Radio,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Wrench,
} from 'lucide-react';
import { PunchToolingModal } from './PunchToolingModal';

export const CncMachineStudio: React.FC = () => {
  const { orders, stockProfiles, selectedOrderId } = useApp();

  const [selectedProtocol, setSelectedProtocol] = useState<CncMachineProtocol>('UNIVERSAL_GCODE');
  const [activeOrderIds, setActiveOrderIds] = useState<string[]>(() => {
    if (selectedOrderId && selectedOrderId !== 'new') return [selectedOrderId];
    const approved = orders.filter((o) => o.status === 'Aprovado' || o.status === 'Em Produção');
    return approved.length > 0 ? [approved[0].id] : orders.slice(0, 1).map((o) => o.id);
  });

  // Estado do simulador e da porta serial
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [isSerialSending, setIsSerialSending] = useState(false);
  const [serialProgress, setSerialProgress] = useState(0);
  const [serialLog, setSerialLog] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);

  // Otimização das barras
  const selectedOrders = useMemo(() => {
    return orders.filter((o) => activeOrderIds.includes(o.id));
  }, [orders, activeOrderIds]);

  const rawPieces = useMemo(() => {
    return extractPiecesFromOrders(selectedOrders);
  }, [selectedOrders]);

  const optimization = useMemo(() => {
    return optimizeCutList(rawPieces, stockProfiles);
  }, [rawPieces, stockProfiles]);

  const targetOrderNumber = selectedOrders.length > 0 ? selectedOrders[0].number : 101;

  // Gerar o conteúdo de acordo com o protocolo selecionado
  const generatedFile = useMemo(() => {
    switch (selectedProtocol) {
      case 'UNIVERSAL_GCODE':
        return {
          filename: `OP_${targetOrderNumber}_CUT_GCODE.nc`,
          mimeType: 'text/plain',
          content: generateUniversalGCode(optimization.bars, targetOrderNumber),
          protocol: 'UNIVERSAL_GCODE' as CncMachineProtocol,
          description: 'Código ISO 6983 / G-Code para serras de 1 ou 2 cabeçotes (M-codes de garras e disco)',
        };
      case 'EMMEGI':
        return {
          filename: `EMMEGI_OP_${targetOrderNumber}.dat`,
          mimeType: 'text/plain',
          content: generateEmmegiFormat(optimization.bars, targetOrderNumber),
          protocol: 'EMMEGI' as CncMachineProtocol,
          description: 'Lista de corte nativa para serras de duplo cabeçote Emmegi (formatos .DAT / .CSV)',
        };
      case 'FOM_INDUSTRIE':
        return {
          filename: `FOM_OP_${targetOrderNumber}.cut`,
          mimeType: 'application/xml',
          content: generateFomIndustrieFormat(optimization.bars, targetOrderNumber),
          protocol: 'FOM_INDUSTRIE' as CncMachineProtocol,
          description: 'DataCut XML para serras FOM Industrie (Moxie, Blitz, Deka)',
        };
      case 'ELUMATEC':
        return {
          filename: `ELUMATEC_OP_${targetOrderNumber}.pos`,
          mimeType: 'text/plain',
          content: generateElumatecFormat(optimization.bars, targetOrderNumber),
          protocol: 'ELUMATEC' as CncMachineProtocol,
          description: 'Tabela de posicionamento DG para serras Elumatec (DG 244 / DG 142)',
        };
      case 'CSV_TABULAR':
      default:
        return {
          filename: `LISTA_CORTE_OP_${targetOrderNumber}.csv`,
          mimeType: 'text/csv',
          content: generateUniversalCsvFormat(optimization.bars, targetOrderNumber),
          protocol: 'CSV_TABULAR' as CncMachineProtocol,
          description: 'Planilha universal delimitada por ponto-e-vírgula para Pen-Drive ou CLP',
        };
    }
  }, [selectedProtocol, optimization.bars, targetOrderNumber]);

  // Transmitir via Web Serial API
  const handleTransmitSerial = async () => {
    setSerialLog((prev) => [...prev, `[SISTEMA] Iniciando handshake com porta serial USB/COM...`]);
    setIsSerialSending(true);
    setSerialProgress(0);

    const result = await sendViaWebSerial(generatedFile.content, (pct, line) => {
      setSerialProgress(pct);
      if (pct % 15 === 0 || pct === 100) {
        setSerialLog((prev) => [...prev.slice(-15), `TX > ${line}`]);
      }
    });

    setIsSerialSending(false);
    if (result.success) {
      setSerialLog((prev) => [...prev, `[SUCESSO] ${result.message}`]);
    } else {
      setSerialLog((prev) => [...prev, `[AVISO] ${result.message}`]);
    }
  };

  // Simulação animada do ciclo de corte
  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(1); // Posicionamento do batente

    setTimeout(() => setSimStep(2), 1200); // Orientação dos cabeçotes angulares (45°)
    setTimeout(() => setSimStep(3), 2400); // Garras pneumáticas descendo (M10)
    setTimeout(() => setSimStep(4), 3600); // Disco de serra avançando e cortando
    setTimeout(() => {
      setSimStep(5); // Peça cortada e recuo
      setIsSimulating(false);
    }, 5000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-3">
      {/* Cabeçalho */}
      <div className="shrink-0 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Estúdio de Integração com Máquinas de Corte CNC</span>
          </h1>
          <p className="text-xs text-slate-400">
            Exportação direta de arquivos e comunicação serial com serras de duplo cabeçote e centros de usinagem
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPunchModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 text-xs font-bold border border-purple-700 transition-all cursor-pointer"
            title="Ver gabarito de estampos pneumáticos e matrizes de usinagem"
          >
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
            <span>Gabarito de Estampos & Matrizes</span>
          </button>

          <button
            onClick={() => downloadCncFile(generatedFile)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Arquivo ({generatedFile.filename})</span>
          </button>

          <button
            onClick={handleTransmitSerial}
            disabled={isSerialSending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-40"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>{isSerialSending ? `Transmitindo ${serialProgress}%...` : 'Transmitir via USB/Serial'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {/* Protocolos das Máquinas CNC */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Selecione o Modelo da Serra / Centro de Corte:
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {[
            {
              id: 'UNIVERSAL_GCODE',
              title: 'Universal ISO / G-Code',
              desc: 'Comandos padrão G00, G01, M10 (Garras) e M03',
              badge: '.NC / .GCODE',
            },
            {
              id: 'EMMEGI',
              title: 'Emmegi Double Miter',
              desc: 'Classic, Quadra, Comet e Phantomatic',
              badge: '.DAT / .CSV',
            },
            {
              id: 'FOM_INDUSTRIE',
              title: 'FOM Industrie',
              desc: 'Moxie, Blitz, Deka e Argo (DataCut XML)',
              badge: '.CUT / .XML',
            },
            {
              id: 'ELUMATEC',
              title: 'Elumatec DG Series',
              desc: 'DG 244, DG 142 e SBZ (Formato POS)',
              badge: '.POS',
            },
            {
              id: 'CSV_TABULAR',
              title: 'Planilha Tabular Pen-Drive',
              desc: 'Formato CSV universal com delimitador ;',
              badge: '.CSV',
            },
          ].map((item) => {
            const isSelected = selectedProtocol === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedProtocol(item.id as CncMachineProtocol)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200 shadow-md shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{item.title}</span>
                    <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-800 text-emerald-400">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulador Interativo 2D do Ciclo de Corte */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Simulador em Tempo Real do Batente & Cabeçotes Angulares</span>
            </h2>
            <p className="text-xs text-slate-400">
              Valide o ciclo de fixação pneumática e ângulos da serra antes de enviar para o chão de fábrica
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulating ? 'Executando Ciclo CNC...' : 'Testar Ciclo de Corte'}</span>
          </button>
        </div>

        {/* Leito da Máquina CNC em 2D */}
        <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
          {/* Trilho de Guias Lineares */}
          <div className="w-full h-3 bg-slate-800 rounded relative mb-8 flex items-center">
            <div className="absolute left-0 right-0 h-1 bg-slate-700"></div>
          </div>

          {/* Barra de Alumínio no Leito */}
          <div className="w-11/12 h-10 bg-slate-700/80 border-2 border-slate-500 rounded relative flex items-center justify-between px-4 shadow-lg">
            <span className="text-[11px] font-mono text-slate-300 font-bold">
              BARRA: {optimization.bars[0]?.profileCode || 'SU-001'} (6000 mm)
            </span>

            {/* Garras Pneumáticas (M10/M11) */}
            <div
              className={`absolute top-0 -mt-6 left-12 px-2 py-0.5 rounded text-[9px] font-bold font-mono transition-all duration-300 ${
                simStep >= 3 ? 'bg-emerald-500 text-black -translate-y-1' : 'bg-slate-800 text-slate-400'
              }`}
            >
              GARRA 1 {simStep >= 3 ? 'TRAVADA' : 'ABERTA'}
            </div>

            <div
              className={`absolute top-0 -mt-6 right-12 px-2 py-0.5 rounded text-[9px] font-bold font-mono transition-all duration-300 ${
                simStep >= 3 ? 'bg-emerald-500 text-black -translate-y-1' : 'bg-slate-800 text-slate-400'
              }`}
            >
              GARRA 2 {simStep >= 3 ? 'TRAVADA' : 'ABERTA'}
            </div>

            {/* Cabeçote Esquerdo A (Disco de Serra) */}
            <div
              className={`absolute left-20 bottom-full mb-2 p-2 rounded-lg bg-slate-850 border border-slate-700 flex flex-col items-center transition-all duration-500 ${
                simStep >= 2 ? 'rotate-[-45deg]' : 'rotate-0'
              } ${simStep === 4 ? 'translate-y-4 ring-2 ring-amber-400' : ''}`}
            >
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-red-500 bg-red-950/60 flex items-center justify-center animate-spin">
                <span className="text-[8px] font-bold text-red-300">3.2k</span>
              </div>
              <span className="text-[9px] font-mono text-cyan-400 mt-1">CAB. A (45°)</span>
            </div>

            {/* Batente Motorizado X */}
            <div
              className={`absolute bottom-full mb-2 p-1.5 rounded bg-cyan-950 border border-cyan-700 text-[10px] font-mono font-bold text-cyan-300 transition-all duration-700 ${
                simStep >= 1 ? 'right-28' : 'right-4'
              }`}
            >
              BATENTE X: 1452.0 mm
            </div>

            {/* Efeito de Corte no passo 4 */}
            {simStep === 4 && (
              <div className="absolute left-28 h-12 w-1 bg-amber-400 shadow-[0_0_15px_#f59e0b] animate-ping" />
            )}
          </div>

          {/* Legenda de Status da Simulação */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
            <span
              className={`px-2 py-0.5 rounded ${
                simStep === 1 ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-slate-500'
              }`}
            >
              1. Posicionamento X
            </span>
            <span
              className={`px-2 py-0.5 rounded ${
                simStep === 2 ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-slate-500'
              }`}
            >
              2. Ângulo A/B (45°/90°)
            </span>
            <span
              className={`px-2 py-0.5 rounded ${
                simStep === 3 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'text-slate-500'
              }`}
            >
              3. Garras M10
            </span>
            <span
              className={`px-2 py-0.5 rounded ${
                simStep === 4 ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse' : 'text-slate-500'
              }`}
            >
              4. Avanço do Disco
            </span>
            <span
              className={`px-2 py-0.5 rounded ${
                simStep === 5 ? 'bg-purple-950 text-purple-300 border border-purple-700' : 'text-slate-500'
              }`}
            >
              5. Peça Concluída
            </span>
          </div>
        </div>
      </div>

      {/* Prévia do Código Gerado e Terminal Serial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor de Código G-Code / Arquivo da Máquina */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs text-white">
                Prévia do Arquivo Gerado: <code className="text-cyan-300">{generatedFile.filename}</code>
              </span>
            </div>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs font-mono text-emerald-400 h-64 overflow-y-auto whitespace-pre-wrap leading-tight selection:bg-cyan-500 selection:text-black">
            {generatedFile.content}
          </pre>

          <div className="text-[11px] text-slate-400">
            {generatedFile.description}
          </div>
        </div>

        {/* Terminal de Comunicação Serial (Web Serial API) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-white">Log de Comunicação USB / Serial</span>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              115200 BAUD, 8N1
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-1">
            <div className="text-slate-500">
              Sanches&Marques CNC Driver pronto para conexão serial...
            </div>
            {serialLog.map((log, i) => (
              <div key={i} className="text-cyan-300">
                {log}
              </div>
            ))}
            {isSerialSending && (
              <div className="text-amber-400 animate-pulse">
                &gt;&gt; Enviando blocos de corte... {serialProgress}%
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setSerialLog([])}
              className="text-[11px] text-slate-500 hover:text-slate-300"
            >
              Limpar Log
            </button>

            <button
              onClick={handleTransmitSerial}
              disabled={isSerialSending}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-40"
            >
              Conectar e Transmitir Agora
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Modal de Gabarito de Estampos e Matrizes */}
      <PunchToolingModal
        isOpen={isPunchModalOpen}
        onClose={() => setIsPunchModalOpen(false)}
      />
    </div>
  );
};
