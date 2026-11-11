import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Wifi, CheckCircle2, ShieldCheck, Database, RefreshCw, Zap } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnectedToast(true);
      const timer = setTimeout(() => {
        setShowReconnectedToast(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const toggleSimulatedOffline = () => {
    window.dispatchEvent(new CustomEvent('sm_toggle_offline_mode'));
  };

  return (
    <>
      {/* Toast quando volta a ter internet */}
      {showReconnectedToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/90 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-emerald-200 shadow-xl animate-in slide-in-from-top-2">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>Conexão restabelecida! Sincronização e backup online ativos.</span>
        </div>
      )}

      {/* Banner / Floating Pill quando está sem internet */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-slate-900/95 backdrop-blur-md p-3 text-xs text-amber-200 shadow-2xl shadow-black/80 max-w-[90vw] sm:max-w-md animate-in slide-in-from-bottom-2">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
            <WifiOff className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-bold text-amber-300 truncate">Modo Sem Internet (100% Operacional)</span>
            <span className="text-[11px] text-slate-300 truncate">
              Orçamentos, cortes 1D/2D, estoque e PCP ativos.
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition cursor-pointer"
            >
              Detalhes
            </button>
            <button
              onClick={toggleSimulatedOffline}
              title="Restaurar modo online"
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal explicativo do funcionamento sem internet */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <WifiOff className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Como Funciona Sem Internet?</h3>
                <p className="text-xs text-slate-400">Sanches &amp; Marques Esquadrias Pro Offline</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Banco de Dados Local:</strong> Todos os seus pedidos, clientes, orçamentos e listas de estoque ficam gravados no armazenamento local seguro do seu dispositivo (`localStorage`).
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Cálculos Independentes:</strong> O motor matemático de otimização de barras 1D, corte de vidros 2D e cálculo de peso e área rodam 100% no seu aparelho, sem depender de servidor remoto.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Instalação no Celular e PC:</strong> Você pode clicar no botão <strong>"Instalar App"</strong> no topo da tela para fixar o ícone na área de trabalho ou tela inicial do celular.
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  toggleSimulatedOffline();
                  setShowDetailsModal(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{isOnline ? 'Testar Modo Offline' : 'Voltar ao Modo Online'}</span>
              </button>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-2 text-xs font-bold text-black transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
