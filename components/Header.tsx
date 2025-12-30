import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Menu, Moon, Sun } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import NetworkStatus from './NetworkStatus';

const Header: React.FC = () => {
  const { toggleMenu, theme, toggleTheme } = useSettings();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-emerald-600 text-white p-2 rounded-lg group-hover:bg-emerald-700 transition-colors">
            <BookOpen size={24} />
          </div>
          <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">7 Surat Pilihan</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
            aria-label="Toggle Theme"
            title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <NetworkStatus />
          <button
            onClick={toggleMenu}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
            aria-label="Menu Settings"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;