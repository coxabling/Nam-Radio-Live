import React, { useState, useMemo } from 'react';
import { SongRating } from '../types';
import { generateCountdownCommentary } from '../services/geminiService';

interface CommunityCountdownProps {
    likedSongs: SongRating[];
}

const CrownIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>);

const CommunityCountdown: React.FC<CommunityCountdownProps> = ({ likedSongs }) => {
    const [commentary, setCommentary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const topTen = useMemo(() => {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentLikes = likedSongs.filter(song => song.timestamp > oneWeekAgo);

        if (recentLikes.length === 0) {
            return [];
        }

        const counts = new Map<string, number>();
        recentLikes.forEach(song => {
            counts.set(song.id, (counts.get(song.id) || 0) + 1);
        });
        
        return Array.from(counts.entries())
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 10)
            .map(([songId, likes], index) => {
                const [title, artist] = songId.split(' - ');
                return { rank: index + 1, title, artist, likes };
            });
    }, [likedSongs]);

    const handleGetCommentary = async () => {
        if (topTen.length === 0) return;
        setIsLoading(true);
        setCommentary(null);
        try {
            const chartForAI = topTen.map(s => ({ song: `${s.title} by ${s.artist}`, likes: s.likes }));
            const result = await generateCountdownCommentary(chartForAI);
            setCommentary(result);
        } catch (error) {
            setCommentary("DJ Alex seems to be busy... try again in a bit!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
            <h2 className="text-2xl font-bold mb-4 tracking-wide text-amber-300">Community Countdown</h2>
            <p className="text-slate-400 mb-6">Your most-liked songs from the past week!</p>
            {topTen.length > 0 ? (
                <div className="space-y-3">
                    {topTen.map(song => (
                        <div key={song.rank} className="p-3 bg-slate-800/50 rounded-lg flex items-center gap-4">
                            <span className={`text-2xl font-bold w-8 text-center flex-shrink-0 ${song.rank === 1 ? 'text-amber-300' : 'text-slate-500'}`}>{song.rank}</span>
                            <div className="flex-grow overflow-hidden">
                                <p className="font-semibold text-white truncate flex items-center gap-2">{song.title} {song.rank === 1 && <CrownIcon />}</p>
                                <p className="text-sm text-slate-400 truncate">{song.artist || 'Unknown Artist'}</p>
                            </div>
                            <span className="text-sm font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded-md">{song.likes} {song.likes === 1 ? 'like' : 'likes'}</span>
                        </div>
                    ))}
                    <div className="pt-4 text-center">
                        <button onClick={handleGetCommentary} disabled={isLoading} className="px-4 py-2 bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50">
                            {isLoading ? 'Thinking...' : 'Ask DJ Alex for Commentary'}
                        </button>
                    </div>
                     {commentary && (
                        <div className="mt-4 p-4 bg-amber-500/10 border-l-4 border-amber-400 rounded-r-lg">
                            <div className="prose prose-sm prose-invert text-slate-300">
                                <p className="italic"><span className="font-bold text-amber-300 not-italic">DJ Alex says:</span></p>
                                <div dangerouslySetInnerHTML={{ __html: commentary.replace(/\n/g, '<br />') }} />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
                    <p className="text-slate-400">Not enough data to generate a chart yet.</p>
                    <p className="text-sm text-slate-500 mt-1">Like some songs from the player to get started!</p>
                </div>
            )}
        </section>
    );
}

export default CommunityCountdown;