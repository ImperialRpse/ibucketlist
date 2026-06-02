import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { insertNotification } from '@/lib/notifications';
import { BucketItem } from '@/types/item';
import { fetchBlockedUserIds } from '@/hooks/useBlock';

export type TimelineTab = 'all' | 'following';

export const useTimeline = () => {
    const [items, setItems] = useState<BucketItem[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TimelineTab>('all');

    const fetchAllItems = useCallback(async (userId?: string | null) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bucket_items')
            .select(`
                *,
                profiles ( display_name, avatar_url, is_public ),
                likes ( user_id ),
                comments ( id ) 
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch Error:", error.message);
        } else if (data) {
            // ブロックしたUsersのIDを取得
            const blockedIds = userId ? await fetchBlockedUserIds(userId) : [];

            // 自分がフォローしているUsersのIDを取得
            let followingIds: string[] = [];
            if (userId) {
                const { data: followData, error: followError } = await supabase
                    .from('follows')
                    .select('following_id')
                    .eq('follower_id', userId);

                if (!followError && followData) {
                    followingIds = followData.map((f) => f.following_id);
                }
            }

            const filteredData = data.filter((item: any) =>
                (item.profiles?.is_public !== false || item.user_id === userId || followingIds.includes(item.user_id))
                && !blockedIds.includes(item.user_id)
            );
            setItems(filteredData as BucketItem[]);
        }
        setLoading(false);
    }, []);

    const fetchFollowingItems = useCallback(async (userId: string) => {
        setLoading(true);

        // 自分がフォローしているUsersのIDを取得
        const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);

        if (followError) {
            console.error("Follow Fetch Error:", followError.message);
            setLoading(false);
            return;
        }

        const followingIds = followData?.map((f) => f.following_id) ?? [];

        if (followingIds.length === 0) {
            setItems([]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('bucket_items')
            .select(`
                *,
                profiles ( display_name, avatar_url, is_public ),
                likes ( user_id ),
                comments ( id ) 
            `)
            .in('user_id', followingIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Following Items Fetch Error:", error.message);
        } else if (data) {
            // ブロックしたUsersの投稿を除外
            const blockedIds = await fetchBlockedUserIds(userId);
            const filteredData = (data as BucketItem[]).filter(
                (item) => !blockedIds.includes(item.user_id)
            );
            setItems(filteredData);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const uid = user?.id ?? null;
            if (uid) setCurrentUserId(uid);
            await fetchAllItems(uid);
        };
        init();
    }, [fetchAllItems]);

    // タブ切り替え時のデータ再取得
    useEffect(() => {
        if (activeTab === 'all') {
            fetchAllItems(currentUserId);
        } else if (activeTab === 'following' && currentUserId) {
            fetchFollowingItems(currentUserId);
        }
    }, [activeTab, currentUserId, fetchAllItems, fetchFollowingItems]);

    const toggleLike = async (e: React.MouseEvent, itemId: string, isLikedByMe: boolean) => {
        e.stopPropagation();
        if (!currentUserId) return alert("Login required");

        if (isLikedByMe) {
            await supabase.from('likes').delete().eq('item_id', itemId).eq('user_id', currentUserId);
        } else {
            await supabase.from('likes').insert({ item_id: itemId, user_id: currentUserId });
            const item = items.find((i) => i.id === itemId);
            if (item) await insertNotification(item.user_id, currentUserId, 'like', itemId);
        }

        // いいね後も現在のタブのデータを再取得
        if (activeTab === 'all') {
            await fetchAllItems(currentUserId);
        } else if (currentUserId) {
            await fetchFollowingItems(currentUserId);
        }
    };

    // 手動リフレッシュ用の関数
    const refresh = async () => {
        if (activeTab === 'all') {
            await fetchAllItems(currentUserId);
        } else if (activeTab === 'following' && currentUserId) {
            await fetchFollowingItems(currentUserId);
        }
    };

    return {
        items,
        currentUserId,
        loading,
        activeTab,
        setActiveTab,
        toggleLike,
        refresh,
    };
};
