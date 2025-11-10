import React, { useState, useEffect, useMemo } from 'react';
import { Dj, ApiScheduleItem, SongRequestRecord, ListeningStats, Badge, ListenerLevel, LiveNowPlaying } from '../types';
import { getShowRecommendations, generateDailyRewind } from '../services/geminiService';
import { DJS } from '../constants';
import DailyRewindModal from './DailyRewindModal';
import ListeningDNA from './Contact';


interface User {
  username: string;
  avatarUrl?: string;
  bio?: string;
}

// Icons
const StarIcon = ({ filled }: { filled: boolean }) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill={filled ? "currentColor" : "none"}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const UserGroupIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>);
const MusicIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" /></svg>);
const PencilIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>);
const SaveIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>);
const CancelIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>);
const CheckCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>);
const MicrophoneIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17a1 1 0 11-2 0v-2.07A5 5 0 014 11V7a1 1 0 012 0v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-3 4.93z" clipRule="evenodd" /></svg>);

// Badge Icons & Definitions
const SuperfanIcon = ({ className = "h-8 w-8" }: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const NightOwlIcon = ({ className = "h-8 w-8" }: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>;
const TastemakerIcon = ({ className = "h-8 w-8" }: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" /></svg>;
const ChatterboxIcon = ({ className = "h-8 w-8" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" /></svg>;
const EngagedIcon = ({ className = "h-8 w-8" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;
const EarlyBirdIcon = ({ className = "h-8 w-8" }: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 10a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm15 0a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM10 18a1 1 0 011-1v-1a1 1 0 11-2 0v1a1 1 0 011 1zM5.636 5.636a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm12.728 0a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM5.636 14.364a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zm12.728 0a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414z" /></svg>;
const CriticIcon = ({ className = "h-8 w-8" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.527-1.973 6.012 6.012 0 011.912 2.706C16.27 8.57 16 9.225 16 10c0 .775.27 1.43.668 1.973a6.012 6.012 0 01-1.912 2.706C13.488 14.27 13.026 14 12.5 14a1.5 1.5 0 01-1.5-1.5v-.5a2 2 0 00-4 0v.5A1.5 1.5 0 015.5 14c-.526 0-.988.27-1.262.707a6.012 6.012 0 01-1.912-2.706C3.73 11.43 4 10.775 4 10c0-.775-.27-1.43-.668-1.973z" clipRule="evenodd" /></svg>;


export const BADGES: Badge[] = [
  {
    id: 'superfan',
    name: 'Superfan',
    description: 'Listen for over 10 hours in a month.',
    icon: SuperfanIcon,
    isEarned: (stats) => stats.monthlyListeningTime > 36000, // 10 hours * 3600 s/hr
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Tune in after midnight.',
    icon: NightOwlIcon,
    isEarned: (stats) => stats.hasListenedPostMidnight,
  },
  {
    id: 'tastemaker',
    name: 'Tastemaker',
    description: 'Request 5 or more songs.',
    icon: TastemakerIcon,
    isEarned: (stats, songRequests) => songRequests.length >= 5,
  },
  {
    id: 'critic',
    name: 'The Critic',
    description: 'Rate 20 or more songs.',
    icon: CriticIcon,
    isEarned: (stats) => (stats.likedSongs.length + stats.dislikedSongs.length) >= 20,
  },
  {
    id: 'chatterbox',
    name: 'Chatterbox',
    description: 'Send 20 messages in the live chat.',
    icon: ChatterboxIcon,
    isEarned: (stats) => (stats.chatMessagesSent || 0) >= 20,
  },
  {
    id: 'engaged',
    name: 'Engaged Listener',
    description: 'Vote in 5 polls or takeovers.',
    icon: EngagedIcon,
    isEarned: (stats) => (stats.votesCast || 0) >= 5,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Listen to "Sunrise Beats" for over an hour.',
    icon: EarlyBirdIcon,
    isEarned: (stats) => (stats.showListeningTime['Sunrise Beats'] || 0) > 3600,
  }
];

export const LISTENER_LEVELS: ListenerLevel[] = [
    { name: 'New Listener', minPoints: 0, color: 'ring-slate-500' },
    { name: 'Tune-In Titan', minPoints: 1000, color: 'ring-cyan-400' },
    { name: 'Regular Groover', minPoints: 2500, color: 'ring-blue-400' },
    { name: 'Station Staple', minPoints: 5000, color: 'ring-green-400' },
    { name: 'Vibe Veteran', minPoints: 10000, color: 'ring-purple-400' },
    { name: 'Radio Royalty', minPoints: 20000, color: 'ring-amber-400' },
  ];

interface MyStationProps {
  favoriteShows: ApiScheduleItem[];
  favoriteDjs: Dj[];
  allShows: ApiScheduleItem[];
  onToggleFavorite: (showId: number) => void;
  onToggleFavoriteDj: (djId: number) => void;
  currentShowName: string | null;
  currentUser: User;
  onUpdateUserProfile: (updatedProfile: { username: string; avatarUrl: string; bio: string; }) => void;
  songRequests: SongRequestRecord[];
  listeningStats: ListeningStats;
  dailyShowsListened: string[];
  liveNowPlaying: LiveNowPlaying;
}

const Marquee: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="relative flex overflow-x-hidden bg-slate-800/50 border-y border-amber-500/30 py-3 mb-12 group">
            <div className="flex animate-marquee whitespace-nowrap text-amber-300 font-semibold group-hover:[animation-play-state:paused]">
                <span className="mx-8">{children}</span>
                <span className="mx-8">{children}</span>
            </div>
            <div className="absolute top-3 flex animate-marquee2 whitespace-nowrap text-amber-300 font-semibold group-hover:[animation-play-state:paused]">
                <span className="mx-8">{children}</span>
                <span className="mx-8">{children}</span>
            </div>
        </div>
    );
};

const MyStation: React.FC<MyStationProps> = ({ favoriteShows, favoriteDjs, allShows, onToggleFavorite, onToggleFavoriteDj, currentShowName, currentUser, onUpdateUserProfile, songRequests, listeningStats, dailyShowsListened, liveNowPlaying }) => {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileData, setProfileData] = useState({
    username: currentUser.username,
    avatarUrl: currentUser.avatarUrl || '',
    bio: currentUser.bio || ''
  });
  const [avatarError, setAvatarError] = useState(false);

  const [isRewindModalOpen, setIsRewindModalOpen] = useState(false);
  const [rewindContent, setRewindContent] = useState<string | null>(null);
  const [isRewindLoading, setIsRewindLoading] = useState(false);
  const [rewindError, setRewindError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setProfileData({
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl || '',
        bio: currentUser.bio || ''
      });
    }
    setAvatarError(false);
  }, [currentUser, isEditing]);

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const favShowNames = favoriteShows.map(s => s.name);
      const allShowNames = allShows.map(s => s.name);
      const result = await getShowRecommendations(
        favShowNames, 
        allShowNames, 
        songRequests, 
        listeningStats.likedSongs.map(s => s.id), 
        listeningStats.dislikedSongs.map(s => s.id)
      );
      setRecommendations(result);
    } catch (err) {
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRewind = async () => {
    setIsRewindModalOpen(true);
    setIsRewindLoading(true);
    setRewindError(null);
    setRewindContent(null);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaysRequests = songRequests.filter(req => req.requestedAt.startsWith(todayStr));
      
      const result = await generateDailyRewind(currentUser.username, dailyShowsListened, todaysRequests);
      setRewindContent(result);
    } catch (err: any) {
      setRewindError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsRewindLoading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile(profileData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Let useEffect handle resetting the form data
  };

  const isFavoriteOnAir = useMemo(() => {
    return favoriteShows.some(show => show.name === currentShowName);
  }, [favoriteShows, currentShowName]);

  const sortedSongRequests = useMemo(() => {
    return [...songRequests].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [songRequests]);

  const currentLevel = useMemo(() => 
    [...LISTENER_LEVELS].reverse().find(l => listeningStats.points >= l.minPoints) || LISTENER_LEVELS[0],
    [listeningStats.points]
  );

  const nextLevel = useMemo(() => 
    LISTENER_LEVELS.find(l => l.minPoints > listeningStats.points),
    [listeningStats.points]
  );

  const progressPercentage = useMemo(() => {
      if (!nextLevel) return 100;
      if (currentLevel.minPoints === nextLevel.minPoints) return 100;
      const levelPointRange = nextLevel.minPoints - currentLevel.minPoints;
      const pointsIntoLevel = listeningStats.points - currentLevel.minPoints;
      return (pointsIntoLevel / levelPointRange) * 100;
  }, [listeningStats.points, currentLevel, nextLevel]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = '#/';
  };

  return (
    <div className="max-w-6xl mx-auto">
        <header className="mb-12">
            <div className="mb-8">
                <a href="#/" onClick={handleHomeClick} className="text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Home
                </a>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">My Station</h1>
            <p className="text-slate-400 mt-2 max-w-2xl">Your personalized hub for favorites, requests, and discovering new shows.</p>
        </header>
      
      <Marquee>
          <span className="font-normal text-slate-400">Now Playing:</span> {liveNowPlaying.song.title} - {liveNowPlaying.song.artist}
      </Marquee>

      <div className="space-y-12">
        {isFavoriteOnAir && (
            <div className="bg-amber-500/10 border-l-4 border-amber-400 rounded-r-lg p-4 flex items-center gap-4 animate-fade-in ring-2 ring-amber-500/50 animate-pulse">
                <div className="flex-shrink-0">
                    <span className="font-bold text-red-500 animate-pulse text-sm">Live</span>
                </div>
                <div>
                    <h3 className="font-bold text-amber-300">Your Favorite Show Is On Air!</h3>
                    <p className="text-slate-300 flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-black bg-amber-300 rounded-full">On Air</span>
                      <span>"{currentShowName}" is playing now. Tune in!</span>
                    </p>
                </div>
            </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-12">
                <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50 flex flex-col h-full">
                    <h2 className="text-2xl font-bold mb-6 tracking-wide text-white">Favorite Shows</h2>
                    {favoriteShows.length > 0 ? (
                      <ul className="space-y-3 flex-grow">
                        {favoriteShows.map(show => {
                          const isOnAir = show.name === currentShowName;
                          return (
                            <li key={show.id} className={`p-3 rounded-lg flex gap-3 items-center justify-between transition-all duration-300 ${isOnAir ? 'bg-amber-500/10 ring-2 ring-amber-400' : 'bg-slate-800/50'}`}>
                              <div className="flex items-center gap-3 overflow-hidden">
                                <button onClick={() => onToggleFavorite(show.id)} className="p-1 text-amber-400 flex-shrink-0" aria-label="Remove from favorites"><StarIcon filled={true} /></button>
                                <div className="overflow-hidden">
                                    <h4 className="font-semibold text-white truncate">{show.name}</h4>
                                    <p className="text-xs text-slate-400">{new Date(show.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                              {isOnAir && (
                                <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-black bg-amber-300 rounded-full flex-shrink-0">On Air</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
                        <div className="text-amber-400 mb-3"><MusicIcon /></div>
                        <h4 className="font-semibold text-white">No Favorite Shows Yet</h4>
                        <p className="text-sm text-slate-400 mt-1">Star a show from the schedule to see it here!</p>
                      </div>
                    )}
                </section>
                
                <section>
                    <h2 className="text-2xl font-bold mb-6 tracking-wide text-white">Show Recommendations</h2>
                    <div className="bg-slate-800/50 p-6 rounded-lg">
                        {isLoading && <div className="flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div></div>}
                        {error && <p className="text-red-400">{error}</p>}
                        {recommendations ? (
                            <div className="prose prose-invert max-w-none text-slate-300" dangerouslySetInnerHTML={{ __html: recommendations.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        ) : (
                            !isLoading && (
                                <div className="text-center">
                                    <p className="text-slate-400 mb-4">Get personalized show recommendations from our AI DJ, Alex!</p>
                                    <button onClick={handleGetRecommendations} className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg shadow-md hover:bg-amber-600 transition-all duration-200">
                                        Ask DJ Alex
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-6 tracking-wide text-white">Your Recent Requests</h2>
                     {sortedSongRequests.length > 0 ? (
                        <ul className="space-y-2">
                            {sortedSongRequests.map(req => (
                                <li key={req.requestedAt} className="p-3 bg-slate-800/50 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-white">{req.title}</p>
                                        <p className="text-sm text-slate-400">{req.artist}</p>
                                    </div>
                                    <p className="text-xs text-slate-500">{formatDate(req.requestedAt)} at {formatTime(req.requestedAt)}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-400 bg-slate-800/50 p-4 rounded-lg">You haven't requested any songs yet.</p>
                    )}
                </section>
            </div>
            {/* Sidebar Column */}
            <div className="space-y-12">
                <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
                    <div className="flex justify-between items-start">
                        <div>
                           <h2 className="text-2xl font-bold tracking-wide text-white">Your Profile</h2>
                           {saveSuccess && <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><CheckCircleIcon /> Profile updated!</p>}
                        </div>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <button onClick={handleSaveProfile} className="p-2 text-green-400 hover:bg-green-500/10 rounded-full" aria-label="Save changes"><SaveIcon /></button>
                                <button onClick={handleCancelEdit} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full" aria-label="Cancel editing"><CancelIcon /></button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full" aria-label="Edit profile"><PencilIcon /></button>
                        )}
                    </div>
                    <div className="mt-6 text-center">
                        <div className="relative w-24 h-24 mx-auto mb-4">
                            {avatarError || !profileData.avatarUrl ? (
                                <div className="w-full h-full rounded-full bg-slate-700 text-slate-500 flex items-center justify-center ring-4 ring-slate-600"><UserIcon /></div>
                            ) : (
                                <img src={profileData.avatarUrl} alt="User avatar" className="w-full h-full rounded-full object-cover ring-4 ring-slate-600" onError={() => setAvatarError(true)} />
                            )}
                            <div className={`absolute bottom-1 right-1 p-1 rounded-full text-white text-xs font-bold ${currentLevel.color.replace('ring-', 'bg-')}`}>{currentLevel.name}</div>
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
                                <div><label htmlFor="username" className="text-xs text-slate-400">Username</label><input type="text" id="username" value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-white text-sm" /></div>
                                <div><label htmlFor="avatarUrl" className="text-xs text-slate-400">Avatar URL</label><input type="text" id="avatarUrl" value={profileData.avatarUrl} onChange={e => { setProfileData({...profileData, avatarUrl: e.target.value}); setAvatarError(false); }} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-white text-sm" /></div>
                                <div><label htmlFor="bio" className="text-xs text-slate-400">Bio</label><textarea id="bio" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-white text-sm"></textarea></div>
                            </form>
                        ) : (
                            <div>
                                <h3 className="text-xl font-bold text-white">{currentUser.username}</h3>
                                <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">{currentUser.bio || 'No bio yet. Click the pencil to add one!'}</p>
                            </div>
                        )}
                    </div>
                </section>

                <section>
                     <h2 className="text-2xl font-bold mb-6 tracking-wide text-white">Listener Stats</h2>
                     <div className="bg-slate-800/50 p-6 rounded-lg">
                        <div className="mb-4">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-semibold text-slate-300">Level: {currentLevel.name}</span>
                                {nextLevel && <span className="text-xs text-slate-400">Next: {nextLevel.name}</span>}
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className={`bg-amber-500 h-2.5 rounded-full`} style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <p className="text-xs text-right text-slate-400 mt-1">{Math.floor(listeningStats.points)} / {nextLevel ? nextLevel.minPoints : currentLevel.minPoints} points</p>
                        </div>
                        <button onClick={handleGetRewind} className="w-full text-center py-2 px-4 bg-amber-500/20 text-amber-300 font-semibold rounded-lg hover:bg-amber-500/30 transition-colors">
                            Get Your Daily Rewind
                        </button>
                    </div>
                </section>
                
                <ListeningDNA listeningStats={listeningStats} songRequests={songRequests} />

                <section>
                    <h2 className="text-2xl font-bold mb-6 tracking-wide text-white">Badges Earned</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {BADGES.map(badge => {
                            const isEarned = badge.isEarned(listeningStats, songRequests);
                            return (
                                <div key={badge.id} className={`p-4 rounded-lg text-center transition-all duration-300 ${isEarned ? 'bg-amber-500/10' : 'bg-slate-800/50'}`}>
                                    <div className={`mx-auto mb-2 ${isEarned ? 'text-amber-400' : 'text-slate-600'}`}>
                                        <badge.icon />
                                    </div>
                                    <h4 className={`font-bold text-sm ${isEarned ? 'text-white' : 'text-slate-500'}`}>{badge.name}</h4>
                                    <p className={`text-xs mt-1 ${isEarned ? 'text-slate-400' : 'text-slate-600'}`}>{badge.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-6 tracking-wide text-white">Favorite DJs</h2>
                     {favoriteDjs.length > 0 ? (
                        <ul className="space-y-3">
                            {favoriteDjs.map(dj => {
                                const isOnAir = dj.show === currentShowName;
                                return (
                                    <li key={dj.id} className={`p-3 rounded-lg flex items-center gap-3 ${isOnAir ? 'bg-amber-500/10' : 'bg-slate-800/50'}`}>
                                        <img src={dj.imageUrl} alt={dj.name} className="w-10 h-10 rounded-full object-cover"/>
                                        <div>
                                            <h4 className="font-semibold text-white">{dj.name}</h4>
                                            <p className="text-xs text-amber-400">{dj.show}</p>
                                        </div>
                                        <button onClick={() => onToggleFavoriteDj(dj.id)} className="p-1 text-amber-400 ml-auto" aria-label="Remove from favorites"><StarIcon filled={true} /></button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                       <div className="text-center p-8 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
                           <div className="text-amber-400 mb-3"><UserGroupIcon /></div>
                           <h4 className="font-semibold text-white">No Favorite DJs Yet</h4>
                           <p className="text-sm text-slate-400 mt-1">Star a DJ from the homepage to see them here!</p>
                       </div>
                    )}
                </section>
            </div>
        </div>
      </div>
       {isRewindModalOpen && (
        <DailyRewindModal 
          isLoading={isRewindLoading}
          rewindContent={rewindContent}
          error={rewindError}
          onClose={() => setIsRewindModalOpen(false)}
        />
      )}
    </div>
  );
};
export default MyStation;
