import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { insertNotification } from '@/lib/notifications';
import { FollowRequest } from '@/types/item';

export const useFollowRequests = () => {
    const [requests, setRequests] = useState<FollowRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }
        setCurrentUserId(user.id);

        // Step1: フォローリクエスト一覧を取得
        const { data: requestData, error } = await supabase
            .from('follow_requests')
            .select('id, requester_id, target_id, created_at')
            .eq('target_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('follow_requests fetch error:', JSON.stringify(error));
            setLoading(false);
            return;
        }

        if (!requestData || requestData.length === 0) {
            setRequests([]);
            setLoading(false);
            return;
        }

        // Step2: リクエスト送信者のプロフィールをまとめて取得
        const requesterIds = requestData.map((r) => r.requester_id);
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio, is_public')
            .in('id', requesterIds);

        const profileMap = new Map(profilesData?.map((p) => [p.id, p]) ?? []);

        const merged = requestData.map((r) => ({
            ...r,
            profiles: profileMap.get(r.requester_id) ?? undefined,
        }));

        setRequests(merged as unknown as FollowRequest[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // フォローリクエストを承認する
    const approveRequest = async (requestId: string, requesterId: string) => {
        if (!currentUserId) return;

        // 1. follows テーブルに INSERT（フォロー関係を確立）
        const { error: followError } = await supabase
            .from('follows')
            .insert({ follower_id: requesterId, following_id: currentUserId });

        if (followError) {
            console.error('follow insert error:', followError);
            return;
        }

        // 2. follow_requests から DELETE
        const { error: deleteError } = await supabase
            .from('follow_requests')
            .delete()
            .eq('id', requestId);

        if (deleteError) {
            console.error('follow_request delete error:', deleteError);
            return;
        }

        // 3. 承認通知を送信
        await insertNotification(requesterId, currentUserId, 'follow_request_approved');

        // リストを更新
        await fetchRequests();
    };

    // フォローリクエストを拒否する
    const rejectRequest = async (requestId: string) => {
        const { error } = await supabase
            .from('follow_requests')
            .delete()
            .eq('id', requestId);

        if (error) {
            console.error('follow_request delete error:', error);
            return;
        }

        await fetchRequests();
    };

    return {
        requests,
        loading,
        approveRequest,
        rejectRequest,
    };
};
