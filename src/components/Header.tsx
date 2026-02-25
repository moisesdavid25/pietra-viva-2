import { Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#F5F5F5]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md px-6 py-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-800 h-[72px]">
      <Link to="/" className="w-10 h-10 bg-[#008080] rounded-full flex items-center justify-center shadow-lg shadow-[#008080]/20">
        <Utensils className="w-5 h-5 text-white" />
      </Link>
    </header>
  );
}
