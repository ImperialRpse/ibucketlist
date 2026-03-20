'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useExplore } from '@/hooks/useExplore';
import { CATEGORIES } from '@/lib/constants';
import Link from 'next/link';

// NOTE: Please replace this with your actual ItemCard component if needed
// import ItemCard from '@/components/ItemCard';

// カテゴリを階層構造にパースする
const parseCategories = () => {
  return CATEGORIES.reduce((acc, cat) => {
    const match = cat.match(/^(.+?)(?:（(.+)）)?$/);
    if (match) {
      const main = match[1];
      const sub = match[2];
      if (!acc[main]) acc[main] = [];
      if (sub) acc[main].push(cat); // 小項目の方には元の値「旅行（日本）」を入れておく
    }
    return acc;
  }, {} as Record<string, string[]>);
};

const categoryTree = parseCategories();

export default function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const tab = (searchParams.get('tab') as 'items' | 'users') || 'items';

  const [searchInput, setSearchInput] = useState(query);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const { items, profiles, loading, loadingMore, hasMore, loadMore } = useExplore(query, category, tab);

  const observerTarget = useRef<HTMLDivElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // カテゴリの外側をクリックした時に閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(event.target as Node)) {
        setExpandedCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 無限スクロール用のオブザーバー設定
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set('q', searchInput.trim());
      params.delete('category'); // キーワード検索時はカテゴリ絞り込みを解除
    } else {
      params.delete('q');
    }
    router.push(`/explore?${params.toString()}`);
  };

  const handleTabChange = (newTab: 'items' | 'users') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`/explore?${params.toString()}`);
  };

  const handleCategoryClick = (catName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', catName);
    params.delete('q'); // カテゴリ検索時はキーワード検索を解除
    setSearchInput('');
    router.push(`/explore?${params.toString()}`);
  };

  const toggleCategoryExpand = (mainCat: string) => {
    setExpandedCategory(prev => (prev === mainCat ? null : mainCat));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Explore</h1>

      {/* ── 検索バー ── */}
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="投稿のタイトル、カテゴリー、またはユーザー名を検索..."
          className="w-full p-4 pl-12 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <button type="submit" className="hidden">検索</button>
      </form>

      {/* ── カテゴリ一覧 ── */}
      {(!query || query === '') && (
        <div ref={categoryContainerRef} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">カテゴリーから探す</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryTree).map(([mainCat, subCats]) => (
              <div key={mainCat} className="relative">
                <button
                  onClick={() => toggleCategoryExpand(mainCat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    expandedCategory === mainCat || (category && category.startsWith(mainCat))
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mainCat}
                </button>
                
                {/* 小項目の展開 */}
                {expandedCategory === mainCat && subCats.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 min-w-[200px] z-10 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {/* "全て" オプション */}
                    <button
                      onClick={() => handleCategoryClick(mainCat)}
                      className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                        category === mainCat ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600' : 'text-gray-700'
                      }`}
                    >
                      すべて
                    </button>

                    {subCats.map(fullCat => {
                      const subNameMatch = fullCat.match(/（(.+)）/);
                      const displaySubName = subNameMatch ? subNameMatch[1] : fullCat;
                      return (
                        <button
                          key={fullCat}
                          onClick={() => handleCategoryClick(fullCat)}
                          className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                            category === fullCat ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600' : 'text-gray-700'
                          }`}
                        >
                          {displaySubName}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 検索結果エリア ── */}
      <div className="mt-8">
        {(query || category) && (
          <p className="text-gray-600 mb-4 font-medium">
            {query ? `「${query}」の検索結果` : `カテゴリ「${category}」の検索結果`}
          </p>
        )}

        {/* タブ */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => handleTabChange('items')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'items' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bucket Items
          </button>
          <button
            onClick={() => handleTabChange('users')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ユーザー
          </button>
        </div>

        {/* 結果一覧 */}
        <div className="min-h-[200px]">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {tab === 'items' ? (
                items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        {/* 一時的な表示用。後で ItemCard コンポーネントに差し替える */}
                        <h3 className="font-bold text-gray-800 line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block mt-2">{item.category}</p>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">検索結果はありません</div>
                )
              ) : (
                profiles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {profiles.map(profile => (
                      <Link href={`/profile/${profile.id}`} key={profile.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-yellow-400 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.display_name || 'ユーザー'} className="w-full h-full object-cover" />
                          ) : (
                            <span>{(profile.display_name || 'U').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{profile.display_name}</p>
                          <p className="text-xs text-gray-500 truncate">{profile.bio || '自己紹介はありません'}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">検索結果はありません</div>
                )
              )}
            </>
          )}

          {/* 無限スクロールのトリガー */}
          {(items.length > 0 || profiles.length > 0) && (
            <div ref={observerTarget} className="py-6 flex justify-center">
              {loadingMore && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>}
              {!hasMore && !loading && (
                <span className="text-sm text-gray-400">すべての結果を表示しました</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
