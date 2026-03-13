import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { insertNotification } from '@/lib/notifications';
import { BucketItem } from '@/types/item';

export const useTimeline = () => {
    const [items, setItems] = useState<BucketItem[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAllItems = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bucket_items')
            .select(`
                *,
                profiles ( display_name, avatar_url ),
                likes ( user_id ),
                comments ( id ) 
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch Error:", error.message);
        } else if (data) {
            setItems(data as BucketItem[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
            await fetchAllItems();
        };
        init();
    }, [fetchAllItems]);

    const toggleLike = async (e: React.MouseEvent, itemId: string, isLikedByMe: boolean) => {
        e.stopPropagation();
        if (!currentUserId) return alert("ログインが必要です");

        if (isLikedByMe) {
            await supabase.from('likes').delete().eq('item_id', itemId).eq('user_id', currentUserId);
        } else {
            await supabase.from('likes').insert({ item_id: itemId, user_id: currentUserId });
            const item = items.find((i) => i.id === itemId);
            if (item) await insertNotification(item.user_id, currentUserId, 'like', itemId);
        }
        await fetchAllItems();
    };

    return {
        items,
        currentUserId,
        loading,
        toggleLike
    };
};
