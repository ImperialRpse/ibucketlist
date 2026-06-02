import { Suspense } from 'react';
import ExploreContent from './components/ExploreContent';

export const metadata = {
  title: 'Explore | Bucket List',
};

export default function ExplorePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-[calc(env(safe-area-inset-top,0px)+68px)] pb-[calc(env(safe-area-inset-bottom,0px)+84px)] md:py-8">
      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading...</div>}>
        <ExploreContent />
      </Suspense>
    </div>
  );
}
