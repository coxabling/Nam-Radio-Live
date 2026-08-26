import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThumbsUp, ThumbsDown, Radio, Sparkles, History, Music, BookOpen, Volume2, Share2, Info, Flame, Tag } from 'lucide-react';
import { getSongFunFact, getSongStoryAndInsight } from '../services/geminiService';
import { Song, ApiScheduleItem, Vibe, VibeType, SongRating, SongInsight } from '../types';
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

// Clean Social icons
const TwitterIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zM12.04 20.15c-1.55 0-3.05-.4-4.39-1.15l-.31-.18-3.26.86.88-3.18-.2-.33c-.83-1.38-1.26-2.98-1.26-4.64 0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24zm4.52-6.13c-.25-.12-1.47-.72-1.7-.82s-.39-.12-.56.12c-.17.25-.64.82-.79.98s-.29.17-.54.06c-.25-.12-1.06-.39-2.02-1.25s-1.45-1.95-1.61-2.29c-.17-.34 0-.52.11-.64.1-.12.25-.29.37-.44s.17-.25.25-.42c.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.4-.42-.55-.42h-.48c-.17 0-.44.06-.68.29s-.9.88-.9 2.15.92 2.49 1.04 2.66c.12.17 1.82 2.8 4.41 3.9s1.73.93 2.32.74c.59-.19 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18s-.22-.17-.47-.29z" />
  </svg>
);
const YouTubeIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.25,4,12,4,12,4S5.75,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.75,2,12,2,12s0,4.25,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.75,20,12,20,12,20s6.25,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.25,22,12,22,12S22,7.75,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" />
  </svg>
);
const SpotifyIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12,2C6.477,2,2,6.477,2,12s4.477,10,10,10s10-4.477,10-10S17.523,2,12,2z M16.7,16.4c-0.2-0.3-0.6-0.4-0.9-0.2 c-2.3,1.4-5.2,1.7-8.6,0.9c-0.4,0-0.7,0.3-0.7,0.6c0,0.3,0.3,0.7,0.6,0.7c3.7,0.8,7.1,0.5,9.7-1.1C17,16.9,17.1,16.6,16.7,16.4z M17.9,13.4c-0.2-0.4-0.8-0.5-1.1-0.2c-2.6,1.6-6.5,2.1-9.5,1.1c-0.4-0.1-0.9,0.1-1,0.5c-0.1,0.4,0.1,0.9,0.5,1 c3.4,1,7.8,0.5,10.7-1.3C18.1,14.1,18.2,13.7,17.9,13.4z M18,10.1c-3.1,1.9-8.3,2.2-11,1.2C6.5,11.1,6,11.3,5.8,11.8 c-0.2,0.5,0.1,1,0.6,1.2c3.1,1.1,8.9,0.8,12.4-1.4c0.5-0.3,0.6-0.9,0.4-1.3C18.9,9.8,18.4,9.8,18,10.1z" />
  </svg>
);
const AppleMusicIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.15,6.32c-0.1-1.3-0.93-2.58-2.05-3.18c-0.85-0.45-1.93-0.46-2.73,0.2c-1.38,1.13-2.3,3.13-2.12,5.2 c0.02,0.28,0.05,0.55,0.08,0.84c1.23,0.09,2.44,0.01,3.65-0.18c0.9-0.14,1.98-0.4,2.65-1.18C12.35,7.29,12.24,6.77,12.15,6.32z M11.83,7.99c-0.48,0.62-1.35,0.88-2.12,1.01c-1,0.16-2,0.25-3,0.25c-0.12,0-0.24,0-0.36-0.01c0.01-0.12,0.02-0.24,0.03-0.36 c0.31-2.92,2.2-5.49,4.8-6.57c0.88-0.37,1.93-0.26,2.7,0.36C14.7,3.2,15.5,4.3,15.5,6c0,0.04,0,0.09,0,0.13 c-0.83-0.11-1.66-0.09-2.48,0.06C12.34,6.3,12.01,7.2,11.83,7.99z M19,8.54c-1.4-0.11-2.78,0.12-4.14,0.61 c-0.91,0.33-1.68,0.92-2.32,1.64c-1.3,1.48-2,3.39-1.92,5.33c0.05,1.21,0.46,2.37,1.18,3.33c0.88,1.16,2.23,1.86,3.66,1.75 c0.54-0.04,1.08-0.18,1.6-0.4c1.37-0.57,2.44-1.73,3.01-3.13C21.16,15.2,20.8,11.39,19,8.54z" />
  </svg>
);

