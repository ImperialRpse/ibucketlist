//コメントを画面に表示するためのパーツ（コンポーネント
import Link from 'next/link';
import { Comment } from '@/types/item';

//CommentItem というパーツ（コンポーネント）を使うための、正確な『注文書』
//これらの項目を全部正しく渡さないと、このパーツは使えませんよ！」**というルールを定義
/*
CommentItem: 実際に動く「機械（パーツ）」本体。
CommentItemProps: その機械を動かすための「燃料のリスト」や「ボタンの仕様書」
*/
export type CommentItemProps = {
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

export const CommentItem = ({
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
