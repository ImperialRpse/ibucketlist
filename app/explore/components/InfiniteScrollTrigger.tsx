import { useRef, useEffect } from 'react';

type Props = {
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

export function InfiniteScrollTrigger({ hasMore, loading, loadingMore, onLoadMore }: Props) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore]);

  return (
    <div ref={observerTarget} className="py-6 flex justify-center">
      {loadingMore && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />}
      {!hasMore && !loading && (
        <span className="text-sm text-gray-400">すべての結果を表示しました</span>
      )}
    </div>
  );
}
