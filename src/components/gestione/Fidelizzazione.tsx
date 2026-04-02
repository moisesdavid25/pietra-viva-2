import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Gift, Users, TrendingUp, ScanLine, ArrowLeft, X, Smartphone, Mail, CreditCard } from 'lucide-react';
import db from '../../db';
import WaiterScanner from './WaiterScanner';

const RewardManager = lazy(() => import('./RewardManager'));
const ClientClassification = lazy(() => import('./ClientClassification'));
const FidelityStrategy = lazy(() => import('./FidelityStrategy'));

interface Props { restaurantId: string; }

interface Customer {
  id: string; name: string; whatsapp: string; auth_user_id: string;
  total_points: number; created_at: string;
}

interface Reward {
  id: string; name: string; points_required: number; description: string; image_url: string;
}

type Tab = 'home' | 'premi' | 'cohorts' | 'strategia';

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <span className="w-7 h-7 border-2 border-[#008081] border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function CRMAndAudience({ restaurantId }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showOwnerCarousel, setShowOwnerCarousel] = useState(() => !localStorage.getItem(`fidelity_owner_welcome_${restaurantId}`));
  const [ownerSlide, setOwnerSlide] = useState(0);

  const dismissOwnerCarousel = () => {
    localStorage.setItem(`fidelity_owner_welcome_${restaurantId}`, '1');
    setShowOwnerCarousel(false);
  };

  useEffect(() => { fetchData(); }, [restaurantId]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: custs }, { data: txns }, { data: rws }, { data: owners }] = await Promise.all([
      db.from('customers').select('id,name,whatsapp,auth_user_id,total_points,created_at,last_visited_at').eq('restaurant_id', restaurantId).order('total_points', { ascending: false }),
      db.from('loyalty_transactions').select('points_earned').eq('restaurant_id', restaurantId),
      db.from('rewards').select('id,name,points_required,description,image_url').eq('restaurant_id', restaurantId).order('points_required', { ascending: true }),
      db.from('user_roles').select('user_id').eq('role', 'owner'),
    ]);
    if (custs) {
      const ownerIds = new Set((owners || []).map((o: any) => o.user_id));
      setCustomers(custs.filter((c: any) => !c.auth_user_id || !ownerIds.has(c.auth_user_id)) as Customer[]);
    }
    if (txns) setTotalPoints(txns.reduce((s: number, t: any) => s + (t.points_earned || 0), 0));
    if (rws) setRewards(rws as Reward[]);
    setLoading(false);
  };

  // Sidebar tabs 
  const SIDEBAR_TABS = [
    { id: 'home' as Tab, label: 'Audience Overview', icon: TrendingUp },
    { id: 'cohorts' as Tab, label: 'Client Cohorts', icon: Users },
    { id: 'premi' as Tab, label: 'Reward Engine', icon: Gift },
    { id: 'strategia' as Tab, label: 'Growth & ROI', icon: TrendingUp },
  ];

  // Cohort Calculus
  const greenCohort = customers.filter(c => c.total_points < 500);
  const goldCohort = customers.filter(c => c.total_points >= 500 && c.total_points < 2500);
  const reserveCohort = customers.filter(c => c.total_points >= 2500);

  const totalRev = (customers.reduce((s, c) => s + c.total_points, 0) / 10);
  const greenRev = (greenCohort.reduce((s, c) => s + c.total_points, 0) / 10);
  const goldRev = (goldCohort.reduce((s, c) => s + c.total_points, 0) / 10);
  const reserveRev = (reserveCohort.reduce((s, c) => s + c.total_points, 0) / 10);

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in relative">

      {/* ── Owner Welcome Carousel ── */}
      {showOwnerCarousel && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#FBFBFB]/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md p-6">
          <div className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md p-10 shadow-2xl">
            {ownerSlide === 0 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-[#008081]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                   <Users className="w-8 h-8 text-[#008081]" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-[#1A1A1A] dark:text-white tracking-tight">Il Cervello del Tuo Ristorante</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">Questa non è solo una lista di clienti. È un <strong>Motore di Crescita B2B</strong>. Usa i dati comportamentali per aumentare il ticket medio e la frequenza di ritorno.</p>
              </div>
            )}
            {ownerSlide === 1 && (
              <div className="text-center">
                 <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                   <Smartphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-[#1A1A1A] dark:text-white tracking-tight">Onboarding Invisibile</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">Scansionando il menù QR e pagando, i tuoi clienti vengono registrati tramite Apple/Google ID. Nessun modulo noioso da compilare. <strong>Dati nel tuo CRM, istantaneamente.</strong></p>
              </div>
            )}
            {ownerSlide === 2 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                   <CreditCard className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-[#1A1A1A] dark:text-white tracking-tight">Passbook Nativo</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">La tua Fidelity Card vive nel Wallet del cliente. Trasforma il tuo brand in un'abitudine sfruttando le notifiche push native sui loro iPhone.</p>
              </div>
            )}
            <div className="flex justify-center gap-2 mt-8 mb-6">
              {[0, 1, 2].map(i => <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${ownerSlide === i ? 'w-8 bg-[#008081]' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />)}
            </div>
            <div className="flex gap-3">
              <button onClick={dismissOwnerCarousel} className="flex font-bold items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest px-4">
                Salta
              </button>
              <button
                onClick={() => { if (ownerSlide < 2) setOwnerSlide(ownerSlide + 1); else dismissOwnerCarousel(); }}
                className="flex-1 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-black py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center"
              >
                {ownerSlide < 2 ? 'Prossimo Pssso' : 'Avvia CRM'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:flex lg:w-64 flex-shrink-0">
        <div className="flex flex-col gap-2 w-full lg:sticky lg:top-24">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-4 mb-2">Moduli Audience</p>
          {SIDEBAR_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-sm group ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#262626] text-[#008081] shadow-sm border border-gray-100 dark:border-gray-800'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-[#1A1A1A] hover:text-gray-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <tab.icon className={`w-4 h-4 flex-shrink-0 transition-transform ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              {tab.label}
            </button>
          ))}

          <div className="mt-8 px-4">
             <div className="bg-[#008081] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
               <ScanLine className="w-6 h-6 mb-3" />
               <h4 className="font-black text-sm mb-1">POS Scanner</h4>
               <p className="text-[10px] font-medium text-white/80 mb-4 block">Assegna punti velocemente al terminale.</p>
               <button onClick={() => setShowScanner(true)} className="w-full bg-white text-[#008081] font-black text-xs py-2 rounded-xl hover:bg-gray-50 transition-colors">Apri Scanner</button>
             </div>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 space-y-4 min-w-0 pb-16">

        {/* ── MOBILE: Horizontal tab bar ── */}
        <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SIDEBAR_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap text-xs transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] shadow-md'
                  : 'bg-white dark:bg-[#262626] text-gray-500 border border-gray-200 dark:border-gray-800'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: HOME / DASHBOARD (World Class Cohorts View) ── */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header / Top KPIs */}
            <div className="flex items-center justify-between mb-2">
               <div>
                  <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">Panoramica Audience</h2>
                  <p className="text-sm font-bold text-gray-500">Analisi comportamentale e Wallet retention.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1C1C1C] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Membri Attivi</p>
                <p className="text-4xl font-black leading-none text-[#1A1A1A] dark:text-white">{customers.length}</p>
              </div>
               <div className="bg-white dark:bg-[#1C1C1C] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valore Punti Generato</p>
                <div className="flex items-end gap-2">
                   <p className="text-4xl font-black leading-none text-[#1A1A1A] dark:text-white">€{totalRev.toFixed(0)}</p>
                   <p className="text-xs font-bold text-[#008081] mb-1 bg-[#008081]/10 px-2 py-0.5 rounded-md">LTV</p>
                </div>
              </div>
              <div className="bg-[#1A1A1A] p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                 <div className="absolute right-0 top-0 w-32 h-32 bg-[#008081] rounded-full filter blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Push Campaigns</p>
                 <p className="text-2xl font-black leading-tight text-white relative z-10">Genera una campagna CRM</p>
                 <button onClick={() => setActiveTab('strategia')} className="mt-4 flex items-center gap-1 text-xs font-bold bg-white text-[#1A1A1A] px-3 py-1.5 rounded-lg relative z-10 hover:bg-gray-100">
                    <Mail className="w-3.5 h-3.5" /> Crea Campaign
                 </button>
              </div>
            </div>

            {/* Apple Wallet Mockup & Cohorts - Layout Asimmetrico */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               
               {/* Left: Cohort Breakdown (8 cols) */}
               <div className="lg:col-span-8 bg-white dark:bg-[#1C1C1C] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="font-black text-lg">Distribuzione Cohorti</h3>
                     <span className="text-[10px] uppercase font-black tracking-widest text-[#008081] bg-[#008081]/10 px-2 py-1 rounded-md">Tiers</span>
                  </div>

                  <div className="space-y-5">
                     {/* Tier 1 */}
                     <div>
                        <div className="flex justify-between items-end mb-2">
                           <div>
                              <p className="text-sm font-black text-[#1A1A1A] dark:text-white flex items-center gap-1.5">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Green <span className="text-gray-400 font-medium ml-1">(&lt; 500 pt)</span>
                              </p>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-emerald-600 block leading-none">{greenCohort.length} <span className="text-xs text-gray-400 font-bold ml-1">utenti</span></p>
                           </div>
                        </div>
                        <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${customers.length ? Math.max((greenCohort.length / customers.length) * 100, 2) : 0}%` }}></div>
                        </div>
                     </div>

                     {/* Tier 2 */}
                     <div>
                        <div className="flex justify-between items-end mb-2">
                           <div>
                              <p className="text-sm font-black text-[#1A1A1A] dark:text-white flex items-center gap-1.5">
                                 <div className="w-2 h-2 rounded-full bg-amber-400"></div> Gold <span className="text-gray-400 font-medium ml-1">(&lt; 2500 pt)</span>
                              </p>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-amber-500 block leading-none">{goldCohort.length} <span className="text-xs text-gray-400 font-bold ml-1">utenti</span></p>
                           </div>
                        </div>
                        <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-400 rounded-full" style={{ width: `${customers.length ? Math.max((goldCohort.length / customers.length) * 100, 2) : 0}%` }}></div>
                        </div>
                     </div>

                     {/* Tier 3 */}
                     <div>
                        <div className="flex justify-between items-end mb-2">
                           <div>
                              <p className="text-sm font-black text-[#1A1A1A] dark:text-white flex items-center gap-1.5">
                                 <div className="w-2 h-2 rounded-full bg-purple-500"></div> Reserve <span className="text-gray-400 font-medium ml-1">(2500+ pt)</span>
                              </p>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-purple-600 block leading-none">{reserveCohort.length} <span className="text-xs text-gray-400 font-bold ml-1">utenti</span></p>
                           </div>
                        </div>
                        <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                           <div className="h-full bg-purple-500 rounded-full" style={{ width: `${customers.length ? Math.max((reserveCohort.length / customers.length) * 100, 2) : 0}%` }}></div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right: Apple Wallet Integration Mockup (4 cols) */}
               <div className="lg:col-span-4 bg-gradient-to-br from-gray-900 to-[#121212] p-6 rounded-3xl shadow-xl shadow-black/10 relative overflow-hidden flex flex-col justify-between group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full filter blur-[40px]"></div>
                  
                  <div className="relative z-10 mb-8">
                     <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Ecosistema Apple</p>
                     <h3 className="font-black text-xl text-white">Native Wallet</h3>
                     <p className="text-gray-400 text-xs font-medium mt-2 leading-relaxed">Trasforma il tuo ristorante in un'app installata permanentemente sui device dei clienti, inviando Push Notifications geo-localizzate.</p>
                  </div>

                  <div className="relative z-10 flex justify-center">
                     {/* Estetica Apple Wallet Pass */}
                     <div className="w-48 bg-white rounded-2xl shadow-xl overflow-hidden transform group-hover:-translate-y-2 transition-transform duration-500 border border-white/20">
                        {/* Pass Header */}
                        <div className="bg-[#008081] h-20 p-4 pb-0 flex flex-col justify-end relative">
                           <div className="w-10 h-10 bg-white rounded-full absolute -top-5 right-4 shadow-sm"></div>
                           <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">Leomenu VIP</p>
                           <p className="text-white font-black text-lg leading-tight uppercase truncate">Pietra Viva</p>
                        </div>
                        {/* Pass Body */}
                        <div className="p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-gray-50 h-32">
                           <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                              <div>
                                 <p className="text-[8px] uppercase text-gray-400 font-bold">Saldo Punti</p>
                                 <p className="font-black text-[#1A1A1A]">1,240</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[8px] uppercase text-gray-400 font-bold">Livello</p>
                                 <p className="font-black text-amber-500 text-xs uppercase px-2 py-0.5 bg-amber-50 rounded-md">Gold</p>
                              </div>
                           </div>
                           <div className="flex items-center justify-center h-12 w-full mt-3">
                              <div className="flex gap-0.5 opacity-40">
                                 {[...Array(24)].map((_,i) => <div key={i} className={`h-8 w-0.5 ${i%3 === 0 ? 'bg-black' : 'bg-gray-400'}`}></div>)}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <button className="mt-8 relative z-10 w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 backdrop-blur-sm">
                     <Smartphone className="w-4 h-4" /> Configura Apple Wallet
                  </button>
               </div>
            </div>

          </div>
        )}

        {/* ── TAB: PREMI ── */}
        {activeTab === 'premi' && (
          <Suspense fallback={<Spinner />}>
            <RewardManager
              restaurantId={restaurantId}
              rewards={rewards}
              onRewardsChange={setRewards}
            />
          </Suspense>
        )}

        {/* ── TAB: COHORTS ── */}
        {activeTab === 'cohorts' && (
          <Suspense fallback={<Spinner />}>
            <ClientClassification
              customers={customers}
              rewards={rewards}
              loading={loading}
              onScannerOpen={() => setShowScanner(true)}
            />
          </Suspense>
        )}

        {/* ── TAB: STRATEGIA ── */}
        {activeTab === 'strategia' && (
          <Suspense fallback={<Spinner />}>
            <FidelityStrategy restaurantId={restaurantId} />
          </Suspense>
        )}
      </div>

      {/* WaiterScanner modal down at root */}
      {showScanner && (
        <WaiterScanner
          restaurantId={restaurantId}
          onClose={() => setShowScanner(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
