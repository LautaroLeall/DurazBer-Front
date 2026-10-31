import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Calendar, BarChart3, User } from 'lucide-react';
import { playWaterDrop } from '../../utils/soundEffects';

const TABS = [
  { path: '/cosecha', label: 'Cosecha', icon: Sparkles },
  { path: '/historial', label: 'Historial', icon: Calendar },
  { path: '/analitica', label: 'Analítica', icon: BarChart3 },
  { path: '/perfil', label: 'Perfil', icon: User }
];

const TabBar = ({ onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (path) => {
    if (location.pathname !== path) {
      playWaterDrop();
      navigate(path);
      if (onTabChange) onTabChange();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[440px] mx-auto px-4 safe-bottom pt-2 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
      <div className="flex items-center justify-around bg-surface/95 backdrop-blur-xl border border-outline-variant/30 rounded-3xl p-1.5 shadow-xl pointer-events-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            location.pathname === tab.path ||
            (tab.path === '/cosecha' && (location.pathname === '/' || location.pathname === ''));

          return (
            <button
              type="button"
              key={tab.path}
              onClick={() => handleClick(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-95 ${isActive
                ? 'bg-primary-container text-on-primary-container font-extrabold shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-bold mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;
