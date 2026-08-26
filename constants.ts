import { Dj, ApiScheduleItem, Article, Song } from './types';

export const AZURACAST_BASE_URL = 'https://music-station.live';
export const AZURACAST_STATION_ID = 'namradio';
export const AZURACAST_API_KEY = 'api-e1228a28120a75dd:0099d04c27a8e7d2e3da6746f412b6a6';


export const DJS: Dj[] = [
  {
    id: 1,
    name: "DJ Alex",
    show: "Sunrise Beats",
    bio: "Kicking off your day with the best upbeat tracks and positive vibes.",
    imageUrl: "https://picsum.photos/seed/djalex/200/200",
  },
  {
    id: 2,
    name: "Chloe",
    show: "Midday Mix",
    bio: "The perfect soundtrack for your lunch break, full of indie gems.",
    imageUrl: "https://picsum.photos/seed/djchloe/200/200",
  },
  {
    id: 3,
    name: "Rick Blast",
    show: "Afternoon Chill",
    bio: "Winding down your afternoon with smooth lo-fi beats and ambient soundscapes.",
    imageUrl: "https://picsum.photos/seed/djrick/200/200",
  },
  {
    id: 4,
    name: "DJ Nova",
    show: "Drive Time Power Hour",
    bio: "Powering your commute with the biggest hits and throwbacks.",
    imageUrl: "https://picsum.photos/seed/djnova/200/200",
  },
  {
    id: 5,
    name: "Samira",
    show: "Morning Fresh",
    bio: "Bringing you the latest hits and trending music to start your day right.",
    imageUrl: "https://picsum.photos/seed/djsamira/200/200",
  },
  {
    id: 6,
    name: "Marco",
    show: "Global Grooves",
    bio: "A journey through the best sounds from around the world.",
    imageUrl: "https://picsum.photos/seed/djmarco/200/200",
  },
  {
    id: 7,
    name: "Leo",
    show: "Indie Spotlight",
    bio: "Your weekly dose of the best new independent artists.",
    imageUrl: "https://picsum.photos/seed/djleo/200/200",
  },
];


// Mock schedule data to be used as a fallback due to CORS issues with the live API.
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

const today = getTodayDateString();
const tomorrow = getTomorrowDateString();

// Note: Using UTC times (Z) for consistency
export const WEEKLY_SCHEDULE: ApiScheduleItem[] = [
  // Today's schedule
  { id: 101, start: `${today}T09:00:00Z`, end: `${today}T11:00:00Z`, name: 'Sunrise Beats', description: 'Kickstart your day with energetic tracks.', is_now: false, imageUrl: 'https://picsum.photos/seed/sunrise/1920/1080' },
  { id: 102, start: `${today}T11:00:00Z`, end: `${today}T13:00:00Z`, name: 'Midday Mix', description: 'The perfect lunchtime soundtrack.', is_now: false, imageUrl: 'https://picsum.photos/seed/midday/1920/1080' },
  { id: 103, start: `${today}T14:00:00Z`, end: `${today}T16:00:00Z`, name: 'Afternoon Chill', description: 'Relax and unwind with smooth vibes.', is_now: false, imageUrl: 'https://picsum.photos/seed/chill/1920/1080' },
  { id: 104, start: `${today}T18:00:00Z`, end: `${today}T20:00:00Z`, name: 'Drive Time Power Hour', description: 'Hits to get you through the evening commute.', is_now: false, imageUrl: 'https://picsum.photos/seed/drive/1920/1080' },
  { id: 105, start: `${today}T21:00:00Z`, end: `${today}T22:00:00Z`, name: 'Community Countdown', description: 'Your top 10 most-liked songs of the week, counted down!', is_now: false, imageUrl: 'https://picsum.photos/seed/countdown/1920/1080' },
  
  // Tomorrow's schedule
  { id: 201, start: `${tomorrow}T09:00:00Z`, end: `${tomorrow}T11:00:00Z`, name: 'Morning Fresh', description: 'The latest hits and trending music.', is_now: false, imageUrl: 'https://picsum.photos/seed/fresh/1920/1080' },
  { id: 202, start: `${tomorrow}T11:00:00Z`, end: `${tomorrow}T13:00:00Z`, name: 'Global Grooves', description: 'A journey through world music.', is_now: false, imageUrl: 'https://picsum.photos/seed/global/1920/1080' },
  { id: 203, start: `${tomorrow}T14:00:00Z`, end: `${tomorrow}T16:00:00Z`, name: 'Indie Spotlight', description: 'Featuring the best new independent artists.', is_now: false, imageUrl: 'https://picsum.photos/seed/indie/1920/1080' },
  { id: 204, start: `${tomorrow}T20:00:00Z`, end: `${tomorrow}T21:00:00Z`, name: 'Local Spotlight', description: 'Championing the best music from Namibian artists.', is_now: false, imageUrl: 'https://picsum.photos/seed/spotlight/1920/1080' },
];

export const RECENTLY_PLAYED: Song[] = [
    { title: 'Blinding Lights', artist: 'The Weeknd' },
    { title: 'As It Was', artist: 'Harry Styles' },
    { title: 'Levitating', artist: 'Dua Lipa' },
    { title: 'Good 4 U', artist: 'Olivia Rodrigo' },
];

// FIX: Corrected a typo in the constant name from `TAKEOver_SONGS` to `TAKEOVER_SONGS` to match the import in LiveChat.tsx.
export const TAKEOVER_SONGS: Song[] = [
    { artist: "Queen", title: "Bohemian Rhapsody" },
    { artist: "Nirvana", title: "Smells Like Teen Spirit" },
    { artist: "Michael Jackson", title: "Billie Jean" },
    { artist: "The Beatles", title: "Hey Jude" },
    { artist: "Led Zeppelin", title: "Stairway to Heaven" },
    { artist: "Eagles", title: "Hotel California" },
    { artist: "ABBA", title: "Dancing Queen" },
    { artist: "Oasis", title: "Wonderwall" },
    { artist: "Bob Marley", title: "No Woman, No Cry" },
    { artist: "U2", title: "With or Without You" },
    { artist: "Fleetwood Mac", title: "Dreams" },
    { artist: "Red Hot Chili Peppers", title: "Under the Bridge" },
    { artist: "The Killers", title: "Mr. Brightside" },
    { artist: "Adele", title: "Rolling in the Deep" },
    { artist: "Beyoncé", title: "Crazy in Love" },
    { artist: "Daft Punk", title: "Get Lucky" },
    { artist: "Arctic Monkeys", title: "Do I Wanna Know?" },
    { artist: "Coldplay", title: "Viva La Vida" },
    { artist: "Foster The People", title: "Pumped Up Kicks" },
    { artist: "Gotye", title: "Somebody That I Used to Know" },
];