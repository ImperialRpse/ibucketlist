'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TimelinePage() {
  const [items, setItems] = useState<any[]>([]);

  const fetchAllItems = async () => {
    // 全ユーザーのデータを取得（.eq('user_id', ...) を書かないのがコツ）
    const { data, error } = await supabase
      .from('bucket_items')
      .select(`
      *,
      profiles (
        display_name
      )`)
      .order('created_at', { ascending: false });

    if (data) setItems(data);
  };

  useEffect(() => {
    fetchAllItems();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Everyone's Bucket List</h1>
      
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="p-6 border rounded-xl shadow-sm bg-white text-black border-gray-200">
            <p className="text-sm font-bold text-blue-600 mb-1">
            {item.profiles?.display_name || '名無しのユーザー'}
            </p>
            <p className="text-lg font-medium mb-2">{item.title}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>投稿日: {new Date(item.created_at).toLocaleDateString()}</span>
              <span className="bg-gray-100 px-2 py-1 rounded">User ID: {item.user_id.slice(0, 8)}...</span>
            </div>
          </div>
        ))}
      </div>
      
      {items.length === 0 && (
        <p className="text-center text-gray-500">まだ投稿がありません。</p>
      )}
    </div>
  );
}