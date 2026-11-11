// Registro oficial de Service Worker via vite-plugin-pwa (Workbox)
import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[PWA] Nova versão disponível em segundo plano.');
      },
      onOfflineReady() {
        console.log('[PWA] Aplicação totalmente em cache para funcionamento offline.');
      },
      onRegisterError(error: any) {
        console.warn('[PWA] Aviso no registro do Service Worker:', error);
      },
    });

    return updateSW;
  }
}
