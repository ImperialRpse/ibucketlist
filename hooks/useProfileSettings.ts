import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export const useProfileSettings = () => {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data } = await supabase
                    .from('profiles')
                    .select('display_name, bio, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setName(data.display_name || '');
                    setBio(data.bio || '');
                    setAvatarUrl(data.avatar_url || null);
                }
            }
            setLoading(false);
        }
        loadProfile();
    }, []);
    //引数 event とは関数が呼び出された時に、JavaScript（React）が自動的に渡してくれる「イベントそのもの」が入る箱です。
    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) return;

            //ファイル取得
            const file = event.target.files[0];
            //拡張子取得(pop()は配列の最後の要素を取得)
            const fileExt = file.name.split('.').pop();
            //ファイル名生成
            const filePath = `${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            if (userId) {
                await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
            }

            alert('アイコンを更新しました！');
        } catch (error: unknown) {
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert('An unknown error occurred');
            }
        } finally {
            setUploading(false);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        if (!userId) {
            setSaving(false);
            return;
        }

        const { error } = await supabase.from('profiles').upsert({
            id: userId,
            display_name: name,
            bio: bio,
            updated_at: new Date(),
        });

        if (error) {
            alert('保存に失敗しました');
        } else {
            alert('保存しました！');
            // 保存後に自身のプロフィールページに遷移するように修正
            router.push(`/profile/${userId}`);
            router.refresh();
        }
        setSaving(false);
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('ログアウトに失敗しました');
        } else {
            router.push('/');
            router.refresh();
        }
    };

    return {
        name,
        setName,
        bio,
        setBio,
        loading,
        saving,
        avatarUrl,
        uploading,
        uploadAvatar,
        saveProfile,
        handleLogout
    };
};
