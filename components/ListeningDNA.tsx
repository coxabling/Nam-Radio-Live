import React, { useEffect, useState, useMemo } from 'react';
import { ListeningStats, SongRequestRecord } from '../types';
import { getTopGenres } from '../services/geminiService';

interface ListeningDNAProps {
    listeningStats: ListeningStats;
    songRequests: SongRequestRecord[];
}

const ShareIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.542l-1.12 1.12a5 5 0 007.07 7.07l4.243-4.242a5 5 0 00-7.07-7.07l-1.12 1.12M15.316 10.458l1.12-1.12a5 5 0 00-7.07-7.07l-4.243 4.242a5 5 0 007.07 7.07l1.12-1.12" /></svg>);
const ChartPieIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>);
const ClockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);


const ListeningDNA: React.FC<ListeningDNAProps> = ({ listeningStats, songRequests }) => {
    const [topGenres, setTopGenres] = useState<string[] | null>(null);
    const [isLoadingGenres, setIsLoadingGenres] = useState(true);

    useEffect(() => {
        const fetchGenres = async () => {
            const artistsFromLikes = listeningStats.likedSongs.map(s => s.id.split(' - ')[1]).filter(Boolean);
            const artistsFromRequests = songRequests.map(r => r.artist);
            const uniqueArtists = [...new Set([...artistsFromLikes, ...artistsFromRequests])];
            
            if (uniqueArtists.length < 3) {
                setTopGenres(['Your Unique Mix']);
                setIsLoadingGenres(false);
                return;
            }

            const cacheKey = `genres-cache-${uniqueArtists.sort().join('-')}`;
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    setTopGenres(JSON.parse(cached));
                    setIsLoadingGenres(false);
                    return;
                }
            } catch(e) { console.error("Cache read failed", e); }

            setIsLoadingGenres(true);
            try {
                const genres = await getTopGenres(uniqueArtists);
                setTopGenres(genres);
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify(genres));
                } catch(e) { console.error("Cache write failed", e); }
            } catch(e) {
                setTopGenres(['Eclectic Tastes']);
            } finally {
                setIsLoadingGenres(false);
            }
        };
        fetchGenres();
    }, [listeningStats.likedSongs, songRequests]);

    const listeningClockData = useMemo(() => {
        const { listeningTimeByHour } = listeningStats;
        if (!listeningTimeByHour || Object.keys(listeningTimeByHour).length === 0) {
            return { segments: [], peakTime: "Anytime" };
        }

        const totalTimes = Object.values(listeningTimeByHour) as number[];
        const maxTime = Math.max(...totalTimes);

        const segments = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            opacity: maxTime > 0 ? Math.max(0.1, (listeningTimeByHour[i] || 0) / maxTime) : 0.1,
        }));
        
        const peakHourEntry = Object.entries(listeningTimeByHour).sort((a,b) => (b[1] as number) - (a[1] as number))[0];
        const peakHour = parseInt(peakHourEntry[0], 10);
        
        let peakTime = "Late Night";
        if (peakHour >= 5 && peakHour < 12) peakTime = "Mornings";
        else if (peakHour >= 12 && peakHour < 17) peakTime = "Afternoons";
        else if (peakHour >= 17 && peakHour < 22) peakTime = "Evenings";

        return { segments, peakTime };
    }, [listeningStats.listeningTimeByHour]);
    
    const genreColors = ['#FBBF24', '#60A5FA', '#F87171'];

    const handleShare = () => {
        // TODO: Implement html2canvas or similar library to generate a shareable image of this component.
        alert("Sharing feature coming soon!");
    };

    return (
        <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-wide text-white">Your Listening DNA</h2>
                <button onClick={handleShare} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors">
                    <ShareIcon /> Share
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Top Genres */}
                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><ChartPieIcon /> Top Genres</h3>
                    {isLoadingGenres ? (
                        <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div></div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <svg viewBox="0 0 36 36" className="w-full h-full">
                                    <circle cx="18" cy="18" r="15.915" className="stroke-current text-slate-700" strokeWidth="3" fill="none" />
                                    {topGenres && topGenres.map((_, index) => {
                                        const segmentSize = 100 / (topGenres.length || 1);
                                        const offset = index * segmentSize;
                                        return (
                                            <circle key={index} cx="18" cy="18" r="15.915"
                                                className="transition-all duration-500"
                                                stroke={genreColors[index % genreColors.length]}
                                                strokeWidth="3.5"
                                                fill="none"
                                                strokeDasharray={`${segmentSize}, 100`}
                                                strokeDashoffset={-offset}
                                                transform="rotate(-90 18 18)"
                                            />
                                        )
                                    })}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-lg">DNA</div>
                            </div>
                            <ul className="space-y-2">
                                {topGenres && topGenres.map((genre, index) => (
                                    <li key={genre} className="flex items-center gap-2 text-sm">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: genreColors[index % genreColors.length] }}></span>
                                        <span className="font-semibold text-slate-300">{genre}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Listening Clock */}
                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><ClockIcon /> Listening Clock</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative w-32 h-32 flex-shrink-0">
                             <svg viewBox="0 0 36 36" className="w-full h-full">
                                <circle cx="18" cy="18" r="15.915" className="stroke-current text-slate-700" strokeWidth="1" fill="none" />
                                {listeningClockData.segments.map(({ hour, opacity }) => (
                                    <line key={hour} x1="18" y1="18" x2="18" y2="6" 
                                        className="stroke-current text-amber-400 transition-opacity duration-300"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        style={{ opacity }}
                                        transform={`rotate(${hour * 15} 18 18)`}
                                    />
                                ))}
                                {/* Hour markers */}
                                {[0, 6, 12, 18].map(hour => (
                                    <text key={hour} x="18" y="4.5" textAnchor="middle" fontSize="3" fill="#64748b" transform={`rotate(${hour * 15} 18 18)`}>
                                        {hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour)}
                                    </text>
                                ))}
                            </svg>
                        </div>
                        <div className="text-center sm:text-left">
                            <p className="text-sm text-slate-400">You're mostly an</p>
                            <p className="text-xl font-bold text-amber-300">{listeningClockData.peakTime}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
export default ListeningDNA;