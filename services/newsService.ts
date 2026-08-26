import { Article } from '../types';

// Public RSS Feeds for live updates
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

const RSS_FEEDS = {
  namibia: 'https://www.namibian.com.na/feed/',
  africa: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
  africanSports: 'https://allafrica.com/tools/headlines/rdf/sport/headlines.rdf',
  world: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  africanMusic: 'https://musicinafrica.net/rss.xml'
};

// High quality curated articles for when RSS feeds are unreachable, rate-limited, or CORS blocked
const FALLBACK_ARTICLES: Record<string, Article[]> = {
  africanMusic: [
    {
      id: 'am-1',
      title: 'Namibian Music Industry Reaches New Global Milestones with Cross-Border Collaborations',
      source: 'Nam Radio Music Journal',
      url: 'https://music-station.live',
      publishedAt: 'Today • Feature Story',
      category: 'Features',
      summary: 'Exploring how local producers and artists from Windhoek to Walvis Bay are dominating international streaming playlists.'
    },
    {
      id: 'am-2',
      title: 'The Evolution of Shambo and Afro-Kwaito: From Grassroots Rhythms to Festival Stages',
      source: 'African Sonic Review',
      url: 'https://music-station.live',
      publishedAt: 'Yesterday • Heritage & Rhythm',
      category: 'Culture',
      summary: 'A deep dive into the polyrhythmic traditions defining the modern southern African soundscape.'
    },
    {
      id: 'am-3',
      title: 'Top 10 Emerging Namibian and Southern African Artists to Watch This Season',
      source: 'Vibe Africa',
      url: 'https://music-station.live',
      publishedAt: '2 days ago • Spotlight',
      category: 'Spotlight',
      summary: 'From soulful vocalists to trailblazing electronic beatmakers shaping the future of African music.'
    },
    {
      id: 'am-4',
      title: 'Behind the Beat: Inside the Production of Namibia\'s Most Streamed Radio Anthems',
      source: 'Studio Sound Mag',
      url: 'https://music-station.live',
      publishedAt: '3 days ago • Production & Tech',
      category: 'Production',
      summary: 'Award-winning audio engineers reveal the analog synths and traditional percussion textures behind radio hits.'
    },
    {
      id: 'am-5',
      title: 'Live Music Renaissance: Windhoek and Swakopmund Stage Open-Air Cultural Concerts',
      source: 'Nam Radio Live Editorial',
      url: 'https://music-station.live',
      publishedAt: '4 days ago • Live & Tour',
      category: 'Live & Tours',
      summary: 'Fans flock to vibrant sunset festivals celebrating local creative talent and community unity.'
    }
  ],
  namibia: [
    {
      id: 'nam-1',
      title: 'Windhoek Cultural Hub Unveils New Creative Arts and Music Incubation Center',
      source: 'The Namibian',
      url: 'https://www.namibian.com.na',
      publishedAt: 'Today',
      category: 'Culture'
    },
    {
      id: 'nam-2',
      title: 'Namibian Artists Recognized at Pan-African Music & Creative Heritage Awards',
      source: 'New Era Live',
      url: 'https://neweralive.na',
      publishedAt: 'Yesterday',
      category: 'Entertainment'
    },
    {
      id: 'nam-3',
      title: 'Renewable Energy Initiatives Power Community Radio and Media Labs in Erongo',
      source: 'Namibia Economist',
      url: 'https://economist.com.na',
      publishedAt: '2 days ago',
      category: 'Innovation'
    },
    {
      id: 'nam-4',
      title: 'Tourism and Cultural Arts Festival Attracts Record Visitors to Coastal Towns',
      source: 'The Namibian',
      url: 'https://www.namibian.com.na',
      publishedAt: '3 days ago',
      category: 'Travel & Arts'
    },
    {
      id: 'nam-5',
      title: 'Youth In Tech & Audio Engineering: New Training Scholarships Launched in Windhoek',
      source: 'Namibia Press Agency',
      url: 'https://www.nampa.org',
      publishedAt: '4 days ago',
      category: 'Education'
    }
  ],
  africa: [
    {
      id: 'afr-1',
      title: 'Afrobeats and Amapiano Continue Rapid Expansion Across Global Streaming Charts',
      source: 'BBC News Africa',
      url: 'https://www.bbc.com/news/world/africa',
      publishedAt: 'Today',
      category: 'Music'
    },
    {
      id: 'afr-2',
      title: 'African Continental Free Trade Area Fosters Boom in Creative & Cultural Industries',
      source: 'AllAfrica',
      url: 'https://allafrica.com',
      publishedAt: 'Yesterday',
      category: 'Economy'
    },
    {
      id: 'afr-3',
      title: 'Solar-Powered Broadcasting Stations Expanding Rural Community Access Across the Continent',
      source: 'African Union News',
      url: 'https://au.int',
      publishedAt: '2 days ago',
      category: 'Technology'
    },
    {
      id: 'afr-4',
      title: 'Pioneering African Filmmakers and Composers Nominated for International Honors',
      source: 'BBC News Africa',
      url: 'https://www.bbc.com/news/world/africa',
      publishedAt: '3 days ago',
      category: 'Arts'
    },
    {
      id: 'afr-5',
      title: 'Preserving Indigenous Languages Through Modern Musical Fusion and Digital Radio',
      source: 'Music In Africa',
      url: 'https://www.musicinafrica.net',
      publishedAt: '4 days ago',
      category: 'Heritage'
    }
  ],
  africanSports: [
    {
      id: 'sp-1',
      title: 'Namibian Athletes Shine in International Track and Field Championship Qualifiers',
      source: 'Namibian Sport',
      url: 'https://www.namibian.com.na',
      publishedAt: 'Today',
      category: 'Athletics'
    },
    {
      id: 'sp-2',
      title: 'CAF Champions League: Thrilling Weekend Fixtures Set Stage for Quarter-Finals',
      source: 'SuperSport Africa',
      url: 'https://supersport.com',
      publishedAt: 'Yesterday',
      category: 'Football'
    },
    {
      id: 'sp-3',
      title: 'Namibia Rugby Welcomes Major Pre-Tournament Training Camp in Windhoek',
      source: 'AllAfrica Sports',
      url: 'https://allafrica.com',
      publishedAt: '2 days ago',
      category: 'Rugby'
    },
    {
      id: 'sp-4',
      title: 'Rising Stars in Southern African Boxing Deliver Knockout Performances',
      source: 'New Era Sports',
      url: 'https://neweralive.na',
      publishedAt: '3 days ago',
      category: 'Boxing'
    }
  ],
  world: [
    {
      id: 'wld-1',
      title: 'Global Music Summit Explores AI Ethics and Fair Compensation for Creators',
      source: 'BBC World News',
      url: 'https://www.bbc.com/news/world',
      publishedAt: 'Today',
      category: 'Culture'
    },
    {
      id: 'wld-2',
      title: 'World Radio Day Celebrations Emphasize the Enduring Power of Community Broadcasting',
      source: 'UNESCO News',
      url: 'https://unesco.org',
      publishedAt: 'Yesterday',
      category: 'Media'
    },
    {
      id: 'wld-3',
      title: 'International Sound Archives Digitize Thousands of Rare Historical Vinyl Recordings',
      source: 'Reuters Entertainment',
      url: 'https://www.reuters.com',
      publishedAt: '2 days ago',
      category: 'History'
    },
    {
      id: 'wld-4',
      title: 'Cross-Continental Festivals Report Record Attendance for Fusion Music Lineups',
      source: 'BBC World News',
      url: 'https://www.bbc.com/news/world',
      publishedAt: '3 days ago',
      category: 'Festivals'
    }
  ]
};

