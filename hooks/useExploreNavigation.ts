import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Tab = 'items' | 'users';

/**
 * Exploreページのクエリパラメータ操作・UI状態を管理するカスタムフック
 */
export const useExploreNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const tab = (searchParams.get('tab') as Tab) || 'items';

  const [searchInput, setSearchInput] = useState(query);

  // URLのクエリが変わったときに入力欄を同期する
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

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

  const handleTabChange = (newTab: Tab) => {
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

  return {
    query,
    category,
    tab,
    searchInput,
    setSearchInput,
    handleSearch,
    handleTabChange,
    handleCategoryClick,
  };
};
