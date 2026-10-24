import React, { useState, useEffect } from 'react';
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
  const [summary, setSummary] = useState({
    totalPeaches: 0,
    dailyGoal: 4,
    streak: 0,
    progressPercent: 0,
    isGoalReached: false,
    nutrients: { kcal: 0, fiberGrams: 0, vitCPercent: 0, waterPercent: 89 },
    todayLogs: []
  });

  // Estados de carga para el loader inteligente
  const [dataLoaded, setDataLoaded] = useState(false);
  const [peach3DReady, setPeach3DReady] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    if (user) {
      loadTodayData();
    }

    const handleAuthExpired = () => {
      setUser(null);
      navigate('/login');
    };
    window.addEventListener('durazber_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('durazber_auth_expired', handleAuthExpired);
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

    // Safety timeout de 2.8s para fluidez absoluta
    const safetyTimer = setTimeout(() => {
      setIsAppReady(true);
    }, 2800);

    return () => clearTimeout(safetyTimer);
  }, [user, dataLoaded, peach3DReady, location.pathname]);

  const loadTodayData = async () => {
    try {
      const data = await api.getTodaySummary();
      if (data) {
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
    setDataVersion((v) => v + 1);
    loadTodayData();
    navigate('/cosecha');
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setSummary({
      totalPeaches: 0,
      dailyGoal: 4,
      streak: 0,
      progressPercent: 0,
      isGoalReached: false,
      nutrients: { kcal: 0, fiberGrams: 0, vitCPercent: 0, waterPercent: 89 },
      todayLogs: []
    });
    navigate('/login');
  };

  // Manejar Incremento Real (+1, +2)
  const handleIncrement = (amount = 1) => {
    playBiteSound();

    // 1. Actualización optimista inmediata en Cosecha (63 kcal, 2.3g fibra, 17% Vit C por durazno)
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
        // Si comió al menos un durazno, la racha es al menos 1
        streak: prev.streak > 0 ? prev.streak : 1,
        progressPercent: newPercent,
        isGoalReached: newTotal >= prev.dailyGoal,
        nutrients: {
          kcal: newTotal * 63,
          fiberGrams: +(newTotal * 2.3).toFixed(1),
          vitCPercent: Math.min(newTotal * 17, 100),
          waterPercent: 89
        }
      };
    });

    // 2. Guardado real en MongoDB Atlas y sincronización de versión
    api.quickIncrement(amount).then((res) => {
      if (res?.streak !== undefined) {
        setSummary((prev) => ({ ...prev, streak: res.streak }));
      }
      setDataVersion((v) => v + 1);
      loadTodayData();
    }).catch(console.error);
  };

  // Manejar Restar 1
  const handleDecrement = () => {
    if (summary.totalPeaches <= 0) return;
    playPopSound(0.85);

    // 1. Actualización optimista inmediata
    setSummary((prev) => {
      const newTotal = Math.max(0, prev.totalPeaches - 1);
      const newPercent = Math.min(Math.round((newTotal / prev.dailyGoal) * 100), 100);

      return {
        ...prev,
        totalPeaches: newTotal,
        // Si baja a 0 duraznos, la racha de hoy se reinicia a cero
        streak: newTotal === 0 ? 0 : prev.streak,
        progressPercent: newPercent,
        isGoalReached: newTotal >= prev.dailyGoal,
        nutrients: {
          kcal: newTotal * 63,
          fiberGrams: +(newTotal * 2.3).toFixed(1),
          vitCPercent: Math.min(newTotal * 17, 100),
          waterPercent: 89
        }
      };
    });

    // 2. Guardado real en MongoDB Atlas
    api.quickDecrement().then((res) => {
      if (res?.streak !== undefined) {
        setSummary((prev) => ({ ...prev, streak: res.streak }));
      }
      setDataVersion((v) => v + 1);
      loadTodayData();
    }).catch(console.error);
  };

  // Sincronización en Tiempo Real: Si borrás del historial, se descuenta de Cosecha automáticamente
  const handleDeleteLog = async (id) => {
    setSummary((prev) => {
      const deletedItem = prev.todayLogs?.find((l) => l._id === id);
      const countToSubtract = deletedItem ? (deletedItem.peachesCount || 1) : 1;
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
      if (res?.streak !== undefined) {
        setSummary((prev) => ({ ...prev, streak: res.streak }));
      }
      setDataVersion((v) => v + 1);
      await loadTodayData();
    } catch (err) {
      console.error('Error al borrar:', err);
      loadTodayData();
    }
  };

  // Racha estricta: si hoy comió 0 duraznos, la racha es SIEMPRE 0
  const activeStreak = summary.totalPeaches > 0 ? (summary.streak ?? 1) : 0;

  // Si no está autenticado y está intentando acceder a una ruta privada, mostrar Login
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
        {/* Top App Bar con usuario real y racha calculada */}
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
                  dailyGoal={summary.dailyGoal || user.dailyGoal || 4}
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
                  onDeleteLog={handleDeleteLog}
                  refreshTrigger={dataVersion}
                />
              }
            />
            <Route
              path="/analitica"
              element={
                <AnalyticsView
                  refreshTrigger={dataVersion}
                />
              }
            />
            <Route
              path="/perfil"
              element={
                <ProfileView
                  user={user}
                  dailyGoal={summary.dailyGoal || user.dailyGoal || 4}
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
          dailyGoal={summary.dailyGoal || user?.dailyGoal || 4}
        />
      </div>
    </div>
  );
}

export default App;
