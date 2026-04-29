export type Notification = {
    id: string;
    type: 'like' | 'comment' | 'reply' | 'follow' | 'follow_request' | 'follow_request_approved' | 'dm';
    is_read: boolean;
    created_at: string;
    item_id: string | null;
    actor: {
        display_name: string | null;
        avatar_url: string | null;
    } | null;
};
