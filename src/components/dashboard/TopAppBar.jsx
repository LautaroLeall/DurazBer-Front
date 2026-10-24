import React, { useState, useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';

const TopAppBar = ({ user, streak = 0, onProfileClick }) => {
  const [isVisible, setIsVisible] = useState(true);
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full flex items-center justify-between px-5 py-3.5 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 shadow-xs transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
    >
      {/* Perfil & Marca */}
      <div className="flex items-center gap-3">
        <button
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
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-primary leading-none font-display">
              DurazBer
            </span>
          </div>
          <span className="text-[10px] font-bold text-outline tracking-wider block mt-0.5">
            {user?.name ? user.name.toUpperCase() : 'BERNI COME DURAZNO'}
          </span>
        </div>
      </div>

      {/* Racha */}
      <div className="flex items-center gap-2">
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
