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
    <header className="sticky top-0 z-20 py-4 px-4 md:px-8 shadow-lg bg-slate-900/60 backdrop-blur-lg border-b border-slate-700/50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
           <a href="#/" onClick={handleHomeClick} className="flex items-center gap-3">
             <img src="/logo192.svg" alt="Nam Radio Live Logo" className="w-12 h-12" />
             <span className="text-xl font-bold tracking-wider text-white hidden sm:inline">Nam Radio Live</span>
           </a>
        </div>
        <nav className="hidden md:flex items-center gap-2">
            <NavLink href="#/">Home</NavLink>
            <a href="#/mystation" onClick={handleMyStationClick} className={`px-3 py-2 rounded-md transition-colors text-sm font-semibold ${activeRoute === '#/mystation' ? 'text-amber-300 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}>
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
                            <p className="text-sm font-semibold text-white truncate">{currentUser.username}</p>
                            <p className="text-xs text-slate-400">Listener</p>
                        </div>
                        <button onClick={onLogout} className="px-3 py-2 text-sm bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors">Logout</button>
                    </div>
                ) : (
                    <button onClick={() => onLoginClick()} className="px-4 py-2 text-sm bg-amber-500 text-white font-semibold rounded-md hover:bg-amber-600 transition-colors">Login</button>
                )}
            </div>
             <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-700">
                <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </div>
                <span className="text-sm font-mono font-semibold text-amber-300">{stationTime}</span>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;