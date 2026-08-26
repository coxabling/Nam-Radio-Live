import { GoogleGenAI, Type } from "@google/genai";
import { Song, SongRequestRecord, DedicationRecord, MusicEvent, ApiScheduleItem, SongOfTheWeek, ListeningStats, SongRating, StorySlideType, StorySlideData } from '../types';

const getGeminiApiKey = (): string => {
  const apiKey = (typeof process !== 'undefined' && (process.env.API_KEY || process.env.GEMINI_API_KEY)) || '';
  return apiKey;
};

// Helper to parse JSON from Markdown code blocks often returned by LLMs
const parseJson = (text: string) => {
    try {
        let cleaned = text.trim();
        // Remove markdown code blocks if present
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        return JSON.parse(cleaned);
    } catch (e) {
        // Try regex extraction of first JSON object or array
        const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (innerErr) {
                // fall through
            }
        }
        throw new Error("Invalid JSON response from AI");
    }
};

export const getDjConfirmation = async (songTitle: string, artistName: string, userName: string): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a cool, charismatic radio DJ for "Nam Radio Live" in Windhoek. Listener ${userName} just requested "${songTitle}" by "${artistName}". Write a short, creative, energetic on-air confirmation (2 sentences).`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      if (response.text?.trim()) return response.text.trim();
    } catch (error) {
      // Fall through to fallback
    }
  }
  return `Big shoutout to ${userName}! We got your request for "${songTitle}" by ${artistName} locked into the Nam Radio queue. Keep those ears glued! 🎧✨`;
};

export const getAiChatResponse = async (query: string): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are DJ Alex, the witty, friendly, and knowledgeable AI radio host for "Nam Radio Live", an online radio station broadcasting from Windhoek, Namibia. A listener in the live chat asks: "${query}". Provide a warm, conversational, and concise radio DJ answer (2-3 sentences max).`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      if (response.text?.trim()) return response.text.trim();
    } catch (error) {
      // Fall through to fallback
    }
  }
  return `DJ Alex here! Thanks for tuning in to Nam Radio Live. We're keeping the hottest African grooves and global rhythms spinning all day. Drop your favorite tracks in the request box anytime!`;
};

export const generateDjChitchat = async (recentlyPlayed: Song[]): Promise<string> => {
    if (recentlyPlayed.length === 0) return "Keep the vibes going! Let me know what you want to hear next.";
    const song = recentlyPlayed[0];
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are DJ Alex for "Nam Radio Live". The song "${song.title}" by ${song.artist} just finished playing. Write a 1-2 sentence lively on-air comment for the live chat.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return `What a banger! That was "${song.title}" by ${song.artist}. Keeping the energy high right here on Nam Radio Live!`;
};

export const getSongFunFact = async (song: Song): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a music historian DJ. Give an interesting, verified 1-2 sentence fun fact about the song "${song.title}" by ${song.artist} or the artist's musical legacy.`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      if (response.text?.trim()) return response.text.trim();
    } catch (error) {
      // Fall through
    }
  }
  return `"${song.title}" stands out as one of ${song.artist}'s most dynamic releases, blending cross-genre elements that captivate audiences across the airwaves!`;
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
    const otherShows = allShowNames.filter(show => !favoriteShowNames.includes(show));
    const apiKey = getGeminiApiKey();
    if (apiKey && otherShows.length > 0) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            let prompt = `You are DJ Alex, Nam Radio Live's AI curator. Listener profile:\n`;
            if (favoriteShowNames.length > 0) prompt += `- Favorite shows: "${favoriteShowNames.join(', ')}"\n`;
            if (songRequests.length > 0) prompt += `- Requested: ${songRequests.map(r => `"${r.title}" by ${r.artist}`).join(', ')}\n`;
            if (likedSongs.length > 0) prompt += `- Likes: "${likedSongs.join('", "')}"\n`;
            if (dislikedSongs.length > 0) prompt += `- Dislikes: "${dislikedSongs.join('", "')}"\n`;
            prompt += `From our other shows ("${otherShows.join(', ')}"), recommend up to 2 shows with a punchy 1-sentence reason each. Format with show names in bold.`;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    const fallbackPicks = otherShows.slice(0, 2);
    if (fallbackPicks.length > 0) {
        return fallbackPicks.map(show => `• **${show}**: Hand-picked by DJ Alex for its incredible rhythm and vibe matching your taste!`).join('\n');
    }
    return "Check out our full live schedule to discover more unforgettable sets!";
};

