import React, { useState, useEffect } from 'react';

// A local User type to avoid prop drilling complexity from App.tsx
interface User {
  username: string;
  avatarUrl?: string;
}

interface HeaderProps {
    isLoggedIn: boolean;
    currentUser: User | null;
    currentShowName: string | null;
    onLoginClick: (redirectPath?: string) => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, currentUser, currentShowName, onLoginClick, onLogout }) => {
  const [stationTime, setStationTime] = useState('');
  const [activeRoute, setActiveRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setActiveRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const time = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Africa/Windhoek',
        hour: '2-digit',
        minute: '2-digit',
      });
      setStationTime(time);
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  const NavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
    const isActive = activeRoute === href;
    return (
        <a href={href} className={`px-3 py-2 rounded-md transition-colors text-sm font-semibold ${isActive ? 'text-amber-300 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}>
            {children}
        </a>
    );
  };
  
  const handleMyStationClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
        e.preventDefault();
        onLoginClick('#/mystation');
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = '#/';
  };

  return (
    <header className="sticky top-0 z-20 py-4 px-4 md:px-8 shadow-lg bg-slate-900/60 backdrop-blur-lg border-b border-slate-700/50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
           <a href="#/" onClick={handleHomeClick} className="flex items-center gap-3">
             <span className="text-xl font-bold tracking-wider text-white">Nam Radio Live</span>
           </a>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-slate-400">{stationTime} (Namibia)</span>
            <div className="h-4 w-px bg-slate-600"></div>
            {currentShowName && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-500 animate-pulse text-sm">Live</span>
                <span className="text-sm font-semibold text-amber-300">On Air: {currentShowName}</span>
              </div>
            )}
        </div>

        <nav className="flex items-center gap-2 md:gap-4">
          <NavLink href="#/">Home</NavLink>
          <a href="#/mystation" onClick={handleMyStationClick} className={`px-3 py-2 rounded-md transition-colors text-sm font-semibold ${activeRoute === '#/mystation' ? 'text-amber-300 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}>My Station</a>
          <NavLink href="#/contact">Contact</NavLink>
          
          {isLoggedIn ? (
            <div className="ml-2 pl-4 border-l border-slate-600 flex items-center gap-3">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Your avatar" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                </span>
              )}
              <span className="text-sm font-semibold text-white hidden sm:block">Hi, {currentUser?.username}</span>
              <button onClick={onLogout} className="px-3 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">Logout</button>
            </div>
          ) : (
             <button onClick={() => onLoginClick()} className="ml-2 px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors">Login</button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;