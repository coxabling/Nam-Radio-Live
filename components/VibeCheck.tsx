import React from 'react';
import { Vibe, VibeType } from '../types';

interface VibeCheckProps {
  vibes: Vibe[];
  selectedVibe: VibeType | null;
  onVote: (vibe: VibeType) => void;
}

const VibeCheck: React.FC<VibeCheckProps> = ({ vibes, selectedVibe, onVote }) => {
    if (!vibes || vibes.length === 0) return null;

    const totalVotes = vibes.reduce((sum, vibe) => sum + vibe.count, 0);
    const dominantVibe = [...vibes].sort((a,b) => b.count - a.count)[0];

    return (
        <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-slate-300">Listener Vibe Check</h3>
            
            <div className="flex items-end justify-center gap-4 h-20 bg-slate-900/50 p-3 rounded-md mb-4">
                {vibes.map(vibe => {
                    const isDominant = vibe.type === dominantVibe.type;
                    const height = totalVotes > 0 ? `${Math.max(10, (vibe.count / totalVotes) * 100)}%` : '10%';
                    return (
                        <div key={vibe.type} className="flex flex-col items-center justify-end h-full flex-1 group">
                            <div 
                                className={`w-full bg-amber-500/50 rounded-t-sm transition-all duration-500 ease-out ${isDominant ? 'bg-amber-400 shadow-[0_0_10px] shadow-amber-400/80' : ''}`}
                                style={{ height }}
                            ></div>
                            <span className={`text-xl transition-all duration-300 ${isDominant ? 'scale-125' : 'scale-100'}`}>{vibe.emoji}</span>
                        </div>
                    );
                })}
            </div>

            {selectedVibe ? (
                <p className="text-center text-amber-300 bg-amber-500/10 p-2 rounded-md">Thanks for sharing your vibe!</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {vibes.map(vibe => (
                        <button 
                            key={vibe.type}
                            onClick={() => onVote(vibe.type)}
                            className="flex items-center justify-center gap-2 p-2 bg-slate-700/50 hover:bg-slate-600/50 text-white font-semibold rounded-lg transition-colors"
                        >
                            <span>{vibe.emoji}</span>
                            <span>{vibe.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VibeCheck;