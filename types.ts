import { ReactElement } from 'react';

export interface Dj {
  id: number;
  name: string;
  show: string;
  bio: string;
  imageUrl: string;
}

export interface Article {
  id:string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category?: string;
  summary?: string;
}

export interface ApiScheduleItem {
  id: number;
  start: string;
  end: string;
  name: string;
  description: string;
  is_now: boolean;
  imageUrl?: string;
}

export interface PollOption {
  text: string;
  votes: number;
}

export interface TextMessage {
  id: number;
  type: 'text';
  author: string;
  text: string;
  isDj: boolean;
}

export interface PollMessage {
  id: number;
  type: 'poll';
  author: string;
  question: string;
  options: PollOption[];
  isDj: boolean;
}

export interface GameMessage {
  id: number;
  type: 'game';
  author: string;
  clue: string;
  answer: string; // Stored as "Song Title"
  winner: string | null;
  isDj: boolean;
}

export interface TriviaMessage {
  id: number;
  type: 'trivia';
  author: string;
  question: string;
  answer: string;
  winner: string | null;
  isDj: boolean;
}

export interface TakeoverSong {
  title: string;
  artist: string;
  votes: number;
}

export interface TakeoverMessage {
  id: number;
  type: 'takeover';
  author: string;
  text: string; // e.g., "Listener Takeover! Vote for the next song!"
  options: [TakeoverSong, TakeoverSong];
  status: 'voting' | 'finished';
  winner: Song | null;
  isDj: boolean;
}

export interface PersonalizedMessage {
  id: number;
  type: 'personalized';
  author: string;
  text: string;
  isDj: boolean;
  recipient: string; // username
}

export interface OnThisDayMessage {
  id: number;
  type: 'on_this_day';
  author: string;
  text: string;
  isDj: boolean;
}

export interface LevelUpMessage {
  id: number;
  type: 'level_up';
  author: string; // DJ Alex
  text: string; // The generated shoutout
  isDj: boolean;
  recipient: string; // username of who leveled up
  levelName: string;
}


export type Message = TextMessage | PollMessage | GameMessage | TakeoverMessage | PersonalizedMessage | OnThisDayMessage | LevelUpMessage | TriviaMessage;

export interface LiveNowPlaying {
    song: Song;
    show: ApiScheduleItem | null;
}

export interface Song {
  title: string;
  artist: string;
  origin?: string;
  artUrl?: string;
}

export interface SongRequestRecord {
  title: string;
  artist: string;
  requestedAt: string; // ISO String
}

// FIX: Add DedicationRecord type for the new feature.
export interface DedicationRecord {
  song: Song;
  to: string;
  from: string;
  message: string;
}

export interface RequestableSong {
  request_id: string;
  song: {
    id: string;
    text: string;
    artist: string;
    title: string;
    art: string;
  };
}

export type VibeType = 'hype' | 'chill' | 'focus' | 'party';

export interface Vibe {
  type: VibeType;
  emoji: string;
  label: string;
  count: number;
}

export interface SongRating {
  id: string; // "Title - Artist"
  timestamp: number; // Date.now()
}

export interface ListeningStats {
  totalListeningTime: number; // in seconds
  monthlyListeningTime: number;
  lastUpdated: string; // ISO string for monthly reset
  showListeningTime: Record<string, number>; // Show name -> seconds
  hasListenedPostMidnight: boolean; // For Night Owl badge
  chatMessagesSent: number;
  votesCast: number;
  points: number;
  likedSongs: SongRating[];
  dislikedSongs: SongRating[];
  listeningTimeByHour: Record<number, number>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: (props: { className?: string }) => ReactElement;
  isEarned: (stats: ListeningStats, songRequests: SongRequestRecord[]) => boolean;
}

export interface ListenerLevel {
  name: string;
  minPoints: number;
  color: string; // e.g., 'ring-slate-500'
}

export interface MusicEvent {
  eventName: string;
  date: string;
  venue: string;
  description: string;
  sourceUrl?: string;
  imageUrl?: string;
}

export interface SongOfTheWeek {
  title: string;
  artist: string;
  description: string;
}

export interface AzuraListeners {
    total: number;
    unique: number;
    current: number;
}

export interface StationStats {
    listeners: AzuraListeners;
}

export interface AzuraListenersReport {
    total: {
        avg_listeners: number;
        max_listeners: number;
    };
    tlh: {
        text: string; // e.g., "16 hours, 2 minutes"
    };
}

export interface AzuraPerformanceReportItem {
    song: Song;
    stat_start: number;
    stat_end: number;
    listeners_start: number;
    listeners_end: number;
    delta_total: number;
    play_count: number;
    stat_count: number;
}

export interface AzuraHistoryItem {
    played_at: number;
    song: Song;
}