import React, { forwardRef } from 'react';
import { Play, Pause, Share2 } from 'lucide-react';
import { Verse } from '../types';
import Word from './Word';
import { useSettings } from '../contexts/SettingsContext';

interface VerseRowProps {
  verse: Verse;
  surahName: string;
  isPlaying: boolean;
  isActive?: boolean;
  onPlay: (audioUrl: string | null) => void;
  onPause: () => void;
}

const VerseRow = forwardRef<HTMLDivElement, VerseRowProps>(({ verse, surahName, isPlaying, isActive, onPlay, onPause }, ref) => {
  const { showTranslation, showArabic, showPerWord, quranFont, arabicOpacity, fontSize } = useSettings();

  // Helper to clean translation text (remove footnotes like <sup foot_note=...>)
  const cleanTranslation = (text: string) => {
    if (!text) return "";
    // Regex to remove <sup ...>...</sup> and plain <sup>...</sup> tags
    return text.replace(/<sup[^>]*>.*?<\/sup>/g, '').trim();
  };

  // Extract full translation and clean it
  const rawTranslationText = verse.translations?.[0]?.text || "Terjemahan tidak tersedia";
  const translationText = cleanTranslation(rawTranslationText);

  // Get all words including end word (verse marker)
  const allWords = verse.words;

  const handleShare = async () => {
    const textToShare = `Surah ${surahName} Ayat ${verse.verse_key}\n\n${translationText}\n\nDibagikan via 7 Surat Pilihan`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Surah ${surahName}:${verse.verse_key}`,
          text: textToShare,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(textToShare);
      alert('Teks ayat disalin ke clipboard!');
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      onPause();
    } else {
      // Build audio URL. API v4 usually returns partial path or full path.
      let url = verse.audio.url;
      if (url && !url.startsWith('http')) {
        url = `https://verses.quran.com/${url}`;
      }
      onPlay(url);
    }
  };

  return (
    <div
      ref={ref}
      data-verse-id={verse.id}
      className={`
        border-b border-gray-100 dark:border-slate-800 py-6 px-2 md:px-6 transition-all duration-500
        ${isActive
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500'
          : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'}
      `}
    >
      {/* Action Header */}
      <div className="flex justify-between items-start mb-6">
        <div className={`flex items-center gap-3 rounded-full px-3 py-1 ${isActive ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-gray-100 dark:bg-slate-800'}`}>
            <span className={`text-sm font-semibold ${isActive ? 'text-emerald-800 dark:text-emerald-100' : 'text-gray-600 dark:text-gray-300'}`}>{verse.verse_key}</span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 rounded-full transition-all"
            title="Bagikan Ayat"
          >
            <Share2 size={20} />
          </button>
          <button 
            onClick={toggleAudio}
            className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30'}`}
            title={isPlaying ? 'Jeda Audio' : 'Putar Audio'}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        
        {/* Left Sidebar: Empty space for alignment */}
        <div className="hidden md:flex w-24 shrink-0 self-start mt-1">
            {/* Empty space for alignment */}
        </div>

        {/* Right Content: Words & Translation */}
        <div className="flex-1">
          {showArabic && (
            <>
              {/* Conditional rendering for per-word or full verse */}
              {showPerWord ? (
                <div className="flex flex-wrap mb-10" dir="rtl">
                  {allWords.map((word) => (
                    <Word key={word.id} word={word} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap mb-10 gap-y-10 md:gap-y-14" dir="rtl">
                  {allWords.map(word => {
                    if (word.char_type_name === 'end') {
                      return (
                        <div
                          key={word.id}
                          className={`leading-loose transition-all duration-300 text-emerald-600 dark:text-emerald-400 font-uthmani`}
                          dir="rtl"
                          style={{
                            fontSize: `${getFontSize(fontSize)}rem`,
                            opacity: arabicOpacity/100,
                            height: `${getFontSize(fontSize)}rem`,
                            display: 'flex',
                            alignItems: 'center',
                            margin: '10px 0.1rem'
                          }}
                        >
                          {word.text_uthmani}
                        </div>
                      );
                    }
                    
                    return (
                      <span
                        key={word.id}
                        className={`font-${quranFont} mx-1 text-gray-900 dark:text-gray-100`}
                        style={{
                          fontSize: `${getFontSize(fontSize)}rem`,
                          opacity: arabicOpacity/100,
                          display: 'inline-block'
                        }}
                      >
                        {word.text_uthmani}
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Full Translation */}
          {showTranslation && (
            <div className="font-translation text-gray-800 dark:text-gray-300 text-sm md:text-base leading-relaxed border-l-4 border-emerald-500 pl-4 ml-1">
              {translationText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Helper to map font size index to actual rem values
const getFontSize = (size: number) => {
  const sizeMap = {
    1: 1.8,
    2: 2.0,
    3: 2.2,
    4: 2.4,
    5: 2.6
  };
  return sizeMap[size] || 2.2;
};

// Map font size numbers to Tailwind classes
const fontSizeClasses: { [key: number]: string } = {
  1: 'text-2xl',
  2: 'text-3xl',
  3: 'text-4xl',
  4: 'text-5xl',
  5: 'text-6xl',
};

export default VerseRow;