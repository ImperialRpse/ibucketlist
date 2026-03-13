import { Notification } from '@/types/notification';

export type NotificationDropdownProps = {
    notifications: Notification[];
    unreadCount: number;
    markAllRead: () => void;
};

// 通知ごとのメッセージを返す
const notifLabel = (n: Notification): string => {
    const name = n.actor?.display_name || 'ユーザー';
    switch (n.type) {
        case 'like': return `${name} があなたの投稿にいいねしました`;
        case 'comment': return `${name} があなたの投稿にコメントしました`;
        case 'reply': return `${name} があなたのコメントに返信しました`;
        case 'follow': return `${name} があなたをフォローしました`;
        case 'dm': return `${name} からメッセージが届きました`;
        default: return '新しい通知があります';
    }
};

export const NotificationDropdown = ({
    notifications,
    unreadCount,
    markAllRead
}: NotificationDropdownProps) => {
    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <span className="font-bold text-gray-800 text-sm">通知</span>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="text-xs text-blue-500 hover:underline font-semibold"
                    >
                        すべて既読
                    </button>
                )}
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-10">通知はありません</p>
                ) : (
                    notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`flex items-start gap-3 px-4 py-3 transition-colors ${n.is_read ? 'bg-white' : 'bg-blue-50'}`}
                        >
                            {/* アクターのアバター */}
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">
                                {n.actor?.avatar_url ? (
                                    <img src={n.actor.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    n.actor?.display_name?.[0]?.toUpperCase() || '?'
                                )}
                            </div>

                            {/* テキスト */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-800 leading-snug">
                                    {notifLabel(n)}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    {new Date(n.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            {/* 未読ドット */}
                            {!n.is_read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
