import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, ChevronDown, ChevronRight, Settings, BookOpen, Upload,
  AlertTriangle, Trash2, Save, Phone, Link2, Music, MapPin,
  Clock, Wifi, FileText, Eye, EyeOff, Copy, QrCode, Globe, CreditCard,
} from 'lucide-react';
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
}

interface DayHours { open: string; close: string; closed: boolean; }
type WeekHours = Record<string, DayHours>;

const DAYS = [
  { key: 'lun', label: 'LUN' }, { key: 'mar', label: 'MAR' },
  { key: 'mer', label: 'MER' }, { key: 'gio', label: 'GIO' },
  { key: 'ven', label: 'VEN' }, { key: 'sab', label: 'SAB' },
  { key: 'dom', label: 'DOM' },
];
const DEFAULT_HOURS: WeekHours = Object.fromEntries(
  DAYS.map(({ key }) => [key, { open: '12:00', close: '22:00', closed: false }])
);

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024;

const INPUT_CLS = 'w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#008081]/40 focus:border-[#008081] transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600';
const LABEL_CLS = 'block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5';

// ── Accordion Section ─────────────────────────────────────────────────────────

function Section({
  id, expanded, onToggle, icon: Icon, title, danger = false, children,
}: {
  id: string; expanded: boolean; onToggle: (id: string) => void;
  icon: React.ElementType; title: string; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl shadow-sm border overflow-hidden bg-white dark:bg-[#262626] ${danger ? 'border-red-100 dark:border-red-900/30' : 'border-gray-100 dark:border-gray-800'}`}>
      <button
        onClick={() => onToggle(id)}
        className={`w-full flex items-center justify-between p-5 transition-colors ${danger ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20' : 'bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#252525]'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${danger ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-teal-50 dark:bg-[#008081]/10 text-[#008081]'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className={`font-bold text-left ${danger ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{title}</h3>
        </div>
        {expanded
          ? <ChevronDown className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-gray-400'}`} />
          : <ChevronRight className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-gray-400'}`} />}
      </button>
      <div className={`transition-all duration-300 ease-in-out ${expanded ? 'max-h-[2000px] opacity-100 p-5 border-t' : 'max-h-0 opacity-0 overflow-hidden p-0'} ${danger ? 'border-red-100 dark:border-red-900/30' : 'border-gray-100 dark:border-gray-800'}`}>
        {children}
      </div>
    </div>
  );
}

// ── Subscription Panel ────────────────────────────────────────────────────────

const PLANS: { key: PlanKey; label: string; price: string; period: string; badge: string | null }[] = [
  { key: 'mensile',    label: 'Mensile',    price: '€29',  period: '/mese',       badge: null },
  { key: 'semestrale', label: 'Semestrale', price: '€22',  period: '/mese',       badge: '-24%' },
  { key: 'annuale',    label: 'Annuale',    price: '€17',  period: '/mese',       badge: '-41%' },
];

function SubscriptionPanel({ subscriptionTier, restaurantId }: { subscriptionTier: string; restaurantId: string }) {
  const { startCheckout, loading, error } = useStripeCheckout();
  const isActive = subscriptionTier !== 'trial';

  return (
    <div className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-[#008081]/10 flex items-center justify-center text-[#008081]">
          <CreditCard className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Piano attuale</p>
          <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
            {subscriptionTier === 'trial' ? '🕐 Trial gratuito' : `✅ ${subscriptionTier}`}
          </span>
        </div>
      </div>

      {!isActive && (
        <>
          <p className="text-xs text-gray-500 mb-4">Scegli un piano per continuare ad usare Leomenu dopo il trial:</p>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map(plan => (
              <button
                key={plan.key}
                onClick={() => startCheckout(plan.key, restaurantId)}
                disabled={loading !== null}
                className="relative flex flex-col items-center p-3 rounded-xl border-2 border-[#008081] bg-teal-50/50 dark:bg-[#008081]/10 hover:bg-teal-100/60 transition-all disabled:opacity-60"
              >
                {plan.badge && (
                  <span className="absolute -top-2 right-2 bg-[#008081] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{plan.badge}</span>
                )}
                <span className="text-xs font-black text-gray-700 dark:text-gray-300 mb-1">{plan.label}</span>
                <span className="text-lg font-black text-[#008081]">{plan.price}</span>
                <span className="text-[10px] text-gray-400">{plan.period}</span>
                {loading === plan.key && (
                  <span className="mt-1 text-[10px] text-[#008081] font-bold">Caricamento...</span>
                )}
              </button>
            ))}
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          <p className="text-[10px] text-gray-400 mt-3 text-center">14 giorni di prova gratuita inclusi · Annulla quando vuoi</p>
        </>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SettingsManager({
  restaurantId, restaurantSlug, initialRestaurantName, subscriptionTier, onLogout,
}: SettingsManagerProps) {
  const { showToast, ToastContainer } = useToast();

  const [restaurantName, setRestaurantName] = useState(initialRestaurantName);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [weekHours, setWeekHours] = useState<WeekHours>(DEFAULT_HOURS);
  const [expanded, setExpanded] = useState<string>('profilo');
  const [isUploading, setIsUploading] = useState(false);
  const [wifiVisible, setWifiVisible] = useState(false);
  const [cropperState, setCropperState] = useState<{
    src: string | null; aspect: number; callback: ((b64: string) => void) | null;
  }>({ src: null, aspect: 1, callback: null });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setRestaurantName(initialRestaurantName); }, [initialRestaurantName]);

  useEffect(() => {
    if (!restaurantId) return;
    db.from('settings').select('*').eq('restaurant_id', restaurantId).maybeSingle().then(({ data }) => {
      if (data) {
        setSettings(data);
        if (data.opening_hours) {
          try { setWeekHours(JSON.parse(data.opening_hours)); } catch { /* use default */ }
        }
      }
    });
  }, [restaurantId]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const toggle = (id: string) => setExpanded(prev => prev === id ? '' : id);

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

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setIsUploading(true);
    await db.from('restaurants').update({ name: restaurantName }).eq('id', restaurantId);

    const safeSettings: Record<string, string> = { ...settings };
    delete (safeSettings as Record<string, unknown>).id;
    delete (safeSettings as Record<string, unknown>).restaurant_id;
    safeSettings.opening_hours = JSON.stringify(weekHours);

    const { error } = await db.from('settings').upsert({ restaurant_id: restaurantId, ...safeSettings });
    setIsUploading(false);
    if (!error) showToast('✅ Impostazioni salvate!', 'success');
    else showToast('❌ Errore: ' + error.message, 'error');
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
      canvas.width = img.width + pad * 2;
      canvas.height = img.height + pad * 2;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, pad, pad, img.width, img.height);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('INQUADRA E ORDINA', canvas.width / 2, pad / 1.5);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `Menu_QR_${restaurantSlug}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="pt-4 flex flex-col gap-3 pb-24 w-full">

      {/* Header + Save button */}
      <div className="bg-white dark:bg-[#262626] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Impostazioni App</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Gestisci l'aspetto della tua app.</p>
        </div>
        <button
          onClick={handleSaveSettings} disabled={isUploading}
          className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all ${isUploading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-[#008081] text-white hover:bg-teal-700'}`}
        >
          <Save className="w-4 h-4" /> Salva
        </button>
      </div>

      {/* 1 — Profilo Locale */}
      <Section id="profilo" expanded={expanded === 'profilo'} onToggle={toggle} icon={Settings} title="Profilo Locale">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Nome del Negozio</label>
            <input type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)}
              placeholder="Es. Pizzeria Bella Napoli" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Frase / Sottotitolo</label>
            <input type="text" value={settings.restaurant_subtitle || ''} onChange={e => setSettings({ ...settings, restaurant_subtitle: e.target.value })}
              placeholder="Es. L'arte della vera pizza" className={INPUT_CLS} />
            <p className="text-[10px] text-gray-400 mt-1">Sostituisce "Menu Digitale" in homepage se compilato.</p>
          </div>
        </div>
      </Section>

      {/* 2 — Link & Social */}
      <Section id="social" expanded={expanded === 'social'} onToggle={toggle} icon={Link2} title="Link & Social">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {([
            { key: 'phone_number', label: 'Telefono', Icon: Phone, type: 'tel', placeholder: '+39 02 1234567' },
            { key: 'instagram_url', label: 'Instagram', Icon: Link2, type: 'url', placeholder: 'https://instagram.com/tuolocale' },
            { key: 'facebook_url', label: 'Facebook', Icon: Link2, type: 'url', placeholder: 'https://facebook.com/tuolocale' },
            { key: 'tiktok_url', label: 'TikTok', Icon: Music, type: 'url', placeholder: 'https://tiktok.com/@tuolocale' },
            { key: 'google_maps_url', label: 'Google Maps', Icon: MapPin, type: 'url', placeholder: 'https://maps.app.goo.gl/...' },
          ] as const).map(({ key, label, Icon, type, placeholder }) => (
            <div key={key}>
              <label className={LABEL_CLS}>
                <span className="inline-flex items-center gap-1.5">
                  <Icon className="w-3 h-3 text-[#008081]" />
                  {label}
                </span>
              </label>
              <input type={type} value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                placeholder={placeholder} className={INPUT_CLS} />
            </div>
          ))}
        </div>
      </Section>

      {/* 3 — Identità Visiva */}
      <Section id="visiva" expanded={expanded === 'visiva'} onToggle={toggle} icon={BookOpen} title="Identità Visiva">
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Logo</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Immagine circolare mostrata in testata (ritaglio 1:1).</p>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0]; if (!file) return; e.target.value = '';
              if (!validateFile(file)) return;
              openCropper(file, 1, b64 => setSettings({ ...settings, logo_url: b64 }));
            }} />
            <button onClick={() => logoInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#008081] text-[#008081] font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all w-full justify-center">
              <Upload className="w-4 h-4" /> Importa / Carica Logo
            </button>
            {settings.logo_url && (
              <img src={settings.logo_url} alt="Logo" className="mt-3 h-28 w-28 object-contain rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white shadow-sm mx-auto" />
            )}
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Sfondo Intestazione (Cover)</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Immagine panoramica 16:9 dietro al logo.</p>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0]; if (!file) return; e.target.value = '';
              if (!validateFile(file)) return;
              openCropper(file, 16 / 9, b64 => setSettings({ ...settings, cover_image_url: b64 }));
            }} />
            <button onClick={() => coverInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#008081] text-[#008081] font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all w-full justify-center">
              <Camera className="w-4 h-4" /> Carica Foto di Copertina
            </button>
            {settings.cover_image_url && (
              <img src={settings.cover_image_url} alt="Cover" className="mt-3 w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
            )}
          </div>
        </div>
      </Section>

      {/* 4 — Dati Fiscali */}
      <Section id="fiscale" expanded={expanded === 'fiscale'} onToggle={toggle} icon={FileText} title="Dati Fiscali">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="md:col-span-2">
            <label className={LABEL_CLS}>PEC (Posta Elettronica Certificata)</label>
            <input type="email" value={settings.pec || ''} onChange={e => setSettings({ ...settings, pec: e.target.value })}
              placeholder="azienda@pec.it" className={INPUT_CLS} />
          </div>
        </div>
      </Section>

      {/* 5 — Orari di Apertura */}
      <Section id="orari" expanded={expanded === 'orari'} onToggle={toggle} icon={Clock} title="Orari di Apertura">
        <div className="space-y-0.5">
          {DAYS.map(({ key, label }) => {
            const day = weekHours[key] ?? { open: '12:00', close: '22:00', closed: false };
            return (
              <div key={key} className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span className="w-9 text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase flex-shrink-0">{label}</span>

                {/* Toggle */}
                <div onClick={() => setWeekHours(p => ({ ...p, [key]: { ...day, closed: !day.closed } }))}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${day.closed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-[#008081]'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${day.closed ? 'translate-x-0.5' : 'translate-x-[18px]'}`} />
                </div>
                <span className={`text-[10px] font-bold w-12 flex-shrink-0 ${day.closed ? 'text-gray-400' : 'text-[#008081]'}`}>
                  {day.closed ? 'Chiuso' : 'Aperto'}
                </span>

                {/* Times */}
                <div className="flex items-center gap-1.5 flex-1">
                  <input type="time" value={day.open} disabled={day.closed}
                    onChange={e => setWeekHours(p => ({ ...p, [key]: { ...day, open: e.target.value } }))}
                    className="flex-1 px-2 py-1.5 text-xs font-bold bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-[#008081]/40 focus:border-[#008081] outline-none disabled:opacity-40 transition-all" />
                  <span className="text-xs text-gray-400 font-bold flex-shrink-0">→</span>
                  <input type="time" value={day.close} disabled={day.closed}
                    onChange={e => setWeekHours(p => ({ ...p, [key]: { ...day, close: e.target.value } }))}
                    className="flex-1 px-2 py-1.5 text-xs font-bold bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-[#008081]/40 focus:border-[#008081] outline-none disabled:opacity-40 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 mt-3">Salvati con il pulsante "Salva" in alto.</p>
      </Section>

      {/* 6 — WiFi Ospiti */}
      <Section id="wifi" expanded={expanded === 'wifi'} onToggle={toggle} icon={Wifi} title="WiFi Ospiti">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </Section>

      {/* 7 — Menù del Giorno */}
      <Section id="menugiorno" expanded={expanded === 'menugiorno'} onToggle={toggle} icon={BookOpen} title="Menù del Giorno">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">Attiva Menù del Giorno</p>
            <p className="text-xs text-gray-400 mt-0.5">Mostra la sezione Menù del Giorno ai clienti nella home del ristorante.</p>
          </div>
          <button
            onClick={async () => {
              const current = settings.menu_del_giorno_enabled;
              const newVal = current === 'true' ? 'false' : 'true';
              setSettings(s => ({ ...s, menu_del_giorno_enabled: newVal }));
              await db.from('settings').upsert(
                { restaurant_id: restaurantId, key: 'menu_del_giorno_enabled', value: newVal },
                { onConflict: 'restaurant_id,key' }
              );
              showToast(newVal === 'true' ? 'Menù del Giorno attivato' : 'Menù del Giorno disattivato');
            }}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${settings.menu_del_giorno_enabled === 'true' ? 'bg-[#008081]' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${settings.menu_del_giorno_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </Section>

      {/* 8 — URL del Menù */}
      <Section id="url" expanded={expanded === 'url'} onToggle={toggle} icon={Globe} title="URL del Menù">
        <div className="space-y-4">
          <div>
            <label className={LABEL_CLS}>Link pubblico del tuo menù</label>
            <div className="relative">
              <input readOnly value={`https://leomenu.it/${restaurantSlug}`}
                className={`${INPUT_CLS} pr-12 cursor-default bg-gray-100 dark:bg-[#252525] text-[#008081] font-bold`} />
              <button onClick={() => copyToClipboard(`https://leomenu.it/${restaurantSlug}`, 'Link copiato!')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#008081] transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Condividi sui social o stampalo sul materiale promozionale.</p>
          </div>
          <div>
            <label className={LABEL_CLS}>Il tuo identificativo univoco (slug)</label>
            <div className="flex items-center px-3 py-2.5 bg-gray-100 dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-black text-gray-700 dark:text-gray-300">{restaurantSlug}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Per modificare lo slug contatta il supporto.</p>
          </div>
        </div>
      </Section>

      {/* 9 — Codice QR */}
      {restaurantSlug && (
        <Section id="qr" expanded={expanded === 'qr'} onToggle={toggle} icon={QrCode} title="Codice QR del Menù">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm mx-auto">
            Stampa questo QR code per permettere ai clienti di visualizzare il menù dal loro smartphone.
          </p>
          <div className="flex flex-col items-center bg-gray-50 dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-sm mx-auto">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <QRCodeSVG id={`qr-${restaurantSlug}`} value={`https://leomenu.it/${restaurantSlug}`}
                size={180} level="H" includeMargin={false} fgColor="#000000" />
            </div>
            <button onClick={downloadQR}
              className="mt-6 border-2 border-[#008081] bg-[#008081]/10 text-[#008081] hover:bg-[#008081] hover:text-white transition-all duration-300 py-2.5 px-6 rounded-xl font-bold flex items-center gap-2 w-full justify-center">
              Scarica in Alta Risoluzione
            </button>
          </div>
        </Section>
      )}

      {/* 10 — Piano & Abbonamento */}
      <SubscriptionPanel subscriptionTier={subscriptionTier} restaurantId={restaurantId} />

      {/* 10 — Elimina Account */}
      <Section id="danger" expanded={expanded === 'danger'} onToggle={toggle} icon={AlertTriangle} title="Elimina account" danger>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          L'eliminazione rimuoverà <strong>definitivamente</strong> il ristorante, tutte le categorie, i prodotti e gli ordini.
        </p>
        <p className="text-xs font-black text-red-500 mb-4 uppercase tracking-wide">⚠ Azione irreversibile</p>
        <button onClick={handleDeleteAccount}
          className="w-full py-3 px-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
          <Trash2 className="w-4 h-4" /> Elimina Account e Ristorante
        </button>
      </Section>

      <ImageCropperModal
        imageSrc={cropperState.src} aspect={cropperState.aspect}
        onConfirm={b64 => { if (cropperState.callback) cropperState.callback(b64); setCropperState({ src: null, aspect: 1, callback: null }); }}
        onCancel={() => setCropperState({ src: null, aspect: 1, callback: null })}
      />
      <ToastContainer />
    </div>
  );
}