export const getArticleSummary = async (articleTitle: string, articleSource: string): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Provide a concise 2-sentence summary of what a news/music article titled "${articleTitle}" from "${articleSource}" covers. Keep it neutral and informative.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return `This piece from ${articleSource} explores the latest cultural movements, artist achievements, and sonic innovations making headlines across the continent and beyond.`;
};

export const generateTakeoverAnnouncement = async (songA: Song, songB: Song): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are a radio DJ. Announce an exciting live chat battle between "${songA.title}" by ${songA.artist} and "${songB.title}" by ${songB.artist} (1-2 sentences).`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return `🚨 IT'S LISTENER TAKEOVER TIME! Vote in the chat right now: Team A "${songA.title}" or Team B "${songB.title}"? You decide what spins next!`;
};

export const generateTakeoverOptions = async (context: { show?: ApiScheduleItem | null, lastSong?: Song | null }): Promise<[Song, Song]> => {
  const fallbackSongs: [Song, Song] = [
    { title: "Shukuma", artist: "Gazza ft. Uhuru" },
    { title: "Jerusalema", artist: "Master KG ft. Nomcebo" }
  ];

  const apiKey = getGeminiApiKey();
  if (!apiKey) return fallbackSongs;

  try {
    const ai = new GoogleGenAI({ apiKey });
    let prompt = `Select 2 contrasting, popular African or global anthems for a live radio vote. Return JSON array with "title" and "artist" keys.`;
    if (context.show) {
      prompt += ` Fit the vibe of show "${context.show.name}".`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
            },
            required: ["title", "artist"],
          },
        },
      },
    });

    const parsed = parseJson(response.text);
    if (Array.isArray(parsed) && parsed.length >= 2 && parsed[0].title && parsed[1].title) {
      return [parsed[0], parsed[1]];
    }
  } catch (error) {
    // Return fallback
  }
  return fallbackSongs;
};

export const generateTakeoverWinnerShoutout = async (winningSong: Song): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are a radio DJ. The live vote just concluded and "${winningSong.title}" by ${winningSong.artist} won. Write an exciting 1-2 sentence winner announcement.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return `The listeners have spoken! "${winningSong.title}" by ${winningSong.artist} took the crown! Dropping the needle right now! 🎶🔥`;
};

export const generateSongClue = async (song: Song): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Create a clever, riddle-like clue about the song "${song.title}" by ${song.artist} without revealing the title.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return `This unforgettable release from ${song.artist} has been shaking speakers across Namibia and beyond. Can you name the track?`;
};

export const generateTriviaQuestion = async (song: Song): Promise<{ question: string; answer: string }> => {
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Create a verified, interesting trivia question about the song "${song.title}" by ${song.artist} or the artist. Return ONLY a valid JSON object with keys "question" and "answer".`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      const parsed = parseJson(response.text);
      if (parsed.question && parsed.answer) return parsed;
    } catch (error) {
      // Fall through
    }
  }
  return {
    question: `Which renowned artist is famous for performing the hit track "${song.title}"?`,
    answer: song.artist
  };
};

export const generateVibeCommentary = async (dominantVibeLabel: string): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are DJ Alex on Nam Radio Live. The collective listener mood is currently "${dominantVibeLabel}". Write a 1-2 sentence lively on-air chat message responding to this energy.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return `I see the room is radiating pure ${dominantVibeLabel.toLowerCase()} energy right now! Let's ride this wave together! 🌊✨`;
};

