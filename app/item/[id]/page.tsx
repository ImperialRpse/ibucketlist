'use client';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CommentItem } from '@/components/CommentItem';
import { useItemDetail } from '@/hooks/useItemDetail';

export default function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id: itemId } = use(params);
    const router = useRouter();

    const {
        item,
        currentUserId,
        loading,
        comments,
        newComment,
        setNewComment,
        replyingTo,
        setReplyingTo,
        replyText,
        setReplyText,
        expandedReplies,
        handleAddComment,
        handleAddReply,
        toggleReplies,
        toggleLike
    } = useItemDetail(itemId);

    if (loading) return <div className="p-10 text-center text-white">Loading...</div>;
    if (!item) return <div className="p-10 text-center text-white">が見つかりませんでした</div>;

    const isLikedByMe = item.likes?.some((like) => like.user_id === currentUserId);
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
                                <p className="text-gray-700 text-base bg-gray-50 p-6 rounded-2xl italic">&quot;{item.reflection}&quot;</p>
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
