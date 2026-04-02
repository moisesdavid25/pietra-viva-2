import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, LogOut, Search, Award, QrCode, X, User, Save, Store, ChevronDown, ChevronUp, Trash2, Info, Home, ClipboardList } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import db from '../db';

interface Reward {
    id: string;
    restaurant_id: string;
    name: string;
    points_required: number;
    description: string;
    image_url: string;
}

interface RestaurantCard {
    id: string;
    slug: string;
    name: string;
    indirizzo: string;
    citta: string;
    logo_url: string;
    points: number;
    rewards: Reward[];
}

import { usePassportAuth } from '../hooks/usePassportAuth';
import { usePassportData } from '../hooks/usePassportData';
import { usePassportSearch } from '../hooks/usePassportSearch';

export default function GlobalPassport() {
    const {
        user,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        isSavingProfile,
        isAuthLoading,
        handleLogout,
        handleSaveProfile,
        handleDeleteCustomerAccount
    } = usePassportAuth();

    const {
        myRestaurants,
        tierBenefitsMap,
        isDataLoading,
        handleRemoveAffiliation
    } = usePassportData(user?.id);

    const {
        globalSearch,
        setGlobalSearch,
        globalSearchResults,
        isSearchingGlobal
    } = usePassportSearch();
    
    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [showGlobalQr, setShowGlobalQr] = useState(false);
    const [qrModalRestaurantId, setQrModalRestaurantId] = useState<string | null>(null);
    const [cardTab, setCardTab] = useState<Record<string, 'premi' | 'vantaggi'>>({});
    const [infoModalRestaurantId, setInfoModalRestaurantId] = useState<string | null>(null);
    
    const location = useLocation();
    const [showWelcomeCarousel, setShowWelcomeCarousel] = useState(() => !localStorage.getItem('passport_welcome_seen') || location.search.includes('wizard=true'));
    const [welcomeSlide, setWelcomeSlide] = useState(0);
    const [tasteProfile, setTasteProfile] = useState<string[]>([]);
    
    // Profile Edit
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Custom Modal State
    const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, restaurantId: string, restaurantName: string}>({ isOpen: false, restaurantId: '', restaurantName: '' });

    // Tabs
    const [activeTab, setActiveTab] = useState<'home' | 'ordini' | 'profilo'>('home');

    const handleConfirmRemove = async () => {
        await handleRemoveAffiliation(confirmModal.restaurantId);
        setConfirmModal({ isOpen: false, restaurantId: '', restaurantName: '' });
    };

    if (isAuthLoading || (user && isDataLoading)) {
        return <div className="min-h-screen flex items-center justify-center bg-[#FBFBFB] dark:bg-[#1A1A1A]"><div className="w-8 h-8 rounded-full border-4 border-[#008081] border-t-transparent animate-spin"></div></div>;
    }

    const filteredRestaurants = myRestaurants.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] min-h-screen font-sans pb-24">
            {/* Header / Hero - Only shown on home */}
            {activeTab === 'home' && (
            <div className="bg-[#008081] text-white pt-10 pb-16 px-6 rounded-b-[2rem] shadow-lg relative z-10">
                 <div className="flex justify-between items-center mb-6">
                     <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors -ml-2">
                         <ArrowLeft className="w-6 h-6" />
                     </Link>
                     <button onClick={handleLogout} className="text-sm font-bold opacity-80 hover:opacity-100 flex items-center gap-1 transition-opacity">
                         Esci <LogOut className="w-4 h-4" />
                     </button>
                 </div>
                 
                 <div className="flex items-center justify-between">
                     <div>
                         <h1 className="text-3xl font-extrabold tracking-tight mb-1">La tua Fidelity Card</h1>
                         <p className="opacity-90">{firstName ? `${firstName} ${lastName}` : user?.email}</p>
                     </div>
                 </div>
            </div>
            )}

            {/* ----- TABS CONTENT ----- */}

            {activeTab === 'home' && (
            <div className="px-6 mt-6">
                {/* Scopri Nuovi Ristoranti */}
                <div className="mb-10">
                    <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2"><Search className="w-5 h-5 text-[#008081]"/> Scopri Nuovi Ristoranti</h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Cerca su Leomenu..." 
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            className="w-full bg-white dark:bg-[#2A2A2A] rounded-2xl py-3.5 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008081]/30 transition-all border border-gray-100 dark:border-gray-800 font-medium"
                        />
                         {isSearchingGlobal && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#008081] border-t-transparent rounded-full animate-spin"></span>
                        )}
                        {globalSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#2A2A2A] rounded-2xl shadow-premium border border-gray-100 dark:border-gray-800 flex flex-col p-2 max-h-64 overflow-y-auto z-50">
                                {globalSearchResults.map(rest => (
                                    <Link key={rest.id} to={`/${rest.slug}`} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-xl transition-colors">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            {rest.logo_url ? <img src={rest.logo_url} className="w-full h-full object-contain p-1" /> : <Store className="w-5 h-5 text-gray-400" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm truncate">{rest.name}</h4>
                                            <p className="text-xs text-gray-400 truncate">Vedi menù &rArr;</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Le tue Fidelity */}
                <h2 className="text-xl font-extrabold mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Award className="w-5 h-5 text-[#008081]"/> Le tue Fidelity</div>
                    <button onClick={() => setShowGlobalQr(true)} className="text-xs font-bold bg-[#008081]/10 text-[#008081] px-3 py-1.5 rounded-full hover:bg-[#008081]/20 transition-colors flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        ID Globale
                    </button>
                </h2>
                
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Filtra le tue carte..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-[#2A2A2A] rounded-full py-2.5 pl-10 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008081]/20 text-sm border border-gray-100 dark:border-gray-800"
                    />
                </div>

                {filteredRestaurants.length === 0 ? (
                    <div className="bg-white dark:bg-[#2A2A2A] rounded-3xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                        <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">{searchTerm ? 'Nessuna fidelity trovata in questo elenco.' : 'Nessun ristorante ancora salvato nella tua Fidelity Card.'}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filteredRestaurants.map((r) => {
                             const rewardsEarned = r.rewards.filter(rw => r.points >= rw.points_required).length;
                             const isExpanded = expandedCardId === r.id;
                             const isQrOpen = qrModalRestaurantId === r.id;

                             const getCustomerLevel = (points: number) => {
                               if (points >= 2500) return { label: 'Reserve 💎', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', nextTier: null, nextLabel: null };
                               if (points >= 500) return { label: 'Gold ⭐', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500', nextTier: 2500, nextLabel: 'Reserve' };
                               return { label: 'Green 🌿', color: 'bg-[#008081]/10 text-[#008081]', nextTier: 500, nextLabel: 'Gold' };
                             };

                             const levelData = getCustomerLevel(r.points);

                             return (
                                 <div key={r.id} className="bg-white dark:bg-[#2A2A2A] rounded-3xl overflow-hidden shadow-premium border border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-300">
                                     {/* Accordion Header */}
                                     <div 
                                        className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333] transition-colors relative"
                                        onClick={() => setExpandedCardId(isExpanded ? null : r.id)}
                                     >
                                         {r.logo_url ? (
                                             <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-700 bg-white">
                                                <img src={r.logo_url} className="w-full h-full object-contain p-1" />
                                             </div>
                                         ) : (
                                             <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 font-bold text-gray-500 text-xl">
                                                 {r.name.charAt(0)}
                                             </div>
                                         )}
                                         <div className="flex-1 min-w-0">
                                             <h3 className="font-bold text-lg leading-tight truncate flex items-center gap-2">
                                                 {r.name}
                                                 <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${levelData.color}`}>
                                                     {levelData.label}
                                                 </span>
                                             </h3>
                                             <div className="flex items-center gap-2 mt-1">
                                                 <span className="text-sm font-extrabold text-[#008081]">{r.points} <span className="text-xs font-semibold text-gray-500">Stelle</span></span>
                                                 {rewardsEarned > 0 && (
                                                     <span className="bg-[#008081]/10 text-[#008081] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase truncate">
                                                         {rewardsEarned} Premi
                                                     </span>
                                                 )}
                                             </div>
                                         </div>
                                         {/* QR Button in header */}
                                         <button
                                           onClick={(e) => { e.stopPropagation(); setQrModalRestaurantId(r.id); }}
                                           className="w-9 h-9 rounded-xl bg-[#008081]/10 border border-[#008081]/20 flex items-center justify-center flex-shrink-0 text-[#008081] hover:bg-[#008081] hover:text-white transition-all"
                                           title="Mostra QR in cassa"
                                         >
                                           <QrCode className="w-4 h-4" />
                                         </button>
                                         <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 text-[#008081]">
                                             {isExpanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                                         </div>
                                     </div>

                                     {/* Per-card QR Modal */}
                                     {isQrOpen && (
                                         <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6" onClick={() => setQrModalRestaurantId(null)}>
                                             <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] p-8 max-w-xs w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                                                 <button onClick={() => setQrModalRestaurantId(null)} className="absolute top-5 right-5 p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X className="w-5 h-5" /></button>
                                                 <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm mb-3">
                                                     {r.logo_url ? <img src={r.logo_url} className="w-full h-full object-contain p-1" /> : <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-gray-400">{r.name.charAt(0)}</div>}
                                                 </div>
                                                 <h3 className="font-extrabold text-xl mb-1 text-[#1A1A1A] dark:text-white">{r.name}</h3>
                                                 <p className="text-sm text-gray-500 mb-5">Mostra al cassiere per guadagnare stelle</p>
                                                 <div className="flex justify-center mb-4">
                                                     <div className="bg-white p-4 rounded-3xl border border-[#008081]/20 shadow-sm">
                                                         <QRCodeSVG value={`${user?.id}|${r.slug}`} size={160} fgColor="#008081" />
                                                     </div>
                                                 </div>
                                                 <p className="text-xs text-gray-400 mb-5">Livello: <span className={`font-bold px-1.5 py-0.5 rounded ${levelData.color}`}>{levelData.label}</span> · {r.points} Stelle</p>
                                                 {/* Google Wallet button */}
                                                 <button
                                                   onClick={() => alert('🚀 Google Wallet integration disponibile prossimamente! La tua Fidelity Card sarà accessibile direttamente dal portafoglio digitale.')}
                                                   className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] dark:bg-white text-white dark:text-black font-bold py-3 rounded-2xl text-sm active:scale-95 transition-all shadow-md"
                                                 >
                                                   <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                                                   Aggiungi a Google Wallet
                                                 </button>
                                             </div>
                                         </div>
                                     )}

                                     {/* Accordion Body */}
                                     <div className={`transition-all duration-300 ease-in-out origin-top ${isExpanded ? 'opacity-100 max-h-[1200px]' : 'opacity-0 max-h-0'}`}>
                                         <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                                             
                                             {/* Tab switcher */}
                                             <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-[#1A1A1A] rounded-xl p-1">
                                               {(['premi', 'vantaggi'] as const).map(tab => (
                                                 <button
                                                   key={tab}
                                                   onClick={() => setCardTab(prev => ({ ...prev, [r.id]: tab }))}
                                                   className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                                     (cardTab[r.id] || 'premi') === tab
                                                       ? 'bg-white dark:bg-[#2A2A2A] text-[#008081] shadow-sm'
                                                       : 'text-gray-400'
                                                   }`}
                                                 >
                                                   {tab === 'premi' ? '🎁 I Miei Premi' : '⭐ Vantaggi Livello'}
                                                 </button>
                                               ))}
                                             </div>

                                             {(cardTab[r.id] || 'premi') === 'premi' ? (
                                               <>
                                                 {/* Milestone Banner */}
                                                 {levelData.nextTier && (
                                                    <div className="bg-[#008081]/5 border border-[#008081]/10 rounded-2xl p-3 mb-4 flex items-center justify-between animate-fade-in">
                                                        <div>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Progresso Livello</p>
                                                            <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">Sei a <span className="text-[#008081] font-black">{levelData.nextTier - r.points} Stelle</span> dal diventare Cliente {levelData.nextLabel}!</p>
                                                        </div>
                                                    </div>
                                                 )}

                                                 {/* Reward Progress Bars */}
                                                 <div className="mb-4 space-y-3">
                                                     {r.rewards.map(reward => {
                                                         const progress = Math.min((r.points / reward.points_required) * 100, 100);
                                                         const isUnlocked = r.points >= reward.points_required;
                                                         const remaining = Math.max(0, reward.points_required - r.points);
                                                         return (
                                                             <div key={reward.id} className="bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl p-3 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                                                                 {reward.image_url ? (
                                                                     <img src={reward.image_url} alt={reward.name} className="w-12 h-12 object-cover rounded-xl shadow-sm bg-white flex-shrink-0" />
                                                                 ) : (
                                                                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isUnlocked ? 'bg-[#008081]/10 text-[#008081]' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                                                                         <Award className="w-6 h-6" />
                                                                     </div>
                                                                 )}
                                                                 <div className="flex-1 w-full">
                                                                     <div className="flex justify-between items-start mb-1">
                                                                         <div>
                                                                             <h4 className={`font-bold text-sm leading-none mb-1 capitalize ${isUnlocked ? 'text-[#008081]' : 'text-[#1A1A1A] dark:text-white'}`}>{reward.name}</h4>
                                                                             {reward.description && <p className="text-[10px] text-gray-500 line-clamp-1">{reward.description}</p>}
                                                                         </div>
                                                                         <span className="text-xs font-black text-gray-500 whitespace-nowrap ml-2">{reward.points_required} Stars</span>
                                                                     </div>
                                                                     <span className="text-[10px] font-bold text-gray-400 block mb-1.5">{isUnlocked ? '✅ Sbloccato! Mostra il QR in cassa' : `${remaining} Stelle mancanti`}</span>
                                                                     <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                                         <div className={`h-2 rounded-full transition-all duration-700 ${isUnlocked ? 'bg-[#008081]' : 'bg-amber-400'}`} style={{ width: `${progress}%` }} />
                                                                     </div>
                                                                 </div>
                                                             </div>
                                                         );
                                                     })}
                                                     {r.rewards.length === 0 && (
                                                         <div className="text-center py-4 text-sm text-gray-500">Nessun premio disponibile al momento.</div>
                                                     )}
                                                 </div>

                                                 {/* QR Hint */}
                                                 <div className="bg-[#008081]/5 border border-[#008081]/10 rounded-2xl p-3 mb-4 flex items-center gap-3">
                                                     <QrCode className="w-5 h-5 text-[#008081] flex-shrink-0" />
                                                     <p className="text-xs text-[#008081] font-medium">Tocca il pulsante QR nell'header per accumulare Stelle.</p>
                                                 </div>
                                               </>
                                             ) : (
                                               /* Vantaggi Livello tab — Visual Lock System */
                                               <div className="space-y-3">
                                                 <p className="text-xs font-bold text-gray-400 uppercase mb-2">Vantaggi del tuo percorso fedeltà</p>

                                                 {/* Current level benefit - always unlocked */}
                                                 <div className="bg-[#008081]/5 border border-[#008081]/20 rounded-2xl p-4">
                                                   <div className="flex items-center gap-3">
                                                     <span className="text-2xl">🌿</span>
                                                     <div className="flex-1">
                                                       <p className="font-bold text-sm text-[#008081]">Green — Attivo</p>
                                                       <p className="text-xs text-gray-500">Moltiplicatore 1.0× · Premi base sbloccati</p>
                                                     </div>
                                                     <span className="text-[#008081] text-lg">✅</span>
                                                   </div>
                                                 </div>

                                                 {/* Gold benefits — locked unless >= 500 pts */}
                                                 <div className={`rounded-2xl p-4 border transition-all ${r.points >= 500 ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30' : 'bg-gray-50 dark:bg-[#1A1A1A] border-gray-100 dark:border-gray-800 opacity-75'}`}>
                                                   <div className="flex items-center gap-3 mb-2">
                                                     <span className="text-2xl">{r.points >= 500 ? '⭐' : '🔒'}</span>
                                                     <div className="flex-1">
                                                       <p className={`font-bold text-sm ${r.points >= 500 ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-400'}`}>Gold — {r.points >= 500 ? 'Attivo' : `${500 - r.points} Stelle mancanti`}</p>
                                                       <p className="text-xs text-gray-500">Moltiplicatore 1.2× · Benefici esclusivi</p>
                                                     </div>
                                                   </div>
                                                   <div className="space-y-1.5 ml-9">
                                                     {[{ icon: '🎂', label: 'Regalo di Compleanno' }, { icon: '🎯', label: 'Offerte mensili personalizzate' }, { icon: '⚡', label: 'Early access nuovi prodotti' }].map(b => (
                                                       <div key={b.label} className={`flex items-center gap-2 text-xs ${r.points >= 500 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                                                         <span>{b.icon}</span>
                                                         <span className={r.points < 500 ? 'blur-[2px]' : ''}>{b.label}</span>
                                                         {r.points < 500 && <span className="text-gray-300 ml-auto">🔒</span>}
                                                       </div>
                                                     ))}
                                                   </div>
                                                 </div>

                                                 {/* Reserve benefits — locked unless >= 2500 pts */}
                                                 <div className={`rounded-2xl p-4 border transition-all ${r.points >= 2500 ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/30' : 'bg-gray-50 dark:bg-[#1A1A1A] border-gray-100 dark:border-gray-800 opacity-75'}`}>
                                                   <div className="flex items-center gap-3 mb-2">
                                                     <span className="text-2xl">{r.points >= 2500 ? '💎' : '🔒'}</span>
                                                     <div className="flex-1">
                                                       <p className={`font-bold text-sm ${r.points >= 2500 ? 'text-purple-700 dark:text-purple-400' : 'text-gray-400'}`}>Reserve — {r.points >= 2500 ? 'Attivo' : `${2500 - r.points} Stelle mancanti`}</p>
                                                       <p className="text-xs text-gray-500">Moltiplicatore 1.7× · Status VIP esclusivo</p>
                                                     </div>
                                                   </div>
                                                   <div className="space-y-1.5 ml-9">
                                                     {[{ icon: '☕', label: 'Refill Caffè gratuito' }, { icon: '🍾', label: 'Tavolo riservato prioritario' }, { icon: '👑', label: 'Inviti eventi esclusivi' }, { icon: '💌', label: 'Messaggi personalizzati dallo chef' }].map(b => (
                                                       <div key={b.label} className={`flex items-center gap-2 text-xs ${r.points >= 2500 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                                                         <span>{b.icon}</span>
                                                         <span className={r.points < 2500 ? 'blur-[2px]' : ''}>{b.label}</span>
                                                         {r.points < 2500 && <span className="text-gray-300 ml-auto">🔒</span>}
                                                       </div>
                                                     ))}
                                                   </div>
                                                 </div>
                                               </div>
                                             )}
                                             {/* Actions */}
                                             <div className="flex gap-2 mb-4">
                                                 <Link 
                                                    to={`/${r.slug}`}
                                                    className="flex-1 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] py-3.5 rounded-2xl font-bold flex items-center justify-center gap-1 transition-transform active:scale-95 shadow-md"
                                                 >
                                                    Apri Menu
                                                 </Link>
                                             </div>

                                             {/* Rimuovi Affiliazione */}
                                             <div className="flex justify-center border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
                                                 <button 
                                                    onClick={() => setConfirmModal({ isOpen: true, restaurantId: r.id, restaurantName: r.name })}
                                                    className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                                 >
                                                     <Trash2 className="w-3.5 h-3.5" /> Rimuovi Carta
                                                 </button>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             );
                        })}
                    </div>
                )}
            </div>
            )}

            {activeTab === 'ordini' && (
                <div className="p-6 mt-10 text-center animate-fade-in flex flex-col items-center justify-center min-h-[50vh]">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h2 className="text-xl font-extrabold mb-2 text-[#1A1A1A] dark:text-white">I tuoi Ordini</h2>
                    <p className="text-gray-500 font-medium max-w-xs mx-auto">Non hai ancora effettuato ordini tramite la piattaforma Leomenu.</p>
                </div>
            )}

            {activeTab === 'profilo' && (
                <div className="p-6 mt-4 animate-fade-in pb-24">
                    <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2 text-[#1A1A1A] dark:text-white">Il tuo Profilo</h2>
                    
                    <div className="bg-white dark:bg-[#2A2A2A] rounded-3xl p-6 shadow-premium border border-gray-100 dark:border-gray-800 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2"><User className="w-5 h-5 text-[#008081]"/> I Miei Dati</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <input 
                                    type="text" 
                                    placeholder="Nome"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#008081]/30 border border-gray-200 dark:border-gray-700"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Cognome"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#008081]/30 border border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            <button 
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="w-full bg-[#1A1A1A] dark:bg-[#333] hover:bg-black text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                                {isSavingProfile ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <><Save className="w-5 h-5"/> Salva Modifiche</>}
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-[#2A2A2A] rounded-3xl p-6 shadow-premium border border-red-100 dark:border-red-900/30">
                        <h3 className="font-bold text-lg text-red-600 mb-2">Elimina account</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Sei sicuro di voler eliminare il tuo account cliente? Perderai l'accesso ai tuoi punti fedeltà, ordini storici e preferenze salvate.</p>
                        <button onClick={handleDeleteCustomerAccount} className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-3.5 rounded-2xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm">
                            Elimina definitivamente
                        </button>
                    </div>
                    
                    <button onClick={handleLogout} className="w-full mt-6 py-4 font-bold text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors flex items-center justify-center gap-2">
                        Esci dall'app <LogOut className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Welcome Carousel for first-time customers */}
            {showWelcomeCarousel && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-8 shadow-2xl">
                        {welcomeSlide === 0 && (
                            <div className="text-center">
                                <span className="text-5xl block mb-4">🌿</span>
                                <h3 className="text-2xl font-extrabold mb-2 text-[#1A1A1A] dark:text-white">Benvenuto nella tua Fidelity!</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Accumula Stelle ad ogni visita. <strong>1€ speso = 3 Stelle</strong> guadagnate.</p>
                            </div>
                        )}
                        {welcomeSlide === 1 && (
                            <div className="text-center">
                                <span className="text-5xl block mb-4">⭐💎</span>
                                <h3 className="text-2xl font-extrabold mb-2 text-[#1A1A1A] dark:text-white">Scala i Livelli</h3>
                                <div className="text-left space-y-2 mt-4">
                                    <div className="flex items-center gap-3 bg-[#008081]/5 rounded-xl p-3">
                                        <span className="text-lg">🌿</span>
                                        <div><p className="font-bold text-sm text-[#008081]">Green — 0–499 Stars</p><p className="text-xs text-gray-500">Moltiplicatore 1.0×</p></div>                                    </div>
                                    <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-3">
                                        <span className="text-lg">⭐</span>
                                        <div><p className="font-bold text-sm text-yellow-700">Gold — 500–2499 Stars</p><p className="text-xs text-gray-500">Moltiplicatore 1.2×</p></div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3">
                                        <span className="text-lg">💎</span>
                                        <div><p className="font-bold text-sm text-purple-700">Reserve — 2500+ Stars</p><p className="text-xs text-gray-500">Moltiplicatore 1.7×</p></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {welcomeSlide === 2 && (
                            <div className="text-center">
                                <span className="text-5xl block mb-4">🎁</span>
                                <h3 className="text-2xl font-extrabold mb-2 text-[#1A1A1A] dark:text-white">Sblocca Premi</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Ogni ristorante offre premi esclusivi. Mostra il QR al cassiere per guadagnare e riscattare Stelle istantaneamente.</p>
                            </div>
                        )}
                        {welcomeSlide === 3 && (
                            <div className="text-center">
                                <span className="text-5xl block mb-4">🍽️</span>
                                <h3 className="text-2xl font-extrabold mb-2 text-[#1A1A1A] dark:text-white">Il tuo Profilo Gusto</h3>
                                <p className="text-gray-500 text-sm mb-5">Cosa ami di più? Gli chef potranno sorprenderti con offerte su misura.</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[{ icon: '🍕', label: 'Pizza' }, { icon: '🍔', label: 'Burger' }, { icon: '☕', label: 'Caffè' }, { icon: '🍝', label: 'Pasta' }, { icon: '🥗', label: 'Insalate' }, { icon: '🍷', label: 'Vino' }].map(opt => {
                                        const isSelected = tasteProfile.includes(opt.label);
                                        return (
                                        <button
                                            key={opt.label}
                                            onClick={() => {
                                                if (isSelected) setTasteProfile(prev => prev.filter(p => p !== opt.label));
                                                else setTasteProfile(prev => [...prev, opt.label]);
                                            }}
                                            className={`flex items-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                                                isSelected
                                                    ? 'border-[#008081] bg-[#008081]/10 text-[#008081]'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#008081]/30'
                                            }`}
                                        >
                                            <span className="text-xl">{opt.icon}</span> {opt.label}
                                        </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {/* Dots */}
                        <div className="flex justify-center gap-2 mt-6 mb-4">
                            {[0,1,2,3].map(i => <div key={i} className={`h-1.5 rounded-full transition-all ${welcomeSlide === i ? 'w-6 bg-[#008081]' : 'w-1.5 bg-gray-300'}`} />)}
                        </div>
                        <button
                            onClick={async () => {
                                if (welcomeSlide < 3) { setWelcomeSlide(welcomeSlide + 1); }
                                else {
                                    localStorage.setItem('passport_welcome_seen', '1');
                                    setShowWelcomeCarousel(false);
                                    // Save taste profile if selected
                                    if (tasteProfile.length > 0 && user) {
                                        const { data: custRow } = await db.from('customers')
                                            .select('id').eq('auth_user_id', user.id).limit(1).maybeSingle();
                                        if (custRow) {
                                            await db.from('customers').update({ preferences: { taste_profile: tasteProfile } }).eq('id', custRow.id);
                                        }
                                    }
                                }
                            }}
                            className="w-full bg-[#008081] text-white font-bold py-3.5 rounded-2xl shadow-md active:scale-95 transition-all"
                        >
                            {welcomeSlide < 3 ? 'Avanti →' : 'Inizia a guadagnare! 🚀'}
                        </button>
                    </div>
                </div>
            )}

            {/* Global QR Modal */}
            {showGlobalQr && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm animate-fade-in" onClick={() => setShowGlobalQr(false)}>
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] p-8 max-w-sm w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowGlobalQr(false)} className="absolute top-5 right-5 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-[#1A1A1A] dark:text-white">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-extrabold mb-1 text-center">ID Globale</h3>
                        <p className="text-gray-500 mb-8 text-center text-sm font-medium">Il tuo identificativo universale</p>
                        <div className="flex justify-center mb-6">
                            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <QRCodeSVG value={user?.id || ''} size={180} fgColor="#1A1A1A" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal (Rimuovi Affiliazione) */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmModal({isOpen: false, restaurantId: '', restaurantName: ''})}>
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-6 max-w-sm w-full relative shadow-2xl transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-xl font-extrabold mb-2 text-center text-[#1A1A1A] dark:text-white">Rimuovi Affiliazione</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-8">
                            Sei sicuro di voler rimuovere <strong className="text-[#1A1A1A] dark:text-white">{confirmModal.restaurantName}</strong> dalle tue Fidelity?
                            <br/><br/>
                            <span className="text-red-500 font-medium">Perderai tutte le stelle accumulate.</span>
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setConfirmModal({isOpen: false, restaurantId: '', restaurantName: ''})}
                                className="flex-1 py-3.5 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#333] dark:text-gray-300 dark:hover:bg-[#444] transition-colors"
                            >
                                Annulla
                            </button>
                            <button 
                                onClick={handleRemoveAffiliation}
                                className="flex-1 py-3.5 rounded-2xl font-bold bg-[#008081] text-white hover:bg-teal-700 shadow-md shadow-[#008081]/30 transition-all active:scale-95"
                            >
                                Rimuovi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1A] border-t border-gray-100 dark:border-gray-800 flex justify-around items-center p-3 z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-6 lg:pb-3">
                <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 transition-colors w-20 ${activeTab === 'home' ? 'text-[#008081]' : 'text-gray-400 hover:text-[#008081]/70'}`}>
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Home</span>
                </button>
                <button onClick={() => setActiveTab('ordini')} className={`flex flex-col items-center gap-1.5 transition-colors w-20 ${activeTab === 'ordini' ? 'text-[#008081]' : 'text-gray-400 hover:text-[#008081]/70'}`}>
                    <ClipboardList className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Ordini</span>
                </button>
                <button onClick={() => setActiveTab('profilo')} className={`flex flex-col items-center gap-1.5 transition-colors w-20 ${activeTab === 'profilo' ? 'text-[#008081]' : 'text-gray-400 hover:text-[#008081]/70'}`}>
                    <User className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Profilo</span>
                </button>
            </div>
            
        </div>
    );
}