export const generateDailyRewind = async (
    username: string,
    shows: string[],
    songRequests: SongRequestRecord[]
): Promise<string> => {
    if (shows.length === 0 && songRequests.length === 0) {
        return "It looks like you haven't tuned in long enough today to generate a rewind. Listen to a show or request a song and check back later!";
    }
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            let prompt = `You are DJ Alex, AI host of Nam Radio Live. Listener '${username}' tuned in today. `;
            if (shows.length > 0) prompt += `They caught shows like: ${shows.join(', ')}. `;
            if (songRequests.length > 0) prompt += `They requested: ${songRequests.map(r => `"${r.title}"`).join(', ')}. `;
            prompt += `Write a warm, celebratory 2-paragraph recap of their day on air.`;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return `Hey ${username}! DJ Alex here with your daily rewind. You brought top-tier energy to the station today, grooving along with our live broadcast and making the community vibrant. Thanks for keeping the airwaves alive!`;
};

export const generateDedicationShoutout = async (dedication: DedicationRecord): Promise<string> => {
    const { song, to, from, message } = dedication;
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are DJ Alex on Nam Radio Live. Listener '${from}' dedicates "${song.title}" by ${song.artist} to '${to}' with message: "${message}". Write a warm 2-sentence on-air shoutout.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return `✨ SPECIAL DEDICATION: To ${to} from ${from}! Playing "${song.title}" by ${song.artist}. Message: "${message}" — Enjoy every beat!`;
};

export const getLocalMusicEvents = async (): Promise<MusicEvent[]> => {
  const curatedEvents: MusicEvent[] = [
    {
      eventName: "Windhoek Jazz & Soul Sunset Sessions",
      date: "Saturday, Sep 12, 2026 • 18:00",
      venue: "Warehouse Theatre Courtyard, Windhoek",
      description: "An intimate evening celebrating Namibian jazz pioneers, Afro-soul improvisations, and local acoustic talent.",
      sourceUrl: "https://namradiolive.com/events/windhoek-jazz",
      imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80"
    },
    {
      eventName: "Katutura Soundwave & Cultural Expo",
      date: "Friday, Sep 18, 2026 • 19:30",
      venue: "Katutura Community Arts Centre, Windhoek",
      description: "High-energy showcase featuring emerging Afrobeat, Shambo, and Hip-Hop creators from across Namibia.",
      sourceUrl: "https://namradiolive.com/events/katutura-expo",
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80"
    },
    {
      eventName: "Swakopmund Coastal Beats Festival",
      date: "Saturday, Oct 03, 2026 • 16:00",
      venue: "The Dome Coastal Arena, Swakopmund",
      description: "Namibia's premier coastal music festival featuring global DJ headliners, live percussion, and sunset beach stages.",
      sourceUrl: "https://namradiolive.com/events/coastal-beats",
      imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&auto=format&fit=crop&q=80"
    },
    {
      eventName: "Franco-Namibian Acoustic Night",
      date: "Thursday, Oct 15, 2026 • 20:00",
      venue: "FNCC Gallery Garden, Windhoek",
      description: "A soulful unplugged night connecting Francophone and Southern African fusion artists in an open-air garden.",
      sourceUrl: "https://namradiolive.com/events/fncc-acoustic",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80"
    }
  ];

  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Provide a JSON list of 4 exciting upcoming live music events in Namibia (Windhoek and coastal regions). Return ONLY a JSON array where each object has keys: eventName, date, venue, description, sourceUrl, imageUrl.`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      const parsed = parseJson(response.text);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].eventName) {
        return parsed as MusicEvent[];
      }
    } catch (error) {
      // Fall through cleanly
    }
  }

  return curatedEvents;
};

export const getSongOfTheWeek = async (
  songRequests: SongRequestRecord[], 
  listeningStats: ListeningStats
): Promise<SongOfTheWeek> => {
  const defaultSong: SongOfTheWeek = {
    title: "Shukuma",
    artist: "Gazza ft. Uhuru",
    description: "An electrifying Afro-kwaito anthem that continues to ignite dance floors across Southern Africa with relentless percussion and irresistible rhythm!"
  };

  // If user has requests or likes, use them as dynamic candidate
  if (songRequests.length > 0) {
    const topReq = songRequests[songRequests.length - 1];
    defaultSong.title = topReq.title;
    defaultSong.artist = topReq.artist;
    defaultSong.description = `Voted by the Nam Radio Live community as this week's standout anthem, capturing listener hearts with its captivating melodies!`;
  } else if (listeningStats.likedSongs && listeningStats.likedSongs.length > 0) {
    const topLiked = listeningStats.likedSongs[0];
    const parts = topLiked.id.split(' - ');
    if (parts.length >= 2) {
      defaultSong.title = parts[0];
      defaultSong.artist = parts[1];
      defaultSong.description = `Crown jewel of the Nam Radio airwaves this week, delivering high-vibrational chords and pure musical artistry.`;
    }
  }

  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      let prompt = `You are DJ Alex, curator for "Nam Radio Live". Pick a fantastic Song of the Week that fits an eclectic African and global radio station. Return JSON with "title", "artist", and "description" (a short exciting 2-sentence radio pitch).`;
      if (songRequests.length > 0) {
        prompt += ` Listener requests include: ${songRequests.slice(-3).map(r => `"${r.title}" by ${r.artist}`).join(', ')}.`;
      }
      
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      const parsed = parseJson(response.text);
      if (parsed.title && parsed.artist && parsed.description) {
        return parsed as SongOfTheWeek;
      }
    } catch (error) {
      // Fall through to default
    }
  }

  return defaultSong;
};

