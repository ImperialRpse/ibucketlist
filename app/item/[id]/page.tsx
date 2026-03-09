'use client';
import { use, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { insertNotification } from '@/lib/notifications';

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
    replies?: Comment[];
};

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
};

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
}: CommentItemProps) => {
    const hasReplies = (comment.replies?.length ?? 0) > 0;
    const isExpanded = expandedReplies.has(comment.id);
    const isTargetOfReplyInput = replyingTo?.id === comment.id;

    return (
        <div className={`${depth > 0 ? 'ml-8 border-l-2 border-blue-100 pl-3' : ''}`}>
            <div className="flex gap-3 py-3 items-start">
                <Link href={`/profile/${comment.user_id}`}>
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
                    <Link
                        href={`/profile/${comment.user_id}`}
                        className="text-xs font-bold text-blue-600 hover:underline inline-block w-fit"
                    >
                        {comment.profiles?.display_name || 'ユーザー名'}
                    </Link>

                    <span className="text-sm text-gray-800 leading-relaxed mt-0.5 break-words">
                        {comment.content}
                    </span>

                    <div className="flex items-center gap-3 mt-1">
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
                                className={`text-xs font-semibold transition-colors ${isTargetOfReplyInput ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                            >
                                {isTargetOfReplyInput ? 'キャンセル' : '返信'}
                            </button>
                        )}

                        {hasReplies && (
                            <button
                                onClick={() => toggleReplies(comment.id)}
                                className="text-xs text-blue-400 hover:text-blue-600 font-semibold transition-colors"
                            >
                                {isExpanded ? '▲ 返信を隠す' : `▼ 返信 ${comment.replies!.length}件を表示`}
                            </button>
                        )}
                    </div>

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
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id: itemId } = use(params);
    const router = useRouter();

    const [item, setItem] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);

    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [replyText, setReplyText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
            await fetchItemData();
            await fetchComments(itemId);
        };
        init();
    }, [itemId]);

    const fetchItemData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bucket_items')
            .select(`
        *,
        profiles ( display_name, avatar_url ),
        likes ( user_id ),
        comments ( id ) 
      `)
            .eq('id', itemId)
            .single();

        if (error) {
            console.error("Fetch Error:", error.message);
        } else if (data) {
            setItem(data);
        }
        setLoading(false);
    };

    const buildCommentTree = (flatComments: Comment[]): Comment[] => {
        const map: Record<string, Comment> = {};
        const roots: Comment[] = [];

        flatComments.forEach((c) => { map[c.id] = { ...c, replies: [] }; });
        flatComments.forEach((c) => {
            if (c.parent_id && map[c.parent_id]) {
                map[c.parent_id].replies!.push(map[c.id]);
            } else {
                roots.push(map[c.id]);
            }
        });

        return roots;
    };

    const fetchComments = async (targetItemId: string) => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
        id, content, created_at, user_id, parent_id,
        profiles ( display_name, avatar_url )
      `)
            .eq('item_id', targetItemId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("コメント取得エラー:", error.message);
        } else {
            const normalized: Comment[] = (data || []).map((row) => ({
                ...row,
                profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles,
            }));
            setComments(buildCommentTree(normalized));
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !currentUserId || !item) return;

        const { error } = await supabase
            .from('comments')
            .insert({
                item_id: item.id,
                user_id: currentUserId,
                content: newComment,
                parent_id: null,
            });

        if (!error) {
            await insertNotification(item.user_id, currentUserId, 'comment', item.id);
            setNewComment('');
            fetchComments(item.id);
            fetchItemData();
        }
    };

    const handleAddReply = async () => {
        if (!replyText.trim() || !currentUserId || !item || !replyingTo) return;

        const { error } = await supabase
            .from('comments')
            .insert({
                item_id: item.id,
                user_id: currentUserId,
                content: replyText,
                parent_id: replyingTo.id,
            });

        if (!error) {
            await insertNotification(replyingTo.user_id, currentUserId, 'reply', item.id);
            setReplyText('');
            setReplyingTo(null);
            setExpandedReplies((prev) => new Set([...prev, replyingTo.id]));
            fetchComments(item.id);
        }
    };

    const toggleReplies = (commentId: string) => {
        setExpandedReplies((prev) => {
            const next = new Set(prev);
            if (next.has(commentId)) next.delete(commentId);
            else next.add(commentId);
            return next;
        });
    };

    const toggleLike = async () => {
        if (!currentUserId || !item) return alert("ログインが必要です");
        const isLikedByMe = item.likes?.some((like: any) => like.user_id === currentUserId);

        if (isLikedByMe) {
            await supabase.from('likes').delete().eq('item_id', item.id).eq('user_id', currentUserId);
        } else {
            await supabase.from('likes').insert({ item_id: item.id, user_id: currentUserId });
            await insertNotification(item.user_id, currentUserId, 'like', item.id);
        }
        await fetchItemData();
    };

    if (loading) return <div className="p-10 text-center text-white">Loading...</div>;
    if (!item) return <div className="p-10 text-center text-white">が見つかりませんでした</div>;

    const isLikedByMe = item.likes?.some((like: any) => like.user_id === currentUserId);
    const likeCount = item.likes?.length || 0;
    const commentCount = item.comments?.length || 0;

    return (
        <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-6 mt-4 md:h-[calc(100vh-6rem)]">
            {/* --- 左側：投稿 --- */}
            <div className="flex-1 overflow-y-auto pr-2 pb-4">
                <button onClick={() => router.back()} className="text-white hover:underline mb-4 font-bold inline-flex items-center gap-2">
                    <span>←</span> 戻る
                </button>

                <div className="p-8 border rounded-3xl shadow-lg bg-white text-black border-gray-200">
                    <Link href={`/profile/${item.user_id}`} className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
                            {item.profiles?.avatar_url ? (
                                <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-500 font-bold text-lg">
                                    {item.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        <p className="text-base font-bold text-blue-600 hover:underline cursor-pointer">
                            {item.profiles?.display_name || '名無しのユーザー'}
                        </p>
                    </Link>

                    <h1 className={`text-3xl font-bold ${item.description ? 'mb-4' : 'mb-6'} text-gray-900 leading-tight`}>
                        {item.title}
                    </h1>

                    {item.description && (
                        <p className="text-base text-gray-700 mb-8 whitespace-pre-wrap leading-relaxed">{item.description}</p>
                    )}

                    {item.is_completed && (
                        <div className="mb-6 space-y-4 pt-4 border-t border-gray-100">
                            {item.image_url && (
                                <img src={item.image_url} alt="" className="w-full h-auto max-h-96 object-contain rounded-2xl border border-gray-100 shadow-sm" />
                            )}
                            {item.reflection && (
                                <p className="text-gray-700 text-base bg-gray-50 p-6 rounded-2xl italic">"{item.reflection}"</p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center border-t border-gray-100 pt-6 mt-2">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <button onClick={toggleLike} className={`text-3xl transition-all active:scale-150 ${isLikedByMe ? 'text-pink-500' : 'text-gray-300'}`}>
                                    {isLikedByMe ? '❤️' : '♡'}
                                </button>
                                <span className="font-bold text-gray-700 text-lg">{likeCount}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-3xl text-gray-300">💬</span>
                                <span className="font-bold text-gray-700 text-lg">{commentCount}</span>
                            </div>
                        </div>

                        <span className="text-sm font-semibold text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* --- 右側：コメント欄 --- */}
            <div className="flex-1 md:max-w-md w-full flex flex-col bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden h-[600px] md:h-full shrink-0">
                <div className="p-5 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-800 text-lg">Comments</h3>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-2 bg-white divide-y divide-gray-50">
                    {comments.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-center text-gray-400">最初のコメントを書きましょう！</p>
                        </div>
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
                            />
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 shrink-0">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="コメントを入力..."
                            className="flex-1 border rounded-full px-5 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-black bg-white shadow-sm transition-all"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAddComment()}
                        />
                        <button
                            onClick={handleAddComment}
                            className="bg-blue-500 text-white font-bold px-6 rounded-full hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            送信
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
