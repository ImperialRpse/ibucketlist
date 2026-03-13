export type Profile = {
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
};

export type Comment = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    parent_id: string | null;
    item_id?: string;
    profiles: Profile | null;
    replies?: Comment[];
};

export type Like = {
    user_id: string;
    item_id?: string;
};

export type BucketItem = {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    is_completed: boolean;
    image_url: string | null;
    reflection: string | null;
    created_at: string;
    profiles: Profile | null;
    likes: Like[];
    comments: { id: string }[];
};