export const getAiDjIntroduction = async (djName: string, showName: string, djBio: string): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are DJ Alex, AI host of Nam Radio Live. Give a short (2-sentence) electric radio intro hyping up DJ ${djName} hosting "${showName}". DJ Bio: "${djBio}".`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      if (response.text?.trim()) return response.text.trim();
    } catch (error) {
      // Fall through
    }
  }
  return `Turn your dials up, fam! The incredible ${djName} is taking over the decks for "${showName}". Get ready for unmatched sonic energy!`;
};

export const getRankedShowRecommendations = async (
    favoriteShowNames: string[],
    allShows: ApiScheduleItem[],
    songRequests: SongRequestRecord[],
    likedSongs: SongRating[],
    dislikedSongs: SongRating[]
): Promise<ApiScheduleItem[]> => {
    const otherShows = allShows.filter(show => !favoriteShowNames.includes(show.name));
    if (otherShows.length === 0) return [];
    
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            let prompt = `From these radio shows: ${otherShows.map(s => `"${s.name}"`).join(', ')}, select the single best one for a listener who likes: ${likedSongs.map(s => s.id).slice(0, 3).join(', ') || 'African and Global beats'}. Return ONLY the exact show name.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const recommendedName = response.text?.trim();
            const matched = otherShows.find(s => s.name.toLowerCase() === recommendedName?.toLowerCase() || recommendedName?.includes(s.name));
            if (matched) return [matched];
        } catch (error) {
            // Fall through
        }
    }
    return otherShows.length > 0 ? [otherShows[0]] : [];
};

export const generateShowScoutAlert = async (username: string, show: ApiScheduleItem, isFavorite: boolean): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are DJ Alex. Write a short 1-sentence personalized alert for listener '${username}' that show "${show.name}" is coming up next on Nam Radio Live.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return isFavorite 
        ? `Hey ${username}! Heads-up: your favorite show "${show.name}" goes live shortly!`
        : `Hey ${username}! Based on your listening taste, you're going to love "${show.name}" coming up next!`;
};

export const generateLocalSpotlightPromo = async (): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Write a short 1-sentence radio host callout asking listeners in the chat which local Namibian artists should be featured on the next "Local Spotlight" show.`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      if (response.text?.trim()) return response.text.trim();
    } catch (error) {
      // Fall through
    }
  }
  return "Which local Namibian artists are on your heavy rotation? Drop your nominations in the chat for our next 'Local Spotlight'!";
};

export const generateEventShoutout = async (song: Song, event: MusicEvent): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are DJ Alex. Announce that artist ${song.artist} has a live show "${event.eventName}" at ${event.venue} on ${event.date} (1-2 sentences).`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return `Loving that track from ${song.artist}! Catch them live at "${event.eventName}" at ${event.venue} (${event.date}). Check the Events Hub for details!`;
};

