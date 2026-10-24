import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Clock, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { playPopSound } from '../../utils/soundEffects';

const CUT_PEACH_IMAGE = '/assets/durazno-cortado.png';

const HistoryView = ({ onDeleteLog, refreshTrigger = 0 }) => {
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generar los últimos 7 días para el carrusel
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

  useEffect(() => {
    loadLogs(activeDay.fullDate);
  }, [selectedDayOffset, refreshTrigger]);

  const loadLogs = async (dateStr) => {
    setLoading(true);
    try {
      const data = await api.getHistoryLogs(dateStr);
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    playPopSound(0.8);
    // 1. Eliminar visualmente del historial de inmediato
    setLogs((prev) => prev.filter((l) => l._id !== id));

    // 2. Notificar al componente raíz para que actualice la sección de Cosecha en tiempo real
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
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Bitácora Diaria</span>
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
                key={d.offset}
                onClick={() => setSelectedDayOffset(d.offset)}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[50px] transition-all active:scale-95 border ${isSelected
                  ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-xs'
                  : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-primary/40'
                  }`}
              >
                <span className="text-[10px] font-semibold">{d.dayName}</span>
                <span className="text-base font-extrabold my-0.5">{d.dayNumber}</span>
                {d.isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
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

        {loading ? (
          <div className="p-8 text-center text-xs text-outline font-semibold bg-surface-container-lowest rounded-3xl border border-outline-variant/20">
            Cargando registros reales desde MongoDB...
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
            const timeStr = log.date
              ? new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Hoy';

            return (
              <article
                key={log._id || index}
                className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/25 peach-ambient-card hover:border-primary-container/50 transition-all flex flex-col gap-3"
              >
                {/* Cabecera */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low p-1 flex items-center justify-center shrink-0 border border-outline-variant/20 overflow-hidden">
                      <img
                        alt="Durazno registrado"
                        className="w-full h-full object-contain filter drop-shadow-xs"
                        src={CUT_PEACH_IMAGE}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-outline flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {timeStr}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface mt-0.5">
                        {log.peachesCount || 1} {log.peachesCount === 1 ? 'Durazno Fresco' : 'Duraznos Frescos'}
                      </h3>
                    </div>
                  </div>

                  {/* Acciones & Botón Eliminar */}
                  <div className="flex items-center gap-2">
                    <span className="bg-primary-fixed text-primary px-2.5 py-1 rounded-full text-xs font-bold text-center">
                      {(log.peachesCount || 1) * 150}g
                    </span>
                    <button
                      onClick={() => handleDelete(log._id)}
                      title="Eliminar de la cosecha"
                      className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary active:scale-90 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Métricas Nutricionales Reales: 150g = 63 kcal, 2.3g fibra, 17% Vit C */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-outline-variant/15 text-center bg-surface-container-low/40 rounded-xl px-2">
                  <div>
                    <span className="text-[10px] text-outline block">Calorías</span>
                    <span className="text-xs font-bold text-primary">{(log.peachesCount || 1) * 63} kcal</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">Fibra</span>
                    <span className="text-xs font-bold text-secondary">{+((log.peachesCount || 1) * 2.3).toFixed(1)}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">Vit. C</span>
                    <span className="text-xs font-bold text-tertiary">{Math.min((log.peachesCount || 1) * 17, 100)}%</span>
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
