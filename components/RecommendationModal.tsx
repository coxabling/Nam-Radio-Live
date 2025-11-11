
import React from 'react';
import { ApiScheduleItem } from '../types';

interface RecommendationModalProps {
  recommendation: {
    show: ApiScheduleItem;
    reason: string;
  };
  onClose: () => void;
}

const RecommendationModal: React.FC<RecommendationModalProps> = ({ recommendation, onClose }) => {
  const { show, reason } = recommendation;

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

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-wide text-amber-300">DJ Alex Recommends...</h2>
          <p className="mt-2 text-slate-400">Since you liked that show, you might love this one!</p>
        </div>

        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="font-bold text-lg text-white">{show.name}</h3>
          <p className="text-sm text-slate-400 mt-1">{show.description}</p>
        </div>

        <div className="mt-4 p-4 bg-amber-500/10 border-l-4 border-amber-400 rounded-r-lg">
          <p className="text-slate-300 italic">
            <span className="font-bold text-amber-300 not-italic">Here's why:</span> "{reason}"
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
};

export default RecommendationModal;
