import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { playPopSound, playChimeSound } from '../../utils/soundEffects';

const QUICK_USERS = [
  {
    name: 'Lautaro',
    email: 'lautaroleal4@gmail.com',
    avatar: '/avatar/avatar-lau.png'
  },
  {
    name: 'Berni',
    email: 'berniiapass@gmail.com',
    avatar: '/avatar/avatar-ber.png'
  }
];

const LoginView = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('lautaroleal4@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!password) {
      setError('Por favor ingresá tu contraseña.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      playPopSound(1.1);
      const data = await api.login(email.trim(), password);
      playChimeSound();
      onLoginSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor. Verificá tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickUser = (user) => {
    playPopSound(1.2);
    setEmail(user.email);
    setPassword('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-surface-dim/30 flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-[420px] bg-surface rounded-3xl p-6 sm:p-7 border border-outline-variant/30 shadow-2xl space-y-6">
        {/* Cabecera / Marca */}
        <div className="text-center space-y-2">
          <div className="relative w-20 h-20 mx-auto rounded-full bg-surface-container-lowest p-2 shadow-md border border-outline-variant/20 flex items-center justify-center animate-peach-pulse">
            <img
              alt="DurazBer"
              className="w-full h-full object-contain filter drop-shadow-md"
              src="/assets/durazno-entero.png"
            />
          </div>
          <div>
            <div className="flex items-center justify-center">
              <h1 className="text-2xl font-extrabold text-primary tracking-tight font-display">
                DurazBer
              </h1>
            </div>
            <p className="text-xs text-outline font-semibold mt-0.5">
              Iniciá sesión para registrar tu cosecha diaria
            </p>
          </div>
        </div>

        {/* Acceso Rápido de Cuentas */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-outline block text-center uppercase tracking-wider">
            Cuentas Disponibles (1 Click)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_USERS.map((u) => {
              const isSelected = email === u.email;
              return (
                <button
                  type="button"
                  key={u.email}
                  onClick={() => handleSelectQuickUser(u)}
                  className={`flex items-center gap-2 p-2 rounded-2xl border transition-all active:scale-95 text-left ${isSelected
                    ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-xs'
                    : 'bg-surface-container-low border-outline-variant/20 hover:border-primary/40'
                    }`}
                >
                  <img
                    alt={u.name}
                    src={u.avatar}
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/50"
                  />
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold block truncate leading-tight">
                      {u.name}
                    </span>
                    <span className="text-[10px] opacity-75 block truncate">
                      {u.email.split('@')[0]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-primary-fixed text-primary text-xs font-semibold animate-fade-in border border-primary/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface block">Correo Electrónico</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-outline" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl pl-10 pr-3 py-2.5 text-xs text-on-surface focus:outline-primary focus:border-primary transition-all font-medium"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface block">Contraseña</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-outline" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-on-surface focus:outline-primary focus:border-primary transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-outline hover:text-on-surface p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 peach-hero-glow active:scale-98 transition-all disabled:opacity-60 shadow-md"
          >
            {loading ? (
              <span>Entrando al Huerto...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-outline">
          DurazBer — Berni Come Durazno
        </p>
      </div>
    </div>
  );
};

export default LoginView;
