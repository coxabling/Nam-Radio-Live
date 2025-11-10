import React, { useState, useEffect, useCallback } from 'react';
import { SOUNDBOARD_ITEMS } from '../constants';
import { SoundboardItem } from '../types';
import { generateSoundDropAudio } from '../services/geminiService';

interface SoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints: number;
  onTriggerSound: (sound: SoundboardItem, audioData: string) => void;
}

type AudioCacheState = {
  data?: string;
  isLoading: boolean;
  error?: string;
};

const SoundboardModal: React.FC<SoundboardModalProps> = ({ isOpen, onClose, userPoints, onTriggerSound }) => {
  const [audioCache, setAudioCache] = useState<Record<string, AudioCacheState>>({});

  const generateAudio = useCallback(async (item: SoundboardItem) => {
    // Don't re-fetch if already loading or loaded
    if (audioCache[item.id]?.isLoading || audioCache[item.id]?.data) return;

    setAudioCache(prev => ({ ...prev, [item.id]: { isLoading: true } }));
    try {
      const audioData = await generateSoundDropAudio(item.text, item.voice);
      setAudioCache(prev => ({ ...prev, [item.id]: { isLoading: false, data: audioData } }));
    } catch (err: any) {
      setAudioCache(prev => ({ ...prev, [item.id]: { isLoading: false, error: err.message } }));
    }
  }, [audioCache]);

  // Pre-load all audio when the modal is opened for the first time
  useEffect(() => {
    if (isOpen) {
      SOUNDBOARD_ITEMS.forEach(item => {
        generateAudio(item);
      });
    }
  }, [isOpen, generateAudio]);

  const handleSoundClick = (item: SoundboardItem) => {
    const soundData = audioCache[item.id]?.data;
    if (soundData && userPoints >= item.cost) {
      onTriggerSound(item, soundData);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close soundboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-2 tracking-wide text-amber-300">Soundboard Surprises</h2>
        <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-slate-400">Use your points to play a sound in the chat!</p>
            <span className="text-sm font-semibold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md">{Math.floor(userPoints)} pts</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {SOUNDBOARD_ITEMS.map(item => {
            const cacheEntry = audioCache[item.id];
            const hasEnoughPoints = userPoints >= item.cost;
            const isReady = !!cacheEntry?.data && !cacheEntry?.isLoading;
            const isDisabled = !isReady || !hasEnoughPoints;

            return (
              <button
                key={item.id}
                onClick={() => handleSoundClick(item)}
                disabled={isDisabled}
                className={`p-4 rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 border-2 ${
                  isDisabled ? 'bg-slate-800/50 border-slate-700 text-slate-600 cursor-not-allowed' : 'bg-slate-800/80 border-slate-600 hover:border-amber-400 hover:scale-105 hover:bg-slate-700'
                }`}
              >
                <span className="text-4xl">{item.emoji}</span>
                <p className={`mt-2 text-sm font-semibold ${isDisabled ? 'text-slate-500' : 'text-white'}`}>{item.text}</p>
                <div className={`mt-2 text-xs font-bold px-2 py-0.5 rounded-full ${hasEnoughPoints ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-400'}`}>
                  {item.cost} pts
                </div>
                {cacheEntry?.isLoading && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-300"></div>
                    </div>
                )}
                {cacheEntry?.error && (
                    <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center rounded-lg text-xs text-red-300 p-2">
                        Error
                    </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SoundboardModal;
