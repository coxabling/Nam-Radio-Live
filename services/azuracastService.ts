
import { AZURACAST_BASE_URL, AZURACAST_STATION_ID, RECENTLY_PLAYED } from '../constants';
import { ApiScheduleItem, Song, RequestableSong } from '../types';

// Interfaces for the AzuraCast API responses
interface AzuraNowPlayingSong {
    id: string;
    text: string;
    artist: string;
    title: string;
    album: string;
    genre: string;
    art: string;
}

export interface AzuraNowPlayingResponse {
    now_playing: {
        song: AzuraNowPlayingSong;
    };
    song_history: {
        song: AzuraNowPlayingSong;
    }[];
}

interface AzuraScheduleItem {
    id: number;
    start_timestamp: number;
    end_timestamp: number;
    name: string;
    description: string;
    is_now: boolean;
    // AzuraCast schedule items don't have images, so we'll handle this in mapping
}

const getDetailedFetchError = (error: unknown): Error => {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const errorMessage = `Could not connect to the radio server at ${AZURACAST_BASE_URL}. This is often a CORS (Cross-Origin Resource Sharing) issue. 
        Please ensure your AzuraCast server is configured to allow requests from this web app's domain.
        You can usually configure this in your AzuraCast instance under 'Administration' > 'System Settings' > 'Security & Privacy' by adding this app's URL to the 'Always Allow Cross-Origin Resource Sharing (CORS)' field.`;
        return new Error(errorMessage);
    }
    return error instanceof Error ? error : new Error('An unknown network error occurred.');
};


/**
 * Fetches the live schedule from the AzuraCast API.
 * @returns A promise that resolves to an array of ApiScheduleItem.
 */
export const getSchedule = async (): Promise<ApiScheduleItem[]> => {
    try {
        const response = await fetch(`${AZURACAST_BASE_URL}/api/station/${AZURACAST_STATION_ID}/schedule`);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data: AzuraScheduleItem[] = await response.json();
        
        // Map the AzuraCast schedule format to our app's format
        return data.map(item => ({
            id: item.id,
            start: new Date(item.start_timestamp * 1000).toISOString(),
            end: new Date(item.end_timestamp * 1000).toISOString(),
            name: item.name,
            description: item.description,
            is_now: item.is_now,
            imageUrl: `https://picsum.photos/seed/${item.name.replace(/\s+/g, '')}/1920/1080` // Generate a consistent placeholder image
        }));
    } catch (error) {
        console.error("Failed to fetch AzuraCast schedule:", error);
        throw getDetailedFetchError(error); // Re-throw detailed error to be handled by the component
    }
};

/**
 * Fetches the currently playing song and song history from AzuraCast.
 * @returns A promise that resolves to an object containing the current song and history.
 */
export const getNowPlaying = async (): Promise<{ currentSong: Song, history: Song[] }> => {
    try {
        const response = await fetch(`${AZURACAST_BASE_URL}/api/nowplaying/${AZURACAST_STATION_ID}`);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data: AzuraNowPlayingResponse = await response.json();
        
        const currentSong: Song = {
            title: data.now_playing.song.title || 'Unknown Title',
            artist: data.now_playing.song.artist || 'Unknown Artist',
        };

        const history: Song[] = data.song_history.map(item => ({
            title: item.song.title,
            artist: item.song.artist
        }));
        
        return { currentSong, history };
    } catch (error) {
        const detailedError = getDetailedFetchError(error);
        console.error("Failed to fetch AzuraCast now playing data:", detailedError.message);
        // Fallback to mock data to "ignore" the fetch error from a UX perspective.
        return {
            currentSong: RECENTLY_PLAYED[0],
            history: RECENTLY_PLAYED.slice(1)
        };
    }
};

/**
 * Fetches the list of requestable songs from AzuraCast.
 * @returns A promise that resolves to an array of RequestableSong.
 */
export const getRequestableSongs = async (): Promise<RequestableSong[]> => {
    try {
        const response = await fetch(`${AZURACAST_BASE_URL}/api/station/${AZURACAST_STATION_ID}/requests`);
        if (!response.ok) {
            throw new Error(`Network response for requestable songs was not ok: ${response.statusText}`);
        }
        const data: RequestableSong[] = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch requestable songs:", getDetailedFetchError(error).message);
        return []; // Return an empty list on failure to prevent crashes.
    }
};

/**
 * Submits a song request to the AzuraCast station.
 * @param requestId - The unique ID of the song to request.
 * @returns A promise that resolves to an object indicating success and a message.
 */
export const submitSongRequest = async (requestId: string): Promise<{ success: boolean; message: string; }> => {
    try {
        const response = await fetch(`${AZURACAST_BASE_URL}/api/station/${AZURACAST_STATION_ID}/request/${requestId}`, {
            method: 'POST',
        });
        const data = await response.json();
        if (!response.ok) {
            // Use the server's error message if available
            throw new Error(data.message || `Failed to submit request. Server responded with status: ${response.status}`);
        }
        return { success: true, message: data.message || 'Request submitted successfully!' };
    } catch (error) {
        const detailedError = getDetailedFetchError(error);
        console.error("Failed to submit song request:", detailedError.message);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: errorMessage };
    }
};
