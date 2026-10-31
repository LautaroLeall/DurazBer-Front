import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import TopAppBar from './components/dashboard/TopAppBar';
import DatabaseWakeUpLoader from './components/ui/DatabaseWakeUpLoader';
import HeroStepper from './components/dashboard/HeroStepper';
import HistoryView from './components/history/HistoryView';
import AnalyticsView from './components/analytics/AnalyticsView';
import ProfileView from './components/profile/ProfileView';
import TabBar from './components/navigation/TabBar';
import LoginView from './components/auth/LoginView';
import PeachHarvestCelebrationStage from './components/celebration/PeachHarvestCelebrationStage';
import { api } from './services/api';
import { playBiteSound, playPopSound } from './utils/soundEffects';

const SUMMARY_CACHE_KEY = 'durazber_summary_cache';

const getLocalTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEmptySummary = (dailyGoal = 4) => ({
  totalPeaches: 0,
  dailyGoal,
  streak: 0,
  progressPercent: 0,
  isGoalReached: false,
  nutrients: { kcal: 0, fiberGrams: 0, vitCPercent: 0, waterPercent: 89 },
  todayLogs: []
});

const loadCachedSummary = (userId) => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(SUMMARY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.userId === userId && parsed.dateKey === getLocalTodayKey() && parsed.summary) {
      return parsed.summary;
    }
  } catch { }
  return null;
};

