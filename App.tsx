import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import NowPlaying from './components/NowPlaying';
import SongRequest from './components/SongRequest';
import Schedule from './components/Schedule';
import Djs from './components/Djs';
import Footer from './components/Footer';
import { DJS } from './constants';
import { getSchedule, getNowPlaying } from './services/azuracastService';
import UpcomingShows from './components/UpcomingShows';
import ScrollToTopButton from './components/ScrollToTopButton';
import About from './components/About';
import { ApiScheduleItem, Song, SongRequestRecord, Vibe, VibeType, ListeningStats } from './types';
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
const VIBE_KEY = 'nam-radio-live-user-vibe';
const LISTENING_STATS_KEY = 'nam-radio-live-listening-stats';
const DAILY_REWIND_DATA_KEY = 'nam-radio-daily-rewind-data';

const initialVibes: Vibe[] = [
    { type: 'hype', emoji: '🔥', label: 'Hype', count: 25 },
    { type: 'chill', emoji: '🧊', label: 'Chill', count: 30 },
    { type: 'focus', emoji: '🧠', label: 'Focus', count: 15 },
    { type: 'party', emoji: '🎉', label: 'Party', count: 20 },
];

const initialListeningStats: ListeningStats = {
  totalListeningTime: 0,
  monthlyListeningTime: 0,
  lastUpdated: new Date().toISOString(),
  showListeningTime: {},
  hasListenedPostMidnight: false,
};

