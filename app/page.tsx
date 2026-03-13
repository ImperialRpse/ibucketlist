// 一番上の親玉です。ここに 'use client' と書くことで、「この page.tsx
//と、その中でインポートしている部品たちは全部ブラウザ用だよ」という境界線が引かれます。
'use client';
import { ItemCard } from '@/components/ItemCard';
import { useTimeline } from '@/hooks/useTimeline';

export default function TimelinePage() {
  const { items, currentUserId, loading, toggleLike } = useTimeline();

  if (loading && items.length === 0) {
    return <div className="p-10 text-center text-white">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Everyone's Bucket List</h1>

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
    </div>
  );
}