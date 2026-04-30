import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import db from '../db';
import Logo from '../components/Logo';

// Registration data no longer includes password (security fix)
interface PendingReg {
    email: string;
    firstName: string; lastName: string; phone: string;
    businessName: string; businessType: string; selectedPlan: string;
}

type Status = 'loading' | 'set_password' | 'creating' | 'linking' | 'done' | 'error';

const STEP_LABELS: Partial<Record<Status, string>> = {
    loading:  'Verifica pagamento...',
    creating: 'Creazione account...',
    linking:  'Attivazione abbonamento...',
    done:     'Tutto pronto!',
};

const makeSlug = (name: string) =>
    `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${Math.random().toString(36).substring(2, 8)}`;

export default function RegisterComplete() {
    const [searchParams]       = useSearchParams();
    const [status, setStatus]  = useState<Status>('loading');
    const [error, setError]    = useState('');
    const [regData, setRegData] = useState<PendingReg | null>(null);
    const navigate = useNavigate();

    // ── Password form state ────────────────────────────────────────────────────
    const [password, setPassword]         = useState('');
    const [confirmPassword, setConfirm]   = useState('');
    const [showPwd, setShowPwd]           = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);
    const [privacyAccepted, setPrivacy]   = useState(false);
    const [pwdLoading, setPwdLoading]     = useState(false);
    const [pwdError, setPwdError]         = useState('');

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) { navigate('/register'); return; }

        const raw = sessionStorage.getItem('pending_registration');
        if (!raw) {
            // Possibly already completed or navigated directly
            db.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) navigate('/gestione?wizard=true');
                else navigate('/register');
            });
            return;
        }

        try {
            const parsed = JSON.parse(raw) as PendingReg;
            setRegData(parsed);
            setStatus('set_password');
        } catch {
            navigate('/register');
        }
    }, []);

    // ── Password validation ────────────────────────────────────────────────────
    const pwdStrong  = password.length >= 8;
    const pwdMatch   = password === confirmPassword && confirmPassword.length > 0;
    const pwdReady   = pwdStrong && pwdMatch && privacyAccepted;

    // ── Submit password → create account ──────────────────────────────────────
    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pwdReady || !regData) return;
        setPwdError('');
        setPwdLoading(true);

        const sessionId = searchParams.get('session_id')!;
        try {
            await completeRegistration(sessionId, regData, password);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Errore imprevisto.';
            // If still on password screen → show inline error; otherwise → show error progress screen
            setPwdError(msg);
            setError(msg);
            setStatus('error');
        } finally {
            setPwdLoading(false);
        }
    };

    // ── Core registration logic ────────────────────────────────────────────────
    const completeRegistration = async (
        sessionId: string,
        data: PendingReg,
        pwd: string
    ) => {
        setStatus('creating');

        const { error: signUpError } = await db.auth.signUp({
            email: data.email,
            password: pwd,
            options: { data: { first_name: data.firstName, last_name: data.lastName, phone: data.phone } },
        });
        if (signUpError && signUpError.message !== 'User already registered') throw signUpError;

        const { error: signInError } = await db.auth.signInWithPassword({ email: data.email, password: pwd });
        if (signInError && signInError.message !== 'Email not confirmed') throw signInError;

        const { data: { user } } = await db.auth.getUser();
        if (!user) throw new Error('Autenticazione fallita. Riprova.');

        await db.from('profiles').upsert({
            id: user.id, role: 'owner',
            first_name: data.firstName, last_name: data.lastName, phone: data.phone,
        });

        // ── Create restaurant (idempotent) ────────────────────────────────
        const { data: existing } = await db
            .from('restaurants').select('id')
            .eq('user_id', user.id).neq('slug', 'demo').maybeSingle();

        let restaurantId: string;
        if (existing?.id) {
            restaurantId = existing.id;
        } else {
            const { data: restaurant, error: resError } = await db
                .from('restaurants')
                .insert({ user_id: user.id, name: data.businessName, slug: makeSlug(data.businessName), type: data.businessType })
                .select('id').single();
            if (resError?.code === '23505') throw new Error('Nome già in uso. Contatta il supporto.');
            if (resError) throw resError;
            restaurantId = restaurant.id;
        }

        await db.rpc('upgrade_to_owner');

        // ── Link Stripe subscription ──────────────────────────────────────
        setStatus('linking');
        const { data: { session: supaSession } } = await db.auth.getSession();
        const res = await fetch('/api/complete-registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(supaSession?.access_token
                    ? { 'Authorization': `Bearer ${supaSession.access_token}` }
                    : {}),
            },
            body: JSON.stringify({ sessionId, restaurantId }),
        });
        if (!res.ok) console.warn('complete-registration API failed — relying on webhook');

        sessionStorage.removeItem('pending_registration');
        setStatus('done');
        setTimeout(() => navigate('/gestione?wizard=true'), 2000);
    };

    // ── Set password screen ───────────────────────────────────────────────────
    if (status === 'set_password' && regData) {
        return (
            <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center p-6">
                <div className="mb-8"><Logo /></div>
                <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex justify-center mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
                            <Lock className="w-7 h-7 text-[#008081]" />
                        </div>
                    </div>
                    <h2 className="text-xl font-black text-gray-900 text-center mb-1">Imposta la tua password</h2>
                    <p className="text-sm text-gray-500 text-center mb-1">
                        Pagamento confermato ✅
                    </p>
                    <p className="text-xs text-gray-400 text-center mb-6">
                        Account: <strong>{regData.email}</strong>
                    </p>

                    <form onSubmit={handleSetPassword} className="space-y-4">
                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Password *</label>
                            <div className="relative">
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    required minLength={8}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    className="w-full p-3 pr-10 bg-[#FBFBFB] rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#008081]/20 outline-none"
                                    placeholder="Minimo 8 caratteri"
                                />
                                <button type="button" onClick={() => setShowPwd(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {password && !pwdStrong && (
                                <p className="text-xs text-amber-500 mt-1">Minimo 8 caratteri richiesti</p>
                            )}
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Conferma password *</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirm(e.target.value)}
                                    autoComplete="new-password"
                                    className="w-full p-3 pr-10 bg-[#FBFBFB] rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#008081]/20 outline-none"
                                    placeholder="Ripeti la password"
                                />
                                <button type="button" onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {confirmPassword && !pwdMatch && (
                                <p className="text-xs text-red-500 mt-1">Le password non coincidono</p>
                            )}
                        </div>

                        {/* Strength indicators */}
                        <div className="flex gap-2">
                            {[
                                { label: '8+ caratteri', ok: pwdStrong },
                                { label: 'Coincidono',   ok: pwdMatch  },
                            ].map(({ label, ok }) => (
                                <span key={label} className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${ok ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {ok ? '✓' : '○'} {label}
                                </span>
                            ))}
                        </div>

                        {/* Privacy */}
                        <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer">
                            <input type="checkbox" required checked={privacyAccepted}
                                onChange={e => setPrivacy(e.target.checked)}
                                className="mt-0.5 w-4 h-4 text-[#008081] rounded flex-shrink-0" />
                            <span>
                                Accetto la{' '}
                                <Link to="/privacy-policy" className="text-[#008081] underline" target="_blank">Privacy Policy</Link>
                                {' '}e i{' '}
                                <Link to="/termini-condizioni" className="text-[#008081] underline" target="_blank">Termini di Servizio</Link>
                            </span>
                        </label>

                        {pwdError && (
                            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2 text-center">{pwdError}</p>
                        )}

                        <button type="submit" disabled={!pwdReady || pwdLoading}
                            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-colors ${!pwdReady || pwdLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#008081] text-white hover:bg-teal-700'}`}>
                            {pwdLoading ? 'Creazione account...' : 'Crea account e accedi →'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ── Progress screen ───────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center p-6">
            <div className="mb-8"><Logo /></div>
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">

                {status !== 'done' && status !== 'error' && (
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-[#008081] animate-spin" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2">Attivazione in corso</h2>
                        <p className="text-sm text-gray-500 font-medium">{STEP_LABELS[status]}</p>
                        <div className="mt-6 space-y-2 text-left">
                            {(['loading', 'creating', 'linking'] as Status[]).map((s, i) => {
                                const ordered: Status[] = ['loading', 'creating', 'linking', 'done'];
                                const currentIdx = ordered.indexOf(status);
                                const stepIdx    = ordered.indexOf(s);
                                const done   = stepIdx < currentIdx;
                                const active = s === status;
                                return (
                                    <div key={s} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${active ? 'bg-teal-50' : ''}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${done ? 'bg-[#008081] text-white' : active ? 'border-2 border-[#008081] text-[#008081]' : 'bg-gray-100 text-gray-400'}`}>
                                            {done ? '✓' : i + 1}
                                        </div>
                                        <span className={`text-xs font-bold ${active ? 'text-[#008081]' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                                            {STEP_LABELS[s]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {status === 'done' && (
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2">Benvenuto su Leomenu!</h2>
                        <p className="text-sm text-gray-500 font-medium">
                            Il tuo account è attivo. I 14 giorni di prova sono iniziati.
                        </p>
                        <p className="text-xs text-gray-400 mt-3">Reindirizzamento in corso...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2">Qualcosa è andato storto</h2>
                        <p className="text-sm text-red-500 font-medium mb-4">{error}</p>
                        <p className="text-xs text-gray-400 mb-6">
                            Il pagamento è già stato elaborato. Contatta il supporto indicando la tua email.
                        </p>
                        <div className="space-y-3">
                            <button onClick={() => window.location.reload()}
                                className="w-full py-3 bg-[#008081] text-white rounded-2xl font-bold text-sm hover:bg-teal-700 transition-colors">
                                Riprova
                            </button>
                            <Link to="/login"
                                className="block w-full py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-colors text-center">
                                Vai al login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
