import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import NowPlaying from './components/NowPlaying';
import SongRequest from './components/SongRequest';
import Schedule from './components/Schedule';
import Djs from './components/Djs';
import Footer from './components/Footer';
import { DJS, WEEKLY_SCHEDULE, RECENTLY_PLAYED } from './constants';
import { getSchedule, getNowPlaying } from './services/azuracastService';
import UpcomingShows from './components/UpcomingShows';
import ScrollToTopButton from './components/ScrollToTopButton';
import About from './components/About';
import { ApiScheduleItem, Song, SongRequestRecord } from './types';
import LiveChat from './components/LiveChat';
import ContactPage from './components/ContactPage';
import MyStation from './components/MyStation';
import ContentHub from './components/ContentHub';
import LoginModal from './components/LoginModal';

interface User {
  username: string;
  passwordHash: string;
  avatarUrl?: string;
  bio?: string;
}

interface LiveNowPlaying {
    song: Song;
    show: ApiScheduleItem | null;
}

// A simple, non-secure "hash" for demonstration purposes. In a real app, use a library like bcrypt on the server.
const simpleHash = (str: string) => btoa(unescape(encodeURIComponent(str)));

const USERS_KEY = 'nam-radio-live-users';
const SESSION_KEY = 'nam-radio-live-session-username';
const FAVORITES_KEY = 'nam-radio-live-favorite-shows';
const FAVORITE_DJS_KEY = 'nam-radio-live-favorite-djs';
const REQUESTS_KEY = 'nam-radio-live-song-requests';