const App: React.FC = () => {
  // App state
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [schedule, setSchedule] = useState<ApiScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [favoriteShows, setFavoriteShows] = useState<number[]>([]);
  const [favoriteDjs, setFavoriteDjs] = useState<number[]>([]);
  const [songRequests, setSongRequests] = useState<SongRequestRecord[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  
  // Auth state
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginRedirectPath, setLoginRedirectPath] = useState<string | null>(null);

  // Vibe state
  const [vibes, setVibes] = useState<Vibe[]>(initialVibes);
  const [userVibe, setUserVibe] = useState<VibeType | null>(null);

  // Stats State
  const [listeningStats, setListeningStats] = useState<ListeningStats>(initialListeningStats);
  const [dailyShowsListened, setDailyShowsListened] = useState<string[]>([]);


  // Live broadcast state
  const [liveNowPlaying, setLiveNowPlaying] = useState<LiveNowPlaying>({
    song: { title: 'Loading...', artist: 'Connecting to server...' },
    show: null
  });
  const [nowPlayingError, setNowPlayingError] = useState<string | null>(null);

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
    
    try {
        const storedStats = localStorage.getItem(LISTENING_STATS_KEY);
        if (storedStats) {
            const loadedStats: ListeningStats = JSON.parse(storedStats);
            // Check for monthly reset
            const lastUpdatedDate = new Date(loadedStats.lastUpdated);
            const today = new Date();
            if (lastUpdatedDate.getMonth() !== today.getMonth() || lastUpdatedDate.getFullYear() !== today.getFullYear()) {
                loadedStats.monthlyListeningTime = 0;
                loadedStats.lastUpdated = today.toISOString();
            }
            setListeningStats(loadedStats);
        }
    } catch (e) { console.error("Failed to parse listening stats from localStorage", e); }

    try {
      const storedRewindData = localStorage.getItem(DAILY_REWIND_DATA_KEY);
      const todayStr = new Date().toISOString().split('T')[0];
      if (storedRewindData) {
          const data = JSON.parse(storedRewindData);
          if (data.date === todayStr) {
              setDailyShowsListened(data.shows);
          } else {
              // New day, reset
              localStorage.setItem(DAILY_REWIND_DATA_KEY, JSON.stringify({ date: todayStr, shows: [] }));
          }
      } else {
          localStorage.setItem(DAILY_REWIND_DATA_KEY, JSON.stringify({ date: todayStr, shows: [] }));
      }
    } catch (e) { console.error("Failed to parse daily rewind data", e); }

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

  // Fetch schedule from API
  useEffect(() => {
    const fetchSchedule = async () => {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const liveSchedule = await getSchedule();
        setSchedule(liveSchedule);
      } catch (e: any) {
        setScheduleError(e.message || "An unexpected error occurred while loading the schedule.");
      } finally {
        setScheduleLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  // Poll for live broadcast data
  useEffect(() => {
    const pollNowPlaying = async () => {
      try {
        const { currentSong, history, showName } = await getNowPlaying();

        setLiveNowPlaying(prev => ({ ...prev, song: currentSong }));
        setRecentlyPlayed(history);

        setSchedule(currentSchedule => {
          if (currentSchedule.length === 0) return [];

          const currentShow = currentSchedule.find(s => s.name === showName) || null;
          setLiveNowPlaying(prev => ({ ...prev, show: currentShow }));

          const needsUpdate = currentSchedule.some(s => s.is_now !== (s.name === showName));
          if (needsUpdate) {
            return currentSchedule.map(s => ({ ...s, is_now: s.name === showName }));
          }
          return currentSchedule;
        });
        setNowPlayingError(null); // Clear error on success
      } catch (error) {
        console.error("Error polling now playing data:", error);
      }
    };

    pollNowPlaying(); // Initial fetch
    const interval = setInterval(pollNowPlaying, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, []);


  // Vibe feature logic
   useEffect(() => {
    // Load user's vote from local storage
    const storedVibe = localStorage.getItem(VIBE_KEY) as VibeType | null;
    if (storedVibe) {
      setUserVibe(storedVibe);
    }

    // Simulate collective vibe changes
    const vibeInterval = setInterval(() => {
      setVibes(currentVibes => {
        const newVibes = [...currentVibes];
        // Randomly increment a vibe
        const vibeToIncrementIndex = Math.floor(Math.random() * newVibes.length);
        newVibes[vibeToIncrementIndex].count += Math.floor(Math.random() * 3) + 1;

        // Sometimes, decrement another vibe
        if (Math.random() > 0.6) {
          const vibeToDecrementIndex = Math.floor(Math.random() * newVibes.length);
          if (vibeToDecrementIndex !== vibeToIncrementIndex) {
            newVibes[vibeToDecrementIndex].count = Math.max(0, newVibes[vibeToDecrementIndex].count - 1);
          }
        }
        return newVibes;
      });
    }, 4000); // Update every 4 seconds

    return () => clearInterval(vibeInterval);
  }, []);
  
  // Listening Stats Tracking
  useEffect(() => {
    const trackingInterval = 5000; // 5 seconds
    const interval = setInterval(() => {
      if (!document.hidden && currentUser) { // Only track if the tab is visible and user is logged in
        setListeningStats(prevStats => {
          const now = new Date();
          const currentHour = now.getHours();
          
          const newStats: ListeningStats = {
            ...prevStats,
            totalListeningTime: prevStats.totalListeningTime + (trackingInterval / 1000),
            monthlyListeningTime: prevStats.monthlyListeningTime + (trackingInterval / 1000),
            lastUpdated: now.toISOString(),
          };

          if (liveNowPlaying.show?.name) {
            const showName = liveNowPlaying.show.name;
            newStats.showListeningTime[showName] = (newStats.showListeningTime[showName] || 0) + (trackingInterval / 1000);

            setDailyShowsListened(prevShows => {
                if (!prevShows.includes(showName)) {
                    return [...prevShows, showName];
                }
                return prevShows;
            });
          }

          // Night Owl badge check
          if (currentHour >= 0 && currentHour < 5 && !newStats.hasListenedPostMidnight) {
            newStats.hasListenedPostMidnight = true;
          }
          
          return newStats;
        });
      }
    }, trackingInterval);

    return () => clearInterval(interval);
  }, [liveNowPlaying.show, currentUser]);

  // Save listening stats to localStorage periodically
  useEffect(() => {
    if (!currentUser) return; // Don't save for guests

    const saveTimer = setTimeout(() => {
      localStorage.setItem(LISTENING_STATS_KEY, JSON.stringify(listeningStats));
    }, 10000); // Save every 10 seconds of activity to avoid constant writes
    
    return () => clearTimeout(saveTimer);
  }, [listeningStats, currentUser]);

  // Save daily rewind data to localStorage periodically
  useEffect(() => {
    if (!currentUser) return;
    
    const saveTimer = setTimeout(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem(DAILY_REWIND_DATA_KEY, JSON.stringify({ date: todayStr, shows: dailyShowsListened }));
    }, 15000);
    
    return () => clearTimeout(saveTimer);
  }, [dailyShowsListened, currentUser]);
  
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

  const handleVibeVote = useCallback((vibeType: VibeType) => {
    if (userVibe) return; // a user can only vote once per session
    
    setUserVibe(vibeType);
    localStorage.setItem(VIBE_KEY, vibeType);

    setVibes(currentVibes => 
        currentVibes.map(v => 
            v.type === vibeType ? { ...v, count: v.count + 1 } : v
        )
    );
  }, [userVibe]);

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

  const dominantVibe = useMemo(() => {
    if (!vibes || vibes.length === 0) return null;
    return [...vibes].sort((a, b) => b.count - a.count)[0];
  }, [vibes]);
  
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
            listeningStats={listeningStats}
            dailyShowsListened={dailyShowsListened}
          />
        ) : null;
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            <div className="lg:col-span-2 space-y-12">
              <NowPlaying liveNowPlaying={liveNowPlaying} recentlyPlayed={recentlyPlayed} vibes={vibes} userVibe={userVibe} onVibeVote={handleVibeVote} nowPlayingError={nowPlayingError} />
              <UpcomingShows shows={upcomingShowsToday} loading={scheduleLoading} error={scheduleError} favoriteShows={favoriteShows} onToggleFavorite={toggleFavoriteShow} />
              <About />
              <Schedule schedule={schedule} loading={scheduleLoading} error={scheduleError} favoriteShows={favoriteShows} onToggleFavorite={toggleFavoriteShow} />
            </div>
            <div className="space-y-12">
              <SongRequest currentUser={currentUser} onAddSongRequest={handleAddSongRequest} />
              <LiveChat liveNowPlaying={liveNowPlaying} recentlyPlayed={recentlyPlayed} currentUser={currentUser} dominantVibe={dominantVibe} />
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
