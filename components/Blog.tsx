
import React, { useState, useEffect } from 'react';
import { fetchBlogPosts } from '../services/newsService';
import { Article } from '../types';

const Blog: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBlogPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedArticles = await fetchBlogPosts();
        setArticles(fetchedArticles);
      } catch (err) {
        setError("Failed to load blog posts. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBlogPosts();
  }, []); // Run only once on mount

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
      return <p className="text-center text-slate-500 py-4">No blog posts available at the moment.</p>;
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

  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-4 tracking-wide text-amber-300">African Music Blog</h2>
      {renderContent()}
    </section>
  );
};

export default Blog;
