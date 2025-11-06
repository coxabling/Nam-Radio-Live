import { ReactElement } from 'react';

export interface Dj {
  id: number;
  name: string;
  show: string;
  bio: string;
  imageUrl: string;
}

export interface Article {
  id: string;
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
  answer: string; // Stored as "Song Title - Artist"
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


export type Message = TextMessage | PollMessage | GameMessage | TakeoverMessage | PersonalizedMessage;

export interface Song {
  title: string;
  artist: string;
  origin?: string;
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

export interface ListeningStats {
  totalListeningTime: number; // in seconds
  monthlyListeningTime: number;
  lastUpdated: string; // ISO string for monthly reset
  showListeningTime: Record<string, number>; // Show name -> seconds
  hasListenedPostMidnight: boolean; // For Night Owl badge
  chatMessagesSent: number;
  votesCast: number;
  points: number;
  likedSongs: string[]; // Stored as "Title - Artist"
  dislikedSongs: string[]; // Stored as "Title - Artist"
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: (props: { className?: string }) => ReactElement;
  isEarned: (stats: ListeningStats, songRequests: SongRequestRecord[]) => boolean;
}

export interface MusicEvent {
  eventName: string;
  date: string;
  venue: string;
  description: string;
  sourceUrl?: string;
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