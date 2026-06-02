'use client';
import Link from 'next/link';
import { Profile } from '@/types/item';

type FollowListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: Profile[];
  loading: boolean;
};

export function FollowListModal({ isOpen, onClose, title, users, loading }: FollowListModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* モーダル本体 */}
      <div
        className="relative z-10 w-full max-w-sm mx-auto bg-[#1a1a2e] rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-base tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Usersリスト */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No one yet
            </div>
          ) : (
            users.map((user) => (
              <Link
                key={user.id}
                href={`/profile?id=${user.id}`}
                onClick={onClose}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors group"
              >
                {/* アバター */}
                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 shrink-0">
                  <div className="w-full h-full rounded-full border-2 border-[#1a1a2e] overflow-hidden bg-gray-700 flex items-center justify-center">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-gray-400">
                        {user.display_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Users名 */}
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium text-sm truncate group-hover:text-blue-400 transition-colors">
                    {user.display_name || 'User'}
                  </p>
                  {user.bio && (
                    <p className="text-gray-500 text-xs truncate mt-0.5">{user.bio}</p>
                  )}
                </div>

                {/* 矢印 */}
                <span className="text-gray-600 group-hover:text-gray-400 transition-colors text-sm">›</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
