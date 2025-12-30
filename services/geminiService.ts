import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getVerseInsight = async (surahName: string, verseNumber: string, arabicText: string, translation: string) => {
  if (!process.env.API_KEY) return "API Key missing. Cannot generate insight.";

  try {
    const prompt = `
      Bertindaklah sebagai ahli Tafsir Al-Quran yang bijaksana.
      Berikan penjelasan singkat, mendalam, dan menyejukkan hati (maksimal 100 kata) untuk ayat berikut dalam Bahasa Indonesia:
      
      Surah: ${surahName}
      Ayat: ${verseNumber}
      Teks: ${arabicText}
      Terjemahan: ${translation}
      
      Fokus pada pesan moral dan aplikasi dalam kehidupan sehari-hari.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maaf, tidak dapat memuat tafsir saat ini.";
  }
};
