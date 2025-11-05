import React, { useState } from 'react';
import { ApiScheduleItem } from '../types';
import ShareModal from './ShareModal';

interface ScheduleProps {
  schedule: ApiScheduleItem[];
  loading: boolean;
  error: string | null;
  favoriteShows: number[];
  onToggleFavorite: (showId: number) => void;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill={filled ? "currentColor" : "none"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.542l-1.12 1.12a5 5 0 007.07 7.07l4.243-4.242a5 5 0 00-7.07-7.07l-1.12 1.12M15.316 10.458l1.12-1.12a5 5 0 00-7.07-7.07l-4.243 4.242a5 5 0 007.07 7.07l1.12-1.12" />
    </svg>
);


const Schedule: React.FC<ScheduleProps> = ({ schedule, loading, error, favoriteShows, onToggleFavorite }) => {
  const [showToShare, setShowToShare] = useState<ApiScheduleItem | null>(null);

  const groupShowsByDay = (shows: ApiScheduleItem[]) => {
    return shows.reduce((acc, show) => {
      const showDate = new Date(show.start);
      // Group by a simpler key to avoid timezone issues with toLocaleDateString
      const dayKey = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate()).toISOString();
      
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(show);
      return acc;
    }, {} as Record<string, ApiScheduleItem[]>);
  };
  
  const groupedSchedule = groupShowsByDay(schedule);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  const renderContent = () => {
    if (loading) {
       return (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
        </div>
      );
    }
    
    if (error) {
       return <p className="text-center text-red-400 py-4">{error}</p>;
    }

    if (schedule.length === 0 || Object.keys(groupedSchedule).length === 0) {
      return <p className="text-center text-slate-500 py-4">Schedule is currently unavailable.</p>;
    }

    return (
      <div className="space-y-8">
        {Object.entries(groupedSchedule).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).map(([dayKey, shows]) => (
          <div key={dayKey}>
            <h3 className="text-xl font-bold text-amber-300 mb-4 border-b-2 border-amber-500/30 pb-2">{formatDate(dayKey)}</h3>
            <ul className="space-y-4">
              {shows.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).map((show) => {
                const isFavorite = favoriteShows.includes(show.id);
                return (
                  <li key={show.id} className={`p-4 bg-slate-800/50 rounded-lg flex flex-col sm:flex-row gap-4 items-start transition-all duration-300 ${isFavorite ? 'ring-2 ring-amber-400 bg-slate-800' : ''}`}>
                    <div className="flex-shrink-0 w-full sm:w-32 text-center sm:text-left bg-amber-500/20 p-2 rounded-md">
                      <p className="font-bold text-white text-md">{formatTime(show.start)}</p>
                      <p className="text-sm text-slate-400">to {formatTime(show.end)}</p>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-lg text-white">{show.name}</h4>
                      {show.description && <p className="text-sm text-slate-400 mt-1">{show.description}</p>}
                    </div>
                    <div className="flex-shrink-0 self-center flex items-center gap-2">
                      {show.is_now && (
                        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black bg-amber-300 rounded-full">
                          On Air
                        </span>
                      )}
                      <button
                        onClick={() => setShowToShare(show)}
                        className="p-2 rounded-full transition-colors text-slate-500 hover:text-amber-400 hover:bg-slate-700/50"
                        aria-label="Share show"
                      >
                        <ShareIcon />
                      </button>
                      <button
                        onClick={() => onToggleFavorite(show.id)}
                        className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-700/50'}`}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <StarIcon filled={isFavorite} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-6 tracking-wide text-amber-300">Weekly Schedule</h2>
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

export default Schedule;