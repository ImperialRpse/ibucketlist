import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/item';

export type BlockedUser = {
  id: string;
  blocked_id: string;
  created_at: string;
  profiles: Profile | null;
};

/**
 * 特定Usersに対するブロック状態を管理するフック
 * profileUserId: ブロック対象のUsersID
 * currentUserId: 現在Login中のUsersID
 */
export const useBlock = (profileUserId: string, currentUserId: string | null) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  // ブロック状態を確認
  const checkBlockStatus = useCallback(async () => {
    if (!currentUserId || !profileUserId) return;
    const { data } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', profileUserId)
      .maybeSingle();
    setIsBlocked(!!data);
  }, [currentUserId, profileUserId]);

  useEffect(() => {
    checkBlockStatus();
  }, [checkBlockStatus]);

  // ブロック / アンブロック切り替え
  const toggleBlock = async () => {
    if (!currentUserId) return;
    setBlockLoading(true);
    try {
      if (isBlocked) {
        await supabase
          .from('blocks')
          .delete()
          .eq('blocker_id', currentUserId)
          .eq('blocked_id', profileUserId);
        setIsBlocked(false);
      } else {
        await supabase
          .from('blocks')
          .insert({ blocker_id: currentUserId, blocked_id: profileUserId });
        setIsBlocked(true);
      }
    } finally {
      setBlockLoading(false);
    }
  };

  return { isBlocked, blockLoading, toggleBlock };
};

/**
 * 自分がブロックしているUsers一覧を取得するフック（ブロックリストモーダル用）
 */
export const useBlockList = (currentUserId: string | null) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockListLoading, setBlockListLoading] = useState(false);

  const fetchBlockedUsers = useCallback(async () => {
    if (!currentUserId) return;
    setBlockListLoading(true);
    try {
      const { data } = await supabase
        .from('blocks')
        .select('id, blocked_id, created_at, profiles:blocked_id(id, display_name, avatar_url, bio, is_public)')
        .eq('blocker_id', currentUserId)
        .order('created_at', { ascending: false });
      setBlockedUsers((data ?? []) as unknown as BlockedUser[]);
    } finally {
      setBlockListLoading(false);
    }
  }, [currentUserId]);

  const unblockUser = async (blockedId: string) => {
    if (!currentUserId) return;
    await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', blockedId);
    await fetchBlockedUsers();
  };

  return { blockedUsers, blockListLoading, fetchBlockedUsers, unblockUser };
};

/**
 * 自分がブロックしているUsersIDの配列を返すユーティリティ関数
 */
export const fetchBlockedUserIds = async (currentUserId: string): Promise<string[]> => {
  const { data } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', currentUserId);
  return (data ?? []).map((b) => b.blocked_id);
};
