
import React, { useState, useEffect } from 'react';
import { AzuraPerformanceReportItem } from '../types';
import { getPerformanceReport } from '../services/azuracastService';
import { generateStationChartCommentary } from '../services/geminiService';

const CrownIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>);

const StationChart: React.FC = () => {
    const [topSongs, setTopSongs] = useState<AzuraPerformanceReportItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commentary, setCommentary] = useState<string | null>(null);
    const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);

    useEffect(() => {
        const fetchChart = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const songs = await getPerformanceReport();
                setTopSongs(songs);
            } catch (err) {
                setError("Could not load the official station chart. The server might be busy.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchChart();
    }, []);

    const handleGetCommentary = async () => {
        if (topSongs.length === 0) return;
        setIsCommentaryLoading(true);
        setCommentary(null);
        try {
            const chartForAI = topSongs.map(s => ({ 
                song: `${s.song.title} by ${s.song.artist}`, 
                plays: s.play_count 
            }));
            const result = await generateStationChartCommentary(chartForAI);
            setCommentary(result);
        } catch (error) {
            setCommentary("DJ Alex seems to be on a break... try again in a bit!");
        } finally {
            setIsCommentaryLoading(false);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
                    <p className="text-red-400">{error}</p>
                </div>
            );
        }

        if (topSongs.length === 0) {
            return (
                <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
                    <p className="text-slate-400">The chart is currently being compiled.</p>
                    <p className="text-sm text-slate-500 mt-1">Check back soon for the hottest tracks!</p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {topSongs.map((song, index) => (
                    <div key={song.song.title + index} className="p-3 bg-slate-800/50 rounded-lg flex items-center gap-4">
                        <span className={`text-2xl font-bold w-8 text-center flex-shrink-0 ${index === 0 ? 'text-amber-300' : 'text-slate-500'}`}>{index + 1}</span>
                        <div className="flex-grow overflow-hidden">
                            <p className="font-semibold text-white truncate flex items-center gap-2">{song.song.title} {index === 0 && <CrownIcon />}</p>
                            <p className="text-sm text-slate-400 truncate">{song.song.artist}</p>
                        </div>
                        <span className="text-sm font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded-md">{song.play_count} plays</span>
                    </div>
                ))}
                <div className="pt-4 text-center">
                    <button onClick={handleGetCommentary} disabled={isCommentaryLoading} className="px-4 py-2 bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50">
                        {isCommentaryLoading ? 'Thinking...' : 'Ask DJ Alex for Commentary'}
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
        );
    };

    return (
        <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
            <h2 className="text-2xl font-bold mb-4 tracking-wide text-amber-300">Official Station Chart</h2>
            <p className="text-slate-400 mb-6">The most-played tracks on Nam Radio Live this week!</p>
            {renderContent()}
        </section>
    );
}

export default StationChart;
