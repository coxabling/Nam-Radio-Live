import React from 'react';

interface DailyRewindModalProps {
  isLoading: boolean;
  rewindContent: string | null;
  error: string | null;
  onClose: () => void;
}

const DailyRewindModal: React.FC<DailyRewindModalProps> = ({ isLoading, rewindContent, error, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-slate-700/50 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-4 tracking-wide text-amber-300 text-center">Your Daily Rewind</h2>
        
        {isLoading && (
          <div className="flex flex-col justify-center items-center h-48 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mb-4"></div>
            <p className="text-slate-300 font-semibold">DJ Alex is checking the records...</p>
            <p className="text-sm text-slate-400">Crafting your personal shoutout!</p>
          </div>
        )}
        
        {error && (
          <div className="text-center p-4 bg-red-500/10 text-red-300 rounded-lg">
            <p className="font-semibold">Oh no, a glitch in the matrix!</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {rewindContent && (
          <div className="mt-4 p-4 bg-amber-500/10 border-l-4 border-amber-400 rounded-r-lg animate-fade-in">
             <div className="prose prose-invert max-w-none text-slate-300" dangerouslySetInnerHTML={{ __html: rewindContent.replace(/\n/g, '<br />') }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRewindModal;
