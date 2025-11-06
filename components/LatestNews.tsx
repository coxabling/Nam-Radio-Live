
import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { fetchNews } from '../services/newsService';

type Category = 'namibia' | 'africa' | 'world';

const LatestNews: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Category>('namibia');
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedArticles = await fetchNews(activeTab as any); // Use `as any` because the component's type is slightly stricter
        setArticles(fetchedArticles);
      } catch (err) {
        setError(`Failed to load news for ${activeTab}. Please try again later.`);
      } finally {
        setIsLoading(false);
      }
    };
    loadNews();
  }, [activeTab]);


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
        </div>
      );
    }

    if (error) {
       return <p className="text-center text-red-400 py-4">{error}</p>;
    }

    if (articles.length === 0) {
      return <p className="text-center text-slate-500 py-4">No headlines available for this category.</p>;
    }

    return (
      <div className="space-y-4 mt-4">
        {articles.map((article) => (
          <div key={article.id} className="p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <h4 className="font-semibold text-white hover:text-amber-300 transition-colors">{article.title}</h4>
              <p className="text-xs text-slate-400 mt-1">{article.source}</p>
            </a>
          </div>
        ))}
      </div>
    );
  };
  
  const getTabClass = (tabName: Category) => {
    return `px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
      activeTab === tabName
        ? 'bg-amber-500 text-white'
        : 'text-slate-300 hover:bg-slate-700/50'
    }`;
  }

  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-4 tracking-wide text-amber-300">Latest Headlines</h2>
      <div className="flex space-x-2 border-b border-slate-700/50 mb-2">
        <button className={getTabClass('namibia')} onClick={() => setActiveTab('namibia')}>Namibia</button>
        <button className={getTabClass('africa')} onClick={() => setActiveTab('africa')}>Africa</button>
        <button className={getTabClass('world')} onClick={() => setActiveTab('world')}>World News</button>
      </div>
      {renderContent()}
    </section>
  );
};

export default LatestNews;