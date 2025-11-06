import React from 'react';

interface InstallPwaButtonProps {
  onInstallClick: () => void;
  isVisible: boolean;
}

const InstallIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

const InstallPwaButton: React.FC<InstallPwaButtonProps> = ({ onInstallClick, isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={onInstallClick}
      className="fixed bottom-8 left-8 z-50 flex items-center px-4 py-2 bg-amber-500 text-white font-semibold rounded-full shadow-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 transition-opacity duration-300 animate-fade-in"
      aria-label="Install Nam Radio Live App"
    >
      <InstallIcon />
      Install App
    </button>
  );
};

export default InstallPwaButton;
