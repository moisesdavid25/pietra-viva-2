import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import db from '../db';
import { useFidelityAuth } from '../hooks/useFidelityAuth';
import { useFidelityData } from '../hooks/useFidelityData';
import { useFidelitySearch } from '../hooks/useFidelitySearch';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'home' | 'premi' | 'scopri' | 'profilo';
type SubScreen = 'dati' | 'password' | 'notifiche' | 'lingua' | 'idglobale' | 'gusto' | 'dieta' | 'supporto' | 'condividi' | 'privacy' | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLevel(points: number) {
    if (points >= 2500) return {
        label: 'Reserve', emoji: '💎', key: 'reserve',
        pillClass: 'bg-violet-100 text-violet-700 border border-violet-200',
        darkClass: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
        barColor: '#7c3aed', next: null, nextLabel: null,
    };
    if (points >= 500) return {
        label: 'Gold', emoji: '⭐', key: 'gold',
        pillClass: 'bg-amber-100 text-amber-700 border border-amber-200',
        darkClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        barColor: '#f0a500', next: 2500, nextLabel: 'Reserve',
    };
    return {
        label: 'Green', emoji: '🌿', key: 'green',
        pillClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        darkClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        barColor: '#22c47a', next: 500, nextLabel: 'Gold',
    };
}

const OB_BG = [
    'linear-gradient(160deg,#005f5f 0%,#008080 50%,#00a8a8 100%)',
    'linear-gradient(160deg,#004f4f 0%,#007070 100%)',
    'linear-gradient(160deg,#1a0f3a 0%,#2d1f5e 100%)',
    'linear-gradient(160deg,#1f1218 0%,#3d1f2d 100%)',
    'linear-gradient(160deg,#0f1f20 0%,#1a3535 100%)',
];

const TASTE_OPTIONS = [
    { icon: '🍕', label: 'Pizza' }, { icon: '🍔', label: 'Burger' },
    { icon: '☕', label: 'Caffè' }, { icon: '🍝', label: 'Pasta' },
    { icon: '🍷', label: 'Vino' }, { icon: '🥗', label: 'Insalate' },
];

const TASTE_OPTIONS_FULL = [
    { icon: '🍕', label: 'Pizza' }, { icon: '🍔', label: 'Burger' },
    { icon: '☕', label: 'Caffè' }, { icon: '🍝', label: 'Pasta' },
    { icon: '🍷', label: 'Vino' }, { icon: '🥗', label: 'Insalate' },
    { icon: '🍣', label: 'Sushi' }, { icon: '🍸', label: 'Cocktail' },
    { icon: '🎂', label: 'Dessert' }, { icon: '🥩', label: 'Carne' },
];

const DIET_OPTIONS = [
    { icon: '🌱', label: 'Vegetariano' }, { icon: '🌿', label: 'Vegano' },
    { icon: '🌾', label: 'Senza glutine' }, { icon: '🥛', label: 'Senza lattosio' },
    { icon: '🥜', label: 'Senza arachidi' }, { icon: '🐟', label: 'Senza pesce' },
    { icon: '🥩', label: 'Halal' }, { icon: '✡️', label: 'Kosher' },
];

const NOTIF_PREMI = [
    'Premio disponibile da riscattare', 'Stelle accumulate',
    'Premio in scadenza', 'Cambio di livello',
];
const NOTIF_OFFERTE = [
    'Offerte personalizzate', 'Nuovi ristoranti vicini', 'Novità LeoMenu',
];
const NOTIF_EMAIL = ['Newsletter mensile', 'Riepilogo stelle mensile'];

// ── Main Component ────────────────────────────────────────────────────────────

