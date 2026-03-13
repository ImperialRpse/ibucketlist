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
            onClick={() => router.push(`/item/${item.id}`)}
            className={`p-5 md:p-6 border rounded-3xl shadow-sm cursor-pointer transition-all 
                ${isProfileView
                    ? item.is_completed
                        ? 'border-green-100 bg-green-50/10 hover:bg-green-50/20' // プロフィールでの完了状態
                        : 'border-gray-800 bg-[#1e1e1e] hover:bg-gray-800' // プロフィールでの未完了状態 (ダークモード風)
                    : 'bg-white text-black border-gray-200 hover:bg-gray-50' // タイムラインでの状態 (ライトモード風)
                }
            `}
        >
            {/* 投稿者情報エリア */}
            <div onClick={(e) => e.stopPropagation()} className="w-fit">
                <Link href={`/profile/${item.user_id}`} className="flex items-center gap-2 md:gap-3 mb-3">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0 border flex items-center justify-center 
                        ${isProfileView ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-transparent'}
                    `}>
                        {item.profiles?.avatar_url ? (
                            <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className={`font-bold text-sm ${isProfileView ? 'text-gray-400' : 'text-gray-500'}`}>
                                {item.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                            </span>
                        )}
                    </div>
                    <span className={`text-sm md:text-base font-bold hover:underline 
                        ${isProfileView ? 'text-gray-200' : 'text-blue-600'}
                    `}>
                        {item.profiles?.display_name || '名無しのユーザー'}
                    </span>
                </Link>
            </div>

            <div className="flex justify-between items-start mb-2 mt-2">
                <span className={`text-lg md:text-xl font-semibold 
                    ${isProfileView
                        ? item.is_completed ? 'text-gray-500 line-through' : 'text-gray-200'
                        : 'text-gray-800'
                    }
                `}>
                    {item.title}
                </span>

                <div className="flex items-center gap-2 ml-2 shrink-0">
                    {/* 自分のプロフィールの場合だけメニューボタン・チェックボタンを表示 */}
                    {isProfileView && isMe && (
                        <>
                            {!item.is_completed && onCompleteClick && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCompleteClick(item);
                                    }}
                                    className="w-6 h-6 border-2 border-blue-500 rounded-md flex items-center justify-center hover:bg-blue-50/10 transition-colors"
                                    aria-label="完了にする"
                                />
                            )}
                            {(onEditClick || onDeleteClick) && (
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMenuOpen(!isMenuOpen);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700/50 text-gray-400 transition-colors"
                                        aria-label="メニュー"
                                    >
                                        ⋮
                                    </button>
                                    {isMenuOpen && (
                                        <div className="absolute right-0 mt-1 w-32 bg-[#2a2a2a] border border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden text-left">
                                            {onEditClick && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsMenuOpen(false);
                                                        onEditClick(item);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                                                >
                                                    編集
                                                </button>
                                            )}
                                            {onDeleteClick && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsMenuOpen(false);
                                                        if (window.confirm('本当にこの投稿を削除しますか？')) {
                                                            onDeleteClick(item);
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-white/10 transition-colors border-t border-gray-700"
                                                >
                                                    削除
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
                <p className={`text-sm mb-3 md:mb-4 whitespace-pre-wrap 
                    ${isProfileView ? 'text-gray-400' : 'text-gray-600'}
                `}>
                    {item.description}
                </p>
            )}

            {item.is_completed && (
                <div className="mt-3 md:mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    {item.image_url && (
                        <img
                            src={item.image_url}
                            alt="思い出"
                            className={`w-full max-h-96 object-contain rounded-2xl shadow-sm 
                                ${isProfileView ? 'bg-black/20' : 'border border-gray-50'}
                            `}
                        />
                    )}
                    {item.reflection && (
                        <p className={`text-sm p-3 md:p-4 rounded-xl md:rounded-2xl italic 
                            ${isProfileView
                                ? 'text-gray-300 bg-black/20 border border-green-900/30'
                                : 'text-gray-600 bg-gray-50'
                            }
                        `}>
                            &quot;{item.reflection}&quot;
                        </p>
                    )}
                </div>
            )}

            {/* ライク・コメントボタン */}
            <div className={`flex justify-between items-center border-t mt-4 pt-4 
                ${isProfileView ? 'border-gray-700' : 'border-gray-100'}
            `}>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => toggleLike(e, item.id, isLikedByMe)}
                            className={`text-2xl transition-all active:scale-150 
                                ${isLikedByMe
                                    ? 'text-pink-500'
                                    : isProfileView ? 'text-gray-400 hover:text-gray-300' : 'text-gray-300 hover:text-pink-400'
                                }
                            `}
                        >
                            {isLikedByMe ? '❤️' : '♡'}
                        </button>
                        <span className={`font-bold text-sm 
                            ${isProfileView ? 'text-gray-400' : 'text-gray-600'}
                        `}>
                            {likeCount}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button className={`text-2xl transition-colors 
                            ${isProfileView ? 'text-gray-400 hover:text-gray-300' : 'text-gray-300 hover:text-gray-400'}
                        `}>
                            💬
                        </button>
                        <span className={`font-bold text-sm 
                            ${isProfileView ? 'text-gray-400' : 'text-gray-600'}
                        `}>
                            {commentCount}
                        </span>
                    </div>
                </div>

                <span className={`text-xs 
                    ${isProfileView ? 'text-gray-500' : 'text-gray-400'}
                `}>
                    {new Date(item.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};
