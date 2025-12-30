export interface TranslatedName {
  language_name: string;
  name: string;
}

export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: TranslatedName;
}

export interface WordTranslation {
  text: string;
  language_name: string;
}

export interface WordTransliteration {
  text: string;
  language_name: string;
}

export interface Word {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  text_uthmani: string; // The Arabic text
  translation: { text: string }; // Word translation
  transliteration: { text: string }; // Word transliteration
}

export interface VerseTranslation {
  id: number;
  resource_id: number;
  text: string;
}

export interface Verse {
  id: number;
  verse_key: string;
  words: Word[];
  translations?: VerseTranslation[]; // Whole verse translation
  audio: {
    url: string;
  };
}

export interface Pagination {
  per_page: number;
  current_page: number;
  next_page: number | null;
  total_pages: number;
  total_records: number;
}

export interface VersesResponse {
  verses: Verse[];
  pagination: Pagination;
}

export interface ChaptersResponse {
  chapters: Chapter[];
}
