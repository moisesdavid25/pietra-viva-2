import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { Menu, X } from 'lucide-react';

export function MarketingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Come Funziona', path: '/funzionalita' },
    { name: 'Prezzi', path: '/prezzi' },
    { name: 'Sicurezza', path: '/sicurezza' },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-white/0 border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center pr-8">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 flex-1">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`text-[15px] font-bold transition-all relative group ${location.pathname === link.path ? 'text-[#008081]' : 'text-gray-600 hover:text-[#008081]'}`}
              >
                {link.name}
                {/* Active Indicator Underline */}
                {location.pathname === link.path && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#008081] rounded-full"></span>
                )}
                {/* Hover Underline Animation */}
                {location.pathname !== link.path && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#008081]/30 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <a href="https://app.leomenu.it/login" className="text-sm font-extrabold text-[#1A1A1A] hover:text-[#008081] transition-colors py-2 px-3">
              Accedi
            </a>
            <a href="https://app.leomenu.it/register" className="text-sm font-extrabold bg-[#008081] text-white px-5 py-3 rounded-xl hover:bg-teal-600 hover:-translate-y-0.5 transition-all shadow-sm shadow-[#008081]/20 active:scale-95">
              Inizia Gratis
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-[#008081] transition-colors p-2"
            >
              <span className="sr-only">Apri menu principale</span>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-2xl absolute w-full inset-x-0 top-20 flex flex-col pt-4 pb-8 px-6 animate-fade-in origin-top">
          <div className="flex flex-col gap-2 mb-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`text-xl font-extrabold py-3 px-4 rounded-xl transition-colors ${location.pathname === link.path ? 'bg-[#008081]/5 text-[#008081]' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
            <a href="https://app.leomenu.it/login" className="text-center text-[15px] font-extrabold text-[#1A1A1A] py-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors">
              Accedi al tuo account
            </a>
            <a href="https://app.leomenu.it/register" className="text-center text-[15px] font-extrabold bg-[#008081] text-white py-4 rounded-2xl shadow-lg shadow-[#008081]/30 active:scale-95 transition-transform">
              Inizia Ora
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
