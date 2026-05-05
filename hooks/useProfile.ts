import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { insertNotification } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import { BucketItem, Profile } from '@/types/item';
import { useBlock } from '@/hooks/useBlock';

type FollowModalType = 'followers' | 'following' | null;

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
    const [newCategory, setNewCategory] = useState('Others');
    const [selectedItem, setSelectedItem] = useState<BucketItem | null>(null);
    const [reflection, setReflection] = useState('');
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isRequestSent, setIsRequestSent] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    // フォロー一覧モーダル用
    const [followModalType, setFollowModalType] = useState<FollowModalType>(null);
    const [followListUsers, setFollowListUsers] = useState<Profile[]>([]);
    const [followListLoading, setFollowListLoading] = useState(false);

    // Private Account制御用
    const [isPrivateRestricted, setIsPrivateRestricted] = useState(false);
    
    // Editモーダル用のState
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BucketItem | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editCategory, setEditCategory] = useState('Others');

    const router = useRouter();

    // ブロック機能
    const { isBlocked, blockLoading, toggleBlock } = useBlock(profileUserId, currentUserId);

    const fetchAllData = useCallback(async () => {
        setLoading(true);

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setCurrentUserId(currentUser?.id ?? null);

        const currentIsMe = currentUser?.id === profileUserId;
        setIsMe(currentIsMe);

        const { data: bucketData } = await supabase
            .from('bucket_items')
            .select('*, profiles(display_name, bio, avatar_url, is_public), likes(user_id), comments(id)')
            .eq('user_id', profileUserId)
            .order('created_at', { ascending: false });

        if (bucketData) {
            // プロフィール取得
            let fetchedProfile: Profile | null = null;
            if (bucketData.length > 0) {
                fetchedProfile = bucketData[0].profiles as Profile;
                setProfile(fetchedProfile);
            } else {
                const { data: prof } = await supabase.from('profiles').select('*').eq('id', profileUserId).single();
                fetchedProfile = prof as Profile;
                setProfile(fetchedProfile);
            }

            // Private Accountのアクセス制御
            const isPrivate = fetchedProfile && fetchedProfile.is_public === false;
            if (isPrivate && !currentIsMe) {
                // フォロワーかどうか確認
                let isFollower = false;
                if (currentUser) {
                    const { data: followCheck } = await supabase
                        .from('follows')
                        .select('*')
                        .eq('follower_id', currentUser.id)
                        .eq('following_id', profileUserId)
                        .maybeSingle();
                    isFollower = !!followCheck;
                }
                if (!isFollower) {
                    setItems([]);
                    setIsPrivateRestricted(true);
                } else {
                    setItems(bucketData as BucketItem[]);
                    setIsPrivateRestricted(false);
                }
            } else {
                setItems(bucketData as BucketItem[]);
                setIsPrivateRestricted(false);
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

            // Follow RequestsSend済みかどうか確認
            const { data: requestData } = await supabase
                .from('follow_requests')
                .select('id')
                .eq('requester_id', currentUser.id)
                .eq('target_id', profileUserId)
                .maybeSingle();

            setIsRequestSent(!!requestData);
        }

        setLoading(false);
    }, [profileUserId]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const toggleLike = async (e: React.MouseEvent, itemId: string, isLikedByMe: boolean) => {
        e.stopPropagation();
        if (!currentUserId) return alert('Loginが必要です');
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
        if (!user) return alert("Loginが必要です");

        if (isFollowing) {
            // フォロー解除
            await supabase.from('follows')
                .delete()
                .eq('follower_id', user.id)
                .eq('following_id', profileUserId);
            setIsFollowing(false);
            setFollowerCount(prev => prev - 1);
        } else if (isRequestSent) {
            // Follow RequestsをCancel
            await supabase.from('follow_requests')
                .delete()
                .eq('requester_id', user.id)
                .eq('target_id', profileUserId);
            setIsRequestSent(false);
        } else if (profile?.is_public === false) {
            // 非公開アカウント → Follow RequestsSend
            await supabase.from('follow_requests')
                .insert({ requester_id: user.id, target_id: profileUserId });
            await insertNotification(profileUserId, user.id, 'follow_request');
            setIsRequestSent(true);
        } else {
            // 公開アカウント → 即時フォロー
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
            { title: newItem, description: newItemDescription, category: newCategory, user_id: user.id }
        ]);

        setNewItem('');
        setNewItemDescription('');
        setNewCategory('Others');
        setIsOpen(false);
        fetchAllData();
    };

    const updateItem = async () => {
        if (!isMe || !editingItem || !editTitle) return;

        const { error } = await supabase
            .from('bucket_items')
            .update({ title: editTitle, description: editDescription, category: editCategory })
            .eq('id', editingItem.id);

        if (error) {
            alert('Update failed');
            return;
        }

        setIsEditModalOpen(false);
        setEditingItem(null);
        setEditTitle('');
        setEditDescription('');
        setEditCategory('Others');
        fetchAllData();
    };

    const deleteItem = async (item: BucketItem) => {
        if (!isMe) return;

        const { error } = await supabase
            .from('bucket_items')
            .delete()
            .eq('id', item.id);

        if (error) {
            alert('Deleteに失敗しました');
            return;
        }

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
        if (!me) return alert("Loginが必要です");
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
            console.error("Detailsエラー:", JSON.stringify(error, null, 2), error);
            alert("Failed to create message room");
        } finally {
            setLoading(false);
        }
    };

    const openFollowModal = useCallback(async (type: 'followers' | 'following') => {
        setFollowModalType(type);
        setFollowListUsers([]);
        setFollowListLoading(true);

        try {
            if (type === 'followers') {
                // Step1: このUsersをフォローしている人のIDを取得
                const { data: followData, error: followError } = await supabase
                    .from('follows')
                    .select('follower_id')
                    .eq('following_id', profileUserId);

                if (followError) throw followError;

                const ids = (followData ?? []).map((row) => row.follower_id).filter(Boolean);
                if (ids.length === 0) { setFollowListUsers([]); return; }

                // Step2: IDからプロフィールを取得
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, display_name, avatar_url, bio')
                    .in('id', ids);

                if (profileError) throw profileError;
                setFollowListUsers((profileData ?? []) as Profile[]);

            } else {
                // Step1: このUsersがフォローしている人のIDを取得
                const { data: followData, error: followError } = await supabase
                    .from('follows')
                    .select('following_id')
                    .eq('follower_id', profileUserId);

                if (followError) throw followError;

                const ids = (followData ?? []).map((row) => row.following_id).filter(Boolean);
                if (ids.length === 0) { setFollowListUsers([]); return; }

                // Step2: IDからプロフィールを取得
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, display_name, avatar_url, bio')
                    .in('id', ids);

                if (profileError) throw profileError;
                setFollowListUsers((profileData ?? []) as Profile[]);
            }
        } catch (e) {
            console.error('followModal error:', e);
        } finally {
            setFollowListLoading(false);
        }
    }, [profileUserId]);

    const closeFollowModal = useCallback(() => {
        setFollowModalType(null);
        setFollowListUsers([]);
    }, []);

    return {
        items,
        profile,
        isMe,
        loading,
        currentUserId,
        isPrivateRestricted,
        isOpen,
        setIsOpen,
        isCompleteModalOpen,
        setIsCompleteModalOpen,
        newItem,
        setNewItem,
        newItemDescription,
        setNewItemDescription,
        newCategory,
        setNewCategory,
        selectedItem,
        setSelectedItem,
        reflection,
        setReflection,
        uploading,
        imageFile,
        previewUrl,
        isFollowing,
        isRequestSent,
        followerCount,
        followingCount,
        toggleLike,
        toggleFollow,
        addItem,
        isEditModalOpen,
        setIsEditModalOpen,
        editingItem,
        setEditingItem,
        editTitle,
        setEditTitle,
        editDescription,
        setEditDescription,
        editCategory,
        setEditCategory,
        updateItem,
        deleteItem,
        handleCompleteSave,
        handleFileChange,
        handleStartMessage,
        followModalType,
        followListUsers,
        followListLoading,
        openFollowModal,
        closeFollowModal,
        isBlocked,
        blockLoading,
        toggleBlock
    };
};
