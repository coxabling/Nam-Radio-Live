
import React, { useMemo, useState } from 'react';
import { Dj, ApiScheduleItem } from '../types';
import { getAiDjIntroduction } from '../services/geminiService';

interface DjsProps {
  djs: Dj[];
  schedule: ApiScheduleItem[];
  currentShowName: string | null;
  favoriteDjs: number[];
  onToggleFavorite: (djId: number) => void;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill={filled ? "currentColor" : "none"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const Djs: React.FC<DjsProps> = ({ djs, schedule, currentShowName, favoriteDjs, onToggleFavorite }) => {
  const [aiIntros, setAiIntros] = useState<Record<number, string | null>>({});
  const [loadingIntro, setLoadingIntro] = useState<number | null>(null);

  const sortedDjs = useMemo(() => {
    return [...djs].sort((a, b) => {
        const isAOnAir = a.show === currentShowName;
        const isBOnAir = b.show === currentShowName;
        if (isAOnAir) return -1;
        if (isBOnAir) return 1;

        const isAFavorite = favoriteDjs.includes(a.id);
        const isBFavorite = favoriteDjs.includes(b.id);
        if (isAFavorite && !isBFavorite) return -1;
        if (!isAFavorite && isBFavorite) return 1;
        
        return a.name.localeCompare(b.name);
    });
  }, [djs, currentShowName, favoriteDjs]);
  
  const getNextShowTime = (showName: string): string | null => {
    const now = new Date();
    const nextShow = schedule
      .filter(s => s.name === showName && new Date(s.start) > now)
      .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];

    if (!nextShow) return null;

    const showDate = new Date(nextShow.start);
    return showDate.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleGetIntro = async (dj: Dj) => {
    setLoadingIntro(dj.id);
    setAiIntros(prev => ({...prev, [dj.id]: null})); // Clear previous intro
    try {
        const intro = await getAiDjIntroduction(dj.name, dj.show, dj.bio);
        setAiIntros(prev => ({...prev, [dj.id]: intro}));
    } catch (error) {
        console.error("Failed to get AI intro", error);
        setAiIntros(prev => ({...prev, [dj.id]: "Sorry, DJ Alex is on a coffee break!"}));
    } finally {
        setLoadingIntro(null);
    }
  };


  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-4 tracking-wide text-amber-300">Meet the DJs</h2>
      <div className="space-y-6">
        {sortedDjs.map((dj) => {
          const isOnAir = dj.show === currentShowName;
          const isFavorite = favoriteDjs.includes(dj.id);
          const nextShowTime = getNextShowTime(dj.show);

          return (
            <div key={dj.id} className={`p-4 rounded-lg transition-all duration-300 ${isOnAir ? 'bg-amber-500/10' : 'bg-slate-800/50'} ${isFavorite || isOnAir ? 'ring-2 ring-amber-400' : ''}`}>
              <div className="relative flex items-center gap-4">
                {isOnAir && (
                  <div className="absolute top-0 right-0 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">On Air</span>
                  </div>
                )}
                <img 
                  src={dj.imageUrl} 
                  alt={dj.name} 
                  className={`w-16 h-16 rounded-full object-cover border-2 flex-shrink-0 ${isFavorite || isOnAir ? 'border-amber-400' : 'border-slate-600'}`}
                />
                <div className="flex-grow">
                  <h3 className="font-bold text-lg text-white">{dj.name}</h3>
                  <p className="text-sm text-amber-400">{dj.show}</p>
                  {nextShowTime && !isOnAir && (
                    <p className="text-xs text-slate-400 mt-1">Next on air: <span className="font-semibold text-slate-300">{nextShowTime}</span></p>
                  )}
                </div>
                 <div className="flex-shrink-0 self-start pl-2">
                  <button
                      onClick={() => onToggleFavorite(dj.id)}
                      className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-700/50'}`}
                      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                      <StarIcon filled={isFavorite} />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                  <p className="text-sm text-slate-300">{dj.bio}</p>
                  <button 
                      onClick={() => handleGetIntro(dj)} 
                      disabled={loadingIntro === dj.id}
                      className="px-3 py-1.5 text-xs bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors font-semibold disabled:opacity-50 disabled:cursor-wait"
                  >
                      {loadingIntro === dj.id ? 'Thinking...' : 'Ask DJ Alex'}
                  </button>

                  {loadingIntro === dj.id && (
                      <div className="flex items-center gap-2 text-sm text-amber-300">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-300"></div>
                          <span>DJ Alex is warming up the mic...</span>
                      </div>
                  )}

                  {aiIntros[dj.id] && (
                      <div className="p-3 bg-amber-500/10 border-l-2 border-amber-400 rounded-r-md animate-fade-in">
                          <p className="text-sm text-slate-300 italic">
                              <span className="font-bold text-amber-300 not-italic">DJ Alex says:</span> "{aiIntros[dj.id]}"
                          </p>
                      </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Djs;