import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, PollMessage, Song, TakeoverMessage, GameMessage, Vibe } from '../types';
import { getAiChatResponse, generateTakeoverAnnouncement, generateTakeoverWinnerShoutout, generateSongClue, generateDjChitchat, generateVibeCommentary } from '../services/geminiService';
import { TAKEOVER_SONGS } from '../constants';

const djPolls: Omit<PollMessage, 'id' | 'author' | 'isDj' | 'type'>[] = [
  { question: "What genre should we play next?", options: [{ text: "Classic Rock", votes: 5 }, { text: "Indie Hits", votes: 8 }, { text: "90s Pop", votes: 3 }] },
  { question: "Which decade had the best music?", options: [{ text: "The 80s", votes: 12 }, { text: "The 90s", votes: 9 }, { text: "The 2000s", votes: 11 }] }
];

const TypingIndicator: React.FC<{ author: string }> = ({ author }) => (
  <div className="flex items-start"><div className="rounded-lg px-3 py-2 max-w-[80%] bg-amber-900/70"><span className="text-xs font-bold block text-amber-200">{author}</span><div className="flex items-center space-x-1 p-1"><span className="h-2 w-2 bg-amber-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="h-2 w-2 bg-amber-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="h-2 w-2 bg-amber-300 rounded-full animate-bounce"></span></div></div></div>
);

interface User {
  username: string;
}

interface LiveChatProps {
  liveNowPlaying: { song: Song };
  recentlyPlayed: Song[];
  currentUser: User | null;
  dominantVibe: Vibe | null;
}

type FilterType = 'dj' | 'polls' | 'games' | 'takeovers';

const GEMINI_CALL_LIMIT = 50;
const GEMINI_LIMIT_KEY = 'nam-radio-gemini-limit';

