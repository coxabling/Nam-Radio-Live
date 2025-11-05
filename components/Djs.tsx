
import React, { useMemo } from 'react';
import { Dj } from '../types';

interface DjsProps {
  djs: Dj[];
  currentShowName: string | null;
  favoriteDjs: number[];
  onToggleFavorite: (djId: number) => void;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill={filled ? "currentColor" : "none"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const Djs: React.FC<DjsProps> = ({ djs, currentShowName, favoriteDjs, onToggleFavorite }) => {
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

  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-4 tracking-wide text-amber-300">Meet the DJs</h2>
      <div className="space-y-6">
        {sortedDjs.map((dj) => {
          const isOnAir = dj.show === currentShowName;
          const isFavorite = favoriteDjs.includes(dj.id);
          return (
            <div key={dj.id} className={`relative flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-all duration-300 ${isOnAir ? 'bg-amber-500/10' : ''} ${isFavorite || isOnAir ? 'ring-2 ring-amber-400' : ''}`}>
              {isOnAir && (
                <div className="absolute top-2 right-2 flex items-center gap-2">
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
                <p className="text-xs text-slate-400 mt-1">{dj.bio}</p>
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
          );
        })}
      </div>
    </section>
  );
};

export default Djs;
