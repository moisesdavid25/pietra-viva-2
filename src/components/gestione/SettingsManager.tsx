import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, ChevronRight, ArrowLeft, BookOpen, Upload,
  Trash2, Save, Phone, Link2, Music, MapPin,
  Clock, Wifi, FileText, Eye, EyeOff, Copy, QrCode, Globe, CreditCard,
  Store, Image, User, Shield, Bell, Receipt, Lock, Mail, Volume2,
  Smartphone, CheckCircle2, HelpCircle, Calendar, Hash, Monitor,
} from 'lucide-react';
import { listActiveSessions, revokeAllOtherSessions, type ActiveSession } from '../../lib/sessionSecurity';
import { QRCodeSVG } from 'qrcode.react';
import db from '../../db';
import ImageCropperModal from '../ImageCropperModal';
import { useToast } from '../Toast';
import { useStripeCheckout, type PlanKey } from '../../hooks/useStripeCheckout';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SettingsManagerProps {
  restaurantId: string;
  restaurantSlug: string;
  initialRestaurantName: string;
  subscriptionTier: string;
  onLogout: () => void;
  onViewChange?: (v: string) => void;
}

interface DayHours { open: string; close: string; closed: boolean; }
type WeekHours = Record<string, DayHours>;
type ViewKey =
  | 'list'
  // Il mio locale
  | 'locale' | 'social' | 'orari'
  // Servizi
  | 'coperto' | 'wifi'
  // Strumenti
  | 'condividi'
  // Il mio account
  | 'dati_account' | 'sicurezza' | 'notifiche' | 'fatture' | 'assistenza'
  // Altro
  | 'fiscale';

const DAYS = [
  { key: 'lun', label: 'Lunedì' }, { key: 'mar', label: 'Martedì' },
  { key: 'mer', label: 'Mercoledì' }, { key: 'gio', label: 'Giovedì' },
  { key: 'ven', label: 'Venerdì' }, { key: 'sab', label: 'Sabato' },
  { key: 'dom', label: 'Domenica' },
];
const DEFAULT_HOURS: WeekHours = Object.fromEntries(
  DAYS.map(({ key }) => [key, { open: '12:00', close: '22:00', closed: false }])
);

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024;

const INPUT_CLS = 'w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#008081]/40 focus:border-[#008081] transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600';
const LABEL_CLS = 'block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5';

const PLANS: { key: PlanKey; label: string; price: string; period: string; badge: string | null }[] = [
  { key: 'mensile',    label: 'Mensile',    price: '€29', period: '/mese', badge: null },
  { key: 'semestrale', label: 'Semestrale', price: '€22', period: '/mese', badge: '-24%' },
  { key: 'annuale',    label: 'Annuale',    price: '€17', period: '/mese', badge: '-41%' },
];

// ── Shared UI primitives ──────────────────────────────────────────────────────

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-5 pt-7 pb-2">
      {children}
    </p>
  );
}

