'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { insertNotification } from '@/lib/notifications';

import { Keyboard } from '@capacitor/keyboard';

interface ChatRoomPageProps {
  roomId: string;
}

export default function ChatRoomPage({ roomId }: ChatRoomPageProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [myId, setMyId] = useState<string | null>(null);
  const [partner, setPartner] = useState<any>(null);
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const router = useRouter();

  useEffect(() => {
    // iOS等でキーボード展開時の表示領域を取得して高さを動的に調整する
    if (typeof window !== 'undefined') {
      // Capacitorキーボードプラグインでネイティブのスクロールを無効化（画面全体が上にスライドするのを防ぐ）
      Keyboard.setScroll({ isDisabled: true }).catch(console.warn);

      if (window.visualViewport) {
        const handleResize = () => {
          setViewportHeight(`${window.visualViewport?.height || window.innerHeight}px`);
        };

        window.visualViewport.addEventListener('resize', handleResize);
        handleResize();

        return () => {
          window.visualViewport?.removeEventListener('resize', handleResize);
          // 画面を離れる時に設定を元に戻す
          Keyboard.setScroll({ isDisabled: false }).catch(console.warn);
        };
      }
    }
  }, []);

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
    if (messages.length > 0) {
      scrollRef.current?.scrollIntoView({
        behavior: isInitialLoad.current ? 'auto' : 'smooth'
      });
      isInitialLoad.current = false;
    }
  }, [messages]);

  //data baseでRPC関数呼び出し
  const markRead = async () => {
    const { error } = await supabase.rpc('mark_messages_as_read', { target_room_id: roomId });
    if (error) {
      console.error("Read update error:", error.message);
    } else {
      console.log("Marked as read! Room ID:", roomId);
    }
  };

  //メッセージSend処理関数
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !myId) return;

    const content = newMessage;
    setNewMessage('');

    const { error } = await supabase
      .from('dm_messages')
      .insert({ room_id: roomId, sender_id: myId, content });

    if (error) return;
    // 相手に「DM」Notifications
    if (partner?.id) {
      await insertNotification(partner.id, myId, 'dm');
    }
    markRead();
  };

  return (
    <div className="fixed top-0 left-0 w-full flex flex-col bg-white" style={{ height: viewportHeight }}>
      {/* ヘッダー — 固定 */}
      <div className="flex-shrink-0 px-4 pb-3 border-b border-gray-200 flex items-center gap-3 bg-white/95 backdrop-blur-sm z-10 pt-[calc(env(safe-area-inset-top,0px)+12px)] md:pt-4">
        {/* モバイル用：戻るボタン */}
        <button
          onClick={() => router.back()}
          className="md:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 -ml-1 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <Link href={`/profile?id=${partner?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
            {partner?.avatar_url && <img src={partner.avatar_url} className="w-full h-full object-cover" />}
          </div>
          <span className="font-bold text-gray-900 truncate">{partner?.display_name || 'Loading...'}</span>
        </Link>
      </div>

      {/* メッセージ表示 — スクロール可能な中央エリア */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
        {messages.map((m) => {
          const isMe = m.sender_id === myId;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] md:max-w-[70%] p-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${isMe
                ? 'bg-blue-500 text-white rounded-tr-none'
                : 'bg-gray-100 text-gray-900 rounded-tl-none border border-gray-200'
                }`}>
                {m.content}
                <div className={`text-[10px] mt-1.5 opacity-60 ${isMe ? 'text-right text-blue-100' : 'text-left text-gray-500'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* 入力フォーム — 固定 */}
      <form
        onSubmit={sendMessage}
        className="flex-shrink-0 px-4 pt-3 bg-white border-t border-gray-200"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 placeholder-gray-400 transition-colors"
            placeholder="Write a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all active:scale-95"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
