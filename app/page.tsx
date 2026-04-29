'use client';
import { ItemCard } from '@/components/ItemCard';
import { useTimeline } from '@/hooks/useTimeline';

export default function TimelinePage() {
  const { items, currentUserId, loading, activeTab, setActiveTab, toggleLike } = useTimeline();

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* タブ */}
      <div className="flex border-b border-white/20 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-all duration-200 ${
            activeTab === 'all'
              ? 'text-white border-b-2 border-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-all duration-200 ${
            activeTab === 'following'
              ? 'text-white border-b-2 border-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          Following
        </button>
      </div>

      {/* コンテンツ */}
      {loading ? (
        <div className="p-10 text-center text-white">Loading...</div>
      ) : items.length === 0 && activeTab === 'following' ? (
        <div className="p-10 text-center text-white/60">
          <p className="text-lg">フォロー中のユーザーの投稿がありません</p>
          <p className="text-sm mt-2">他のユーザーをフォローしてみましょう</p>
        </div>
      ) : (
        <div className="grid gap-4">
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
    </div>
  );
}