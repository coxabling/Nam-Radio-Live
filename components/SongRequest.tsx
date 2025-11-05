
import React, { useState, useEffect, useMemo } from 'react';
import { getRequestableSongs, submitSongRequest } from '../services/azuracastService';
import { RequestableSong, SongRequestRecord } from '../types';

interface User {
  username: string;
}

interface SongRequestProps {
  currentUser: User | null;
  onAddSongRequest: (request: SongRequestRecord) => void;
}

const SongRequest: React.FC<SongRequestProps> = ({ currentUser, onAddSongRequest }) => {
  const [requestableSongs, setRequestableSongs] = useState<RequestableSong[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSong, setSelectedSong] = useState<RequestableSong | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const userName = currentUser?.username || 'Guest';

  // Cooldown logic
  useEffect(() => {
    const lastRequestKey = `nam-radio-live-last-request-${userName}`;
    const lastRequestTimeStr = localStorage.getItem(lastRequestKey);

    if (lastRequestTimeStr) {
      const lastRequestTime = new Date(lastRequestTimeStr).getTime();
      const now = new Date().getTime();
      const oneHour = 3600 * 1000;
      const timeSince = now - lastRequestTime;

      if (timeSince < oneHour) {
        setTimeLeft(Math.ceil((oneHour - timeSince) / 1000));
      }
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [userName]);

  // Fetch requestable songs on mount
  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoading(true);
      const songs = await getRequestableSongs();
      setRequestableSongs(songs);
      setIsLoading(false);
    };
    fetchSongs();
  }, []);

  const filteredSongs = useMemo(() => {
    if (!searchTerm) return []; // Don't show anything until user searches
    const lowerCaseSearch = searchTerm.toLowerCase();
    return requestableSongs.filter(
      item =>
        item.song.title.toLowerCase().includes(lowerCaseSearch) ||
        item.song.artist.toLowerCase().includes(lowerCaseSearch)
    ).slice(0, 50); // Limit results to avoid performance issues
  }, [searchTerm, requestableSongs]);
  
  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}s`;
  };

  const handleSelectSong = (song: RequestableSong) => {
    setSelectedSong(song);
    setSearchTerm(`${song.song.title} - ${song.song.artist}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (timeLeft > 0) {
      setResult({ success: false, message: `You can request another song in ${formatTimeLeft(timeLeft)}.` });
      return;
    }

    if (!selectedSong) {
      setResult({ success: false, message: 'Please search for and select a song from the list.' });
      return;
    }
    
    setIsSubmitting(true);
    const response = await submitSongRequest(selectedSong.request_id);
    setResult(response);

    if (response.success) {
      const newRequest: SongRequestRecord = {
        title: selectedSong.song.title,
        artist: selectedSong.song.artist,
        requestedAt: new Date().toISOString(),
      };
      onAddSongRequest(newRequest);
      
      const lastRequestKey = `nam-radio-live-last-request-${userName}`;
      localStorage.setItem(lastRequestKey, new Date().toISOString());
      setTimeLeft(3600); // Start 1 hour cooldown

      setSelectedSong(null);
      setSearchTerm('');
    }
    setIsSubmitting(false);
  };

  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-4 tracking-wide text-amber-300">Request a Song</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="song-search" className="block text-sm font-medium text-slate-300 mb-1">Search for a song</label>
          <div className="relative">
             <input
              type="text"
              id="song-search"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setSelectedSong(null); }}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Start typing song or artist..."
              autoComplete="off"
              disabled={timeLeft > 0 || isLoading}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-300"></div>
              </div>
            )}
            {searchTerm && filteredSongs.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg max-h-60 overflow-y-auto shadow-lg">
                {filteredSongs.map(item => (
                  <li key={item.request_id}>
                    <button 
                      type="button" 
                      onClick={() => handleSelectSong(item)}
                      className="w-full text-left px-4 py-2 text-white hover:bg-amber-500/20"
                    >
                      <span className="font-semibold block">{item.song.title}</span>
                      <span className="text-sm text-slate-400">{item.song.artist}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400">Requesting as: <span className="font-bold text-amber-300">{userName}</span></p>
        <button
          type="submit"
          disabled={isSubmitting || timeLeft > 0 || isLoading || !selectedSong}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : (timeLeft > 0 ? 'Request on Cooldown' : 'Send Request')}
        </button>
      </form>
      
      {result && (
        <p className={`mt-4 text-center p-3 rounded-lg text-sm ${result.success ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-400'}`}>
          {result.message}
        </p>
      )}
      
      {timeLeft > 0 && (
        <div className="mt-4 text-center text-amber-300 bg-amber-500/10 p-3 rounded-lg">
            <p className="text-sm">You can request another song in: <span className="font-bold tabular-nums">{formatTimeLeft(timeLeft)}</span></p>
        </div>
      )}

      {!isLoading && requestableSongs.length === 0 && (
        <p className="mt-4 text-center text-slate-400 bg-slate-800/50 p-3 rounded-lg text-sm">Song requests are currently disabled or unavailable.</p>
      )}
    </section>
  );
};

export default SongRequest;
