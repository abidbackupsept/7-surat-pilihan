import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type QuranFont = 'lpmq' | 'indopak';
type QariId = number;

interface QariOption {
  id: QariId;
  name: string;
  arabicName: string;
}

interface SettingsContextType {
  theme: Theme;
  toggleTheme: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  showTransliteration: boolean;
  toggleTransliteration: () => void;
  showTranslation: boolean;
  toggleTranslation: () => void;
  showArabic: boolean;
  toggleArabic: () => void;
  showPerWord: boolean; // Tampilan per kata
  togglePerWord: () => void; // Toggle tampilan per kata
  quranFont: QuranFont;
  setQuranFont: (font: QuranFont) => void;
  qariId: QariId;
  setQariId: (id: QariId) => void;
  arabicOpacity: number;
  setArabicOpacity: (opacity: number) => void;
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const QARI_OPTIONS: QariOption[] = [
  { id: 1, name: 'Abdul Baset', arabicName: 'عبد الباسط' },
  { id: 7, name: 'Mishari Rashid Alafasy', arabicName: 'مشاري راشد العفاسي' },
];

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state (with potential localStorage in a real app, using defaults here)
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('theme') as Theme || 'light');
  const [fontSize, setFontSize] = useState<number>(() => {
    const storedFontSize = localStorage.getItem('fontSize');
    return storedFontSize ? parseInt(storedFontSize) : 3;
  });
  const [showTransliteration, setShowTransliteration] = useState<boolean>(() => {
    const storedTransliteration = localStorage.getItem('showTransliteration');
    return storedTransliteration ? JSON.parse(storedTransliteration) : true;
  });
  const [showTranslation, setShowTranslation] = useState<boolean>(() => {
    const storedTranslation = localStorage.getItem('showTranslation');
    return storedTranslation ? JSON.parse(storedTranslation) : true;
  });
  const [showArabic, setShowArabic] = useState<boolean>(() => {
    const storedArabic = localStorage.getItem('showArabic');
    return storedArabic ? JSON.parse(storedArabic) : true;
  });
  const [showPerWord, setShowPerWord] = useState<boolean>(() => {
    const storedPerWord = localStorage.getItem('showPerWord');
    return storedPerWord ? JSON.parse(storedPerWord) : true;
  });
  const [quranFont, setQuranFont] = useState<QuranFont>(() => localStorage.getItem('quranFont') as QuranFont || 'lpmq');
  const [qariId, setQariId] = useState<QariId>(() => {
    const storedQariId = localStorage.getItem('qariId');
    return storedQariId ? parseInt(storedQariId) : 7;
  });
  const [arabicOpacity, setArabicOpacity] = useState<number>(() => {
    const storedArabicOpacity = localStorage.getItem('arabicOpacity');
    return storedArabicOpacity ? parseInt(storedArabicOpacity) : 100;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle Dark Mode Class on HTML/Body
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('showTransliteration', JSON.stringify(showTransliteration));
  }, [showTransliteration]);

  useEffect(() => {
    localStorage.setItem('showTranslation', JSON.stringify(showTranslation));
  }, [showTranslation]);

  useEffect(() => {
    localStorage.setItem('showArabic', JSON.stringify(showArabic));
  }, [showArabic]);

  useEffect(() => {
    localStorage.setItem('showPerWord', JSON.stringify(showPerWord));
  }, [showPerWord]);

  useEffect(() => {
    localStorage.setItem('quranFont', quranFont);
  }, [quranFont]);

  useEffect(() => {
    localStorage.setItem('qariId', qariId.toString());
  }, [qariId]);

  useEffect(() => {
    localStorage.setItem('arabicOpacity', arabicOpacity.toString());
  }, [arabicOpacity]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleTransliteration = () => setShowTransliteration(prev => !prev);
  const toggleTranslation = () => setShowTranslation(prev => !prev);
  const toggleArabic = () => setShowArabic(prev => !prev);
  const togglePerWord = () => setShowPerWord(prev => !prev);
  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <SettingsContext.Provider value={{
      theme,
      toggleTheme,
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
      qariId,
      setQariId,
      arabicOpacity,
      setArabicOpacity,
      isMenuOpen,
      toggleMenu,
      closeMenu
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
