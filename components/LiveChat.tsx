import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, PollMessage, Song, TakeoverMessage, GameMessage, Vibe, DedicationRecord, MusicEvent, ApiScheduleItem, SongRequestRecord, ListeningStats, PersonalizedMessage, OnThisDayMessage, LevelUpMessage, TriviaMessage } from '../types';
import { getAiChatResponse, generateTakeoverAnnouncement, generateTakeoverWinnerShoutout, generateSongClue, generateDjChitchat, generateVibeCommentary, generateDedicationShoutout, getRankedShowRecommendations, generateShowScoutAlert, generateLocalSpotlightPromo, generateEventShoutout, getOnThisDayInMusic, generateLevelUpMessage, generateTriviaQuestion } from '../services/geminiService';
import { TAKEOVER_SONGS } from '../constants';

const djPolls: Omit<PollMessage, 'id' | 'author' | 'isDj' | 'type'>[] = [
  { question: "What genre should we play next?", options: [{ text: "Classic Rock", votes: 0 }, { text: "Indie Hits", votes: 0 }, { text: "90s Pop", votes: 0 }] },
  { question: "Which decade had the best music?", options: [{ text: "The 80s", votes: 0 }, { text: "The 90s", votes: 0 }, { text: "The 2000s", votes: 0 }] }
];

const TypingIndicator: React.FC<{ author: string }> = ({ author }) => (
  <div className="flex items-start"><div className="rounded-lg px-3 py-2 max-w-[80%] bg-amber-900/70"><span className="text-xs font-bold block text-amber-200">{author}</span><div className="flex items-center space-x-1 p-1"><span className="h-2 w-2 bg-amber-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="h-2 w-2 bg-amber-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="h-2 w-2 bg-amber-300 rounded-full animate-bounce"></span></div></div></div>
);

const CalendarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);

interface User {
  username: string;
}

interface LiveChatProps {
  liveNowPlaying: { song: Song; show: ApiScheduleItem | null };
  recentlyPlayed: Song[];
  currentUser: User | null;
  dominantVibe: Vibe | null;
  onChatMessageSent: () => void;
  onVoteCast: () => void;
  onGameWon: () => void;
  latestDedication: DedicationRecord | null;
  events: MusicEvent[];
  schedule: ApiScheduleItem[];
  userFavoriteShows: ApiScheduleItem[];
  songRequests: SongRequestRecord[];
  listeningStats: ListeningStats;
  latestLevelUp: { username: string; levelName: string } | null;
}

type FilterType = 'dj' | 'polls' | 'games' | 'takeovers';

const GEMINI_CALL_LIMIT = 100;
const GEMINI_LIMIT_KEY = 'nam-radio-gemini-limit';

