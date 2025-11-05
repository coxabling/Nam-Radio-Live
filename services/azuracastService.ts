
import { WEEKLY_SCHEDULE, RECENTLY_PLAYED } from '../constants';
import { ApiScheduleItem, Song, RequestableSong } from '../types';

/**
 * Returns the mock schedule data.
 * @returns A promise that resolves to an array of ApiScheduleItem.
 */
export const getSchedule = async (): Promise<ApiScheduleItem[]> => {
    console.log("Using mock schedule data.");
    // Simulate a short network delay
    await new Promise(res => setTimeout(res, 250));
    return Promise.resolve(WEEKLY_SCHEDULE);
};

/**
 * Returns the mock "now playing" song and history.
 * @returns A promise that resolves to an object containing the current song and history.
 */
export const getNowPlaying = async (): Promise<{ currentSong: Song, history: Song[] }> => {
    // This function is now less critical as App.tsx simulates show changes, 
    // but it's used for initial song data.
    return Promise.resolve({
        currentSong: RECENTLY_PLAYED[0],
        history: RECENTLY_PLAYED.slice(1)
    });
};

/**
 * Returns an empty list for requestable songs in mock mode.
 * @returns A promise that resolves to an empty array.
 */
export const getRequestableSongs = async (): Promise<RequestableSong[]> => {
    console.log("Using mock requestable songs (empty list).");
    return Promise.resolve([]);
};

/**
 * Simulates submitting a song request in mock mode.
 * @param requestId - The unique ID of the song to request.
 * @returns A promise that resolves to a mock success message.
 */
export const submitSongRequest = async (requestId: string): Promise<{ success: boolean; message: string; }> => {
    console.log(`Simulating song request submission for ID: ${requestId}`);
    // Simulate a short network delay
    await new Promise(res => setTimeout(res, 500));
    return Promise.resolve({ success: true, message: 'Request submitted successfully! (Demo Mode)' });
};
