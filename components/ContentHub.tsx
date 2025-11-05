

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Article, MusicEvent } from '../types';
import { getArticleSummary, getLocalMusicEvents } from '../services/geminiService';
import { fetchNews, fetchBlogPosts } from '../services/newsService';

const ContentHub: React.FC = () => {
  const [activeHubTab, setActiveHubTab] = useState<'news' | 'blog' | 'events'>('news');
  
  // News State
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>('luton');
  const [newsArticles, setNewsArticles] = useState<Record<string, Article[]>>({});
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Blog State
  const [blogArticles, setBlogArticles] = useState<Article[]>([]);
  const [activeBlogCategory, setActiveBlogCategory] = useState<string>('All');
  const [isBlogLoading, setIsBlogLoading] = useState(true);
  const [blogError, setBlogError] = useState<string | null>(null);
  
  // Events State
  const [events, setEvents] = useState<MusicEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Summary State
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Fetch News Data
  useEffect(() => {
    const loadNews = async () => {
      // Don't refetch if we already have data for this category
      if (newsArticles[activeNewsCategory]) {
        return;
      }
      setIsNewsLoading(true);
      setNewsError(null);
      try {
        const fetchedArticles = await fetchNews(activeNewsCategory as 'luton' | 'uk' | 'world');
        setNewsArticles(prev => ({ ...prev, [activeNewsCategory]: fetchedArticles }));
      } catch (error) {
        setNewsError(`Failed to load news for ${activeNewsCategory}. Please try again later.`);
      } finally {
        setIsNewsLoading(false);
      }
    };

    if (activeHubTab === 'news') {
      loadNews();
    }
  }, [activeHubTab, activeNewsCategory, newsArticles]);

  // Fetch Blog Data (only once)
  useEffect(() => {
    const loadBlogPosts = async () => {
      if (blogArticles.length > 0) return;
      setIsBlogLoading(true);
      setBlogError(null);
      try {
        const fetchedArticles = await fetchBlogPosts();
        setBlogArticles(fetchedArticles);
      } catch (error) {
        setBlogError('Failed to load blog posts. Please try again later.');
      } finally {
        setIsBlogLoading(false);
      }
    };

    if (activeHubTab === 'blog') {
      loadBlogPosts();
    }
  }, [activeHubTab, blogArticles.length]);
  
  // Fetch Events Data (only once)
  useEffect(() => {
    const loadEvents = async () => {
      if (events.length > 0) return; // Don't refetch
      setIsEventsLoading(true);
      setEventsError(null);
      try {
        const fetchedEvents = await getLocalMusicEvents();
        setEvents(fetchedEvents);
      } catch (error: any) {
        setEventsError(error.message || 'Failed to load local events.');
      } finally {
        setIsEventsLoading(false);
      }
    };

    if (activeHubTab === 'events') {
      loadEvents();
    }
  }, [activeHubTab, events.length]);


  const blogCategories = useMemo(() => ['All', ...new Set(blogArticles.flatMap(a => a.category ? [a.category] : []))], [blogArticles]);

  const filteredBlogArticles = useMemo(() => {
    if (activeBlogCategory === 'All') return blogArticles;
    return blogArticles.filter(a => a.category === activeBlogCategory);
  }, [blogArticles, activeBlogCategory]);
  
  const handleGetSummary = useCallback(async (article: Article) => {
    if (summaries[article.id]) { // Toggle off if already visible
        setSummaries(prev => { const newSummaries = { ...prev }; delete newSummaries[article.id]; return newSummaries; });
        return;
    }
    setLoadingSummary(article.id);
    setSummaryError(null);
    try {
        const summary = await getArticleSummary(article.title, article.source);
        setSummaries(prev => ({ ...prev, [article.id]: summary }));
    } catch (err) {
        setSummaryError('Could not generate summary.');
    } finally {
        setLoadingSummary(null);
    }
  }, [summaries]);
  
  const HubTab: React.FC<{ name: 'news' | 'blog' | 'events'; children: React.ReactNode }> = ({ name, children }) => (
    <button onClick={() => setActiveHubTab(name)} className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors w-full sm:w-auto ${activeHubTab === name ? 'bg-slate-800/50 text-amber-300 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}`}>{children}</button>
  );

  const CategoryButton: React.FC<{ name: string; activeCategory: string; onClick: (name: string) => void }> = ({ name, activeCategory, onClick }) => (
     <button onClick={() => onClick(name)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${activeCategory === name ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}>{name}</button>
  );

  const ArticleItem: React.FC<{ article: Article }> = ({ article }) => (
      <div className="p-3 rounded-lg hover:bg-slate-800/50 transition-colors group">
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="block">
          <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors">{article.title}</h4>
          <p className="text-xs text-slate-400 mt-1">{article.source}</p>
        </a>
        <div className="mt-2">
            <button onClick={() => handleGetSummary(article)} disabled={loadingSummary === article.id} className="text-xs text-amber-400 hover:text-amber-300 font-semibold disabled:opacity-50 disabled:cursor-wait">{loadingSummary === article.id ? 'Summarizing...' : (summaries[article.id] ? 'Hide Summary' : 'Read Summary')}</button>
        </div>
        {summaries[article.id] && (<div className="mt-2 p-3 text-sm bg-slate-700/50 rounded-md border-l-2 border-amber-500 text-slate-300 prose prose-invert">{summaryError ? <span className="text-red-400">{summaryError}</span> : summaries[article.id]}</div>)}
      </div>
  );

  const renderContent = (isLoading: boolean, error: string | null, articles: Article[], noContentMsg: string) => {
    if (isLoading) return <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div></div>;
    if (error) return <p className="text-center text-red-400 py-4">{error}</p>;
    if (articles.length === 0) return <p className="text-center text-slate-500 py-4">{noContentMsg}</p>;
    return <div className="space-y-2">{articles.map(article => <ArticleItem key={article.id} article={article} />)}</div>;
  };
  
  const renderEvents = () => {
    if (isEventsLoading) return <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div></div>;
    if (eventsError) return <p className="text-center text-red-400 py-4">{eventsError}</p>;
    if (events.length === 0) return <p className="text-center text-slate-500 py-4">No upcoming events found in the area. Check back soon!</p>;
    
    return (
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <h4 className="font-bold text-lg text-white">{event.eventName}</h4>
            <div className="mt-2 text-sm space-y-1 text-slate-300">
              <p><span className="font-semibold text-amber-400">Date:</span> {event.date}</p>
              <p><span className="font-semibold text-amber-400">Venue:</span> {event.venue}</p>
              <p className="pt-2 border-t border-slate-700 mt-2">{event.description}</p>
              {event.sourceUrl && (
                <div className="pt-2 border-t border-slate-700 mt-2">
                  <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 font-semibold text-xs transition-colors">
                    View Source &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };


  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold tracking-wide text-amber-300">Content Hub</h2>
      <div className="flex flex-col sm:flex-row border-b border-slate-700/50 mt-4">
        <HubTab name="news">Latest Headlines</HubTab>
        <HubTab name="blog">African Music Blog</HubTab>
        <HubTab name="events">Events Hub</HubTab>
      </div>
      
      <div className="mt-4">
        {activeHubTab === 'news' && (
          <div className="animate-fade-in" key="news">
            <div className="flex flex-wrap gap-2 mb-4">
              {['luton', 'uk', 'world'].map(cat => <CategoryButton key={cat} name={cat} activeCategory={activeNewsCategory} onClick={setActiveNewsCategory} />)}
            </div>
            {renderContent(isNewsLoading, newsError, newsArticles[activeNewsCategory] || [], 'No headlines available for this category.')}
          </div>
        )}

        {activeHubTab === 'blog' && (
          <div className="animate-fade-in" key="blog">
            <div className="flex flex-wrap gap-2 mb-4">
              {blogCategories.map(cat => <CategoryButton key={cat} name={cat} activeCategory={activeBlogCategory} onClick={setActiveBlogCategory} />)}
            </div>
             {renderContent(isBlogLoading, blogError, filteredBlogArticles, 'No blog posts available at the moment.')}
          </div>
        )}
        
        {activeHubTab === 'events' && (
          <div className="animate-fade-in" key="events">
            {renderEvents()}
          </div>
        )}
      </div>
    </section>
  );
};

export default ContentHub;