import { AZURACAST_BASE_URL, AZURACAST_STATION_ID, WEEKLY_SCHEDULE } from '../constants';
import { ApiScheduleItem, Song, RequestableSong, AzuraListeners, AzuraListenersReport, AzuraPerformanceReportItem, AzuraHistoryItem } from '../types';

// AzuraCast raw API types (for internal mapping)
interface AzuraNowPlayingSong {
  title: string;
  artist: string;
  art: string;
}

interface AzuraNowPlaying {
  listeners: AzuraListeners;
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
 * Fetches the live schedule from AzuraCast.
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
        console.error("Failed to fetch live schedule.", error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error("Could not connect to the radio server to get the schedule. This might be a CORS issue on the AzuraCast server. Please check the browser console for more details.");
        }
        throw error;
    }
};

/**
 * Fetches live "now playing" data from AzuraCast.
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
            artUrl: data.now_playing.song.art,
        };
        const history: Song[] = data.song_history.map(item => ({
            title: item.song.title,
            artist: item.song.artist,
            artUrl: item.song.art,
        }));
        
        return { currentSong, history, showName: data.now_playing.playlist || null };

    } catch (error) {
        console.error("Failed to fetch live now-playing data.", error);
        throw error;
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

// Admin Dashboard Services

export const getLiveStats = async (): Promise<AzuraListeners> => {
    try {
        const response = await fetch(`${AZURACAST_BASE_URL}/api/nowplaying/${AZURACAST_STATION_ID}`);
        if (!response.ok) throw new Error(`Network response was not ok`);
        const data: AzuraNowPlaying = await response.json();
        return data.listeners;
    } catch (error) {
        console.error("Failed to fetch live stats.", error);
        throw error;
    }
};

export const getListenerReport = async (): Promise<AzuraListenersReport> => {
    try {
        const response = await fetch(`${AZURACAST_BASE_URL}/api/station/${AZURACAST_STATION_ID}/listeners`);
        if (!response.ok) throw new Error(`Network response was not ok`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch listener report.", error);
        throw error;
    }
};

export const getPerformanceReport = async (): Promise<AzuraPerformanceReportItem[]> => {
    try {
        const response = await fetch(`${AZURACAST_BASE_URL}/api/station/${AZURACAST_STATION_ID}/performance`);
        if (!response.ok) throw new Error(`Network response was not ok`);
        const data: AzuraPerformanceReportItem[] = await response.json();
        // Return top 10 by play count
        return data.sort((a,b) => b.play_count - a.play_count).slice(0, 10);
    } catch (error) {
        console.error("Failed to fetch performance report.", error);
        throw error;
    }
};

export const getSongHistory = async (): Promise<AzuraHistoryItem[]> => {
    try {
        const response = await fetch(`${AZURACAST_BASE_URL}/api/station/${AZURACAST_STATION_ID}/history`);
        if (!response.ok) throw new Error(`Network response was not ok`);
        // Return last 10 songs
        const data: AzuraHistoryItem[] = await response.json();
        return data.slice(0, 10);
    } catch (error) {
        console.error("Failed to fetch song history.", error);
        throw error;
    }
};