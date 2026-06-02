'use client';
import { ItemCard } from '@/components/ItemCard';
import { useTimeline } from '@/hooks/useTimeline';
import PullToRefresh from 'react-simple-pull-to-refresh';

export default function TimelinePage() {
  const { items, currentUserId, loading, activeTab, setActiveTab, toggleLike, refresh } = useTimeline();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-[calc(env(safe-area-inset-top,0px)+68px)] pb-[calc(env(safe-area-inset-bottom,0px)+84px)] md:py-6 h-screen overflow-y-auto">
      {/* タブ */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 text-sm font-bold tracking-wide transition-all duration-200 border-b-2 ${
            activeTab === 'all'
              ? 'text-blue-600 border-blue-500'
              : 'text-gray-500 border-transparent hover:text-gray-800'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`flex-1 py-3 text-sm font-bold tracking-wide transition-all duration-200 border-b-2 ${
            activeTab === 'following'
              ? 'text-blue-600 border-blue-500'
              : 'text-gray-500 border-transparent hover:text-gray-800'
          }`}
        >
          Following
        </button>
      </div>

      <PullToRefresh onRefresh={refresh} pullingContent="" refreshingContent={<div className="text-center text-gray-500 py-4 text-sm font-semibold">Refreshing...</div>}>
        {/* コンテンツ */}
        {loading ? (
          <div className="p-10 text-center text-gray-600">Loading...</div>
        ) : items.length === 0 && activeTab === 'following' ? (
          <div className="p-10 text-center text-gray-500 min-h-[50vh]">
            <p className="text-lg">No posts from users you follow</p>
            <p className="text-sm mt-2">Let's follow other users</p>
          </div>
        ) : (
          <div className="grid gap-4 min-h-[50vh]">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                currentUserId={currentUserId}
                toggleLike={toggleLike}
              />
            ))}
          </div>
        )}
      </PullToRefresh>
    </div>
  );
}