export const generateCountdownCommentary = async (topSongs: { song: string; likes: number }[]): Promise<string> => {
  if (topSongs.length === 0) return "No songs to comment on!";
  const chartString = topSongs.map((s, i) => `${i + 1}. ${s.song} (${s.likes} likes)`).join('\n');
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are DJ Alex on Nam Radio Live. Give quick 2-sentence energetic on-air commentary on this week's community top liked songs chart:\n${chartString}`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      if (response.text?.trim()) return response.text.trim();
    } catch (error) {
      // Fall through
    }
  }
  return `What a chart this week! You all have impeccable taste—that number one spot was fiercely contested and well earned! 🏆`;
};

export const generateStationChartCommentary = async (topSongs: { song: string; plays: number }[]): Promise<string> => {
    if (topSongs.length === 0) return "No songs to comment on!";
    const chartString = topSongs.map((s, i) => `${i + 1}. ${s.song} (${s.plays} plays)`).join('\n');
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are DJ Alex on Nam Radio Live. Give a quick 2-sentence energetic comment on the most played station songs:\n${chartString}`;
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
          if (response.text?.trim()) return response.text.trim();
        } catch (error) {
          // Fall through
        }
    }
    return `The frequency has been blazing hot all week! These heavy-rotation tracks are setting the standard across Namibia and the globe! 🔥`;
};

// Curated music history archive for perpetual offline/guaranteed fallback
const MUSIC_HISTORY_ARCHIVE: Record<number, string> = {
  0: "On this day in music history, African and global icons unified rhythms worldwide, celebrating how grassroots radio transformed indie artists into international legends.",
  1: "On this day in 1980, Bob Marley performed his legendary historic concert in Africa, inspiring a whole generation of musicians with anthems of unity and liberation.",
  2: "On this day in 1971, Fela Kuti revolutionized world music by debuting new Afrobeat polyrhythms live in Lagos, forever altering global funk and jazz.",
  3: "On this day in 1969, Woodstock culminated into history, demonstrating the transcendent power of live music to bridge divides across millions.",
  4: "On this day in 1985, Miriam Makeba and Hugh Masekela captivated global audiences, using their soul-stirring jazz to advocate for human dignity and culture.",
  5: "On this day in 2004, Namibian music entered an era of explosive growth as local trailblazers began headlining prestigious pan-African awards shows.",
  6: "On this day in 1997, Daft Punk helped ignite a worldwide electronic renaissance, proving that innovative production and infectious grooves know no borders."
};

export const getOnThisDayInMusic = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const dayOfWeek = today.getDay();
  const fallbackFact = MUSIC_HISTORY_ARCHIVE[dayOfWeek] || `On this day in music history (${dateStr}), trailblazing artists and visionary DJs shaped the global sonic landscape with unforgettable melodies that still inspire our live broadcast!`;

  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are DJ Alex, resident music historian on Nam Radio Live. Give ONE verified, fascinating, concise music history fact (2 sentences) that occurred on or around this day (${dateStr}). Keep it fun, accurate, and radio-friendly.`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      if (response.text?.trim()) return response.text.trim();
    } catch (error) {
      // Fall through silently to guaranteed fallback
    }
  }

  return fallbackFact;
};

