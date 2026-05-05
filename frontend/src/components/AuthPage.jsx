import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock, User, Building2, Clock, Briefcase, ArrowRight, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';

const SEDES = ['Principal', 'Sor Maria Anastasia', 'Rigoberto Orozco', 'Lastenia Duran Vernaza'];
const JORNADAS = ['Mañana', 'Tarde', 'Completa'];
const ROLES = [
  { value: 'docente', label: 'Docente', icon: '👨‍🏫', desc: 'Crear y gestionar mis casos' },
  { value: 'coordinador', label: 'Coordinador/a', icon: '📋', desc: 'Supervisar docentes y sedes' },
  { value: 'psicoorientador', label: 'Psicoorientador/a', icon: '🧠', desc: 'Orientación y remisiones' },
  { value: 'directivo', label: 'Directivo (Rector/a)', icon: '🏛️', desc: 'Visión global institucional' },
];

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  // Register fields
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [rol, setRol] = useState('docente');
  const [sede, setSede] = useState('');
  const [jornada, setJornada] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (err) {
      setError(err.message === 'Invalid login credentials' 
        ? 'Correo o contraseña incorrectos' 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (regPassword !== regConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (regPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!nombre.trim() || !sede || !jornada) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(regEmail, regPassword, {
        nombre: nombre.trim(),
        cargo: cargo.trim() || ROLES.find(r => r.value === rol)?.label || rol,
        rol,
        sede,
        jornada
      });
      if (error) throw error;
      setSuccess('¡Cuenta creada exitosamente! Iniciando sesión...');
    } catch (err) {
      setError(err.message.includes('already registered') 
        ? 'Este correo ya está registrado' 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSuccess('Se envió un enlace de recuperación a tu correo.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-white/10 backdrop-blur-md flex items-center justify-center p-1">
            <img src="/logo.png" alt="Escudo" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">ConciencIA</h1>
          <p className="text-blue-300/60 text-sm font-medium mt-1 uppercase tracking-widest">Due Process Advisor</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Tabs */}
          {mode !== 'forgot' && (
            <div className="flex border-b border-white/10">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${
                  mode === 'login' 
                    ? 'text-white border-b-2 border-blue-400 bg-white/5' 
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${
                  mode === 'register' 
                    ? 'text-white border-b-2 border-emerald-400 bg-white/5' 
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Registrarse
              </button>
            </div>
          )}

          <div className="p-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl p-3 mb-4 flex items-center gap-2">
                <Shield size={16} className="shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-xl p-3 mb-4">
                ✅ {success}
              </div>
            )}

            {/* LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-300/70 mb-1.5 ml-1 uppercase tracking-wider">Correo</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="docente@colegio.edu.co"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-300/70 mb-1.5 ml-1 uppercase tracking-wider">Contraseña</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-white/50 cursor-pointer">
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30" />
                    Recordarme
                  </label>
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className="text-blue-400/70 hover:text-blue-300 transition-colors font-medium">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={18} /> Entrar</>}
                </button>
              </form>
            )}

            {/* REGISTER */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-300/70 mb-1 ml-1 uppercase tracking-wider">Nombre completo</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required
                      placeholder="María Fernanda López"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-300/70 mb-1 ml-1 uppercase tracking-wider">Correo</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required
                      placeholder="correo@colegio.edu.co"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-300/70 mb-1 ml-1 uppercase tracking-wider">Contraseña</label>
                    <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required
                      placeholder="Min. 6 caracteres"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-300/70 mb-1 ml-1 uppercase tracking-wider">Confirmar</label>
                    <input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} required
                      placeholder="Repetir contraseña"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
                  </div>
                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-300/70 mb-2 ml-1 uppercase tracking-wider">Rol Institucional</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => (
                      <button key={r.value} type="button" onClick={() => { setRol(r.value); setCargo(r.label); }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          rol === r.value 
                            ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20' 
                            : 'bg-white/3 border-white/10 hover:bg-white/5'
                        }`}>
                        <div className="text-lg leading-none">{r.icon}</div>
                        <div className={`text-xs font-bold mt-1 ${rol === r.value ? 'text-emerald-300' : 'text-white/70'}`}>{r.label}</div>
                        <div className="text-[10px] text-white/30 mt-0.5 leading-tight">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-300/70 mb-1 ml-1 uppercase tracking-wider">Sede</label>
                    <div className="relative">
                      <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <select value={sede} onChange={e => setSede(e.target.value)} required
                        className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none">
                        <option value="" className="bg-slate-900">Seleccione...</option>
                        {SEDES.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-300/70 mb-1 ml-1 uppercase tracking-wider">Jornada</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <select value={jornada} onChange={e => setJornada(e.target.value)} required
                        className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none">
                        <option value="" className="bg-slate-900">Seleccione...</option>
                        {JORNADAS.map(j => <option key={j} value={j} className="bg-slate-900">{j}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-wider mt-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><Shield size={18} /> Crear cuenta</>}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="text-center mb-2">
                  <KeyRound size={40} className="mx-auto text-amber-400/60 mb-2" />
                  <h3 className="text-white font-bold">Recuperar Contraseña</h3>
                  <p className="text-white/40 text-xs mt-1">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
                </div>
                <div>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="tu@correo.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar enlace'}
                </button>
                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="w-full text-center text-sm text-white/40 hover:text-white/70 transition-colors">
                  ← Volver al login
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          I.E. Sor María Juliana · ConciencIA v2.0
        </p>
      </div>
    </div>
  );
}
