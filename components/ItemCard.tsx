import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { BucketItem } from '@/types/item';

//ItemCardを使うための説明書
export type ItemCardProps = {
    item: BucketItem;
    currentUserId: string | null;
    //「今すぐには終わらない処理の『結果』を、後で返すよという約束（予約票）
    //型（Type）を見るだけで、「あ、この toggleLike
    //ってやつは通信が発生して時間がかかる処理なんだな」とプログラマーがすぐに判断できるようになっているのです！
    toggleLike: (e: React.MouseEvent, itemId: string, isLikedByMe: boolean) => Promise<void>;
    // プロフィール専用のProp
    isProfileView?: boolean;
    isMe?: boolean;
    onCompleteClick?: (item: BucketItem) => void;
    onEditClick?: (item: BucketItem) => void;
    onDeleteClick?: (item: BucketItem) => void;
};

export const ItemCard = ({
    item,
    currentUserId,
    toggleLike,
    isProfileView = false,
    isMe = false,
    onCompleteClick,
    onEditClick,
    onDeleteClick
}: ItemCardProps) => {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

    const isLikedByMe = item.likes?.some((like) => like.user_id === currentUserId);
    const likeCount = item.likes?.length || 0;
    const commentCount = item.comments?.length || 0;

    return (
        <div
            onClick={() => router.push(`/item?id=${item.id}`)}
            className={`p-5 md:p-6 border rounded-3xl shadow-sm cursor-pointer transition-all 
                ${isProfileView && item.is_completed
                    ? 'border-green-200 bg-green-50/40 hover:bg-green-50/60'
                    : 'bg-white text-black border-gray-200 hover:bg-gray-50'
                }
            `}
        >
            {/* 投稿者情報エリア */}
            <div onClick={(e) => e.stopPropagation()} className="w-fit">
                <Link href={`/profile?id=${item.user_id}`} className="flex items-center gap-2 md:gap-3 mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0 border flex items-center justify-center bg-gray-100 border-gray-200">
                        {item.profiles?.avatar_url ? (
                            <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-sm text-gray-500">
                                {item.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                            </span>
                        )}
                    </div>
                    <span className="text-sm md:text-base font-bold hover:underline text-blue-600">
                        {item.profiles?.display_name || 'Anonymous User'}
                    </span>
                </Link>
            </div>

            <div className="flex justify-between items-start mb-2 mt-2">
                <div className="flex flex-col">
                    {item.category && (
                        <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded w-fit mb-1 border border-blue-100">
                            {item.category}
                        </span>
                    )}
                    <span className={`text-lg md:text-xl font-semibold 
                        ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'}
                    `}>
                        {item.title}
                    </span>
                </div>

                <div className="flex items-center gap-2 ml-2 shrink-0">
                    {/* 自分のプロフィールの場合だけMenuボタン・チェックボタンを表示 */}
                    {isProfileView && isMe && (
                        <>
                            {!item.is_completed && onCompleteClick && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCompleteClick(item);
                                    }}
                                    className="w-6 h-6 border-2 border-blue-500 rounded-md flex items-center justify-center hover:bg-blue-50 transition-colors"
                                    aria-label="Complete"
                                />
                            )}
                            {(onEditClick || onDeleteClick) && (
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMenuOpen(!isMenuOpen);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                                        aria-label="Menu"
                                    >
                                        ⋮
                                    </button>
                                    {isMenuOpen && (
                                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden text-left">
                                            {onEditClick && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsMenuOpen(false);
                                                        onEditClick(item);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {onDeleteClick && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsMenuOpen(false);
                                                        if (window.confirm('Are you sure you want to delete this post?')) {
                                                            onDeleteClick(item);
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    {item.is_completed && <span className="text-green-500 text-xl font-bold">✅</span>}
                </div>
            </div>

            {item.description && (
                <p className="text-sm mb-3 md:mb-4 whitespace-pre-wrap text-gray-600">
                    {item.description}
                </p>
            )}

            {item.is_completed && (
                <div className="mt-3 md:mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    {item.image_url && (
                        <img
                            src={item.image_url}
                            alt="Memories"
                            className="w-full max-h-96 object-contain rounded-2xl shadow-sm border border-gray-100"
                        />
                    )}
                    {item.reflection && (
                        <p className={`text-sm p-3 md:p-4 rounded-xl md:rounded-2xl italic 
                            ${isProfileView
                                ? 'text-gray-700 bg-green-50/50 border border-green-100/50'
                                : 'text-gray-600 bg-gray-50'
                            }
                        `}>
                            &quot;{item.reflection}&quot;
                        </p>
                    )}
                </div>
            )}

            {/* ライク・コメントボタン */}
            <div className="flex justify-between items-center border-t mt-4 pt-4 border-gray-100">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => toggleLike(e, item.id, isLikedByMe)}
                            className={`text-2xl transition-all active:scale-150 
                                ${isLikedByMe ? 'text-pink-500' : 'text-gray-300 hover:text-pink-400'}
                            `}
                        >
                            {isLikedByMe ? '❤️' : '♡'}
                        </button>
                        <span className="font-bold text-sm text-gray-600">
                            {likeCount}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button className="text-2xl transition-colors text-gray-300 hover:text-gray-400">
                            💬
                        </button>
                        <span className="font-bold text-sm text-gray-600">
                            {commentCount}
                        </span>
                    </div>
                </div>

                <span className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};
