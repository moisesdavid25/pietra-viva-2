import React, { useRef, useState } from 'react';
import { Save, Settings, Smartphone, BookOpen, Search, Upload, Camera, ChevronDown, ChevronRight, Layers, Plus, Trash2, AlertTriangle, Crown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ImageCropperModal from '../ImageCropperModal';

interface Props {
  restaurantId: string | null;
  restaurantName: string;
  restaurantSlug: string;
  subscriptionTier?: string;
  settings: Record<string, any>;
  isUploading: boolean;
  expandedSection: string;
  onExpandSection: (s: string) => void;
  onSettingChange: (key: string, value: string) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onDeleteAccount: () => void;
  cropperState: { src: string | null; aspect: number; callback: ((b64: string) => void) | null };
  onCropConfirm: (b64: string) => void;
  onCropCancel: () => void;
  onOpenCropper: (file: File, aspect: number, cb: (b64: string) => void) => void;
}

export default function SettingsPanel({
  restaurantId, restaurantName, restaurantSlug, subscriptionTier = 'trial', settings, isUploading,
  expandedSection, onExpandSection, onSettingChange, onNameChange, onSave, onDeleteAccount,
  cropperState, onCropConfirm, onCropCancel, onOpenCropper,
}: Props) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [expandedZoneId, setExpandedZoneId] = useState<string|null>(null);

  const AccordionHeader = ({ id, label, icon: Icon }: { id: string; label: string; icon: React.FC<any> }) => (
    <button
      onClick={() => onExpandSection(expandedSection === id ? '' : id)}
      className="w-full flex items-center justify-between p-5 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-[#008081]/10 flex items-center justify-center text-[#008081]">
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white">{label}</h3>
      </div>
      {expandedSection === id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
    </button>
  );

  const inputCls = "w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008081] transition-shadow outline-none";

  return (
    <div className="pt-4 flex flex-col gap-3 animate-fade-in pb-24">
      {/* Save Header */}
      <div className="bg-white dark:bg-[#262626] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Impostazioni App</h3>
          <p className="text-xs text-gray-500">Gestisci l'aspetto della tua app.</p>
        </div>
        <button
          onClick={onSave}
          disabled={isUploading}
          className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all ${isUploading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-[#008081] text-white hover:bg-teal-700'}`}
        >
          <Save className="w-4 h-4" /> Salva
        </button>
      </div>

      {/* Profilo */}
      <div className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <AccordionHeader id="profilo" label="Profilo Locale" icon={Settings} />
        <div className={`transition-all duration-300 ${expandedSection === 'profilo' ? 'max-h-[1000px] opacity-100 p-5 border-t border-gray-100 dark:border-gray-800' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="restaurantName" className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome del Negozio</label>
              <input id="restaurantName" name="restaurantName" type="text" value={restaurantName} onChange={e => onNameChange(e.target.value)} placeholder="Es. Pizzeria Bella Napoli" className={inputCls} />
            </div>
            <div>
              <label htmlFor="restaurant_subtitle" className="block text-xs font-bold text-gray-500 uppercase mb-2">Frase / Sottotitolo</label>
              <input id="restaurant_subtitle" name="restaurant_subtitle" type="text" value={settings.restaurant_subtitle || ''} onChange={e => onSettingChange('restaurant_subtitle', e.target.value)} placeholder="Es. L'arte della vera pizza" className={inputCls} />
              <p className="text-[10px] text-gray-400 mt-1">Sostituisce "Menu Digitale" in homepage se compilato.</p>
            </div>
          </div>
        </div>

        {/* Link & Social */}
        <div className="border-t border-gray-100 dark:border-gray-800">
          <AccordionHeader id="social" label="Link & Social" icon={Smartphone} />
          <div className={`transition-all duration-300 ${expandedSection === 'social' ? 'max-h-[1000px] opacity-100 p-5 border-t border-gray-100 dark:border-gray-800' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: '📞 Telefono', key: 'phone_number', placeholder: 'Es. +39 02 1234567', type: 'text' },
                { label: '📸 Instagram', key: 'instagram_url', placeholder: 'https://instagram.com/...', type: 'url' },
                { label: '📘 Facebook', key: 'facebook_url', placeholder: 'https://facebook.com/...', type: 'url' },
                { label: '🎵 TikTok', key: 'tiktok_url', placeholder: 'https://tiktok.com/...', type: 'url' },
                { label: '📍 Google Maps', key: 'google_maps_url', placeholder: 'https://maps.app.goo.gl/...', type: 'url' },
              ].map(f => (
                <div key={f.key}>
                  <label htmlFor={f.key} className="block text-xs font-bold text-gray-500 uppercase mb-2">{f.label}</label>
                  <input id={f.key} name={f.key} type={f.type} value={settings[f.key] || ''} onChange={e => onSettingChange(f.key, e.target.value)} placeholder={f.placeholder} className={inputCls} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Identità Visiva */}
        <div className="border-t border-gray-100 dark:border-gray-800">
          <AccordionHeader id="visiva" label="Identità Visiva" icon={BookOpen} />
          <div className={`transition-all duration-300 ${expandedSection === 'visiva' ? 'max-h-[1000px] opacity-100 p-5 border-t border-gray-100 dark:border-gray-800 space-y-6' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Logo</h4>
              <p className="text-xs text-gray-500 mb-4">Immagine circolare mostrata in testata (verrà tagliata 1:1).</p>
              <label htmlFor="logoInput" className="sr-only">Carica Logo</label>
              <input id="logoInput" name="logoInput" ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (f) { e.target.value = ''; onOpenCropper(f, 1, b64 => onSettingChange('logo_url', b64)); }
              }} />
              <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#008081] text-[#008081] font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all w-full justify-center">
                <Upload className="w-4 h-4" /> Importa / Carica Logo
              </button>
              {settings.logo_url && !String(settings.logo_url).startsWith('data:image') && <img src={settings.logo_url} alt="Logo" className="mt-3 h-28 w-28 object-contain rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white shadow-sm mx-auto" />}
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Sfondo Intestazione (Cover)</h4>
              <p className="text-xs text-gray-500 mb-4">Immagine panoramica 16:9 dietro al logo.</p>
              <label htmlFor="coverInput" className="sr-only">Carica Copertina</label>
              <input id="coverInput" name="coverInput" ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (f) { e.target.value = ''; onOpenCropper(f, 16/9, b64 => onSettingChange('cover_image_url', b64)); }
              }} />
              <button onClick={() => coverInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#008081] text-[#008081] font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all w-full justify-center">
                <Camera className="w-4 h-4" /> Carica Foto di Copertina
              </button>
              {settings.cover_image_url && !String(settings.cover_image_url).startsWith('data:image') && <img src={settings.cover_image_url} alt="Cover" className="mt-3 w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700 bg-white" />}
            </div>
          </div>
        </div>

        {/* Gestione Sale e Tavoli */}
        <div className="border-t border-gray-100 dark:border-gray-800">
          <AccordionHeader id="sale" label="Gestione Sale e Tavoli" icon={Layers} />
          <div className={`transition-all duration-300 ${expandedSection === 'sale' ? 'max-h-[2000px] opacity-100 p-5 border-t border-gray-100 dark:border-gray-800 space-y-4 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-gray-500 max-w-[200px] leading-tight">Configura le zone (es. Interna, Terrazza) e i tavoli con la rispettiva capacità (PAX).</p>
              <button 
                onClick={() => {
                  const sale = Array.isArray(settings.sale) ? [...settings.sale] : [];
                  sale.push({ id: Math.random().toString(36).substr(2, 9), name: 'Nuova Sala', tables: [] });
                  onSettingChange('sale', sale as any);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-[#008081] rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-teal-100 transition-colors shadow-sm shrink-0"
              ><Plus className="w-3.5 h-3.5"/> Sala</button>
            </div>
            
            {(Array.isArray(settings.sale) ? settings.sale : []).map((zona: any, zIdx: number) => {
              const isZoneExp = expandedZoneId === (zona.id || zIdx.toString());
              return (
              <div key={zona.id || zIdx} className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-2xl p-4 md:p-5 mb-4 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#008081] opacity-50"></div>
                <div className="flex gap-2 items-center cursor-pointer" onClick={() => setExpandedZoneId(isZoneExp ? null : (zona.id || zIdx.toString()))}>
                  <div className="p-2 text-gray-400 hover:text-[#008081] transition-colors"><ChevronRight className={`w-5 h-5 transition-transform ${isZoneExp ? 'rotate-90' : ''}`} /></div>
                  <label htmlFor={`zone-name-${zIdx}`} className="sr-only">Nome Sala</label>
                  <input
                    id={`zone-name-${zIdx}`}
                    name={`zone-name-${zIdx}`}
                    type="text"
                    value={zona.name || ''}
                    onClick={e => e.stopPropagation()}
                    onChange={e => {
                      const newSale = [...settings.sale];
                      newSale[zIdx].name = e.target.value;
                      onSettingChange('sale', newSale as any);
                    }}
                    placeholder="Nome Sala (es. Terrazza)"
                    className="flex-1 p-3 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-800 rounded-xl text-[14px] font-black uppercase tracking-widest focus:ring-[#008081] transition-shadow outline-none"
                  />
                  <div className="bg-[#008081]/10 text-[#008081] font-black text-[10px] px-2 py-1 rounded-lg uppercase">{zona.tables?.length||0} TAV.</div>
                  <button onClick={e => {
                    e.stopPropagation();
                    if (settings.sale.length <= 1) {
                        alert('Debes mantener al menos un elemento para que tu POS sea funcional');
                        return;
                    }
                    const newSale = [...settings.sale];
                    newSale.splice(zIdx, 1);
                    onSettingChange('sale', newSale as any);
                  }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
                
                {isZoneExp && (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-5 animate-fade-in-up">
                      {(zona.tables || []).map((tavolo: any, tIdx: number) => (
                        <div key={tavolo.id || tIdx} className="bg-gray-50 dark:bg-[#252525] p-3 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col gap-2 relative group focus-within:ring-1 focus-within:ring-[#008081]">
                          <button onClick={() => {
                            if (settings.sale.length <= 1 && settings.sale[zIdx].tables.length <= 1) {
                                alert('Debes mantener al menos un elemento para que tu POS sea funcional');
                                return;
                            }
                            const newSale = [...settings.sale];
                            newSale[zIdx].tables.splice(tIdx, 1);
                            onSettingChange('sale', newSale as any);
                          }} className="absolute -top-2 -right-2 bg-white text-red-500 border border-red-100 rounded-full p-1 opacity-0 group-hover:opacity-100 sm:opacity-100 focus:opacity-100 transition-opacity shadow-md z-10 hover:bg-red-50"><Trash2 className="w-3 h-3"/></button>
                          <div className="flex flex-col gap-1 px-1">
                            <span className="text-[9px] text-gray-400 font-extrabold tracking-widest uppercase">ID Tavolo</span>
                            <input id={`table-name-${zIdx}-${tIdx}`} name={`table-name-${zIdx}-${tIdx}`} type="text" placeholder="Nome / N°" value={tavolo.name || ''} onChange={e => {
                              const newSale = [...settings.sale];
                              newSale[zIdx].tables[tIdx].name = e.target.value;
                              onSettingChange('sale', newSale as any);
                            }} className="w-full text-center font-black text-[13px] bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 hover:border-gray-300 focus:border-[#008081] transition-colors outline-none px-1 py-1.5 rounded-lg uppercase" />
                          </div>
                          <div className="flex items-center justify-between px-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-1">
                            <span className="text-[9px] text-gray-400 font-extrabold tracking-widest uppercase">PAX Totale</span>
                            <input id={`table-pax-${zIdx}-${tIdx}`} name={`table-pax-${zIdx}-${tIdx}`} type="number" min="1" max="99" value={tavolo.pax || 2} onChange={e => {
                              const newSale = [...settings.sale];
                              newSale[zIdx].tables[tIdx].pax = parseInt(e.target.value) || 1;
                              onSettingChange('sale', newSale as any);
                            }} className="w-12 text-center text-[11px] font-black bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 hover:border-gray-300 rounded-lg py-1 outline-none" />
                          </div>
                        </div>
                      ))}
                      
                      <button onClick={() => {
                        const newSale = [...settings.sale];
                        if (!newSale[zIdx].tables) newSale[zIdx].tables = [];
                        newSale[zIdx].tables.push({ id: Math.random().toString(36).substr(2, 9), name: '', pax: 2, x: 0, y: 0 });
                        onSettingChange('sale', newSale as any);
                      }} className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:text-[#008081] hover:border-[#008081] hover:bg-[#008081]/5 transition-all min-h-[90px] active:scale-95 group">
                        <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-80 mt-1">Nuovo Tavolo</span>
                      </button>
                    </div>
                    
                    <div className="mt-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-4 md:p-6 bg-gray-50/50 dark:bg-black/20 animate-fade-in-up">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#008081] mb-4 flex items-center justify-center gap-2"><div className="w-2 h-2 rounded-full bg-[#008081] animate-pulse"/> Preview Layout</h4>
                        <div className="relative w-full h-[240px] md:h-[300px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-inner bg-[radial-gradient(#d1d5db_1.2px,transparent_1.2px)] [background-size:16px_16px]">
                            {(zona.tables||[]).map((t:any) => (
                                <div key={t.id} style={{ left: `${t.x||0}%`, top: `${t.y||0}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-indigo-100 rounded-xl flex flex-col items-center justify-center shadow-md">
                                    <span className="font-black text-[10px] text-indigo-900 leading-none">{t.name}</span>
                                    <span className="text-[7px] font-bold text-gray-400 mt-0.5">{t.pax} PAX</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 text-center mt-4">Usa "Modalità Cameriere ➔ SALA ➔ Modifica Layout" per trascinare e posizionare i tavoli.</p>
                    </div>
                  </>
                )}
              </div>
            )})}
            {(Array.isArray(settings.sale) ? settings.sale : []).length === 0 && (
                <div className="text-center py-6 px-4 bg-gray-50 border border-gray-100 rounded-2xl border-dashed opacity-70">
                    <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2"/>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Nessuna sala configurata</p>
                </div>
            )}
          </div>
        </div>

        {/* QR Code */}
        {restaurantSlug && (
          <div className="border-t border-gray-100 dark:border-gray-800">
            <AccordionHeader id="qr" label="Codice QR del Menù" icon={Search} />
            <div className={`transition-all duration-300 ${expandedSection === 'qr' ? 'max-h-[1000px] opacity-100 p-5 border-t border-gray-100 dark:border-gray-800' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>
              <p className="text-sm text-gray-500 mb-6 text-center max-w-sm mx-auto">
                Stampa questo QR code per permettere ai tuoi clienti di visualizzare il menù.
              </p>
              <div className="flex flex-col items-center bg-gray-50 dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-sm mx-auto">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <QRCodeSVG id={`qr-${restaurantSlug}`} value={`https://leomenu.it/${restaurantSlug}`} size={180} level="H" includeMargin={false} fgColor="#000000" />
                </div>
                <button
                  onClick={() => {
                    const svg = document.getElementById(`qr-${restaurantSlug}`);
                    if (!svg) return;
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const imgEl = new Image();
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(svgBlob);
                    imgEl.onload = () => {
                      const padding = 40;
                      canvas.width = imgEl.width + padding * 2;
                      canvas.height = imgEl.height + padding * 2;
                      ctx.fillStyle = '#FFFFFF';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(imgEl, padding, padding, imgEl.width, imgEl.height);
                      ctx.fillStyle = '#000000';
                      ctx.font = 'bold 24px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.fillText('INQUADRA E ORDINA', canvas.width / 2, padding / 1.5);
                      URL.revokeObjectURL(url);
                      const a = document.createElement('a');
                      a.download = `Menù_QR_${restaurantSlug}.png`;
                      a.href = canvas.toDataURL('image/png');
                      a.click();
                    };
                    imgEl.src = url;
                  }}
                  className="mt-6 border-2 border-[#008081] bg-[#008081]/10 text-[#008081] hover:bg-[#008081] hover:text-white transition-all py-2.5 px-6 rounded-xl font-bold flex items-center gap-2 w-full justify-center"
                >
                  Scarica in Alta Risoluzione
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- BILLING TIER BADGE --- */}
      <div className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Piano attuale</p>
          <div className="flex items-center gap-2">
            {subscriptionTier === 'pro' || subscriptionTier === 'premium' ? (
              <><Crown className="w-4 h-4 text-amber-500" /><span className="font-bold text-amber-600 capitalize">{subscriptionTier}</span></>
            ) : (
              <span className="font-bold text-gray-700 dark:text-gray-300 capitalize">{subscriptionTier === 'trial' ? 'Trial gratuito' : subscriptionTier}</span>
            )}
          </div>
        </div>
        <button disabled className="px-4 py-2 bg-gray-100 dark:bg-[#1A1A1A] text-gray-500 text-xs font-bold rounded-xl cursor-not-allowed border border-gray-200 dark:border-gray-700">
          Upgrade (presto)
        </button>
      </div>

      {/* --- DANGER ZONE --- */}
      <div className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden">
        <button
          onClick={() => setExpandedZoneId(expandedZoneId === 'danger' ? null : 'danger')}
          className="w-full flex items-center justify-between p-5 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-red-700 dark:text-red-400">Elimina account</h3>
          </div>
          {expandedZoneId === 'danger' ? <ChevronDown className="w-5 h-5 text-red-400" /> : <ChevronRight className="w-5 h-5 text-red-400" />}
        </button>
        <div className={`transition-all duration-300 ${expandedZoneId === 'danger' ? 'max-h-[500px] opacity-100 p-5 border-t border-red-100 dark:border-red-900/30' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">L'eliminazione dell'account rimuoverà <strong>definitivamente</strong> il ristorante, tutte le categorie, i prodotti e gli ordini. Questa azione <strong>non può essere annullata</strong>.</p>
          <p className="text-xs font-bold text-red-500 mb-4 uppercase tracking-wide">⚠ Azione irreversibile</p>
          <button
            onClick={onDeleteAccount}
            className="w-full py-3 px-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" /> Elimina Account e Ristorante
          </button>
        </div>
      </div>

      <ImageCropperModal
        imageSrc={cropperState.src}
        aspect={cropperState.aspect}
        onConfirm={onCropConfirm}
        onCancel={onCropCancel}
      />
    </div>
  );
}


