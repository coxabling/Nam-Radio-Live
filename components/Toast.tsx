import React from 'react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

const CheckCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>);

const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 bg-slate-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-amber-500/50 flex items-center gap-4 animate-fade-in"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0 text-amber-400">
        <CheckCircleIcon />
      </div>
      <div className="flex-grow text-white font-semibold">{message}</div>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;