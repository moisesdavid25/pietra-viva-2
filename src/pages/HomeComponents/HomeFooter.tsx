import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';

export function HomeFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white relative z-10">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10 md:gap-8">

        {/* Col 1 — Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Logo />
          </div>
          <p className="text-sm text-gray-500 leading-relaxed font-medium max-w-xs">
            Leomenu trasforma la carta del tuo ristorante in un ecosistema digitale. Menu, ordini e fidelizzazione — tutto in un posto.
          </p>
        </div>

        {/* Col 2 — Legal links */}
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Legale</p>
          <ul className="space-y-2.5">
            <li>
              <Link to="/privacy-policy" className="text-sm text-gray-500 hover:text-[#008081] font-medium transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/cookie-policy" className="text-sm text-gray-500 hover:text-[#008081] font-medium transition-colors">
                Cookie Policy
              </Link>
            </li>
            <li>
              <Link to="/termini-condizioni" className="text-sm text-gray-500 hover:text-[#008081] font-medium transition-colors">
                Termini e Condizioni
              </Link>
            </li>
            <li>
              <Link to="/contatti" className="text-sm text-gray-500 hover:text-[#008081] font-medium transition-colors">
                Contatti
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3 — Contatto */}
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Contatto</p>
          <a href="mailto:support@leomenu.it" className="text-sm text-gray-500 hover:text-[#008081] font-medium transition-colors">
            support@leomenu.it
          </a>
        </div>

      </div>
      <div className="border-t border-gray-100 py-5 text-center">
        <p className="text-gray-400 text-xs font-medium tracking-wide">
          &copy; {new Date().getFullYear()} Leomenu — Moises David Mota Rojas. Tutti i diritti riservati.
        </p>
      </div>
    </footer>
  );
}
