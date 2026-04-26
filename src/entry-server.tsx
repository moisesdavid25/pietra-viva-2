import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route, Outlet } from 'react-router';
import { MarketingNavbar } from './components/MarketingNavbar';
import { HomeFooter } from './pages/HomeComponents/HomeFooter';
import Home from './pages/Home';
import Funzionalita from './pages/Marketing/Funzionalita';
import Prezzi from './pages/Marketing/Prezzi';
import Sicurezza from './pages/Marketing/Sicurezza';
import ComeFunziona from './pages/Marketing/ComeFunziona';
import Contatti from './pages/Contatti';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Termini from './pages/Termini';
import CookiePolicy from './pages/CookiePolicy';
import Lancio from './pages/Marketing/Lancio';

// Inline MarketingLayout to avoid Outlet context issues across packages
function SSRMarketingLayout() {
  return (
    <div className="bg-white min-h-screen text-gray-600 font-sans flex flex-col overflow-x-hidden">
      <MarketingNavbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <HomeFooter />
    </div>
  );
}

export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <Routes>
        <Route element={<SSRMarketingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/funzionalita" element={<Funzionalita />} />
          <Route path="/prezzi" element={<Prezzi />} />
          <Route path="/sicurezza" element={<Sicurezza />} />
          <Route path="/come-funziona" element={<ComeFunziona />} />
        </Route>
        <Route path="/contatti" element={<Contatti />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/termini-condizioni" element={<Termini />} />
        <Route path="/terms" element={<Termini />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/lancio" element={<Lancio />} />
        <Route path="/fondatori" element={<Lancio />} />
      </Routes>
    </StaticRouter>
  );
}
