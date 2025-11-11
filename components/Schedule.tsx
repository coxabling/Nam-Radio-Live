import React, { useState, useEffect } from 'react';
import { ApiScheduleItem, SongOfTheWeek, SongRequestRecord, ListeningStats } from '../types';
import ShareModal from './ShareModal';
import { getSongOfTheWeek, generateShowPromoScript, generateTtsAudio } from '../services/geminiService';

interface ScheduleProps {
  schedule: ApiScheduleItem[];
  loading: boolean;
  error: string | null;
  favoriteShows: number[];
  onToggleFavorite: (showId: number) => void;
  songRequests: SongRequestRecord[];
  listeningStats: ListeningStats;
}

// Audio decoding functions
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const sampleRate = 24000;
    const numChannels = 1;
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
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

const HearPromoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);


const Schedule: React.FC<ScheduleProps> = ({ schedule, loading, error, favoriteShows, onToggleFavorite, songRequests, listeningStats }) => {
  const [showToShare, setShowToShare] = useState<ApiScheduleItem | null>(null);
  const [songOfTheWeek, setSongOfTheWeek] = useState<SongOfTheWeek | null>(null);
  const [isSotwLoading, setIsSotwLoading] = useState(true);
  const [sotwError, setSotwError] = useState<string | null>(null);
  const [showOnlySotw, setShowOnlySotw] = useState(false);
  const [loadingPromo, setLoadingPromo] = useState<number | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const audioSourceRef = React.useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Initialize AudioContext on first user interaction (or component mount)
    if (!audioContext) {
      setAudioContext(new (window.AudioContext || (window as any).webkitAudioContext)());
    }
    return () => {
        audioSourceRef.current?.stop();
        audioSourceRef.current?.disconnect();
    }
  }, [audioContext]);
  
  const handleHearPromo = async (show: ApiScheduleItem) => {
    if (!audioContext) return;
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
    }
    setLoadingPromo(show.id);
    try {
        const cacheKey = `promo-audio-${show.id}`;
        let audioData = sessionStorage.getItem(cacheKey);

        if (!audioData) {
            const script = await generateShowPromoScript(show);
            audioData = await generateTtsAudio(script);
            sessionStorage.setItem(cacheKey, audioData);
        }
        
        const audioBuffer = await decodeAudioData(decode(audioData), audioContext);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        audioSourceRef.current = source;
    } catch (e) {
        console.error("Failed to play promo", e);
    } finally {
        setLoadingPromo(null);
    }
  };

  useEffect(() => {
    const fetchSotw = async () => {
      const SOTW_CACHE_KEY = 'nam-radio-sotw-cache';
      const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

      try {
        const cachedItem = sessionStorage.getItem(SOTW_CACHE_KEY);
        if (cachedItem) {
          const { data, timestamp } = JSON.parse(cachedItem);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setSongOfTheWeek(data);
            setIsSotwLoading(false);
            return;
          }
        }
      } catch (e) { console.error("Failed to read SOTW from cache", e); }

      setIsSotwLoading(true);
      setSotwError(null);
      try {
        const data = await getSongOfTheWeek(songRequests, listeningStats);
        setSongOfTheWeek(data);
        sessionStorage.setItem(SOTW_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (err: any) {
        setSotwError(err.message);
      } finally {
        setIsSotwLoading(false);
      }
    };

    fetchSotw();
  }, [songRequests, listeningStats]);

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
                        onClick={() => handleHearPromo(show)}
                        disabled={loadingPromo === show.id}
                        className="p-2 rounded-full transition-colors text-slate-500 hover:text-amber-400 hover:bg-slate-700/50 disabled:cursor-wait disabled:text-amber-400 disabled:animate-pulse"
                        aria-label="Hear promo"
                      >
                        <HearPromoIcon />
                      </button>
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
       <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold tracking-wide text-amber-300">Weekly Schedule</h2>
        {songOfTheWeek && (
          <div className="flex items-center gap-2 flex-shrink-0">
              <label htmlFor="sotw-toggle" className="text-sm font-semibold text-slate-300 cursor-pointer">Show only Song of the Week</label>
              <button
                  id="sotw-toggle"
                  onClick={() => setShowOnlySotw(!showOnlySotw)}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-400 ${showOnlySotw ? 'bg-amber-500' : 'bg-slate-700'}`}
                  aria-pressed={showOnlySotw}
              >
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${showOnlySotw ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
          </div>
        )}
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Song of the Week</h3>
        {isSotwLoading && (
          <div className="flex items-center justify-center h-24 bg-slate-800/50 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
          </div>
        )}
        {sotwError && (
          <div className="p-4 bg-red-500/10 text-red-300 rounded-lg">
            <p className="font-semibold">Error fetching Song of the Week</p>
            <p className="text-sm">{sotwError}</p>
          </div>
        )}
        {songOfTheWeek && (
          <div className="bg-amber-500/10 p-4 rounded-lg border-l-4 border-amber-400 animate-fade-in">
            <p className="text-lg font-bold text-white">{songOfTheWeek.title}</p>
            <p className="text-md text-slate-300 mb-2">{songOfTheWeek.artist}</p>
            <div className="prose prose-sm prose-invert text-slate-400">
              <p className="italic">"{songOfTheWeek.description}"</p>
            </div>
          </div>
        )}
      </div>

      {!showOnlySotw && renderContent()}
      
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