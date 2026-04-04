import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, ChevronRight, QrCode, Grid, Search, PlusCircle, AlertCircle, RefreshCw, Utensils } from 'lucide-react';
import db from '../../db';
import ImageCropperModal from '../ImageCropperModal';

interface OnboardingWizardProps {
    restaurantId: string;
    onComplete: () => void;
}

export default function OnboardingWizard({ restaurantId, onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Step 1: Identidad
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [themeColor, setThemeColor] = useState('#008081');
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // Cropper State
    const [cropperState, setCropperState] = useState<{ src: string | null; aspect: number; callback: ((b64: string) => void) | null }>({ src: null, aspect: 1, callback: null });

    // Step 2: Menú (Aha Moment)
    const [catName, setCatName] = useState('');
    const [prodName, setProdName] = useState('');
    const [prodPrice, setProdPrice] = useState('10.00');

    // Step 3: Sala (POS capability)
    const [menuGiornoEnabled, setMenuGiornoEnabled] = useState(false);
    const [zones, setZones] = useState([{ name: 'Sala Interna', tableCount: '10' }]);

    useEffect(() => {
        const fetchExisting = async () => {
            if (!restaurantId) return;
            const { data } = await db.from('restaurants').select('name, slug').eq('id', restaurantId).single();
            if (data?.name) setName(data.name);
            if (data?.slug) setSlug(data.slug);

            const { data: settings } = await db.from('settings').select('key, value').eq('restaurant_id', restaurantId);
            const logo = settings?.find(s => s.key === 'logo_url');
            const color = settings?.find(s => s.key === 'theme_color');
            if (logo?.value) setLogoPreview(logo.value);
            if (color?.value) setThemeColor(color.value);
        };
        fetchExisting();
    }, [restaurantId]);

    const saveIdentity = async () => {
        if (!name.trim()) return;
        setLoading(true);
        setError('');
        try {
            // Generate slug if empty
            let currentSlug = slug;
            if (!currentSlug) {
                currentSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                setSlug(currentSlug);
            }

            // Update name and slug and brand color
            await db.from('restaurants').update({ name, slug: currentSlug, brand_color: themeColor }).eq('id', restaurantId);
            
            // Upload logo if new
            let savedLogoUrl = logoPreview;
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `${restaurantId}_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await db.storage.from('media').upload(fileName, logoFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = db.storage.from('media').getPublicUrl(fileName);
                savedLogoUrl = urlData.publicUrl;
            }

            // Upsert settings (logo_url, theme_color)
            if (savedLogoUrl) {
                await upsertSetting('logo_url', savedLogoUrl);
            }
            await upsertSetting('theme_color', themeColor);
            
            setStep(2);
        } catch (err: any) {
            setError(err.message || 'Error guardando identidad.');
        } finally {
            setLoading(false);
        }
    };

    const upsertSetting = async (key: string, value: string) => {
        const { data: existing } = await db.from('settings').select('id').eq('restaurant_id', restaurantId).eq('key', key).maybeSingle();
        if (existing) {
            await db.from('settings').update({ value }).eq('id', existing.id);
        } else {
            await db.from('settings').insert({ restaurant_id: restaurantId, key, value });
        }
    };

    const saveMenu = async () => {
        if (!catName.trim() || !prodName.trim() || !prodPrice.trim()) return;
        setLoading(true);
        setError('');
        try {
            const { data: catData, error: catError } = await db.from('categories').insert({
                restaurant_id: restaurantId,
                name: catName,
                section: catName
            }).select().single();
            if (catError) throw catError;

            const { error: prodError } = await db.from('products').insert({
                restaurant_id: restaurantId,
                category_id: catData.id,
                name: prodName,
                price: parseFloat(prodPrice),
                description: 'Il mio primo prodotto su Leomenu!'
            });
            if (prodError) throw prodError;

            // Optional: trigger Aha Moment modal here, but for now we transition to Step 3
            setStep(3);
        } catch (err: any) {
            setError(err.message || 'Error guardando menú.');
        } finally {
            setLoading(false);
        }
    };

    const buildTables = (count: number) => {
        const cols = Math.min(count, Math.ceil(Math.sqrt(count)));
        const rows = Math.ceil(count / cols);
        const colSpacing = cols > 1 ? Math.floor(80 / cols) : 40;
        const rowSpacing = rows > 1 ? Math.floor(80 / rows) : 40;
        return Array.from({ length: count }, (_, i) => ({
            id: (i + 1).toString(),
            name: (i + 1).toString(),
            numero: (i + 1).toString(),
            stato: 'libero',
            posti: 4,
            x: 5 + (i % cols) * colSpacing,
            y: 5 + Math.floor(i / cols) * rowSpacing,
        }));
    };

    const saveRoom = async () => {
        const validZones = zones.filter(z => z.name.trim() && parseInt(z.tableCount) > 0);
        if (validZones.length === 0) return;
        setLoading(true);
        setError('');
        try {
            const sale = validZones.map((z, i) => ({
                id: (i + 1).toString(),
                name: z.name,
                tables: buildTables(parseInt(z.tableCount)),
            }));

            await upsertSetting('sale', JSON.stringify(sale));
            await upsertSetting('wizard_completed', 'true');
            await upsertSetting('menu_del_giorno_enabled', menuGiornoEnabled ? 'true' : 'false');
            
            setStep(4);
        } catch (err: any) {
            setError(err.message || 'Error creando sala.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            setCropperState({
                src: tempUrl,
                aspect: 1, // 1:1 ratio
                callback: async (base64) => {
                    const res = await fetch(base64);
                    const blob = await res.blob();
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + '-cropped.webp', { type: 'image/webp' });
                    setLogoFile(newFile);
                    setLogoPreview(base64);
                    setCropperState({ src: null, aspect: 1, callback: null });
                }
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white dark:bg-[#252525] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col font-sans border border-gray-100 dark:border-gray-800 animate-slide-up">
                
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800">
                    <div 
                        className="h-full bg-[#008081] transition-all duration-500" 
                        style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }}
                    ></div>
                </div>

                <div className="p-8 flex-1">
                    <div className="flex items-center gap-2 text-[#008081] mb-6">
                        <Utensils className="w-6 h-6" />
                        <span className="font-bold tracking-widest text-sm">Leomenu Setup</span>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h2 className="text-3xl font-extrabold mb-2 dark:text-white">Identità del Ristorante</h2>
                            <p className="text-gray-500 mb-8">Personalizza il look del tuo menù digitale.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nome del Locale</label>
                                    <input value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-[#1f1f1f] rounded-2xl outline-none focus:ring-2 focus:ring-[#008081]/30 dark:text-white" placeholder="Es. Osteria della Nonna" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-[#1f1f1f] border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <Camera className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Carica il tuo Logo (opzionale)</label>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#008081]/10 file:text-[#008081] hover:file:bg-[#008081]/20 cursor-pointer" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Colore del Brand</label>
                                    <div className="flex gap-3">
                                        {['#008081', '#E63946', '#1D3557', '#F4A261', '#2A9D8F'].map(color => (
                                            <button key={color} onClick={() => setThemeColor(color)} className={`w-10 h-10 rounded-full cursor-pointer transition-transform ${themeColor === color ? 'ring-4 ring-offset-2 scale-110 ring-gray-200 dark:ring-gray-700' : ''}`} style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 flex justify-end">
                                <button onClick={saveIdentity} disabled={loading || !name.trim()} className="bg-[#008081] hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Continua'} <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h2 className="text-3xl font-extrabold mb-2 dark:text-white">Il tuo primo piatto</h2>
                            <p className="text-gray-500 mb-8">Crea subito il primo elemento per vedere il tuo menù prendere vita.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Crea una Categoria</label>
                                    <input value={catName} onChange={e => setCatName(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-[#1f1f1f] rounded-2xl outline-none focus:ring-2 focus:ring-[#008081]/30 dark:text-white" placeholder="Es. Pizze, Primi, Bevande..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nome Piatto</label>
                                        <input value={prodName} onChange={e => setProdName(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-[#1f1f1f] rounded-2xl outline-none focus:ring-2 focus:ring-[#008081]/30 dark:text-white" placeholder="Es. Margherita" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Prezzo (€)</label>
                                        <input value={prodPrice} onChange={e => setProdPrice(e.target.value)} type="number" step="0.50" className="w-full p-4 bg-gray-50 dark:bg-[#1f1f1f] rounded-2xl outline-none focus:ring-2 focus:ring-[#008081]/30 dark:text-white" placeholder="Aggiungi prezzo..." />
                                    </div>
                                </div>
                            </div>

                            {/* Aha Moment hint */}
                            <div className="mt-8 bg-[#008081]/5 border border-[#008081]/20 rounded-2xl p-4 flex items-center gap-4">
                                <QrCode className="w-8 h-8 text-[#008081]" />
                                <div>
                                    <h4 className="font-bold text-[#008081]">Magia in arrivo!</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">Appena salvi, il tuo menù digitale è già consultabile online tramite QR Code.</p>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button onClick={saveMenu} disabled={loading || !catName.trim() || !prodName.trim() || !prodPrice.trim()} className="bg-[#008081] hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Crea Piatto'} <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in overflow-y-auto max-h-[60vh] pr-1">
                            <h2 className="text-3xl font-extrabold mb-2 dark:text-white">Preparazione Sala</h2>
                            <p className="text-gray-500 mb-6">Configura le zone del tuo locale. Puoi aggiungere più aree (es. Sala Interna + Terrazza).</p>

                            <div className="space-y-4 mb-4">
                                {zones.map((zone, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 dark:bg-[#1f1f1f] rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Zona {idx + 1}</span>
                                            {zones.length > 1 && (
                                                <button type="button" onClick={() => setZones(z => z.filter((_, i) => i !== idx))} className="text-xs text-red-400 hover:text-red-600 font-bold">Rimuovi</button>
                                            )}
                                        </div>
                                        <input
                                            value={zone.name}
                                            onChange={e => setZones(z => z.map((zo, i) => i === idx ? { ...zo, name: e.target.value } : zo))}
                                            className="w-full p-3 bg-white dark:bg-[#262626] rounded-xl outline-none focus:ring-2 focus:ring-[#008081]/30 dark:text-white border border-gray-200 dark:border-gray-600 text-sm"
                                            placeholder="Es. Sala Interna, Terrazza, Bar..."
                                        />
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs font-bold text-gray-500 whitespace-nowrap">N° Tavoli:</label>
                                            <input
                                                value={zone.tableCount}
                                                type="number" min="1" max="50"
                                                onChange={e => setZones(z => z.map((zo, i) => i === idx ? { ...zo, tableCount: e.target.value } : zo))}
                                                className="w-24 p-3 bg-white dark:bg-[#262626] rounded-xl outline-none focus:ring-2 focus:ring-[#008081]/30 dark:text-white border border-gray-200 dark:border-gray-600 text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {zones.length < 4 && (
                                <button type="button" onClick={() => setZones(z => [...z, { name: '', tableCount: '5' }])} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-sm font-bold text-gray-400 hover:border-[#008081] hover:text-[#008081] transition-colors flex items-center justify-center gap-2 mb-4">
                                    <PlusCircle className="w-4 h-4" /> Aggiungi zona
                                </button>
                            )}

                            {/* Menù del Giorno toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1f1f1f] rounded-2xl border border-gray-200 dark:border-gray-700">
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white">Offri il Menù del Giorno?</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Attiva se proponi un menù fisso giornaliero ai tuoi clienti.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMenuGiornoEnabled(v => !v)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${menuGiornoEnabled ? 'bg-[#008081]' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${menuGiornoEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button onClick={saveRoom} disabled={loading || zones.every(z => !z.name.trim())} className="bg-[#008081] hover:bg-teal-700 text-white font-bold py-3 px-10 rounded-full flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Entra in Leomenu'}
                                </button>
                            </div>
                        </div>
                    )}
                    {step === 4 && (
                        <div className="animate-fade-in flex-1 flex flex-col items-center justify-center text-center">
                            <div className="relative mb-6 group">
                                <div className="absolute inset-0 bg-[#008081] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                                <CheckCircle className="w-24 h-24 text-[#008081] relative z-10" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-3xl font-bold mb-4 dark:text-white">Configurazione Completata!</h2>
                            <p className="text-gray-500 mb-10 max-w-sm mx-auto">
                                Il tuo ristorante è stato configurato con successo. Ora puoi accedere al sistema gestionale e iniziare a ricevere ordini.
                            </p>

                            <button onClick={onComplete} className="w-full text-[#008081] bg-teal-50 hover:bg-teal-100 py-4 rounded-full font-bold transition-all active:scale-95 z-10 mb-4 border border-teal-200">
                                Vai al Dashboard
                            </button>

                            <button onClick={() => window.location.href = `/${slug}/cameriere`} className="w-full text-white bg-[#008081] hover:bg-teal-700 py-4 rounded-full font-bold shadow-md transition-all active:scale-95 z-10">
                                Modalità Cameriere
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {cropperState.src && (
                <ImageCropperModal
                    imageSrc={cropperState.src}
                    aspect={cropperState.aspect}
                    onConfirm={(b64) => cropperState.callback?.(b64)}
                    onCancel={() => setCropperState({ src: null, aspect: 1, callback: null })}
                />
            )}
        </div>
    );
}
