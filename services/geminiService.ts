import { GoogleGenAI, Type } from "@google/genai";
// FIX: Import DedicationRecord for the new feature.
import { Song, SongRequestRecord, DedicationRecord, MusicEvent, ApiScheduleItem, SongOfTheWeek } from '../types';

const getGeminiApiKey = (): string => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
  }
  return apiKey;
};

// ... existing functions ...
export const getDjConfirmation = async (songTitle: string, artistName: string, userName:string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const prompt = `You are a cool and charismatic radio DJ for a modern online station called "Nam Radio Live". A listener named ${userName} just requested the song "${songTitle}" by "${artistName}". Write a short, creative, and exciting confirmation message for them (2-3 sentences). Mention the song and their name. Your tone should be friendly and energetic.`;
    // FIX: Corrected model name from 'gem-2.5-flash' to 'gemini-2.5-flash'
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
  } catch (error) {
    console.error("Error fetching DJ confirmation:", error);
    return "Looks like we've got some technical difficulties on the line! We got your request, but our AI DJ is taking a quick coffee break. We'll get that tune on for you soon!";
  }
};

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

export const generateDjChitchat = async (recentlyPlayed: Song[]): Promise<string> => {
    if (recentlyPlayed.length === 0) return "Keep the vibes going! Let me know what you want to hear next.";
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const song = recentlyPlayed[0]; // Use the most recent song
        const prompt = `You are a cool and charismatic radio DJ for "Nam Radio Live". The song "${song.title}" by ${song.artist} just played. Write a very short, engaging, and creative comment about it for the live chat (1-2 sentences). Your tone should be friendly and energetic.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating DJ chitchat:", error);
        const song = recentlyPlayed[0]; // Use the most recent song in fallback
        return `What a tune! That was ${song.title} by ${song.artist}. What's next?`;
    }
};

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

export const getShowRecommendations = async (
    favoriteShowNames: string[],
    allShowNames: string[],
    songRequests: SongRequestRecord[],
    likedSongs: string[],
    dislikedSongs: string[]
): Promise<string> => {
    if (favoriteShowNames.length === 0 && songRequests.length === 0 && likedSongs.length === 0) {
        return "You haven't favorited any shows or rated any songs yet! Star a show, request a song, or give a thumbs-up to a recently played track to get your personalized recommendations.";
    }
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const otherShows = allShowNames.filter(show => !favoriteShowNames.includes(show));

        let prompt = `You are "DJ Alex", Nam Radio Live's AI curator, known for your great taste and finding hidden gems. A listener has this taste profile:\n`;
        if (favoriteShowNames.length > 0) {
            prompt += `- Their favorite shows are: "${favoriteShowNames.join(', ')}".\n`;
        }
        if (songRequests.length > 0) {
            const requestedSongs = songRequests.map(r => `"${r.title}" by ${r.artist}`).join(', ');
            prompt += `- They've recently requested: ${requestedSongs}.\n`;
        }
        if (likedSongs.length > 0) {
            prompt += `- They LIKE these songs: "${likedSongs.join('", "')}".\n`;
        }
        if (dislikedSongs.length > 0) {
            prompt += `- They DISLIKE these songs: "${dislikedSongs.join('", "')}".\n`;
        }
        prompt += `Based on this, look at our other shows ("${otherShows.join(', ')}") and pick up to 3 that you think they'll absolutely love. Give a short, punchy, one-sentence reason for each, like you're talking to them on air. Make it exciting! Format it as a simple list with show names in bold.`;
        
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error getting show recommendations:", error);
        return "Our recommendation engine is taking a quick nap. Please try again in a moment!";
    }
};

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

export const generateVibeCommentary = async (dominantVibeLabel: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const prompt = `You are a cool radio DJ for "Nam Radio Live". The collective listener vibe is currently "${dominantVibeLabel}". Write a short, engaging comment (1-2 sentences) for the live chat, reacting to this mood. Your tone should be friendly and energetic.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating vibe commentary:", error);
        return `Looks like the vibe is definitely ${dominantVibeLabel.toLowerCase()} right now! I'm feeling it.`;
    }
};

