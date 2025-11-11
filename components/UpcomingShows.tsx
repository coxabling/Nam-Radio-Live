import React, { memo, useState, useEffect, useRef } from 'react';
import { ApiScheduleItem } from '../types';
import ShareModal from './ShareModal';
import { generateShowPromoScript, generateTtsAudio } from '../services/geminiService';

interface UpcomingShowsProps {
  shows: ApiScheduleItem[];
  loading: boolean;
  error: string | null;
  favoriteShows: number[];
  onToggleFavorite: (showId: number) => void;
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

const UpcomingShows: React.FC<UpcomingShowsProps> = ({ shows, loading, error, favoriteShows, onToggleFavorite }) => {
  const [showToShare, setShowToShare] = useState<ApiScheduleItem | null>(null);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
        </div>
      );
    }
    
    if (error) {
       return <p className="text-center text-red-400 py-8">{error}</p>;
    }

    if (shows.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-400">No more shows scheduled for today. Check back tomorrow!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {shows.map((show, index) => {
          const isFavorite = favoriteShows.includes(show.id);
          return (
            <div key={show.id} className={`flex items-center transition-colors ${isFavorite ? 'bg-amber-500/10 rounded-lg -mx-6 px-6 py-2' : 'py-2'} ${index < shows.length - 1 ? 'border-b border-slate-700/50' : ''}`}>
              <div className="flex-shrink-0 pr-4">
                <p className="text-sm font-semibold text-amber-400">{formatTime(show.start)}</p>
              </div>
              <div className="flex-grow text-right">
                <h3 className="font-bold text-lg text-white">{show.name}</h3>
                {show.description && <p className="text-sm text-slate-400">{show.description}</p>}
              </div>
               <div className="pl-4 flex items-center gap-1">
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
            </div>
          )
        })}
      </div>
    );
  };

  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-6 tracking-wide text-amber-300">Upcoming Shows Today</h2>
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