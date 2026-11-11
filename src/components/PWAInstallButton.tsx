import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, CheckCircle, Share, PlusSquare, Monitor, X, ExternalLink, Copy, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, directAppUrl, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Se já estiver rodando em standalone (aplicativo instalado no celular/PC)
  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">App Instalado &amp; Offline</span>
        </div>
      );
    }
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>Instalado (Offline)</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    // Se o navegador já permitiu a instalação direta via prompt nativo
    if (isInstallable && !isInIframe) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Abre o modal detalhado com botão de abrir em nova aba e instruções específicas
      setShowGuideModal(true);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(directAppUrl || window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          title="Instalar Sanches & Marques no celular ou PC para rodar sem internet"
          className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-3.5 py-1.5 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 shrink-0 animate-bounce" />
          <span>Instalar App (Sem Internet)</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition group cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
            <span>Instalar Aplicativo</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
            Offline
          </span>
        </button>
      )}

      {/* Modal de Instalação com suporte a Nova Aba, Celular e PC */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Instalar Aplicativo (Modo Sem Internet)</h3>
                <p className="text-xs text-slate-400">Para usar no celular ou computador sem conexão</p>
              </div>
            </div>

            {/* Aviso especial caso esteja rodando dentro do iframe de preview do AI Studio */}
            {isInIframe && (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <span>ℹ️ Por que não instalou direto com 1 clique?</span>
                </div>
                <p className="text-slate-300">
                  Os navegadores (Chrome, Safari, Edge) <strong>bloqueiam a instalação de aplicativos dentro da janela de testes do AI Studio</strong> por segurança.
                </p>
                <p className="text-slate-200 font-semibold">
                  Basta abrir o link do aplicativo em uma <strong>aba própria do navegador</strong> ou no seu celular para instalar com 1 clique!
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={directAppUrl || window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir em Nova Aba para Instalar</span>
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Passo a Passo Ilustrado por Dispositivo */}
            <div className="space-y-3 text-xs">
              {/* Celular Android */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
                <div className="flex items-center gap-2 font-bold text-amber-300 mb-2">
                  <Smartphone className="w-4 h-4" /> No Celular Android (Google Chrome / Samsung):
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Abra o link do sistema no navegador Google Chrome.</li>
                  <li>Toque no menu de 3 pontinhos <strong>(⋮)</strong> no topo superior direito.</li>
                  <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                  <li>O ícone aparecerá no seu celular e abrirá em tela cheia mesmo se você desligar o Wi-Fi e dados móveis!</li>
                </ol>
              </div>

              {/* Celular iPhone / iPad (iOS) */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
                <div className="flex items-center gap-2 font-bold text-sky-300 mb-2">
                  <Smartphone className="w-4 h-4" /> No iPhone ou iPad (Safari):
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Abra o link no navegador <strong>Safari</strong> da Apple.</li>
                  <li>Toque no botão <strong>Compartilhar ⬆️</strong> no rodapé do Safari.</li>
                  <li>Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                  <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
                </ol>
              </div>

              {/* Computador Desktop Windows / Mac */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
                <div className="flex items-center gap-2 font-bold text-emerald-300 mb-2">
                  <Monitor className="w-4 h-4" /> No Computador (Google Chrome / Edge):
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Abra o link do sistema em uma aba do Chrome ou Edge.</li>
                  <li>Clique no ícone de instalação <strong>(⬇️ ou computador com seta)</strong> na barra de endereços (ao lado da estrelinha de favoritos).</li>
                  <li>Clique em <strong>"Instalar"</strong>. Um atalho é criado na sua Área de Trabalho.</li>
                </ol>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer"
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
