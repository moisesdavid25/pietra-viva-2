import React, { useState, useEffect } from 'react';
import { Shield, Mail, Eye, EyeOff, Check, AlertCircle, KeyRound } from 'lucide-react';
import db from '../../db';

export function AdminSettings() {
  const [email, setEmail] = useState('');

  // Password change
  const [currentPassword, setCurrentPassword]     = useState('');
  const [newPassword, setNewPassword]             = useState('');
  const [confirmPassword, setConfirmPassword]     = useState('');
  const [showCurrent, setShowCurrent]             = useState(false);
  const [showNew, setShowNew]                     = useState(false);
  const [showConfirm, setShowConfirm]             = useState(false);
  const [loading, setLoading]                     = useState(false);
  const [success, setSuccess]                     = useState(false);
  const [error, setError]                         = useState('');

  useEffect(() => {
    db.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8)           score++;
    if (/[A-Z]/.test(pw))         score++;
    if (/[0-9]/.test(pw))         score++;
    if (/[^A-Za-z0-9]/.test(pw))  score++;
    return score;
  };

  const strength = passwordStrength(newPassword);
  const strengthLabel = ['', 'Debole', 'Discreta', 'Buona', 'Ottima'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'][strength];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Le nuove password non corrispondono.');
      return;
    }
    if (newPassword.length < 8) {
      setError('La password deve essere di almeno 8 caratteri.');
      return;
    }

    setLoading(true);
    try {
      // Verify current password by re-authenticating
      const { error: signInErr } = await db.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInErr) {
        setError('Password attuale non corretta.');
        setLoading(false);
        return;
      }

      // Update to new password
      const { error: updateErr } = await db.auth.updateUser({ password: newPassword });
      if (updateErr) throw updateErr;

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message ?? 'Errore durante il cambio password. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-[#1A1A1A]">Impostazioni</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestione account e sicurezza</p>
      </div>

      {/* ── Account info ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Mail size={15} className="text-[#008081]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#008081] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-lg">{email.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-black text-gray-800">{email || '—'}</p>
            <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#008081]/10 text-[#008081]">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* ── Change password ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield size={15} className="text-[#008081]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sicurezza — Cambia password</p>
        </div>

        {/* Success banner */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 mb-5 text-sm font-bold">
            <Check size={16} />
            Password aggiornata con successo.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-5 text-sm font-bold">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              Password attuale
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#008081]/30 focus:border-[#008081] outline-none pr-11 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#008081] transition-colors"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              Nuova password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#008081]/30 focus:border-[#008081] outline-none pr-11 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#008081] transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength meter */}
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className={`text-[10px] font-bold ${['', 'text-red-500', 'text-amber-500', 'text-blue-500', 'text-emerald-600'][strength]}`}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              Conferma nuova password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-medium text-gray-900 focus:ring-2 outline-none pr-11 transition-all ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-300 focus:ring-red-200'
                    : confirmPassword && confirmPassword === newPassword
                    ? 'border-emerald-300 focus:ring-emerald-200'
                    : 'border-gray-200 focus:ring-[#008081]/30 focus:border-[#008081]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#008081] transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {confirmPassword && confirmPassword === newPassword && (
                <Check size={14} className="absolute right-9 top-1/2 -translate-y-1/2 text-emerald-500" />
              )}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
            {[
              { label: 'Almeno 8 caratteri', ok: newPassword.length >= 8 },
              { label: 'Lettera maiuscola', ok: /[A-Z]/.test(newPassword) },
              { label: 'Almeno un numero', ok: /[0-9]/.test(newPassword) },
            ].map(req => (
              <div key={req.label} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${req.ok ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span className={`text-[11px] font-medium transition-colors ${req.ok ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-white bg-[#008081] hover:bg-[#006666] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Aggiornamento...</>
            ) : (
              <><KeyRound size={15} /> Aggiorna password</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
