'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState(''); // 💡 自己紹介用のステート
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // 💡 保存中の状態管理
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);　// 💡 アバターURL用のステート
  const [uploading, setUploading] = useState(false);

  // 💡 ロード時にプロフィールを読み込む
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, bio, avatar_url') // avatar_urlを追加
          .eq('id', user.id)
          .single();

        if (data) {
          setName(data.display_name || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || null); // セット
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  // 💡 画像アップロード関数
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random()}.${fileExt}`; // 重複防止

      // 1. Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // 3. Profilesテーブルを即座に更新（保存ボタンを待たずに更新する方がUXが良いです）
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user?.id);

      alert('アイコンを更新しました！');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };




  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, bio')
        .eq('id', user.id)
        .single();

      if (data) {
        const [name, setName] = useState('');
        setName(data.display_name || '');
        setBio(data.bio || '');
      }
    }
    setLoading(false);
  };

  // プロフィールの保存（名前とBioを更新）
  const saveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // display_name と bio を一緒に保存
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: name,
      bio: bio,
      updated_at: new Date(),
    });

    if (error) {
      alert('保存に失敗しました');
    } else {
      alert('保存しました！');
      router.push('/profile');
      router.refresh();
    }
    setSaving(false);
  };

  // ログアウト処理
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('ログアウトに失敗しました');
    } else {
      // ログアウト後はトップページ（タイムライン）に飛ばす
      router.push('/');
      router.refresh(); // ヘッダーの表示（アイコン→ログインボタン）を更新するために実行
    }
  };

  if (loading) return <p className="text-center mt-10">読み込み中...</p>;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-3xl shadow-lg text-black">
      <h1 className="text-2xl font-bold mb-6">プロフィール設定</h1>

      <div className="flex flex-col items-center mb-8">
        <div className="relative group cursor-pointer">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                {name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
            {uploading ? '...' : '変更する'}
            <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
          </label>
        </div>
      </div>


      <label className="block mb-2 font-bold text-gray-600">表示名</label>
      <input
        className="w-full border-2 p-3 rounded-xl mb-6 bg-gray-50 focus:border-blue-500 outline-none"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="username"
      />

      {/* 💡 追加：自己紹介(Bio)の入力 */}
      <div>
        <label className="block mb-2 font-bold text-gray-600 text-sm ml-1">自己紹介 (Bio)</label>
        <textarea
          className="w-full border-2 p-3 rounded-xl bg-gray-50 h-32 focus:border-blue-500 outline-none resize-none transition-all"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio here..."
          maxLength={150}
        />
        <p className="text-right text-[10px] text-gray-400 mt-1">{bio.length} / 150</p>
      </div>


      <button onClick={saveProfile} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors">
        保存する
      </button>
      {/*ログアウトボタン */}
      <button
        onClick={handleLogout}
        className="w-full mt-4 bg-white text-red-500 py-3 rounded-xl font-bold border-2 border-red-500 hover:bg-red-50 transition-colors">
        ログアウト
      </button>
    </div>
  );
}