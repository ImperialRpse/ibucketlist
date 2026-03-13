import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { insertNotification } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import { BucketItem, Profile } from '@/types/item';

export const useProfile = (profileUserId: string) => {
    const [items, setItems] = useState<BucketItem[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isMe, setIsMe] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [newItem, setNewItem] = useState('');
    const [newItemDescription, setNewItemDescription] = useState('');
    const [selectedItem, setSelectedItem] = useState<BucketItem | null>(null);
    const [reflection, setReflection] = useState('');
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    const router = useRouter();

    const fetchAllData = useCallback(async () => {
        setLoading(true);

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setCurrentUserId(currentUser?.id ?? null);

        const currentIsMe = currentUser?.id === profileUserId;
        setIsMe(currentIsMe);

        const { data: bucketData } = await supabase
            .from('bucket_items')
            .select('*, profiles(display_name, bio, avatar_url), likes(user_id), comments(id)')
            .eq('user_id', profileUserId)
            .order('created_at', { ascending: false });

        if (bucketData) {
            setItems(bucketData as BucketItem[]);
            if (bucketData.length > 0) setProfile(bucketData[0].profiles as Profile);
            else {
                const { data: prof } = await supabase.from('profiles').select('*').eq('id', profileUserId).single();
                setProfile(prof as Profile);
            }
        }

        const { count: fers } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profileUserId);

        const { count: fings } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', profileUserId);

        setFollowerCount(fers || 0);
        setFollowingCount(fings || 0);

        if (currentUser && !currentIsMe) {
            const { data: followData } = await supabase
                .from('follows')
                .select('*')
                .eq('follower_id', currentUser.id)
                .eq('following_id', profileUserId)
                .maybeSingle();

            setIsFollowing(!!followData);
        }

        setLoading(false);
    }, [profileUserId]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const toggleLike = async (e: React.MouseEvent, itemId: string, isLikedByMe: boolean) => {
        e.stopPropagation();
        if (!currentUserId) return alert('ログインが必要です');
        if (isLikedByMe) {
            await supabase.from('likes').delete().eq('item_id', itemId).eq('user_id', currentUserId);
        } else {
            await supabase.from('likes').insert({ item_id: itemId, user_id: currentUserId });
            const item = items.find((i) => i.id === itemId);
            if (item) await insertNotification(item.user_id, currentUserId, 'like', itemId);
        }
        await fetchAllData();
    };

    const toggleFollow = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert("ログインが必要です");

        if (isFollowing) {
            await supabase.from('follows')
                .delete()
                .eq('follower_id', user.id)
                .eq('following_id', profileUserId);
            setIsFollowing(false);
            setFollowerCount(prev => prev - 1);
        } else {
            await supabase.from('follows')
                .insert({ follower_id: user.id, following_id: profileUserId });
            await insertNotification(profileUserId, user.id, 'follow');
            setIsFollowing(true);
            setFollowerCount(prev => prev + 1);
        }
    };

    const addItem = async () => {
        if (!isMe || !newItem) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('bucket_items').insert([
            { title: newItem, description: newItemDescription, user_id: user.id }
        ]);

        setNewItem('');
        setNewItemDescription('');
        setIsOpen(false);
        fetchAllData();
    };

    const handleCompleteSave = async () => {
        if (!isMe || !selectedItem || !imageFile) return;

        setUploading(true);
        try {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('bucket_photos')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('bucket_photos')
                .getPublicUrl(filePath);

            await supabase
                .from('bucket_items')
                .update({
                    is_completed: true,
                    reflection: reflection,
                    image_url: publicUrl,
                })
                .eq('id', selectedItem.id);

            setIsCompleteModalOpen(false);
            setReflection('');
            setImageFile(null);
            setPreviewUrl(null);
            fetchAllData();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleStartMessage = async () => {
        const { data: { user: me } } = await supabase.auth.getUser();
        if (!me) return alert("ログインが必要です");
        if (me.id === profileUserId) return;

        setLoading(true);

        try {
            const { data: myParticipants } = await supabase
                .from('dm_participants')
                .select('room_id')
                .eq('user_id', me.id);

            const myRoomIds = myParticipants?.map(p => p.room_id) || [];

            let roomId = null;

            if (myRoomIds.length > 0) {
                const { data: commonParticipant } = await supabase
                    .from('dm_participants')
                    .select('room_id')
                    .in('room_id', myRoomIds)
                    .eq('user_id', profileUserId)
                    .maybeSingle();

                if (commonParticipant) {
                    roomId = commonParticipant.room_id;
                }
            }

            if (roomId) {
                router.push(`/messages/${roomId}`);
            } else {
                const { data: newRoom, error: roomError } = await supabase
                    .from('dm_rooms')
                    .insert({})
                    .select()
                    .single();

                if (roomError) throw roomError;

                const { error: partError } = await supabase
                    .from('dm_participants')
                    .insert([
                        { room_id: newRoom.id, user_id: me.id },
                        { room_id: newRoom.id, user_id: profileUserId }
                    ]);

                if (partError) throw partError;

                router.push(`/messages/${newRoom.id}`);
            }
        } catch (error) {
            console.error("詳細エラー:", JSON.stringify(error, null, 2), error);
            alert("メッセージルームの作成に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return {
        items,
        profile,
        isMe,
        loading,
        currentUserId,
        isOpen,
        setIsOpen,
        isCompleteModalOpen,
        setIsCompleteModalOpen,
        newItem,
        setNewItem,
        newItemDescription,
        setNewItemDescription,
        selectedItem,
        setSelectedItem,
        reflection,
        setReflection,
        uploading,
        imageFile,
        previewUrl,
        isFollowing,
        followerCount,
        followingCount,
        toggleLike,
        toggleFollow,
        addItem,
        handleCompleteSave,
        handleFileChange,
        handleStartMessage
    };
};