const saveCachedSummary = (userId, summaryData) => {
  if (!userId || !summaryData) return;
  try {
    localStorage.setItem(
      SUMMARY_CACHE_KEY,
      JSON.stringify({
        userId,
        dateKey: getLocalTodayKey(),
        summary: summaryData
      })
    );
  } catch { }
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('durazber_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [dataVersion, setDataVersion] = useState(0);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Hidratar inmediatamente desde caché local si el usuario ya entró hoy (apertura en 0.2s)
  const [summary, setSummary] = useState(() => {
    const cached = loadCachedSummary(user?._id);
    return cached || getEmptySummary(user?.dailyGoal || 4);
  });

  // Contador de operaciones en vuelo para evitar condiciones de carrera al tocar +1 rápido
  const pendingOpsRef = useRef(0);
  const lastDateKeyRef = useRef(getLocalTodayKey());

  // Estados de carga para el loader inteligente
  const [dataLoaded, setDataLoaded] = useState(() => Boolean(loadCachedSummary(user?._id)));
  const [peach3DReady, setPeach3DReady] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  // Persistir automáticamente el resumen del día en caché local
  useEffect(() => {
    if (user?._id && dataLoaded) {
      saveCachedSummary(user._id, summary);
    }
  }, [user?._id, summary, dataLoaded]);

  // Sincronización en tiempo real sin necesidad de recargar la página (Focus, WakeUp, Online y Polling ligero)
  useEffect(() => {
    if (user) {
      loadTodayData();
    }

    const handleAuthExpired = () => {
      setUser(null);
      navigate('/login');
    };

    const syncWhenActive = () => {
      if (!user || document.hidden || pendingOpsRef.current > 0) return;
      const currentKey = getLocalTodayKey();
      if (currentKey !== lastDateKeyRef.current) {
        lastDateKeyRef.current = currentKey;
        setSummary(getEmptySummary(user.dailyGoal || 4));
      }
      loadTodayData();
      setDataVersion((v) => v + 1);
    };

    window.addEventListener('durazber_auth_expired', handleAuthExpired);
    window.addEventListener('focus', syncWhenActive);
    window.addEventListener('online', syncWhenActive);
    document.addEventListener('visibilitychange', syncWhenActive);

    const liveInterval = setInterval(() => {
      if (user && !document.hidden && pendingOpsRef.current === 0) {
        loadTodayData();
      }
    }, 15000);

    return () => {
      window.removeEventListener('durazber_auth_expired', handleAuthExpired);
      window.removeEventListener('focus', syncWhenActive);
      window.removeEventListener('online', syncWhenActive);
      document.removeEventListener('visibilitychange', syncWhenActive);
      clearInterval(liveInterval);
    };
  }, [user?._id]);

  // Coordinar estado de carga completo (Datos + Durazno 3D)
  useEffect(() => {
    if (!user) {
      setIsAppReady(true);
      return;
    }

    const isCosecha = location.pathname === '/cosecha' || location.pathname === '/';

    if (isCosecha) {
      if (dataLoaded && peach3DReady) {
        setIsAppReady(true);
      }
    } else {
      if (dataLoaded) {
        setIsAppReady(true);
      }
    }

    // Safety timeout de 1.5s para fluidez absoluta en móvil / iOS
    const safetyTimer = setTimeout(() => {
      setIsAppReady(true);
    }, 1500);

    return () => clearTimeout(safetyTimer);
  }, [user, dataLoaded, peach3DReady, location.pathname]);

  const loadTodayData = async () => {
    try {
      const data = await api.getTodaySummary();
      if (data && pendingOpsRef.current === 0) {
        setSummary(data);
      }
    } catch (err) {
      console.warn('Error al cargar datos del día:', err.message);
    } finally {
      setDataLoaded(true);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    const cached = loadCachedSummary(userData?._id);
    if (cached) {
      setSummary(cached);
      setDataLoaded(true);
    } else {
      setSummary(getEmptySummary(userData?.dailyGoal || 4));
    }
    setDataVersion((v) => v + 1);
    navigate('/cosecha');
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setSummary(getEmptySummary(4));
    navigate('/login');
  };

  // Manejar Incremento Real (+1, +2) en tiempo real para Cosecha, Historial y Analítica
  const handleIncrement = (amount = 1) => {
    playBiteSound();
    pendingOpsRef.current += 1;
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticLog = {
      _id: tempId,
      date: new Date().toISOString(),
      peachesCount: amount,
      weightGrams: amount * 150,
      mealType: 'Snack',
      nutrients: {
        kcal: amount * 63,
        fiberGrams: +(amount * 2.3).toFixed(1),
        vitCPercent: Math.min(amount * 17, 100),
        waterPercent: 89
      }
    };

    // 1. Actualización optimista inmediata en 0ms (Cosecha + Historial + Analítica)
    setSummary((prev) => {
      const newTotal = prev.totalPeaches + amount;
      const newPercent = Math.min(Math.round((newTotal / prev.dailyGoal) * 100), 100);
      const goalJustReached = !prev.isGoalReached && newTotal >= prev.dailyGoal;

      if (goalJustReached) {
        setTimeout(() => {
          setIsGoalModalOpen(true);
        }, 150);
      }

      return {
        ...prev,
        totalPeaches: newTotal,
        streak: prev.streak > 0 ? prev.streak : 1,
        progressPercent: newPercent,
        isGoalReached: newTotal >= prev.dailyGoal,
        todayLogs: [optimisticLog, ...(prev.todayLogs || [])],
        nutrients: {
          kcal: newTotal * 63,
          fiberGrams: +(newTotal * 2.3).toFixed(1),
          vitCPercent: Math.min(newTotal * 17, 100),
          waterPercent: 89
        }
      };
    });

    // 2. Guardado real en MongoDB Atlas en 1 solo viaje de red
    api
      .quickIncrement(amount)
      .then((res) => {
        pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
        if (pendingOpsRef.current === 0) {
          if (res?.summary) {
            setSummary(res.summary);
          } else {
            loadTodayData();
          }
          setDataVersion((v) => v + 1);
        }
      })
      .catch((err) => {
        console.error(err);
        pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
        if (pendingOpsRef.current === 0) {
          loadTodayData();
        }
      });
  };

  // Manejar Restar 1 en tiempo real (Cosecha + Historial + Analítica)
  const handleDecrement = () => {
    if (summary.totalPeaches <= 0) return;
    playPopSound(0.85);
    pendingOpsRef.current += 1;

    // 1. Actualización optimista inmediata en 0ms
    setSummary((prev) => {
      const newTotal = Math.max(0, prev.totalPeaches - 1);
      const newPercent = Math.min(Math.round((newTotal / prev.dailyGoal) * 100), 100);

      const currentLogs = [...(prev.todayLogs || [])];
      if (currentLogs.length > 0) {
        const latest = { ...currentLogs[0] };
        if ((latest.peachesCount || 1) > 1) {
          latest.peachesCount -= 1;
          latest.weightGrams = latest.peachesCount * 150;
          currentLogs[0] = latest;
        } else {
          currentLogs.shift();
        }
      }

      return {
        ...prev,
        totalPeaches: newTotal,
        streak: newTotal === 0 ? 0 : prev.streak,
        progressPercent: newPercent,
        isGoalReached: newTotal >= prev.dailyGoal,
        todayLogs: currentLogs,
        nutrients: {
          kcal: newTotal * 63,
          fiberGrams: +(newTotal * 2.3).toFixed(1),
          vitCPercent: Math.min(newTotal * 17, 100),
          waterPercent: 89
        }
      };
    });

    // 2. Guardado real en MongoDB Atlas en 1 solo viaje de red
    api
      .quickDecrement()
      .then((res) => {
        pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
        if (pendingOpsRef.current === 0) {
          if (res?.summary) {
            setSummary(res.summary);
          } else {
            loadTodayData();
          }
          setDataVersion((v) => v + 1);
        }
      })
      .catch((err) => {
        console.error(err);
        pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
        if (pendingOpsRef.current === 0) {
          loadTodayData();
        }
      });
  };

  // Sincronización en Tiempo Real: Si borrás del historial, se descuenta de Cosecha y Analítica en 0ms
  const handleDeleteLog = async (id) => {
    pendingOpsRef.current += 1;
    setSummary((prev) => {
      const deletedItem = prev.todayLogs?.find((l) => l._id === id);
      const countToSubtract = deletedItem ? (deletedItem.peachesCount || 1) : 0;
      const newTotal = Math.max(0, prev.totalPeaches - countToSubtract);
      const newPercent = Math.min(Math.round((newTotal / prev.dailyGoal) * 100), 100);

      return {
        ...prev,
        totalPeaches: newTotal,
        streak: newTotal === 0 ? 0 : prev.streak,
        progressPercent: newPercent,
        isGoalReached: newTotal >= prev.dailyGoal,
        todayLogs: prev.todayLogs?.filter((l) => l._id !== id) || [],
        nutrients: {
          kcal: newTotal * 63,
          fiberGrams: +(newTotal * 2.3).toFixed(1),
          vitCPercent: Math.min(newTotal * 17, 100),
          waterPercent: 89
        }
      };
    });

    try {
      const res = await api.deleteLog(id);
      pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
      if (pendingOpsRef.current === 0) {
        if (res?.summary) {
          setSummary(res.summary);
        } else {
          await loadTodayData();
        }
      }
      setDataVersion((v) => v + 1);
    } catch (err) {
      console.error('Error al borrar:', err);
      pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
      if (pendingOpsRef.current === 0) {
        loadTodayData();
      }
    }
  };

  // Racha estricta: si hoy comió 0 duraznos, la racha es SIEMPRE 0
  const activeStreak = summary.totalPeaches > 0 ? (summary.streak ?? 1) : 0;
  const activeGoal = summary.dailyGoal || user?.dailyGoal || 4;

  // Si no está autenticado, mostrar Login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dim/30 flex justify-center text-on-surface antialiased">
      {/* Shell Principal Estilo App Móvil (Max-W 440px Centrado) */}
      <div className="relative w-full max-w-[440px] min-h-screen bg-background flex flex-col shadow-2xl border-x border-outline-variant/20 overflow-x-hidden">
        {/* Top App Bar con usuario real, botón de instalación PWA y racha calculada */}
        <TopAppBar
          user={user}
          streak={activeStreak}
          onProfileClick={() => navigate('/perfil')}
        />

        {/* Loader inteligente para cuando la DB o servidor en Render esté despertando o cargando */}
        <DatabaseWakeUpLoader isAppReady={isAppReady} />

        {/* Rutas Principales de la Aplicación */}
        <main className="flex-1 pt-3 pb-28 px-4">
          <Routes>
            <Route path="/" element={<Navigate to="/cosecha" replace />} />
            <Route
              path="/cosecha"
              element={
                <HeroStepper
                  totalPeaches={summary.totalPeaches}
                  dailyGoal={activeGoal}
                  progressPercent={summary.progressPercent}
                  isGoalReached={summary.isGoalReached}
                  nutrients={summary.nutrients}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onPeachReady={() => setPeach3DReady(true)}
                />
              }
            />
            <Route
              path="/historial"
              element={
                <HistoryView
                  todayLogs={summary.todayLogs}
                  onDeleteLog={handleDeleteLog}
                  refreshTrigger={dataVersion}
                />
              }
            />
            <Route
              path="/analitica"
              element={
                <AnalyticsView
                  totalPeachesToday={summary.totalPeaches}
                  dailyGoal={activeGoal}
                  refreshTrigger={dataVersion}
                />
              }
            />
            <Route
              path="/perfil"
              element={
                <ProfileView
                  user={user}
                  dailyGoal={activeGoal}
                  streak={activeStreak}
                  onUpdateGoal={async (newGoal) => {
                    await api.updateProfile({ dailyGoal: newGoal });
                    setSummary((prev) => ({
                      ...prev,
                      dailyGoal: newGoal,
                      progressPercent: Math.min(Math.round((prev.totalPeaches / newGoal) * 100), 100),
                      isGoalReached: prev.totalPeaches >= newGoal
                    }));
                    setUser((prev) => ({ ...prev, dailyGoal: newGoal }));
                    setDataVersion((v) => v + 1);
                  }}
                  onLogout={handleLogout}
                />
              }
            />
            <Route path="/login" element={<Navigate to="/cosecha" replace />} />
            <Route path="*" element={<Navigate to="/cosecha" replace />} />
          </Routes>
        </main>

        {/* Barra de Navegación Flotante con Rutas Reales */}
        <TabBar
          onTabChange={() => {
            setDataVersion((v) => v + 1);
          }}
        />

        {/* Experiencia Inmersiva Triunfal al Cumplir la Meta (Sin Modal) */}
        <PeachHarvestCelebrationStage
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          userName={user?.name?.split(' ')[0] || 'Berni'}
          dailyGoal={activeGoal}
        />
      </div>
    </div>
  );
}

export default App;