const LiveChat: React.FC<LiveChatProps> = ({ recentlyPlayed, currentUser, dominantVibe }) => {
  const [messages, setMessages] = useState<Message[]>([{ id: 1, type: 'text', author: 'DJ Alex', text: 'Welcome to the live chat! Drop a message and say hi!', isDj: true }]);
  const [newMessage, setNewMessage] = useState('');
  const [votedIds, setVotedIds] = useState<number[]>([]);
  const [isDjTyping, setIsDjTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const djMessageTimer = useRef<number | null>(null);
  const [filters, setFilters] = useState<Record<FilterType, boolean>>({
    dj: true,
    polls: true,
    games: true,
    takeovers: true,
  });

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
    // If all filters are on, no need to filter
    if (Object.values(filters).every(v => v)) return messages;
    
    return messages.filter(msg => {
      // Always show the user's own messages
      if (msg.author === userHandle) return true;
      
      if (msg.type === 'poll') return filters.polls;
      if (msg.type === 'game') return filters.games;
      if (msg.type === 'takeover') return filters.takeovers;
      if (msg.isDj) return filters.dj;
      
      // Show non-dj text messages by default if no specific filter applies
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

        if (chance < 0.15) { // 15% chance for Listener Takeover
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

        } else if (chance < 0.30) { // 15% chance for a poll
            setMessages(prev => {
                const unpostedPolls = djPolls.filter(p => !prev.some(m => m.type === 'poll' && m.question === p.question));
                if (unpostedPolls.length > 0) {
                  const randomPoll = unpostedPolls[Math.floor(Math.random() * unpostedPolls.length)];
                  return [...prev, { ...randomPoll, id: Date.now(), type: 'poll', author: 'DJ Alex', isDj: true }];
                }
                return prev;
            });

        } else if (chance < 0.45) { // 15% chance for Guess the Song
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
        } else if (chance < 0.65) { // 20% chance for chit-chat
            if (recentlyPlayed.length > 0) {
                if (getGeminiCallCount().count >= GEMINI_CALL_LIMIT) { return; }
                incrementGeminiCallCount();
                setIsDjTyping(true);
                const chitchat = await generateDjChitchat(recentlyPlayed);
                setIsDjTyping(false);
                setMessages(prev => [...prev, { id: Date.now(), type: 'text', author: 'DJ Alex', text: chitchat, isDj: true }]);
            }
        } else if (chance < 0.80 && dominantVibe) { // 15% chance for vibe commentary
             if (getGeminiCallCount().count >= GEMINI_CALL_LIMIT) { return; }
             incrementGeminiCallCount();
             setIsDjTyping(true);
             const vibeComment = await generateVibeCommentary(dominantVibe.label);
             setIsDjTyping(false);
             setMessages(prev => [...prev, { id: Date.now(), type: 'text', author: 'DJ Alex', text: vibeComment, isDj: true }]);
        }

        const nextPostDelay = Math.random() * (90000 - 45000) + 45000;
        djMessageTimer.current = window.setTimeout(postDjEvent, nextPostDelay);
    };

    djMessageTimer.current = window.setTimeout(postDjEvent, 25000); 
    return () => { if (djMessageTimer.current) clearTimeout(djMessageTimer.current) };
  }, [recentlyPlayed, dominantVibe]); 
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage) return;

    const userMessage: Message = { id: Date.now(), type: 'text', author: userHandle, text: trimmedMessage, isDj: false };
    setMessages(prev => [...prev, userMessage]);
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

        let gameToEnd: GameMessage | undefined;
        setMessages(prev => {
            const gameIndex = prev.map(m => m.type === 'game' && m.winner === null).lastIndexOf(true);
            if (gameIndex === -1) return prev;
            const newMessages = [...prev];
            const game = newMessages[gameIndex] as GameMessage;
            if (guess.toLowerCase() === game.answer.toLowerCase()) {
                gameToEnd = { ...game, winner: userHandle };
                newMessages[gameIndex] = gameToEnd;
            }
            return newMessages;
        });

        if (gameToEnd) {
             const shoutout = `🎉 We have a winner! Congrats ${userHandle} for guessing "${gameToEnd.answer}" correctly! Great job!`;
             const winnerMessage: Message = { id: Date.now() + 1, type: 'text', author: 'DJ Alex', text: shoutout, isDj: true };
             setMessages(prev => [...prev, winnerMessage]);
        }
    }
  };


  const handleVote = (messageId: number, optionIndex: number, type: 'poll' | 'takeover') => {
    if (votedIds.includes(messageId)) return;
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
    setVotedIds(prev => [...prev, messageId]);
  }
  
  const FilterButton: React.FC<{ filter: FilterType; label: string }> = ({ filter, label }) => (
    <button onClick={() => toggleFilter(filter)} className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${filters[filter] ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}>
      {label}
    </button>
  );

  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50 flex flex-col h-[40rem]">
      <h2 className="text-2xl font-bold mb-2 tracking-wide text-amber-300">Live Shoutbox</h2>
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
            return (
              <div key={msg.id} className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 animate-fade-in">
                <span className="text-xs font-bold block text-amber-200">{msg.author} posted a poll:</span>
                <p className="font-semibold text-white my-2">{msg.question}</p>
                <div className="space-y-2">
                  {msg.options.map((option, index) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                    return (
                      <button key={index} onClick={() => handleVote(msg.id, index, 'poll')} disabled={votedIds.includes(msg.id)} className="w-full text-left p-2 rounded-md bg-slate-700/50 relative overflow-hidden disabled:cursor-not-allowed group">
                        <div className="absolute top-0 left-0 h-full bg-amber-500/60 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                        <div className="relative flex justify-between items-center"><span className="text-sm font-medium text-white">{option.text}</span>{votedIds.includes(msg.id) && <span className="text-xs font-bold text-slate-300">{option.votes} ({Math.round(percentage)}%)</span>}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
          if (msg.type === 'takeover') {
            const hasVoted = votedIds.includes(msg.id);
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