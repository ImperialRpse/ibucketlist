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
      
      {/* 入力フォーム */}
      <form onSubmit={addItem} className="flex gap-2 mb-6">
        <input
          className="border p-2 flex-grow rounded bg-white text-black"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="死ぬまでにやりたいことは？"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded">追加</button>
      </form>

      {/* リスト表示 */}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="p-3 border rounded shadow-sm flex justify-between">
            <span>{item.title}</span>
            <input type="checkbox" checked={item.is_completed} readOnly />
          </li>
        ))}
      </ul>
      <Link href="/add">
        <button className="fixed bottom-10 right-10 w-16 h-16 bg-blue-500 text-white rounded-full shadow-lg text-3xl flex items-center justify-center hover:bg-blue-600 transition-colors">
          ＋
        </button>
      </Link>
      {/* ポップアップ（モーダル） */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-80 shadow-xl">
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