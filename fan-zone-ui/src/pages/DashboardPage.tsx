import React, { useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { FeedFilter } from '../components/feed/FeedFilter';
import { ContentCard } from '../components/feed/ContentCard';
import { VideoCard } from '../components/feed/VideoCard';
import { PollCard } from '../components/feed/PollCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { useFeed } from '../hooks/useFeed';
import { mockPolls } from '../utils/mockData';
import { ContentItem } from '../types';
import { Star } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { items, isLoading, filter, setFilter, fetchContent } = useFeed();

  useEffect(() => {
    if (items.length === 0) fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  const getPollForContent = (item: ContentItem) => {
    return mockPolls.find(p => p.id === `poll${item.id.replace('c', '')}`);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user && (
          <div className="bg-slate-800 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-white font-bold text-xl">Welcome back, {user.displayName}! 👋</h1>
              <p className="text-slate-400 text-sm">Keep predicting to climb the leaderboard</p>
            </div>
            <div className="flex items-center gap-2 bg-green-900/30 border border-green-800 rounded-lg px-4 py-2">
              <Star className="h-5 w-5 text-green-400" />
              <span className="text-green-300 font-bold">{user.xpScore.toLocaleString()} XP</span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <FeedFilter activeFilter={filter} onFilterChange={setFilter} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-lg font-medium">No content found</p>
            <p className="text-sm">Try a different filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(item => {
              if (item.type === 'video') return <VideoCard key={item.id} item={item} />;
              if (item.type === 'poll') {
                const poll = getPollForContent(item) ?? mockPolls[0];
                return <PollCard key={item.id} poll={poll} />;
              }
              return <ContentCard key={item.id} item={item} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
};
