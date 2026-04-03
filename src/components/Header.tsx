import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#F0F0F0]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md px-6 py-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-800 h-[72px]">
      <Link to="/" className="flex items-center justify-center h-8 my-auto">`n        <Logo />`n      </Link>
    </header>
  );
}

