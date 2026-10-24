import React from 'react';
import { Flame, Sprout, Zap, Droplets } from 'lucide-react';

const BentoMacros = ({ nutrients = { kcal: 0, fiberGrams: 0, vitCPercent: 0, waterPercent: 89 }, totalPeaches = 0 }) => {
  // Valores calculados basados en 150g netos comestibles por durazno (63 kcal, 2.3g fibra, 17% Vit C, 89% agua)
  const kcal = nutrients.kcal ?? (totalPeaches * 63);
  const fiber = nutrients.fiberGrams ?? +(totalPeaches * 2.3).toFixed(1);
  const vitC = nutrients.vitCPercent ?? Math.min(totalPeaches * 17, 100);
  const water = nutrients.waterPercent ?? 89;

  return (
    <div className="w-full grid grid-cols-4 gap-2 pt-2">
      {/* Calorías */}
      <div className="bg-surface-container-low/80 rounded-2xl p-2.5 text-center flex flex-col items-center border border-outline-variant/20 hover:border-primary-container/40 transition-colors">
        <Flame className="w-4 h-4 text-primary mb-1 fill-primary/20" />
        <span className="text-sm font-black text-on-surface leading-tight font-display">
          {kcal}
        </span>
        <span className="text-[10px] text-outline font-bold">kcal</span>
      </div>

      {/* Fibra */}
      <div className="bg-surface-container-low/80 rounded-2xl p-2.5 text-center flex flex-col items-center border border-outline-variant/20 hover:border-secondary/40 transition-colors">
        <Sprout className="w-4 h-4 text-secondary mb-1" />
        <span className="text-sm font-black text-on-surface leading-tight font-display">
          {fiber}g
        </span>
        <span className="text-[10px] text-outline font-bold">fibra</span>
      </div>

      {/* Vitamina C */}
      <div className="bg-surface-container-low/80 rounded-2xl p-2.5 text-center flex flex-col items-center border border-outline-variant/20 hover:border-tertiary/40 transition-colors">
        <Zap className="w-4 h-4 text-tertiary mb-1 fill-tertiary/20" />
        <span className="text-sm font-black text-on-surface leading-tight font-display">
          {vitC}%
        </span>
        <span className="text-[10px] text-outline font-bold">Vit. C</span>
      </div>

      {/* Agua */}
      <div className="bg-surface-container-low/80 rounded-2xl p-2.5 text-center flex flex-col items-center border border-outline-variant/20 hover:border-primary-container/40 transition-colors">
        <Droplets className="w-4 h-4 text-primary-container mb-1 fill-primary-container/20" />
        <span className="text-sm font-black text-on-surface leading-tight font-display">
          {water}%
        </span>
        <span className="text-[10px] text-outline font-bold">Agua</span>
      </div>
    </div>
  );
};

export default BentoMacros;
