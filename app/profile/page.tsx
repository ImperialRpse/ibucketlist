'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function BucketListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newItem, setNewItem] = useState('');

  // 1. データの取得
const fetchItems = async () => {
  // 1. まず現在のログイン情報を取得し、{ data: { user } } という形で user を取り出す
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // 2. もし user が無事に取得できていたら、その ID を使ってデータを検索する
  if (user) {
    const { data, error } = await supabase
      .from('bucket_items')
      .select('*')
      .eq('user_id', user.id) // ここで user.id を使う
      .order('created_at', { ascending: false });

    if (data) setItems(data);
    if (error) console.error("データ取得エラー:", error.message);
  } else {
    console.log("バケットリストを作成・編集するにはログインしてください");
  }
};

  useEffect(() => { fetchItems(); }, []);

  const addItem = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!newItem || !user) return;

    await supabase.from('bucket_items').insert([
      { title: newItem, user_id: user.id }
    ]);
    
    setNewItem('');
    setIsOpen(false); // 投稿したら閉じる
    fetchItems(); // リストを更新
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Bucket List</h1>
      

      {/* リスト表示 */}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="p-3 border rounded shadow-sm flex justify-between">
            <span>{item.title}</span>
            <input type="checkbox" checked={item.is_completed} readOnly />
          </li>
        ))}
      </ul>
      {/* 右下の＋ボタン */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 w-16 h-16 bg-blue-500 text-white rounded-full shadow-2xl text-3xl flex items-center justify-center hover:scale-110 transition-transform"
      >
        ＋
      </button>

      {/* ポップアップ（モーダル） */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* モーダルの外側をクリックしたら閉じるための透明な層 */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
          {/* 入力フォーム本体 */}
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200">
            <h2 className="text-black font-bold mb-4 text-center">新しい「やりたいこと」</h2>
            <input 
              className="w-full border p-2 rounded mb-4 text-black bg-gray-50"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="例：スカイダイビングをする"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setIsOpen(false)} className="flex-1 text-gray-500 py-2">キャンセル</button>
              <button onClick={addItem} className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-bold">追加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}