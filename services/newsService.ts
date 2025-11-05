import { Article } from '../types';

// This service uses the rss2json API to convert public RSS feeds into a usable JSON format.
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

// Public RSS Feeds - Updated to focus on Namibian and African content
const RSS_FEEDS = {
  namibia: 'https://www.namibian.com.na/feed/',
  africa: 'http://feeds.bbci.co.uk/news/world/africa/rss.xml',
  africanSports: 'https://allafrica.com/tools/headlines/rdf/sport/headlines.rdf',
  world: 'http://feeds.bbci.co.uk/news/world/rss.xml',
  africanMusic: 'https://news.google.com/rss/search?q=african+music&hl=en-GB&gl=GB&ceid=GB:en'
};

/**
 * Maps an item from the rss2json API response to our local Article type.
 * @param item - The article item from the API.
 * @param feedTitle - The title of the feed, used as a fallback source.
 * @returns An object formatted as an Article.
 */
const mapRssItemToArticle = (item: any, feedTitle: string): Article => ({
  id: item.guid || item.link, // Use GUID as a unique ID, fallback to link
  title: item.title,
  source: item.author || feedTitle, // Use author if available, otherwise the feed's title
  url: item.link,
  publishedAt: item.pubDate,
});

/**
 * Fetches and processes live news for a given category.
 * @param category - The news category.
 * @returns A promise that resolves to an array of Articles.
 */
export const fetchNews = async (category: 'namibia' | 'africa' | 'africanSports' | 'world'): Promise<Article[]> => {
  console.log(`Fetching live news for category: ${category}`);
  const feedUrl = RSS_FEEDS[category];
  if (!feedUrl) {
    console.error(`No RSS feed found for category: ${category}`);
    return [];
  }

  try {
    const response = await fetch(`${RSS2JSON_API}${encodeURIComponent(feedUrl)}`);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error(`rss2json API error: ${data.message}`);
    }
    
    const feedTitle = data.feed.title || 'News Source';
    // Limit to the 5 most recent articles to keep the UI clean
    return data.items.slice(0, 5).map((item: any) => mapRssItemToArticle(item, feedTitle));

  } catch (error) {
    console.error(`Failed to fetch or parse news for ${category}:`, error);
    // Propagate the error to the component to be handled in the UI
    throw error;
  }
};

/**
 * Fetches and processes live blog posts about African music from Google News.
 * @returns A promise that resolves to an array of Articles.
 */
export const fetchBlogPosts = async (): Promise<Article[]> => {
  console.log('Fetching live blog posts for African Music');
  const feedUrl = RSS_FEEDS.africanMusic;

  try {
    const response = await fetch(`${RSS2JSON_API}${encodeURIComponent(feedUrl)}`);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error(`rss2json API error: ${data.message}`);
    }
    
    const feedTitle = data.feed.title || 'Google News';
    // Limit to 5 most recent articles
    return data.items.slice(0, 5).map((item: any) => mapRssItemToArticle(item, feedTitle));

  } catch (error) {
    console.error(`Failed to fetch or parse blog posts:`, error);
    throw error;
  }
};