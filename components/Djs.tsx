
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Sparkles, Mic, Radio } from 'lucide-react';
import { Dj, ApiScheduleItem } from '../types';
import { getAiDjIntroduction } from '../services/geminiService';

interface DjsProps {
  djs: Dj[];
  schedule: ApiScheduleItem[];
  currentShowName: string | null;
  favoriteDjs: number[];
  onToggleFavorite: (djId: number) => void;
}

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
    <section className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-800/80">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight font-display text-white">Meet the DJs</h2>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800/80">
          Hosts
        </span>
      </div>

      <div className="space-y-4">
        {sortedDjs.map((dj, index) => {
          const isOnAir = dj.show === currentShowName;
          const isFavorite = favoriteDjs.includes(dj.id);
          const nextShowTime = getNextShowTime(dj.show);

          return (
            <motion.div 
              key={dj.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4.5 rounded-xl border transition-all ${
                isOnAir 
                  ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
                  : 'bg-slate-900/40 hover:bg-slate-800/30 border-slate-800/50'
              }`}
            >
              <div className="relative flex items-center gap-4">
                {isOnAir && (
                  <div className="absolute -top-1 right-0 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">On Air</span>
                  </div>
                )}
                <div className="relative flex-shrink-0">
                  <img 
                    src={dj.imageUrl} 
                    alt={dj.name} 
                    className={`w-14 h-14 rounded-full object-cover border-2 ${
                      isOnAir ? 'border-amber-400 shadow-md shadow-amber-500/20' : 'border-slate-700'
                    }`}
                  />
                </div>
                <div className="flex-grow overflow-hidden pr-6">
                  <h3 className="font-bold text-white tracking-tight text-md">{dj.name}</h3>
                  <p className="text-xs font-semibold text-amber-400 tracking-tight truncate mt-0.5">{dj.show}</p>
                  {nextShowTime && !isOnAir && (
                    <p className="text-[10px] font-mono text-slate-500 mt-1">
                      NEXT: <span className="font-semibold text-slate-400">{nextShowTime}</span>
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 self-start pl-1">
                  <button
                    onClick={() => onToggleFavorite(dj.id)}
                    className={`p-2 rounded-lg transition-all ${
                      isFavorite 
                        ? 'text-amber-400 bg-amber-500/10' 
                        : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800/50'
                    }`}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <Star className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
              <div className="mt-3.5 space-y-3 pl-0.5">
                  <p className="text-xs text-slate-400 leading-relaxed">{dj.bio}</p>
                  
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button 
                      onClick={() => handleGetIntro(dj)} 
                      disabled={loadingIntro === dj.id}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-300 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ask DJ Alex</span>
                    </button>

                    {loadingIntro === dj.id && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 animate-pulse">
                        <Mic className="w-3.5 h-3.5 animate-bounce" />
                        <span>DJ Alex warming up...</span>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {aiIntros[dj.id] && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="p-3 bg-amber-500/5 border-l-2 border-amber-400 rounded-r-lg"
                      >
                        <p className="text-xs text-slate-300 italic leading-relaxed">
                          <span className="font-bold text-amber-400 not-italic uppercase tracking-wider text-[10px] block mb-1">🎙️ DJ Alex Intro</span> "{aiIntros[dj.id]}"
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default Djs;