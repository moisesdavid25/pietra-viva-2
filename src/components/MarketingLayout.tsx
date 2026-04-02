import React from 'react';
import { Outlet } from 'react-router-dom';
import { MarketingNavbar } from './MarketingNavbar';
import { HomeFooter } from '../pages/HomeComponents/HomeFooter';

export function MarketingLayout() {
  return (
    <div className="bg-white min-h-screen text-gray-600 font-sans selection:bg-[#008081] selection:text-white flex flex-col overflow-x-hidden">
      {/* Universal Navbar mapped dynamically depending on scroll */}
      <MarketingNavbar />
      
      {/* Route-specific content rendered here (e.g. Home, Prezzi, Funzionalità) */}
      <main className="flex-grow">
        <Outlet />
      </main>
      
      {/* Universal Footer */}
      <HomeFooter />
    </div>
  );
}
