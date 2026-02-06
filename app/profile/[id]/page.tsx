'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // URLパラメータ（[id]）を取得
  const { id: profileUserId } = use(params);

  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isMe, setIsMe] = useState(false);
  const [loading, setLoading] = useState(true);

  // モーダル・ステート類
  const [isOpen, setIsOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reflection, setReflection] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 1. データの取得
  const fetchProfileData = async () => {
    // 現在のログインユーザーを取得
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const currentIsMe = currentUser?.id === profileUserId;
    setIsMe(currentIsMe);

    // 表示対象ユーザーの投稿とプロフィールを取得
    const { data, error } = await supabase
      .from('bucket_items')
      .select(`
        *,
        profiles (
          display_name,
          bio
        )
      `)
      .eq('user_id', profileUserId)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data);
      // profilesの情報は1つ目から取得、データがない場合は別途取得
      if (data.length > 0) {
        setProfile(data[0].profiles);
      } else {
        const { data: prof } = await supabase
          .from('profiles')
          .select('display_name, bio')
          .eq('id', profileUserId)
          .single();
        if (prof) setProfile(prof);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, [profileUserId]);

  // 新規アイテム追加（自分の場合のみ）
  const addItem = async () => {
    if (!isMe || !newItem) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('bucket_items').insert([
      { title: newItem, user_id: user.id }
    ]);

    setNewItem('');
    setIsOpen(false);
    fetchProfileData();
  };

  // 完了保存処理
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
      fetchProfileData();
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

  if (loading) return <div className="p-10 text-center text-white">Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-4 pb-24 text-white">
      {/* インスタ風プロフィールヘッダーセクション */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 px-4 mt-6">
        {/* アイコンエリア */}
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
            <div className="w-full h-full rounded-full border-4 border-[#121212] overflow-hidden bg-gray-200 flex items-center justify-center">
              <span className="text-3xl md:text-5xl font-bold text-gray-500">
                {profile?.display_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </div>

        {/* ユーザー情報 & 統計情報エリア */}
        <div className="flex-1 text-center md:text-left w-full min-w-0">
          <div className="flex flex-row flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
            <h2 className="text-2xl font-light text-white tracking-tight whitespace-nowrap shrink-0">
              {profile?.display_name || 'ユーザー名'}
            </h2>
            
            {/* 💡 自分かどうかで表示を切り替え */}
            {isMe ? (
              <Link
                href="/profile/settings"
                className="inline-block bg-white/20 hover:bg-white/30 text-white text-sm font-bold py-1.5 px-6 rounded-lg transition-colors text-center"
              >
                Edit Profile
              </Link>
            ) : (
              <div className="flex gap-2">
                <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-1.5 px-6 rounded-lg transition-colors">
                  Follow
                </button>
                <button className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold py-1.5 px-6 rounded-lg transition-colors">
                  Message
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-center md:justify-start gap-6 mb-4 text-gray-300 text-sm">
            <div><span className="font-bold text-white">{items.length}</span> posts</div>
            <div><span className="font-bold text-white">0</span> followers</div>
            <div><span className="font-bold text-white">0</span> following</div>
          </div>

          <div className="text-sm">
            <p className="text-gray-400 whitespace-pre-wrap">
              {profile?.bio || 'Bio here...'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-600 mb-8 flex justify-center">
        <div className="border-t-2 border-white -mt-[2px] pt-3 flex items-center gap-2 px-4">
          <span className="text-xs font-bold tracking-widest uppercase text-white">My Bucket List</span>
        </div>
      </div>

      {/* リスト表示 */}
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-5 border rounded-3xl shadow-sm transition-all ${
              item.is_completed ? 'border-green-100 bg-green-50/10' : 'border-gray-800 bg-[#1e1e1e]'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-lg font-medium ${item.is_completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                {item.title}
              </span>

              {/* 💡 自分のプロフィールかつ未完了の時だけチェックボタンを表示 */}
              {isMe && !item.is_completed && (
                <button
                  onClick={() => {
                    setSelectedItem(item);
                    setIsCompleteModalOpen(true);
                  }}
                  className="w-6 h-6 border-2 border-blue-500 rounded-md flex items-center justify-center hover:bg-blue-50/10 transition-colors"
                />
              )}
              {item.is_completed && <span className="text-green-500 text-xl font-bold">✅</span>}
            </div>

            {item.is_completed && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-500">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt="思い出"
                    className="w-full max-h-96 object-contain rounded-2xl mb-3 shadow-sm bg-black/20"
                  />
                )}
                {item.reflection && (
                  <p className="text-sm text-gray-300 bg-black/20 p-3 rounded-xl italic border border-green-900/30">
                    "{item.reflection}"
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 自分のみ＋ボタンを表示 */}
      {isMe && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-10 right-10 w-16 h-16 bg-blue-500 text-white rounded-full shadow-2xl text-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
        >
          ＋
        </button>
      )}

      {/* 新規投稿モーダル (isMeの時のみ動作) */}
      {isOpen && isMe && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative z-10 text-black">
            <h2 className="text-xl font-bold mb-4 text-center">新しい「やりたいこと」</h2>
            <input
              className="w-full border-2 p-3 rounded-xl mb-4 bg-gray-50 focus:border-blue-500 outline-none"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="例：スカイダイビングをする"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setIsOpen(false)} className="flex-1 text-gray-500 py-2">キャンセル</button>
              <button onClick={addItem} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold">追加</button>
            </div>
          </div>
        </div>
      )}

      {/* 完了報告モーダル (isMeの時のみ動作) */}
      {isCompleteModalOpen && isMe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative animate-in zoom-in duration-200 text-black">
            <h2 className="text-2xl font-bold mb-1 text-center text-gray-800">達成おめでとう！🎉</h2>
            <p className="text-blue-600 font-semibold text-center mb-6 text-sm">「{selectedItem?.title}」</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">写真を選択</label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-2 text-center hover:bg-gray-50 hover:border-green-300 transition-all group">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} />
                  {previewUrl ? (
                    <img src={previewUrl} className="w-full max-h-60 object-contain rounded-xl" alt="Preview" />
                  ) : (
                    <div className="py-8">
                      <div className="text-3xl mb-2">📸</div>
                      <p className="text-sm text-gray-500 font-bold">写真をアップロード</p>
                    </div>
                  )}
                </div>
              </div>
              <textarea
                className="w-full border-2 p-3 rounded-xl bg-gray-50 h-24 focus:border-green-500 outline-none resize-none"
                placeholder="どんな最高な体験でしたか？"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
              />
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setIsCompleteModalOpen(false)} className="flex-1 text-gray-400 font-bold" disabled={uploading}>戻る</button>
              <button 
                onClick={handleCompleteSave} 
                disabled={uploading || !imageFile}
                className={`flex-1 text-white py-3 rounded-xl font-bold ${uploading || !imageFile ? 'bg-gray-300' : 'bg-green-500 shadow-lg shadow-green-100'}`}
              >
                {uploading ? '保存中...' : '記録する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}