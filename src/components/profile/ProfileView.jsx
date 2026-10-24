import React, { useState } from 'react';
import { User, Plus, Minus, Check, LogOut, Flame } from 'lucide-react';
import { playPopSound, playChimeSound } from '../../utils/soundEffects';

const ProfileView = ({ user, dailyGoal = 4, streak = 0, onUpdateGoal, onLogout }) => {
  const [goal, setGoal] = useState(dailyGoal);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdateGoal(goal);
    setSaving(false);
    setSavedMsg(true);
    playChimeSound();
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Configuración</span>
        <h1 className="text-xl font-bold text-on-surface font-display">Perfil del Usuario</h1>
      </div>

      {/* Tarjeta de Usuario */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/25 peach-ambient-card flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary-container p-0.5 bg-surface-container-lowest shadow-md shrink-0">
          <img
            alt={user?.name || 'Usuario'}
            className="w-full h-full object-cover rounded-full"
            src={user?.avatar || '/avatar/avatar-lau.png'}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-bold text-on-surface truncate">
              {user?.name || 'Usuario'}
            </h2>
          </div>
          <p className="text-xs text-outline font-medium truncate">
            {user?.email}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-bold mt-1">
            <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'text-primary fill-primary' : 'text-outline/50'}`} />
            <span className={streak > 0 ? 'text-primary' : 'text-outline'}>
              {streak > 0 ? `Racha activa: ${streak} ${streak === 1 ? 'día' : 'días'}` : 'Sin racha activa hoy (comé 1 durazno para iniciar)'}
            </span>
          </div>
        </div>
      </section>

      {/* Ajuste de Meta Diaria */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/25 peach-ambient-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Meta de Consumo Diario</h3>
            <p className="text-[11px] text-outline">Cantidad de duraznos que querés comer al día</p>
          </div>
          <span className="text-2xl font-extrabold text-primary font-display">{goal}</span>
        </div>

        <div className="flex items-center justify-center gap-4 py-2">
          <button
            onClick={() => {
              setGoal((g) => Math.max(1, g - 1));
              playPopSound(0.8);
            }}
            className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary active:scale-90 transition-all border border-outline-variant/20 shadow-xs"
          >
            <Minus className="w-5 h-5" />
          </button>

          <span className="text-base font-bold text-on-surface px-4">
            {goal} {goal === 1 ? 'durazno' : 'duraznos'} / día
          </span>

          <button
            onClick={() => {
              setGoal((g) => Math.min(15, g + 1));
              playPopSound(1.2);
            }}
            className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center active:scale-90 transition-all shadow-xs"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
        >
          <Check className="w-4 h-4" />
          <span>{saving ? 'Guardando...' : 'Guardar Nueva Meta'}</span>
        </button>

        {savedMsg && (
          <p className="text-center text-xs font-bold text-secondary animate-fade-in">
            ¡Meta actualizada en la base de datos!
          </p>
        )}
      </section>

      {/* Cerrar Sesión */}
      <section className="pt-2">
        <button
          onClick={onLogout}
          className="w-full py-3.5 px-4 rounded-2xl bg-surface-container-lowest border border-primary/30 text-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary-fixed/30 active:scale-95 transition-all shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </section>

      {/* Marca */}
      <div className="text-center pt-2 pb-4 text-xs text-outline space-y-0.5">
        <p className="font-bold text-on-surface-variant">DurazBer — Berni Come Durazno</p>
      </div>
    </div>
  );
};

export default ProfileView;
