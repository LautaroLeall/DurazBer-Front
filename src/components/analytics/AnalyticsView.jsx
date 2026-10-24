import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const getFallbackMonths = () => {
  const now = new Date();
  const list = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push({
      monthIndex: d.getMonth(),
      monthName: MONTH_NAMES[d.getMonth()],
      year: d.getFullYear(),
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      totalPeaches: 0,
      totalWeightKg: 0,
      entriesCount: 0,
      isCurrentMonth: i === 0
    });
  }
  return list;
};

const AnalyticsView = ({ refreshTrigger = 0 }) => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [comparativeData, setComparativeData] = useState(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(2); // Selecciona el mes actual por defecto
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [refreshTrigger]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [weekly, comp] = await Promise.all([
        api.getWeeklyStats(),
        api.getThreeMonthComparative()
      ]);
      setWeeklyData(weekly);
      setComparativeData(comp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const months = comparativeData?.months?.length === 3 ? comparativeData.months : getFallbackMonths();
  const activeMonth = months[selectedMonthIndex] || months[months.length - 1];

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Header de Analítica */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Métricas Reales</span>
          <h1 className="text-xl font-bold text-on-surface font-display">Analítica de Consumo</h1>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-xs">
          <BarChart3 className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Rendimiento Semanal (Últimos 7 Días) */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/25 peach-ambient-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface">Rendimiento Semanal</h2>
          </div>
          <span className="text-xs font-bold text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full">
            Prom. {weeklyData?.avgDaily || 0} / día
          </span>
        </div>

        {/* Gráfico de Barras Semanales */}
        <div className="pt-2">
          <div className="grid grid-cols-7 gap-1.5 items-end h-32 pb-2 border-b border-outline-variant/20">
            {weeklyData?.days?.map((d, i) => {
              const maxCount = Math.max(6, ...(weeklyData?.days?.map((item) => item.count) || [6]));
              const heightPercent = maxCount > 0 ? Math.min(Math.round((d.count / maxCount) * 100), 100) : 0;

              return (
                <div key={i} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-bold text-on-surface mb-1 group-hover:scale-110 transition-transform">
                    {d.count}
                  </span>
                  <div className="w-full bg-surface-container rounded-t-lg overflow-hidden h-20 flex items-end">
                    <div
                      style={{ height: `${Math.max(heightPercent, d.count > 0 ? 12 : 4)}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${d.isToday
                          ? 'bg-gradient-to-t from-primary to-primary-container shadow-xs'
                          : d.metGoal
                            ? 'bg-secondary'
                            : d.count > 0
                              ? 'bg-primary-fixed-dim'
                              : 'bg-surface-container-high'
                        }`}
                    />
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 ${d.isToday ? 'text-primary' : 'text-outline'}`}>
                    {d.dayOfWeek}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-outline pt-2">
            <span>Objetivo diario: {weeklyData?.dailyGoal || 4} duraznos</span>
            <span className="font-bold text-primary">Total semana: {weeklyData?.totalWeekly || 0}</span>
          </div>
        </div>
      </section>

      {/* 3. Comparativa Trimestral (Siempre Mes Actual y 2 Meses Anteriores) */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/25 peach-ambient-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-tertiary" />
            <h2 className="text-sm font-bold text-on-surface">Comparativa Trimestral</h2>
          </div>
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
            3 Meses
          </span>
        </div>

        {/* Selector de los 3 Meses */}
        <div className="flex p-1 bg-surface-container-low rounded-2xl gap-1">
          {months.map((m, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedMonthIndex(idx)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${selectedMonthIndex === idx
                  ? 'bg-surface-container-lowest text-primary shadow-xs border border-outline-variant/30'
                  : 'text-on-surface-variant hover:text-on-surface'
                }`}
            >
              {m.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Resumen del Mes Seleccionado */}
        {activeMonth && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-surface-container-low/80 p-2.5 rounded-2xl border border-outline-variant/20">
                <span className="text-[10px] font-semibold text-outline block">Total Consumido</span>
                <span className="text-xl font-extrabold text-primary font-display">{activeMonth.totalPeaches}</span>
                <span className="text-[10px] text-outline block">duraznos</span>
              </div>

              <div className="bg-surface-container-low/80 p-2.5 rounded-2xl border border-outline-variant/20">
                <span className="text-[10px] font-semibold text-outline block">Masa Frutal</span>
                <span className="text-xl font-extrabold text-secondary font-display">{activeMonth.totalWeightKg}</span>
                <span className="text-[10px] text-outline block">Kilogramos</span>
              </div>

              <div className="bg-surface-container-low/80 p-2.5 rounded-2xl border border-outline-variant/20">
                <span className="text-[10px] font-semibold text-outline block">Tomas Registradas</span>
                <span className="text-xl font-extrabold text-tertiary font-display">{activeMonth.entriesCount}</span>
                <span className="text-[10px] text-outline block">en bitácora</span>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low/60 rounded-2xl border border-outline-variant/20 flex items-center justify-between text-xs">
              <span className="font-semibold text-on-surface">Estado del mes:</span>
              <span className="font-bold text-primary">
                {activeMonth.isCurrentMonth ? 'Mes en curso activo' : 'Mes archivado'}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AnalyticsView;
