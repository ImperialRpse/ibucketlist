'use client';
import { useEffect, useState, useRef, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [myId, setMyId] = useState<string | null>(null);
  const [partner, setPartner] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 1. 初期データ（自分、相手、過去ログ）の取得
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      setMyId(user.id);

      // 相手の情報を取得
      const { data: participants } = await supabase
        .from('dm_participants')
        .select('profiles(id, display_name, avatar_url)')
        .eq('room_id', roomId)
        .neq('user_id', user.id)
        .single();
      
      if (participants) setPartner(participants.profiles);

      // 過去のメッセージを取得
      const { data: msgs } = await supabase
        .from('dm_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      
      setMessages(msgs || []);
    };

    fetchData();

    // 2. リアルタイム購読（重要！）
    const channel = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // メッセージ送信
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !myId) return;

    const messageContent = newMessage;
    setNewMessage(''); // 入力欄を先にクリア

    const { error } = await supabase
      .from('dm_messages')
      .insert({
        room_id: roomId,
        sender_id: myId,
        content: messageContent
      });

    if (error) alert('送信に失敗しました');
  };

  return (
    <div className="flex flex-col h-screen bg-white text-black max-w-md mx-auto border-x">
      {/* ヘッダー */}
      <div className="p-4 border-b flex items-center gap-3 sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="text-gray-500 text-xl">←</button>
        <Link href={`/profile/${partner?.id}`} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
            {partner?.avatar_url && <img src={partner.avatar_url} className="w-full h-full object-cover" />}
          </div>
          <span className="font-bold">{partner?.display_name || 'Loading...'}</span>
        </Link>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isMe = m.sender_id === myId;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                isMe ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}>
                {m.content}
                <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* 入力フォーム */}
      <form onSubmit={sendMessage} className="p-4 border-t flex gap-2 bg-white pb-10">
        <input
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          placeholder="メッセージを入力..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm">送信</button>
      </form>
    </div>
  );
}