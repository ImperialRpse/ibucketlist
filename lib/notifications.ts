import { supabase } from '@/lib/supabase';

type NotifType = 'like' | 'comment' | 'reply' | 'follow' | 'dm';

/**
 * 通知をINSERTする共通関数
 * @param userId   通知を受け取るユーザーID
 * @param actorId  通知を発生させたユーザーID
 * @param type     通知タイプ
 * @param itemId   関連投稿ID（follow/dm は null）
 */
export async function insertNotification(
    userId: string,
    actorId: string,
    type: NotifType,
    itemId: string | null = null
): Promise<void> {
    // 自分自身への通知はスキップ
    if (userId === actorId) return;

    await supabase.from('notifications').insert({
        user_id: userId,
        actor_id: actorId,
        type,
        item_id: itemId,
        is_read: false,
    });
}
