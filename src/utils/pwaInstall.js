/**
 * Gestor de Instalación PWA, Service Worker y Blindaje Táctil iOS para DurazBer
 * Permite guardar y abrir DurazBer como aplicación nativa en iOS, Android, Windows y macOS,
 * evitando zooms accidentales de página en iPhone Safari.
 */

let deferredInstallPrompt = null;

export const initPWA = () => {
  if (typeof window === 'undefined') return;

  // 1. Bloquear zoom accidental de página en iOS Safari (doble tap y pellizco global)
  document.addEventListener(
    'gesturestart',
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener(
    'gesturechange',
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener(
    'dblclick',
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );

  // 2. Capturar evento nativo de instalación (Chrome / Edge / Android)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    window.dispatchEvent(new Event('durazber_pwa_ready'));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    window.dispatchEvent(new Event('durazber_pwa_installed'));
  });

  // 3. Registrar Service Worker para modo App Standalone y caché inteligente
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('SW registro omitido:', err.message));
    });
  }
};

export const canPromptInstall = () => Boolean(deferredInstallPrompt);

export const isRunningStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

export const isIosDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

export const triggerInstallPrompt = async () => {
  if (!deferredInstallPrompt) return { outcome: 'unavailable' };
  deferredInstallPrompt.prompt();
  const choiceResult = await deferredInstallPrompt.userChoice;
  if (choiceResult.outcome === 'accepted') {
    deferredInstallPrompt = null;
    window.dispatchEvent(new Event('durazber_pwa_installed'));
  }
  return choiceResult;
};
