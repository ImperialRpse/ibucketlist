'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CommentItem } from '@/components/CommentItem';
import { useItemDetail } from '@/hooks/useItemDetail';

function ItemDetailContent() {
    const searchParams = useSearchParams();
    const itemId = searchParams.get('id') || '';
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

    if (loading) return <div className="p-10 text-center text-gray-600">Loading...</div>;
    if (!item) return <div className="p-10 text-center text-gray-600">Item not found</div>;

    const isLikedByMe = item.likes?.some((like) => like.user_id === currentUserId);
    const likeCount = item.likes?.length || 0;
    const commentCount = item.comments?.length || 0;

    return (
        <div className="max-w-6xl mx-auto px-4 pt-[calc(env(safe-area-inset-top,0px)+68px)] pb-0 md:pb-[calc(env(safe-area-inset-bottom,0px)+84px)] md:py-6 flex flex-col md:flex-row gap-6 md:h-[calc(100vh-6rem)]">
            {/* --- 左側：投稿 --- */}
            <div className="md:flex-1 md:overflow-y-auto pr-0 md:pr-2 pb-4">
                <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800 hover:underline mb-4 font-bold inline-flex items-center gap-2">
                    <span>←</span> Back
                </button>

                <div className="p-6 md:p-8 border rounded-3xl shadow-lg bg-white text-black border-gray-200">
                    <Link href={`/profile?id=${item.user_id}`} className="flex items-center gap-4 mb-6">
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
                            {item.profiles?.display_name || 'Anonymous User'}
                        </p>
                    </Link>

                    <h1 className={`text-2xl md:text-3xl font-bold ${item.description ? 'mb-4' : 'mb-6'} text-gray-900 leading-tight`}>
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

            {/* --- 右側（モバイルでは下部）：コメント欄 --- */}
            <div className="md:max-w-md w-full flex flex-col bg-white rounded-3xl border border-gray-200 shadow-lg md:overflow-hidden md:h-full shrink-0 mb-[calc(env(safe-area-inset-bottom,0px)+120px)] md:mb-0">
                <div className="p-5 border-b flex justify-between items-center bg-gray-50 shrink-0 md:rounded-t-3xl">
                    <h3 className="font-bold text-gray-800 text-lg">Comments</h3>
                </div>

                <div className="flex-1 md:overflow-y-auto px-5 py-2 bg-white divide-y divide-gray-50">
                    {comments.length === 0 ? (
                        <div className="py-10 flex items-center justify-center">
                            <p className="text-center text-gray-400">Be the first to comment!</p>
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

                {/* --- コメント入力フォーム（モバイルでは画面下部に固定） --- */}
                <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+60px)] left-0 right-0 p-4 border-t bg-white md:relative md:bottom-auto md:left-auto md:right-auto md:shrink-0 md:bg-gray-50 z-20">
                    <div className="flex gap-2 max-w-6xl mx-auto md:max-w-none">
                        <input
                            type="text"
                            placeholder="Enter comment..."
                            className="flex-1 border rounded-full px-5 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-black bg-white shadow-sm transition-all"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAddComment()}
                        />
                        <button
                            onClick={handleAddComment}
                            className="bg-blue-500 text-white font-bold px-6 rounded-full hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ItemDetail() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-white">Loading...</div>}>
            <ItemDetailContent />
        </Suspense>
    );
}
