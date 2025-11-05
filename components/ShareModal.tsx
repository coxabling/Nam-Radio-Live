import React, { useState } from 'react';
import { ApiScheduleItem } from '../types';

interface ShareModalProps {
  show: ApiScheduleItem;
  onClose: () => void;
}

// Icons
const TwitterIcon = () => ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>);
const FacebookIcon = () => ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>);
const WhatsAppIcon = () => ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zM12.04 20.15c-1.55 0-3.05-.4-4.39-1.15l-.31-.18-3.26.86.88-3.18-.2-.33c-.83-1.38-1.26-2.98-1.26-4.64 0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24zm4.52-6.13c-.25-.12-1.47-.72-1.7-.82s-.39-.12-.56.12c-.17.25-.64.82-.79.98s-.29.17-.54.06c-.25-.12-1.06-.39-2.02-1.25s-1.45-1.95-1.61-2.29c-.17-.34 0-.52.11-.64.1-.12.25-.29.37-.44s.17-.25.25-.42c.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.4-.42-.55-.42h-.48c-.17 0-.44.06-.68.29s-.9.88-.9 2.15.92 2.49 1.04 2.66c.12.17 1.82 2.8 4.41 3.9s1.73.93 2.32.74c.59-.19 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18s-.22-.17-.47-.29z"/></svg>);

const ShareModal: React.FC<ShareModalProps> = ({ show, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const appUrl = window.location.origin + window.location.pathname;
  const shareText = `Check out "${show.name}" on Nam Radio Live! ${show.description} Tune in here: ${appUrl}`;
  
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(shareText)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-slate-700/50 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close share modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-2 tracking-wide text-amber-300">Share Show</h2>
        <div className="p-4 bg-slate-800/50 rounded-lg mb-6">
            <h3 className="font-bold text-lg text-white">{show.name}</h3>
            <p className="text-sm text-slate-400 mt-1">{show.description}</p>
        </div>
        
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-all text-white hover:scale-110">
                    <TwitterIcon />
                </a>
                <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-all text-white hover:scale-110">
                    <FacebookIcon />
                </a>
                <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-all text-white hover:scale-110">
                    <WhatsAppIcon />
                </a>
            </div>
            <div className="relative">
                <input 
                    type="text" 
                    readOnly 
                    value={shareText}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-4 pr-24 py-2 text-white text-sm"
                />
                <button 
                    onClick={handleCopy}
                    className="absolute right-1 top-1 bottom-1 px-4 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
