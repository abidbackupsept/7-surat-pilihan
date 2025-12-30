import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTargetChapters } from '../services/quranService';
import { Chapter } from '../types';
import { Book } from 'lucide-react';

const Home: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getTargetChapters();
      setChapters(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-emerald-200 dark:bg-emerald-900 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-emerald-100 dark:bg-emerald-900/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-64px)] transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
          {chapters.map(c => (
            <Link 
              key={c.id} 
              to={`/surah/${c.id}`}
              className="whitespace-nowrap px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-sm font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
            >
              {c.name_simple}
            </Link>
          ))}
        </div>

        {/* Surah Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chapters.map((chapter) => (
            <Link 
              key={chapter.id} 
              to={`/surah/${chapter.id}`}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   {/* Number formatted like "1..." */}
                   <span className="text-xl font-bold text-emerald-900 dark:text-white w-10">{chapter.id}</span>
                   
                   <div className="flex flex-col">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                       {chapter.name_simple}
                     </h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                       {chapter.translated_name.name} &bull; {chapter.verses_count}
                     </p>
                   </div>
                </div>

                <div className="flex flex-col items-end">
                   <span className="font-arabic text-3xl text-emerald-800 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {chapter.name_arabic}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Home;