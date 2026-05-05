import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BucketItem, Profile } from '@/types/item';

const ITEMS_PER_PAGE = 20;

export const useExplore = (searchQuery: string, category: string, tab: 'items' | 'users') => {
  const [items, setItems] = useState<BucketItem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setPage(0);
    setHasMore(true);

    try {
      // items tab の場合はSearch語かカテゴリをキーワードとして扱う
      if (tab === 'items') {
        const rpcQuery = searchQuery || category || '';

        const { data, error } = await supabase.rpc('search_bucket_items', {
          search_term: rpcQuery,
          limit_num: ITEMS_PER_PAGE,
          offset_num: 0
        });

        if (error) throw error;
        
        let filteredData = data;
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map((item: any) => item.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, is_public')
            .in('id', userIds);
          
          const publicUserIds = new Set(
            profilesData?.filter(p => p.is_public !== false).map(p => p.id) || []
          );
          filteredData = data.filter((item: any) => publicUserIds.has(item.user_id));
        }

        setItems((filteredData as BucketItem[]) || []);
        setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
      } 
      // users tab の場合はSearch語のみをキーワードとする
      else if (tab === 'users') {
        const { data, error } = await supabase.rpc('search_profiles', {
          search_term: searchQuery || '',
          limit_num: ITEMS_PER_PAGE,
          offset_num: 0
        });

        if (error) throw error;
        setProfiles((data as Profile[]) || []);
        setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, category, tab]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    
    const nextPage = page + 1;
    const nextOffset = nextPage * ITEMS_PER_PAGE;

    try {
      if (tab === 'items') {
        const rpcQuery = searchQuery || category || '';

        const { data, error } = await supabase.rpc('search_bucket_items', {
          search_term: rpcQuery,
          limit_num: ITEMS_PER_PAGE,
          offset_num: nextOffset
        });

        if (error) throw error;
        
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map((item: any) => item.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, is_public')
            .in('id', userIds);
          
          const publicUserIds = new Set(
            profilesData?.filter(p => p.is_public !== false).map(p => p.id) || []
          );
          const filteredData = data.filter((item: any) => publicUserIds.has(item.user_id));

          setItems(prev => {
            // 重複排除ロジック（万が一の重複防止）
            const prevIds = new Set(prev.map(i => i.id));
            const newItems = (filteredData as BucketItem[]).filter(i => !prevIds.has(i.id));
            return [...prev, ...newItems];
          });
          setPage(nextPage);
          if (data.length < ITEMS_PER_PAGE) setHasMore(false);
        } else {
          setHasMore(false);
        }
      } 
      else if (tab === 'users') {
        const { data, error } = await supabase.rpc('search_profiles', {
          search_term: searchQuery || '',
          limit_num: ITEMS_PER_PAGE,
          offset_num: nextOffset
        });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setProfiles(prev => {
            const prevIds = new Set(prev.map(p => p.id));
            const newProfiles = (data as Profile[]).filter(p => !prevIds.has(p.id));
            return [...prev, ...newProfiles];
          });
          setPage(nextPage);
          if (data.length < ITEMS_PER_PAGE) setHasMore(false);
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Error loading more data:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return {
    items,
    profiles,
    loading,
    loadingMore,
    hasMore,
    loadMore
  };
};
