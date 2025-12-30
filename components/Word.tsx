import React from 'react';
import { Word as WordType } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface WordProps {
  word: WordType;
}

const Word: React.FC<WordProps> = ({ word }) => {
  const { fontSize, showTransliteration, showTranslation, quranFont, arabicOpacity } = useSettings();
  
  const isEnd = word.char_type_name === 'end';

  // Base size calculation (default ~3xl which is approx 30px)
  // Scale: 1=20px, 2=24px, 3=30px, 4=36px, 5=42px
  const getFontSize = () => {
    const base = 18;
    return `${base + (fontSize * 6)}px`;
  };

  return (
    <div className={`flex flex-col items-center ${isEnd ? 'justify-start' : 'justify-end'} mx-2 md:mx-4 my-4 ${isEnd ? 'py-4' : ''} min-w-[70px] ${isEnd ? 'mx-4' : ''}`}>
      {/* Arabic Text - Different alignment for end vs regular words */}
      <div
        className={`text-center leading-loose transition-all duration-300 ${isEnd ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'} ${isEnd ? 'font-uthmani' : `font-${quranFont}`}`}
        dir="rtl"
        style={{
          fontSize: getFontSize(),
          opacity: isEnd ? 1 : arabicOpacity / 100,
          ...(isEnd ? {
            height: '36px', // Fixed height for consistent alignment
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          } : {})
        }}
        data-font-scale={fontSize}
        data-font={quranFont === 'lpmq' ? 'code_v1' : 'indopak_v1'}
      >
        {word.text_uthmani}
      </div>

      {!isEnd && (
        <>
          {/* Transliteration */}
          {showTransliteration && (
            <div className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 mb-1 tracking-wider">
              {word.transliteration?.text}
            </div>
          )}

          {/* Translation */}
          {showTranslation && (
            <div className="font-translation text-[11px] text-gray-500 dark:text-gray-400 text-center leading-tight max-w-[100px]">
              {word.translation?.text}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Word;
