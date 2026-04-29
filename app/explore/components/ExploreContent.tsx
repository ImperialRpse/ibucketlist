'use client';

import { useExplore } from '@/hooks/useExplore';
import { useExploreNavigation } from '@/hooks/useExploreNavigation';
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
import { ExploreTabBar } from './ExploreTabBar';
import { ItemList } from './ItemList';
import { UserList } from './UserList';
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger';

export default function ExploreContent() {
  const {
    query,
    category,
    tab,
    searchInput,
    setSearchInput,
    handleSearch,
    handleTabChange,
    handleCategoryClick,
  } = useExploreNavigation();

  const { items, profiles, loading, loadingMore, hasMore, loadMore } = useExplore(query, category, tab);

  const hasResults = items.length > 0 || profiles.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Explore</h1>

      {/* ── 検索バー ── */}
      <SearchBar value={searchInput} onChange={setSearchInput} onSubmit={handleSearch} />

      {/* ── カテゴリフィルター（キーワード検索中は非表示） ── */}
      {!query && (
        <CategoryFilter activeCategory={category} onCategoryClick={handleCategoryClick} />
      )}

      {/* ── 検索結果エリア ── */}
      <div className="mt-8">
        {(query || category) && (
          <p className="text-gray-600 mb-4 font-medium">
            {query ? `「${query}」の検索結果` : `カテゴリ「${category}」の検索結果`}
          </p>
        )}

        <ExploreTabBar activeTab={tab} onTabChange={handleTabChange} />

        {/* ── 結果一覧 ── */}
        <div className="min-h-[200px]">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              {tab === 'items' ? (
                <ItemList items={items} />
              ) : (
                <UserList profiles={profiles} />
              )}
            </>
          )}

          {/* ── 無限スクロールトリガー ── */}
          {hasResults && (
            <InfiniteScrollTrigger
              hasMore={hasMore}
              loading={loading}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          )}
        </div>
      </div>
    </div>
  );
}
