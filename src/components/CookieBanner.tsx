import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, 'necessary');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-600 flex-1">
          Utilizziamo cookie tecnici necessari per il funzionamento del sito e cookie analitici anonimi per migliorare l'esperienza.{' '}
          <Link to="/cookie-policy" className="text-[#008081] hover:underline font-medium">
            Cookie Policy
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reject}
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Solo necessari
          </button>
          <button
            onClick={accept}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#008081] text-white hover:bg-teal-600 transition-colors"
          >
            Accetta tutti
          </button>
        </div>
      </div>
    </div>
  );
}
