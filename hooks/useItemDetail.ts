/*
ts(タイプスクリプト) ファイルとは
ロジックや設定、型定義だけを書くためのファイルです。
HTMLタグは書けず、純粋なプログラムコードのみを記述します

*/


import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { insertNotification } from '@/lib/notifications';
import { Comment, BucketItem } from '@/types/item';

export const useItemDetail = (itemId: string) => {
    const [item, setItem] = useState<BucketItem | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);

    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [replyText, setReplyText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

    //useCallback を指定すると依存配列（第2引数）が変わらない限り、同じ関数を使い回す。
    //画面が再レンダリングされるとき、新しいインスタンスがつくられない
    const fetchItemData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bucket_items')
            .select(`
                *,
                profiles ( display_name, avatar_url ),
                likes ( user_id ),
                comments ( id ) 
            `)
            .eq('id', itemId)
            .single();

        if (error) {
            console.error("Fetch Error:", error.message);
        } else if (data) {
            setItem(data as BucketItem);
        }
        setLoading(false);
    }, [itemId]);

    const buildCommentTree = (flatComments: Comment[]): Comment[] => {
        const map: Record<string, Comment> = {};
        const roots: Comment[] = [];

        flatComments.forEach((c) => { map[c.id] = { ...c, replies: [] }; });
        flatComments.forEach((c) => {
            if (c.parent_id && map[c.parent_id]) {
                map[c.parent_id].replies!.push(map[c.id]);
            } else {
                roots.push(map[c.id]);
            }
        });

        return roots;
    };

    const fetchComments = useCallback(async (targetItemId: string) => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                id, content, created_at, user_id, parent_id,
                profiles ( display_name, avatar_url )
            `)
            .eq('item_id', targetItemId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("コメント取得エラー:", error.message);
        } else {
            const normalized: Comment[] = (data || []).map((row) => ({
                ...row,
                profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles,
            })) as Comment[];
            setComments(buildCommentTree(normalized));
        }
    }, []);

    //itemIdやfetchItemDataやfetchCommentsが変更、または新しく作り直されたときに実行される
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
            await fetchItemData();
            await fetchComments(itemId);
        };
        init();
    }, [itemId, fetchItemData, fetchComments]);

    const handleAddComment = async () => {
        if (!newComment.trim() || !currentUserId || !item) return;

        const { error } = await supabase
            .from('comments')
            .insert({
                item_id: item.id,
                user_id: currentUserId,
                content: newComment,
                parent_id: null,
            });

        if (!error) {
            await insertNotification(item.user_id, currentUserId, 'comment', item.id);
            setNewComment('');
            fetchComments(item.id);
            // itemData also gets fetched to update the comment count on the left
            fetchItemData();
        }
    };

    const handleAddReply = async () => {
        if (!replyText.trim() || !currentUserId || !item || !replyingTo) return;

        const { error } = await supabase
            .from('comments')
            .insert({
                item_id: item.id,
                user_id: currentUserId,
                content: replyText,
                parent_id: replyingTo.id,
            });

        if (!error) {
            await insertNotification(replyingTo.user_id, currentUserId, 'reply', item.id);
            setReplyText('');
            setReplyingTo(null);
            setExpandedReplies((prev) => new Set([...prev, replyingTo.id]));
            fetchComments(item.id);
        }
    };

    const toggleReplies = (commentId: string) => {
        setExpandedReplies((prev) => {
            const next = new Set(prev);
            if (next.has(commentId)) next.delete(commentId);
            else next.add(commentId);
            return next;
        });
    };

    const toggleLike = async () => {
        if (!currentUserId || !item) return alert("ログインが必要です");
        const isLikedByMe = item.likes?.some((like) => like.user_id === currentUserId);

        if (isLikedByMe) {
            await supabase.from('likes').delete().eq('item_id', item.id).eq('user_id', currentUserId);
        } else {
            await supabase.from('likes').insert({ item_id: item.id, user_id: currentUserId });
            await insertNotification(item.user_id, currentUserId, 'like', item.id);
        }
        await fetchItemData();
    };

    //変数や関数をまとめて呼び出し元に返す
    return {
        item,
        currentUserId,
        loading,
        comments,
        newComment,
        setNewComment,
        replyingTo,
        setReplyingTo,
        replyText,
        setReplyText,
        expandedReplies,
        handleAddComment,
        handleAddReply,
        toggleReplies,
        toggleLike
    };
};