export const generateDailyRewind = async (
    username: string,
    shows: string[],
    songRequests: SongRequestRecord[]
): Promise<string> => {
    if (shows.length === 0 && songRequests.length === 0) {
        return "It looks like you haven't tuned in long enough today to generate a rewind. Listen to a show or request a song and check back later!";
    }
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        let prompt = `You are DJ Alex, the AI host of Nam Radio Live. A listener named '${username}' tuned in today. `;
        
        if (shows.length > 0) {
            prompt += `They enjoyed shows like '${shows.join(', ')}'. `;
        }
        if (songRequests.length > 0) {
            const requestedSongs = songRequests.map(r => `"${r.title}"`).join(', ');
            prompt += `They also requested some great tunes like ${requestedSongs}. `;
        }

        prompt += "Create a short, energetic, 2-paragraph summary of their listening day. Address them directly and make it feel like a personal shoutout. Mention a highlight, maybe a cool song or a fun moment from the chat.";
        
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating daily rewind:", error);
        return "Looks like my circuits are a bit scrambled trying to remember the day! Please try again in a moment.";
    }
};

// FIX: Add new function to generate dedication shoutouts.
export const generateDedicationShoutout = async (dedication: DedicationRecord): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const { song, to, from, message } = dedication;
        const prompt = `You are DJ Alex, the AI host for Nam Radio Live. A listener named '${from}' is dedicating the song '${song.title}' by ${song.artist} to '${to}' with the message: "${message}". Announce this dedication in a warm and celebratory way for the live chat. Make it sound special!`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating dedication shoutout:", error);
        return `A special shoutout from ${dedication.from} to ${dedication.to}! They've dedicated "${dedication.song.title}" to you with the message: "${dedication.message}". Enjoy!`;
    }
};

export const getLocalMusicEvents = async (): Promise<MusicEvent[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const prompt = `You are an expert events curator for Nam Radio Live, a station in Windhoek, Namibia. Your mission is to create the most comprehensive and reliable list of upcoming live music events in Namibia for the next month, with a strong focus on the Windhoek area.

To do this, you must search across a diverse range of web sources. Do not rely on a single site. Your search should include:
- Major event platforms (e.g., Eventbrite, AllEvents.in)
- Local news outlets and their entertainment sections
- Social media platforms (Facebook Events, Instagram posts from local venues)
- Official venue websites
- Artist social media pages

For each event found, provide the following details. Prioritize official sources for accuracy. Return this as a structured JSON array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              eventName: { type: Type.STRING, description: "The name of the event." },
              date: { type: Type.STRING, description: "The date of the event." },
              venue: { type: Type.STRING, description: "The venue where the event takes place." },
              description: { type: Type.STRING, description: "A brief description of the event." },
              sourceUrl: { type: Type.STRING, description: "The direct URL to the source of the event information." }
            },
            required: ["eventName", "date", "venue", "description", "sourceUrl"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const events = JSON.parse(jsonText);
    return events as MusicEvent[];
  } catch (error) {
    console.error("Error fetching local music events:", error);
    throw new Error("Could not fetch local events at this time. Please try again later.");
  }
};

export const getSongOfTheWeek = async (): Promise<SongOfTheWeek> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const prompt = `You are an expert music curator and DJ for "Nam Radio Live", an online station based in Namibia that plays a vibrant mix of global hits, African grooves, and indie gems. Your task is to select a "Song of the Week". Pick a song that is either currently trending, a classic hit that fits the station's vibe, or an amazing track from an emerging African artist. Provide a short, exciting, one-paragraph description explaining why this song is a must-listen.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the song." },
            artist: { type: Type.STRING, description: "The name of the artist or band." },
            description: { type: Type.STRING, description: "The short, exciting description of the song." }
          },
          required: ["title", "artist", "description"],
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as SongOfTheWeek;
  } catch (error) {
    console.error("Error fetching Song of the Week:", error);
    throw new Error("DJ Alex is busy digging in the crates... couldn't pick a song right now. Please try again later.");
  }
};

