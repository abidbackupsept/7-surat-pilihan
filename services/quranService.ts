import { ChaptersResponse, VersesResponse, Chapter } from '../types';

const BASE_URL = 'https://api.quran.com/api/v4';

// Specific Surahs requested: Al Kahf (18), Luqman (31), As Sajdah (32), Yasin (36), Ar Rahman (55), Al Waqiah (56), Al Mulk (67)
const TARGET_CHAPTER_IDS = [18, 31, 32, 36, 55, 56, 67];

// Local data fallback
const getLocalChapters = async (): Promise<Chapter[]> => {
  try {
    const response = await fetch('./data/quran-data.json');
    if (!response.ok) throw new Error('Failed to load local chapters');
    
    const data = await response.json();
    return data.chapters;
  } catch (error) {
    console.error('Error loading local chapters:', error);
    return [];
  }
};

export const getTargetChapters = async (): Promise<Chapter[]> => {
  try {
    // Try to fetch from API first
    const response = await fetch(`${BASE_URL}/chapters?language=id`);
    if (response.ok) {
      const data: ChaptersResponse = await response.json();
      return data.chapters.filter(chapter => TARGET_CHAPTER_IDS.includes(chapter.id));
    }
  } catch (error) {
    console.log('API fetch failed, falling back to local data:', error);
  }
  
  // Fallback to local data
  return await getLocalChapters();
};

export const getChapterDetails = async (chapterId: number): Promise<Chapter | null> => {
  try {
    const response = await fetch(`${BASE_URL}/chapters/${chapterId}?language=id`);
    if (response.ok) {
      const data = await response.json();
      return data.chapter;
    }
  } catch (error) {
    console.log('API fetch failed, trying local data for chapter details:', error);
  }
  
  // Fallback to local data
  const chapters = await getLocalChapters();
  return chapters.find(chapter => chapter.id === chapterId) || null;
};

// Local verses data storage
const getLocalVerses = async (chapterId: number): Promise<VersesResponse | null> => {
  try {
    const response = await fetch(`./data/verses-${chapterId}.json`);
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.log('No local verses data found for chapter', chapterId);
    return null;
  }
};

export const getChapterVerses = async (chapterId: number, qariId: number = 7): Promise<VersesResponse> => {
  try {
    // Requesting:
    // - language=id (Indonesian)
    // - words=true (Enable word by word)
    // - word_fields=text_uthmani,transliteration,translation (Specific fields for the word card)
    // - translations=33 (Indonesian Ministry of Religious Affairs translation ID is usually 33 or similar, using standard Indonesian)
    // - word_translation_language=id (To get Indonesian word-by-word translation)
    // - recitation=qariId (Specific qari/recitation ID)
    
    const params = new URLSearchParams({
      language: 'id',
      words: 'true',
      word_fields: 'text_uthmani,translation,transliteration',
      translations: '33', // ID for Indonesian translation
      audio: '1', // Request audio url for verses
      recitation: qariId.toString(), // Use specific qari ID
      per_page: '50',
      word_translation_language: 'id' // Ensure word translation is in Indonesian
    });

    console.log(`Fetching verses for chapter ${chapterId} with qari ID ${qariId}`);
    const response = await fetch(`${BASE_URL}/verses/by_chapter/${chapterId}?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:', data);
      
      // Check if we have audio data and modify URLs if needed
      if (data.verses && data.verses.length > 0) {
        data.verses.forEach((verse: any) => {
          if (verse.audio && verse.audio.url) {
            // For different qari, we might need to modify URL pattern
            // Let's check what URL we get and potentially modify it
            console.log(`Original audio URL for qari ${qariId}:`, verse.audio.url);
            
            // Try to construct URL with qari ID if API doesn't return different URLs
            // Use the original URL pattern but with different qari IDs
            if (!verse.audio.url.includes(`recitation=${qariId}`)) {
              // If API doesn't return different URLs for different qaris,
              // we need to construct the URL manually using the correct pattern
              const [chapter, verseNum] = verse.verse_key.split(':');
              
              // Use the correct audio server pattern based on qari ID (MVP - only 2 qaris)
              const audioServers: { [key: number]: string } = {
                1: 'AbdulBaset/Mujawwad',
                7: 'Alafasy'
              };
              
              const qariName = audioServers[qariId] || audioServers[7]; // Default to Alafasy
              
              // Format: 001001 for chapter 1 verse 1, 056048 for chapter 56 verse 48
              const formattedChapter = chapter.toString().padStart(3, '0');
              const formattedVerse = verseNum.toString().padStart(3, '0');
              const audioFileName = `${formattedChapter}${formattedVerse}`;
              
              verse.audio.url = `https://verses.quran.com/${qariName}/mp3/${audioFileName}.mp3`;
              console.log(`Modified audio URL for qari ${qariId}:`, verse.audio.url);
            }
          }
        });
      }
      
      return data;
    }
  } catch (error) {
    console.log('API fetch failed, trying local verses data:', error);
  }
  
  // Fallback to local data
  const localVerses = await getLocalVerses(chapterId);
  if (localVerses) {
    return localVerses;
  }
  
  // If no local data, throw error
  throw new Error('Failed to fetch verses and no local data available');
};

export const getNextPageVerses = async (chapterId: number, page: number, qariId: number = 7): Promise<VersesResponse> => {
  try {
    const params = new URLSearchParams({
      language: 'id',
      words: 'true',
      word_fields: 'text_uthmani,translation,transliteration',
      translations: '33',
      audio: '1',
      recitation: qariId.toString(), // Use specific qari ID
      per_page: '50',
      page: page.toString(),
      word_translation_language: 'id'
    });

    console.log(`Fetching next page ${page} for chapter ${chapterId} with qari ID ${qariId}`);
    const response = await fetch(`${BASE_URL}/verses/by_chapter/${chapterId}?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      console.log('Next Page API Response:', data);
      
      // Apply same URL modification for next page
      if (data.verses && data.verses.length > 0) {
        data.verses.forEach((verse: any) => {
          if (verse.audio && verse.audio.url) {
            console.log(`Next page original audio URL for qari ${qariId}:`, verse.audio.url);
            
            // Try to construct URL with qari ID if API doesn't return different URLs
            if (!verse.audio.url.includes(`recitation=${qariId}`)) {
              const [chapter, verseNum] = verse.verse_key.split(':');
              
              // Use correct audio server pattern based on qari ID (MVP - only 2 qaris)
              const audioServers: { [key: number]: string } = {
                1: 'AbdulBaset/Mujawwad',
                7: 'Alafasy'
              };
              
              const qariName = audioServers[qariId] || audioServers[7]; // Default to Alafasy
              
              // Format: 001001 for chapter 1 verse 1, 056048 for chapter 56 verse 48
              const formattedChapter = chapter.toString().padStart(3, '0');
              const formattedVerse = verseNum.toString().padStart(3, '0');
              const audioFileName = `${formattedChapter}${formattedVerse}`;
              
              verse.audio.url = `https://verses.quran.com/${qariName}/mp3/${audioFileName}.mp3`;
              console.log(`Next page modified audio URL for qari ${qariId}:`, verse.audio.url);
            }
          }
        });
      }
      
      return data;
    }
  } catch (error) {
    console.log('API fetch failed for next page, trying local data:', error);
  }
  
  // Fallback to local data (if available)
  const localVerses = await getLocalVerses(chapterId);
  if (localVerses && localVerses.pagination && localVerses.pagination.current_page === page) {
    return localVerses;
  }
  
  throw new Error('Failed to fetch next page and no local data available');
}