
import { AZURACAST_BASE_URL, AZURACAST_STATION_ID, WEEKLY_SCHEDULE, RECENTLY_PLAYED } from '../constants';
import { ApiScheduleItem, Song, RequestableSong } from '../types';

// AzuraCast raw API types (for internal mapping)
interface AzuraNowPlayingSong {
  title: string;
  artist: string;
}

interface AzuraNowPlaying {
  now_playing: {
    song: AzuraNowPlayingSong;
    playlist: string; // This is the show name
  };
  song_history: { song: AzuraNowPlayingSong }[];
}

interface AzuraScheduleItem {
    id: number;
    start_timestamp: number;
    end_timestamp: number;
    name: string;
    description: string;
    is_now: boolean;
}

// Function to map AzuraCast schedule to our app's type
const mapAzuraSchedule = (azuraSchedule: AzuraScheduleItem[]): ApiScheduleItem[] => {
    return azuraSchedule.map(azuraShow => {
        // Find a matching mock show to get an image URL, as AzuraCast API doesn't provide one.
        const mockShow = WEEKLY_SCHEDULE.find(mock => mock.name === azuraShow.name);
        return {
            id: azuraShow.id,
            start: new Date(azuraShow.start_timestamp * 1000).toISOString(),
            end: new Date(azuraShow.end_timestamp * 1000).toISOString(),
            name: azuraShow.name,
            description: azuraShow.description,
            is_now: azuraShow.is_now,
            imageUrl: mockShow?.imageUrl,
        };
    });
};

/**
 * Fetches the live schedule from AzuraCast, falling back to mock data on failure.
 */
export const getSchedule = async (): Promise<ApiScheduleItem[]> => {
    try {
        const response = await fetch(`${AZURACAST_BASE_URL}/api/station/${AZURACAST_STATION_ID}/schedule`);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data: AzuraScheduleItem[] = await response.json();
        return mapAzuraSchedule(data);
    } catch (error) {
        console.error("Failed to fetch live schedule, using fallback mock data.", error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
            console.warn("This might be a CORS issue. Please ensure your AzuraCast instance allows requests from this domain.");
        }
        return WEEKLY_SCHEDULE;
    }
};

/**
 * Fetches live "now playing" data from AzuraCast, falling back to mock data on failure.
 */
export const getNowPlaying = async (): Promise<{ currentSong: Song, history: Song[], showName: string | null }> => {
    try {
        const response = await fetch(`${AZURACAST_BASE_URL}/api/nowplaying/${AZURACAST_STATION_ID}`);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data: AzuraNowPlaying = await response.json();
        
        const currentSong: Song = {
            title: data.now_playing.song.title,
            artist: data.now_playing.song.artist,
        };
        const history: Song[] = data.song_history.map(item => ({
            title: item.song.title,
            artist: item.song.artist
        }));
        
        return { currentSong, history, showName: data.now_playing.playlist || null };

    } catch (error) {
        console.error("Failed to fetch live now-playing data, using fallback mock data.", error);
        const now = new Date();
        const currentMockShow = WEEKLY_SCHEDULE.find(show => {
            const start = new Date(show.start);
            const end = new Date(show.end);
            return start <= now && end > now;
        }) || null;

        return {
            currentSong: RECENTLY_PLAYED[0],
            history: RECENTLY_PLAYED.slice(1),
            showName: currentMockShow?.name || "Nam Radio Live"
        };
    }
};

/**
 * Fetches requestable songs from AzuraCast. Falls back to an empty list on failure.
 */
export const getRequestableSongs = async (): Promise<RequestableSong[]> => {
    try {
        const response = await fetch(`${AZURACAST_BASE_URL}/api/station/${AZURACAST_STATION_ID}/requests`);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data: RequestableSong[] = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch requestable songs.", error);
        return [];
    }
};

/**
 * Submits a song request to the AzuraCast API.
 */
export const submitSongRequest = async (requestId: string): Promise<{ success: boolean; message: string; }> => {
    try {
        const url = `${AZURACAST_BASE_URL}/api/station/${AZURACAST_STATION_ID}/request/${requestId}`;
        const response = await fetch(url, { method: 'POST' });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to submit request.');
        }

        return { success: true, message: data.message };
    } catch (error: any) {
        console.error("Failed to submit song request:", error);
        return { success: false, message: error.message || 'Could not connect to the server.' };
    }
};
