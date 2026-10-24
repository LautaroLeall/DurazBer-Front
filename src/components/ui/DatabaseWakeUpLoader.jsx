import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../services/api';

/**
 * Loader de Entrada & Sincronización Inteligente de DurazBer
 * - Funciona al entrar a la app hasta que el durazno 3D y los datos estén listos.
 * - Muestra el durazno girando y comiéndose (mordisco/chomp animado).
 * - Si el servidor en Render / MongoDB Atlas está en cold-start (durmiendo),
 *   muestra el tiempo de despertar sin trabar al usuario.
 */
const DatabaseWakeUpLoader = ({ isAppReady = false }) => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'sleeping' | 'awake'
  const [secondsWaking, setSecondsWaking] = useState(0);
  const [isBitten, setIsBitten] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [progress, setProgress] = useState(15);
  const [isDismissed, setIsDismissed] = useState(false);

  // Ciclo de animación: el durazno gira y se come alternadamente cada 900ms
  useEffect(() => {
    const biteInterval = setInterval(() => {
      setIsBitten((prev) => !prev);
    }, 900);
    return () => clearInterval(biteInterval);
  }, []);

  // Simulación de progreso fluido mientras carga
  useEffect(() => {
    if (isAppReady) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsDismissed(true);
      }, 450);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        return prev + Math.floor(Math.random() * 8 + 4);
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isAppReady]);

  // Chequeo de salud del servidor en segundo plano
  useEffect(() => {
    let isMounted = true;

    const probeServer = async () => {
      try {
        const res = await api.checkHealth();
        if (!isMounted) return;
        if (res.awake) {
          setStatus('awake');
        } else {
          setStatus('sleeping');
        }
      } catch {
        if (isMounted) setStatus('sleeping');
      }
    };

    probeServer();

    const interval = setInterval(async () => {
      if (status !== 'awake') {
        try {
          const res = await api.checkHealth();
          if (res.awake && isMounted) {
            setStatus('awake');
            clearInterval(interval);
          }
        } catch {
          // Servidor despertando
        }
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [status]);

  // Contador de segundos si el servidor está en frío
  useEffect(() => {
    let timer;
    if (status === 'sleeping') {
      timer = setInterval(() => {
        setSecondsWaking((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  // 1. PANTALLA COMPLETA DE ENTRADA: Activa hasta que el durazno 3D y la página carguen
  if (!isDismissed) {
    return (
      <aside
        aria-label="Cargando DurazBer"
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl transition-opacity duration-500 ${isAppReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
      >
        <div className="relative w-full max-w-[360px] flex flex-col items-center text-center space-y-5 p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xl">
          {/* Anillo de resplandor y durazno girando/comiéndose */}
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-primary/15 via-tertiary/10 to-primary-container/20 flex items-center justify-center border border-primary/25 shadow-inner">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-40" />

            <img
              src={isBitten ? '/assets/durazno-cortado.png' : '/assets/durazno-entero.png'}
              alt="Durazno animado"
              className={`w-20 h-20 object-contain filter drop-shadow-lg transition-all duration-300 ${isBitten ? 'animate-peach-chomp scale-95' : 'animate-peach-spin'
                }`}
            />

            {isBitten && (
              <Sparkles className="absolute top-2 right-2 w-5 h-5 text-primary animate-pulse" />
            )}
          </div>

          {/* Textos informativos */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h2 className="text-xl font-black text-on-surface font-display tracking-tight">
                Cargando DurazBer
              </h2>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              {status === 'sleeping'
                ? `Despertando servidor en la nube (${secondsWaking}s)...`
                : 'Sincronizando huerto y preparando el durazno 3D...'}
            </p>
          </div>

          {/* Barra de progreso fluida */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-outline px-1">
              <span>{isAppReady ? '¡Durazno listo!' : 'Iniciando motor botánico'}</span>
              <span className="text-primary font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden p-0.5 border border-outline-variant/20 shadow-inner">
              <div
                style={{ width: `${progress}%` }}
                className="bg-gradient-to-r from-primary-container via-primary to-tertiary h-full rounded-full transition-all duration-300 shadow-sm"
              />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 2. BANNER FLOTANTE SUPERIOR: Solo si la base de datos se duerme posteriormente
  if (status !== 'sleeping') {
    return null;
  }

  return (
    <aside
      aria-label="Reconectando base de datos"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[420px] transition-all duration-300 ease-out"
    >
      <div className="bg-surface/95 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-primary/30 text-on-surface space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-primary-container/30 flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden shadow-inner">
              <img
                src={isBitten ? '/assets/durazno-cortado.png' : '/assets/durazno-entero.png'}
                alt="Durazno animado"
                className={`w-9 h-9 object-contain filter drop-shadow-md transition-all duration-300 ${isBitten ? 'animate-peach-chomp scale-90' : 'animate-peach-spin'
                  }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-on-surface leading-tight font-display tracking-tight">
                  Despertando el Huerto...
                </h4>
                <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 bg-primary-container rounded-md">
                  {secondsWaking}s
                </span>
              </div>
              <p className="text-[11px] text-outline font-medium mt-0.5">
                La base de datos se tomó una siesta. Conectando...
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!isMinimized && (
          <div className="space-y-2 pt-1 border-t border-outline-variant/20">
            <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                <span>Podés interactuar con el durazno libremente</span>
              </span>
              <span className="text-primary font-bold">
                {Math.min(15 + secondsWaking * 4, 98)}%
              </span>
            </div>

            <div className="relative w-full bg-surface-container rounded-full h-2 overflow-hidden">
              <div
                style={{ width: `${Math.min(15 + secondsWaking * 4, 98)}%` }}
                className="bg-gradient-to-r from-primary-container via-primary to-tertiary h-full rounded-full transition-all duration-700 shadow-sm"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default DatabaseWakeUpLoader;
