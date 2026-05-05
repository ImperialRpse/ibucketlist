import { supabase } from '@/lib/supabase';

type NotifType = 'like' | 'comment' | 'reply' | 'follow' | 'follow_request' | 'follow_request_approved' | 'dm';

/**
 * NotificationsをINSERTする共通関数
 * @param userId   Notificationsを受け取るUsersID
 * @param actorId  Notificationsを発生させたUsersID
 * @param type     Notificationsタイプ
 * @param itemId   関連投稿ID（follow/dm は null）
 */
export async function insertNotification(
    userId: string,
    actorId: string,
    type: NotifType,
    itemId: string | null = null
): Promise<void> {
    // 自分自身へのNotificationsはスキップ
    if (userId === actorId) return;

    // Notificationsを受け取るUsers（userId）がNotificationsを発生させたUsers（actorId）をブロックしている場合はスキップ
    const { data: blockData } = await supabase
        .from('blocks')
        .select('id')
        .eq('blocker_id', userId)
        .eq('blocked_id', actorId)
        .maybeSingle();

    if (blockData) return;

    await supabase.from('notifications').insert({
        user_id: userId,
        actor_id: actorId,
        type,
        item_id: itemId,
        is_read: false,
    });
}