export const getAiDjIntroduction = async (djName: string, showName: string, djBio: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const prompt = `You are DJ Alex, the AI host of Nam Radio Live. Give me a short (2-3 sentences), fun, and energetic introduction for your fellow DJ, ${djName}. They host the show "${showName}" and their bio is: "${djBio}". Make it sound like you're hyping them up to the listeners.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
  } catch (error) {
    console.error("Error getting AI DJ introduction:", error);
    return `Up next, we've got the one and only ${djName} with ${showName}! You're not gonna want to miss it!`;
  }
};

export const getRankedShowRecommendations = async (
    favoriteShowNames: string[],
    allShows: ApiScheduleItem[],
    songRequests: SongRequestRecord[],
    likedSongs: string[],
    dislikedSongs: string[]
): Promise<ApiScheduleItem[]> => {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const otherShows = allShows.filter(show => !favoriteShowNames.includes(show.name));
    if (otherShows.length === 0) return [];
    
    let prompt = `You are an AI recommendation engine for "Nam Radio Live". Analyze this listener's taste profile:\n`;
     if (favoriteShowNames.length > 0) prompt += `- Favorite shows: "${favoriteShowNames.join(', ')}".\n`;
     if (songRequests.length > 0) prompt += `- Requested songs: ${songRequests.map(r => `"${r.title}"`).join(', ')}.\n`;
     if (likedSongs.length > 0) prompt += `- Likes these songs: "${likedSongs.join('", "')}".\n`;
     if (dislikedSongs.length > 0) prompt += `- Dislikes these songs: "${dislikedSongs.join('", "')}".\n`;
    
    prompt += `Based on this, from the following list of shows, which one would be the absolute BEST single recommendation? Return ONLY the name of that show. Show list: "${otherShows.map(s => s.name).join('", "')}"`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const recommendedShowName = response.text.trim();
        const recommendedShow = otherShows.find(s => s.name === recommendedShowName);
        return recommendedShow ? [recommendedShow] : [];
    } catch (error) {
        console.error("Error getting ranked show recommendations:", error);
        return []; // Return empty on error
    }
};

export const generateShowScoutAlert = async (username: string, show: ApiScheduleItem, isFavorite: boolean): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    let prompt: string;
    if (isFavorite) {
        prompt = `You are DJ Alex. Write a short, friendly heads-up for a listener named '${username}' that their favorite show, "${show.name}", is starting soon. Keep it personal and brief.`;
    } else {
        prompt = `You are DJ Alex. You've noticed a listener named '${username}' has great taste. Based on their listening habits, you think they'll love the upcoming show, "${show.name}", which is about "${show.description}". Write a short, personal recommendation encouraging them to check it out.`;
    }
    
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating show scout alert:", error);
        return isFavorite 
            ? `Hey ${username}! Just a heads-up, your favorite show "${show.name}" is starting soon!`
            : `Hey ${username}! Based on your vibe, I think you'll really dig the next show, "${show.name}". Check it out!`;
    }
};

export const generateLocalSpotlightPromo = async (): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const prompt = `You are DJ Alex, the AI host of Nam Radio Live. The station has a weekly show called "Local Spotlight" that features Namibian artists. Write a short, engaging message for the live chat to source suggestions from the community. Ask listeners which Namibian artists they think should be featured on the next show.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
  } catch (error) {
    console.error("Error generating Local Spotlight promo:", error);
    return "Who's your favorite local artist? Let us know who we should play on our 'Local Spotlight' show!";
  }
};

export const generateEventShoutout = async (song: Song, event: MusicEvent): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const prompt = `You are DJ Alex, the AI host for Nam Radio Live. The song "${song.title}" by ${song.artist} just played. You've noticed this artist has an upcoming local event. Announce their event: "${event.eventName}" at ${event.venue} on ${event.date}. Keep it exciting and encourage listeners to check the Events Hub for more details.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating event shoutout:", error);
        return `Great track from ${song.artist}! By the way, they're playing live at ${event.venue} on ${event.date}. Check the Events Hub for details!`;
    }
};