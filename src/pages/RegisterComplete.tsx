import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import db from '../db';
import Logo from '../components/Logo';

type Status = 'loading' | 'creating' | 'linking' | 'done' | 'error';

const STEPS: Record<Status, string> = {
    loading:  'Verifica pagamento...',
    creating: 'Creazione account...',
    linking:  'Attivazione abbonamento...',
    done:     'Tutto pronto!',
    error:    '',
};

const makeSlug = (name: string) =>
    `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${Math.random().toString(36).substring(2, 8)}`;

export default function RegisterComplete() {
    const [searchParams]  = useSearchParams();
    const [status, setStatus] = useState<Status>('loading');
    const [error, setError]   = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) { navigate('/register'); return; }

        const raw = sessionStorage.getItem('pending_registration');
        if (!raw) {
            // No data — user may have already completed or navigated directly
            // Check if they have an active session already
            db.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) {
                    navigate('/gestione?wizard=true');
                } else {
                    navigate('/register');
                }
            });
            return;
        }

        let regData: {
            email: string; password: string;
            firstName: string; lastName: string; phone: string;
            businessName: string; businessType: string; selectedPlan: string;
        };

        try {
            regData = JSON.parse(raw);
        } catch {
            navigate('/register');
            return;
        }

        completeRegistration(sessionId, regData);
    }, []);

    const completeRegistration = async (
        sessionId: string,
        data: {
            email: string; password: string;
            firstName: string; lastName: string; phone: string;
            businessName: string; businessType: string; selectedPlan: string;
        }
    ) => {
        try {
            // ── Step 1: Create Supabase account ───────────────────────────────
            setStatus('creating');

            const { error: signUpError } = await db.auth.signUp({
                email: data.email,
                password: data.password,
                options: { data: { first_name: data.firstName, last_name: data.lastName, phone: data.phone } },
            });

            if (signUpError && signUpError.message !== 'User already registered') {
                throw signUpError;
            }

            // Sign in (works even if email confirmation is pending in Supabase)
            const { error: signInError } = await db.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });
            if (signInError && signInError.message !== 'Email not confirmed') throw signInError;

            const { data: { user } } = await db.auth.getUser();
            if (!user) throw new Error('Autenticazione fallita. Riprova.');

            // Profile
            await db.from('profiles').upsert({
                id: user.id, role: 'owner',
                first_name: data.firstName,
                last_name: data.lastName,
                phone: data.phone,
            });

            // ── Step 2: Create restaurant ─────────────────────────────────────
            // Check if restaurant already exists (idempotency)
            const { data: existing } = await db
                .from('restaurants')
                .select('id')
                .eq('user_id', user.id)
                .neq('slug', 'demo')
                .maybeSingle();

            let restaurantId: string;

            if (existing?.id) {
                restaurantId = existing.id;
            } else {
                const { data: restaurant, error: resError } = await db
                    .from('restaurants')
                    .insert({
                        user_id: user.id,
                        name: data.businessName,
                        slug: makeSlug(data.businessName),
                        type: data.businessType,
                    })
                    .select('id')
                    .single();

                if (resError?.code === '23505') throw new Error('Nome già in uso. Contatta il supporto.');
                if (resError) throw resError;
                restaurantId = restaurant.id;
            }

            await db.rpc('upgrade_to_owner');

            // ── Step 3: Link Stripe subscription to restaurant ────────────────
            setStatus('linking');

            const res = await fetch('/api/complete-registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, restaurantId }),
            });

            if (!res.ok) {
                // Non-fatal: subscription will be linked by webhook eventually
                console.warn('complete-registration API failed — will rely on webhook');
            }

            // ── Done ─────────────────────────────────────────────────────────
            sessionStorage.removeItem('pending_registration');
            setStatus('done');

            setTimeout(() => navigate('/gestione?wizard=true'), 2000);

        } catch (err: any) {
            console.error('RegisterComplete error:', err);
            setError(err.message || 'Si è verificato un errore. Contatta il supporto.');
            setStatus('error');
        }
    };

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
                        <p className="text-sm text-gray-500 font-medium">{STEPS[status]}</p>

                        {/* Step indicators */}
                        <div className="mt-6 space-y-2 text-left">
                            {(['loading', 'creating', 'linking'] as Status[]).map((s, i) => {
                                const statuses: Status[] = ['loading', 'creating', 'linking', 'done'];
                                const currentIdx = statuses.indexOf(status);
                                const stepIdx    = statuses.indexOf(s);
                                const done       = stepIdx < currentIdx;
                                const active     = s === status;
                                return (
                                    <div key={s} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${active ? 'bg-teal-50' : ''}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${done ? 'bg-[#008081] text-white' : active ? 'border-2 border-[#008081] text-[#008081]' : 'bg-gray-100 text-gray-400'}`}>
                                            {done ? '✓' : i + 1}
                                        </div>
                                        <span className={`text-xs font-bold ${active ? 'text-[#008081]' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                                            {STEPS[s]}
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
                            Il pagamento è già stato elaborato da Stripe. Contatta il supporto indicando la tua email.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 bg-[#008081] text-white rounded-2xl font-bold text-sm hover:bg-teal-700 transition-colors"
                            >
                                Riprova
                            </button>
                            <Link
                                to="/login"
                                className="block w-full py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                Vai al login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
