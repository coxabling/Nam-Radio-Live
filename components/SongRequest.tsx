
import React, { useState, useEffect } from 'react';
import { getDjConfirmation } from '../services/geminiService';
import { SongRequestRecord } from '../types';

interface User {
  username: string;
}

interface SongRequestProps {
  currentUser: User | null;
  onAddSongRequest: (request: SongRequestRecord) => void;
}

const SongRequest: React.FC<SongRequestProps> = ({ currentUser, onAddSongRequest }) => {
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // Cooldown time in seconds

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
        const remainingMs = oneHour - timeSince;
        setTimeLeft(Math.ceil(remainingMs / 1000));
      }
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [userName]);

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (timeLeft > 0) {
      setError(`You can request another song in ${formatTimeLeft(timeLeft)}.`);
      return;
    }

    if (!songTitle || !artistName) {
      setError('Please fill out both song title and artist.');
      return;
    }
    
    setIsLoading(true);
    setConfirmation(null);

    try {
      // Get AI confirmation
      const djMessage = await getDjConfirmation(songTitle, artistName, userName);
      setConfirmation(djMessage);

      // Create request record
      const newRequest: SongRequestRecord = {
        title: songTitle,
        artist: artistName,
        requestedAt: new Date().toISOString(),
      };
      
      // Notify parent component
      onAddSongRequest(newRequest);
      
      // Set cooldown for the user
      const lastRequestKey = `nam-radio-live-last-request-${userName}`;
      localStorage.setItem(lastRequestKey, new Date().toISOString());
      setTimeLeft(3600); // Start 1 hour cooldown

      // Clear form
      setSongTitle('');
      setArtistName('');

    } catch (err) {
      console.error("Failed to submit song request:", err);
      setError("Something went wrong with the request. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-4 tracking-wide text-amber-300">Request a Song</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="song-title" className="block text-sm font-medium text-slate-300 mb-1">Song Title</label>
          <input
            type="text"
            id="song-title"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="e.g., Water"
            required
            disabled={timeLeft > 0}
          />
        </div>
        <div>
          <label htmlFor="artist-name" className="block text-sm font-medium text-slate-300 mb-1">Artist</label>
          <input
            type="text"
            id="artist-name"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="e.g., Tyla"
            required
            disabled={timeLeft > 0}
          />
        </div>
        <p className="text-xs text-slate-400">Requesting as: <span className="font-bold text-amber-300">{userName}</span></p>
        <button
          type="submit"
          disabled={isLoading || timeLeft > 0}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : (timeLeft > 0 ? 'Request on Cooldown' : 'Send Request')}
        </button>
      </form>
      
      {error && <p className="mt-4 text-center text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>}
      
      {timeLeft > 0 && (
        <div className="mt-4 text-center text-amber-300 bg-amber-500/10 p-3 rounded-lg">
            <p className="text-sm">You can request another song in: <span className="font-bold tabular-nums">{formatTimeLeft(timeLeft)}</span></p>
        </div>
      )}

      {confirmation && (
         <div className="mt-4 p-4 bg-amber-500/10 border-l-4 border-amber-400 rounded-r-lg">
           <p className="text-slate-300 italic">
            <span className="font-bold text-amber-300 not-italic">DJ Alex says:</span> "{confirmation}"
           </p>
         </div>
      )}
    </section>
  );
};

export default SongRequest;
