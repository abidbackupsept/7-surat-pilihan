import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChapterVerses, getNextPageVerses, getChapterDetails } from '../services/quranService';
import { VersesResponse, Verse, Chapter } from '../types';
import VerseRow from '../components/VerseRow';
import { ArrowLeft, Loader2, PlayCircle, PauseCircle, SkipBack, SkipForward, StopCircle, FileText, Volume2 } from 'lucide-react';
import { FaFilePdf } from 'react-icons/fa';
import { useSettings, QARI_OPTIONS } from '../contexts/SettingsContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SurahDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { qariId, setQariId } = useSettings();
  const [data, setData] = useState<VersesResponse | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio State
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [activeVerseIndex, setActiveVerseIndex] = useState<number>(-1);
  const [isContinuous, setIsContinuous] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const verseRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const numericId = parseInt(id);
        const [versesResponse, chapterResponse] = await Promise.all([
          getChapterVerses(numericId, qariId),
          getChapterDetails(numericId)
        ]);
        
        setData(versesResponse);
        setVerses(versesResponse.verses);
        setChapter(chapterResponse);
      } catch (err) {
        setError('Gagal memuat ayat. Silakan periksa koneksi internet Anda.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, qariId]);

  // Handle Audio Logic & Sequencing
  useEffect(() => {
    // Initialize Audio Obj
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const handleEnded = () => {
      if (isContinuous) {
        // Play next if available
        if (activeVerseIndex < verses.length - 1) {
          setActiveVerseIndex(prev => prev + 1);
        } else {
          // End of list
          setIsContinuous(false);
          setPlayingUrl(null);
          setActiveVerseIndex(-1);
        }
      } else {
        // Single verse play ended
        setPlayingUrl(null);
        setActiveVerseIndex(-1);
      }
    };

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isContinuous, activeVerseIndex, verses.length]);

  // Effect: Trigger Playback when ActiveVerseIndex changes
  useEffect(() => {
    if (activeVerseIndex >= 0 && activeVerseIndex < verses.length) {
      const verse = verses[activeVerseIndex];
      let url = verse.audio.url;
      if (url && !url.startsWith('http')) {
        url = `https://verses.quran.com/${url}`;
      }
      setPlayingUrl(url);
      
      // Scroll to view
      if (verseRefs.current[activeVerseIndex]) {
        verseRefs.current[activeVerseIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeVerseIndex, verses]);

  // Effect: Actual Audio Play/Pause Control
  useEffect(() => {
    if (audioRef.current) {
      if (playingUrl) {
        audioRef.current.src = playingUrl;
        audioRef.current.play().catch(e => {
          console.error("Audio playback failed", e);
          setPlayingUrl(null);
          setIsContinuous(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [playingUrl]);

  const handleSinglePlay = (url: string | null, index: number) => {
    if (!url) return;
    setIsContinuous(false); // Stop continuous mode if clicking individual
    setActiveVerseIndex(index); // This triggers the play effect
  };

  const handlePause = () => {
    setPlayingUrl(null);
    // If we pause, we technically keep the highlight? 
    // For this UX, let's keep highlight if paused during continuous, 
    // but if manually paused, we might just stop audio.
    // Let's just pause audio but keep index state for resumption if needed, 
    // but for simplicity, pause = stop in this architecture unless we add 'isPaused' state.
    // To simple toggle:
    if (audioRef.current) audioRef.current.pause();
  };

  const handleContinuousPlay = () => {
    setIsContinuous(true);
    if (activeVerseIndex === -1) {
      setActiveVerseIndex(0);
    } else {
      // If already highlighted/paused, resume by ensuring playingUrl is set via index effect
      // or if currently playing, do nothing
      if (!playingUrl && activeVerseIndex >= 0) {
        // Trigger re-play of current
         const verse = verses[activeVerseIndex];
         let url = verse.audio.url;
         if (url && !url.startsWith('http')) {
           url = `https://verses.quran.com/${url}`;
         }
         setPlayingUrl(url);
      }
    }
  };

  const handleStop = () => {
    setIsContinuous(false);
    setPlayingUrl(null);
    setActiveVerseIndex(-1);
  };

  const handleNext = () => {
    if (activeVerseIndex < verses.length - 1) {
      setActiveVerseIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeVerseIndex > 0) {
      setActiveVerseIndex(prev => prev - 1);
    }
  };

  const handleExportPDF = async () => {
    try {
      const element = document.getElementById('verses-container');
      if (!element) return;

      // Show loading state
      const originalButton = document.getElementById('export-pdf-btn') as HTMLButtonElement;
      if (originalButton) {
        originalButton.innerHTML = '<div class="animate-spin">⏳</div>';
        originalButton.disabled = true;
      }

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margin
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2);

      // Add title on first page
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${chapter?.name_simple || `Surah ${id}`}`, pdfWidth / 2, 15, { align: 'center' });
      
      // Add Bismillah using proper Arabic font support
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Bismillah', pdfWidth / 2, 25, { align: 'center' });

      let currentY = 35; // Start position after title and bismillah

      // Get all verse elements
      const verseElements = element.querySelectorAll('[data-verse-id]');
      
      for (let i = 0; i < verseElements.length; i++) {
        const verseElement = verseElements[i];
        
        // Clone the element to modify it for PDF export
        const clonedElement = verseElement.cloneNode(true) as HTMLElement;
        
        // Remove action buttons (share and play) from cloned element
        const actionButtons = clonedElement.querySelectorAll('button');
        actionButtons.forEach(button => button.remove());
        
        // Remove hover and active classes
        clonedElement.className = clonedElement.className.replace(/hover:|active:|transition-all/g, '');
        
        // Set white background for PDF
        clonedElement.style.backgroundColor = '#ffffff';
        clonedElement.style.color = '#000000';
        
        // Create a temporary container for the modified element
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = verseElement.clientWidth + 'px';
        tempContainer.appendChild(clonedElement);
        document.body.appendChild(tempContainer);
        
        // Create canvas for each verse
        const canvas = await html2canvas(clonedElement, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: verseElement.clientWidth,
          height: clonedElement.clientHeight,
        });

        const imgData = canvas.toDataURL('image/png');
        
        // Calculate dimensions to fit the page width
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        
        // Check if we need a new page
        if (currentY + imgHeight > contentHeight) {
          pdf.addPage();
          currentY = margin;
        }
        
        // Add the verse to PDF
        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 5; // Add 5mm spacing between verses
        
        // Remove temporary container
        document.body.removeChild(tempContainer);
      }
      
      // Save the PDF
      pdf.save(`${chapter?.name_simple || `Surah ${id}`}.pdf`);

      // Restore button
      if (originalButton) {
        originalButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 384 512" fill="currentColor"><path d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z"></path></svg>';
        originalButton.disabled = false;
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Gagal mengekspor PDF. Silakan coba lagi.');
      
      // Restore button on error
      const originalButton = document.getElementById('export-pdf-btn') as HTMLButtonElement;
      if (originalButton) {
        originalButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 384 512" fill="currentColor"><path d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z"></path></svg>';
        originalButton.disabled = false;
      }
    }
  };

  const handleLoadMore = async () => {
    if (!data?.pagination.next_page || !id) return;
    setLoadingMore(true);
    try {
      const nextData = await getNextPageVerses(parseInt(id), data.pagination.next_page, qariId);
      setVerses(prev => [...prev, ...nextData.verses]);
      setData(prev => prev ? { ...prev, pagination: nextData.pagination } : nextData);
    } catch (err) {
      console.error("Failed to load more", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Refetch data when qari changes
  useEffect(() => {
    if (!id || !chapter) return; // Only refetch if we already have data
    
    const refetchData = async () => {
      setLoading(true);
      try {
        const numericId = parseInt(id);
        const versesResponse = await getChapterVerses(numericId, qariId);
        
        setData(versesResponse);
        setVerses(versesResponse.verses);
        // Reset audio state when qari changes
        setPlayingUrl(null);
        setActiveVerseIndex(-1);
        setIsContinuous(false);
      } catch (err) {
        setError('Gagal memuat ayat dengan qari baru. Silakan periksa koneksi internet Anda.');
      } finally {
        setLoading(false);
      }
    };
    
    refetchData();
  }, [qariId, id, chapter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 transition-colors">
        <Loader2 className="animate-spin text-emerald-600 dark:text-emerald-500" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-white dark:bg-slate-950 transition-colors">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">{error}</div>
        <Link to="/" className="text-emerald-600 dark:text-emerald-400 hover:underline">Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen pb-40 transition-colors duration-300">
      {/* Sticky Surah Header */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-gray-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-600 dark:text-gray-300">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {chapter ? chapter.name_simple : `Surah ${id}`}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {chapter ? (
              <>
                {chapter.translated_name.name} &bull; {chapter.verses_count} Ayat
              </>
            ) : (
              `${verses.length} Ayat Ditampilkan`
            )}
          </p>
        </div>
      </div>

      {/* Bismillah */}
      <div className="py-10 flex justify-center bg-gradient-to-b from-emerald-50 to-white dark:from-slate-900 dark:to-slate-950 transition-colors">
        <div className="font-arabic text-4xl md:text-5xl text-emerald-800 dark:text-emerald-500 text-center">
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
        </div>
      </div>

      {/* Verses List */}
      <div id="verses-container" className="max-w-4xl mx-auto shadow-xl shadow-gray-100/50 dark:shadow-none rounded-none md:rounded-2xl overflow-hidden border border-gray-50 dark:border-slate-800">
        {verses.map((verse, index) => (
          <VerseRow
            key={verse.id}
            ref={(el) => { verseRefs.current[index] = el; }}
            verse={verse}
            surahName={chapter ? chapter.name_simple : `Surah ${id}`}
            isPlaying={activeVerseIndex === index && !!playingUrl}
            isActive={activeVerseIndex === index}
            onPlay={(url) => handleSinglePlay(url, index)}
            onPause={handlePause}
          />
        ))}
      </div>

      {/* Load More Button */}
      {data?.pagination.next_page && (
        <div className="flex justify-center py-8">
          <button 
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 font-medium hover:bg-emerald-700 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {loadingMore && <Loader2 size={16} className="animate-spin" />}
            {loadingMore ? 'Memuat...' : 'Muat Ayat Berikutnya'}
          </button>
        </div>
      )}

      {/* Floating Audio Player */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[80%] max-w-sm">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-2 md:p-3 flex items-center justify-between">
          
          {/* Info Area */}
          <div className="flex-1 mr-2">
            {activeVerseIndex >= 0 ? (
              <h3 className="text-xs font-bold text-gray-800 dark:text-white">
                Ayat {verses[activeVerseIndex]?.verse_key}
              </h3>
            ) : (
              <div className="flex items-center gap-2">
                <Volume2 size={14} className="text-gray-600 dark:text-gray-400" />
                <select
                  value={qariId}
                  onChange={(e) => setQariId(Number(e.target.value))}
                  className="text-xs font-bold text-gray-800 dark:text-white bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                >
                  {QARI_OPTIONS.map((qari) => (
                    <option key={qari.id} value={qari.id}>
                      {qari.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
             <button
              onClick={handleStop}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              disabled={activeVerseIndex === -1}
            >
              <StopCircle size={18} />
            </button>
            
            <button
              onClick={handlePrev}
              className="p-1 text-gray-600 dark:text-gray-300 hover:text-emerald-600 disabled:opacity-30"
              disabled={activeVerseIndex <= 0}
            >
              <SkipBack size={16} />
            </button>

            <button
              onClick={playingUrl && isContinuous ? handlePause : handleContinuousPlay}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
            >
              {playingUrl && isContinuous ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
            </button>

             <button
              onClick={handleNext}
              className="p-1 text-gray-600 dark:text-gray-300 hover:text-emerald-600 disabled:opacity-30"
              disabled={activeVerseIndex >= verses.length - 1}
            >
              <SkipForward size={16} />
            </button>

            <button
              id="export-pdf-btn"
              onClick={handleExportPDF}
              className="p-1 text-red-600 dark:text-gray-300 hover:text-emerald-600 transition-colors"
              title="Export PDF"
            >
              <FaFilePdf size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurahDetail;