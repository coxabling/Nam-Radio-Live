


import React, { useState, useEffect, useMemo } from 'react';
import { Dj, ApiScheduleItem, SongRequestRecord, ListeningStats, Badge } from '../types';
import { getShowRecommendations } from '../services/geminiService';
import { DJS } from '../constants';


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

const BADGES: Badge[] = [
  {
    id: 'superfan',
    name: 'Superfan',
    description: 'Listen for over 10 hours in a month.',
    icon: SuperfanIcon,
    isEarned: (stats, songRequests) => stats.monthlyListeningTime > 36000, // 10 hours * 3600 s/hr
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Tune in after midnight.',
    icon: NightOwlIcon,
    isEarned: (stats, songRequests) => stats.hasListenedPostMidnight,
  },
  {
    id: 'tastemaker',
    name: 'Tastemaker',
    description: 'Request 5 or more songs.',
    icon: TastemakerIcon,
    isEarned: (stats, songRequests) => songRequests.length >= 5,
  }
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
}

const MyStation: React.FC<MyStationProps> = ({ favoriteShows, favoriteDjs, allShows, onToggleFavorite, onToggleFavoriteDj, currentShowName, currentUser, onUpdateUserProfile, songRequests, listeningStats }) => {
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
      const result = await getShowRecommendations(favShowNames, allShowNames, songRequests);
      setRecommendations(result);
    } catch (err) {
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
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

  const userStats = useMemo(() => {
    const hours = (listeningStats.monthlyListeningTime / 3600).toFixed(1);
    
    let topShowName: string | null = null;
    if (Object.keys(listeningStats.showListeningTime).length > 0) {
        topShowName = Object.entries(listeningStats.showListeningTime).sort((a,b) => Number(b[1]) - Number(a[1]))[0][0];
    }
    
    const djForTopShow = DJS.find(dj => dj.show === topShowName);

    return {
        listeningHours: hours,
        topDj: djForTopShow?.name || 'The Airwaves'
    };
  }, [listeningStats]);
  
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
                                  <span className="flex-shrink-0 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black bg-amber-300 rounded-full">
                                      On Air
                                  </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="flex-grow flex items-center justify-center text-center p-4 border-2 border-dashed border-slate-700 rounded-lg">
                        <div>
                          <p className="text-slate-400">No favorite shows yet.</p>
                          <p className="text-slate-500 text-sm mt-1">Star a show on the schedule!</p>
                        </div>
                      </div>
                    )}
                </section>

                <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50 flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 tracking-wide text-white">Favorite DJs</h2>
                    {favoriteDjs.length > 0 ? (
                      <ul className="space-y-3 flex-grow">
                        {favoriteDjs.map(dj => {
                          const isOnAir = dj.show === currentShowName;
                          return (
                            <li key={dj.id} className={`p-3 rounded-lg flex gap-3 items-center justify-between transition-all duration-300 ${isOnAir ? 'bg-amber-500/10 ring-2 ring-amber-400' : 'bg-slate-800/50'}`}>
                              <div className="flex items-center gap-3 overflow-hidden">
                                <button onClick={() => onToggleFavoriteDj(dj.id)} className="p-1 text-amber-400 flex-shrink-0" aria-label="Remove DJ from favorites"><StarIcon filled={true} /></button>
                                <img src={dj.imageUrl} alt={dj.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0"/>
                                <div className="overflow-hidden">
                                    <h4 className="font-semibold text-white truncate">{dj.name}</h4>
                                    <p className="text-xs text-slate-400 truncate">{dj.show}</p>
                                </div>
                              </div>
                               {isOnAir && (
                                  <span className="flex-shrink-0 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black bg-amber-300 rounded-full">
                                      On Air
                                  </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="flex-grow flex items-center justify-center text-center p-4 border-2 border-dashed border-slate-700 rounded-lg">
                        <div>
                          <p className="text-slate-400">No favorite DJs yet.</p>
                          <p className="text-slate-500 text-sm mt-1">Star a DJ from the home page!</p>
                        </div>
                      </div>
                    )}
                </section>

                <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
                    <h2 className="text-2xl font-bold mb-4 tracking-wide text-white">Discover New Shows</h2>
                    <p className="text-slate-400 mb-6">Let DJ Alex, our AI curator, find your next obsession based on your favorites and requests!</p>
                    <div className="text-center">
                        <button onClick={handleGetRecommendations} disabled={isLoading} className="px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg shadow-md hover:bg-amber-600 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed">{isLoading ? 'Thinking...' : 'Ask DJ Alex for Recommendations'}</button>
                    </div>
                    {isLoading && (<div className="flex justify-center items-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div></div>)}
                    {error && <p className="mt-6 text-center text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>}
                    {recommendations && (
                    <div className="mt-6 p-4 bg-amber-500/10 border-l-4 border-amber-400 rounded-r-lg">
                         <div className="prose prose-invert max-w-none text-slate-300">
                            <p className="italic"><span className="font-bold text-amber-300 not-italic">DJ Alex says:</span></p>
                            <div dangerouslySetInnerHTML={{ __html: recommendations.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}/>
                        </div>
                    </div>
                    )}
                </section>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-12">
                 <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold tracking-wide text-white">Your Profile</h2>
                      {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors" aria-label="Edit profile"><PencilIcon /> Edit</button>
                      ) : (
                        <div className="flex items-center gap-2">
                            <button onClick={handleCancelEdit} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors" aria-label="Cancel edit"><CancelIcon /></button>
                            <button form="profile-form" type="submit" className="p-2 text-amber-400 hover:text-white hover:bg-amber-500/50 rounded-full transition-colors" aria-label="Save profile"><SaveIcon /></button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4 animate-fade-in">
                          <div><label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">Username</label><input type="text" id="username" value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow focus:shadow-lg focus:shadow-amber-500/20" maxLength={20} required /></div>
                          <div><label htmlFor="avatarUrl" className="block text-sm font-medium text-slate-300 mb-1">Avatar URL</label><input type="url" id="avatarUrl" value={profileData.avatarUrl} onChange={e => setProfileData({...profileData, avatarUrl: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow focus:shadow-lg focus:shadow-amber-500/20" placeholder="https://..." /></div>
                          <div><label htmlFor="bio" className="block text-sm font-medium text-slate-300 mb-1">Short Bio</label><textarea id="bio" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} rows={3} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow focus:shadow-lg focus:shadow-amber-500/20" maxLength={120} placeholder="Tell us a bit about yourself..."></textarea></div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex-shrink-0 relative">
                             <div className="absolute inset-0 rounded-full ring-2 ring-amber-400 ring-offset-4 ring-offset-slate-800 animate-pulse"></div>
                             {profileData.avatarUrl && !avatarError ? 
                                <img src={profileData.avatarUrl} alt="User avatar" className="relative w-full h-full object-cover rounded-full" onError={() => setAvatarError(true)} /> 
                                : 
                                <div className="p-4 text-slate-500"><UserIcon /></div>
                             }
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="text-2xl font-bold text-white truncate">{profileData.username}</h3>
                          </div>
                        </div>
                        {saveSuccess && (
                            <div className="flex items-center gap-3 p-3 text-sm bg-green-500/10 text-green-300 rounded-lg animate-fade-in border border-green-500/20">
                                <CheckCircleIcon />
                                <strong>Profile saved successfully!</strong>
                            </div>
                        )}
                        {profileData.bio && <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg text-sm italic">"{profileData.bio}"</p>}
                      </div>
                    )}
                </section>

                 <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
                    <h2 className="text-2xl font-bold mb-6 tracking-wide text-white">Your Stats & Badges</h2>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-300">Listening Time (Month)</span>
                        <span className="font-bold text-white text-lg">{userStats.listeningHours} hours</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-300">Your Top DJ</span>
                        <span className="font-bold text-white text-lg">{userStats.topDj}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-300 mb-3">Achievements</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {BADGES.map(badge => {
                          const earned = badge.isEarned(listeningStats, songRequests);
                          return (
                            <div key={badge.id} className={`text-center p-3 rounded-lg transition-all ${earned ? 'bg-amber-500/10' : 'bg-slate-800/50'}`} title={badge.description}>
                              <div className={`mx-auto mb-2 ${earned ? 'text-amber-400' : 'text-slate-500 grayscale'}`}>
                                <badge.icon />
                              </div>
                              <p className={`text-xs font-semibold ${earned ? 'text-white' : 'text-slate-400'}`}>{badge.name}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                </section>

                <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50 flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 tracking-wide text-white">Request History</h2>
                    {sortedSongRequests.length > 0 ? (
                      <ul className="space-y-3 flex-grow overflow-y-auto max-h-64 pr-2">
                          {sortedSongRequests.map(req => (
                              <li key={req.requestedAt} className="p-3 bg-slate-800/50 rounded-lg flex gap-3 items-center">
                                  <div className="flex-shrink-0 p-1 text-slate-400"><MusicIcon /></div>
                                  <div className="flex-grow overflow-hidden">
                                      <h4 className="font-semibold text-white truncate">{req.title}</h4>
                                      <p className="text-xs text-slate-400 truncate">{req.artist}</p>
                                  </div>
                                  <div className="flex-shrink-0 text-right">
                                      <p className="text-xs font-semibold text-slate-400">{formatDate(req.requestedAt)}</p>
                                      <p className="text-xs text-slate-500">{formatTime(req.requestedAt)}</p>
                                  </div>
                              </li>
                          ))}
                      </ul>
                    ) : (
                      <div className="flex-grow flex items-center justify-center text-center p-4 border-2 border-dashed border-slate-700 rounded-lg">
                        <div>
                          <p className="text-slate-400">No song requests yet.</p>
                          <p className="text-slate-500 text-sm mt-1">Request a song from the home page!</p>
                        </div>
                      </div>
                    )}
                </section>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MyStation;
