import React, { useState, useEffect, useRef } from 'react';
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

// Audio decoding helpers
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
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length; // Mono channel for TTS
  const buffer = ctx.createBuffer(1, frameCount, 24000); // TTS sample rate is 24000
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

const SoundIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
    </svg>
);


const Schedule: React.FC<ScheduleProps> = ({ schedule, loading, error, favoriteShows, onToggleFavorite, songRequests, listeningStats }) => {
  const [showToShare, setShowToShare] = useState<ApiScheduleItem | null>(null);
  const [songOfTheWeek, setSongOfTheWeek] = useState<SongOfTheWeek | null>(null);
  const [isSotwLoading, setIsSotwLoading] = useState(true);
  const [sotwError, setSotwError] = useState<string | null>(null);
  const [showOnlySotw, setShowOnlySotw] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [promoCache, setPromoCache] = useState<Record<number, string>>({});
  const [loadingPromoId, setLoadingPromoId] = useState<number | null>(null);
  const [playingPromoId, setPlayingPromoId] = useState<number | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  }, []);

  const handlePlayPromo = async (show: ApiScheduleItem) => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;

    if (promoCache[show.id]) {
      const decodedBytes = decode(promoCache[show.id]);
      const audioBuffer = await decodeAudioData(decodedBytes, audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
      setPlayingPromoId(show.id);
      source.onended = () => setPlayingPromoId(null);
      return;
    }

    setLoadingPromoId(show.id);
    try {
        const script = await generateShowPromoScript(show.name, show.description);
        const audioData = await generateTtsAudio(script);
        setPromoCache(prev => ({...prev, [show.id]: audioData}));
        const decodedBytes = decode(audioData);
        const audioBuffer = await decodeAudioData(decodedBytes, audioCtx);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
        setPlayingPromoId(show.id);
        source.onended = () => setPlayingPromoId(null);
    } catch (err) {
        console.error("Failed to play promo", err);
    } finally {
        setLoadingPromoId(null);
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
                        onClick={() => handlePlayPromo(show)}
                        disabled={loadingPromoId === show.id}
                        className="p-2 rounded-full transition-colors text-slate-500 hover:text-amber-400 hover:bg-slate-700/50 disabled:cursor-wait"
                        aria-label="Hear AI promo"
                      >
                         {loadingPromoId === show.id ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-300"></div> : <SoundIcon />}
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