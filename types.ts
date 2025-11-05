


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


export type Message = TextMessage | PollMessage | GameMessage | TakeoverMessage;

export interface Song {
  title: string;
  artist: string;
}

export interface SongRequestRecord {
  title: string;
  artist: string;
  requestedAt: string; // ISO String
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
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: (props: { className?: string }) => ReactElement;
  isEarned: (stats: ListeningStats, songRequests: SongRequestRecord[]) => boolean;
}