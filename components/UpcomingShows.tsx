import React, { memo, useState } from 'react';
import { motion } from 'motion/react';
import { Star, Share2, Calendar } from 'lucide-react';
import { ApiScheduleItem } from '../types';
import ShareModal from './ShareModal';

interface UpcomingShowsProps {
  shows: ApiScheduleItem[];
  loading: boolean;
  error: string | null;
  favoriteShows: number[];
  onToggleFavorite: (showId: number) => void;
}

const UpcomingShows: React.FC<UpcomingShowsProps> = ({ shows, loading, error, favoriteShows, onToggleFavorite }) => {
  const [showToShare, setShowToShare] = useState<ApiScheduleItem | null>(null);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderContent = () => {
    if (loading) {
       return (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
        </div>
      );
    }
    
    if (error) {
       return <p className="text-center text-red-400 py-8 font-medium">{error}</p>;
    }

    if (shows.length === 0) {
      return (
        <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-slate-800/50">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No more shows scheduled for today.</p>
          <p className="text-slate-500 text-sm mt-1">Check back tomorrow for the new line-up!</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {shows.map((show, index) => {
          const isFavorite = favoriteShows.includes(show.id);
          return (
            <motion.div 
              key={show.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${
                isFavorite 
                  ? 'bg-amber-500/10 border border-amber-500/20 shadow-md' 
                  : 'bg-slate-900/40 hover:bg-slate-800/30 border border-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-center flex-shrink-0 min-w-[80px]">
                  <p className="text-xs font-mono uppercase text-slate-500 font-semibold tracking-wider">Today</p>
                  <p className="text-sm font-bold text-amber-400 tracking-tight">{formatTime(show.start)}</p>
                </div>
                <div className="overflow-hidden pr-2">
                  <h3 className="font-bold text-white tracking-tight text-md truncate">{show.name}</h3>
                  {show.description && (
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{show.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 pl-3 flex-shrink-0 border-l border-slate-800/40">
                <button 
                  onClick={() => setShowToShare(show)} 
                  className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/50 transition-all duration-200"
                  aria-label="Share show"
                  title="Share Show"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onToggleFavorite(show.id)} 
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isFavorite 
                      ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' 
                      : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/50'
                  }`}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  <Star className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    );
  };

  return (
    <section className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-800/80">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight font-display text-white">Upcoming Shows Today</h2>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800/80">
          Live Grid
        </span>
      </div>
      {renderContent()}
      {showToShare && (
        <ShareModal 
          show={showToShare}
          onClose={() => setShowToShare(null)}
        />
      )}
    </section>
  );
};

export default memo(UpcomingShows);