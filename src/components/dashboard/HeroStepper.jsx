import React from 'react';
import { Plus, Minus, CheckCircle, Sparkles, Leaf } from 'lucide-react';
import Peach3DCanvas from '../3d/Peach3DCanvas';
import BentoMacros from './BentoMacros';

const HeroStepper = ({
  totalPeaches = 0,
  dailyGoal = 4,
  progressPercent = 0,
  isGoalReached = false,
  nutrients,
  onIncrement,
  onDecrement,
  onPeachReady
}) => {
  // Circunferencia del anillo SVG (radio 44 => perímetro ~ 276.46)
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (Math.min(progressPercent, 100) / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* 1. Visor 3D Interactivo de Estudio */}
      <section className="relative bg-gradient-to-b from-surface-container-low to-surface-container-lowest rounded-3xl p-4 border border-outline-variant/25 peach-ambient-card overflow-hidden">
        {/* Badges superiores informativos */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-outline-variant/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-[10px] font-bold text-on-surface">
              Visor 3D 360° Real
            </span>
          </div>

          <span className="text-[10px] px-2.5 py-1 bg-primary-fixed text-on-primary-fixed rounded-full font-bold shadow-xs">
            100% Durazno Botánico
          </span>
        </div>

        {/* Canvas 3D Fotorrealista */}
        <Peach3DCanvas onReady={onPeachReady} />

        {/* Footer del visor 3D en un solo renglón */}
        <div className="flex items-center justify-between px-2 pt-3 pb-1 border-t border-outline-variant/15 text-on-surface-variant text-xs">
          <div className="flex items-center gap-1.5 text-secondary font-bold whitespace-nowrap shrink-0">
            <Leaf className="w-3.5 h-3.5 text-secondary" />
            <span>Fruta Orgánica</span>
          </div>
          <span className="text-[11px] text-outline font-semibold whitespace-nowrap text-right">~150g · 63 kcal</span>
        </div>
      </section>

      {/* 2. Sección del Contador Central & Anillo SVG */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/25 peach-ambient-card flex flex-col items-center relative overflow-hidden">
        {/* Encabezado de Meta */}
        <div className="w-full flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-on-surface tracking-wide uppercase">Meta del Día</span>
          </div>

          <div
            className={`flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full transition-colors ${isGoalReached
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'bg-secondary-fixed/50 text-secondary'
              }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{progressPercent}% Completado</span>
          </div>
        </div>

        {/* Anillo Circular de Progreso */}
        <div className="relative w-48 h-48 my-1 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Anillo de Fondo */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              stroke="#f3ede8"
              strokeWidth="6"
            />
            {/* Anillo Activo Gradiente */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              stroke="url(#peachGradient)"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="peachGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFA07A" />
                <stop offset="100%" stopColor="#FF5722" />
              </linearGradient>
            </defs>
          </svg>

          {/* Durazno Central Estilizado */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden p-2 bg-surface-bright shadow-inner flex items-center justify-center select-none">
            <img
              alt="Durazno fresco entero"
              className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
              src="/assets/durazno-entero.png"
            />
            <div className="absolute bottom-1 bg-surface-container-lowest/95 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-outline-variant/30 shadow-xs">
              <span className="text-[10px] font-bold text-primary">Meta: {dailyGoal}</span>
            </div>
          </div>
        </div>

        {/* Contador Gigante */}
        <div className="text-center my-2">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-5xl font-extrabold text-primary leading-none tracking-tight font-display">
              {totalPeaches}
            </span>
            <span className="text-2xl font-bold text-outline">/ {dailyGoal}</span>
          </div>
          <p className="text-xs font-medium text-on-surface-variant mt-1">
            Duraznos consumidos hoy
          </p>
        </div>

        {/* Botonera Táctil (+1, +2, -1) */}
        <div className="w-full grid grid-cols-4 gap-2 mt-3">
          {/* Restar 1 */}
          <button
            onClick={onDecrement}
            disabled={totalPeaches <= 0}
            aria-label="Restar 1 durazno"
            className="h-14 rounded-2xl bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center border border-outline-variant/25 active:scale-90 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs"
          >
            <Minus className="w-5 h-5" />
          </button>

          {/* Sumar 1 Principal */}
          <button
            onClick={() => onIncrement(1)}
            className="col-span-2 h-14 rounded-2xl bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 peach-hero-glow active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>+ 1 Durazno</span>
          </button>

          {/* Acceso Rápido +2 */}
          <button
            onClick={() => onIncrement(2)}
            className="h-14 rounded-2xl bg-surface-container-low hover:bg-surface-container text-tertiary font-extrabold text-sm flex items-center justify-center border border-outline-variant/25 active:scale-90 transition-all shadow-xs"
          >
            <span>+2</span>
          </button>
        </div>

        {/* Bento de Macros Nutricionales */}
        <div className="w-full mt-4 pt-3 border-t border-outline-variant/20">
          <BentoMacros nutrients={nutrients} totalPeaches={totalPeaches} />
        </div>
      </section>
    </div>
  );
};

export default HeroStepper;
