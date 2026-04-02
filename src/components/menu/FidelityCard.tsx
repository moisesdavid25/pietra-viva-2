import React, { useState, useEffect } from 'react';
import { Gift, ChevronDown, ChevronUp, Mail, AlertCircle } from 'lucide-react';
import db from '../../db';
import { Link, useParams } from 'react-router-dom';

interface Props {
  restaurantId: string;
  restaurantName: string;
}

export default function FidelityCard({ restaurantId, restaurantName }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 1. Check active session
    db.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setIsOpen(true);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setIsOpen(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Inserisci la tua email.'); return; }
    
    setSubmitting(true);
    setError('');
    setMessage('');

    const { error } = await db.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      }
    });

    if (error) {
      if (error.message.includes('rate limit')) {
        setError('Troppi tentativi. Riprova più tardi.');
      } else {
        setError(error.message);
      }
    } else {
      setMessage('Ti abbiamo inviato un Magic Link via email! Controlla la tua posta.');
      setEmail('');
    }
    setSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await db.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError('Errore durante il login con Google.');
    }
  };

  if (loading) return null;

  if (session) {
    return (
      <Link 
        to={`/${slug}/profile`}
        className="w-full flex items-center justify-between gap-4 p-5 rounded-3xl border border-[#008081]/30 bg-gradient-to-r from-white to-[#008081]/5 dark:from-[#1E1E1E] dark:to-[#008081]/10 shadow-premium hover:shadow-xl hover:border-[#008081]/50 transition-all duration-300 transform hover:-translate-y-1 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#008081] shadow-md shadow-[#008081]/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-[#1A1A1A] dark:text-white tracking-tight uppercase leading-tight">Area Fidelity</span>
            <span className="text-sm font-semibold text-[#008081]">Mostra il tuo QR & Stelle &rarr;</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-[#008081]/20 bg-white dark:bg-[#1E1E1E] overflow-hidden shadow-premium transition-all duration-300">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#008081] shadow-md shadow-[#008081]/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex flex-col">
            <span className="font-black text-base text-[#1A1A1A] dark:text-white uppercase tracking-tight leading-tight">Area Fidelity</span>
            <span className="text-xs text-[#008081] font-bold">ACCEDI PER GUADAGNARE STELLE</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {isOpen ? <ChevronUp className="w-4 h-4 text-[#008081]" /> : <ChevronDown className="w-4 h-4 text-[#008081]" />}
        </div>
      </button>

      {/* Collapsible body */}
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-6 border-t border-gray-100 dark:border-gray-800 pt-5 flex flex-col gap-4">
            
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-center">
              Accedi con il tuo account globale per accumulare stelle in tutti i ristoranti affiliati.
            </p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold px-3 py-3 rounded-xl border border-green-100 dark:border-green-900/30">
                ✔️ {message}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#333] text-[#1A1A1A] dark:text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Accedi con Google
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-bold text-gray-400">OPPURE</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#008081] transition-colors" />
                <input
                  type="email"
                  placeholder="La tua email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#252525] text-sm focus:outline-none focus:border-[#008081] focus:ring-1 focus:ring-[#008081] font-medium transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#008081] hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-[#008081]/30 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Ricevi Magic Link'
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}


