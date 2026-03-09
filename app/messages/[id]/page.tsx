'use client';
import { useEffect, useState, useRef, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { insertNotification } from '@/lib/notifications';

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [myId, setMyId] = useState<string | null>(null);
  const [partner, setPartner] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {




    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      setMyId(user.id);

      // 1. 既読にする (RPCを呼び出し)      
      markRead();

      const { data: participants } = await supabase
        .from('dm_participants')
        .select('profiles(id, display_name, avatar_url)')
        .eq('room_id', roomId)
        .neq('user_id', user.id)
        .single();

      if (participants) setPartner(participants.profiles);

      const { data: msgs } = await supabase
        .from('dm_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);
    };



    fetchData();

    const channel = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);

        // 2. メッセージを受信した瞬間に既読を更新する
        // (自分が送ったメッセージでも相手が送ったものでも、今この画面を開いているなら既読扱い)
        markRead();
      })
      .subscribe();



    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, router]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  //data baseでRPC関数呼び出し
  const markRead = async () => {
    const { error } = await supabase.rpc('mark_messages_as_read', { target_room_id: roomId });
    if (error) {
      console.error("既読更新エラー:", error.message);
    } else {
      console.log("既読にしました！ 部屋ID:", roomId);
    }
  };

  //メッセージ送信処理関数
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !myId) return;

    const content = newMessage;
    setNewMessage('');

    const { error } = await supabase
      .from('dm_messages')
      .insert({ room_id: roomId, sender_id: myId, content });

    if (error) return;
    // 相手に「DM」通知
    if (partner?.id) {
      await insertNotification(partner.id, myId, 'dm');
    }
    markRead();
  };



  return (
    <div className="flex flex-col h-full bg-[#121212]">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#121212]/90 backdrop-blur-sm z-10">
        <Link href={`/profile/${partner?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 border border-gray-700">
            {partner?.avatar_url && <img src={partner.avatar_url} className="w-full h-full object-cover" />}
          </div>
          <span className="font-bold text-gray-100">{partner?.display_name || 'Loading...'}</span>
        </Link>
      </div>

      {/* メッセージ表示 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-800">
        {messages.map((m) => {
          const isMe = m.sender_id === myId;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${isMe
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-[#262626] text-gray-100 rounded-tl-none border border-gray-800'
                }`}>
                {m.content}
                <div className={`text-[10px] mt-1.5 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* 送信フォーム */}
      <form onSubmit={sendMessage} className="p-4 bg-[#121212] border-t border-gray-800">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-500 transition-colors"
            placeholder="Write a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all active:scale-95">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}