import React from 'react';
import { X, Type, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const SettingsDrawer: React.FC = () => {
  const {
    isMenuOpen,
    closeMenu,
    fontSize,
    setFontSize,
    showTransliteration,
    toggleTransliteration,
    showTranslation,
    toggleTranslation,
    showArabic,
    toggleArabic,
    showPerWord,
    togglePerWord,
    quranFont,
    setQuranFont,
    arabicOpacity,
    setArabicOpacity
  } = useSettings();

  if (!isMenuOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={closeMenu}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out border-l border-gray-100 dark:border-slate-800">
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pengaturan</h2>
            <button 
              onClick={closeMenu}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
            >
              <X size={24} />
            </button>
          </div>

          <hr className="border-gray-100 dark:border-slate-800 mb-8" />

          {/* Font Size */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ukuran Huruf Arab</label>
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-700">
              <button 
                onClick={() => setFontSize(Math.max(1, fontSize - 1))}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm text-gray-600 dark:text-gray-300 disabled:opacity-50"
                disabled={fontSize <= 1}
              >
                <Type size={16} />
              </button>
              <div className="flex-1 text-center font-bold text-emerald-600 dark:text-emerald-400">{fontSize}</div>
              <button 
                onClick={() => setFontSize(Math.min(5, fontSize + 1))}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm text-gray-600 dark:text-gray-300 disabled:opacity-50"
                disabled={fontSize >= 5}
              >
                <Type size={24} />
              </button>
            </div>
          </div>

          {/* Arabic Opacity */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Opacity Teks Arab</label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">0%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={arabicOpacity}
                onChange={(e) => setArabicOpacity(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-emerald-600"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">100%</span>
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{arabicOpacity}%</span>
            </div>
          </div>

          {/* Font Style */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Jenis Font Quran</label>
            <select
              value={quranFont}
              onChange={(e) => setQuranFont(e.target.value as 'lpmq' | 'indopak')}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/30 transition-all"
            >
              <option value="lpmq">LPMQ</option>
              <option value="indopak">IndoPak</option>
            </select>
          </div>

          <hr className="border-gray-100 dark:border-slate-800 mb-8" />

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan Teks Arab</span>
              <button
                onClick={toggleArabic}
                className={`p-2 rounded-lg transition-colors ${showArabic ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'text-gray-400 bg-gray-100 dark:bg-slate-800'}`}
              >
                {showArabic ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan Transliterasi</span>
              <button
                onClick={toggleTransliteration}
                className={`p-2 rounded-lg transition-colors ${showTransliteration ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'text-gray-400 bg-gray-100 dark:bg-slate-800'}`}
              >
                {showTransliteration ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan Terjemahan</span>
              <button
                onClick={toggleTranslation}
                className={`p-2 rounded-lg transition-colors ${showTranslation ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'text-gray-400 bg-gray-100 dark:bg-slate-800'}`}
              >
                {showTranslation ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan Per Kata</span>
              <button
                onClick={togglePerWord}
                className={`p-2 rounded-lg transition-colors ${showPerWord ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'text-gray-400 bg-gray-100 dark:bg-slate-800'}`}
              >
                {showPerWord ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default SettingsDrawer;
