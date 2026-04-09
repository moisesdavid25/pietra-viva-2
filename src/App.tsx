import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import Home from './pages/Home';
import SearchPortal from './pages/SearchPortal';
import RestaurantHome from './pages/RestaurantHome';
import Profile from './pages/Profile';
import CartaFedelta from './pages/CartaFedelta';
import MenuPage from './pages/Menu';
import MenuDelGiorno from './pages/MenuDelGiorno';
import Gestione from './pages/Gestione';
import ProductDetail from './pages/ProductDetail';
import OrdinePage from './pages/Ordine';
import Auth from './pages/Auth';
import Cameriere from './pages/Cameriere';
import RegisterFlow from './pages/RegisterFlow';
import Onboarding from './pages/Onboarding';
import ResetPassword from './pages/ResetPassword';
import UpdatePassword from './pages/UpdatePassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Termini from './pages/Termini';
import Contatti from './pages/Contatti';
import CookiePolicy from './pages/CookiePolicy';
import { CookieBanner } from './components/CookieBanner';
import db from './db';
import LeoAdmin from './pages/LeoAdmin';

// Marketing Ecosystem
import { MarketingLayout } from './components/MarketingLayout';
import Funzionalita from './pages/Marketing/Funzionalita';
import Prezzi from './pages/Marketing/Prezzi';
import Sicurezza from './pages/Marketing/Sicurezza';
import ComeFunziona from './pages/Marketing/ComeFunziona';

function GuestRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await db.auth.getSession();
      if (session?.user) {
        try {
          const { data: roleData, error } = await db.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle();
          if (error || !roleData) {
            await db.auth.signOut();
            return;
          }

          if (roleData.role === 'admin') {
            navigate('/leomenu-admin', { replace: true });
          } else if (roleData.role === 'owner') {
            const { data: resData } = await db.from('restaurants').select('slug').eq('user_id', session.user.id).neq('slug', 'demo').limit(1).maybeSingle();
            if (resData?.slug) {
              if (window.location.hostname === 'leomenu.it') {
                window.location.href = 'https://app.leomenu.it/gestione';
              } else {
                navigate('/gestione', { replace: true });
              }
            } else {
              await db.auth.signOut();
              navigate('/register', { replace: true });
            }
          } else {
            navigate('/passport', { replace: true });
          }
        } catch (e) {
          await db.auth.signOut();
        }
      }
    }
    checkAuth();
  }, [navigate]);

  return <>{children}</>;
}

function GlobalThemeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    const applyTheme = (hex: string) => {
      document.documentElement.style.setProperty('--primary', hex);
      // Determine if text should be dark or light
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      document.documentElement.style.setProperty('--primary-foreground', yiq >= 128 ? '#1a1a1a' : '#ffffff');
    };

    const fetchThemeParams = async () => {
      const pathParts = location.pathname.split('/').filter(Boolean);
      const firstPart = pathParts[0];
      const staticRoutes = ['login', 'register', 'passport', 'reset-password', 'update-password', 'privacy-policy', 'termini-condizioni', 'onboarding', 'gestione', 'trova', 'funzionalita', 'prezzi', 'sicurezza', 'come-funziona', 'leomenu-admin', 'contatti', 'privacy', 'terms', 'contact', ''];

      if (firstPart && !staticRoutes.includes(firstPart)) {
        // Customer viewing a specific restaurant
        const { data } = await db.from('restaurants').select('brand_color').eq('slug', firstPart).maybeSingle();
        if (data?.brand_color) applyTheme(data.brand_color);
      } else {
        // Logged in owner or guest
        const { data: { session } } = await db.auth.getSession();
        if (session?.user) {
          const { data } = await db.from('restaurants').select('brand_color').eq('user_id', session.user.id).limit(1).maybeSingle();
          if (data?.brand_color) {
             applyTheme(data.brand_color);
             return;
          }
        }
        // Default color
        applyTheme('#008081');
      }
    };

    fetchThemeParams();
  }, [location.pathname]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalThemeProvider>
      <CookieBanner />
      <Routes>
        {/* Marketing Web Ecosystem */}
        <Route element={<GuestRoute><MarketingLayout /></GuestRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/funzionalita" element={<Funzionalita />} />
          <Route path="/prezzi" element={<Prezzi />} />
          <Route path="/sicurezza" element={<Sicurezza />} />
          <Route path="/come-funziona" element={<ComeFunziona />} />
        </Route>

        {/* Search Portal: 'Hai fame? Trova il gusto' */}
        <Route path="/trova" element={<SearchPortal />} />

        {/* Auth & Platform Routes */}
        <Route path="/login" element={<GuestRoute><Auth type="login" /></GuestRoute>} />
        <Route path="/register" element={<RegisterFlow />} />
        <Route path="/passport" element={<CartaFedelta />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/termini-condizioni" element={<Termini />} />
        <Route path="/terms" element={<Termini />} />
        <Route path="/contatti" element={<Contatti />} />
        <Route path="/contact" element={<Contatti />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/gestione" element={<Gestione />} />
        <Route path="/:slug/gestione" element={<Gestione />} />
        <Route path="/leomenu-admin/*" element={<LeoAdmin />} />

        {/* Dynamic Restaurant Routes — clean slug: app.leomenu.it/[restaurant-slug] */}
        <Route path="/:slug" element={<RestaurantHome />} />
        <Route path="/:slug/profile" element={<Profile />} />
        <Route path="/:slug/menu/:section" element={<MenuPage />} />
        <Route path="/:slug/menu-del-giorno" element={<MenuDelGiorno />} />
        <Route path="/:slug/product/:id" element={<ProductDetail />} />
        <Route path="/:slug/ordini" element={<OrdinePage />} />
        <Route path="/:slug/cameriere" element={<Cameriere />} />
      </Routes>
      </GlobalThemeProvider>
    </BrowserRouter>
  );
}