/**
 * Maps an item from the rss2json API response to our local Article type.
 */
const mapRssItemToArticle = (item: any, feedTitle: string, index: number): Article => ({
  id: item.guid || item.link || `rss-item-${index}`,
  title: item.title?.replace(/&amp;/g, '&')?.replace(/&#39;/g, "'")?.replace(/&quot;/g, '"') || 'Music Headline',
  source: item.author || feedTitle || 'News Wire',
  url: item.link || 'https://music-station.live',
  publishedAt: item.pubDate ? new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
  summary: item.description?.replace(/<[^>]*>?/gm, '').slice(0, 140) + '...'
});

/**
 * Helper to fetch with timeout
 */
const fetchWithTimeout = async (url: string, timeoutMs: number = 4000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

/**
 * Fetches and processes live news for a given category with graceful fallbacks.
 */
export const fetchNews = async (category: 'namibia' | 'africa' | 'africanSports' | 'world'): Promise<Article[]> => {
  const fallback = FALLBACK_ARTICLES[category] || FALLBACK_ARTICLES['namibia'];
  const feedUrl = RSS_FEEDS[category];
  
  if (!feedUrl) {
    return fallback;
  }

  try {
    const response = await fetchWithTimeout(`${RSS2JSON_API}${encodeURIComponent(feedUrl)}`, 3500);
    if (!response.ok) {
      return fallback;
    }
    const data = await response.json();

    if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
      const feedTitle = data.feed?.title || 'News Source';
      return data.items.slice(0, 5).map((item: any, index: number) => mapRssItemToArticle(item, feedTitle, index));
    }
  } catch (error) {
    // Silently return high quality fallback
  }

  return fallback;
};

/**
 * Fetches and processes live blog posts about African music with graceful fallbacks.
 */
export const fetchBlogPosts = async (): Promise<Article[]> => {
  const fallback = FALLBACK_ARTICLES['africanMusic'];
  const feedUrl = RSS_FEEDS.africanMusic;

  try {
    const response = await fetchWithTimeout(`${RSS2JSON_API}${encodeURIComponent(feedUrl)}`, 3500);
    if (!response.ok) {
      return fallback;
    }
    const data = await response.json();

    if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
      const feedTitle = data.feed?.title || 'African Music Blog';
      return data.items.slice(0, 5).map((item: any, index: number) => mapRssItemToArticle(item, feedTitle, index));
    }
  } catch (error) {
    // Silently return high quality fallback
  }

  return fallback;
};
