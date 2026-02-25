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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu/:section" element={<MenuPage />} />
        <Route path="/menu-del-giorno" element={<MenuDelGiorno />} />
        <Route path="/gestione" element={<Gestione />} />
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
