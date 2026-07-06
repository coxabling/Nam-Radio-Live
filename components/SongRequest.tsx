import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Music, Sparkles, Send, Clock, Heart, MessageSquare } from 'lucide-react';
import { getRequestableSongs, submitSongRequest } from '../services/azuracastService';
// FIX: Import Song type for dedication payload.
import { RequestableSong, SongRequestRecord, Song } from '../types';

interface User {
  username: string;
}

interface SongRequestProps {
  currentUser: User | null;
  onAddSongRequest: (request: SongRequestRecord) => void;
  // FIX: Add a prop to handle dedications.
  onAddDedication: (dedication: { song: Song, to: string, message: string, from: string }) => void;
}

const SongRequest: React.FC<SongRequestProps> = ({ currentUser, onAddSongRequest, onAddDedication }) => {
  // FIX: Add tab state for switching between request and dedication.
  const [activeTab, setActiveTab] = useState<'request' | 'dedication'>('request');
  const [requestableSongs, setRequestableSongs] = useState<RequestableSong[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSong, setSelectedSong] = useState<RequestableSong | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  // FIX: Add state for dedication form data.
  const [dedicationData, setDedicationData] = useState({ to: '', message: '' });

  const userName = currentUser?.username || 'Guest';

  const resetForm = useCallback(() => {
    setSelectedSong(null);
    setSearchTerm('');
    setDedicationData({ to: '', message: '' });
    setResult(null);
  }, []);

  useEffect(() => {
    resetForm();
  }, [activeTab, resetForm]);

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
    if (!searchTerm) return [];
    const lowerCaseSearch = searchTerm.toLowerCase();
    return requestableSongs.filter(
      item =>
        item.song.title.toLowerCase().includes(lowerCaseSearch) ||
        item.song.artist.toLowerCase().includes(lowerCaseSearch)
    ).slice(0, 50);
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

  const handleDedicationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDedicationData({ ...dedicationData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (timeLeft > 0) {
      setResult({ success: false, message: `You can make another request in ${formatTimeLeft(timeLeft)}.` });
      return;
    }

    if (!selectedSong) {
      setResult({ success: false, message: 'Please search for and select a song from the list.' });
      return;
    }

    if (activeTab === 'dedication' && (!dedicationData.to || !dedicationData.message)) {
      setResult({ success: false, message: 'Please fill out the dedication fields.' });
      return;
    }
    
    setIsSubmitting(true);
    const response = await submitSongRequest(selectedSong.request_id);
    
    if (response.success) {
      const newRequest: SongRequestRecord = {
        title: selectedSong.song.title,
        artist: selectedSong.song.artist,
        requestedAt: new Date().toISOString(),
      };
      onAddSongRequest(newRequest);
      
      if (activeTab === 'dedication' && currentUser) {
          onAddDedication({
              song: { title: selectedSong.song.title, artist: selectedSong.song.artist },
              to: dedicationData.to,
              message: dedicationData.message,
              from: currentUser.username,
          });
      }

      setResult({ success: true, message: activeTab === 'dedication' ? 'Your dedication has been sent!' : response.message });

      const lastRequestKey = `nam-radio-live-last-request-${userName}`;
      localStorage.setItem(lastRequestKey, new Date().toISOString());
      setTimeLeft(3600);
      resetForm();
    } else {
      setResult(response);
    }
    setIsSubmitting(false);
  };

  const TabButton: React.FC<{ type: 'request' | 'dedication'; children: React.ReactNode }> = ({ type, children }) => (
    <button
      type="button"
      onClick={() => setActiveTab(type)}
      className={`relative w-full text-center py-3.5 px-4 text-sm font-bold tracking-tight transition-all rounded-xl ${
        activeTab === type 
          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-sm' 
          : 'text-slate-400 hover:text-slate-200 border border-transparent'
      }`}
    >
      {children}
    </button>
  );

  return (
    <section className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-800/80">
      <div className="flex bg-slate-950/40 p-1.5 rounded-2xl border border-slate-900/80 gap-1.5 mb-6">
        <TabButton type="request">Request a Song</TabButton>
        <TabButton type="dedication">Make a Dedication</TabButton>
      </div>

      <div className="pt-2">
        {activeTab === 'dedication' && !currentUser && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-5 bg-amber-500/5 text-amber-300 rounded-xl border border-amber-500/10 mb-4"
          >
            <p className="font-semibold text-sm">🔒 Login Required</p>
            <p className="text-xs text-slate-400 mt-1">Please log in to register custom song dedications on air.</p>
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className={`space-y-5 ${activeTab === 'dedication' && !currentUser ? 'opacity-40 pointer-events-none' : ''}`}>
          <div>
            <label htmlFor="song-search" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">1. Select Live Song</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="song-search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setSelectedSong(null); }}
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all"
                placeholder="Search by song name or artist..."
                autoComplete="off"
                disabled={timeLeft > 0 || isLoading}
              />
              {isLoading && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-400"></div>
                </div>
              )}
              {searchTerm && filteredSongs.length > 0 && (
                <ul className="absolute z-30 w-full mt-1.5 bg-slate-950 border border-slate-800/90 rounded-xl max-h-56 overflow-y-auto shadow-2xl divide-y divide-slate-900/60">
                  {filteredSongs.map(item => (
                    <li key={item.request_id}>
                      <button 
                        type="button" 
                        onClick={() => handleSelectSong(item)} 
                        className="w-full text-left px-4 py-2.5 hover:bg-amber-500/10 transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 flex-shrink-0 border border-slate-850">
                          <Music className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-bold text-slate-200 block text-sm truncate">{item.song.title}</span>
                          <span className="text-xs text-slate-400 block truncate mt-0.5">{item.song.artist}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <AnimatePresence>
            {activeTab === 'dedication' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label htmlFor="dedication-to" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">2. To (Recipient Name)</label>
                  <input 
                    type="text" 
                    id="dedication-to" 
                    name="to" 
                    value={dedicationData.to} 
                    onChange={handleDedicationChange} 
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all" 
                    placeholder="Recipient's Name"
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="dedication-message" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">3. Air message</label>
                  <textarea 
                    id="dedication-message" 
                    name="message" 
                    value={dedicationData.message} 
                    onChange={handleDedicationChange} 
                    rows={3} 
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all resize-none" 
                    placeholder="Write a lovely note for the show..."
                    required 
                    maxLength={150}
                  ></textarea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-1 border-t border-slate-900">
            <span className="text-xs text-slate-500 font-mono">
              Broadcasting as: <span className="font-bold text-amber-400">{userName}</span>
            </span>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={isSubmitting || timeLeft > 0 || isLoading || !selectedSong}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950"></div>
            ) : timeLeft > 0 ? (
              <>
                <Clock className="w-4 h-4" />
                <span>On Cooldown</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{activeTab === 'dedication' ? 'Send Air Dedication' : 'Send Live Request'}</span>
              </>
            )}
          </motion.button>
        </form>
      </div>
      
      {result && (
        <motion.p 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 text-center p-3 rounded-xl text-xs font-semibold ${
            result.success 
              ? 'bg-green-500/10 text-green-300 border border-green-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {result.message}
        </motion.p>
      )}
      
      {timeLeft > 0 && (
        <div className="mt-4 text-center text-amber-400 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 animate-pulse text-amber-500" />
            <p className="text-xs font-mono">
              New request window opens in: <span className="font-bold tracking-tight">{formatTimeLeft(timeLeft)}</span>
            </p>
        </div>
      )}

      {!isLoading && requestableSongs.length === 0 && (
        <p className="mt-4 text-center text-xs text-slate-500 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
          Song requests are currently disabled or unavailable.
        </p>
      )}
    </section>
  );
};

export default SongRequest;