const App: React.FC = () => {
  // App state
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [schedule, setSchedule] = useState<ApiScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [favoriteShows, setFavoriteShows] = useState<number[]>([]);
  const [favoriteDjs, setFavoriteDjs] = useState<number[]>([]);
  const [songRequests, setSongRequests] = useState<SongRequestRecord[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>(RECENTLY_PLAYED);
  
  // Auth state
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginRedirectPath, setLoginRedirectPath] = useState<string | null>(null);

  // Live broadcast state
  const [liveNowPlaying, setLiveNowPlaying] = useState<LiveNowPlaying>({
    song: RECENTLY_PLAYED[0],
    show: null
  });

  // Check for stored data on initial load
  useEffect(() => {
    let loadedUsers: User[] = [];
    try {
      const storedUsers = localStorage.getItem(USERS_KEY);
      if (storedUsers) {
        loadedUsers = JSON.parse(storedUsers);
        setUsers(loadedUsers);
      }
    } catch (e) { console.error("Failed to parse users from localStorage", e); }

    try {
      const storedUsernameStr = localStorage.getItem(SESSION_KEY);
      if (storedUsernameStr) {
        const storedUsername = JSON.parse(storedUsernameStr);
        const sessionUser = loadedUsers.find(u => u.username === storedUsername);
        if (sessionUser) {
          setCurrentUser(sessionUser);
        } else {
          // Clean up session if user doesn't exist anymore
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch(e) { console.error("Failed to parse session user from localStorage", e); }

    try {
        const storedFavorites = localStorage.getItem(FAVORITES_KEY);
        if (storedFavorites) setFavoriteShows(JSON.parse(storedFavorites));
    } catch (e) { console.error("Failed to parse favorite shows from localStorage", e); }

    try {
        const storedFavoriteDjs = localStorage.getItem(FAVORITE_DJS_KEY);
        if (storedFavoriteDjs) setFavoriteDjs(JSON.parse(storedFavoriteDjs));
    } catch (e) { console.error("Failed to parse favorite DJs from localStorage", e); }

    try {
        const storedRequests = localStorage.getItem(REQUESTS_KEY);
        if (storedRequests) setSongRequests(JSON.parse(storedRequests));
    } catch (e) { console.error("Failed to parse song requests from localStorage", e); }

  }, []);
  
  const openLoginModal = useCallback((redirectPath?: string) => {
    if (redirectPath) setLoginRedirectPath(redirectPath);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setLoginRedirectPath(null);
  }, []);

  // Effect for routing and protecting routes
  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = window.location.hash || '#/';
      const protectedRoutes = ['#/mystation'];

      if (protectedRoutes.includes(newRoute) && !currentUser) {
        openLoginModal(newRoute);
        if (window.location.hash !== '#/') window.location.hash = '#/';
        setRoute('#/');
      } else {
        setRoute(newRoute);
      }
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, openLoginModal]);

  // Fetch schedule from AzuraCast API
  useEffect(() => {
    const fetchSchedule = async () => {
        setScheduleLoading(true);
        setScheduleError(null);
        try {
            const liveSchedule = await getSchedule();
            setSchedule(liveSchedule);
        } catch (error) {
            console.error("Failed to fetch live schedule, using fallback.", error);
            const errorMessage = error instanceof Error ? error.message : "Could not load live schedule. Displaying static data.";
            setScheduleError(errorMessage);
            setSchedule(WEEKLY_SCHEDULE); // Fallback to mock data
        } finally {
            setScheduleLoading(false);
        }
    };
    fetchSchedule();
  }, []);
  
  // Poll AzuraCast for Now Playing data
  useEffect(() => {
      const updateNowPlaying = async () => {
          const { currentSong, history } = await getNowPlaying();
          const currentShow = schedule.find(show => show.is_now) || null;
          setLiveNowPlaying({ song: currentSong, show: currentShow });
          setRecentlyPlayed(history);
      };
      
      updateNowPlaying(); // Initial call
      const interval = setInterval(updateNowPlaying, 8000); // Poll every 8 seconds
      
      return () => clearInterval(interval);
  }, [schedule]); // Rerun if schedule changes
  
  // Auth handlers
  const handleSignUp = async (username: string, password_plain: string): Promise<boolean> => {
    await new Promise(res => setTimeout(res, 500)); // Simulate latency
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return false;
    }
    const newUser: User = { username, passwordHash: simpleHash(password_plain), avatarUrl: '', bio: '' };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    
    setCurrentUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser.username));
    
    closeLoginModal();
    if (loginRedirectPath) {
      window.location.hash = loginRedirectPath;
      setLoginRedirectPath(null);
    }
    return true;
  };

  const handleLogin = async (username: string, password_plain: string): Promise<boolean> => {
    await new Promise(res => setTimeout(res, 500)); // Simulate latency
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === simpleHash(password_plain));
    if (!user) return false;

    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user.username));
    
    closeLoginModal();
    if (loginRedirectPath) {
      window.location.hash = loginRedirectPath;
      setLoginRedirectPath(null);
    }
    return true;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    if (route === '#/mystation') {
      window.location.hash = '#/';
      setRoute('#/');
    }
  };

  const handleUpdateUserProfile = (updatedProfile: { username: string; avatarUrl: string; bio: string; }) => {
    if (!currentUser) return;
    const oldUsername = currentUser.username;
    
    // Find the user in the main list to preserve the password hash
    const userToUpdate = users.find(u => u.username === oldUsername);
    if (!userToUpdate) return;
    
    const newCurrentUser: User = { ...userToUpdate, ...updatedProfile };
    
    setCurrentUser(newCurrentUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newCurrentUser.username));

    const updatedUsers = users.map(u => u.username === oldUsername ? newCurrentUser : u);
    setUsers(updatedUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  };


  const toggleFavoriteShow = useCallback((showId: number) => {
    const newFavorites = favoriteShows.includes(showId)
      ? favoriteShows.filter(id => id !== showId)
      : [...favoriteShows, showId];
    setFavoriteShows(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  }, [favoriteShows]);

  const toggleFavoriteDj = useCallback((djId: number) => {
    const newFavorites = favoriteDjs.includes(djId)
      ? favoriteDjs.filter(id => id !== djId)
      : [...favoriteDjs, djId];
    setFavoriteDjs(newFavorites);
    localStorage.setItem(FAVORITE_DJS_KEY, JSON.stringify(newFavorites));
  }, [favoriteDjs]);

  const handleAddSongRequest = useCallback((request: SongRequestRecord) => {
    const updatedRequests = [request, ...songRequests].slice(0, 10);
    setSongRequests(updatedRequests);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(updatedRequests));
  }, [songRequests]);

  const upcomingShowsToday = useMemo(() => {
    if (!schedule || schedule.length === 0) return [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    return schedule
      .filter(show => show.start.startsWith(todayStr) && new Date(show.start) > now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [schedule]);
  
  const userFavoriteShows = useMemo(() => {
      return schedule.filter(show => favoriteShows.includes(show.id));
  }, [schedule, favoriteShows]);

  const userFavoriteDjs = useMemo(() => {
      return DJS.filter(dj => favoriteDjs.includes(dj.id));
  }, [favoriteDjs]);
  
  const currentShowName = liveNowPlaying.show ? liveNowPlaying.show.name : null;

  const renderPage = () => {
    switch (route) {
      case '#/contact':
        return <ContactPage />;
      case '#/mystation':
        return currentUser ? (
          <MyStation 
            favoriteShows={userFavoriteShows} 
            favoriteDjs={userFavoriteDjs}
            onToggleFavoriteDj={toggleFavoriteDj}
            allShows={schedule} 
            onToggleFavorite={toggleFavoriteShow} 
            currentShowName={currentShowName} 
            currentUser={currentUser}
            onUpdateUserProfile={handleUpdateUserProfile}
            songRequests={songRequests}
          />
        ) : null;
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            <div className="lg:col-span-2 space-y-12">
              <NowPlaying liveNowPlaying={liveNowPlaying} recentlyPlayed={recentlyPlayed} />
              <UpcomingShows shows={upcomingShowsToday} loading={scheduleLoading} error={scheduleError} favoriteShows={favoriteShows} onToggleFavorite={toggleFavoriteShow} />
              <About />
              <Schedule schedule={schedule} loading={scheduleLoading} error={scheduleError} favoriteShows={favoriteShows} onToggleFavorite={toggleFavoriteShow} />
            </div>
            <div className="space-y-12">
              <SongRequest currentUser={currentUser} onAddSongRequest={handleAddSongRequest} />
              <LiveChat liveNowPlaying={liveNowPlaying} recentlyPlayed={recentlyPlayed} currentUser={currentUser} />
              <ContentHub />
              <Djs 
                djs={DJS} 
                currentShowName={currentShowName} 
                favoriteDjs={favoriteDjs}
                onToggleFavorite={toggleFavoriteDj}
              />
            </div>
          </div>
        );
    }
  };
  
  const bgUrl = liveNowPlaying.show?.imageUrl || 'https://picsum.photos/1920/1080?grayscale&blur=5';

  return (
    <div className="bg-slate-900 min-h-screen text-slate-200">
      <div 
        className="fixed top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{ backgroundImage: `url(${bgUrl})`, filter: 'blur(5px)', transform: 'scale(1.1)', zIndex: 0 }}
      />
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900/80 to-slate-900" style={{ zIndex: 1 }} />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          isLoggedIn={!!currentUser}
          currentUser={currentUser}
          currentShowName={currentShowName}
          onLoginClick={openLoginModal}
          onLogout={handleLogout}
        />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {renderPage()}
        </main>
        <Footer />
      </div>
      <ScrollToTopButton />
      {isLoginModalOpen && (
        <LoginModal
          onClose={closeLoginModal}
          onLogin={handleLogin}
          onSignUp={handleSignUp}
        />
      )}
    </div>
  );
};

export default App;