export default function Fidelity() {
    const location = useLocation();

    const { user, firstName, setFirstName, lastName, setLastName, isSavingProfile, isAuthLoading, handleLogout, handleSaveFullProfile, handleDeleteCustomerAccount } = useFidelityAuth();
    const { myRestaurants, isDataLoading, handleRemoveAffiliation } = useFidelityData(user?.id);
    const { globalSearch, setGlobalSearch, globalSearchResults, isSearchingGlobal } = useFidelitySearch();

    // ── Core UI state
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [activeSubScreen, setActiveSubScreen] = useState<SubScreen>(null);
    const [toast, setToast] = useState<string | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Onboarding
    const [showOnboarding, setShowOnboarding] = useState(() =>
        !localStorage.getItem('fidelity_welcome_seen') || location.search.includes('wizard=true')
    );
    const [obSlide, setObSlide] = useState(0);
    const [tasteProfile, setTasteProfile] = useState<string[]>([]);

    // ── QR flow
    const [showQRSelector, setShowQRSelector] = useState(false);
    const [qrRestaurant, setQrRestaurant] = useState<any>(null);
    const [showQRModal, setShowQRModal] = useState(false);

    // ── Premi tab
    const [premiFilter, setPremiFilter] = useState('Tutti');

    // ── Profilo fields
    const [telefono, setTelefono] = useState('');
    const [dataNascita, setDataNascita] = useState('');
    const [sesso, setSesso] = useState('non_specificato');
    const [lingua, setLingua] = useState('it');

    // ── Notifications
    const [notifMaster, setNotifMaster] = useState(true);
    const [notifPremi, setNotifPremi] = useState([true, true, true, true]);
    const [notifOfferte, setNotifOfferte] = useState([true, false, false]);
    const [notifEmail, setNotifEmail] = useState([false, true]);

    // ── Password
    const [pwCurrent, setPwCurrent] = useState('');
    const [pwNew, setPwNew] = useState('');
    const [pwConfirm, setPwConfirm] = useState('');
    const [pwShowCurrent, setPwShowCurrent] = useState(false);
    const [pwShowNew, setPwShowNew] = useState(false);
    const [pwShowConfirm, setPwShowConfirm] = useState(false);

    // ── Gusto / Dieta (profile sub-screen)
    const [subTasteProfile, setSubTasteProfile] = useState<string[]>([]);
    const [dietProfile, setDietProfile] = useState<string[]>([]);

    // ── Modals
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [removeModal, setRemoveModal] = useState<{ open: boolean; rid: string; rname: string }>({ open: false, rid: '', rname: '' });
    const [addModal, setAddModal] = useState<{ open: boolean; rid: string; rname: string; logo: string }>({ open: false, rid: '', rname: '', logo: '' });
    const [addingRestaurant, setAddingRestaurant] = useState(false);

    // ── Avatar
    const [avatarSrc, setAvatarSrc] = useState('');
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropZoom, setCropZoom] = useState(120);
    const [cropOffsetY, setCropOffsetY] = useState(0);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // ── Scopri: all restaurants
    const [allRestaurants, setAllRestaurants] = useState<any[]>([]);

    // ── Computed
    const totalStelle = myRestaurants.reduce((s, r) => s + r.points, 0);
    const globalLevel = getLevel(totalStelle);
    const allRewards = myRestaurants.flatMap(r => r.rewards.map(rw => ({ ...rw, restaurant: r })));
    const availableRewards = allRewards.filter(rw => rw.restaurant.points >= rw.points_required);

    const globalId = (() => {
        const initials = `${(firstName || 'U').charAt(0)}${(lastName || 'S').charAt(0)}`.toUpperCase();
        const num = user ? parseInt(user.id.replace(/[^0-9]/g, '').substring(0, 4) || '1234') % 9000 + 1000 : 4829;
        return `${initials}-${num}-LEOMENU`;
    })();

    const referralCode = `${(firstName || 'USER').toUpperCase().substring(0, 5)}${Math.floor((user?.id ? parseInt(user.id.replace(/[^0-9]/g, '').substring(0, 2) || '50') : 50))}`;

    // ── Effects
    useEffect(() => {
        setSubTasteProfile(tasteProfile);
    }, [tasteProfile]);

    // Load customer phone and scopri restaurants
    useEffect(() => {
        if (!isAuthLoading && !isDataLoading && user) {
            // Load phone from customers table
            db.from('customers').select('whatsapp').eq('auth_user_id', user.id).limit(1).maybeSingle()
                .then(({ data }) => { if (data?.whatsapp) setTelefono(data.whatsapp); });

            // Load all restaurants with logo for Scopri
            db.from('restaurants').select('id,name,slug,citta')
                .neq('slug', 'demo').limit(20)
                .then(async ({ data: rests }) => {
                    if (!rests) return;
                    const myIds = new Set(myRestaurants.map(r => r.id));
                    const others = rests.filter((r: any) => !myIds.has(r.id));
                    if (others.length === 0) return;
                    // Load logos + cover images
                    const { data: imgSettings } = await db.from('settings')
                        .select('restaurant_id,key,value').in('key', ['logo_url', 'cover_image_url'])
                        .in('restaurant_id', others.map((r: any) => r.id));
                    const logoMap: Record<string, string> = {};
                    const coverMap: Record<string, string> = {};
                    imgSettings?.forEach((s: any) => {
                        if (s.key === 'logo_url') logoMap[s.restaurant_id] = s.value;
                        if (s.key === 'cover_image_url') coverMap[s.restaurant_id] = s.value;
                    });
                    setAllRestaurants(others.map((r: any) => ({ ...r, logo_url: logoMap[r.id] || '', cover_url: coverMap[r.id] || '' })));
                });
        }
    }, [isAuthLoading, isDataLoading, myRestaurants, user]);

    const handleConfirmAddRestaurant = async () => {
        if (!user || !addModal.rid) return;
        setAddingRestaurant(true);
        try {
            await db.from('customers').insert({
                auth_user_id: user.id,
                restaurant_id: addModal.rid,
                name: `${firstName} ${lastName}`.trim() || user.email,
                whatsapp: telefono || null,
                total_points: 0,
                preferences: {
                    email: user.email ?? null,
                    sesso: sesso || null,
                    data_nascita: dataNascita || null,
                },
            });
            setAddModal({ open: false, rid: '', rname: '', logo: '' });
            showToast(`✓ "${addModal.rname}" aggiunta alle tue Fidelity!`);
            // Remove from allRestaurants list
            setAllRestaurants(prev => prev.filter(r => r.id !== addModal.rid));
        } catch {
            showToast('Errore durante l\'aggiunta. Riprova.');
        } finally {
            setAddingRestaurant(false);
        }
    };

    const showToast = (msg: string) => {
        setToast(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 2200);
    };

    const pwStrength = (() => {
        let s = 0;
        if (pwNew.length >= 8) s++;
        if (/[A-Z]/.test(pwNew)) s++;
        if (/[0-9]/.test(pwNew)) s++;
        if (/[^A-Za-z0-9]/.test(pwNew)) s++;
        const colors = ['#e05252', '#f0a500', '#22c47a', '#008080'];
        const labels = ['Debole', 'Accettabile', 'Buona', 'Ottima'];
        return { pct: (s / 4) * 100, color: colors[s - 1] || '#e8ecf0', label: pwNew ? labels[s - 1] || 'Debole' : 'Minimo 8 caratteri' };
    })();

    const finishOnboarding = async () => {
        localStorage.setItem('fidelity_welcome_seen', '1');
        setShowOnboarding(false);
        if (tasteProfile.length > 0 && user) {
            const { data: row } = await db.from('customers').select('id').eq('auth_user_id', user.id).limit(1).maybeSingle();
            if (row) await db.from('customers').update({ preferences: { taste_profile: tasteProfile } }).eq('id', row.id);
        }
    };

    if (isAuthLoading || (user && isDataLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: OB_BG[0] }}>
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════
    // ONBOARDING
    // ════════════════════════════════════════════════════════════════
    if (showOnboarding) return (
        <div
            className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
            style={{ background: OB_BG[obSlide], transition: 'background 0.5s ease', fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* Progress bar */}
            <div className="flex gap-1.5 pt-14 px-6 flex-shrink-0">
                {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.3)' }}>
                        <div className="h-full rounded-full" style={{ background: '#fff', width: i <= obSlide ? '100%' : '0%', transition: 'width 0.4s ease' }} />
                    </div>
                ))}
            </div>

            {/* Slide container */}
            <div className="flex-1 overflow-hidden relative">
                {/* Slide 1 — Welcome */}
                {obSlide === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-start px-7 pt-16" style={{ animation: 'obSlideIn 0.35s ease' }}>
                        <div className="text-7xl mb-7" style={{ animation: 'float 3s ease-in-out infinite' }}>🌿</div>
                        <h2 className="text-[30px] font-black text-white text-center leading-tight mb-3" style={{ letterSpacing: '-0.5px' }}>Benvenuto nella tua Fidelity!</h2>
                        <p className="text-base text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                            Ogni volta che mangi o bevi, <strong className="text-white">guadagni Stelle.</strong> Più Stelle = più premi esclusivi.
                        </p>
                        <div className="mt-7 w-full rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Il meccanismo base</div>
                            <div className="text-xl font-black text-white">1€ speso = <span style={{ color: '#4ade80' }}>3 Stelle ⭐</span></div>
                        </div>
                    </div>
                )}

                {/* Slide 2 — Come funziona */}
                {obSlide === 1 && (
                    <div className="absolute inset-0 flex flex-col px-7 pt-12" style={{ animation: 'obSlideIn 0.35s ease' }}>
                        <h2 className="text-[28px] font-black text-white text-center mb-2" style={{ letterSpacing: '-0.3px' }}>Come funziona?</h2>
                        <p className="text-center text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>3 passi semplici per guadagnare ogni volta.</p>
                        <div className="flex flex-col gap-3">
                            {[
                                { emoji: '🍽️', title: 'Visita il ristorante', desc: 'Scegli tra i ristoranti partner su LeoMenu' },
                                { emoji: '📱', title: 'Mostra il QR al cassiere', desc: 'Un tap — il QR appare. Il cassiere lo scansiona' },
                                { emoji: '🎁', title: 'Riscatta i tuoi premi', desc: 'Scegli dal catalogo e mostra il codice' },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', animation: `obSlideIn 0.4s ease ${0.1 * (i + 1)}s both` }}>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>{step.emoji}</div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white text-[15px] mb-0.5">{step.title}</div>
                                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{step.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Slide 3 — Livelli */}
                {obSlide === 2 && (
                    <div className="absolute inset-0 flex flex-col px-7 pt-12" style={{ animation: 'obSlideIn 0.35s ease' }}>
                        <h2 className="text-[28px] font-black text-white text-center mb-2">Scala i Livelli</h2>
                        <p className="text-center text-sm mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>Più Stelle accumuli, più vantaggi sblocchi.</p>
                        <div className="flex flex-col gap-2.5">
                            {[
                                { emoji: '🌿', name: 'Green', range: '0 – 499 Stelle · Premi base', mult: '1.0×', bg: 'rgba(34,196,122,0.15)', border: 'rgba(34,196,122,0.3)', multBg: 'rgba(34,196,122,0.2)', multColor: '#22c47a' },
                                { emoji: '⭐', name: 'Gold', range: '500 – 2499 Stelle · Benefici esclusivi', mult: '1.2×', bg: 'rgba(240,165,0,0.15)', border: 'rgba(240,165,0,0.3)', multBg: 'rgba(240,165,0,0.2)', multColor: '#f0a500' },
                                { emoji: '💎', name: 'Reserve', range: '2500+ Stelle · Status VIP', mult: '1.7×', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)', multBg: 'rgba(124,58,237,0.2)', multColor: '#a78bfa' },
                            ].map((lv, i) => (
                                <div key={i} className="flex items-center gap-4 rounded-xl p-4" style={{ background: lv.bg, border: `1px solid ${lv.border}`, animation: `obSlideIn 0.4s ease ${0.1 * (i + 1)}s both` }}>
                                    <span className="text-3xl flex-shrink-0">{lv.emoji}</span>
                                    <div className="flex-1">
                                        <div className="font-bold text-white text-[15px]">{lv.name}</div>
                                        <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{lv.range}</div>
                                    </div>
                                    <div className="text-sm font-bold px-2.5 py-1 rounded-full" style={{ background: lv.multBg, color: lv.multColor }}>{lv.mult}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>Il moltiplicatore aumenta le Stelle guadagnate. A livello Gold, 1€ = <strong style={{ color: '#fbbf24' }}>3.6 Stelle</strong> invece di 3.</p>
                        </div>
                    </div>
                )}

                {/* Slide 4 — Premi */}
                {obSlide === 3 && (
                    <div className="absolute inset-0 flex flex-col px-7 pt-12" style={{ animation: 'obSlideIn 0.35s ease' }}>
                        <h2 className="text-[28px] font-black text-white text-center mb-2">I Tuoi Premi</h2>
                        <p className="text-center text-sm mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>Ogni ristorante ha un catalogo premi esclusivo.</p>
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { emoji: '☕', name: 'Caffè gratuito', stars: '🌿 100 stelle', locked: false },
                                { emoji: '🍕', name: 'Pizza omaggio', stars: '🌿 300 stelle', locked: false },
                                { emoji: '🎂', name: 'Regalo compleanno', stars: '⭐ Gold', locked: true },
                                { emoji: '👨‍🍳', name: 'Menù riservato', stars: '💎 Reserve', locked: true },
                            ].map((p, i) => (
                                <div key={i} className="rounded-xl p-3.5 text-center relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', animation: `obSlideIn 0.4s ease ${0.05 * (i + 1)}s both` }}>
                                    <div className="text-3xl mb-2">{p.emoji}</div>
                                    <div className="text-xs font-semibold text-white leading-tight">{p.name}</div>
                                    <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{p.stars}</div>
                                    {p.locked && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(10,10,20,0.65)', backdropFilter: 'blur(3px)' }}>
                                            <span className="text-2xl">🔒</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 rounded-xl p-3 flex gap-2.5 items-start" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <span className="text-base flex-shrink-0">💡</span>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>I premi bloccati si sbloccano man mano che sali di livello.</p>
                        </div>
                    </div>
                )}

                {/* Slide 5 — Profilo Gusto */}
                {obSlide === 4 && (
                    <div className="absolute inset-0 flex flex-col px-7 pt-10" style={{ animation: 'obSlideIn 0.35s ease' }}>
                        <h2 className="text-[26px] font-black text-white text-center mb-2">Il tuo Profilo Gusto</h2>
                        <p className="text-center text-sm mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>Cosa ami di più? I ristoranti ti sorprenderanno con offerte su misura.</p>
                        <div className="grid grid-cols-2 gap-2.5">
                            {TASTE_OPTIONS.map((opt, i) => {
                                const sel = tasteProfile.includes(opt.label);
                                return (
                                    <button key={i} onClick={() => setTasteProfile(prev => sel ? prev.filter(x => x !== opt.label) : [...prev, opt.label])}
                                        className="flex items-center gap-2.5 p-3.5 rounded-xl text-left transition-all"
                                        style={{ border: `2px solid ${sel ? '#008080' : 'rgba(255,255,255,0.15)'}`, background: sel ? 'rgba(0,128,128,0.2)' : 'rgba(255,255,255,0.06)', animation: `obSlideIn 0.4s ease ${0.05 * (i + 1)}s both` }}
                                    >
                                        <span className="text-xl">{opt.icon}</span>
                                        <span className="text-sm font-semibold text-white flex-1">{opt.label}</span>
                                        <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                            style={{ border: `2px solid ${sel ? '#008080' : 'rgba(255,255,255,0.3)'}`, background: sel ? '#008080' : 'transparent' }}>
                                            {sel && <span className="text-white text-[10px] font-black">✓</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-10 flex flex-col gap-3 flex-shrink-0">
                <button onClick={() => obSlide < 4 ? setObSlide(obSlide + 1) : finishOnboarding()}
                    className="w-full py-4 rounded-xl font-bold text-[16px] transition-all"
                    style={{ background: '#fff', color: '#008080' }}>
                    {obSlide < 4 ? 'Avanti →' : 'Inizia a guadagnare! 🚀'}
                </button>
                {obSlide < 4 && (
                    <button onClick={finishOnboarding} className="text-center text-sm py-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Salta l'introduzione
                    </button>
                )}
            </div>

            <style>{`
                @keyframes obSlideIn { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:translateX(0) } }
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
            `}</style>
        </div>
    );

    // ════════════════════════════════════════════════════════════════
    // MAIN APP
    // ════════════════════════════════════════════════════════════════

    const premiList = (() => {
        if (premiFilter === 'Disponibili') return availableRewards;
        if (premiFilter === 'Riscattati') return [];
        const found = myRestaurants.find(r => r.name === premiFilter);
        if (found) return allRewards.filter(rw => rw.restaurant.id === found.id);
        return allRewards;
    })();

    return (
        <div className="min-h-screen flex overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── DESKTOP SIDEBAR ──────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40" style={{ width: 256, background: '#fff', borderRight: '1px solid #e8ecf0' }}>
            <div className="flex items-center gap-3 px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #e8ecf0' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 text-xl" style={{ background: 'linear-gradient(135deg,#008080,#00a898)' }}>
                    {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" style={{ transform: `scale(${cropZoom/100}) translateY(${cropOffsetY}px)`, transformOrigin: 'center' }} /> : '🤩'}
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-sm truncate" style={{ color: '#1a1f2e' }}>{firstName ? `${firstName} ${lastName}`.trim() : 'Il mio profilo'}</div>
                    <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${globalLevel.pillClass}`}>{globalLevel.emoji} {globalLevel.label}</div>
                </div>
            </div>
            <div className="mx-4 mt-4 p-4 rounded-xl" style={{ background: 'linear-gradient(135deg,#005f5f,#008080)' }}>
                <div className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Stelle totali</div>
                <div className="text-2xl font-black text-white">{totalStelle} ⭐</div>
                {globalLevel.next && (
                    <div className="mt-2">
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <div className="h-full rounded-full" style={{ background: '#4ade80', width: `${Math.min((totalStelle/globalLevel.next!)*100,100)}%`, transition: 'width 1s ease' }} />
                        </div>
                        <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Mancano {globalLevel.next!-totalStelle} per {globalLevel.nextLabel}</div>
                    </div>
                )}
            </div>
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                {([
                    { id: 'home' as Tab, label: 'Home', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
                    { id: 'premi' as Tab, label: 'I miei Premi', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
                    { id: 'scopri' as Tab, label: 'Scopri Ristoranti', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
                    { id: 'profilo' as Tab, label: 'Profilo', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                ] as const).map(tab => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setActiveSubScreen(null); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium mb-1 transition-all text-left"
                        style={{ background: activeTab===tab.id ? '#008080' : 'transparent', color: activeTab===tab.id ? '#fff' : '#8492a6' }}>
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </nav>
            <div className="px-4 pb-5 pt-3" style={{ borderTop: '1px solid #e8ecf0' }}>
                <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors text-left" style={{ color: '#8492a6' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Esci dall'app
                </button>
            </div>
        </aside>

        {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
        <div className="flex-1 md:ml-64 min-h-screen flex flex-col relative overflow-x-hidden" style={{ background: '#f2f4f7' }}>

            {/* ── TAB: HOME ─────────────────────────────────────────── */}
            {activeTab === 'home' && (
                <div className="flex flex-col flex-1 pb-24 md:pb-8">
                    {/* Header */}
                    <div className="relative overflow-hidden pt-14 md:pt-10 px-6 pb-7" style={{ background: 'linear-gradient(150deg,#005f5f,#008080,#00a898)' }}>
                        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <div className="absolute -bottom-16 -left-5 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                        <div className="text-sm mb-0.5 relative z-10" style={{ color: 'rgba(255,255,255,0.7)' }}>Ciao di nuovo 👋</div>
                        <div className="text-2xl font-black text-white relative z-10" style={{ letterSpacing: '-0.3px' }}>
                            {firstName ? `${firstName} ${lastName}`.trim() : (user?.email?.split('@')[0] || 'Ospite')}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mt-2.5 mb-4 relative z-10"
                            style={{ background: 'rgba(34,196,122,0.2)', color: '#4ade80', border: '1px solid rgba(34,196,122,0.3)' }}>
                            {globalLevel.emoji} {globalLevel.label}
                        </div>
                        <div className="flex items-baseline gap-1.5 mb-3 relative z-10">
                            <span className="text-[42px] font-black text-white leading-none" style={{ letterSpacing: '-1px' }}>{totalStelle}</span>
                            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Stelle totali</span>
                        </div>
                        {globalLevel.next && (
                            <div className="relative z-10">
                                <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                    <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#4ade80,#22c47a)', width: `${Math.min((totalStelle / globalLevel.next!) * 100, 100)}%`, transition: 'width 1s ease' }} />
                                </div>
                                <div className="flex justify-between text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                    <span>{globalLevel.label} 0</span>
                                    <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Mancano <strong>{globalLevel.next! - totalStelle} stelle</strong> per {globalLevel.nextLabel} {globalLevel.nextLabel === 'Gold' ? '⭐' : '💎'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-4 md:px-8 pt-5 flex flex-col gap-6 max-w-5xl md:mx-auto w-full">
                        {/* QR Button */}
                        <button onClick={() => setShowQRSelector(true)}
                            className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
                            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                            <div className="w-13 h-13 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg,#008080,#00a898)', width: 52, height: 52 }}>
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                    <rect x="5" y="5" width="3" height="3" fill="white" stroke="none" /><rect x="16" y="5" width="3" height="3" fill="white" stroke="none" /><rect x="5" y="16" width="3" height="3" fill="white" stroke="none" />
                                    <line x1="14" y1="14" x2="14" y2="14" strokeWidth="3" /><line x1="17" y1="14" x2="17" y2="14" strokeWidth="3" /><line x1="20" y1="14" x2="20" y2="14" strokeWidth="3" />
                                    <line x1="14" y1="17" x2="14" y2="17" strokeWidth="3" /><line x1="17" y1="17" x2="17" y2="17" strokeWidth="3" /><line x1="20" y1="17" x2="20" y2="17" strokeWidth="3" />
                                    <line x1="14" y1="20" x2="14" y2="20" strokeWidth="3" /><line x1="17" y1="20" x2="17" y2="20" strokeWidth="3" /><line x1="20" y1="20" x2="20" y2="20" strokeWidth="3" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-[16px]" style={{ color: '#1a1f2e' }}>Mostra il mio QR</div>
                                <div className="text-xs mt-0.5" style={{ color: '#8492a6' }}>Scansiona al cassiere per guadagnare Stelle</div>
                            </div>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8492a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>

                        {/* Le mie Fidelity */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[17px] font-bold" style={{ color: '#1a1f2e' }}>Le mie Fidelity</h3>
                                <span className="text-sm font-medium" style={{ color: '#008080' }}>Vedi tutte</span>
                            </div>
                            {myRestaurants.length === 0 ? (
                                <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                    <p className="text-sm font-medium" style={{ color: '#8492a6' }}>Nessuna fidelity ancora. Scopri i ristoranti!</p>
                                </div>
                            ) : (
                                <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-4 md:-mx-8 px-4 md:px-8" style={{ scrollbarWidth: 'none' }}>
                                    {myRestaurants.map(r => {
                                        const lv = getLevel(r.points);
                                        const avail = r.rewards.filter(rw => r.points >= rw.points_required).length;
                                        const next = lv.next;
                                        const pct = next ? Math.min((r.points / next) * 100, 100) : 100;
                                        return (
                                            <div key={r.id} className="bg-white rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer active:scale-[0.98] transition-transform relative" style={{ width: 260, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                                <button onClick={e => { e.stopPropagation(); setRemoveModal({ open: true, rid: r.id, rname: r.name }); }}
                                                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-opacity hover:opacity-80"
                                                    style={{ background: 'rgba(0,0,0,0.15)' }}>
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                </button>
                                                <div className="p-3.5 flex items-center gap-2.5">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold" style={{ background: '#e6f4f4', border: '1px solid #e8ecf0' }}>
                                                        {r.logo_url ? <img src={r.logo_url} className="w-full h-full object-contain rounded-xl p-0.5" /> : r.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold" style={{ color: '#1a1f2e' }}>{r.name}</div>
                                                        <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${lv.pillClass}`}>
                                                            {lv.emoji} {lv.label}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="px-4 pb-3">
                                                    <div className="flex items-baseline gap-1 mb-2">
                                                        <span className="text-2xl font-black" style={{ color: '#1a1f2e', letterSpacing: '-0.5px' }}>{r.points}</span>
                                                        <span className="text-xs" style={{ color: '#8492a6' }}>stelle</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: '#e8ecf0' }}>
                                                        <div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${lv.barColor}88, ${lv.barColor})`, width: `${pct}%` }} />
                                                    </div>
                                                    <div className="text-[11px]" style={{ color: '#8492a6' }}>
                                                        {next ? `Mancano ${next - r.points} stelle per ${lv.nextLabel}` : 'Livello massimo raggiunto!'}
                                                    </div>
                                                </div>
                                                <div className="border-t px-4 py-2.5 flex items-center justify-between" style={{ borderColor: '#e8ecf0' }}>
                                                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8492a6' }}>
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: avail > 0 ? '#22c47a' : '#e8ecf0' }} />
                                                        {avail > 0 ? `${avail} premi disponibili` : 'Nessun premio'}
                                                    </div>
                                                    <Link to={`/${r.slug}`} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#e6f4f4', color: '#008080' }}>
                                                        Apri menù
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <button onClick={() => setActiveTab('scopri')}
                                        className="rounded-2xl flex flex-col items-center justify-center gap-2 flex-shrink-0 transition-all hover:border-[#008080] hover:text-[#008080]"
                                        style={{ width: 180, minHeight: 140, border: '2px dashed #e8ecf0', color: '#8492a6', fontSize: 13, fontWeight: 500 }}>
                                        <span style={{ fontSize: 24 }}>+</span>
                                        <span>Aggiungi ristorante</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Scopri */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[17px] font-bold" style={{ color: '#1a1f2e' }}>Scopri nuovi posti</h3>
                                <button onClick={() => setActiveTab('scopri')} className="text-sm font-medium" style={{ color: '#008080' }}>Tutti →</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {(globalSearchResults.length > 0 ? globalSearchResults : allRestaurants).slice(0, 6).map((r: any) => (
                                    <Link key={r.id} to={`/${r.slug}`} className="bg-white rounded-xl p-3.5 flex items-center gap-3" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl overflow-hidden" style={{ background: '#e6f4f4', border: '1px solid #e8ecf0' }}>
                                            {r.logo_url ? <img src={r.logo_url} className="w-full h-full object-contain p-0.5" /> : '🍽️'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold truncate" style={{ color: '#1a1f2e' }}>{r.name}</div>
                                            <div className="text-xs mt-0.5" style={{ color: '#8492a6' }}>{r.citta || 'Italia'}</div>
                                        </div>
                                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); setAddModal({ open: true, rid: r.id, rname: r.name, logo: r.logo_url || '' }); }}
                                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0" style={{ background: '#e6f4f4', color: '#008080' }}>
                                            + Aggiungi
                                        </button>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: PREMI ─────────────────────────────────────────── */}
            {activeTab === 'premi' && (
                <div className="flex flex-col flex-1 pb-24 md:pb-8">
                    <div className="pt-14 md:pt-10 pb-6 px-6" style={{ background: 'linear-gradient(150deg,#1f1218,#3d1f2d)' }}>
                        <div className="text-2xl font-black text-white mb-1" style={{ letterSpacing: '-0.4px' }}>I miei Premi 🎁</div>
                        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{availableRewards.length} premi disponibili tra tutti i ristoranti</div>
                    </div>
                    <div className="flex gap-2 px-6 pt-4 pb-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                        {['Tutti', 'Disponibili', ...myRestaurants.map(r => r.name), 'Riscattati'].map(f => (
                            <button key={f} onClick={() => setPremiFilter(f)}
                                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
                                style={{ border: `1.5px solid ${premiFilter === f ? '#008080' : '#e8ecf0'}`, background: premiFilter === f ? '#008080' : '#fff', color: premiFilter === f ? '#fff' : '#8492a6' }}>
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="px-4 md:px-6 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {premiFilter === 'Riscattati' ? (
                            <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                <p className="text-sm" style={{ color: '#8492a6' }}>Nessun premio riscattato ancora.</p>
                            </div>
                        ) : premiList.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                <p className="text-sm" style={{ color: '#8492a6' }}>Nessun premio in questa categoria.</p>
                            </div>
                        ) : premiList.map((rw: any) => {
                            const available = rw.restaurant.points >= rw.points_required;
                            const remaining = rw.points_required - rw.restaurant.points;
                            const lv = getLevel(rw.points_required);
                            return (
                                <div key={rw.id} className="bg-white rounded-2xl p-4 flex items-center gap-3.5"
                                    style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', opacity: available ? 1 : 0.65 }}>
                                    <div className="w-13 h-13 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                        style={{ width: 52, height: 52, background: lv.key === 'green' ? '#edfaf3' : lv.key === 'gold' ? '#fff8e6' : '#f3eeff' }}>
                                        {rw.image_url ? <img src={rw.image_url} className="w-full h-full object-cover rounded-xl" /> : '🎁'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[15px] font-bold mb-0.5 truncate" style={{ color: '#1a1f2e' }}>{rw.name}</div>
                                        <div className="text-xs mb-1.5" style={{ color: '#8492a6' }}>{rw.restaurant.name}</div>
                                        <div className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg"
                                            style={{ background: lv.key === 'green' ? '#edfaf3' : lv.key === 'gold' ? '#fff8e6' : '#f3eeff', color: lv.key === 'green' ? '#22c47a' : lv.key === 'gold' ? '#f0a500' : '#7c3aed' }}>
                                            {lv.emoji} {rw.points_required} Stelle
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {available ? (
                                            <button onClick={() => showToast(`✓ Codice: ${Math.random().toString(36).substring(2, 8).toUpperCase()}`)}
                                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#008080' }}>
                                                Riscatta
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: '#e8ecf0', color: '#8492a6' }}>
                                                🔒 {remaining}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── TAB: SCOPRI ─────────────────────────────────────────── */}
            {activeTab === 'scopri' && (
                <div className="flex flex-col flex-1 pb-24 md:pb-8">
                    <div className="bg-white pt-14 md:pt-10 pb-4 px-6 border-b" style={{ borderColor: '#e8ecf0' }}>
                        <div className="text-xl font-black mb-3" style={{ color: '#1a1f2e', letterSpacing: '-0.3px' }}>Scopri Ristoranti</div>
                        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl" style={{ background: '#f2f4f7', border: '1.5px solid #e8ecf0' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8492a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input type="text" placeholder="Cerca su LeoMenu…" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
                                className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#1a1f2e', fontFamily: "'DM Sans', sans-serif" }} />
                            {isSearchingGlobal && <div className="w-4 h-4 border-2 border-[#008080] border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                        </div>
                    </div>
                    <div className="flex gap-2 px-6 pt-3.5 pb-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                        {['🗺️ Vicini a te', '🍕 Pizzerie', '🍽️ Cucina', '🍸 Bar', '🎁 Fidelity attiva'].map((f, i) => (
                            <div key={i} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer"
                                style={{ border: `1.5px solid ${i === 0 ? '#008080' : '#e8ecf0'}`, background: i === 0 ? '#e6f4f4' : '#fff', color: i === 0 ? '#008080' : '#8492a6' }}>
                                {f}
                            </div>
                        ))}
                    </div>
                    <div className="px-4 md:px-6 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(globalSearchResults.length > 0
                            ? globalSearchResults.filter((r: any) => !myRestaurants.some(mr => mr.id === r.id))
                            : allRestaurants
                        ).map((r: any) => (
                            <Link key={r.id} to={`/${r.slug}`} className="bg-white rounded-2xl overflow-hidden block" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                {/* Copertina */}
                                <div className="h-28 relative overflow-hidden" style={{ background: r.cover_url ? undefined : 'linear-gradient(135deg,#005f5f,#008080)' }}>
                                    {r.cover_url
                                        ? <img src={r.cover_url} className="absolute inset-0 w-full h-full object-cover" />
                                        : <span className="absolute bottom-3 left-3 text-4xl">🍽️</span>
                                    }
                                    {/* Logo badge in portada */}
                                    {r.logo_url && (
                                        <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl overflow-hidden z-10 bg-white flex items-center justify-center" style={{ border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                            <img src={r.logo_url} className="w-full h-full object-contain p-0.5" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="font-bold text-base mb-1" style={{ color: '#1a1f2e' }}>{r.name}</div>
                                    <div className="text-xs mb-2.5" style={{ color: '#8492a6' }}>🍽️ · {r.citta || 'Italia'}</div>
                                    <button
                                        onClick={e => { e.preventDefault(); e.stopPropagation(); setAddModal({ open: true, rid: r.id, rname: r.name, logo: r.logo_url || '' }); }}
                                        className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: '#e6f4f4', color: '#008080' }}>
                                        + Aggiungi Fidelity
                                    </button>
                                </div>
                            </Link>
                        ))}
                        {allRestaurants.length === 0 && globalSearchResults.length === 0 && (
                            <div className="col-span-full bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                <p className="text-sm" style={{ color: '#8492a6' }}>Sei già iscritto a tutti i ristoranti disponibili!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: PROFILO ─────────────────────────────────────────── */}
            {activeTab === 'profilo' && (
                <div className="flex-1 relative overflow-hidden" style={{ minHeight: '100vh' }}>
                    {/* Main profilo view */}
                    <div className="absolute inset-0 overflow-y-auto transition-transform duration-300 pb-24 md:pb-8"
                        style={{ transform: activeSubScreen ? 'translateX(-100%)' : 'translateX(0)', scrollbarWidth: 'none' }}>

                        {/* Header */}
                        <div className="pt-14 md:pt-10 pb-7 px-6 relative" style={{ background: 'linear-gradient(150deg,#005f5f,#008080)' }}>
                            <div className="relative inline-block mb-3">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.3)', fontSize: 36 }}>
                                    {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" style={{ transform: `scale(${cropZoom / 100}) translateY(${cropOffsetY}px)`, transformOrigin: 'center' }} /> : '🤩'}
                                </div>
                                <button onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#008080', border: '2px solid #fff' }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                                    const f = e.target.files?.[0]; if (!f) return;
                                    const reader = new FileReader();
                                    reader.onload = ev => { setAvatarSrc(ev.target?.result as string); setShowCropModal(true); };
                                    reader.readAsDataURL(f);
                                }} />
                            </div>
                            <div className="text-xl font-black text-white">{firstName ? `${firstName} ${lastName}`.trim() : 'Il tuo profilo'}</div>
                            <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{user?.email}</div>
                            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold mt-2" style={{ background: 'rgba(34,196,122,0.2)', color: '#4ade80', border: '1px solid rgba(34,196,122,0.3)' }}>
                                {globalLevel.emoji} {globalLevel.label} · {totalStelle} Stelle
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 px-4 md:px-8 py-4 max-w-2xl md:mx-auto w-full">
                            {[{ val: totalStelle, lbl: 'Stelle totali' }, { val: myRestaurants.length, lbl: 'Fidelity attive' }, { val: availableRewards.length, lbl: 'Premi disp.' }].map((s, i) => (
                                <div key={i} className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                    <div className="text-xl font-black" style={{ color: '#1a1f2e', letterSpacing: '-0.5px' }}>{s.val}</div>
                                    <div className="text-[11px] mt-0.5 font-medium" style={{ color: '#8492a6' }}>{s.lbl}</div>
                                </div>
                            ))}
                        </div>

                        {/* Menu sections */}
                        {[
                            {
                                title: 'Il mio account', items: [
                                    { icon: '👤', bg: '#e8f4ff', label: 'I miei dati', val: `${firstName || 'Modifica'}`, sub: 'dati' as SubScreen },
                                    { icon: '🔐', bg: '#f0e8ff', label: 'Cambia Password', val: '', sub: 'password' as SubScreen },
                                    { icon: '🔔', bg: '#fff3e0', label: 'Notifiche', val: 'Attive', sub: 'notifiche' as SubScreen },
                                    { icon: '🌐', bg: '#e8f4ff', label: 'Lingua', val: 'Italiano', sub: 'lingua' as SubScreen },
                                    { icon: '🪪', bg: '#e6f4f4', label: 'ID Globale', val: globalId.substring(0, 10) + '…', sub: 'idglobale' as SubScreen },
                                ]
                            },
                            {
                                title: 'Preferenze', items: [
                                    { icon: '🍽️', bg: '#fff3e0', label: 'Profilo Gusto', val: subTasteProfile.slice(0, 2).join(', ') || 'Pizza, Caffè', sub: 'gusto' as SubScreen },
                                    { icon: '🥗', bg: '#edfaf3', label: 'Preferenze dieta', val: dietProfile.length > 0 ? `${dietProfile.length} selezioni` : 'Nessuna', sub: 'dieta' as SubScreen },
                                ]
                            },
                            {
                                title: 'Supporto & app', items: [
                                    { icon: '💬', bg: '#e8f4ff', label: 'Contatta supporto', val: '', sub: 'supporto' as SubScreen },
                                    { icon: '🎁', bg: '#edfaf3', label: 'Invita un amico', val: '+50 ⭐', sub: 'condividi' as SubScreen },
                                    { icon: '🔒', bg: '#f5f5f5', label: 'Privacy & GDPR', val: '', sub: 'privacy' as SubScreen },
                                    { icon: 'ℹ️', bg: '#f5f5f5', label: 'Versione app', val: '1.4.2', sub: null },
                                ]
                            }
                        ].map(section => (
                            <div key={section.title} className="px-4 md:px-8 mb-4 max-w-2xl md:mx-auto w-full">
                                <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#8492a6' }}>{section.title}</div>
                                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                    {section.items.map((item, i) => (
                                        <button key={i} onClick={() => item.sub && setActiveSubScreen(item.sub)}
                                            disabled={!item.sub}
                                            className="w-full flex items-center gap-3.5 px-4 py-4 border-b last:border-0 text-left transition-colors hover:bg-gray-50 disabled:hover:bg-white"
                                            style={{ borderColor: '#e8ecf0' }}>
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: item.bg }}>{item.icon}</div>
                                            <span className="flex-1 text-sm font-medium" style={{ color: '#1a1f2e' }}>{item.label}</span>
                                            {item.val && <span className="text-xs mr-1.5 truncate max-w-[80px]" style={{ color: item.sub === 'idglobale' ? '#008080' : '#8492a6', fontFamily: item.sub === 'idglobale' ? 'monospace' : 'inherit', fontSize: item.sub === 'idglobale' ? 11 : undefined }}>{item.val}</span>}
                                            {item.sub && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8ecf0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="px-4 md:px-8 mb-3 max-w-2xl md:mx-auto w-full">
                            <button onClick={() => setShowLogoutConfirm(true)} className="md:hidden w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 mb-2.5 transition-colors hover:bg-gray-200" style={{ background: '#e8ecf0', color: '#1a1f2e' }}>
                                👋 Esci dall'app
                            </button>
                            <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors" style={{ background: '#fdf0f0', color: '#e05252' }}>
                                🗑️ Elimina account
                            </button>
                        </div>
                        <div className="h-8" />
                    </div>

                    {/* ── SUB-SCREENS ─────────────────────────── */}
                    {([
                        'dati', 'password', 'notifiche', 'lingua', 'idglobale',
                        'gusto', 'dieta', 'supporto', 'condividi', 'privacy'
                    ] as SubScreen[]).map(sub => (
                        <div key={sub} className="absolute inset-0 overflow-y-auto transition-transform duration-300"
                            style={{ transform: activeSubScreen === sub ? 'translateX(0)' : 'translateX(100%)', background: '#f2f4f7', scrollbarWidth: 'none' }}>
                            {/* Sub topbar */}
                            <div className="flex items-center gap-3 px-4 bg-white border-b sticky top-0 z-10 pt-12 md:pt-4 pb-3" style={{ borderColor: '#e8ecf0' }}>
                                <button onClick={() => setActiveSubScreen(null)} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f2f4f7' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1f2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                </button>
                                <span className="flex-1 text-[17px] font-bold" style={{ color: '#1a1f2e' }}>
                                    {{ dati: 'I miei dati', password: 'Cambia Password', notifiche: 'Notifiche', lingua: 'Lingua', idglobale: 'ID Globale', gusto: 'Profilo Gusto', dieta: 'Preferenze dieta', supporto: 'Contatta supporto', condividi: 'Invita un amico', privacy: 'Privacy & GDPR' }[sub!]}
                                </span>
                                {sub === 'dati' && <button onClick={() => { handleSaveFullProfile({ telefono, dataNascita, sesso }); showToast('✓ Dati salvati'); }} className="text-sm font-semibold" style={{ color: '#008080' }}>Salva</button>}
                            </div>

                            {/* Sub body */}
                            <div className="p-5 md:p-8 flex flex-col gap-4 pb-28 md:pb-12 max-w-2xl md:mx-auto w-full">

                                {/* ── DATI ── */}
                                {sub === 'dati' && <>
                                    <div className="flex flex-col items-center py-3 gap-2">
                                        <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden text-4xl" style={{ background: '#e6f4f4', border: '3px solid #b3d9d9' }}>
                                            {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" /> : '🤩'}
                                        </div>
                                        <button onClick={() => avatarInputRef.current?.click()} className="text-sm font-semibold px-4 py-1.5 rounded-full" style={{ background: '#e6f4f4', color: '#008080' }}>Cambia foto</button>
                                    </div>
                                    {[
                                        { label: 'NOME', val: firstName, set: setFirstName, ph: 'Il tuo nome', type: 'text' },
                                        { label: 'COGNOME', val: lastName, set: setLastName, ph: 'Il tuo cognome', type: 'text' },
                                    ].map(f => (
                                        <div key={f.label}>
                                            <div className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8492a6' }}>{f.label}</div>
                                            <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                                                className="w-full rounded-xl p-3.5 text-sm outline-none" style={{ border: '1.5px solid #e8ecf0', background: '#fff', color: '#1a1f2e', fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s' }}
                                                onFocus={e => e.target.style.borderColor = '#008080'} onBlur={e => e.target.style.borderColor = '#e8ecf0'} />
                                        </div>
                                    ))}
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8492a6' }}>EMAIL</div>
                                        <input type="email" value={user?.email || ''} readOnly className="w-full rounded-xl p-3.5 text-sm" style={{ border: '1.5px solid #e8ecf0', background: '#f2f4f7', color: '#8492a6', fontFamily: "'DM Sans', sans-serif" }} />
                                        <div className="text-xs mt-1" style={{ color: '#8492a6' }}>L'email non può essere modificata</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8492a6' }}>TELEFONO</div>
                                        <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+39..."
                                            className="w-full rounded-xl p-3.5 text-sm outline-none" style={{ border: '1.5px solid #e8ecf0', background: '#fff', color: '#1a1f2e', fontFamily: "'DM Sans', sans-serif" }}
                                            onFocus={e => e.target.style.borderColor = '#008080'} onBlur={e => e.target.style.borderColor = '#e8ecf0'} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8492a6' }}>DATA DI NASCITA</div>
                                        <input type="date" value={dataNascita} onChange={e => setDataNascita(e.target.value)}
                                            className="w-full rounded-xl p-3.5 text-sm outline-none" style={{ border: '1.5px solid #e8ecf0', background: '#fff', color: '#1a1f2e', fontFamily: "'DM Sans', sans-serif" }}
                                            onFocus={e => e.target.style.borderColor = '#008080'} onBlur={e => e.target.style.borderColor = '#e8ecf0'} />
                                        <div className="text-xs mt-1" style={{ color: '#8492a6' }}>Usata per il Regalo di Compleanno 🎂</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#8492a6' }}>SESSO</div>
                                        <div className="flex flex-col gap-2.5">
                                            {[['uomo', 'Uomo'], ['donna', 'Donna'], ['non_specificato', 'Preferisco non dirlo']].map(([val, lbl]) => (
                                                <label key={val} className="flex items-center gap-2.5 cursor-pointer text-sm" style={{ color: '#1a1f2e' }}>
                                                    <input type="radio" name="sesso" checked={sesso === val} onChange={() => setSesso(val)} style={{ accentColor: '#008080', width: 16, height: 16 }} /> {lbl}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => { handleSaveFullProfile({ telefono, dataNascita, sesso }); showToast('✓ Dati salvati!'); }} className="w-full py-4 rounded-xl font-bold text-white" style={{ background: '#008080', marginTop: 4 }}>
                                        {isSavingProfile ? <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Salva modifiche'}
                                    </button>
                                </>}

                                {/* ── PASSWORD ── */}
                                {sub === 'password' && <>
                                    <div className="flex flex-col items-center py-4 gap-2">
                                        <div className="text-5xl">🔐</div>
                                        <div className="text-base font-bold" style={{ color: '#1a1f2e' }}>Sicurezza account</div>
                                        <div className="text-sm text-center leading-relaxed" style={{ color: '#8492a6' }}>Scegli una password sicura di almeno 8 caratteri.</div>
                                    </div>
                                    {[
                                        { label: 'PASSWORD ATTUALE', val: pwCurrent, set: setPwCurrent, show: pwShowCurrent, toggle: () => setPwShowCurrent(x => !x) },
                                        { label: 'NUOVA PASSWORD', val: pwNew, set: setPwNew, show: pwShowNew, toggle: () => setPwShowNew(x => !x) },
                                        { label: 'CONFERMA NUOVA PASSWORD', val: pwConfirm, set: setPwConfirm, show: pwShowConfirm, toggle: () => setPwShowConfirm(x => !x) },
                                    ].map((f, i) => (
                                        <div key={i}>
                                            <div className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8492a6' }}>{f.label}</div>
                                            <div className="flex overflow-hidden rounded-xl" style={{ border: '1.5px solid #e8ecf0' }}>
                                                <input type={f.show ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)} placeholder="••••••••"
                                                    className="flex-1 p-3.5 text-sm outline-none bg-white" style={{ color: '#1a1f2e', fontFamily: "'DM Sans', sans-serif" }} />
                                                <button onClick={f.toggle} className="px-3.5 flex items-center justify-center" style={{ background: '#f2f4f7', borderLeft: '1.5px solid #e8ecf0' }}>
                                                    {f.show ? (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8492a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                    ) : (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8492a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    )}
                                                </button>
                                            </div>
                                            {i === 1 && pwNew && (
                                                <div>
                                                    <div className="h-1 rounded-full overflow-hidden mt-2" style={{ background: '#e8ecf0' }}>
                                                        <div className="h-full rounded-full transition-all" style={{ width: `${pwStrength.pct}%`, background: pwStrength.color }} />
                                                    </div>
                                                    <div className="text-xs mt-1" style={{ color: '#8492a6' }}>{pwStrength.label}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={() => showToast('✓ Password aggiornata!')} className="w-full py-4 rounded-xl font-bold text-white mt-2" style={{ background: '#008080' }}>Aggiorna password</button>
                                </>}

                                {/* ── NOTIFICHE ── */}
                                {sub === 'notifiche' && <>
                                    <div className="bg-white rounded-2xl p-4 flex items-center justify-between" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                        <div>
                                            <div className="font-bold text-sm" style={{ color: '#1a1f2e' }}>Notifiche push</div>
                                            <div className="text-xs mt-0.5" style={{ color: '#8492a6' }}>Master switch per tutte le notifiche</div>
                                        </div>
                                        <MiniToggle on={notifMaster} onChange={v => setNotifMaster(v)} />
                                    </div>
                                    <div style={{ opacity: notifMaster ? 1 : 0.4, pointerEvents: notifMaster ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                                        {[
                                            { title: 'PREMI & STELLE', items: NOTIF_PREMI, state: notifPremi, set: setNotifPremi },
                                            { title: 'OFFERTE & NOVITÀ', items: NOTIF_OFFERTE, state: notifOfferte, set: setNotifOfferte },
                                            { title: 'EMAIL', items: NOTIF_EMAIL, state: notifEmail, set: setNotifEmail },
                                        ].map(section => (
                                            <div key={section.title} className="mb-3">
                                                <div className="text-[10px] font-bold uppercase tracking-widest px-1 mb-1.5" style={{ color: '#8492a6' }}>{section.title}</div>
                                                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                                    {section.items.map((item, i) => (
                                                        <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0" style={{ borderColor: '#e8ecf0' }}>
                                                            <span className="flex-1 text-sm" style={{ color: '#1a1f2e' }}>{item}</span>
                                                            <MiniToggle on={section.state[i]} onChange={v => { const next = [...section.state]; next[i] = v; section.set(next as any); }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>}

                                {/* ── LINGUA ── */}
                                {sub === 'lingua' && (
                                    <div className="bg-white rounded-2xl overflow-hidden mt-3" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                        {[['it', '🇮🇹', 'Italiano'], ['en', '🇬🇧', 'English'], ['es', '🇪🇸', 'Español'], ['de', '🇩🇪', 'Deutsch'], ['fr', '🇫🇷', 'Français']].map(([code, flag, name]) => (
                                            <button key={code} onClick={() => { setLingua(code); showToast('✓ Lingua aggiornata!'); }}
                                                className="w-full flex items-center gap-3.5 px-4 py-4 border-b last:border-0 transition-colors text-left"
                                                style={{ borderColor: '#e8ecf0', background: lingua === code ? '#e6f4f4' : '#fff' }}>
                                                <span className="text-2xl">{flag}</span>
                                                <span className="flex-1 text-sm font-medium" style={{ color: '#1a1f2e' }}>{name}</span>
                                                {lingua === code && <span style={{ color: '#008080', fontWeight: 700 }}>✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* ── ID GLOBALE ── */}
                                {sub === 'idglobale' && <>
                                    <div className="rounded-xl p-3.5 flex gap-2.5 items-start" style={{ background: '#e6f4f4', border: '1px solid #b3d9d9' }}>
                                        <span className="text-lg flex-shrink-0">🪪</span>
                                        <p className="text-sm leading-relaxed" style={{ color: '#006666' }}>Il tuo ID Globale è il tuo identificativo unico su <strong>tutti i ristoranti LeoMenu</strong>.</p>
                                    </div>
                                    <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg,#008080,#00a898)', boxShadow: '0 8px 24px rgba(0,128,128,0.3)' }}>
                                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'rgba(255,255,255,0.7)' }}>IL TUO ID GLOBALE</div>
                                        <div className="text-xl font-black text-white font-mono mb-3.5" style={{ letterSpacing: 2 }}>{globalId}</div>
                                        <button onClick={() => { navigator.clipboard?.writeText(globalId); showToast('✓ ID copiato!'); }} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                                            📋 Copia ID
                                        </button>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm mb-3" style={{ color: '#8492a6' }}>QR del tuo ID personale</div>
                                        <div className="inline-block p-4 rounded-2xl" style={{ border: '2px solid #008080' }}>
                                            <QRCodeSVG value={user?.id || globalId} size={140} fgColor="#008080" />
                                        </div>
                                        <div className="text-xs mt-2.5 leading-relaxed" style={{ color: '#8492a6' }}>Diverso dal QR del ristorante — questo identifica solo te.</div>
                                    </div>
                                </>}

                                {/* ── GUSTO ── */}
                                {sub === 'gusto' && <>
                                    <p className="text-sm leading-relaxed" style={{ color: '#8492a6' }}>Seleziona tutto ciò che ami. I ristoranti useranno queste preferenze per offrirti promozioni su misura.</p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {TASTE_OPTIONS_FULL.map((opt, i) => {
                                            const sel = subTasteProfile.includes(opt.label);
                                            return (
                                                <button key={i} onClick={() => setSubTasteProfile(prev => sel ? prev.filter(x => x !== opt.label) : [...prev, opt.label])}
                                                    className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
                                                    style={{ border: `2px solid ${sel ? '#008080' : '#e8ecf0'}`, background: sel ? '#e6f4f4' : '#fff', color: sel ? '#008080' : '#1a1f2e' }}>
                                                    <span className="text-xl">{opt.icon}</span>
                                                    <span className="text-sm font-semibold flex-1">{opt.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button onClick={() => { setTasteProfile(subTasteProfile); showToast('✓ Profilo Gusto salvato!'); }} className="w-full py-4 rounded-xl font-bold text-white" style={{ background: '#008080' }}>
                                        Salva preferenze
                                    </button>
                                </>}

                                {/* ── DIETA ── */}
                                {sub === 'dieta' && <>
                                    <p className="text-sm leading-relaxed" style={{ color: '#8492a6' }}>I ristoranti useranno queste informazioni per filtrare le offerte adatte a te.</p>
                                    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                        {DIET_OPTIONS.map((opt, i) => {
                                            const sel = dietProfile.includes(opt.label);
                                            return (
                                                <button key={i} onClick={() => setDietProfile(prev => sel ? prev.filter(x => x !== opt.label) : [...prev, opt.label])}
                                                    className="w-full flex items-center gap-3 px-4 py-3.5 border-b last:border-0 text-left transition-colors"
                                                    style={{ borderColor: '#e8ecf0' }}>
                                                    <span className="text-xl">{opt.icon}</span>
                                                    <span className="flex-1 text-sm font-medium" style={{ color: '#1a1f2e' }}>{opt.label}</span>
                                                    <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all" style={{ border: `2px solid ${sel ? '#008080' : '#e8ecf0'}`, background: sel ? '#008080' : 'transparent' }}>
                                                        {sel && <span className="text-white text-xs font-black">✓</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button onClick={() => showToast('✓ Preferenze salvate!')} className="w-full py-4 rounded-xl font-bold text-white" style={{ background: '#008080' }}>Salva</button>
                                </>}

                                {/* ── SUPPORTO ── */}
                                {sub === 'supporto' && <>
                                    <div className="rounded-xl p-4 text-center" style={{ background: '#e6f4f4' }}>
                                        <div className="text-4xl mb-2">💬</div>
                                        <div className="font-bold text-sm mb-1" style={{ color: '#006666' }}>Siamo qui per aiutarti</div>
                                        <div className="text-xs" style={{ color: '#008080' }}>Risposta media entro 2 ore nei giorni lavorativi</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8492a6' }}>ARGOMENTO</div>
                                        <select className="w-full rounded-xl p-3.5 text-sm outline-none" style={{ border: '1.5px solid #e8ecf0', background: '#fff', color: '#1a1f2e', fontFamily: "'DM Sans', sans-serif" }}>
                                            {['Problema con le Stelle', 'Premio non ricevuto', 'Problema con il QR', 'Problema con l\'account', 'Segnala un bug', 'Altro'].map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#8492a6' }}>MESSAGGIO</div>
                                        <textarea rows={4} placeholder="Descrivi il problema…" className="w-full rounded-xl p-3.5 text-sm outline-none resize-none" style={{ border: '1.5px solid #e8ecf0', background: '#fff', color: '#1a1f2e', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }} />
                                    </div>
                                    <button onClick={() => showToast('✓ Messaggio inviato!')} className="w-full py-4 rounded-xl font-bold text-white" style={{ background: '#008080' }}>Invia messaggio</button>
                                    <div className="text-center">
                                        <div className="text-xs mb-2" style={{ color: '#8492a6' }}>Oppure scrivici direttamente</div>
                                        <div className="flex gap-2.5 justify-center">
                                            <button className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ border: '1.5px solid #e8ecf0', background: '#fff', color: '#1a1f2e' }}>📧 Email</button>
                                            <button className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ border: '1.5px solid #e8ecf0', background: '#fff', color: '#1a1f2e' }}>💚 WhatsApp</button>
                                        </div>
                                    </div>
                                </>}

                                {/* ── CONDIVIDI ── */}
                                {sub === 'condividi' && <>
                                    <div className="text-center py-4">
                                        <div className="text-6xl mb-3">🎁</div>
                                        <div className="text-xl font-black mb-2" style={{ color: '#1a1f2e', letterSpacing: '-0.3px' }}>Tu e il tuo amico<br />guadagnate insieme</div>
                                        <div className="text-sm leading-relaxed" style={{ color: '#8492a6' }}>Condividi il codice. Quando il tuo amico si registra e fa la prima scansione, entrambi ricevete <strong style={{ color: '#22c47a' }}>50 Stelle bonus</strong>.</div>
                                    </div>
                                    <div className="text-center p-5 rounded-2xl" style={{ background: '#e6f4f4', border: '2px dashed #008080' }}>
                                        <div className="text-[11px] font-semibold mb-1.5" style={{ color: '#8492a6', letterSpacing: '0.06em' }}>IL TUO CODICE</div>
                                        <div className="text-3xl font-black font-mono" style={{ color: '#008080', letterSpacing: 3 }}>{referralCode}</div>
                                        <button onClick={() => { navigator.clipboard?.writeText(referralCode); showToast('✓ Codice copiato!'); }} className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#008080' }}>📋 Copia codice</button>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {['Il tuo amico si registra su LeoMenu', `Inserisce il codice ${referralCode}`, 'Fa la sua prima scansione QR'].map((step, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: '#e6f4f4', color: '#008080' }}>{i + 1}</div>
                                                <span className="text-sm" style={{ color: '#1a1f2e' }}>{step}</span>
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: '#edfaf3', color: '#22c47a' }}>✓</div>
                                            <span className="text-sm font-semibold" style={{ color: '#22c47a' }}>Entrambi ricevete 50 Stelle!</span>
                                        </div>
                                    </div>
                                    <button onClick={() => showToast('✓ Link condiviso!')} className="w-full py-4 rounded-xl font-bold text-white" style={{ background: '#008080' }}>🔗 Condividi link</button>
                                </>}

                                {/* ── PRIVACY ── */}
                                {sub === 'privacy' && <>
                                    <div className="rounded-xl p-3.5 text-sm leading-relaxed" style={{ background: '#f0f4ff', border: '1px solid #c0d0ff', color: '#3050a0' }}>
                                        🇪🇺 In conformità con il Regolamento UE 2016/679 (GDPR), hai il pieno controllo dei tuoi dati personali.
                                    </div>
                                    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                                        {[
                                            { icon: '📥', bg: '#e8f4ff', title: 'Scarica i miei dati', desc: 'Ricevi un file con tutti i dati che LeoMenu conserva', action: () => showToast('📥 Download in preparazione…') },
                                            { icon: '📄', bg: '#f5f5f5', title: 'Informativa Privacy', desc: 'Leggi come trattiamo i tuoi dati', action: () => showToast('🔗 Link copiato!') },
                                            { icon: '📄', bg: '#f5f5f5', title: 'Termini di servizio', desc: 'Condizioni d\'uso della piattaforma', action: () => showToast('🔗 Link copiato!') },
                                            { icon: '⚙️', bg: '#fff3e0', title: 'Gestisci consensi', desc: 'Marketing, profilazione, dati di terze parti', action: () => showToast('✓ Consensi aggiornati!') },
                                        ].map((item, i) => (
                                            <button key={i} onClick={item.action} className="w-full flex items-center gap-3.5 px-4 py-4 border-b last:border-0 text-left" style={{ borderColor: '#e8ecf0' }}>
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: item.bg }}>{item.icon}</div>
                                                <div>
                                                    <div className="text-sm font-semibold" style={{ color: '#1a1f2e' }}>{item.title}</div>
                                                    <div className="text-xs mt-0.5" style={{ color: '#8492a6' }}>{item.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="rounded-xl p-4" style={{ background: '#fdf0f0', border: '1px solid #fcc' }}>
                                        <div className="font-bold text-sm mb-1.5" style={{ color: '#e05252' }}>Diritto all'oblio</div>
                                        <div className="text-xs leading-relaxed mb-2.5" style={{ color: '#c04040' }}>Puoi richiedere la cancellazione di tutti i tuoi dati. Questa azione è irreversibile.</div>
                                        <button onClick={() => setShowDeleteConfirm(true)} className="px-3.5 py-2 rounded-lg text-xs font-semibold" style={{ background: '#fdf0f0', border: '1px solid #e05252', color: '#e05252' }}>Richiedi cancellazione dati</button>
                                    </div>
                                </>}

                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── BOTTOM NAV — mobile only ───────────────────────────── */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50" style={{ borderColor: '#e8ecf0', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
                <div className="flex">
                    {([
                        { id: 'home' as Tab, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>, label: 'HOME' },
                        { id: 'premi' as Tab, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M20 12v10H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>, label: 'PREMI' },
                        { id: 'scopri' as Tab, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>, label: 'SCOPRI' },
                        { id: 'profilo' as Tab, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, label: 'PROFILO' },
                    ] as const).map(tab => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setActiveSubScreen(null); }}
                            className="flex-1 flex flex-col items-center gap-1 py-2 transition-colors"
                            style={{ color: activeTab === tab.id ? '#008080' : '#8492a6' }}>
                            {tab.icon}
                            <span className="text-[10px] font-bold" style={{ letterSpacing: '0.04em' }}>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── QR SELECTOR MODAL ─────────────────────────── */}
            {showQRSelector && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ background: 'rgba(10,15,25,0.85)', backdropFilter: 'blur(6px)', animation: 'fadeIn 0.25s' }} onClick={() => setShowQRSelector(false)}>
                    <div className="bg-white rounded-t-3xl w-full max-w-lg p-0 pb-11" style={{ animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)' }} onClick={e => e.stopPropagation()}>
                        <div className="w-9 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: '#e8ecf0' }} />
                        <div className="px-6 pb-2">
                            <div className="font-bold text-lg mb-1" style={{ color: '#1a1f2e' }}>Seleziona il ristorante</div>
                            <div className="text-sm mb-5 leading-relaxed" style={{ color: '#8492a6' }}>Il QR è specifico per ogni locale. Le Stelle vanno solo alla card di quel ristorante.</div>
                            {myRestaurants.length === 0 ? (
                                <p className="text-sm text-center py-4" style={{ color: '#8492a6' }}>Nessuna fidelity attiva. Vai su Scopri!</p>
                            ) : myRestaurants.map(r => (
                                <button key={r.id} onClick={() => { setQrRestaurant(r); setShowQRSelector(false); setShowQRModal(true); }}
                                    className="w-full flex items-center gap-3.5 p-4 rounded-xl mb-2.5 text-left transition-all hover:border-[#008080]"
                                    style={{ border: '2px solid #e8ecf0', background: '#fff' }}>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#e6f4f4', border: '1px solid #e8ecf0' }}>
                                        {r.logo_url ? <img src={r.logo_url} className="w-full h-full object-contain rounded-xl p-1" /> : r.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm" style={{ color: '#1a1f2e' }}>{r.name}</div>
                                        <div className="text-xs mt-0.5" style={{ color: '#8492a6' }}>{r.citta || 'Italia'}</div>
                                    </div>
                                    <span className="font-bold text-sm" style={{ color: getLevel(r.points).key === 'gold' ? '#f0a500' : getLevel(r.points).key === 'reserve' ? '#7c3aed' : '#22c47a' }}>
                                        {r.points} ⭐
                                    </span>
                                </button>
                            ))}
                            <div className="flex gap-2.5 items-start p-3.5 rounded-xl mt-1" style={{ background: '#fff8e6', border: '1px solid #f0c050' }}>
                                <span className="text-base flex-shrink-0">💡</span>
                                <div className="text-xs" style={{ color: '#c47f00', lineHeight: 1.5 }}>Le Stelle accumulate da ogni scansione vanno <strong>solo</strong> alla card del ristorante selezionato.</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── QR MODAL ─────────────────────────────────────── */}
            {showQRModal && qrRestaurant && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ background: 'rgba(10,15,25,0.85)', backdropFilter: 'blur(6px)', animation: 'fadeIn 0.25s' }} onClick={() => setShowQRModal(false)}>
                    <div className="bg-white rounded-t-3xl w-full max-w-lg px-7 pb-11" style={{ animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)' }} onClick={e => e.stopPropagation()}>
                        <div className="w-9 h-1 rounded-full mx-auto mt-3 mb-5" style={{ background: '#e8ecf0' }} />
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#e6f4f4', border: '1px solid #e8ecf0' }}>
                                {qrRestaurant.logo_url ? <img src={qrRestaurant.logo_url} className="w-full h-full object-contain rounded-xl p-1" /> : qrRestaurant.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-base" style={{ color: '#1a1f2e' }}>{qrRestaurant.name}</div>
                                <div className="text-xs" style={{ color: '#8492a6' }}>Mostra al cassiere per guadagnare Stelle</div>
                            </div>
                        </div>
                        <div className="flex justify-center mb-5">
                            <div className="relative p-4 rounded-2xl" style={{ border: '3px solid #008080' }}>
                                <QRCodeSVG value={`${user?.id}|${qrRestaurant.slug}`} size={200} fgColor="#008080" />
                                <div className="absolute left-5 right-5 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg,transparent,#008080,transparent)', animation: 'scanLine 2s ease-in-out infinite', top: 30 }} />
                            </div>
                        </div>
                        <div className="text-center text-sm mb-4" style={{ color: '#8492a6' }}>
                            Livello: <span style={{ fontWeight: 700, color: getLevel(qrRestaurant.points).key === 'gold' ? '#f0a500' : getLevel(qrRestaurant.points).key === 'reserve' ? '#7c3aed' : '#22c47a' }}>
                                {getLevel(qrRestaurant.points).label} {getLevel(qrRestaurant.points).emoji}
                            </span> · {qrRestaurant.points} Stelle
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-xs" style={{ background: '#e6f4f4', color: '#006666' }}>
                            <span>💡</span>
                            <span>Questo QR è valido <strong>solo per {qrRestaurant.name}</strong>. Le Stelle non si mescolano.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ADD RESTAURANT CONFIRM ────────────────────── */}
            {addModal.open && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" style={{ background: 'rgba(10,15,25,0.7)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s' }}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
                        <div className="flex flex-col items-center mb-5">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3 overflow-hidden" style={{ background: '#e6f4f4', border: '1px solid #e8ecf0' }}>
                                {addModal.logo ? <img src={addModal.logo} className="w-full h-full object-contain p-1" /> : '🍽️'}
                            </div>
                            <div className="text-lg font-black text-center" style={{ color: '#1a1f2e' }}>Aggiungi Fidelity?</div>
                            <div className="text-sm text-center mt-2 leading-relaxed" style={{ color: '#8492a6' }}>
                                Vuoi unirti al programma fedeltà di <strong style={{ color: '#1a1f2e' }}>{addModal.rname}</strong>?
                                Inizierai ad accumulare Stelle ad ogni visita.
                            </div>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={handleConfirmAddRestaurant}
                                disabled={addingRestaurant}
                                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                                style={{ background: '#008080' }}>
                                {addingRestaurant
                                    ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : '✓ Sì, aggiungi'}
                            </button>
                            <button onClick={() => setAddModal({ open: false, rid: '', rname: '', logo: '' })}
                                className="w-full py-3.5 rounded-xl font-semibold" style={{ background: '#f2f4f7', color: '#1a1f2e' }}>
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── LOGOUT CONFIRM ─────────────────────────────── */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" style={{ background: 'rgba(10,15,25,0.7)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s' }}>
                    <div className="bg-white rounded-2xl p-7 w-full max-w-sm" style={{ animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
                        <div className="text-5xl text-center mb-3">👋</div>
                        <div className="text-lg font-black text-center mb-2" style={{ color: '#1a1f2e' }}>Esci dall'app?</div>
                        <div className="text-sm text-center leading-relaxed mb-6" style={{ color: '#8492a6' }}>Potrai sempre rientrare con le tue credenziali. Le tue Stelle e i premi saranno al sicuro.</div>
                        <div className="flex flex-col gap-2.5">
                            <button onClick={() => { setShowLogoutConfirm(false); handleLogout(); }} className="w-full py-3.5 rounded-xl font-bold text-white" style={{ background: '#1a1f2e' }}>Sì, esci</button>
                            <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-3.5 rounded-xl font-semibold" style={{ background: '#f2f4f7', color: '#1a1f2e' }}>Annulla</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DELETE CONFIRM ─────────────────────────────── */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" style={{ background: 'rgba(10,15,25,0.7)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s' }}>
                    <div className="bg-white rounded-2xl p-7 w-full max-w-sm" style={{ animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
                        <div className="text-5xl text-center mb-3">⚠️</div>
                        <div className="text-lg font-black text-center mb-2" style={{ color: '#1a1f2e' }}>Eliminare l'account?</div>
                        <div className="text-sm text-center leading-relaxed mb-6" style={{ color: '#8492a6' }}>Questa azione è <strong>irreversibile</strong>. Perderai tutte le Stelle, i premi e la cronologia. I tuoi dati saranno cancellati entro 30 giorni (GDPR).</div>
                        <div className="flex flex-col gap-2.5">
                            <button onClick={() => { setShowDeleteConfirm(false); handleDeleteCustomerAccount(); }} className="w-full py-3.5 rounded-xl font-bold text-white" style={{ background: '#e05252' }}>Elimina definitivamente</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-3.5 rounded-xl font-semibold" style={{ background: '#f2f4f7', color: '#1a1f2e' }}>Annulla</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REMOVE AFFILIATION CONFIRM ─────────────────── */}
            {removeModal.open && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6" style={{ background: 'rgba(10,15,25,0.7)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s' }}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#fdf0f0' }}>🗑️</div>
                        <div className="text-lg font-black text-center mb-2" style={{ color: '#1a1f2e' }}>Rimuovi Affiliazione</div>
                        <p className="text-sm text-center leading-relaxed mb-6" style={{ color: '#8492a6' }}>
                            Sei sicuro di voler rimuovere <strong style={{ color: '#1a1f2e' }}>{removeModal.rname}</strong>?<br />
                            <span style={{ color: '#e05252' }}>Perderai tutte le stelle accumulate.</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setRemoveModal({ open: false, rid: '', rname: '' })} className="flex-1 py-3.5 rounded-xl font-bold" style={{ background: '#f2f4f7', color: '#8492a6' }}>Annulla</button>
                            <button onClick={() => {
                                const removed = myRestaurants.find(r => r.id === removeModal.rid);
                                handleRemoveAffiliation(removeModal.rid);
                                if (removed) setAllRestaurants(prev => [...prev, { id: removed.id, name: removed.name, slug: removed.slug, citta: removed.citta, logo_url: removed.logo_url, cover_url: '' }]);
                                setRemoveModal({ open: false, rid: '', rname: '' });
                                showToast('Affiliazione rimossa');
                            }}
                                className="flex-1 py-3.5 rounded-xl font-bold text-white" style={{ background: '#008080' }}>Rimuovi</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── AVATAR CROP MODAL ──────────────────────────── */}
            {showCropModal && (
                <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: 'rgba(10,15,25,0.9)', animation: 'fadeIn 0.2s' }}>
                    <div className="bg-white rounded-t-3xl w-full max-w-lg px-6 pb-11" style={{ animation: 'slideUp 0.3s ease' }}>
                        <div className="w-9 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: '#e8ecf0' }} />
                        <div className="font-bold text-base text-center mb-1" style={{ color: '#1a1f2e' }}>Riposiziona la foto</div>
                        <div className="text-xs text-center mb-4" style={{ color: '#8492a6' }}>Usa gli slider per inquadrare il tuo viso</div>
                        <div className="w-40 h-40 rounded-full mx-auto mb-4 overflow-hidden" style={{ border: '3px solid #008080' }}>
                            <img src={avatarSrc} style={{ width: '200%', height: '200%', objectFit: 'cover', transform: `scale(${cropZoom / 100}) translateY(${cropOffsetY}px)`, transformOrigin: 'center' }} />
                        </div>
                        {[
                            { label: '🔍 Zoom', value: cropZoom, min: 100, max: 220, set: setCropZoom },
                            { label: '↕ Verticale', value: cropOffsetY, min: -60, max: 60, set: setCropOffsetY },
                        ].map(s => (
                            <div key={s.label} className="flex items-center gap-3 mb-3">
                                <span className="text-xs w-20 flex-shrink-0" style={{ color: '#8492a6' }}>{s.label}</span>
                                <input type="range" min={s.min} max={s.max} value={s.value} onChange={e => s.set(Number(e.target.value))}
                                    className="flex-1" style={{ accentColor: '#008080' }} />
                            </div>
                        ))}
                        <div className="flex gap-2.5 mt-4">
                            <button onClick={() => setShowCropModal(false)} className="flex-1 py-3.5 rounded-xl font-semibold" style={{ background: '#f2f4f7', color: '#1a1f2e' }}>Annulla</button>
                            <button onClick={() => { setShowCropModal(false); showToast('✓ Foto aggiornata!'); }} className="flex-1 py-3.5 rounded-xl font-bold text-white" style={{ background: '#008080' }}>Applica</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TOAST ──────────────────────────────────────── */}
            {toast && (
                <div className="fixed z-[500] bottom-24 md:bottom-8 left-1/2 md:left-[calc(50%+8rem)] -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-medium text-white whitespace-nowrap" style={{ background: '#1a1f2e', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', animation: 'fadeIn 0.2s ease' }}>
                    {toast}
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes slideUp { from { transform:translateY(60px); opacity:0 } to { transform:translateY(0); opacity:1 } }
                @keyframes scaleIn { from { transform:scale(0.85); opacity:0 } to { transform:scale(1); opacity:1 } }
                @keyframes scanLine { 0%{top:30px;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:calc(100% - 30px);opacity:0} }
                ::-webkit-scrollbar { display:none }
            `}</style>
        </div>
        </div>
    );
}

// ── MiniToggle ────────────────────────────────────────────────────────────────

function MiniToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!on)}
            className="relative flex-shrink-0"
            style={{ width: 44, height: 26, borderRadius: 13, background: on ? '#008080' : '#d1d5db', transition: 'background 0.25s ease', border: 'none', outline: 'none', cursor: 'pointer', overflow: 'hidden' }}
        >
            <span
                style={{
                    position: 'absolute',
                    top: 3,
                    left: on ? 21 : 3,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    transition: 'left 0.25s ease',
                }}
            />
        </button>
    );
}
