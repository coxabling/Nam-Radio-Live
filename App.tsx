
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
// FIX: Import `getLocalMusicEvents` to resolve reference error.
import { getLocalMusicEvents, getLocalMusicHotspots, generateListenerQuests, generateShowRecommendation, generateTtsAudio } from './services/geminiService';
import { ApiScheduleItem, Song, SongRequestRecord, Vibe, VibeType, ListeningStats, Badge, DedicationRecord, MusicEvent, SongRating, LevelUpMessage, LiveNowPlaying, Quest, QuestType, QuestStatus, MusicHotspot, AudioDedicationMessage } from './types';
import LiveChat from './components/LiveChat';
import Contact from './components/Contact';
import MyStation, { BADGES, LISTENER_LEVELS } from './components/MyStation';
import ContentHub from './components/ContentHub';
import LoginModal from './components/LoginModal';
import Toast from './components/Toast';
import AdminDashboard from './components/AdminDashboard';
import InstallPwaButton from './components/InstallPwaButton';
import CommunityCountdown from './components/CommunityCountdown';
import StationChart from './components/StationChart';
import RecommendationModal from './components/RecommendationModal';
import GoldenHourBanner from './components/GoldenHourBanner';

interface User {
  username: string;
  passwordHash: string;
  avatarUrl?: string;
  bio?: string;
}

interface LevelUpInfo {
    username: string;
    levelName: string;
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
const LAST_MONTH_STATS_KEY = 'nam-radio-live-last-month-stats';
const DAILY_REWIND_DATA_KEY = 'nam-radio-daily-rewind-data';
const QUESTS_KEY = 'nam-radio-live-quests';
const WEEKLY_RESET_KEY = 'nam-radio-live-weekly-reset';


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
  showPoints: {},
  hasListenedPostMidnight: false,
  chatMessagesSent: 0,
  votesCast: 0,
  points: 0,
  likedSongs: [],
  dislikedSongs: [],
  listeningTimeByHour: {},
};

