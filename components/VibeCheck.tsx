import React from 'react';
import { motion } from 'motion/react';
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
        <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-800/40">
            <h3 className="text-sm font-semibold mb-3 text-slate-400 uppercase tracking-widest font-mono">Listener Vibe Check</h3>
            
            <div className="flex items-end justify-center gap-4 h-24 bg-slate-950/40 p-4 rounded-xl mb-4 border border-slate-900 shadow-inner">
                {vibes.map(vibe => {
                    const isDominant = vibe.type === dominantVibe.type;
                    const heightValue = totalVotes > 0 ? (vibe.count / totalVotes) * 100 : 10;
                    const heightStr = `${Math.max(10, heightValue)}%`;
                    
                    return (
                        <div key={vibe.type} className="flex flex-col items-center justify-end h-full flex-1 group relative">
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: heightStr }}
                                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                                className={`w-full bg-amber-500/30 rounded-t-lg transition-all duration-300 ${
                                    isDominant ? 'bg-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : ''
                                }`}
                            ></motion.div>
                            <motion.span 
                                whileHover={{ scale: 1.3, y: -2 }}
                                className={`text-2xl mt-1.5 cursor-pointer block select-none transition-all duration-300 ${isDominant ? 'drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' : 'opacity-80'}`}
                            >
                              {vibe.emoji}
                            </motion.span>
                        </div>
                    );
                })}
            </div>

            {selectedVibe ? (
                <motion.p 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center text-amber-400 font-medium text-sm bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20"
                >
                  🎉 Vibe logged! Thank you for tuning in and sharing the groove.
                </motion.p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {vibes.map(vibe => (
                        <motion.button 
                            key={vibe.type}
                            onClick={() => onVote(vibe.type)}
                            whileHover={{ y: -1, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                        >
                            <span className="text-lg">{vibe.emoji}</span>
                            <span>{vibe.label}</span>
                        </motion.button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VibeCheck;