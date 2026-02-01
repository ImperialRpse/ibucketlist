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

  // 💡 ロード時にプロフィールを読み込む
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, bio')
          .eq('id', user.id)
          .single();

        if (data) {
          setName(data.display_name || '');
          setBio(data.bio || ''); // 💡 既存のBioをセット
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);




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