const DEFAULT_BG_URL = 'https://picsum.photos/1920/1080?grayscale&blur=5';

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
  const [latestDedication, setLatestDedication] = useState<DedicationRecord | null>(null);
  const [latestAudioDedication, setLatestAudioDedication] = useState<Omit<AudioDedicationMessage, 'id' | 'author' | 'isDj'> | null>(null);
  const [events, setEvents] = useState<MusicEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [musicHotspots, setMusicHotspots] = useState<MusicHotspot[]>([]);
  const [isHotspotsLoading, setIsHotspotsLoading] = useState(true);
  const [hotspotsError, setHotspotsError] = useState<string | null>(null);
  
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
  const [lastMonthListeningStats, setLastMonthListeningStats] = useState<ListeningStats | null>(null);
  const [dailyShowsListened, setDailyShowsListened] = useState<string[]>([]);
  
  // Gamification UI State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const earnedBadgesRef = useRef<Set<string>>(new Set());
  const [latestLevelUp, setLatestLevelUp] = useState<LevelUpInfo | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [showRecommendation, setShowRecommendation] = useState<{ show: ApiScheduleItem; reason: string } | null>(null);
  const [goldenHour, setGoldenHour] = useState({ isActive: false, multiplier: 1, endTime: 0 });

  // PWA Install state
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Background state
  const [bgUrls, setBgUrls] = useState<[string, string]>([DEFAULT_BG_URL, '']);
  const [activeBgIndex, setActiveBgIndex] = useState(0);

  // Live broadcast state
  const [liveNowPlaying, setLiveNowPlaying] = useState<LiveNowPlaying>({
    song: { title: 'Loading...', artist: 'Connecting to server...', artUrl: '' },
    show: null
  });
  const [nowPlayingError, setNowPlayingError] = useState<string | null>(null);

  const isAdmin = useMemo(() => {
    return currentUser?.username.toLowerCase() === 'admin';
  }, [currentUser]);

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
        // Special case for admin who might not be in the regular user list
        if (storedUsername.toLowerCase() === 'admin') {
            setCurrentUser({ username: 'admin', passwordHash: ''});
        } else {
            const sessionUser = loadedUsers.find(u => u.username === storedUsername);
            if (sessionUser) {
                setCurrentUser(sessionUser);
            } else {
                // Clean up session if user doesn't exist anymore
                localStorage.removeItem(SESSION_KEY);
            }
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
        const storedLastMonthStats = localStorage.getItem(LAST_MONTH_STATS_KEY);
        if (storedLastMonthStats) {
            setLastMonthListeningStats(JSON.parse(storedLastMonthStats));
        }
    } catch (e) { console.error("Failed to parse last month listening stats from localStorage", e); }

    try {
        const storedStats = localStorage.getItem(LISTENING_STATS_KEY);
        if (storedStats) {
            const loadedStats: ListeningStats = JSON.parse(storedStats);
            const lastUpdatedDate = new Date(loadedStats.lastUpdated);
            const today = new Date();

            // Check for weekly reset
            const storedWeeklyReset = localStorage.getItem(WEEKLY_RESET_KEY);
            if (storedWeeklyReset) {
              const lastResetDate = new Date(storedWeeklyReset);
              const oneWeek = 7 * 24 * 60 * 60 * 1000;
              if (today.getTime() - lastResetDate.getTime() > oneWeek) {
                loadedStats.showPoints = {};
                localStorage.setItem(WEEKLY_RESET_KEY, today.toISOString());
              }
            } else {
              localStorage.setItem(WEEKLY_RESET_KEY, today.toISOString());
            }

            // Check for monthly reset
            if (lastUpdatedDate.getMonth() !== today.getMonth() || lastUpdatedDate.getFullYear() !== today.getFullYear()) {
                // The month has rolled over. The current stats become last month's story.
                const storyStats: ListeningStats = { ...loadedStats };
                setLastMonthListeningStats(storyStats);
                localStorage.setItem(LAST_MONTH_STATS_KEY, JSON.stringify(storyStats));
                
                // Reset the current stats for the new month.
                // We keep cumulative stats like total time and points.
                const newCurrentStats: ListeningStats = {
                    ...initialListeningStats,
                    totalListeningTime: loadedStats.totalListeningTime,
                    points: loadedStats.points,
                    likedSongs: loadedStats.likedSongs, // Keep liked/disliked songs across months
                    dislikedSongs: loadedStats.dislikedSongs,
                    lastUpdated: today.toISOString(),
                };
                setListeningStats(newCurrentStats);
                // The new stats will be saved to localStorage by the periodic saver effect.
            } else {
                // Business as usual, just load the stats for the current month.
                // Ensure new stats properties exist for backward compatibility.
                if (!loadedStats.chatMessagesSent) loadedStats.chatMessagesSent = 0;
                if (!loadedStats.votesCast) loadedStats.votesCast = 0;
                if (!loadedStats.points) loadedStats.points = 0;
                if (!loadedStats.likedSongs) loadedStats.likedSongs = [];
                if (!loadedStats.dislikedSongs) loadedStats.dislikedSongs = [];
                if (!loadedStats.listeningTimeByHour) loadedStats.listeningTimeByHour = {};
                if (!loadedStats.showPoints) loadedStats.showPoints = {};
                setListeningStats(loadedStats);
            }
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
    } catch (e) { console.error("Failed to parse daily rewind data from localStorage", e); }
    
    // Fetch events once on app load
    const loadEvents = async () => {
      setIsEventsLoading(true);
      setEventsError(null);
      try {
        const fetchedEvents = await getLocalMusicEvents();
        setEvents(fetchedEvents);
      } catch (error: any) {
        setEventsError(error.message || 'Failed to load local events.');
      } finally {
        setIsEventsLoading(false);
      }
    };
    loadEvents();

    const loadHotspots = async () => {
      setIsHotspotsLoading(true);
      setHotspotsError(null);
      try {
        const fetchedHotspots = await getLocalMusicHotspots();
        setMusicHotspots(fetchedHotspots);
      } catch (error: any) {
        setHotspotsError(error.message || 'Failed to load local hotspots.');
      } finally {
        setIsHotspotsLoading(false);
      }
    };
    loadHotspots();
  }, []);

  // Effect to load or generate quests when user logs in
  useEffect(() => {
    const loadOrGenerateQuests = async () => {
        if (!currentUser) {
            setQuests([]); // Clear quests on logout
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        try {
            const storedQuestsData = localStorage.getItem(QUESTS_KEY);
            if (storedQuestsData) {
                const { date, quests: storedQuests } = JSON.parse(storedQuestsData);
                if (date === todayStr) {
                    setQuests(storedQuests);
                    return; // Quests are up to date
                }
            }
        } catch (e) { console.error("Failed to parse quests from localStorage", e); }
        
        // If we reach here, we need to generate new quests
        try {
            const newQuestTemplates = await generateListenerQuests();
            const newQuests: Quest[] = newQuestTemplates.map(q => ({
                ...q,
                progress: 0,
                status: 'in_progress',
            }));
            setQuests(newQuests);
            localStorage.setItem(QUESTS_KEY, JSON.stringify({ date: todayStr, quests: newQuests }));
        } catch (error) {
            console.error("Failed to generate listener quests:", error);
        }
    };

    loadOrGenerateQuests();
  }, [currentUser]);
  
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

      // Check regular protected routes first
      if (protectedRoutes.includes(newRoute) && !currentUser) {
          openLoginModal(newRoute);
          if (window.location.hash !== '#/') window.location.hash = '#/';
          setRoute('#/');
          return;
      }

      // Check admin route
      if (newRoute === '#/admin' && !isAdmin) {
          // If a non-admin tries to access, redirect to home.
          window.location.hash = '#/';
          setRoute('#/');
          return;
      }

      setRoute(newRoute);
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, openLoginModal, isAdmin]);

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

        setRecentlyPlayed(history);

        setSchedule(currentSchedule => {
          const currentShow = currentSchedule.find(s => s.name === showName) || null;
          
          // Update song and show state together to avoid race conditions
          setLiveNowPlaying({ song: currentSong, show: currentShow });

          if (currentSchedule.length === 0) return [];

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
  
  // Effect for smooth background transitions
  useEffect(() => {
    const newUrl = liveNowPlaying.song.artUrl || liveNowPlaying.show?.imageUrl || DEFAULT_BG_URL;
    const currentUrl = bgUrls[activeBgIndex];

    if (newUrl !== currentUrl) {
        const nextIndex = (activeBgIndex + 1) % 2;
        
        setBgUrls(prevUrls => {
            const newUrls = [...prevUrls] as [string, string];
            newUrls[nextIndex] = newUrl;
            return newUrls;
        });
        setActiveBgIndex(nextIndex);
    }
  }, [liveNowPlaying.song.artUrl, liveNowPlaying.show, activeBgIndex, bgUrls]);


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
  
  // Golden Hour check
  useEffect(() => {
    const interval = setInterval(() => {
      setGoldenHour(prev => {
        if (prev.isActive && Date.now() > prev.endTime) {
          return { isActive: false, multiplier: 1, endTime: 0 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartGoldenHour = useCallback((multiplier: number) => {
    const endTime = Date.now() + 60 * 60 * 1000;
    setGoldenHour({ isActive: true, multiplier, endTime });
    sessionStorage.setItem('nam-radio-golden-hour', JSON.stringify({ isActive: true, multiplier, endTime }));
  }, []);
  
  const awardPoints = useCallback((basePoints: number) => {
    if (!currentUser) return;

    const multiplier = goldenHour.isActive ? goldenHour.multiplier : 1;
    const finalPoints = basePoints * multiplier;

    setListeningStats(prevStats => {
      const oldPoints = prevStats.points || 0;
      const newPoints = oldPoints + finalPoints;

      const newStats: ListeningStats = {
        ...prevStats,
        points: newPoints,
      };

      if (liveNowPlaying.show?.name) {
        const showName = liveNowPlaying.show.name;
        const newShowPoints = { ...(newStats.showPoints || {}) };
        newShowPoints[showName] = (newShowPoints[showName] || 0) + finalPoints;
        newStats.showPoints = newShowPoints;
      }

      // Level Up Check
      const oldLevel = [...LISTENER_LEVELS].reverse().find(l => oldPoints >= l.minPoints);
      const newLevel = [...LISTENER_LEVELS].reverse().find(l => newPoints >= l.minPoints);
      if (newLevel && oldLevel && newLevel.name !== oldLevel.name) {
        setLatestLevelUp({ username: currentUser.username, levelName: newLevel.name });
      }

      return newStats;
    });
  }, [goldenHour.isActive, goldenHour.multiplier, liveNowPlaying.show, currentUser]);

  const handleQuestProgress = useCallback((type: QuestType, value: number = 1) => {
    if (!currentUser) return;

    setQuests(prevQuests => {
        if (!prevQuests || prevQuests.length === 0) return [];

        const newQuests = prevQuests.map(quest => {
            if (quest.type === type && quest.status === 'in_progress') {
                const newProgress = Math.min(quest.target, quest.progress + value);
                
                if (newProgress >= quest.target && quest.status !== 'completed') {
                    awardPoints(quest.reward);
                    setToastMessage(`Quest Complete: ${quest.description} (+${quest.reward} points)`);
                    return { ...quest, progress: newProgress, status: 'completed' as QuestStatus };
                }
                return { ...quest, progress: newProgress };
            }
            return quest;
        });

        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem(QUESTS_KEY, JSON.stringify({ date: todayStr, quests: newQuests }));
        return newQuests;
    });
  }, [currentUser, awardPoints]);
  
  // Listening Stats Tracking & Badge/Quest Checking
  useEffect(() => {
    const trackingInterval = 5000; // 5 seconds
    const interval = setInterval(() => {
      if (!document.hidden && currentUser) { // Only track if the tab is visible and user is logged in
        handleQuestProgress('listen_time', (trackingInterval / 1000) / 60); // value is in minutes

        setListeningStats(prevStats => {
          const now = new Date();
          const currentHour = now.getHours();
          
          // Award points for listening
          const pointsPer5Min = 2;
          const secondsPerInterval = trackingInterval / 1000;
          const intervalsPer5Min = (5 * 60) / secondsPerInterval;
          const basePointsForInterval = pointsPer5Min / intervalsPer5Min;
          const multiplier = goldenHour.isActive ? goldenHour.multiplier : 1;
          const finalPointsForInterval = basePointsForInterval * multiplier;

          const oldPoints = prevStats.points || 0;
          const newPoints = oldPoints + finalPointsForInterval;
          
          const newStats: ListeningStats = {
            ...prevStats,
            totalListeningTime: prevStats.totalListeningTime + (trackingInterval / 1000),
            monthlyListeningTime: prevStats.monthlyListeningTime + (trackingInterval / 1000),
            lastUpdated: now.toISOString(),
            points: newPoints,
          };
          
          const newTimeByHour = { ...prevStats.listeningTimeByHour };
          const secondsToAdd = trackingInterval / 1000;
          newTimeByHour[currentHour] = (newTimeByHour[currentHour] || 0) + secondsToAdd;
          newStats.listeningTimeByHour = newTimeByHour;

          // Level Up Check
          const oldLevel = [...LISTENER_LEVELS].reverse().find(l => oldPoints >= l.minPoints);
          const newLevel = [...LISTENER_LEVELS].reverse().find(l => newPoints >= l.minPoints);
          if (newLevel && oldLevel && newLevel.name !== oldLevel.name) {
            setLatestLevelUp({ username: currentUser.username, levelName: newLevel.name });
          }

          if (liveNowPlaying.show?.name) {
            const showName = liveNowPlaying.show.name;
            newStats.showListeningTime[showName] = (newStats.showListeningTime[showName] || 0) + (trackingInterval / 1000);

            const newShowPoints = { ...(newStats.showPoints || {}) };
            newShowPoints[showName] = (newShowPoints[showName] || 0) + finalPointsForInterval;
            newStats.showPoints = newShowPoints;

            setDailyShowsListened(prevShows => {
                if (!prevShows.includes(showName)) {
                    return [...prevShows, showName];
                }
                return prevShows;
            });
          }

          if (currentHour >= 0 && currentHour < 5 && !newStats.hasListenedPostMidnight) {
            newStats.hasListenedPostMidnight = true;
          }
          
          return newStats;
        });
      }
    }, trackingInterval);

    return () => clearInterval(interval);
  }, [liveNowPlaying.show, currentUser, handleQuestProgress, goldenHour]);

  // Check for new badges
  useEffect(() => {
    if (!currentUser) return;
  
    const currentlyEarned = new Set<string>();
    BADGES.forEach(badge => {
      if (badge.isEarned(listeningStats, songRequests)) {
        currentlyEarned.add(badge.id);
      }
    });
  
    const previouslyEarned = earnedBadgesRef.current;
    
    if (previouslyEarned.size < currentlyEarned.size) {
      const newBadge = [...currentlyEarned].find(id => !previouslyEarned.has(id));
      if (newBadge) {
        const badgeData = BADGES.find(b => b.id === newBadge);
        if (badgeData) {
          setToastMessage(`You've unlocked the "${badgeData.name}" badge!`);
        }
      }
    }
  
    earnedBadgesRef.current = currentlyEarned;
  
  }, [listeningStats, songRequests, currentUser]);

  // PWA Install prompt listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Effect to clear toast message
  useEffect(() => {
    if (toastMessage) {
        const timer = setTimeout(() => {
            setToastMessage(null);
        }, 5000);
        return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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

    // Special case for admin login
    if (username.toLowerCase() === 'admin' && password_plain === 'admin') {
        const adminUser: User = { username: 'admin', passwordHash: simpleHash('admin') };
        setCurrentUser(adminUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser.username));
        closeLoginModal();
        if (loginRedirectPath) {
            window.location.hash = loginRedirectPath;
            setLoginRedirectPath(null);
        }
        return true;
    }

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
    const protectedRoutes = ['#/mystation', '#/admin'];
    if (protectedRoutes.includes(route)) {
      window.location.hash = '#/';
      setRoute('#/');
    }
  };

  const handleUpdateUserProfile = (updatedProfile: { username: string; avatarUrl: string; bio: string; }) => {
    if (!currentUser) return;
    const oldUsername = currentUser.username;
    
    const userToUpdate = users.find(u => u.username === oldUsername);
    if (!userToUpdate) return;
    
    const newCurrentUser: User = { ...userToUpdate, ...updatedProfile };
    
    setCurrentUser(newCurrentUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newCurrentUser.username));

    const updatedUsers = users.map(u => u.username === oldUsername ? newCurrentUser : u);
    setUsers(updatedUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  };

  const toggleFavoriteShow = useCallback(async (showId: number) => {
    const isAdding = !favoriteShows.includes(showId);

    const newFavorites = isAdding
      ? [...favoriteShows, showId]
      : favoriteShows.filter(id => id !== showId);
    setFavoriteShows(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));

    if (isAdding && currentUser) {
      const favoritedShow = schedule.find(s => s.id === showId);
      if (!favoritedShow) return;

      const candidateShows = schedule.filter(s => !newFavorites.includes(s.id));
      if (candidateShows.length === 0) return;

      try {
        const { recommendedShowName, reason } = await generateShowRecommendation(favoritedShow, candidateShows);
        const recommendedShow = schedule.find(s => s.name === recommendedShowName);
        if (recommendedShow) {
          setShowRecommendation({ show: recommendedShow, reason });
        }
      } catch (error) {
        console.error("Failed to generate show recommendation:", error);
      }
    }
  }, [favoriteShows, schedule, currentUser]);

  const toggleFavoriteDj = useCallback((djId: number) => {
    const newFavorites = favoriteDjs.includes(djId)
      ? favoriteDjs.filter(id => id !== djId)
      : [...favoriteDjs, djId];
    setFavoriteDjs(newFavorites);
    localStorage.setItem(FAVORITE_DJS_KEY, JSON.stringify(newFavorites));
  }, [favoriteDjs]);

  const handleAddSongRequest = useCallback((request: SongRequestRecord) => {
    awardPoints(50);
    const updatedRequests = [request, ...songRequests].slice(0, 10);
    setSongRequests(updatedRequests);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(updatedRequests));
    handleQuestProgress('request_song');
  }, [songRequests, handleQuestProgress, awardPoints]);

  const handleAddDedication = useCallback((dedication: DedicationRecord) => {
    awardPoints(75);
    setLatestDedication(dedication);
    setTimeout(() => setLatestDedication(null), 60000); 
  }, [awardPoints]);

  const handleAddAudioDedication = useCallback(async (dedication: DedicationRecord) => {
    if (!currentUser) return;
    awardPoints(-150); // Deduct points
    try {
        const audioData = await generateTtsAudio(dedication.message);
        const audioMessage: Omit<AudioDedicationMessage, 'id' | 'author' | 'isDj'> = {
            type: 'audio_dedication',
            recipientInfo: { to: dedication.to, from: currentUser.username },
            song: dedication.song,
            message: dedication.message,
            audioData: audioData,
        };
        setLatestAudioDedication(audioMessage);
        // Clear after a short delay to allow chat to pick it up
        setTimeout(() => setLatestAudioDedication(null), 1000);
    } catch (error) {
        console.error("Failed to create audio dedication:", error);
        setToastMessage("Sorry, couldn't voice your dedication right now.");
        awardPoints(150); // Refund points on error
    }
  }, [currentUser, awardPoints]);

  const handleVibeVote = useCallback((vibeType: VibeType) => {
    if (userVibe) return;
    setUserVibe(vibeType);
    localStorage.setItem(VIBE_KEY, vibeType);
    setVibes(currentVibes => currentVibes.map(v => v.type === vibeType ? { ...v, count: v.count + 1 } : v));
  }, [userVibe]);

  const handleChatMessageSent = useCallback(() => {
    awardPoints(5);
    setListeningStats(prev => ({...prev, chatMessagesSent: (prev.chatMessagesSent || 0) + 1}));
    handleQuestProgress('send_chat_messages');
  }, [awardPoints, handleQuestProgress]);

  const handleVoteCast = useCallback(() => {
    awardPoints(10);
    setListeningStats(prev => ({...prev, votesCast: (prev.votesCast || 0) + 1}));
    handleQuestProgress('cast_votes');
  }, [awardPoints, handleQuestProgress]);

  const handleGameWon = useCallback(() => {
    awardPoints(100);
  }, [awardPoints]);

  const handleSongRating = useCallback((song: Song, rating: 'like' | 'dislike') => {
    if (!currentUser) return;
    const songId = `${song.title} - ${song.artist}`;
    
    setListeningStats(prev => {
      const newStats: ListeningStats = { ...prev, likedSongs: [...prev.likedSongs], dislikedSongs: [...prev.dislikedSongs] };
      const likedIndex = newStats.likedSongs.findIndex(s => s.id === songId);
      const dislikedIndex = newStats.dislikedSongs.findIndex(s => s.id === songId);
      let pointsAwarded = false;
      const isFirstTimeRating = likedIndex === -1 && dislikedIndex === -1;

      if (likedIndex > -1) newStats.likedSongs.splice(likedIndex, 1);
      if (dislikedIndex > -1) newStats.dislikedSongs.splice(dislikedIndex, 1);
      
      if (rating === 'like' && likedIndex === -1) {
        newStats.likedSongs.push({ id: songId, timestamp: Date.now() });
        if (isFirstTimeRating) pointsAwarded = true;
      } else if (rating === 'dislike' && dislikedIndex === -1) {
        newStats.dislikedSongs.push({ id: songId, timestamp: Date.now() });
        if (isFirstTimeRating) pointsAwarded = true;
      }
      
      if (pointsAwarded) {
        awardPoints(15);
        handleQuestProgress('rate_song');
      }
      return newStats;
    });
  }, [currentUser, handleQuestProgress, awardPoints]);


  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      setInstallPrompt(null);
    });
  };

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
        return <Contact />;
      case '#/admin':
        return isAdmin ? <AdminDashboard /> : null;
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
            lastMonthListeningStats={lastMonthListeningStats}
            dailyShowsListened={dailyShowsListened}
            liveNowPlaying={liveNowPlaying}
            quests={quests}
          />
        ) : null;
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            <div className="lg:col-span-2 space-y-12">
              <NowPlaying 
                liveNowPlaying={liveNowPlaying} 
                recentlyPlayed={recentlyPlayed} 
                vibes={vibes} 
                userVibe={userVibe} 
                onVibeVote={handleVibeVote} 
                nowPlayingError={nowPlayingError}
                likedSongs={listeningStats.likedSongs}
                dislikedSongs={listeningStats.dislikedSongs}
                onSongRating={handleSongRating}
                isLoggedIn={!!currentUser}
              />
              <UpcomingShows shows={upcomingShowsToday} loading={scheduleLoading} error={scheduleError} favoriteShows={favoriteShows} onToggleFavorite={toggleFavoriteShow} />
              <CommunityCountdown likedSongs={listeningStats.likedSongs} />
              <StationChart 
                onSongRating={handleSongRating}
                likedSongs={listeningStats.likedSongs}
                isLoggedIn={!!currentUser}
              />
              <About />
              <Schedule 
                schedule={schedule} 
                loading={scheduleLoading} 
                error={scheduleError} 
                favoriteShows={favoriteShows} 
                onToggleFavorite={toggleFavoriteShow}
                songRequests={songRequests}
                listeningStats={listeningStats}
              />
            </div>
            <div className="space-y-12">
              <SongRequest 
                currentUser={currentUser} 
                onAddSongRequest={handleAddSongRequest} 
                onAddDedication={handleAddDedication}
                onAddAudioDedication={handleAddAudioDedication}
                points={listeningStats.points}
              />
              <LiveChat 
                liveNowPlaying={liveNowPlaying} 
                recentlyPlayed={recentlyPlayed} 
                currentUser={currentUser} 
                dominantVibe={dominantVibe} 
                onChatMessageSent={handleChatMessageSent} 
                onVoteCast={handleVoteCast} 
                onGameWon={handleGameWon}
                latestDedication={latestDedication} 
                latestAudioDedication={latestAudioDedication}
                events={events}
                schedule={schedule}
                userFavoriteShows={userFavoriteShows}
                songRequests={songRequests}
                listeningStats={listeningStats}
                latestLevelUp={latestLevelUp}
                onStartGoldenHour={handleStartGoldenHour}
              />
              <ContentHub 
                events={events}
                isEventsLoading={isEventsLoading}
                eventsError={eventsError}
                musicHotspots={musicHotspots}
                isHotspotsLoading={isHotspotsLoading}
                hotspotsError={hotspotsError}
              />
              <Djs 
                djs={DJS} 
                schedule={schedule}
                currentShowName={currentShowName} 
                favoriteDjs={favoriteDjs}
                onToggleFavorite={toggleFavoriteDj}
              />
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="bg-slate-900 min-h-screen text-slate-200">
        {bgUrls.map((url, index) => (
            url && (
                <div 
                    key={index}
                    className="fixed top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
                    style={{ 
                        backgroundImage: `url(${url})`, 
                        filter: 'blur(5px)', 
                        transform: 'scale(1.1)', 
                        zIndex: 0,
                        opacity: index === activeBgIndex ? 1 : 0
                    }}
                />
            )
        ))}
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900/80 to-slate-900" style={{ zIndex: 1 }} />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          isLoggedIn={!!currentUser}
          currentUser={currentUser}
          currentShowName={currentShowName}
          onLoginClick={openLoginModal}
          onLogout={handleLogout}
          isAdmin={isAdmin}
        />
        {goldenHour.isActive && <GoldenHourBanner endTime={goldenHour.endTime} multiplier={goldenHour.multiplier} />}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {renderPage()}
        </main>
        <Footer />
      </div>
      <ScrollToTopButton />
      <InstallPwaButton onInstallClick={handleInstallClick} isVisible={!!installPrompt} />
      {isLoginModalOpen && (
        <LoginModal
          onClose={closeLoginModal}
          onLogin={handleLogin}
          onSignUp={handleSignUp}
        />
      )}
      {showRecommendation && (
        <RecommendationModal
          recommendation={showRecommendation}
          onClose={() => setShowRecommendation(null)}
        />
      )}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
};

export default App;