function SettingRow({
  icon: Icon, title, subtitle, right, onClick, danger = false, last = false,
  iconBg, iconColor,
}: {
  icon: React.ElementType; title: string; subtitle?: string;
  right?: React.ReactNode; onClick?: () => void;
  danger?: boolean; last?: boolean;
  iconBg?: string; iconColor?: string;
}) {
  const defaultIconBg = danger ? '#fff1f2' : '#E6F4F4';
  const defaultIconColor = danger ? '#ef4444' : '#008081';
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center gap-3 px-4 py-[14px] bg-white dark:bg-[#1A1A1A] transition-colors text-left relative
        ${onClick ? 'hover:bg-gray-50/60 dark:hover:bg-[#252525] active:bg-gray-100 dark:active:bg-[#202020]' : 'cursor-default'}
        ${!last ? 'border-b border-gray-100 dark:border-white/[0.04]' : ''}`}
    >
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg || defaultIconBg }}
      >
        <Icon className="w-[18px] h-[18px]" style={{ color: iconColor || defaultIconColor }} />
      </div>
      <div className="flex-grow min-w-0">
        <p className={`text-[14px] font-semibold leading-tight truncate
          ${danger ? 'text-red-600 dark:text-red-400' : 'text-[#111827] dark:text-white'}`}>
          {title}
        </p>
        {subtitle && (
          <p className="text-[11.5px] text-[#9ca3af] truncate mt-[1px] font-medium">{subtitle}</p>
        )}
      </div>
      {right !== undefined ? (
        <div className="flex-shrink-0">{right}</div>
      ) : onClick ? (
        <ChevronRight className="w-4 h-4 flex-shrink-0 text-[#d1d5db] dark:text-gray-600" />
      ) : null}
    </button>
  );
}

function SubPageHeader({
  title, onBack, onSave, saving,
}: { title: string; onBack: () => void; onSave?: () => void; saving?: boolean }) {
  return (
    <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5 flex items-center gap-3 px-4 h-14 flex-shrink-0">
      <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
        <ArrowLeft className="w-5 h-5 text-[#008081]" />
      </button>
      <h2 className="flex-grow font-black text-sm tracking-widest uppercase text-[#1A1A1A] dark:text-white">
        {title}
      </h2>
      {onSave && (
        <button onClick={onSave} disabled={saving}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm transition-all
            ${saving ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 cursor-not-allowed' : 'bg-[#008081] text-white hover:bg-[#006666] active:scale-95'}`}>
          <Save className="w-3.5 h-3.5" />{saving ? 'Salvataggio...' : 'Salva'}
        </button>
      )}
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0
        ${enabled ? 'bg-[#008081]' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200
        ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SettingsManager({
  restaurantId, restaurantSlug, initialRestaurantName, subscriptionTier, onLogout, onViewChange,
}: SettingsManagerProps) {
  const { showToast, ToastContainer } = useToast();
  const { startCheckout, loading: checkoutLoading, error: checkoutError } = useStripeCheckout();

  // ── Navigation ───────────────────────────────────────────────────────────
  const [view, _setView] = useState<ViewKey>('list');
  const setView = (v: ViewKey) => { _setView(v); onViewChange?.(v); };

  // ── Restaurant settings ──────────────────────────────────────────────────
  const [restaurantName, setRestaurantName] = useState(initialRestaurantName);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [weekHours, setWeekHours] = useState<WeekHours>(DEFAULT_HOURS);

  // ── Account / Auth ───────────────────────────────────────────────────────
  const [accountEmail, setAccountEmail] = useState('');
  const [accountOwner, setAccountOwner] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailVerifyPwd, setEmailVerifyPwd] = useState('');
  const [showEmailVerifyPwd, setShowEmailVerifyPwd] = useState(false);
  const [emailChangeSent, setEmailChangeSent] = useState(false);

  // ── Extended account fields ──────────────────────────────────────────────
  const [accountNome, setAccountNome] = useState('');
  const [accountCognome, setAccountCognome] = useState('');
  const [accountDOB, setAccountDOB] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [accountCAP, setAccountCAP] = useState('');
  const [accountRegione, setAccountRegione] = useState('');

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [wifiVisible, setWifiVisible] = useState(false);

  // ── Active sessions (Fix #3) ──────────────────────────────────────────────
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);

  const loadSessions = async () => {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;
    setSessionsLoading(true);
    const list = await listActiveSessions(user.id);
    setSessions(list);
    setSessionsLoading(false);
  };

  const handleRevokeAllSessions = async () => {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;
    setRevokingAll(true);
    try {
      await revokeAllOtherSessions(user.id);
      showToast('✅ Sessioni revocate. Gli altri dispositivi verranno disconnessi.', 'success');
      await loadSessions();
    } catch {
      showToast('❌ Errore durante la revoca', 'error');
    } finally {
      setRevokingAll(false);
    }
  };
  const [cropperState, setCropperState] = useState<{
    src: string | null; aspect: number; callback: ((b64: string) => void) | null;
  }>({ src: null, aspect: 1, callback: null });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ── Data loading ─────────────────────────────────────────────────────────
  useEffect(() => { setRestaurantName(initialRestaurantName); }, [initialRestaurantName]);

  useEffect(() => {
    if (!restaurantId) return;
    db.from('settings').select('key,value').eq('restaurant_id', restaurantId).then(({ data }) => {
      if (data && data.length > 0) {
        const obj: Record<string, string> = {};
        for (const row of data) { if (row.key) obj[row.key] = row.value ?? ''; }
        setSettings(obj);
        if (obj.opening_hours) {
          try { setWeekHours(JSON.parse(obj.opening_hours)); } catch { /* use default */ }
        }
        if (obj.owner_name) setAccountOwner(obj.owner_name);
        if (obj.account_nome) setAccountNome(obj.account_nome);
        if (obj.account_cognome) setAccountCognome(obj.account_cognome);
        if (obj.account_dob) setAccountDOB(obj.account_dob);
        if (obj.account_phone) setAccountPhone(obj.account_phone);
        if (obj.account_cap) setAccountCAP(obj.account_cap);
        if (obj.account_regione) setAccountRegione(obj.account_regione);
      }
    });
    // Load auth user email
    db.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setAccountEmail(data.user.email);
    });
  }, [restaurantId]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_SIZE) { showToast('❌ Immagine troppo grande. Max 2 MB', 'error'); return false; }
    if (!ALLOWED_TYPES.includes(file.type)) { showToast('❌ Formato non supportato. Usa PNG, JPG o WebP', 'error'); return false; }
    return true;
  };

  const openCropper = (file: File, aspect: number, callback: (b64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => setCropperState({ src: e.target?.result as string, aspect, callback });
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, label = 'Copiato!') => {
    navigator.clipboard.writeText(text).then(() => showToast(`✓ ${label}`, 'success'));
  };

  const pivaValid = !settings.piva || /^(IT)?\d{11}$/.test(settings.piva.trim());
  const sdiValid = !settings.codice_sdi || settings.codice_sdi.trim().length === 7;

  // Save restaurant settings
  const handleSave = async () => {
    setIsSaving(true);
    await db.from('restaurants').update({ name: restaurantName }).eq('id', restaurantId);
    const safeSettings: Record<string, string> = { ...settings };
    delete (safeSettings as Record<string, unknown>).id;
    delete (safeSettings as Record<string, unknown>).restaurant_id;
    delete (safeSettings as Record<string, unknown>).key;
    delete (safeSettings as Record<string, unknown>).value;
    safeSettings.opening_hours = JSON.stringify(weekHours);
    safeSettings.owner_name = accountOwner;
    const rows = Object.entries(safeSettings).filter(([k]) => !!k)
      .map(([key, value]) => ({ restaurant_id: restaurantId, key, value: String(value ?? '') }));
    const { error } = await db.from('settings').upsert(rows, { onConflict: 'restaurant_id,key' });
    setIsSaving(false);
    if (!error) { showToast('✅ Impostazioni salvate!', 'success'); setView('list'); }
    else showToast('❌ Errore: ' + error.message, 'error');
  };

  // Save account data
  const handleSaveAccount = async () => {
    setIsSaving(true);
    const fullName = [accountNome, accountCognome].filter(Boolean).join(' ');
    const rows = [
      { restaurant_id: restaurantId, key: 'owner_name',      value: fullName },
      { restaurant_id: restaurantId, key: 'account_nome',    value: accountNome },
      { restaurant_id: restaurantId, key: 'account_cognome', value: accountCognome },
      { restaurant_id: restaurantId, key: 'account_dob',     value: accountDOB },
      { restaurant_id: restaurantId, key: 'account_phone',   value: accountPhone },
      { restaurant_id: restaurantId, key: 'account_cap',     value: accountCAP },
      { restaurant_id: restaurantId, key: 'account_regione', value: accountRegione },
    ];
    await db.from('settings').upsert(rows, { onConflict: 'restaurant_id,key' });
    if (fullName) setAccountOwner(fullName);
    if (newEmail && newEmail !== accountEmail) {
      const { error } = await db.auth.updateUser({ email: newEmail });
      if (error) { showToast('❌ ' + error.message, 'error'); setIsSaving(false); return; }
      showToast('✅ Email aggiornata — controlla la tua casella per confermare.', 'success');
      setAccountEmail(newEmail); setNewEmail('');
    } else {
      showToast('✅ Dati account salvati!', 'success');
    }
    setIsSaving(false);
    setView('list');
  };

  // Change password (verifies current password first)
  const handleChangePassword = async () => {
    if (!currentPassword) { showToast('❌ Inserisci la password attuale.', 'error'); return; }
    if (!newPassword || newPassword.length < 8) { showToast('❌ La nuova password deve essere di almeno 8 caratteri.', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('❌ Le password non coincidono.', 'error'); return; }
    setIsSaving(true);
    // Verify current password by re-signing in
    const { error: verifyErr } = await db.auth.signInWithPassword({ email: accountEmail, password: currentPassword });
    if (verifyErr) { showToast('❌ Password attuale non corretta.', 'error'); setIsSaving(false); return; }
    const { error } = await db.auth.updateUser({ password: newPassword });
    setIsSaving(false);
    if (error) { showToast('❌ ' + error.message, 'error'); return; }
    showToast('✅ Password aggiornata con successo!', 'success');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setView('list');
  };

  // Change email (requires current password verification)
  const handleChangeEmail = async () => {
    if (!emailVerifyPwd) { showToast('❌ Inserisci la tua password attuale per continuare.', 'error'); return; }
    if (!newEmail || newEmail === accountEmail) { showToast('❌ Inserisci un nuovo indirizzo email.', 'error'); return; }
    setIsSaving(true);
    const { error: verifyErr } = await db.auth.signInWithPassword({ email: accountEmail, password: emailVerifyPwd });
    if (verifyErr) { showToast('❌ Password non corretta.', 'error'); setIsSaving(false); return; }
    const { error } = await db.auth.updateUser({ email: newEmail });
    setIsSaving(false);
    if (error) { showToast('❌ ' + error.message, 'error'); return; }
    setEmailChangeSent(true);
    showToast('✅ Controlla la nuova email per confermare il cambio.', 'success');
  };

  // Send password reset email
  const handleResetPassword = async () => {
    const email = resetEmail || accountEmail;
    if (!email) { showToast('❌ Inserisci il tuo indirizzo email.', 'error'); return; }
    setIsSaving(true);
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSaving(false);
    if (error) { showToast('❌ ' + error.message, 'error'); return; }
    setResetSent(true);
    showToast('✅ Email inviata! Controlla la tua casella.', 'success');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.')) return;
    if (!window.confirm('CONFERMA FINALE: Tutti i dati verranno eliminati permanentemente. Procedere?')) return;
    try {
      if (restaurantId) await db.from('restaurants').delete().eq('id', restaurantId);
      onLogout();
    } catch (err: unknown) {
      showToast('❌ Errore: ' + (err instanceof Error ? err.message : String(err)), 'error');
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById(`qr-${restaurantSlug}`);
    if (!svg) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
      const pad = 40;
      canvas.width = img.width + pad * 2; canvas.height = img.height + pad * 2;
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, pad, pad, img.width, img.height);
      ctx.fillStyle = '#000000'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('INQUADRA E ORDINA', canvas.width / 2, pad / 1.5);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `Menu_QR_${restaurantSlug}.png`;
      a.href = canvas.toDataURL('image/png'); a.click();
    };
    img.src = url;
  };

  // ── Preview helpers ───────────────────────────────────────────────────────

  const todayKey = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'][new Date().getDay()];
  const todayHours = weekHours[todayKey];
  const orariPreview = todayHours?.closed
    ? 'Oggi: Chiuso'
    : `Oggi: ${todayHours?.open ?? ''}–${todayHours?.close ?? ''}`;

  const copertoPreview = parseFloat(settings.coperto_price || '0') > 0
    ? `€${parseFloat(settings.coperto_price).toFixed(2)} / persona`
    : 'Non impostato';

  const menuGiornoEnabled = settings.menu_del_giorno_enabled === 'true';

  const notifyOrders = settings.notify_new_orders !== 'false';
  const notifySound  = settings.notify_order_sound !== 'false';
  const notifyEmail  = settings.notify_email_orders === 'true';

  const saveNotifPref = async (key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }));
    await db.from('settings').upsert(
      { restaurant_id: restaurantId, key, value },
      { onConflict: 'restaurant_id,key' }
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'list') {

    const initials = (restaurantName || 'R').slice(0, 2).toUpperCase();

    return (
      <div className="w-full max-w-2xl mx-auto pb-8">

        {/* ── Profile card ─────────────────────────────────────────────────── */}
        <div className="mx-4 mt-4 relative overflow-hidden rounded-[18px] p-5"
          style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
          {/* decorative circles */}
          <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="absolute right-5 -bottom-8 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center font-black text-xl text-white flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.25)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-black text-white truncate leading-tight">{restaurantName}</h3>
              <p className="text-[12px] text-white/75 mt-0.5 truncate">{accountEmail || '—'}</p>
              <div className="flex items-center gap-1.5 mt-1.5 bg-white/[0.18] rounded-full px-2.5 py-1 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86efac] animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-semibold text-white">{orariPreview || 'Aperto'}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/50 flex-shrink-0" />
          </div>
        </div>

        {/* ── Upgrade banner (only on trial) ───────────────────────────────── */}
        {subscriptionTier === 'trial' && (
          <button
            onClick={() => setView('fatture')}
            className="mx-4 mt-3 w-[calc(100%-32px)] flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-left"
            style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #fcd34d' }}
          >
            <div className="w-[38px] h-[38px] rounded-[10px] bg-amber-500 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-amber-900">Piano Trial attivo</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Sblocca tutte le funzionalità</p>
            </div>
            <span className="flex-shrink-0 bg-amber-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">Attiva ora</span>
          </button>
        )}

        {/* ── Il tuo locale ── */}
        <GroupLabel>Il tuo locale</GroupLabel>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-[16px] overflow-hidden border border-[#f0f1f3] dark:border-white/5 mx-4">
          <SettingRow icon={Store} title="Pagina del Locale"
            subtitle={restaurantName || 'Nome, logo e copertina'}
            iconBg="#eff6ff" iconColor="#3b82f6"
            right={<div className="flex items-center gap-2">
              <span className="text-[9.5px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Live</span>
              <ChevronRight className="w-4 h-4 text-[#d1d5db]" />
            </div>}
            onClick={() => setView('locale')} />
          <SettingRow icon={Link2} title="Link & Social"
            subtitle={settings.phone_number || 'Telefono, Instagram, Maps…'}
            iconBg="#faf5ff" iconColor="#9333ea"
            onClick={() => setView('social')} />
          <SettingRow icon={Clock} title="Orari di Apertura"
            subtitle={orariPreview}
            iconBg="#fff7ed" iconColor="#f97316"
            onClick={() => setView('orari')} last />
        </div>

        {/* ── Servizi ── */}
        <GroupLabel>Servizi</GroupLabel>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-[16px] overflow-hidden border border-[#f0f1f3] dark:border-white/5 mx-4">
          <SettingRow icon={CreditCard} title="Coperto / Servizio"
            subtitle={copertoPreview}
            iconBg="#f0fdf4" iconColor="#16a34a"
            onClick={() => setView('coperto')} />
          <SettingRow icon={Wifi} title="WiFi Ospiti"
            subtitle={settings.wifi_ssid || 'Rete e password'}
            iconBg="#eff6ff" iconColor="#3b82f6"
            onClick={() => setView('wifi')} />
          <SettingRow icon={BookOpen} title="Menù del Giorno"
            subtitle={menuGiornoEnabled ? 'Visibile ai clienti' : 'Non attivo'}
            iconBg="#fefce8" iconColor="#ca8a04"
            right={
              <Toggle enabled={menuGiornoEnabled} onToggle={async () => {
                const newVal = menuGiornoEnabled ? 'false' : 'true';
                setSettings(s => ({ ...s, menu_del_giorno_enabled: newVal }));
                await db.from('settings').upsert(
                  { restaurant_id: restaurantId, key: 'menu_del_giorno_enabled', value: newVal },
                  { onConflict: 'restaurant_id,key' }
                );
                showToast(newVal === 'true' ? 'Menù del Giorno attivato' : 'Menù del Giorno disattivato');
              }} />
            } last />
        </div>

        {/* ── Strumenti ── */}
        <GroupLabel>Strumenti</GroupLabel>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-[16px] overflow-hidden border border-[#f0f1f3] dark:border-white/5 mx-4">
          <SettingRow icon={Globe} title="Condividi Menù"
            subtitle={`leomenu.it/${restaurantSlug}`}
            iconBg="#f0fdfa" iconColor="#0d9488"
            onClick={() => setView('condividi')} last />
        </div>

        {/* ── Il mio account ── */}
        <GroupLabel>Il mio account</GroupLabel>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-[16px] overflow-hidden border border-[#f0f1f3] dark:border-white/5 mx-4">
          <SettingRow icon={User} title="Dati Account"
            subtitle={accountEmail || 'Email e nome titolare'}
            iconBg="#eff6ff" iconColor="#3b82f6"
            onClick={() => setView('dati_account')} />
          <SettingRow icon={Shield} title="Sicurezza"
            subtitle="Password e accessi"
            iconBg="#f0fdf4" iconColor="#16a34a"
            onClick={() => setView('sicurezza')} />
          <SettingRow icon={Bell} title="Notifiche"
            subtitle={notifyOrders ? 'Notifiche attive' : 'Notifiche disattivate'}
            iconBg="#fff7ed" iconColor="#f97316"
            onClick={() => setView('notifiche')} />
          <SettingRow icon={Receipt} title="Fatture & Pagamenti"
            subtitle={subscriptionTier === 'trial' ? 'Piano Trial' : `Piano ${subscriptionTier}`}
            iconBg="#fff7ed" iconColor="#f97316"
            right={<div className="flex items-center gap-2">
              {subscriptionTier === 'trial' && <span className="text-[9.5px] font-bold bg-red-100 text-red-500 px-2 py-0.5 rounded-full">Upgrade</span>}
              <ChevronRight className="w-4 h-4 text-[#d1d5db]" />
            </div>}
            onClick={() => setView('fatture')} />
          <SettingRow icon={HelpCircle} title="Contatta l'Assistenza"
            subtitle="Supporto LeoMenu"
            iconBg="#f0fdfa" iconColor="#0d9488"
            onClick={() => setView('assistenza')} last />
        </div>

        {/* ── Dati Fiscali ── */}
        <GroupLabel>Dati Fiscali</GroupLabel>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-[16px] overflow-hidden border border-[#f0f1f3] dark:border-white/5 mx-4">
          <SettingRow icon={FileText} title="Dati Fiscali"
            subtitle={settings.ragione_sociale || 'P.IVA, SDI, PEC…'}
            iconBg="#faf5ff" iconColor="#9333ea"
            onClick={() => setView('fiscale')} last />
        </div>

        {/* ── Esci ── */}
        <div className="mx-4 mt-5 bg-white dark:bg-[#1A1A1A] rounded-[16px] overflow-hidden border border-[#f0f1f3] dark:border-white/5">
          <SettingRow icon={Lock} title="Esci dall'account"
            iconBg="#fff1f2" iconColor="#ef4444"
            danger onClick={onLogout} last />
        </div>

        <p className="text-center text-[10px] text-[#d1d5db] dark:text-gray-600 mt-6 pb-2">LeoMenu · v2.0</p>
        <ToastContainer />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── SUB-PAGES: IL TUO LOCALE ──────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'locale') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="Pagina del Locale" onBack={() => setView('list')} onSave={handleSave} saving={isSaving} />
        <div className="px-5 py-6 space-y-6">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profilo</p>
            <div>
              <label className={LABEL_CLS}>Nome del Negozio</label>
              <input type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)}
                placeholder="Es. Pizzeria Bella Napoli" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Frase / Sottotitolo</label>
              <input type="text" value={settings.restaurant_subtitle || ''} onChange={e => setSettings({ ...settings, restaurant_subtitle: e.target.value })}
                placeholder="Es. L'arte della vera pizza" className={INPUT_CLS} />
              <p className="text-[10px] text-gray-400 mt-1">Sostituisce "Menu Digitale" in homepage.</p>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-white/5" />
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Immagine circolare mostrata in testata (ritaglio 1:1).</p>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0]; if (!file) return; e.target.value = '';
              if (!validateFile(file)) return;
              openCropper(file, 1, b64 => setSettings({ ...settings, logo_url: b64 }));
            }} />
            <button onClick={() => logoInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#008081] text-[#008081] font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all w-full justify-center">
              <Upload className="w-4 h-4" /> Carica Logo
            </button>
            {settings.logo_url && (
              <div className="flex justify-center">
                <img src={settings.logo_url} alt="Logo" className="h-24 w-24 object-contain rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white shadow-sm" />
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 dark:border-white/5" />
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Foto di Copertina</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Immagine panoramica 16:9 mostrata in cima alla home.</p>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0]; if (!file) return; e.target.value = '';
              if (!validateFile(file)) return;
              openCropper(file, 16 / 9, b64 => setSettings({ ...settings, cover_image_url: b64 }));
            }} />
            <button onClick={() => coverInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#008081] text-[#008081] font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all w-full justify-center">
              <Camera className="w-4 h-4" /> Carica Copertina
            </button>
            {settings.cover_image_url && (
              <img src={settings.cover_image_url} alt="Cover" className="w-full h-36 object-cover rounded-2xl border border-gray-200 dark:border-gray-700" />
            )}
          </div>
        </div>
        <ImageCropperModal imageSrc={cropperState.src} aspect={cropperState.aspect}
          onConfirm={b64 => { if (cropperState.callback) cropperState.callback(b64); setCropperState({ src: null, aspect: 1, callback: null }); }}
          onCancel={() => setCropperState({ src: null, aspect: 1, callback: null })} />
        <ToastContainer />
      </div>
    );
  }

  if (view === 'social') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="Link & Social" onBack={() => setView('list')} onSave={handleSave} saving={isSaving} />
        <div className="px-5 py-6 space-y-4">
          {([
            { key: 'phone_number',      label: 'Telefono',    Icon: Phone,  type: 'tel', placeholder: '+39 02 1234567' },
            { key: 'instagram_url',     label: 'Instagram',   Icon: Image,  type: 'url', placeholder: 'https://instagram.com/tuolocale' },
            { key: 'facebook_url',      label: 'Facebook',    Icon: Link2,  type: 'url', placeholder: 'https://facebook.com/tuolocale' },
            { key: 'tiktok_url',        label: 'TikTok',      Icon: Music,  type: 'url', placeholder: 'https://tiktok.com/@tuolocale' },
            { key: 'google_maps_url',   label: 'Google Maps', Icon: MapPin, type: 'url', placeholder: 'https://maps.app.goo.gl/...' },
            { key: 'tripadvisor_url',   label: 'TripAdvisor', Icon: Globe,  type: 'url', placeholder: 'https://tripadvisor.it/Restaurant_Review-...' },
          ] as const).map(({ key, label, Icon, type, placeholder }) => (
            <div key={key}>
              <label className={LABEL_CLS}><span className="inline-flex items-center gap-1.5"><Icon className="w-3 h-3 text-[#008081]" />{label}</span></label>
              <input type={type} value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                placeholder={placeholder} className={INPUT_CLS} />
            </div>
          ))}
        </div>
        <ToastContainer />
      </div>
    );
  }

  if (view === 'orari') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="Orari di Apertura" onBack={() => setView('list')} onSave={handleSave} saving={isSaving} />
        <div className="px-5 py-6">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
            {DAYS.map(({ key, label }, i) => {
              const day = weekHours[key] ?? { open: '12:00', close: '22:00', closed: false };
              return (
                <div key={key} className={`flex items-center gap-3 px-5 py-3.5 ${i < DAYS.length - 1 ? 'border-b border-gray-100 dark:border-white/[0.04]' : ''}`}>
                  <span className="w-24 text-sm font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">{label}</span>
                  <div onClick={() => setWeekHours(p => ({ ...p, [key]: { ...day, closed: !day.closed } }))}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${day.closed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-[#008081]'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${day.closed ? 'translate-x-0.5' : 'translate-x-[18px]'}`} />
                  </div>
                  {day.closed ? (
                    <span className="text-xs font-bold text-gray-400 ml-1">Chiuso</span>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={day.open} onChange={e => setWeekHours(p => ({ ...p, [key]: { ...day, open: e.target.value } }))}
                        className="flex-1 px-2 py-1.5 text-xs font-bold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-[#008081]/40 focus:border-[#008081] outline-none transition-all" />
                      <span className="text-xs text-gray-400 font-bold">→</span>
                      <input type="time" value={day.close} onChange={e => setWeekHours(p => ({ ...p, [key]: { ...day, close: e.target.value } }))}
                        className="flex-1 px-2 py-1.5 text-xs font-bold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-[#008081]/40 focus:border-[#008081] outline-none transition-all" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  if (view === 'wifi') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="WiFi Ospiti" onBack={() => setView('list')} onSave={handleSave} saving={isSaving} />
        <div className="px-5 py-6 space-y-4">
          <div>
            <label className={LABEL_CLS}>Nome Rete (SSID)</label>
            <input type="text" value={settings.wifi_ssid || ''} onChange={e => setSettings({ ...settings, wifi_ssid: e.target.value })}
              placeholder="Es. Ristorante_Guest" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Password WiFi</label>
            <div className="relative">
              <input type={wifiVisible ? 'text' : 'password'} value={settings.wifi_password || ''}
                onChange={e => setSettings({ ...settings, wifi_password: e.target.value })}
                placeholder="Es. benvenuto2024" className={`${INPUT_CLS} pr-20`} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <button type="button" onClick={() => setWifiVisible(v => !v)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {wifiVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => copyToClipboard(settings.wifi_password || '', 'Password copiata!')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#008081] transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Visibile solo a te — condividi a voce con i clienti.</p>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  if (view === 'coperto') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="Coperto / Servizio" onBack={() => setView('list')} />
        <div className="px-5 py-6 space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Importo addebitato per persona seduta al tavolo. Impostalo a <strong>0</strong> per disabilitarlo.
          </p>
          <div className="max-w-[200px]">
            <label className={LABEL_CLS}>Prezzo a persona (€)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">€</span>
              <input type="number" min="0" step="0.50" value={settings.coperto_price || '0'}
                onChange={e => setSettings({ ...settings, coperto_price: e.target.value })}
                onBlur={async () => {
                  const val = parseFloat(settings.coperto_price || '0') || 0;
                  const normalized = val.toFixed(2);
                  setSettings(s => ({ ...s, coperto_price: normalized }));
                  await db.from('settings').upsert(
                    { restaurant_id: restaurantId, key: 'coperto_price', value: normalized },
                    { onConflict: 'restaurant_id,key' }
                  );
                  showToast('Coperto aggiornato');
                }}
                className={`${INPUT_CLS} pl-7`} placeholder="0.00" />
            </div>
          </div>
          {parseFloat(settings.coperto_price || '0') > 0 && (
            <div className="flex items-center gap-2 text-sm font-bold text-[#008081] bg-[#008081]/5 border border-[#008081]/20 rounded-2xl px-4 py-3">
              <CreditCard className="w-4 h-4 shrink-0" />
              Es. tavolo con 4 persone → coperto €{(parseFloat(settings.coperto_price) * 4).toFixed(2)}
            </div>
          )}
          <p className="text-[10px] text-gray-400">Il valore si salva automaticamente all'uscita dal campo.</p>
        </div>
        <ToastContainer />
      </div>
    );
  }

  if (view === 'condividi') {
    const menuUrl = `https://leomenu.it/${restaurantSlug}`;
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="Condividi Menù" onBack={() => setView('list')} />
        <div className="px-5 py-6 space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Link pubblico</p>
            <div className="relative">
              <input readOnly value={menuUrl} className={`${INPUT_CLS} pr-12 cursor-default bg-gray-100 dark:bg-[#252525] text-[#008081] font-bold`} />
              <button onClick={() => copyToClipboard(menuUrl, 'Link copiato!')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#008081] transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center px-4 py-3 bg-gray-100 dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-gray-700 gap-2">
              <Globe className="w-4 h-4 text-[#008081] flex-shrink-0" />
              <span className="text-sm font-black text-gray-700 dark:text-gray-300 truncate">{restaurantSlug}</span>
              <span className="text-xs text-gray-400 ml-auto">slug univoco</span>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-white/5" />
          {restaurantSlug && (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Codice QR</p>
              <div className="flex flex-col items-center bg-gray-50 dark:bg-[#252525] p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <QRCodeSVG id={`qr-${restaurantSlug}`} value={menuUrl} size={180} level="H" includeMargin={false} fgColor="#000000" />
                </div>
                <button onClick={downloadQR}
                  className="mt-5 w-full bg-[#008081] text-white py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-[#006666] active:scale-[0.98] transition-all shadow-md">
                  <QrCode className="w-4 h-4" /> Scarica in Alta Risoluzione
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── SUB-PAGES: IL MIO ACCOUNT ─────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  if (view === 'dati_account') {
    const displayName = [accountNome, accountCognome].filter(Boolean).join(' ');
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="Dati Account" onBack={() => setView('list')} onSave={handleSaveAccount} saving={isSaving} />
        <div className="px-5 py-6 space-y-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-20 h-20 rounded-full bg-[#E6F4F4] dark:bg-[#008081]/10 flex items-center justify-center border-2 border-[#008081]/20">
              <User className="w-9 h-9 text-[#008081]" />
            </div>
            {displayName && <p className="font-black text-gray-700 dark:text-gray-200 text-base">{displayName}</p>}
          </div>

          <div className="border-t border-gray-100 dark:border-white/5" />

          {/* Nome + Cognome */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Nome</label>
              <input type="text" value={accountNome} onChange={e => setAccountNome(e.target.value)}
                placeholder="Nome" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Cognome</label>
              <input type="text" value={accountCognome} onChange={e => setAccountCognome(e.target.value)}
                placeholder="Cognome" className={INPUT_CLS} />
            </div>
          </div>

          {/* Data di nascita */}
          <div>
            <label className={LABEL_CLS}><span className="inline-flex items-center gap-1.5"><Calendar className="w-3 h-3 text-[#008081]" />Data di Nascita</span></label>
            <input type="date" value={accountDOB} onChange={e => setAccountDOB(e.target.value)}
              className={INPUT_CLS} />
          </div>

          {/* Telefono */}
          <div>
            <label className={LABEL_CLS}><span className="inline-flex items-center gap-1.5"><Phone className="w-3 h-3 text-[#008081]" />Telefono</span></label>
            <input type="tel" value={accountPhone} onChange={e => setAccountPhone(e.target.value)}
              placeholder="Telefono" className={INPUT_CLS} />
          </div>

          {/* CAP + Regione */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}><span className="inline-flex items-center gap-1.5"><Hash className="w-3 h-3 text-[#008081]" />CAP</span></label>
              <input type="text" value={accountCAP} onChange={e => setAccountCAP(e.target.value)}
                placeholder="CAP" maxLength={5} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}><span className="inline-flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#008081]" />Regione</span></label>
              <input type="text" value={accountRegione} onChange={e => setAccountRegione(e.target.value)}
                placeholder="Regione" className={INPUT_CLS} />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-white/5" />

          {/* Email attuale — solo lettura */}
          <div>
            <label className={LABEL_CLS}>Email</label>
            <div className="flex items-center px-4 py-3 bg-gray-100 dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-gray-700 gap-2">
              <Mail className="w-4 h-4 text-[#008081] flex-shrink-0" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{accountEmail || '—'}</span>
              <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Per cambiare l'email vai su <button type="button" onClick={() => setView('sicurezza')} className="text-[#008081] font-bold underline underline-offset-2">Sicurezza</button>.</p>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  if (view === 'sicurezza' && sessions.length === 0 && !sessionsLoading) {
    // Load sessions lazily the first time this view is opened
    loadSessions();
  }

  if (view === 'sicurezza') {
    const pwdReady = !!currentPassword && !!newPassword && !!confirmPassword;
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="Sicurezza" onBack={() => setView('list')} />
        <div className="px-5 py-6 space-y-6">

          {/* ── Cambia Password ── */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cambia Password</p>

            {/* Password attuale */}
            <div>
              <label className={LABEL_CLS}>Password Attuale</label>
              <div className="relative">
                <input type={showCurrentPwd ? 'text' : 'password'} value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Inserisci la password attuale" className={`${INPUT_CLS} pr-12`} />
                <button type="button" onClick={() => setShowCurrentPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                  {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nuova password */}
            <div>
              <label className={LABEL_CLS}>Nuova Password</label>
              <div className="relative">
                <input type={showNewPwd ? 'text' : 'password'} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimo 8 caratteri" className={`${INPUT_CLS} pr-12`} />
                <button type="button" onClick={() => setShowNewPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && newPassword.length < 8 && (
                <p className="text-[11px] font-bold text-amber-500 mt-1">Minimo 8 caratteri richiesti</p>
              )}
            </div>

            {/* Conferma nuova password */}
            <div>
              <label className={LABEL_CLS}>Conferma Nuova Password</label>
              <div className="relative">
                <input type={showConfirmPwd ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti la nuova password" className={`${INPUT_CLS} pr-12`} />
                <button type="button" onClick={() => setShowConfirmPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] font-bold text-red-500 mt-1">Le password non coincidono</p>
              )}
            </div>

            {/* Requisiti */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: '8+ caratteri', ok: newPassword.length >= 8 },
                { label: 'Coincidono', ok: !!confirmPassword && newPassword === confirmPassword },
              ].map(({ label, ok }) => (
                <span key={label} className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1
                  ${ok ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  {ok ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border-2 border-current opacity-40" />}
                  {label}
                </span>
              ))}
            </div>

            <button onClick={handleChangePassword} disabled={isSaving || !pwdReady}
              className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all
                ${!pwdReady ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-[#008081] text-white hover:bg-[#006666] active:scale-[0.98] shadow-md'}`}>
              <Lock className="w-4 h-4" />
              {isSaving ? 'Aggiornamento...' : 'Salva le modifiche'}
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-white/5" />

          {/* ── Non ricordi la password? ── */}
          <div className="space-y-3">
            <button
              onClick={() => { setShowForgotPwd(v => !v); setResetSent(false); }}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 dark:bg-[#252525] rounded-2xl border border-gray-100 dark:border-white/5 transition-colors hover:bg-gray-100 dark:hover:bg-[#2A2A2A]">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Non ricordi la password?</span>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showForgotPwd ? 'rotate-90' : ''}`} />
            </button>

            {showForgotPwd && (
              <div className="bg-gray-50 dark:bg-[#252525] rounded-2xl border border-gray-100 dark:border-white/5 p-5 space-y-4">
                {resetSent ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-green-500" />
                    </div>
                    <div>
                      <p className="font-black text-gray-800 dark:text-white text-sm">Email inviata!</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Controlla la tua casella di posta e segui il link per reimpostare la password.
                      </p>
                    </div>
                    <button onClick={() => { setResetSent(false); setResetEmail(''); }}
                      className="text-xs font-bold text-[#008081] underline underline-offset-2">
                      Invia di nuovo
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Inserisci la tua email e ti invieremo un link per reimpostare la password.
                    </p>
                    <div>
                      <label className={LABEL_CLS}>Email</label>
                      <input type="email" value={resetEmail || accountEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        placeholder={accountEmail || 'tua@email.com'} className={INPUT_CLS} />
                    </div>
                    <button onClick={handleResetPassword} disabled={isSaving}
                      className="w-full py-3 rounded-2xl font-black text-sm bg-[#008081] text-white hover:bg-[#006666] active:scale-[0.98] flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60">
                      <Mail className="w-4 h-4" />
                      {isSaving ? 'Invio in corso...' : 'Invia email di reset'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-white/5" />

          {/* ── Cambia Email ── */}
          <div className="space-y-3">
            <button
              onClick={() => { setShowEmailChange(v => !v); setEmailChangeSent(false); }}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 dark:bg-[#252525] rounded-2xl border border-gray-100 dark:border-white/5 transition-colors hover:bg-gray-100 dark:hover:bg-[#2A2A2A]">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#008081]" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Cambia Email</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showEmailChange ? 'rotate-90' : ''}`} />
            </button>

            {showEmailChange && (
              <div className="bg-gray-50 dark:bg-[#252525] rounded-2xl border border-gray-100 dark:border-white/5 p-5 space-y-4">
                {emailChangeSent ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-green-500" />
                    </div>
                    <div>
                      <p className="font-black text-gray-800 dark:text-white text-sm">Conferma inviata!</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Clicca il link nella nuova email per completare il cambio. Fino ad allora il tuo accesso rimane invariato.
                      </p>
                    </div>
                    <button onClick={() => { setEmailChangeSent(false); setNewEmail(''); setEmailVerifyPwd(''); }}
                      className="text-xs font-bold text-[#008081] underline underline-offset-2">
                      Annulla
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Per sicurezza devi confermare la tua password prima di cambiare l'email. Riceverai un link di conferma al nuovo indirizzo.
                    </p>
                    <div>
                      <label className={LABEL_CLS}>Password Attuale</label>
                      <div className="relative">
                        <input type={showEmailVerifyPwd ? 'text' : 'password'} value={emailVerifyPwd}
                          onChange={e => setEmailVerifyPwd(e.target.value)}
                          placeholder="Password attuale" className={`${INPUT_CLS} pr-12`} />
                        <button type="button" onClick={() => setShowEmailVerifyPwd(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                          {showEmailVerifyPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Nuova Email</label>
                      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                        placeholder="nuova@email.com" className={INPUT_CLS} />
                    </div>
                    <button onClick={handleChangeEmail} disabled={isSaving || !emailVerifyPwd || !newEmail}
                      className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all
                        ${(!emailVerifyPwd || !newEmail) ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-[#008081] text-white hover:bg-[#006666] active:scale-[0.98] shadow-md'}`}>
                      <Mail className="w-4 h-4" />
                      {isSaving ? 'Verifica in corso...' : 'Conferma cambio email'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-white/5" />

          {/* ── Sessioni attive ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Sessioni Attive
                {sessions.length > 0 && (
                  <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded text-[9px]">
                    {sessions.length}
                  </span>
                )}
              </p>
              {sessions.filter(s => !s.isCurrent).length > 0 && (
                <button
                  onClick={handleRevokeAllSessions}
                  disabled={revokingAll}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {revokingAll ? 'Revoca...' : 'Revoca tutte le altre'}
                </button>
              )}
            </div>

            {sessionsLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-[#008081] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#252525] rounded-2xl px-4 py-3.5 border border-gray-100 dark:border-white/5">
                <Smartphone className="w-[18px] h-[18px] text-[#008081]" />
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">Questo dispositivo</p>
                  <p className="text-xs text-gray-400">Sessione corrente · Attiva ora</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                {sessions.map((s, i) => {
                  const lastSeen = new Date(s.last_active_at);
                  const diffMins = Math.round((Date.now() - lastSeen.getTime()) / 60_000);
                  const timeStr = diffMins < 1 ? 'Ora'
                    : diffMins < 60 ? `${diffMins} min fa`
                    : diffMins < 1440 ? `${Math.round(diffMins / 60)}h fa`
                    : lastSeen.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });

                  return (
                    <div key={s.id}
                      className={`flex items-center gap-3 px-4 py-3 ${i < sessions.length - 1 ? 'border-b border-gray-100 dark:border-white/[0.04]' : ''}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${s.isCurrent ? 'bg-[#E6F4F4] dark:bg-[#008081]/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <Monitor className={`w-[18px] h-[18px] ${s.isCurrent ? 'text-[#008081]' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                          {s.device_label || 'Dispositivo'}
                          {s.isCurrent && (
                            <span className="ml-1.5 text-[10px] font-black text-[#008081] bg-[#008081]/10 px-1.5 py-0.5 rounded-full">
                              Questo
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">Ultima attività: {timeStr}</p>
                      </div>
                      {s.isCurrent
                        ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        : <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                      }
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-gray-400">
              Le sessioni inattive da 30+ giorni vengono rimosse automaticamente.
            </p>
          </div>

          <div className="border-t border-gray-100 dark:border-white/5" />

          {/* ── Zona Pericolosa ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Zona Pericolosa</p>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-5 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                L'eliminazione rimuoverà <strong>definitivamente</strong> il ristorante, tutte le categorie, i prodotti e gli ordini.
              </p>
              <button onClick={handleDeleteAccount}
                className="w-full py-3.5 px-5 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all">
                <Trash2 className="w-4 h-4" /> Elimina Account e Ristorante
              </button>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  if (view === 'notifiche') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="Notifiche" onBack={() => setView('list')} />
        <div className="px-5 py-6 space-y-4">

          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Scegli come vuoi essere avvisato quando arriva un nuovo ordine.
          </p>

          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
            <SettingRow
              icon={Bell} title="Notifiche Ordini"
              subtitle="Avviso visivo per ogni nuovo ordine"
              right={<Toggle enabled={notifyOrders} onToggle={() => saveNotifPref('notify_new_orders', notifyOrders ? 'false' : 'true')} />}
            />
            <SettingRow
              icon={Volume2} title="Suono Avviso"
              subtitle="Suono quando arriva un ordine"
              right={<Toggle enabled={notifySound} onToggle={() => saveNotifPref('notify_order_sound', notifySound ? 'false' : 'true')} />}
            />
            <SettingRow
              icon={Mail} title="Email Riepilogo"
              subtitle="Email giornaliera con gli ordini ricevuti"
              right={<Toggle enabled={notifyEmail} onToggle={() => saveNotifPref('notify_email_orders', notifyEmail ? 'false' : 'true')} />}
              last
            />
          </div>

          <div className="bg-[#008081]/5 border border-[#008081]/15 rounded-2xl px-4 py-3 flex items-start gap-3">
            <Bell className="w-4 h-4 text-[#008081] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Le notifiche push funzionano solo quando il pannello è aperto nel browser. Per avvisi in background, attiva la ricezione email.
            </p>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  if (view === 'fatture') {
    const isActive = subscriptionTier !== 'trial';
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="Fatture & Pagamenti" onBack={() => setView('list')} />
        <div className="px-5 py-6 space-y-6">

          {/* Piano attuale */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Piano Attuale</p>
            <div className={`flex items-center gap-3 p-4 rounded-2xl border
              ${isActive ? 'bg-teal-50 dark:bg-teal-900/20 border-[#008081]/30' : 'bg-gray-50 dark:bg-[#252525] border-gray-200 dark:border-gray-700'}`}>
              <div className="w-10 h-10 rounded-full bg-[#008081]/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#008081]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Piano attuale</p>
                <p className="font-black text-gray-800 dark:text-gray-200 capitalize mt-0.5">
                  {subscriptionTier === 'trial' ? '🕐 Trial gratuito' : `✅ ${subscriptionTier}`}
                </p>
              </div>
            </div>

            {!isActive && (
              <>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Scegli un piano per continuare ad usare LeoMenu dopo il trial:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {PLANS.map(plan => (
                    <button key={plan.key} onClick={() => startCheckout(plan.key, restaurantId)}
                      disabled={checkoutLoading !== null}
                      className="relative flex flex-col items-center p-4 rounded-2xl border-2 border-[#008081] bg-teal-50/50 dark:bg-[#008081]/10 hover:bg-teal-100/60 transition-all disabled:opacity-60 active:scale-95">
                      {plan.badge && (
                        <span className="absolute -top-2 right-2 bg-[#008081] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{plan.badge}</span>
                      )}
                      <span className="text-xs font-black text-gray-700 dark:text-gray-300 mb-1">{plan.label}</span>
                      <span className="text-xl font-black text-[#008081]">{plan.price}</span>
                      <span className="text-[10px] text-gray-400">{plan.period}</span>
                      {checkoutLoading === plan.key && <span className="mt-1 text-[10px] text-[#008081] font-bold">...</span>}
                    </button>
                  ))}
                </div>
                {checkoutError && <p className="text-xs text-red-500">{checkoutError}</p>}
                <p className="text-[10px] text-gray-400 text-center">14 giorni di prova gratuita inclusi · Annulla quando vuoi</p>
              </>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-white/5" />

          {/* Storico fatture */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Storico Fatture</p>
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-gray-50 dark:bg-[#252525] rounded-2xl border border-gray-100 dark:border-white/5">
              <Receipt className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-bold text-gray-400">Nessuna fattura disponibile</p>
              <p className="text-xs text-gray-400 max-w-xs">Le fatture appariranno qui dopo il primo pagamento. Disponibili anche via email.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Assistenza ────────────────────────────────────────────────────────────

  if (view === 'assistenza') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="Contatta l'Assistenza" onBack={() => setView('list')} />
        <div className="px-5 py-6 space-y-6">

          {/* Hero */}
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E6F4F4] dark:bg-[#008081]/10 flex items-center justify-center border-2 border-[#008081]/20">
              <HelpCircle className="w-8 h-8 text-[#008081]" />
            </div>
            <div>
              <p className="font-black text-gray-800 dark:text-white text-base">Siamo qui per aiutarti</p>
              <p className="text-xs text-gray-400 mt-1">Il team LeoMenu risponde entro 24 ore lavorative</p>
            </div>
          </div>

          {/* Email */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
            <a href="mailto:support@leomenu.it"
              className="flex items-center gap-3.5 px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
              <div className="w-9 h-9 rounded-full bg-[#E6F4F4] dark:bg-[#008081]/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-[18px] h-[18px] text-[#008081]" />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-[15px] font-semibold text-[#1A1A1A] dark:text-white leading-tight">Email</p>
                <p className="text-xs text-[#008081] font-bold truncate mt-0.5">support@leomenu.it</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </a>
          </div>

          {/* CTA button */}
          <a href="mailto:support@leomenu.it?subject=Richiesta%20assistenza%20LeoMenu"
            className="flex items-center justify-center gap-2 w-full py-4 bg-[#008081] hover:bg-[#006666] active:scale-[0.98] text-white font-black rounded-2xl shadow-md transition-all">
            <Mail className="w-4 h-4" /> Invia una richiesta
          </a>

          {/* Info */}
          <div className="bg-[#008081]/5 border border-[#008081]/15 rounded-2xl px-4 py-3 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-[#008081] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Prima di contattarci, assicurati di includere una descrizione dettagliata del problema e il nome del tuo ristorante per velocizzare la risposta.
            </p>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  // ── Dati Fiscali ──────────────────────────────────────────────────────────

  if (view === 'fiscale') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col">
        <SubPageHeader title="Dati Fiscali" onBack={() => setView('list')} onSave={handleSave} saving={isSaving} />
        <div className="px-5 py-6 space-y-4">
          <div>
            <label className={LABEL_CLS}>Ragione Sociale / Nome Attività</label>
            <input type="text" value={settings.ragione_sociale || ''} onChange={e => setSettings({ ...settings, ragione_sociale: e.target.value })}
              placeholder="Es. Pizzeria Bella Napoli S.r.l." className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Partita IVA</label>
            <input type="text" value={settings.piva || ''} onChange={e => setSettings({ ...settings, piva: e.target.value })}
              placeholder="IT12345678901" className={`${INPUT_CLS} ${!pivaValid ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/10' : ''}`} />
            {!pivaValid
              ? <p className="text-[11px] font-bold text-red-500 mt-1">Formato: IT + 11 cifre</p>
              : <p className="text-[10px] text-gray-400 mt-1">11 cifre, precedute da IT</p>}
          </div>
          <div>
            <label className={LABEL_CLS}>Codice Fiscale</label>
            <input type="text" value={settings.codice_fiscale || ''} onChange={e => setSettings({ ...settings, codice_fiscale: e.target.value })}
              placeholder="Es. RSSMRC80A01H501U" className={INPUT_CLS} />
            <p className="text-[10px] text-gray-400 mt-1">Solo se diverso dalla Partita IVA</p>
          </div>
          <div>
            <label className={LABEL_CLS}>Codice SDI</label>
            <input type="text" value={settings.codice_sdi || ''} onChange={e => setSettings({ ...settings, codice_sdi: e.target.value })}
              placeholder="Es. ABCDE12" maxLength={7} className={`${INPUT_CLS} ${!sdiValid ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/10' : ''}`} />
            {!sdiValid
              ? <p className="text-[11px] font-bold text-red-500 mt-1">7 caratteri richiesti</p>
              : <p className="text-[10px] text-gray-400 mt-1">Per la fatturazione elettronica</p>}
          </div>
          <div>
            <label className={LABEL_CLS}>PEC (Posta Elettronica Certificata)</label>
            <input type="email" value={settings.pec || ''} onChange={e => setSettings({ ...settings, pec: e.target.value })}
              placeholder="azienda@pec.it" className={INPUT_CLS} />
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return null;
}
