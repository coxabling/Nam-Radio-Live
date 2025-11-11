import React, { useMemo } from 'react';
import { ApiScheduleItem } from '../types';

interface ShowLeaderboardsProps {
  showPoints: Record<string, number>;
  allShows: ApiScheduleItem[];
}

const CrownIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>);
const LeaderboardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>);

const ShowLeaderboards: React.FC<ShowLeaderboardsProps> = ({ showPoints, allShows }) => {

  const rankedShows = useMemo(() => {
    if (!showPoints || Object.keys(showPoints).length === 0) {
      return [];
    }
    
    return Object.entries(showPoints)
      .map(([showName, points]) => {
        const showDetails = allShows.find(s => s.name === showName);
        return {
          name: showName,
          // FIX: Explicitly cast `points` to a number to resolve TypeScript error.
          points: Math.floor(points as number),
          imageUrl: showDetails?.imageUrl,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [showPoints, allShows]);

  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-4 tracking-wide text-white flex items-center gap-3">
        <LeaderboardIcon />
        Weekly Show Support
      </h2>
      <p className="text-slate-400 mb-6 text-sm">Your total points earned during each show this week. This resets every Monday!</p>
      
      {rankedShows.length > 0 ? (
        <div className="space-y-3">
          {rankedShows.map((show, index) => (
            <div key={show.name} className={`p-3 rounded-lg flex items-center gap-4 ${index === 0 ? 'bg-amber-500/10 border-2 border-amber-500/50' : 'bg-slate-800/50'}`}>
              <span className={`text-2xl font-bold w-8 text-center flex-shrink-0 ${index === 0 ? 'text-amber-300' : 'text-slate-500'}`}>{index + 1}</span>
              {show.imageUrl && <img src={show.imageUrl} alt={show.name} className="w-12 h-12 rounded-md object-cover flex-shrink-0" />}
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-white truncate flex items-center gap-2">
                  {show.name}
                  {index === 0 && <CrownIcon />}
                </p>
              </div>
              <span className="text-sm font-bold text-slate-300 bg-slate-700/50 px-3 py-1.5 rounded-md tabular-nums">{show.points} pts</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
          <p className="text-slate-400">No show points recorded yet this week.</p>
          <p className="text-sm text-slate-500 mt-1">Listen to shows and interact to start earning!</p>
        </div>
      )}
    </section>
  );
};

export default ShowLeaderboards;