import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ListeningStats, SongRequestRecord, ApiScheduleItem, StorySlide, Badge } from '../types';
import { generateListenerStoryCaption, getTopGenres } from '../services/geminiService';
import { BADGES } from './MyStation';

interface User {
  username: string;
  avatarUrl?: string;
}

interface ListenerStoryModalProps {
  currentUser: User;
  listeningStats: ListeningStats;
  favoriteShows: ApiScheduleItem[];
  songRequests: SongRequestRecord[];
  onClose: () => void;
}

const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

const ListenerStoryModal: React.FC<ListenerStoryModalProps> = ({ currentUser, listeningStats, favoriteShows, songRequests, onClose }) => {
  const [slides, setSlides] = useState<StorySlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize computed stats to avoid re-calculating on every render
  const userStats = useMemo(() => {
    const { showListeningTime, listeningTimeByHour } = listeningStats;
    
    // Top Show
    // FIX: Explicitly cast values to numbers to resolve type inference issues with arithmetic operations.
    const topShowName = Object.entries(showListeningTime).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || favoriteShows[0]?.name || "The Auto DJ";

    // Peak Listening Time
    let peakTime = "Late Night";
    if (listeningTimeByHour && Object.keys(listeningTimeByHour).length > 0) {
      // FIX: Explicitly cast values to numbers to resolve type inference issues with arithmetic operations.
      const peakHourEntry = Object.entries(listeningTimeByHour).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
      const peakHour = parseInt(peakHourEntry[0], 10);
      if (peakHour >= 5 && peakHour < 12) peakTime = "Mornings";
      else if (peakHour >= 12 && peakHour < 17) peakTime = "Afternoons";
      else if (peakHour >= 17 && peakHour < 22) peakTime = "Evenings";
    }

    // Earned Badges
    const earnedBadges = BADGES.filter(badge => badge.isEarned(listeningStats, songRequests));

    return { topShowName, peakTime, earnedBadges };
  }, [listeningStats, favoriteShows, songRequests]);
  
  // Effect to build slides and fetch captions
  useEffect(() => {
    const generateStory = async () => {
      setIsLoading(true);
      
      const artistsFromLikes = listeningStats.likedSongs.map(s => s.id.split(' - ')[1]).filter(Boolean);
      const artistsFromRequests = songRequests.map(r => r.artist);
      const uniqueArtists = [...new Set([...artistsFromLikes, ...artistsFromRequests])];
      const topGenres = uniqueArtists.length > 2 ? await getTopGenres(uniqueArtists) : ['Your Unique Mix'];

      const slideDefinitions = [
        { type: 'welcome', data: { username: currentUser.username } },
        { type: 'top_show', data: { showName: userStats.topShowName } },
        { type: 'peak_time', data: { peakTime: userStats.peakTime } },
        { type: 'top_genres', data: { genres: topGenres } },
        { type: 'badges', data: { badges: userStats.earnedBadges, badgeCount: userStats.earnedBadges.length } },
        { type: 'summary', data: { ...userStats, topGenres } },
      ] as const;

      const generatedSlides: StorySlide[] = await Promise.all(
        slideDefinitions.map(async (def) => ({
          type: def.type,
          data: def.data,
          caption: await generateListenerStoryCaption(def.type, def.data, currentUser.username),
        }))
      );
      
      setSlides(generatedSlides);
      setIsLoading(false);
    };

    generateStory();
  }, [currentUser.username, listeningStats.likedSongs, songRequests, userStats]);

  // Slide navigation
  const nextSlide = useCallback(() => {
    setCurrentSlideIndex(prev => (prev < slides.length - 1 ? prev + 1 : prev));
  }, [slides.length]);
  
  const prevSlide = () => {
    setCurrentSlideIndex(prev => (prev > 0 ? prev - 1 : prev));
  };
  
  useEffect(() => {
    if (slides.length > 0 && !isLoading) {
        const timer = setTimeout(nextSlide, 5000);
        return () => clearTimeout(timer);
    }
  }, [currentSlideIndex, slides, isLoading, nextSlide]);


  const renderSlideContent = (slide: StorySlide) => {
    switch (slide.type) {
        case 'welcome': return (
            <div className="text-center">
                <h1 className="text-4xl font-bold">Hey, {slide.data.username}!</h1>
                <p className="text-xl mt-2">Here's your listener story for this month.</p>
            </div>
        );
        case 'top_show': return (
            <div className="text-center">
                <p className="text-lg text-amber-300 font-semibold">Your Top Show</p>
                <h2 className="text-5xl font-bold my-4 break-words">{slide.data.showName}</h2>
            </div>
        );
        case 'peak_time': return (
             <div className="text-center">
                <p className="text-lg text-amber-300 font-semibold">You're a...</p>
                <h2 className="text-5xl font-bold my-4">{slide.data.peakTime} Listener</h2>
            </div>
        );
        case 'top_genres': return (
            <div className="text-center">
                <p className="text-lg text-amber-300 font-semibold">Your Vibe Is...</p>
                <div className="my-4 space-y-2">
                    {(slide.data.genres as string[]).map(genre => <h2 key={genre} className="text-4xl font-bold">{genre}</h2>)}
                </div>
            </div>
        );
        case 'badges': return (
            <div className="text-center">
                <p className="text-lg text-amber-300 font-semibold">Your Achievements</p>
                <h2 className="text-5xl font-bold my-2">{slide.data.badgeCount} Badges Earned</h2>
                <div className="flex flex-wrap justify-center items-center gap-4 mt-4 max-w-sm mx-auto">
                    {(slide.data.badges as Badge[]).map(badge => <div key={badge.id} className="text-amber-400" title={badge.name}><badge.icon className="h-10 w-10" /></div>)}
                </div>
            </div>
        );
        case 'summary': return (
            <div className="text-center bg-slate-800/50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-amber-300">Your Monthly Rewind</h2>
                <div className="mt-4 text-left space-y-2 text-lg">
                    <p><span className="font-semibold">Top Show:</span> {slide.data.topShowName}</p>
                    <p><span className="font-semibold">Top Genres:</span> {(slide.data.topGenres as string[]).join(', ')}</p>
                    <p><span className="font-semibold">Peak Time:</span> {slide.data.peakTime}</p>
                    <p><span className="font-semibold">Badges:</span> {slide.data.badgeCount}</p>
                </div>
            </div>
        );
        default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-2" onClick={onClose} role="dialog" aria-modal="true">
        <div className="w-full max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            {/* Progress Bars */}
            {slides.length > 0 && (
                <div className="flex items-center gap-1 mb-2">
                    {slides.map((_, index) => (
                        <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                            <div className={`h-full bg-white rounded-full ${index < currentSlideIndex ? 'w-full' : (index === currentSlideIndex ? 'story-progress-bar-active' : 'w-0')}`}></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Header */}
            <header className="flex justify-between items-center text-white py-2">
                <div className="flex items-center gap-2">
                    <img src={currentUser.avatarUrl || '/logo192.svg'} alt="avatar" className="w-8 h-8 rounded-full object-cover bg-slate-700" />
                    <span className="font-semibold">{currentUser.username}</span>
                </div>
                <button onClick={onClose} aria-label="Close story"><CloseIcon /></button>
            </header>
        </div>

        {/* Content */}
        <div className="relative w-full max-w-lg aspect-[9/16] bg-gradient-to-br from-purple-800 to-amber-700 rounded-lg overflow-hidden flex-shrink-0" onClick={e => e.stopPropagation()}>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <p className="font-semibold">DJ Alex is preparing your story...</p>
                </div>
            ) : slides.length > 0 && slides[currentSlideIndex] ? (
                <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                        {renderSlideContent(slides[currentSlideIndex])}
                        <p className="absolute bottom-6 px-8 text-center text-lg italic mt-4">"{slides[currentSlideIndex].caption}"</p>
                    </div>
                    {/* Navigation */}
                    <div className="absolute inset-0 flex">
                        <div className="flex-1" onClick={prevSlide}></div>
                        <div className="flex-1" onClick={nextSlide}></div>
                    </div>
                </>
            ) : null}
        </div>
    </div>
  );
};

export default ListenerStoryModal;