const LiveChat: React.FC<LiveChatProps> = ({ liveNowPlaying, recentlyPlayed, currentUser, dominantVibe, onChatMessageSent, onVoteCast, onGameWon, latestDedication, events, schedule, userFavoriteShows, songRequests, listeningStats, latestLevelUp }) => {
  const [messages, setMessages] = useState<Message[]>([{ id: 1, type: 'text', author: 'DJ Alex', text: 'Welcome to the live chat! Drop a message and say hi!', isDj: true }]);
  const [newMessage, setNewMessage] = useState('');
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});
  const [isDjTyping, setIsDjTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const djMessageTimer = useRef<number | null>(null);
  const [filters, setFilters] = useState<Record<FilterType, boolean>>({
    dj: true,
    polls: true,
    games: true,
    takeovers: true,
  });
  const dedicationAnnouncedRef = useRef(false);
  const levelUpAnnouncedRef = useRef(false);
  const scoutedShowIds = useRef<Set<number>>(new Set());

  // "On This Day" feature logic
  useEffect(() => {
    const postOnThisDayFact = async () => {
      const ON_THIS_DAY_KEY = 'nam-radio-on-this-day-posted-date';
      const todayStr = new Date().toISOString().split('T')[0];

      try {
        const lastPostedDate = localStorage.getItem(ON_THIS_DAY_KEY);
        if (lastPostedDate === todayStr) {
          return; // Already posted today
        }
      } catch (e) { console.error("Could not read from localStorage", e); }
      
      const { count } = getGeminiCallCount();
      if (count >= GEMINI_CALL_LIMIT) {
          return; // Daily limit reached
      }
      incrementGeminiCallCount();

      try {
        setIsDjTyping(true);
        const fact = await getOnThisDayInMusic();
        setIsDjTyping(false);
        
        const factMessage: OnThisDayMessage = {
          id: Date.now(),
          type: 'on_this_day',
          author: 'DJ Alex',
          text: fact,
          isDj: true,
        };
        setMessages(prev => [...prev, factMessage]);
        
        try {
            localStorage.setItem(ON_THIS_DAY_KEY, todayStr);
        } catch (e) { console.error("Could not write to localStorage", e); }

      } catch (error) {
        console.error(error);
        setIsDjTyping(false); // Make sure to turn this off on error
      }
    };

    postOnThisDayFact();
  }, []); // Run only once on component mount

  // AI Show Scout Logic
  useEffect(() => {
    const scoutInterval = 3 * 60 * 1000; // Check every 3 minutes
    
    const showScout = async () => {
        if (!currentUser || schedule.length === 0) return;

        const now = new Date();
        const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);
        const favShowNames = userFavoriteShows.map(s => s.name);

        const upcomingShows = schedule.filter(s => {
            const startTime = new Date(s.start);
            return startTime > now && startTime <= thirtyMinsFromNow && !scoutedShowIds.current.has(s.id);
        });

        if (upcomingShows.length === 0) return;
        
        // Prioritize favorited shows
        const upcomingFavorite = upcomingShows.find(s => favShowNames.includes(s.name));
        
        let alertToShow: ApiScheduleItem | null = upcomingFavorite || null;
        let isFavorite = !!upcomingFavorite;
        
        // If no upcoming favorite, check for a recommendation
        if (!alertToShow) {
            const recommendations = await getRankedShowRecommendations(favShowNames, upcomingShows, songRequests, listeningStats.likedSongs, listeningStats.dislikedSongs);
            if (recommendations.length > 0) {
                alertToShow = recommendations[0];
            }
        }

        if (alertToShow) {
            const { count } = getGeminiCallCount();
            if (count >= GEMINI_CALL_LIMIT) return;
            incrementGeminiCallCount();

            setIsDjTyping(true);
            const alertText = await generateShowScoutAlert(currentUser.username, alertToShow, isFavorite);
            setIsDjTyping(false);
            
            const scoutMessage: PersonalizedMessage = {
                id: Date.now(),
                type: 'personalized',
                author: 'DJ Alex',
                text: alertText,
                isDj: true,
                recipient: currentUser.username,
            };
            setMessages(prev => [...prev, scoutMessage]);
            scoutedShowIds.current.add(alertToShow.id);
        }
    };
    
    const timer = setInterval(showScout, scoutInterval);
    return () => clearInterval(timer);

  }, [currentUser, schedule, userFavoriteShows, songRequests, listeningStats]);


  // Announce dedications
  useEffect(() => {
    const announceDedication = async () => {
      if (latestDedication && !dedicationAnnouncedRef.current) {
        dedicationAnnouncedRef.current = true;
        setIsDjTyping(true);
        const shoutout = await generateDedicationShoutout(latestDedication);
        setIsDjTyping(false);
        const dedicationMessage: Message = { id: Date.now(), type: 'text', author: 'DJ Alex', text: shoutout, isDj: true };
        setMessages(prev => [...prev, dedicationMessage]);

        // Reset after a delay to allow for re-announcements if the prop changes again
        setTimeout(() => { dedicationAnnouncedRef.current = false; }, 10000);
      }
    };
    announceDedication();
  }, [latestDedication]);
  
  // Announce Level Ups
  useEffect(() => {
    const announceLevelUp = async () => {
        if (latestLevelUp && !levelUpAnnouncedRef.current) {
            levelUpAnnouncedRef.current = true; // Prevent re-announcing
            
            const { count } = getGeminiCallCount();
            if (count < GEMINI_CALL_LIMIT) {
                incrementGeminiCallCount();
                setIsDjTyping(true);
                const shoutout = await generateLevelUpMessage(latestLevelUp.username, latestLevelUp.levelName);
                setIsDjTyping(false);
                const levelUpMessage: LevelUpMessage = {
                    id: Date.now(),
                    type: 'level_up',
                    author: 'DJ Alex',
                    text: shoutout,
                    isDj: true,
                    recipient: latestLevelUp.username,
                    levelName: latestLevelUp.levelName,
                };
                setMessages(prev => [...prev, levelUpMessage]);
            }

            setTimeout(() => { levelUpAnnouncedRef.current = false; }, 10000); // Reset after a delay
        }
    };
    announceLevelUp();
  }, [latestLevelUp]);


  const getGeminiCallCount = () => {
      const stored = localStorage.getItem(GEMINI_LIMIT_KEY);
      if (!stored) return { count: 0, date: new Date().toISOString().split('T')[0] };
      const data = JSON.parse(stored);
      const today = new Date().toISOString().split('T')[0];
      if (data.date !== today) {
          return { count: 0, date: today };
      }
      return data;
  };

  const incrementGeminiCallCount = () => {
      let { count, date } = getGeminiCallCount();
      count++;
      localStorage.setItem(GEMINI_LIMIT_KEY, JSON.stringify({ count, date }));
      return count;
  };

  const userHandle = currentUser?.username || 'Guest';
  
  const toggleFilter = (filter: FilterType) => {
    setFilters(prev => ({...prev, [filter]: !prev[filter]}));
  };

  const filteredMessages = useMemo(() => {
    if (Object.values(filters).every(v => v)) return messages;
    
    return messages.filter(msg => {
      if (msg.type === 'personalized' || msg.type === 'level_up') {
          return msg.recipient === userHandle;
      }
      if (msg.author === userHandle) return true;
      if (msg.type === 'on_this_day') return true; // Always show this
      if (msg.type === 'poll') return filters.polls;
      if (msg.type === 'game' || msg.type === 'trivia') return filters.games;
      if (msg.type === 'takeover') return filters.takeovers;
      if (msg.isDj) return filters.dj;
      return true; 
    });
  }, [messages, filters, userHandle]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages, isDjTyping]);

  useEffect(() => {
    const postDjEvent = async () => {
        const { count } = getGeminiCallCount();
        if (count >= GEMINI_CALL_LIMIT) {
            console.log("Gemini API daily limit reached. Skipping DJ event.");
            return;
        }

        const endTakeoverEvent = async (takeoverId: number) => {
            let winningSong: Song | null = null;
            setMessages(prev => prev.map(msg => {
                if (msg.id === takeoverId && msg.type === 'takeover') {
                    const [songA, songB] = msg.options;
                    winningSong = songA.votes >= songB.votes ? songA : songB;
                    return { ...msg, status: 'finished', winner: winningSong };
                }
                return msg;
            }));
            if (winningSong) {
                if (getGeminiCallCount().count < GEMINI_CALL_LIMIT) {
                    incrementGeminiCallCount();
                    setIsDjTyping(true);
                    const shoutout = await generateTakeoverWinnerShoutout(winningSong);
                    setIsDjTyping(false);
                    setMessages(prev => [...prev, { id: Date.now() + 1, type: 'text', author: 'DJ Alex', text: shoutout, isDj: true }]);
                }
            }
        };

        const chance = Math.random();

        if (chance < 0.10) { // 10% chance for Listener Takeover
            incrementGeminiCallCount();
            setIsDjTyping(true);
            const songA = TAKEOVER_SONGS[Math.floor(Math.random() * TAKEOVER_SONGS.length)];
            let songB = TAKEOVER_SONGS[Math.floor(Math.random() * TAKEOVER_SONGS.length)];
            while (songA === songB) { songB = TAKEOVER_SONGS[Math.floor(Math.random() * TAKEOVER_SONGS.length)]; }

            const announcement = await generateTakeoverAnnouncement(songA, songB);
            setIsDjTyping(false);

            const takeoverMessage: TakeoverMessage = { id: Date.now(), type: 'takeover', author: 'DJ Alex', text: announcement, options: [{ ...songA, votes: 0 }, { ...songB, votes: 0 }], status: 'voting', winner: null, isDj: true };
            setMessages(prev => [...prev, takeoverMessage]);

            setTimeout(() => endTakeoverEvent(takeoverMessage.id), 30000);

        } else if (chance < 0.20) { // 10% chance for a poll
            setMessages(prev => {
                const randomPollTemplate = djPolls[Math.floor(Math.random() * djPolls.length)];
                // Create a fresh poll object with votes reset to 0
                const newPoll: Message = {
                    ...randomPollTemplate,
                    options: randomPollTemplate.options.map(opt => ({...opt, votes: 0})),
                    id: Date.now(),
                    type: 'poll',
                    author: 'DJ Alex',
                    isDj: true
                };
                return [...prev, newPoll];
            });

        } else if (chance < 0.35) { // 15% chance for "Song Sleuth" Trivia
            if (getGeminiCallCount().count >= GEMINI_CALL_LIMIT) return;
            incrementGeminiCallCount();
            setIsDjTyping(true);
            const allSongs = [...recentlyPlayed, ...TAKEOVER_SONGS];
            if(allSongs.length === 0) { setIsDjTyping(false); return; }
            const songForTrivia = allSongs[Math.floor(Math.random() * allSongs.length)];
            try {
                const { question, answer } = await generateTriviaQuestion(songForTrivia);
                setIsDjTyping(false);
                const triviaMessage: TriviaMessage = {
                    id: Date.now(),
                    type: 'trivia',
                    author: 'DJ Alex',
                    question: `Alright music fans, time for some SONG SLEUTH TRIVIA! 🧠\n\n${question}`,
                    answer,
                    winner: null,
                    isDj: true,
                };
                setMessages(prev => [...prev, triviaMessage]);
            } catch (e) {
                console.error("Failed to post trivia", e);
                setIsDjTyping(false);
            }

        } else if (chance < 0.45) { // 10% chance for Guess the Song
            incrementGeminiCallCount();
            setIsDjTyping(true);
            const allSongs = [...recentlyPlayed, ...TAKEOVER_SONGS];
            if(allSongs.length === 0) { setIsDjTyping(false); return; }
            const songToGuess = allSongs[Math.floor(Math.random() * allSongs.length)];
            const clue = await generateSongClue(songToGuess);
            setIsDjTyping(false);
            const gameMessage: GameMessage = {
                id: Date.now(),
                type: 'game',
                author: 'DJ Alex',
                clue: `Alright team, time for GUESS THE SONG! 🧐 Here's your clue: "${clue}" \nType !guess followed by your answer!`,
                answer: songToGuess.title,
                winner: null,
                isDj: true,
            };
            setMessages(prev => [...prev, gameMessage]);
        } else if (chance < 0.65) { // 20% chance for chit-chat or event shoutout
            if (recentlyPlayed.length > 0) {
                if (getGeminiCallCount().count >= GEMINI_CALL_LIMIT) { return; }
                const lastPlayedSong = recentlyPlayed[0];
                const artistName = lastPlayedSong.artist;
                const upcomingEvent = events.find(event => event.eventName.toLowerCase().includes(artistName.toLowerCase()));

                incrementGeminiCallCount();
                setIsDjTyping(true);
                let text: string;
                if (upcomingEvent) {
                    text = await generateEventShoutout(lastPlayedSong, upcomingEvent);
                } else {
                    text = await generateDjChitchat(recentlyPlayed);
                }
                setIsDjTyping(false);
                setMessages(prev => [...prev, { id: Date.now(), type: 'text', author: 'DJ Alex', text, isDj: true }]);
            }
        } else if (chance < 0.80 && dominantVibe) { // 15% chance for vibe commentary
             if (getGeminiCallCount().count >= GEMINI_CALL_LIMIT) { return; }
             incrementGeminiCallCount();
             setIsDjTyping(true);
             const vibeComment = await generateVibeCommentary(dominantVibe.label);
             setIsDjTyping(false);
             setMessages(prev => [...prev, { id: Date.now(), type: 'text', author: 'DJ Alex', text: vibeComment, isDj: true }]);
        } else if (chance < 0.90) { // 10% chance for Local Spotlight promo
            if (getGeminiCallCount().count >= GEMINI_CALL_LIMIT) { return; }
            incrementGeminiCallCount();
            setIsDjTyping(true);
            const promoText = await generateLocalSpotlightPromo();
            setIsDjTyping(false);
            setMessages(prev => [...prev, { id: Date.now(), type: 'text', author: 'DJ Alex', text: promoText, isDj: true }]);
        }


        const nextPostDelay = Math.random() * (90000 - 45000) + 45000;
        djMessageTimer.current = window.setTimeout(postDjEvent, nextPostDelay);
    };

    djMessageTimer.current = window.setTimeout(postDjEvent, 25000); 
    return () => { if (djMessageTimer.current) clearTimeout(djMessageTimer.current) };
  }, [recentlyPlayed, dominantVibe, events]); 
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage) return;

    const userMessage: Message = { id: Date.now(), type: 'text', author: userHandle, text: trimmedMessage, isDj: false };
    setMessages(prev => [...prev, userMessage]);
    onChatMessageSent();
    setNewMessage('');
    
    if (trimmedMessage.startsWith('!ask ')) {
        const { count } = getGeminiCallCount();
        if (count >= GEMINI_CALL_LIMIT) {
            const limitMessage: Message = { id: Date.now() + 1, type: 'text', author: 'DJ Alex', text: "I've been chatting up a storm today! My circuits need a little rest. I'll be back to answer more questions tomorrow!", isDj: true };
            setMessages(prev => [...prev, limitMessage]);
            return;
        }

        const query = trimmedMessage.substring(5);
        if (!query) return;
        
        incrementGeminiCallCount();
        setIsDjTyping(true);
        const insight = await getAiChatResponse(query);
        setIsDjTyping(false);
        const answerMessage: Message = { id: Date.now() + 1, type: 'text', author: 'DJ Alex', text: insight, isDj: true };
        setMessages(prev => [...prev, answerMessage]);
    }

    if (trimmedMessage.startsWith('!guess ')) {
      const guess = trimmedMessage.substring(7).trim();
      if (!guess) return;
  
      // Find the most recent, unanswered game or trivia question
      const lastGameIndex = messages.map(m => (m.type === 'game' || m.type === 'trivia') && m.winner === null).lastIndexOf(true);
      
      if (lastGameIndex !== -1) {
          const game = messages[lastGameIndex] as GameMessage | TriviaMessage;
  
          if (guess.toLowerCase() === game.answer.toLowerCase()) {
              // Correct answer!
              setMessages(prev => 
                  prev.map((msg, index) => 
                      index === lastGameIndex 
                      ? { ...msg, winner: userHandle } 
                      : msg
                  ) as Message[] // Cast to Message[] to satisfy TS
              );
  
              const shoutout = `🎉 We have a winner! Congrats ${userHandle} for correctly answering with "${game.answer}"! You've won 100 points!`;
              const winnerMessage: Message = { id: Date.now() + 1, type: 'text', author: 'DJ Alex', text: shoutout, isDj: true };
              setMessages(prev => [...prev, winnerMessage]);
              onGameWon();
          }
      }
    }
  };


  const handleVote = (messageId: number, optionIndex: number, type: 'poll' | 'takeover') => {
    if (userVotes[messageId] !== undefined) return; // User has already voted
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.id === messageId && msg.type === type) {
          const newOptions = [...msg.options];
          newOptions[optionIndex].votes += 1;
          return { ...msg, options: newOptions as any };
        }
        return msg;
      })
    );
    setUserVotes(prev => ({ ...prev, [messageId]: optionIndex }));
    onVoteCast();
  }
  
  const FilterButton: React.FC<{ filter: FilterType; label: string }> = ({ filter, label }) => (
    <button onClick={() => toggleFilter(filter)} className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${filters[filter] ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}>
      {label}
    </button>
  );

  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50 flex flex-col h-[40rem]">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold tracking-wide text-amber-300">Live Shoutbox</h2>
        {dominantVibe && (
            <div key={dominantVibe.type} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full text-xs font-semibold animate-fade-in">
                <span className="text-lg">{dominantVibe.emoji}</span>
                <span className="text-amber-300">{dominantVibe.label} Vibe</span>
            </div>
        )}
      </div>
      <div className="mb-3 p-2 bg-slate-800/50 rounded-lg flex items-center justify-between">
         <span className="text-sm text-slate-400 truncate">Chatting as: <span className="font-bold text-amber-300">{userHandle}</span></span>
      </div>
      
      <div className="mb-3 p-2 bg-slate-800/50 rounded-lg flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-2">Show:</span>
          <FilterButton filter="dj" label="DJ Messages" />
          <FilterButton filter="polls" label="Polls" />
          <FilterButton filter="games" label="Games" />
          <FilterButton filter="takeovers" label="Takeovers" />
      </div>

      <div className="flex-grow bg-slate-800/50 rounded-lg p-4 overflow-y-auto mb-4 space-y-4 shadow-inner-lg">
        {filteredMessages.map(msg => {
          if (msg.type === 'level_up') {
            return (
                <div key={msg.id} className="p-4 bg-gradient-to-br from-purple-800 to-indigo-900 rounded-lg border-2 border-purple-500 shadow-lg animate-fade-in text-center">
                    <span className="text-xl font-bold block text-purple-200 animate-pulse">LEVEL UP!</span>
                    <p className="text-lg font-bold text-white my-2">{msg.recipient} reached level <span className="text-amber-300">{msg.levelName}</span>!</p>
                    <p className="text-sm text-slate-200 italic">"{msg.text}"</p>
                </div>
            )
          }
          if (msg.type === 'personalized') {
              return (
                  <div key={msg.id} className="p-3 bg-indigo-900/70 rounded-lg border-l-4 border-indigo-400 animate-fade-in">
                      <span className="text-xs font-bold block text-indigo-200">For your eyes only, {msg.recipient}:</span>
                      <p className="text-sm text-white break-words mt-1">"{msg.text}"</p>
                  </div>
              )
          }
          if (msg.type === 'on_this_day') {
            return (
                <div key={msg.id} className="p-4 bg-gradient-to-br from-teal-900 to-cyan-900 rounded-lg border-l-4 border-cyan-400 animate-fade-in flex items-start gap-3">
                    <div className="flex-shrink-0 text-cyan-300 pt-1">
                        <CalendarIcon />
                    </div>
                    <div>
                        <span className="text-xs font-bold block text-cyan-200">On This Day in Music...</span>
                        <p className="text-sm text-white break-words mt-1">{msg.text}</p>
                    </div>
                </div>
            )
          }
          if (msg.type === 'trivia') {
            return (
              <div key={msg.id} className="p-3 bg-gradient-to-br from-teal-800 to-cyan-900 rounded-lg text-center border-2 border-teal-500 shadow-lg animate-fade-in">
                  <span className="text-lg font-bold block text-teal-200">SONG SLEUTH TRIVIA!</span>
                  <p className="text-white my-2 italic whitespace-pre-wrap">{msg.question}</p>
                  {!msg.winner && <p className="text-xs text-slate-400">First to answer with !guess wins!</p>}
                  {msg.winner && (
                      <div className="mt-3 p-3 bg-amber-500/20 rounded-lg">
                          <p className="text-sm text-amber-200">The winner is...</p>
                          <p className="font-bold text-xl text-white">{msg.winner}!</p>
                          <p className="text-amber-300">The answer was "{msg.answer}"</p>
                      </div>
                  )}
              </div>
            );
          }
          if (msg.type === 'game') {
              return (
                <div key={msg.id} className="p-3 bg-gradient-to-br from-indigo-800 to-purple-900 rounded-lg text-center border-2 border-indigo-500 shadow-lg animate-fade-in">
                    <span className="text-lg font-bold block text-indigo-200">GUESS THE SONG!</span>
                    <p className="text-white my-2 italic whitespace-pre-wrap">{msg.clue}</p>
                    {msg.winner && (
                        <div className="mt-3 p-3 bg-amber-500/20 rounded-lg">
                            <p className="text-sm text-amber-200">The winner is...</p>
                            <p className="font-bold text-xl text-white">{msg.winner}!</p>
                            <p className="text-amber-300">The song was "{msg.answer}"</p>
                        </div>
                    )}
                </div>
              );
          }
          if (msg.type === 'poll') {
            const totalVotes = msg.options.reduce((sum, opt) => sum + opt.votes, 0);
            const hasVoted = userVotes[msg.id] !== undefined;
            return (
              <div key={msg.id} className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 animate-fade-in">
                <span className="text-xs font-bold block text-amber-200">{msg.author} posted a poll:</span>
                <p className="font-semibold text-white my-2">{msg.question}</p>
                <div className="space-y-2">
                  {msg.options.map((option, index) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                    const isSelected = userVotes[msg.id] === index;
                    return (
                      <button key={index} onClick={() => handleVote(msg.id, index, 'poll')} disabled={hasVoted} className="w-full text-left p-2 rounded-md bg-slate-700/50 relative overflow-hidden disabled:cursor-not-allowed group">
                        <div className="absolute top-0 left-0 h-full bg-amber-500/60 transition-all duration-500" style={{ width: hasVoted ? `${percentage}%` : `0%` }}></div>
                        <div className="relative flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {hasVoted && isSelected && <span className="text-amber-300">&#10003;</span>}
                                <span className="text-sm font-medium text-white">{option.text}</span>
                            </div>
                            {hasVoted && <span className="text-xs font-bold text-slate-300">{option.votes} ({Math.round(percentage)}%)</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
          if (msg.type === 'takeover') {
            const hasVoted = userVotes[msg.id] !== undefined;
            return (
              <div key={msg.id} className="p-3 bg-gradient-to-br from-amber-800 to-red-900 rounded-lg text-center border-2 border-amber-500 shadow-lg animate-fade-in">
                <span className="text-lg font-bold block text-amber-200 animate-pulse">LISTENER TAKEOVER!</span>
                <p className="text-white my-2 italic">"{msg.text}"</p>
                {msg.status === 'voting' ? (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {msg.options.map((song, index) => (
                      <button key={index} onClick={() => handleVote(msg.id, index, 'takeover')} disabled={hasVoted} className="p-2 rounded-md bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-600/50 transition-colors">
                        <span className="font-bold text-white block">{song.title}</span>
                        <span className="text-sm text-slate-300 block">{song.artist}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-200">Voting has ended! The winner is:</p>
                    <p className="font-bold text-xl text-white">{msg.winner?.title}</p>
                    <p className="text-amber-300">{msg.winner?.artist}</p>
                  </div>
                )}
              </div>
            );
          }
          return (
            <div key={msg.id} className={`flex flex-col ${msg.author === userHandle ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-lg px-3 py-2 max-w-[80%] ${msg.isDj ? 'bg-amber-900/70' : 'bg-slate-700'}`}>
                <span className={`text-xs font-bold block ${msg.isDj ? 'text-amber-200' : 'text-slate-200'}`}>{msg.author}</span>
                <p className="text-sm text-white break-words">{msg.text}</p>
              </div>
            </div>
          );
        })}
        {isDjTyping && <TypingIndicator author="DJ Alex" />}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Say something... or try !ask / !guess" className="flex-grow bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400" aria-label="Your message"/>
        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400" aria-label="Send message">Send</button>
      </form>
    </section>
  );
};

export default LiveChat;