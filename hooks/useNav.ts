import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/notification';

export const useNav = () => {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    //通知dropdownが開いていればtrue
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const fetchProfile = async (id: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', id)
            .single();
        if (data) setAvatarUrl(data.avatar_url);
    };

    const fetchNotifications = async (uid: string) => {
        const { data } = await supabase
            .from('notifications')
            .select(`
        id, type, is_read, created_at, item_id,
        actor:actor_id ( display_name, avatar_url )
      `)
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const normalized = data.map((row: any) => ({
                ...row,
                actor: Array.isArray(row.actor) ? (row.actor[0] ?? null) : row.actor,
            }));
            setNotifications(normalized as Notification[]);
        }
    };

    const markAllRead = async () => {
        if (!userId || unreadCount === 0) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    };

    useEffect(() => {
        //通知ドロップダウンの外側をクリックしたときに、ドロップダウンを自動的に閉じる
        const handler = (e: MouseEvent) => {
            //DOM要素が作成された後、notifRefの中身がnullから切り替わる
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        let notifChannel: ReturnType<typeof supabase.channel> | null = null;

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserEmail(user.email ?? null);
                setUserId(user.id);
                fetchProfile(user.id);
                fetchNotifications(user.id);

                notifChannel = supabase
                    .channel(`notifications:${user.id}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${user.id}`,
                        },
                        () => fetchNotifications(user.id)
                    )
                    .subscribe();
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                setUserEmail(session.user.email ?? null);
                setUserId(session.user.id);
                fetchProfile(session.user.id);
                fetchNotifications(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUserEmail(null);
                setUserId(null);
                setAvatarUrl(null);
                setNotifications([]);
                if (notifChannel) supabase.removeChannel(notifChannel);
            }
        });

        return () => {
            subscription.unsubscribe();
            if (notifChannel) supabase.removeChannel(notifChannel);
        };
    }, []);

    return {
        userEmail,
        userId,
        avatarUrl,
        notifications,
        isNotifOpen,
        setIsNotifOpen,
        notifRef,
        unreadCount,
        markAllRead
    };
};
