/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MenuPage from './pages/Menu';
import MenuDelGiorno from './pages/MenuDelGiorno';
import Gestione from './pages/Gestione';
import ProductDetail from './pages/ProductDetail';
import OrdinePage from './pages/Ordine';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import RegisterFlow from './pages/RegisterFlow';
import Onboarding from './pages/Onboarding';
import ResetPassword from './pages/ResetPassword';
import UpdatePassword from './pages/UpdatePassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Termini from './pages/Termini';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth type="login" />} />
        <Route path="/register" element={<RegisterFlow />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/termini-condizioni" element={<Termini />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/gestione" element={<Gestione />} />
        <Route path="/:slug/gestione" element={<Gestione />} />

        {/* Dynamic Tenant Routes */}
        <Route path="/:slug" element={<Home />} />
        <Route path="/:slug/menu/:section" element={<MenuPage />} />
        <Route path="/:slug/menu-del-giorno" element={<MenuDelGiorno />} />
        <Route path="/:slug/product/:id" element={<ProductDetail />} />
        <Route path="/:slug/ordini" element={<OrdinePage />} />
      </Routes>
    </BrowserRouter>
  );
}
