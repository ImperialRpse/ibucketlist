import { Suspense } from 'react';
import ExploreContent from './components/ExploreContent';

export const metadata = {
  title: 'Explore | Bucket List',
};

export default function ExplorePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Suspense fallback={<div className="text-center py-10 text-gray-500">読み込み中...</div>}>
        <ExploreContent />
      </Suspense>
    </div>
  );
}