const NowPlaying: React.FC<NowPlayingProps> = ({
  liveNowPlaying,
  recentlyPlayed,
  vibes,
  userVibe,
  onVibeVote,
  nowPlayingError,
  likedSongs,
  dislikedSongs,
  onSongRating,
  isLoggedIn,
}) => {
  const shareUrl = window.location.href;
  const isSongLoaded = liveNowPlaying.song && liveNowPlaying.song.title !== 'Loading...' && liveNowPlaying.song.title !== '';
  const shareText = isSongLoaded
    ? `Listening to "${liveNowPlaying.song.title}" by ${liveNowPlaying.song.artist} on Nam Radio Live! 📻🎶 Join the vibe:`
    : `Tuning into Nam Radio Live! 📻🎶 Join the vibe:`;

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}%20${encodeURIComponent(shareUrl)}`;

  const [funFact, setFunFact] = useState<string | null>(null);
  const [songStory, setSongStory] = useState<{ meaning: string; culturalBackstory: string; moodKeywords: string[]; djTip: string } | null>(null);
  const [isLoadingFact, setIsLoadingFact] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [factError, setFactError] = useState<string | null>(null);

  // Clear trivia on song change
  useEffect(() => {
    setFunFact(null);
    setSongStory(null);
    setFactError(null);
  }, [liveNowPlaying.song]);

  const handleGetFunFact = async () => {
    setIsLoadingFact(true);
    setFactError(null);
    try {
      const fact = await getSongFunFact(liveNowPlaying.song);
      setFunFact(fact);
    } catch (error) {
      setFactError('Could not fetch trivia right now.');
    } finally {
      setIsLoadingFact(false);
    }
  };

  const handleGetSongStory = async () => {
    setIsLoadingStory(true);
    try {
      const story = await getSongStoryAndInsight(liveNowPlaying.song);
      setSongStory(story);
    } catch (error) {
      setFactError('Could not fetch cultural story.');
    } finally {
      setIsLoadingStory(false);
    }
  };

  const songSearchQuery = encodeURIComponent(`${liveNowPlaying.song.title} ${liveNowPlaying.song.artist}`);
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${songSearchQuery}`;
  const spotifySearchUrl = `https://open.spotify.com/search/${songSearchQuery}`;
  const appleMusicSearchUrl = `https://music.apple.com/us/search?term=${songSearchQuery}`;

  const currentSongId = `${liveNowPlaying.song.title} - ${liveNowPlaying.song.artist}`;
  const isCurrentLiked = likedSongs.some(s => s.id === currentSongId);
  const isCurrentDisliked = dislikedSongs.some(s => s.id === currentSongId);

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-slate-950/40 backdrop-blur-2xl rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-800/80 space-y-8"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight font-display text-white">Live Broadcast</h2>
              <p className="text-xs text-slate-400 font-mono">Streamed Direct from Windhoek, Namibia</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">ON AIR</span>
          </div>
        </div>

        {nowPlayingError && (
          <div className="mb-4 p-3.5 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20 flex items-center gap-3">
            <span>{nowPlayingError}</span>
          </div>
        )}

        {/* AzuraCast Embed Player */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/60 p-1 shadow-inner">
          <iframe
            title="Nam Radio Live Player"
            src="https://music-station.live/public/namradio/embed?autoplay=1&layout=compact&rounded=1&allow_popup=1&continuous=1"
            style={{ width: '100%', minHeight: '150px', height: '150px', border: 0, borderRadius: '12px' }}
          />
        </div>
      </div>

      {/* Track Details & Music Deep Dive */}
      <div className="border-t border-slate-800/80 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
              <Music className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight font-display text-white">Track Profile</h3>
          </div>

          {liveNowPlaying.show && (
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-amber-300">
              Show: {liveNowPlaying.show.name}
            </span>
          )}
        </div>

        <div className="bg-slate-900/40 rounded-2xl p-5 border border-slate-800/60 flex flex-col md:flex-row items-center md:items-start gap-5">
          {liveNowPlaying.song.artUrl ? (
            <img
              src={liveNowPlaying.song.artUrl}
              alt={`Album art for ${liveNowPlaying.song.title}`}
              className="w-28 h-28 rounded-2xl object-cover shadow-2xl border border-slate-800 flex-shrink-0"
            />
          ) : (
            <div className="w-28 h-28 bg-slate-950 border border-slate-800 flex items-center justify-center rounded-2xl flex-shrink-0 text-slate-500">
              <Music className="w-10 h-10" />
            </div>
          )}

          <div className="text-center md:text-left flex-grow min-w-0">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
              Currently Spinning
            </span>
            <p className="font-extrabold text-2xl text-white tracking-tight mt-1.5 truncate">
              {liveNowPlaying.song.title}
            </p>
            <p className="text-base font-medium text-slate-300 mt-0.5 truncate">
              {liveNowPlaying.song.artist}
            </p>

            {/* Actions Bar */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              {/* Stream On External Platforms */}
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5 font-mono uppercase font-bold tracking-wider">
                  Stream On
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href={youtubeSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-red-400 transition-all hover:scale-110"
                    title="Find on YouTube"
                  >
                    <YouTubeIcon />
                  </a>
                  <a
                    href={spotifySearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-emerald-400 transition-all hover:scale-110"
                    title="Find on Spotify"
                  >
                    <SpotifyIcon />
                  </a>
                  <a
                    href={appleMusicSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-pink-400 transition-all hover:scale-110"
                    title="Find on Apple Music"
                  >
                    <AppleMusicIcon />
                  </a>
                </div>
              </div>

              {/* Rate Track */}
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5 font-mono uppercase font-bold tracking-wider">
                  Your Rating
                </p>
                {isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSongRating(liveNowPlaying.song, 'like')}
                      className={`p-2 rounded-xl transition-all ${
                        isCurrentLiked
                          ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-emerald-400 bg-slate-950 border border-slate-800'
                      }`}
                      title="Like song (+15 points)"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSongRating(liveNowPlaying.song, 'dislike')}
                      className={`p-2 rounded-xl transition-all ${
                        isCurrentDisliked
                          ? 'text-red-400 bg-red-500/15 border border-red-500/30'
                          : 'text-slate-400 hover:text-red-400 bg-slate-950 border border-slate-800'
                      }`}
                      title="Dislike song"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Log in to vote</span>
                )}
              </div>

              {/* Share */}
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5 font-mono uppercase font-bold tracking-wider">
                  Broadcast Share
                </p>
                <div className="flex items-center gap-1.5">
                  <a
                    href={twitterShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
                  >
                    <TwitterIcon />
                  </a>
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-emerald-400 transition-all text-xs flex items-center gap-1"
                  >
                    <WhatsAppIcon />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* AI Discovery Buttons */}
          <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto flex-shrink-0">
            <button
              onClick={handleGetSongStory}
              disabled={isLoadingStory}
              className="flex-1 md:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isLoadingStory ? 'Unraveling Story...' : 'Cultural Backstory'}</span>
            </button>

            <button
              onClick={handleGetFunFact}
              disabled={isLoadingFact}
              className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoadingFact ? 'Curating Fact...' : 'DJ Trivia'}</span>
            </button>
          </div>
        </div>

        {/* AI Trivia Result */}
        <AnimatePresence>
          {funFact && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-4 bg-amber-500/10 border-l-3 border-amber-400 rounded-r-xl"
            >
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] block font-mono mb-1">
                💡 DJ Alex Music Trivia:
              </span>
              <p className="text-slate-200 text-sm italic leading-relaxed">"{funFact}"</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Cultural Backstory & Meaning Result */}
        <AnimatePresence>
          {songStory && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-slate-900/60 rounded-2xl p-5 border border-amber-500/20 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Musical Meaning & Cultural Origin
                </span>
                <div className="flex items-center gap-1">
                  {songStory.moodKeywords?.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-950 text-[10px] text-slate-400 font-mono rounded border border-slate-800"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{songStory.meaning}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{songStory.culturalBackstory}</p>

              {songStory.djTip && (
                <div className="p-2.5 bg-amber-500/5 rounded-lg border border-amber-500/10 text-xs text-amber-300 italic">
                  🎧 DJ Note: {songStory.djTip}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vibe Check Module */}
        <VibeCheck vibes={vibes} selectedVibe={userVibe} onVote={onVibeVote} />
      </div>

      {/* Recently Played List */}
      <div className="border-t border-slate-800/80 pt-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <History className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold tracking-tight font-display text-white">Broadcast History</h3>
        </div>

        <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/40">
          {recentlyPlayed.length > 0 ? (
            <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {recentlyPlayed.map((song, index) => {
                const songId = `${song.title} - ${song.artist}`;
                const isLiked = likedSongs.some(s => s.id === songId);
                const isDisliked = dislikedSongs.some(s => s.id === songId);

                return (
                  <motion.li
                    key={`${song.title}-${index}`}
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 p-2 hover:bg-slate-900/70 rounded-xl transition-all"
                  >
                    {song.artUrl ? (
                      <img
                        src={song.artUrl}
                        alt={song.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow border border-slate-800"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-950 border border-slate-800 flex items-center justify-center rounded-lg flex-shrink-0 text-slate-500">
                        <Music className="h-4 w-4" />
                      </div>
                    )}

                    <div className="flex-grow overflow-hidden min-w-0">
                      <p className="font-bold text-slate-200 text-sm truncate">{song.title}</p>
                      <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                    </div>

                    {isLoggedIn && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => onSongRating(song, 'like')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isLiked
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'
                          }`}
                          aria-label="Like song"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSongRating(song, 'dislike')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDisliked
                              ? 'text-red-400 bg-red-500/10'
                              : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'
                          }`}
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
            <p className="text-slate-500 text-center py-8 text-sm font-mono">
              Listening for incoming stream history...
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default NowPlaying;
