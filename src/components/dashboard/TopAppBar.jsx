import { useState, useEffect, useRef } from 'react';
import { Flame, Download } from 'lucide-react';
import { canPromptInstall, triggerInstallPrompt } from '../../utils/pwaInstall';

const TopAppBar = ({ user, streak = 0, onProfileClick }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [installReady, setInstallReady] = useState(() => canPromptInstall());
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Si scrollea hacia abajo más de 50px, ocultar la barra
      if (currentScrollY > lastScrollYRef.current && currentScrollY > 50) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollYRef.current) {
        // Si scrollea hacia arriba, volver a mostrar
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    const handlePwaReady = () => setInstallReady(canPromptInstall());
    const handlePwaInstalled = () => setInstallReady(false);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('durazber_pwa_ready', handlePwaReady);
    window.addEventListener('durazber_pwa_installed', handlePwaInstalled);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('durazber_pwa_ready', handlePwaReady);
      window.removeEventListener('durazber_pwa_installed', handlePwaInstalled);
    };
  }, []);

  const handleQuickInstall = async () => {
    await triggerInstallPrompt();
    setInstallReady(canPromptInstall());
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full flex items-center justify-between gap-2 px-4 pb-3 safe-top bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 shadow-xs transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
    >
      {/* Perfil & Marca */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onProfileClick}
          title={user?.name || 'Ver Perfil'}
          className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary-container p-0.5 bg-surface-container-lowest shadow-xs active:scale-95 transition-transform shrink-0"
        >
          <img
            alt={user?.name || 'Usuario'}
            className="w-full h-full object-cover rounded-full"
            src={user?.avatar || '/avatar/avatar-lau.png'}
          />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-primary leading-none font-display truncate">
              DurazBer
            </span>
          </div>
          <span className="text-[10px] font-bold text-outline tracking-wider block mt-0.5 truncate">
            {user?.name ? user.name.toUpperCase() : 'BERNI COME DURAZNO'}
          </span>
        </div>
      </div>

      {/* Acciones Rápidas & Racha */}
      <div className="flex items-center gap-1.5 shrink-0">
        {installReady && (
          <button
            type="button"
            onClick={handleQuickInstall}
            title="Instalar DurazBer como App"
            className="flex items-center gap-1 bg-primary-fixed text-primary px-2.5 py-1.5 rounded-full text-[11px] font-bold border border-primary/25 shadow-xs active:scale-95 transition-transform"
          >
            <Download className="w-3.5 h-3.5" />
            <span>App</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline-variant/30 shadow-xs active:scale-95 transition-transform">
          <Flame className={`w-4 h-4 ${streak > 0 ? 'text-primary fill-primary animate-pulse' : 'text-outline/50'}`} />
          <span className={`text-xs font-bold ${streak > 0 ? 'text-primary' : 'text-outline'}`}>
            {streak} {streak === 1 ? 'Día' : 'Días'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default TopAppBar;
