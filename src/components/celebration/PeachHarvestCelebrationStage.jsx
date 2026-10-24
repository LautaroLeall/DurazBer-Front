import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle2, Flame, Sprout, Droplets, Zap, Sparkles, X } from 'lucide-react';
import { playChimeSound, playPopSound } from '../../utils/soundEffects';

/**
 * Notificación Festiva de Alta Claridad y Contraste (Simple, Luminosa y sin Pantallas Oscuras)
 * - Respeta 100% el fondo claro de la aplicación.
 * - Tipografía nítida con contraste garantizado (+7:1).
 * - Ráfaga de confeti botánico y fanfarria al abrir.
 * - Resumen conciso de aporte del día y racha.
 */
const PeachHarvestCelebrationStage = ({
  isOpen = false,
  onClose,
  userName = 'Lautaro',
  dailyGoal = 4
}) => {
  useEffect(() => {
    if (!isOpen) return;

    playChimeSound();

    // Ráfaga limpia de confeti de durazno
    try {
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ac332a', '#ff6f61', '#1a6d0e', '#ffa07a', '#ffb4aa']
      });
    } catch { }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalKcal = dailyGoal * 63;
  const totalFiber = +(dailyGoal * 2.3).toFixed(1);
  const totalVitC = Math.min(dailyGoal * 17, 100);

  const handleDismiss = () => {
    playPopSound(0.9);
    onClose();
  };

  return (
    <aside
      aria-label="Celebración de Meta Cumplida"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-[390px] bg-surface-container-lowest rounded-3xl p-6 border-2 border-primary-container/40 shadow-2xl space-y-4 text-on-surface">
        {/* Botón cerrar sutil */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabecera Luminosa de Alto Contraste */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-secondary ring-4 ring-secondary/10 shadow-sm animate-bounce">
            <Trophy className="w-7 h-7 text-secondary" />
          </div>

          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-secondary bg-secondary-container px-3 py-0.5 rounded-full inline-block mb-1">
              Meta Diaria Conquistada
            </span>
            <h2 className="text-xl font-extrabold text-on-surface font-display leading-tight">
              ¡Felicitaciones, {userName}!
            </h2>
            <p className="text-xs text-on-surface-variant font-medium mt-1">
              Completaste tu objetivo de <strong className="text-primary font-bold">{dailyGoal} duraznos</strong> de hoy.
            </p>
          </div>
        </div>

        {/* Bento de Nutrientes Reales con Letras Claras y Fondo Luminoso */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-center">
          <div className="p-1.5">
            <div className="flex items-center justify-center gap-1 text-primary font-bold text-xs mb-0.5">
              <Flame className="w-3.5 h-3.5 fill-primary" />
              <span>{totalKcal}</span>
            </div>
            <span className="text-[10px] text-outline font-semibold block uppercase">Calorías</span>
          </div>

          <div className="p-1.5 border-x border-outline-variant/30">
            <div className="flex items-center justify-center gap-1 text-secondary font-bold text-xs mb-0.5">
              <Sprout className="w-3.5 h-3.5" />
              <span>{totalFiber}g</span>
            </div>
            <span className="text-[10px] text-outline font-semibold block uppercase">Fibra</span>
          </div>

          <div className="p-1.5">
            <div className="flex items-center justify-center gap-1 text-tertiary font-bold text-xs mb-0.5">
              <Zap className="w-3.5 h-3.5" />
              <span>{totalVitC}%</span>
            </div>
            <span className="text-[10px] text-outline font-semibold block uppercase">Vit. C</span>
          </div>
        </div>

        {/* Racha Activa Asegurada */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary-fixed/40 border border-primary/20 text-on-surface">
          <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center text-on-primary shrink-0">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <div className="text-left flex-1">
            <span className="text-xs font-bold text-on-surface block leading-tight">
              Racha asegurada
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">
              Sumaste este día a tu cosecha consecutiva
            </span>
          </div>
        </div>

        {/* Botón de Acción Principal Claro y Nítido */}
        <button
          onClick={handleDismiss}
          className="w-full py-3 rounded-2xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-primary/95 active:scale-98 transition-all"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Continuar en Cosecha</span>
        </button>
      </div>
    </aside>
  );
};

export default PeachHarvestCelebrationStage;
