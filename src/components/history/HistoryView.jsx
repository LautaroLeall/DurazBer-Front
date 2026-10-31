import { useState, useEffect, useRef } from 'react';
import { Calendar, Trash2, Clock, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { playPopSound } from '../../utils/soundEffects';

const CUT_PEACH_IMAGE = '/assets/durazno-cortado.png';

// Caché en memoria por fecha para cambiar de día en el carrusel sin parpadeos
const historyDayCache = new Map();

const HistoryView = ({ todayLogs = [], onDeleteLog, refreshTrigger = 0 }) => {
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [logs, setLogs] = useState(() => todayLogs);
  const [loading, setLoading] = useState(false);
  const activeDateRef = useRef('');

  // Generar los últimos 7 días para el carrusel en hora local del dispositivo
  const days = [];
  const now = new Date();
  const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const fullDate = `${year}-${month}-${day}`;

    days.push({
      offset: i,
      dayName: dayNames[d.getDay()],
      dayNumber: d.getDate(),
      fullDate,
      isToday: i === 0
    });
  }

  const activeDay = days.find((d) => d.offset === selectedDayOffset) || days[days.length - 1];
  activeDateRef.current = activeDay.fullDate;

  // Si está parado en HOY, reflejar en tiempo real (0ms) los todayLogs de App.jsx
  useEffect(() => {
    if (selectedDayOffset === 0 && Array.isArray(todayLogs)) {
      setLogs(todayLogs);
      historyDayCache.set(activeDay.fullDate, todayLogs);
      setLoading(false);
    }
  }, [todayLogs, selectedDayOffset, activeDay.fullDate]);

  // Cargar registros desde la API (en segundo plano si ya hay caché)
  useEffect(() => {
    const dateStr = activeDay.fullDate;

    if (selectedDayOffset === 0 && Array.isArray(todayLogs) && todayLogs.length > 0) {
      setLogs(todayLogs);
      setLoading(false);
    } else if (historyDayCache.has(dateStr)) {
      setLogs(historyDayCache.get(dateStr));
      setLoading(false);
    } else {
      setLoading(true);
    }

    let isCancelled = false;
    api
      .getHistoryLogs(dateStr)
      .then((data) => {
        if (isCancelled || activeDateRef.current !== dateStr) return;
        const list = Array.isArray(data) ? data : [];
        historyDayCache.set(dateStr, list);
        setLogs(list);
      })
      .catch(() => {
        if (!isCancelled && !historyDayCache.has(dateStr)) {
          setLogs([]);
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedDayOffset, refreshTrigger, activeDay.fullDate]);

  const handleDelete = async (id) => {
    if (!id) return;
    playPopSound(0.8);

    // 1. Eliminar visualmente del historial de inmediato (0ms)
    setLogs((prev) => {
      const next = prev.filter((l) => l._id !== id);
      historyDayCache.set(activeDay.fullDate, next);
      return next;
    });

    // 2. Notificar al componente raíz para actualizar Cosecha, Racha y Analítica en tiempo real
    if (onDeleteLog) {
      await onDeleteLog(id);
    } else {
      await api.deleteLog(id);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Bitácora en Vivo</span>
          <h1 className="text-xl font-bold text-on-surface font-display">Historial de Consumo</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-xs">
          <Calendar className="w-4 h-4" />
        </div>
      </div>

      {/* Carrusel Horizontal de Días */}
      <section className="bg-surface-container-lowest rounded-3xl p-3 border border-outline-variant/25 peach-ambient-card">
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-1">
          {days.map((d) => {
            const isSelected = d.offset === selectedDayOffset;
            return (
              <button
                type="button"
                key={d.offset}
                onClick={() => setSelectedDayOffset(d.offset)}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[48px] transition-all active:scale-95 border ${isSelected
                    ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-xs'
                    : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-primary/40'
                  }`}
              >
                <span className="text-[10px] font-semibold">{d.dayName}</span>
                <span className="text-base font-extrabold my-0.5">{d.dayNumber}</span>
                {d.isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Entradas Cronológicas Reales */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Cosecha del {activeDay.isToday ? 'Día de Hoy' : activeDay.fullDate}
          </span>
          <span className="text-[11px] text-outline font-semibold">
            {logs.length} registro(s)
          </span>
        </div>

        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-outline font-semibold bg-surface-container-lowest rounded-3xl border border-outline-variant/20">
            Sincronizando bitácora...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/20 space-y-2">
            <div className="w-12 h-12 rounded-full bg-surface-container mx-auto flex items-center justify-center text-outline">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-on-surface-variant">
              No hay duraznos registrados en este día
            </p>
            <p className="text-[11px] text-outline">
              Sumá tu primer durazno de hoy en la pestaña Cosecha
            </p>
          </div>
        ) : (
          logs.map((log, index) => {
            const count = log.peachesCount || 1;
            const timeStr = log.date
              ? new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Ahora';

            return (
              <article
                key={log._id || index}
                className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/25 peach-ambient-card hover:border-primary-container/50 transition-all flex flex-col gap-3"
              >
                {/* Cabecera */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low p-1 flex items-center justify-center shrink-0 border border-outline-variant/20 overflow-hidden">
                      <img
                        alt="Durazno registrado"
                        className="w-full h-full object-contain filter drop-shadow-xs"
                        src={CUT_PEACH_IMAGE}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-outline flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{timeStr}</span>
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface mt-0.5 truncate">
                        {count} {count === 1 ? 'Durazno Fresco' : 'Duraznos Frescos'}
                      </h3>
                    </div>
                  </div>

                  {/* Acciones & Botón Eliminar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-primary-fixed text-primary px-2.5 py-1 rounded-full text-xs font-bold text-center">
                      {count * 150}g
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(log._id)}
                      title="Eliminar de la cosecha"
                      className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary active:scale-90 transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Métricas Nutricionales Reales: 150g = 63 kcal, 2.3g fibra, 17% Vit C */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-outline-variant/15 text-center bg-surface-container-low/40 rounded-xl px-2">
                  <div>
                    <span className="text-[10px] text-outline block">Calorías</span>
                    <span className="text-xs font-bold text-primary">{count * 63} kcal</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">Fibra</span>
                    <span className="text-xs font-bold text-secondary">{+(count * 2.3).toFixed(1)}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">Vit. C</span>
                    <span className="text-xs font-bold text-tertiary">{Math.min(count * 17, 100)}%</span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default HistoryView;
