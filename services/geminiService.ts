
import { GoogleGenAI, Type } from "@google/genai";
import { Song, SongRequestRecord } from '../types';

const getGeminiApiKey = (): string => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
  }
  return apiKey;
};

// Existing function for song requests
export const getDjConfirmation = async (songTitle: string, artistName: string, userName:string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const prompt = `You are a cool and charismatic radio DJ for a modern online station called "Nam Radio Live". A listener named ${userName} just requested the song "${songTitle}" by "${artistName}". Write a short, creative, and exciting confirmation message for them (2-3 sentences). Mention the song and their name. Your tone should be friendly and energetic.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
  } catch (error) {
    console.error("Error fetching DJ confirmation:", error);
    return "Looks like we've got some technical difficulties on the line! We got your request, but our AI DJ is taking a quick coffee break. We'll get that tune on for you soon!";
  }
};

// Existing function for the !ask command
export const getAiChatResponse = async (query: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const prompt = `You are a helpful and charismatic radio DJ for "Nam Radio Live". A listener asks: "${query}". Use your knowledge and search the web to give a friendly and informative answer. Keep it conversational and concise. If you provide information from a search, phrase it in your own words.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{googleSearch: {}}] } });
    return response.text;
  } catch (error) {
    console.error("Error fetching AI chat response:", error);
    return "Sorry, my connection to the web is a bit fuzzy right now! Ask me again in a bit.";
  }
};

// Existing function for random DJ chatter
export const generateDjChitchat = async (recentlyPlayed: Song[]): Promise<string> => {
    if (recentlyPlayed.length === 0) return "Keep the vibes going! Let me know what you want to hear next.";
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const song = recentlyPlayed[Math.floor(Math.random() * recentlyPlayed.length)];
        const prompt = `You are a cool and charismatic radio DJ for "Nam Radio Live". The song "${song.title}" by ${song.artist} just played. Write a very short, engaging, and creative comment about it for the live chat (1-2 sentences). Your tone should be friendly and energetic.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating DJ chitchat:", error);
        const song = recentlyPlayed[Math.floor(Math.random() * recentlyPlayed.length)];
        return `What a tune! That was ${song.title} by ${song.artist}. What's next?`;
    }
};

// --- NEW FEATURES ---

// For "More About The Music" in NowPlaying
export const getSongFunFact = async (song: Song): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const prompt = `You are a charismatic radio DJ. Tell me a fun fact or a short, interesting story about the song '${song.title}' by ${song.artist}. Keep it concise and engaging, like you're sharing a cool piece of trivia on air.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{googleSearch: {}}] }});
    return response.text;
  } catch (error) {
    console.error("Error fetching song fun fact:", error);
    return "Couldn't dig up any trivia on that one, but it's a certified banger!";
  }
};

// For "My Station" Hub recommendations
export const getShowRecommendations = async (
    favoriteShowNames: string[],
    allShowNames: string[],
    songRequests: SongRequestRecord[]
): Promise<string> => {
    if (favoriteShowNames.length === 0 && songRequests.length === 0) {
        return "You haven't favorited any shows or requested any songs yet! Star a show on the main schedule or request a song, then come back here for your personalized recommendations.";
    }
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const otherShows = allShowNames.filter(show => !favoriteShowNames.includes(show));

        let prompt = `You are "DJ Alex", Nam Radio Live's AI curator, known for your great taste and finding hidden gems. A listener has this profile:\n`;
        if (favoriteShowNames.length > 0) {
            prompt += `- Their favorite shows are: "${favoriteShowNames.join(', ')}".\n`;
        }
        if (songRequests.length > 0) {
            const requestedSongs = songRequests.map(r => `"${r.title}" by ${r.artist}`).join(', ');
            prompt += `- They've recently requested: ${requestedSongs}.\n`;
        }
        prompt += `Looking at our other shows ("${otherShows.join(', ')}"), pick up to 3 that you think they'll absolutely love. Give a short, punchy, one-sentence reason for each, like you're talking to them on air. Make it exciting! Format it as a simple list with show names in bold.`;
        
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error getting show recommendations:", error);
        return "Our recommendation engine is taking a quick nap. Please try again in a moment!";
    }
};

// For "Content Hub" summaries
export const getArticleSummary = async (articleTitle: string, articleSource: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const prompt = `Please provide a concise, 2-3 sentence summary of the news article titled "${articleTitle}" from the source "${articleSource}". The summary should be neutral and informative, suitable for a radio app's content hub.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{googleSearch: {}}] }});
        return response.text;
    } catch (error) {
        console.error("Error getting article summary:", error);
        return "Could not generate a summary for this article. Please check the full story at the source.";
    }
};

// For "Listener Takeover" events in LiveChat
export const generateTakeoverAnnouncement = async (songA: Song, songB: Song): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const prompt = `You are a radio DJ. Announce a vote between "${songA.title}" by ${songA.artist} and "${songB.title}" by ${songB.artist}. Make it exciting and encourage listeners to vote in the chat.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating takeover announcement:", error);
        return `It's time for a LISTENER TAKEOVER! Vote now: "${songA.title}" or "${songB.title}"?`;
    }
};

export const generateTakeoverWinnerShoutout = async (winningSong: Song): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const prompt = `You are an energetic radio DJ. The "Listener Takeover" vote just ended. The winning song is "${winningSong.title}" by ${winningSong.artist}. Write a short, exciting shoutout announcing the winner and that you're playing the song next.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating takeover winner shoutout:", error);
        return `The people have spoken! The winner is "${winningSong.title}" by ${winningSong.artist}! Cranking it up now!`;
    }
};

// For "Guess the Song" game in LiveChat
export const generateSongClue = async (song: Song): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const prompt = `You are a radio DJ hosting a "Guess the Song" game. The song is "${song.title}" by ${song.artist}. Create a short, clever, riddle-like clue about the song's title. The clue should NOT contain the title itself. Make it fun!`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating song clue:", error);
        return `This one's a classic from ${song.artist}. Can you name it?`;
    }
};
