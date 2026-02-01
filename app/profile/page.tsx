'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function BucketListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false); // 新規作成用
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false); // 完了報告用
  const [newItem, setNewItem] = useState('');
  // 完了報告用のステート
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reflection, setReflection] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  // 画像アップロード用のステート
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 1. データの取得
  const fetchItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('bucket_items')
        .select('*')
        .eq('user_id', user.id)
        .order('is_completed', { ascending: true }) // 未完了を上に、完了済みを下に
        .order('created_at', { ascending: false });

      if (data) setItems(data);
      if (error) console.error("データ取得エラー:", error.message);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  // 新規アイテム追加
  const addItem = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!newItem || !user) return;

    await supabase.from('bucket_items').insert([
      { title: newItem, user_id: user.id }
    ]);
    
    setNewItem('');
    setIsOpen(false);
    fetchItems();
  };

  // 完了ポップアップを開く
  const openCompleteModal = (item: any) => {
    setSelectedItem(item);
    setIsCompleteModalOpen(true);
  };

  // 完了保存処理（アップロードを含む）
  const handleCompleteSave = async () => {
    if (!selectedItem || !imageFile) {
      alert("写真を選択してください");
      return;
    }

    setUploading(true);
    try {
      // 1. Storageへアップロード
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('bucket_photos')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 2. 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('bucket_photos')
        .getPublicUrl(filePath);

      // 3. Databaseを更新
      const { error: updateError } = await supabase
        .from('bucket_items')
        .update({
          is_completed: true,
          reflection: reflection,
          image_url: publicUrl, // ここにStorageのURLを入れる
        })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      setIsCompleteModalOpen(false);
      setReflection('');
      setImageFile(null);
      setPreviewUrl(null);
      fetchItems();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };



  // ファイルが選択された時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file)); // プレビュー用URLを作成
  };

  return (
    <div className="max-w-md mx-auto p-4 text-black pb-24">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">マイプロフィール</h1>
        <Link href="/profile/settings" className="text-gray-400 hover:text-blue-500 transition-colors">
          ⚙️ 設定
        </Link>
      </div>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
        My Bucket List
      </h2>

      {/* リスト表示 */}
      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`p-5 border rounded-3xl shadow-sm bg-white transition-all ${
              item.is_completed ? 'border-green-100 bg-green-50/30' : 'border-gray-100'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-lg font-medium ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {item.title}
              </span>
              
              {!item.is_completed ? (
                <button 
                  onClick={() => openCompleteModal(item)}
                  className="w-6 h-6 border-2 border-blue-500 rounded-md flex items-center justify-center hover:bg-blue-50 transition-colors"
                >
                  {/* チェックボックス風のボタン */}
                </button>
              ) : (
                <span className="text-green-500 text-xl font-bold">✅</span>
              )}
            </div>

            {/* 完了している場合の追加表示（写真と感想） */}
            {item.is_completed && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-500">
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt="思い出" 
                    className="w-full h-40 object-cover rounded-2xl mb-3 shadow-sm"
                  />
                )}
                {item.reflection && (
                  <p className="text-sm text-gray-600 bg-white/80 p-3 rounded-xl italic border border-green-50">
                    "{item.reflection}"
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-center text-gray-400 mt-10">リストはまだ空っぽです。</p>
      )}

      {/* 右下の＋ボタン */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 w-16 h-16 bg-blue-500 text-white rounded-full shadow-2xl text-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        ＋
      </button>

      {/* 1. 新規投稿モーダル */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative z-10">
            <h2 className="text-xl font-bold mb-4 text-center">新しい「やりたいこと」</h2>
            <input 
              className="w-full border-2 p-3 rounded-xl mb-4 text-black bg-gray-50 focus:border-blue-500 outline-none"
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

      {/* 2. 完了報告ポップアップ（モーダル） */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative animate-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-1 text-center text-gray-800">達成おめでとう！🎉</h2>
            {selectedItem && (
              <p className="text-blue-600 font-semibold text-center mb-1 text-sm">「{selectedItem.title}」</p>
            )}
            <p className="text-gray-500 text-center mb-6 text-sm">思い出を記録しましょう</p>

            <div className="space-y-4">
              {/* 写真アップロードエリア */}
              <div>
                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">写真（ドラッグ＆ドロップ可）</label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-2 text-center hover:bg-gray-50 hover:border-green-300 transition-all group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    onChange={handleFileChange}
                  />
                  
                  {previewUrl ? (
                    <div className="relative h-40 w-full">
                      <img 
                        src={previewUrl} 
                        className="w-full h-full object-cover rounded-xl" 
                        alt="Preview" 
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                        <p className="text-white text-xs font-bold">写真を変更する</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center">
                      <div className="text-3xl mb-2">📸</div>
                      <p className="text-sm text-gray-500 font-bold">写真をアップロード</p>
                      <p className="text-[10px] text-gray-400">タップまたはファイルをドラッグ</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 感想入力エリア */}
              <div>
                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">感想・ひとこと</label>
                <textarea 
                  className="w-full border-2 p-3 rounded-xl bg-gray-50 h-24 focus:border-green-500 outline-none resize-none text-black transition-colors"
                  placeholder="どんな最高な体験でしたか？"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </div>
            </div>

            {/* ボタンエリア */}
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => {
                  setIsCompleteModalOpen(false);
                  setPreviewUrl(null); // キャンセル時にプレビューを消す
                  setImageFile(null);
                }} 
                className="flex-1 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                disabled={uploading}
              >
                戻る
              </button>
              <button 
                onClick={handleCompleteSave} 
                disabled={uploading || !imageFile}
                className={`flex-1 text-white py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
                  uploading || !imageFile 
                  ? 'bg-gray-300 shadow-none cursor-not-allowed' 
                  : 'bg-green-500 shadow-green-100 hover:bg-green-600'
                }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    保存中...
                  </span>
                ) : '記録する'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      

    </div>
  );
}