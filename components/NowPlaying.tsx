import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ThumbsUp, ThumbsDown, Radio, Sparkles, History, Music, ExternalLink, MessageSquare } from 'lucide-react';
import { getSongFunFact } from '../services/geminiService';
import { Song, ApiScheduleItem, Vibe, VibeType, SongRating } from '../types';
import VibeCheck from './VibeCheck';

interface LiveNowPlaying {
    song: Song;
    show: ApiScheduleItem | null;
}

interface NowPlayingProps {
    liveNowPlaying: LiveNowPlaying;
    recentlyPlayed: Song[];
    vibes: Vibe[];
    userVibe: VibeType | null;
    onVibeVote: (vibe: VibeType) => void;
    nowPlayingError: string | null;
    likedSongs: SongRating[];
    dislikedSongs: SongRating[];
    onSongRating: (song: Song, rating: 'like' | 'dislike') => void;
    isLoggedIn: boolean;
}

// SVG icons
const TwitterIcon = () => ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>);
const FacebookIcon = () => ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>);
const WhatsAppIcon = () => ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zM12.04 20.15c-1.55 0-3.05-.4-4.39-1.15l-.31-.18-3.26.86.88-3.18-.2-.33c-.83-1.38-1.26-2.98-1.26-4.64 0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24zm4.52-6.13c-.25-.12-1.47-.72-1.7-.82s-.39-.12-.56.12c-.17.25-.64.82-.79.98s-.29.17-.54.06c-.25-.12-1.06-.39-2.02-1.25s-1.45-1.95-1.61-2.29c-.17-.34 0-.52.11-.64.1-.12.25-.29.37-.44s.17-.25.25-.42c.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.4-.42-.55-.42h-.48c-.17 0-.44.06-.68.29s-.9.88-.9 2.15.92 2.49 1.04 2.66c.12.17 1.82 2.8 4.41 3.9s1.73.93 2.32.74c.59-.19 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18s-.22-.17-.47-.29z"/></svg>);
const YouTubeIcon = () => (<svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.25,4,12,4,12,4S5.75,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.75,2,12,2,12s0,4.25,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.75,20,12,20,12,20s6.25,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.25,22,12,22,12S22,7.75,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" /></svg>);
const SpotifyIcon = () => (<svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2C6.477,2,2,6.477,2,12s4.477,10,10,10s10-4.477,10-10S17.523,2,12,2z M16.7,16.4c-0.2-0.3-0.6-0.4-0.9-0.2 c-2.3,1.4-5.2,1.7-8.6,0.9c-0.4,0-0.7,0.3-0.7,0.6c0,0.3,0.3,0.7,0.6,0.7c3.7,0.8,7.1,0.5,9.7-1.1C17,16.9,17.1,16.6,16.7,16.4z M17.9,13.4c-0.2-0.4-0.8-0.5-1.1-0.2c-2.6,1.6-6.5,2.1-9.5,1.1c-0.4-0.1-0.9,0.1-1,0.5c-0.1,0.4,0.1,0.9,0.5,1 c3.4,1,7.8,0.5,10.7-1.3C18.1,14.1,18.2,13.7,17.9,13.4z M18,10.1c-3.1,1.9-8.3,2.2-11,1.2C6.5,11.1,6,11.3,5.8,11.8 c-0.2,0.5,0.1,1,0.6,1.2c3.1,1.1,8.9,0.8,12.4-1.4c0.5-0.3,0.6-0.9,0.4-1.3C18.9,9.8,18.4,9.8,18,10.1z" /></svg>);
const AppleMusicIcon = () => (<svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12.15,6.32c-0.1-1.3-0.93-2.58-2.05-3.18c-0.85-0.45-1.93-0.46-2.73,0.2c-1.38,1.13-2.3,3.13-2.12,5.2 c0.02,0.28,0.05,0.55,0.08,0.84c1.23,0.09,2.44,0.01,3.65-0.18c0.9-0.14,1.98-0.4,2.65-1.18C12.35,7.29,12.24,6.77,12.15,6.32z M11.83,7.99c-0.48,0.62-1.35,0.88-2.12,1.01c-1,0.16-2,0.25-3,0.25c-0.12,0-0.24,0-0.36-0.01c0.01-0.12,0.02-0.24,0.03-0.36 c0.31-2.92,2.2-5.49,4.8-6.57c0.88-0.37,1.93-0.26,2.7,0.36C14.7,3.2,15.5,4.3,15.5,6c0,0.04,0,0.09,0,0.13 c-0.83-0.11-1.66-0.09-2.48,0.06C12.34,6.3,12.01,7.2,11.83,7.99z M19,8.54c-1.4-0.11-2.78,0.12-4.14,0.61 c-0.91,0.33-1.68,0.92-2.32,1.64c-1.3,1.48-2,3.39-1.92,5.33c0.05,1.21,0.46,2.37,1.18,3.33c0.88,1.16,2.23,1.86,3.66,1.75 c0.54-0.04,1.08-0.18,1.6-0.4c1.37-0.57,2.44-1.73,3.01-3.13C21.16,15.2,20.8,11.39,19,8.54z" /></svg>);
const ThumbsUpIcon = ({ filled }: { filled: boolean }) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.768a2 2 0 001.945-1.556l1.28-5.123a2 2 0 00-1.242-2.355V7.5a2 2 0 00-2-2h-1.586a1 1 0 00-.949.684l-1.888 3.817A1.5 1.5 0 016 10.333z" /></svg>);
const ThumbsDownIcon = ({ filled }: { filled: boolean }) => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1h-6.768a2 2 0 00-1.945 1.556L3.002 8.679a2 2 0 001.242 2.355V12.5a2 2 0 002 2h1.586a1 1 0 00.949-.684l1.888-3.817A1.5 1.5 0 0114 9.667z" /></svg>);


const NowPlaying: React.FC<NowPlayingProps> = ({ liveNowPlaying, recentlyPlayed, vibes, userVibe, onVibeVote, nowPlayingError, likedSongs, dislikedSongs, onSongRating, isLoggedIn }) => {
  const shareUrl = window.location.href;
  const isSongLoaded = liveNowPlaying.song && liveNowPlaying.song.title !== 'Loading...' && liveNowPlaying.song.title !== '';
  const shareText = isSongLoaded 
    ? `I'm listening to "${liveNowPlaying.song.title}" by ${liveNowPlaying.song.artist} on Nam Radio Live! 📻🎶 Join the vibe here:`
    : `Tuning into Nam Radio Live! 📻🎶 Join the vibe now:`;
  
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}%20${encodeURIComponent(shareUrl)}`;
  
  const [funFact, setFunFact] = useState<string | null>(null);
  const [isLoadingFact, setIsLoadingFact] = useState(false);
  const [factError, setFactError] = useState<string | null>(null);

  // When the live song changes, clear the old fun fact
  useEffect(() => {
    setFunFact(null);
    setFactError(null);
  }, [liveNowPlaying.song]);

  const handleGetFunFact = async () => {
    setIsLoadingFact(true);
    setFactError(null);
    setFunFact(null);
    try {
      const fact = await getSongFunFact(liveNowPlaying.song);
      setFunFact(fact);
    } catch (error) {
      setFactError("Could not fetch fun fact. Please try again later.");
    } finally {
      setIsLoadingFact(false);
    }
  };
  
  const songSearchQuery = encodeURIComponent(`${liveNowPlaying.song.title} ${liveNowPlaying.song.artist}`);
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${songSearchQuery}`;
  const spotifySearchUrl = `https://open.spotify.com/search/${songSearchQuery}`;
  const appleMusicSearchUrl = `https://music.apple.com/us/search?term=${songSearchQuery}`;

  const currentSongId = `${liveNowPlaying.song.title} - ${liveNowPlaying.song.artist}`;
  const isCurrentLiked = likedSongs.some(s => s.id === currentSongId);
  const isCurrentDisliked = dislikedSongs.some(s => s.id === currentSongId);

  const MusicArtPlaceholder = () => (
    <div className="w-24 h-24 bg-slate-700/50 flex items-center justify-center rounded-lg flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
        </svg>
    </div>
  );

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-800/80 space-y-8"
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight font-display text-white">Live Player</h2>
        </div>

        {nowPlayingError && (
          <div className="mb-4 p-3.5 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <span>{nowPlayingError}</span>
          </div>
        )}

        <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/40 p-1 shadow-inner">
          <iframe
            title="Live Radio Player"
            src="https://music-station.live/public/namradio/embed?autoplay=1&layout=compact&rounded=1&allow_popup=1&continuous=1"
            frameBorder="0"
            allowTransparency={true}
            style={{ width: '100%', minHeight: '150px', height: '150px', border: 0, borderRadius: '12px' }}
          ></iframe>
        </div>
        
        <div className="mt-5 bg-slate-900/40 rounded-xl p-4 border border-slate-800/40">
          <h3 className="text-sm font-semibold mb-3 text-slate-400 uppercase tracking-widest font-mono">Broadcast Feed</h3>
          <div className="flex items-center gap-2.5">
            <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter" className="p-2.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-lg transition-all text-slate-300 hover:text-white hover:scale-105">
              <TwitterIcon />
            </a>
            <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="p-2.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-lg transition-all text-slate-300 hover:text-white hover:scale-105">
              <FacebookIcon />
            </a>
            <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" className="p-2.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-lg transition-all text-slate-300 hover:text-white hover:scale-105">
              <WhatsAppIcon />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/80 pt-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <Music className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight font-display text-white">More About The Music</h2>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800/40 flex flex-col md:flex-row items-center md:items-start gap-5">
            {liveNowPlaying.song.artUrl ? (
              <img src={liveNowPlaying.song.artUrl} alt={`Album art for ${liveNowPlaying.song.title}`} className="w-24 h-24 rounded-xl object-cover shadow-2xl border border-slate-800 flex-shrink-0" />
            ) : (
              <MusicArtPlaceholder />
            )}
            <div className="text-center md:text-left flex-grow">
              <p className="text-xs font-mono uppercase text-slate-500 tracking-wider font-semibold">Now Playing</p>
              <p className="font-extrabold text-xl text-white tracking-tight mt-0.5">{liveNowPlaying.song.title}</p>
              <p className="text-md font-medium text-slate-300 mt-0.5">{liveNowPlaying.song.artist}</p>
              
              <div className="mt-4 border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider font-mono">Stream On</p>
                  <div className="flex items-center gap-3">
                    <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer" aria-label="Search on YouTube" className="text-slate-400 hover:text-white transition-all hover:scale-110" title="Find on YouTube"><YouTubeIcon/></a>
                    <a href={spotifySearchUrl} target="_blank" rel="noopener noreferrer" aria-label="Search on Spotify" className="text-slate-400 hover:text-white transition-all hover:scale-110" title="Find on Spotify"><SpotifyIcon/></a>
                    <a href={appleMusicSearchUrl} target="_blank" rel="noopener noreferrer" aria-label="Search on Apple Music" className="text-slate-400 hover:text-white transition-all hover:scale-110" title="Find on Apple Music"><AppleMusicIcon/></a>
                  </div>
                </div>
                
                <div className="flex flex-col items-center md:items-end">
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider font-mono">Share This Song</p>
                  <div className="flex items-center gap-2">
                    <a 
                      href={twitterShareUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-lg text-slate-300 transition-all duration-200 shadow-md"
                    >
                      <TwitterIcon />
                      <span>Tweet</span>
                    </a>
                    <a 
                      href={whatsappShareUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-lg text-slate-300 transition-all duration-200 shadow-md"
                    >
                      <WhatsAppIcon />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                {isLoggedIn ? (
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-400 font-medium">Rate:</span>
                    <button 
                      onClick={() => onSongRating(liveNowPlaying.song, 'like')}
                      className={`p-2 rounded-lg transition-all ${isCurrentLiked ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-slate-400 hover:text-green-400 hover:bg-slate-800/50'}`}
                      aria-label="Like current song"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onSongRating(liveNowPlaying.song, 'dislike')}
                      className={`p-2 rounded-lg transition-all ${isCurrentDisliked ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-slate-400 hover:text-red-400 hover:bg-slate-800/50'}`}
                      aria-label="Dislike current song"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Log in to rate this track & unlock features.</p>
                )}
              </div>
            </div>
            
            <button 
              onClick={handleGetFunFact}
              disabled={isLoadingFact}
              className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-200 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoadingFact ? 'Discovering...' : 'Song Fact'}</span>
            </button>
          </div>

          <VibeCheck vibes={vibes} selectedVibe={userVibe} onVote={onVibeVote} />
        </div>
        
        {isLoadingFact && (
          <div className="flex justify-center items-center h-20 mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400"></div>
          </div>
        )}
        {factError && <p className="mt-4 text-center text-sm text-red-400 bg-red-500/5 p-3 rounded-xl border border-red-500/10">{factError}</p>}
        {funFact && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4.5 bg-amber-500/5 border-l-2 border-amber-400 rounded-r-xl prose prose-invert"
          >
            <p className="text-slate-300 italic text-sm leading-relaxed">
              <span className="font-bold text-amber-400 not-italic uppercase tracking-wider text-xs block mb-1">💡 DJ AI Trivia</span> "{funFact}"
            </p>
          </motion.div>
        )}
      </div>

      <div className="border-t border-slate-800/80 pt-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <History className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight font-display text-white">Recently Played</h2>
        </div>

        <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/40">
          {!isLoggedIn && (
            <div className="text-center text-xs text-slate-400 mb-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-850">
              🔒 Log in to rate songs and build your personalized music station!
            </div>
          )}
          {recentlyPlayed.length > 0 ? (
            <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {recentlyPlayed.map((song, index) => {
                const songId = `${song.title} - ${song.artist}`;
                const isLiked = likedSongs.some(s => s.id === songId);
                const isDisliked = dislikedSongs.some(s => s.id === songId);

                return (
                  <motion.li 
                    key={`${song.title}-${index}`} 
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 p-2 hover:bg-slate-900/60 rounded-lg transition-all"
                  >
                    {song.artUrl ? (
                      <img src={song.artUrl} alt={song.title} className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-md border border-slate-800" />
                    ) : (
                      <div className="w-11 h-11 bg-slate-950 border border-slate-800 flex items-center justify-center rounded-lg flex-shrink-0">
                        <Music className="h-5 w-5 text-slate-500" />
                      </div>
                    )}
                    <div className="flex-grow overflow-hidden">
                      <p className="font-bold text-slate-200 text-sm truncate">{song.title}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{song.artist}</p>
                    </div>
                    {isLoggedIn && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button 
                          onClick={() => onSongRating(song, 'like')}
                          className={`p-1.5 rounded-md transition-colors ${isLiked ? 'text-green-400 bg-green-500/10' : 'text-slate-500 hover:text-green-400 hover:bg-slate-800/40'}`}
                          aria-label="Like song"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onSongRating(song, 'dislike')}
                          className={`p-1.5 rounded-md transition-colors ${isDisliked ? 'text-red-400 bg-red-500/10' : 'text-slate-500 hover:text-red-400 hover:bg-slate-800/40'}`}
                          aria-label="Dislike song"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          ) : (
            <p className="text-slate-500 text-center py-10 text-sm">Waiting for broadcast feed stream history...</p>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default NowPlaying;