export const generateLevelUpMessage = async (username: string, levelName: string): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are DJ Alex on Nam Radio Live. Dedicated listener '${username}' just reached rank "${levelName}"! Write a 2-sentence celebratory shoutout for the chat with fire energy.`;
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
          if (response.text?.trim()) return response.text.trim();
        } catch (error) {
          // Fall through
        }
    }
    return `🎉 MASSIVE SHOUTOUT to ${username} for ascending to ${levelName}! You are officially Nam Radio royalty! Thank you for holding down the airwaves with us! 🙌👑`;
};

export const getTopGenres = async (artists: string[]): Promise<string[]> => {
  if (artists.length === 0) {
    return ["Afrobeat", "Desert Rock", "Global Pop"];
  }
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analyze artists: ${artists.join(', ')}. Return a JSON array of their top 3 primary music genres.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });
      const parsed = parseJson(response.text);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (error) {
      // Fall through
    }
  }
  return ["Afro-Fusion", "Contemporary Global", "Indie Soul"];
};

export const generateListenerStoryCaption = async (
    slideType: StorySlideType,
    data: StorySlideData,
    username: string
): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            let prompt = `You are DJ Alex on Nam Radio Live. Write a witty 1-sentence caption celebrating listener '${username}'. Slide: ${slideType}. `;
            if (slideType === 'top_show') prompt += `Top show: ${data.showName}.`;
            if (slideType === 'peak_time') prompt += `Peak hour: ${data.peakTime}.`;
            if (slideType === 'badges') prompt += `Badges earned: ${data.badgeCount}.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    switch (slideType) {
        case 'welcome': return `Welcome to your official Nam Radio Sonic Journey, ${username}!`;
        case 'top_show': return `You've got impeccable taste—"${data.showName}" is certified gold!`;
        case 'peak_time': return `You're officially a vital member of our ${data.peakTime} frequency crew!`;
        case 'badges': return `Look at that shelf! ${data.badgeCount} badges earned and counting!`;
        default: return `Thank you for being the heartbeat of Nam Radio Live!`;
    }
};

export const generateDjJoke = async (): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Tell a short, funny 1-2 sentence music-related radio joke for chat.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return "Why did the DJ get kicked out of the grocery store? Because he kept dropping the beets! 🎧😂";
};

export const getSongStoryAndInsight = async (song: Song): Promise<{ meaning: string; culturalBackstory: string; moodKeywords: string[]; djTip: string }> => {
    const fallback = {
        meaning: `"${song.title}" is an evocative composition conveying raw emotion, dynamic rhythm, and pure creative expression.`,
        culturalBackstory: `${song.artist} bridges distinct global influences, showcasing innovative production techniques celebrated across modern airwaves.`,
        moodKeywords: ["High Energy", "Soulful", "Nam Radio Favorite"],
        djTip: "Turn up the volume and let the bassline take control!"
    };

    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are DJ Alex. Provide musical context for "${song.title}" by "${song.artist}". Return JSON with:
- "meaning": 2 sentences on theme
- "culturalBackstory": 2 sentences on musical significance
- "moodKeywords": array of 3 string tags
- "djTip": 1 sentence radio tip.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const parsed = parseJson(response.text);
            if (parsed.meaning && parsed.culturalBackstory) return parsed;
        } catch (error) {
            // Fall through
        }
    }
    return fallback;
};

export const generateListenerDnaPersonality = async (stats: ListeningStats, username: string): Promise<{ archetype: string; title: string; description: string; sonicVibe: string }> => {
    const totalMinutes = Math.round(stats.totalListeningTime / 60);
    const fallback = {
        archetype: totalMinutes > 60 ? "Kalahari Sonic Alchemist" : "Windhoek Frequency Pioneer",
        title: "Explorer of Uncharted Rhythms",
        description: `${username} brings vibrant energy and authentic passion to Nam Radio Live, driving the tempo for our global listening family!`,
        sonicVibe: "A soulful blend of Afrobeat textures, melodic grooves, and indie discovery."
    };

    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Analyze listener '${username}' who listened for ${totalMinutes} mins with ${stats.likedSongs.length} likes. Return JSON with:
- "archetype": 2-3 word cool title
- "title": poetic profile title
- "description": 2 sentence celebration of their taste
- "sonicVibe": 1 sentence sonic summary.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const parsed = parseJson(response.text);
            if (parsed.archetype && parsed.description) return parsed;
        } catch (error) {
            // Fall through
        }
    }
    return fallback;
};

export const generateDjRadioAnnouncement = async (currentSong: Song, currentShow: string | null): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are DJ Alex on Nam Radio Live. Show is "${currentShow || 'Live Broadcast'}" and song is "${currentSong.title}" by ${currentSong.artist}. Write a crisp 15-second radio station ident / intro.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text?.trim()) return response.text.trim();
        } catch (error) {
            // Fall through
        }
    }
    return `You're locked into Nam Radio Live, broadcasting the freshest sounds from Windhoek to the world. That was ${currentSong.title} by ${currentSong.artist}! Stay tuned for more heat!`;
};
