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
    isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, currentUser, currentShowName, onLoginClick, onLogout, isAdmin }) => {
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
    <header className="sticky top-0 z-40 py-4 px-4 md:px-8 bg-slate-950/40 backdrop-blur-2xl border-b border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
           <a href="#/" onClick={handleHomeClick} className="flex items-center gap-3 group">
             <div className="relative">
               <img src="/logo192.svg" alt="Nam Radio Live Logo" className="w-11 h-11 transition-transform group-hover:scale-105" />
               <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </div>
             <span className="text-xl font-bold tracking-tight font-display text-white bg-clip-text hidden sm:inline">
               Nam Radio <span className="text-amber-400">Live</span>
             </span>
           </a>
        </div>
        <nav className="hidden md:flex items-center gap-1.5">
            <NavLink href="#/">Home</NavLink>
            <a 
              href="#/mystation" 
              onClick={handleMyStationClick} 
              className={`px-3 py-1.5 rounded-lg transition-all text-sm font-semibold border ${
                activeRoute === '#/mystation' 
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60 border-transparent hover:border-slate-800/60'
              }`}
            >
              My Station
            </a>
            <NavLink href="#/contact">Contact</NavLink>
            {isAdmin && <NavLink href="#/admin">Admin</NavLink>}
        </nav>
        <div className="flex items-center gap-4">
            <div className="text-right">
                {isLoggedIn && currentUser ? (
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-bold text-slate-100 truncate">{currentUser.username}</p>
                            <p className="text-xs text-slate-500 font-mono">Listener</p>
                        </div>
                        <button onClick={onLogout} className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all">Logout</button>
                    </div>
                ) : (
                    <button onClick={() => onLoginClick()} className="px-4.5 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all duration-200">Login</button>
                )}
            </div>
             <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-850">
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </div>
                <span className="text-sm font-mono font-bold tracking-tight text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">{stationTime}</span>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;