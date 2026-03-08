'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// コメントの型定義（ネストした返信を含む）手紙そのもの（中身）
type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  replies?: Comment[]; // クライアント側で組み立てる　
};

//CommentItemという部品（コンポーネント）が正しく動くために、外から渡すべき情報のリスト（設計図）
type CommentItemProps = {
  comment: Comment;
  depth?: number;
  currentUserId: string | null;
  replyingTo: Comment | null;
  setReplyingTo: (comment: Comment | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  handleAddReply: () => void;
  expandedReplies: Set<string>;
  toggleReplies: (id: string) => void;
  setIsCommentModalOpen: (open: boolean) => void;
};

//CommentItemという部品（コンポーネント）の実装
const CommentItem = ({
  comment,
  depth = 0,
  currentUserId,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  handleAddReply,
  expandedReplies,
  toggleReplies,
  setIsCommentModalOpen,
}: CommentItemProps) => {
  //返信があるかどうか
  const hasReplies = (comment.replies?.length ?? 0) > 0;
  //返信を展開しているかどうか
  const isExpanded = expandedReplies.has(comment.id);
  // このコメントが返信入力の対象かどうか（返信ボタンを押すとtrueになる）
  const isTargetOfReplyInput = replyingTo?.id === comment.id;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-blue-100 pl-3' : ''}`}>
      <div className="flex gap-3 py-3 items-start">
        {/* アバター */}
        <Link href={`/profile/${comment.user_id}`} onClick={() => setIsCommentModalOpen(false)}>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
            {comment.profiles?.avatar_url ? (
              <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400 bg-gray-200">
                {comment.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </Link>

        <div className="flex flex-col flex-1 min-w-0">
          {/* 名前 */}
          <Link
            href={`/profile/${comment.user_id}`}
            onClick={() => setIsCommentModalOpen(false)}
            className="text-xs font-bold text-blue-600 hover:underline inline-block w-fit"
          >
            {comment.profiles?.display_name || 'ユーザー名'}
          </Link>

          {/* コメント本文 */}
          <span className="text-sm text-gray-800 leading-relaxed mt-0.5 break-words">
            {comment.content}
          </span>

          {/* アクション行：返信ボタン ＋ 返信件数展開ボタン */}
          <div className="flex items-center gap-3 mt-1">
            {/* 返信ボタン（ログイン済みのみ）
            isTargetOfReplyInputがtrue時はキャンセルをおしたときの処理
            falseのときは返信ボタンを押したときの処理（つまりRelayingToにこのコメントを代入する）
            
            */}
            {currentUserId && (
              <button
                onClick={() => {
                  if (isTargetOfReplyInput) {
                    setReplyingTo(null);
                    setReplyText('');
                  } else {
                    setReplyingTo(comment);
                    setReplyText('');
                  }
                }}
                className={`text-xs font-semibold transition-colors ${isTargetOfReplyInput
                  ? 'text-blue-500'
                  : 'text-gray-400 hover:text-blue-500'
                  }`}
              >
                {isTargetOfReplyInput ? 'キャンセル' : '返信'}
              </button>
            )}

            {/* 返信件数の展開/折りたたみ */}
            {hasReplies && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-xs text-blue-400 hover:text-blue-600 font-semibold transition-colors"
              >
                {isExpanded
                  ? '▲ 返信を隠す'
                  : `▼ 返信 ${comment.replies!.length}件を表示`}
              </button>
            )}
          </div>

          {/* 返信の入力フォーム */}
          {isTargetOfReplyInput && (
            <div className="mt-2 flex gap-2 items-center">
              <input
                type="text"
                placeholder={`${comment.profiles?.display_name || 'ユーザー'}への返信...`}
                className="flex-1 border border-blue-200 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-black bg-blue-50"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAddReply()}
                autoFocus
              />
              <button
                onClick={handleAddReply}
                className="text-blue-500 font-bold text-sm px-2 hover:text-blue-700 transition-colors"
              >
                送信
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 返信リスト（展開時のみ）   
      SetReplayingToは親（timelinePage）から受け取った更新関数。それをまた子供に渡している
      */}
      {hasReplies && isExpanded && (
        <div>
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleAddReply={handleAddReply}
              expandedReplies={expandedReplies}
              toggleReplies={toggleReplies}
              setIsCommentModalOpen={setIsCommentModalOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TimelinePage() {
  const [items, setItems] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // コメントモーダル用のステート
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  // 返信機能用のステート
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null); // 返信対象のコメント
  const [replyText, setReplyText] = useState('');
  //setは重複を許さない配列、new Set()で初期化
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set()); // 返信を展開しているコメントID

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      await fetchAllItems();
    };
    init();
  }, []);

  // 投稿リスト取得（コメント数も含める）
  const fetchAllItems = async () => {
    const { data, error } = await supabase
      .from('bucket_items')
      .select(`
        *,
        profiles ( display_name, avatar_url ),
        likes ( user_id ),
        comments ( id ) 
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch Error:", error.message);
    } else if (data) {
      setItems(data);
    }
  };

  // フラットなコメント配列をツリー構造に変換するユーティリティ
  const buildCommentTree = (flatComments: Comment[]): Comment[] => {
    const map: Record<string, Comment> = {};
    const roots: Comment[] = [];

    // まず全コメントを map に格納
    flatComments.forEach((c) => {
      map[c.id] = { ...c, replies: [] };
    });

    // parent_id を見てツリーを構築   
    flatComments.forEach((c) => {
      //自分に親がいるか、かつmapにそのIDをもつレコードが存在するか
      //trueの場合、親のrepliesに自分を追加
      //falseの場合、自分が親なのでrootsに追加  
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies!.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });

    return roots;
  };

  // 特定の投稿のコメントを取得（返信も含む）
  const fetchComments = async (itemId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        parent_id,
        profiles (
          display_name,
          avatar_url
        )
      `)
      .eq('item_id', itemId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("コメント取得エラー:", error.message);
    } else {
      // Supabaseのリレーションは配列で返ってくるので、先頭要素（または null）に変換する
      const normalized: Comment[] = (data || []).map((row) => ({
        ...row,
        profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles,
      }));
      const tree = buildCommentTree(normalized);
      setComments(tree);
    }
  };

  // トップレベルコメントを投稿
  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId || !selectedItem) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        item_id: selectedItem.id,
        user_id: currentUserId,
        content: newComment,
        parent_id: null,
      });

    if (!error) {
      setNewComment('');
      fetchComments(selectedItem.id);
      fetchAllItems();
    }
  };

  // 返信コメントを投稿
  const handleAddReply = async () => {
    if (!replyText.trim() || !currentUserId || !selectedItem || !replyingTo) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        item_id: selectedItem.id,
        user_id: currentUserId,
        content: replyText,
        parent_id: replyingTo.id,
      });

    if (!error) {
      setReplyText('');
      setReplyingTo(null);
      // 返信したコメントの返信欄を展開状態にする(setに追加)
      setExpandedReplies((prev) => new Set([...prev, replyingTo.id]));
      fetchComments(selectedItem.id);
    }
  };

  // モーダルを開く
  const openCommentModal = (item: any) => {
    setSelectedItem(item);
    setIsCommentModalOpen(true);
    setReplyingTo(null);
    setReplyText('');
    setExpandedReplies(new Set());
    fetchComments(item.id);
  };

  // 返信の展開・折りたたみを切り替え
  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const toggleLike = async (itemId: string, isLikedByMe: boolean) => {
    if (!currentUserId) return alert("ログインが必要です");
    if (isLikedByMe) {
      await supabase.from('likes').delete().eq('item_id', itemId).eq('user_id', currentUserId);
    } else {
      await supabase.from('likes').insert({ item_id: itemId, user_id: currentUserId });
    }
    await fetchAllItems();
  };

  // ... handleAddComment, handleAddReply 等の後に return が来るようにし、CommentItemは外へ ...


  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Everyone's Bucket List</h1>

      <div className="grid gap-4">
        {items.map((item) => {
          const isLikedByMe = item.likes?.some((like: any) => like.user_id === currentUserId);
          const likeCount = item.likes?.length || 0;
          const commentCount = item.comments?.length || 0;

          return (
            <div key={item.id} className="p-6 border rounded-2xl shadow-sm bg-white text-black border-gray-200">
              <Link href={`/profile/${item.user_id}`} className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
                  {item.profiles?.avatar_url ? (
                    <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 font-bold text-sm">
                      {item.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">
                  {item.profiles?.display_name || '名無しのユーザー'}
                </p>
              </Link>
              <p className="text-lg font-semibold mb-4 text-gray-800">{item.title}</p>

              {item.is_completed && (
                <div className="mb-4 space-y-3">
                  {item.image_url && (
                    <img src={item.image_url} alt="" className="w-full h-96 object-contain rounded-2xl border border-gray-50" />
                  )}
                  {item.reflection && (
                    <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-2xl italic">"{item.reflection}"</p>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center border-t pt-4">
                <div className="flex items-center gap-6">
                  {/* いいね */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleLike(item.id, isLikedByMe)} className={`text-2xl transition-all active:scale-150 ${isLikedByMe ? 'text-pink-500' : 'text-gray-300'}`}>
                      {isLikedByMe ? '❤️' : '♡'}
                    </button>
                    <span className="font-bold text-gray-600 text-sm">{likeCount}</span>
                  </div>

                  {/* コメントボタン */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => openCommentModal(item)} className="text-2xl text-gray-300 hover:text-gray-400 transition-colors">
                      💬
                    </button>
                    <span className="font-bold text-gray-600 text-sm">{commentCount}</span>
                  </div>
                </div>

                <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* コメントモーダル */}
      {isCommentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* ヘッダー */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-700 text-center flex-1">Comments</h3>
              <button
                onClick={() => {
                  setIsCommentModalOpen(false);
                  setReplyingTo(null);
                  setReplyText('');
                }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* コメント一覧 */}
            <div className="flex-1 overflow-y-auto px-4 bg-white divide-y divide-gray-50">
              {comments.length === 0 ? (
                <p className="text-center text-gray-400 py-10">最初のコメントを書きましょう！</p>
              ) : (
                comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    depth={0}
                    currentUserId={currentUserId}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    handleAddReply={handleAddReply}
                    expandedReplies={expandedReplies}
                    toggleReplies={toggleReplies}
                    setIsCommentModalOpen={setIsCommentModalOpen}
                  />
                ))
              )}
            </div>

            {/* 新規コメント入力エリア */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="コメントを入力..."
                  className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-black"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAddComment()}
                />
                <button onClick={handleAddComment} className="text-blue-500 font-bold px-2">送信</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}