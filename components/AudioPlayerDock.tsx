import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, Radio, Sparkles, Moon, Mic, ExternalLink, ThumbsUp, ThumbsDown, ChevronUp, ChevronDown, Music2, Share2, Headphones, Activity } from 'lucide-react';
import { Song, ApiScheduleItem, SongRating } from '../types';
import { generateDjRadioAnnouncement } from '../services/geminiService';

interface AudioPlayerDockProps {
  currentSong: Song;
  currentShowName: string | null;
  likedSongs: SongRating[];
  dislikedSongs: SongRating[];
  onSongRating: (song: Song, rating: 'like' | 'dislike') => void;
  isLoggedIn: boolean;
  onRequestClick?: () => void;
}

const STREAM_URL = 'https://music-station.live/listen/namradio/radio.mp3';

const AudioPlayerDock: React.FC<AudioPlayerDockProps> = ({
  currentSong,
  currentShowName,
  likedSongs,
  dislikedSongs,
  onSongRating,
  isLoggedIn,
  onRequestClick,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'320k' | '128k' | '64k'>('128k');
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [announcementText, setAnnouncementText] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sleepTimerRef = useRef<number | null>(null);

  const currentSongId = `${currentSong.title} - ${currentSong.artist}`;
  const isLiked = likedSongs.some(s => s.id === currentSongId);
  const isDisliked = dislikedSongs.some(s => s.id === currentSongId);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'none';
    audio.src = STREAM_URL;

    audio.onwaiting = () => setIsBuffering(true);
    audio.onplaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    audio.onpause = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsBuffering(false);
      setIsPlaying(false);
    };

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle Play/Pause
  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsBuffering(true);
      try {
        // Append cache-buster on live audio play to avoid stale cache
        audioRef.current.src = `${STREAM_URL}?_=${Date.now()}`;
        await audioRef.current.play();
        setIsPlaying(true);
        setIsBuffering(false);
      } catch (err) {
        console.warn('Playback error:', err);
        setIsBuffering(false);
      }
    }
  }, [isPlaying]);

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimerRemaining === null) return;

    if (sleepTimerRemaining <= 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setSleepTimerRemaining(null);
      return;
    }

    sleepTimerRef.current = window.setTimeout(() => {
      setSleepTimerRemaining(prev => (prev ? prev - 1 : null));
    }, 1000);

    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [sleepTimerRemaining]);

  const setSleepTimer = (minutes: number) => {
    if (minutes === 0) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(minutes * 60);
    }
    setShowSleepMenu(false);
  };

  const formatSleepTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // AI DJ Voice Announcement
  const handleDjVoiceAnnouncement = async () => {
    if (isAnnouncing) return;
    setIsAnnouncing(true);
    try {
      const script = await generateDjRadioAnnouncement(currentSong, currentShowName);
      setAnnouncementText(script);

      // Web Speech API Voice synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(script);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        
        // Try selecting an English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Alex')));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onend = () => {
          setIsAnnouncing(false);
          setTimeout(() => setAnnouncementText(null), 5000);
        };
        utterance.onerror = () => {
          setIsAnnouncing(false);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setIsAnnouncing(false);
      }
    } catch (err) {
      console.error(err);
      setIsAnnouncing(false);
    }
  };

  const handleShare = () => {
    const shareText = `Listening to "${currentSong.title}" by ${currentSong.artist} live on Nam Radio Live! 📻🎶`;
    if (navigator.share) {
      navigator.share({
        title: 'Nam Radio Live',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <>
      {/* Floating Persisting Audio Player Dock */}
      <div 
        id="audio-player-dock"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl"
      >
        <div className="relative bg-slate-950/90 backdrop-blur-2xl rounded-2xl border border-slate-800/90 shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-3 md:p-4 text-slate-100 transition-all duration-300">
          {/* Subtle amber gradient border highlight */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 pointer-events-none" />

          {/* Collapsed / Main Bar */}
          <div className="flex items-center justify-between gap-3 md:gap-6 relative z-10">
            {/* Left: Track Information */}
            <div className="flex items-center gap-3 min-w-0 max-w-[45%] sm:max-w-[40%]">
              <div className="relative flex-shrink-0">
                {currentSong.artUrl ? (
                  <img
                    src={currentSong.artUrl}
                    alt={currentSong.title}
                    className="w-11 h-11 md:w-12 md:h-12 rounded-xl object-cover border border-slate-800 shadow-md"
                  />
                ) : (
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                    <Music2 className="w-5 h-5" />
                  </div>
                )}
                {isPlaying && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-grow">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold font-mono uppercase tracking-wider bg-amber-500/15 text-amber-400 rounded border border-amber-500/20">
                    LIVE
                  </span>
                  {currentShowName && (
                    <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                      • {currentShowName}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-white truncate tracking-tight">
                  {currentSong.title || 'Nam Radio Live'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {currentSong.artist || 'Windhoek, Namibia'}
                </p>
              </div>
            </div>

            {/* Center: Play / Pause & Dynamic Visualizer Bars */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              {/* Equalizer Visualizer */}
              <div className="hidden sm:flex items-end gap-1 h-6 px-2 py-1 bg-slate-900/60 rounded-lg border border-slate-800/60">
                {[40, 75, 100, 55, 90, 60, 85].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full bg-amber-400 transition-all duration-200 ${
                      isPlaying ? 'animate-pulse' : 'h-1.5 opacity-30'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.max(20, (h * (i % 2 === 0 ? 0.9 : 1.2)) % 100)}%` : '4px',
                      animationDelay: `${i * 0.15}s`
                    }}
                  />
                ))}
              </div>

              {/* Play / Pause main button */}
              <button
                id="btn-dock-play-pause"
                onClick={togglePlay}
                disabled={isBuffering}
                aria-label={isPlaying ? 'Pause broadcast stream' : 'Play broadcast stream'}
                className="relative p-3 md:p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-75 cursor-pointer"
              >
                {isBuffering ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-slate-950" />
                ) : (
                  <Play className="w-5 h-5 fill-slate-950 translate-x-0.5" />
                )}
              </button>

              {/* Quick Rate */}
              {isLoggedIn && (
                <div className="hidden md:flex items-center gap-1">
                  <button
                    onClick={() => onSongRating(currentSong, 'like')}
                    className={`p-2 rounded-lg transition-all ${
                      isLiked
                        ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                        : 'text-slate-400 hover:text-green-400 hover:bg-slate-900'
                    }`}
                    title="Like song (+15 pts)"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSongRating(currentSong, 'dislike')}
                    className={`p-2 rounded-lg transition-all ${
                      isDisliked
                        ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                        : 'text-slate-400 hover:text-red-400 hover:bg-slate-900'
                    }`}
                    title="Dislike song"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Volume, Sleep Timer, DJ Voice & Expand Toggle */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {/* DJ Alex Voice Announcement Button */}
              <button
                id="btn-dj-voice-ident"
                onClick={handleDjVoiceAnnouncement}
                disabled={isAnnouncing}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-xs font-semibold text-amber-400 rounded-lg transition-all"
                title="DJ Alex Live Voice Ident"
              >
                <Mic className={`w-3.5 h-3.5 ${isAnnouncing ? 'animate-pulse text-amber-300' : ''}`} />
                <span>{isAnnouncing ? 'DJ On Air...' : 'DJ Voice'}</span>
              </button>

              {/* Volume Slider */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={e => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-16 md:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  aria-label="Volume slider"
                />
              </div>

              {/* Sleep Timer button */}
              <div className="relative">
                <button
                  onClick={() => setShowSleepMenu(!showSleepMenu)}
                  className={`p-2 rounded-lg border transition-all ${
                    sleepTimerRemaining !== null
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                  title="Sleep Timer"
                  aria-label="Sleep timer"
                >
                  <Moon className="w-4 h-4" />
                </button>

                {/* Sleep Menu Popup */}
                {showSleepMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-44 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2 shadow-2xl space-y-1 z-50 text-xs font-semibold">
                    <p className="px-2 py-1 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                      Sleep Timer
                    </p>
                    {[15, 30, 45, 60].map(mins => (
                      <button
                        key={mins}
                        onClick={() => setSleepTimer(mins)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-amber-300 text-slate-300 transition-colors flex items-center justify-between"
                      >
                        <span>{mins} minutes</span>
                        {sleepTimerRemaining && Math.ceil(sleepTimerRemaining / 60) === mins && (
                          <span className="text-amber-400 font-mono">Active</span>
                        )}
                      </button>
                    ))}
                    {sleepTimerRemaining !== null && (
                      <button
                        onClick={() => setSleepTimer(0)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors border-t border-slate-800 mt-1"
                      >
                        Turn Off Timer ({formatSleepTime(sleepTimerRemaining)})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-2 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
                title="Share stream"
                aria-label="Share stream link"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Expand/Collapse details toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
                aria-label={isExpanded ? 'Collapse dock details' : 'Expand dock details'}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Voice Announcement Banner if Active */}
          <AnimatePresence>
            {announcementText && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-slate-800/80"
              >
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                  <Mic className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-grow">
                    <span className="font-bold text-amber-400 uppercase tracking-wider font-mono text-[10px] block">
                      🎙️ DJ Alex On-Air Live:
                    </span>
                    <p className="italic">{announcementText}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded Drawer Options */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
              >
                {/* Audio Quality */}
                <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/60">
                  <p className="text-slate-400 font-mono font-semibold uppercase text-[10px] mb-1.5">
                    Stream Quality
                  </p>
                  <div className="flex gap-1.5">
                    {(['320k', '128k', '64k'] as const).map(q => (
                      <button
                        key={q}
                        onClick={() => setStreamQuality(q)}
                        className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                          streamQuality === q
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {q === '320k' ? 'HD (320k)' : q === '128k' ? 'HQ (128k)' : 'Eco (64k)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Listen Link */}
                <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 font-mono font-semibold uppercase text-[10px]">
                      Direct Stream
                    </p>
                    <p className="text-slate-300 text-[11px] truncate mt-0.5">MP3 Live Feed</p>
                  </div>
                  <a
                    href={STREAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors"
                    title="Open Stream in External Player"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Sleep Timer status / info */}
                <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 font-mono font-semibold uppercase text-[10px]">
                      Sleep Timer
                    </p>
                    <p className="text-slate-300 text-[11px] font-mono mt-0.5">
                      {sleepTimerRemaining ? `${formatSleepTime(sleepTimerRemaining)} left` : 'Disabled'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSleepMenu(!showSleepMenu)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-semibold transition-colors"
                  >
                    {sleepTimerRemaining ? 'Adjust' : 'Set Timer'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {copiedShare && (
            <div className="absolute top-2 right-4 px-3 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-lg animate-fade-in">
              Stream link copied!
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AudioPlayerDock;
