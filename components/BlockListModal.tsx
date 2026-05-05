'use client';
import { useEffect } from 'react';
import { useBlockList } from '@/hooks/useBlock';

type BlockListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string | null;
};

export function BlockListModal({ isOpen, onClose, currentUserId }: BlockListModalProps) {
  const { blockedUsers, blockListLoading, fetchBlockedUsers, unblockUser } =
    useBlockList(currentUserId);

  useEffect(() => {
    if (isOpen) {
      fetchBlockedUsers();
    }
  }, [isOpen, fetchBlockedUsers]);

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
          <div className="flex items-center gap-2">
            <span className="text-lg">🚫</span>
            <h2 className="text-white font-semibold text-base">Block List</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Usersリスト */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/5">
          {blockListLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-3xl">✅</div>
              <p className="text-gray-500 text-sm">There are no blocked users</p>
            </div>
          ) : (
            blockedUsers.map((blocked) => {
              const user = blocked.profiles;
              const displayName = user?.display_name || 'Users';
              return (
                <div
                  key={blocked.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  {/* アバター */}
                  <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-gray-600 via-gray-500 to-gray-400 shrink-0">
                    <div className="w-full h-full rounded-full border-2 border-[#1a1a2e] overflow-hidden bg-gray-700 flex items-center justify-center">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover grayscale" />
                      ) : (
                        <span className="text-sm font-bold text-gray-400">
                          {displayName[0]?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Users名 */}
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">{displayName}</p>
                    {user?.bio && (
                      <p className="text-gray-500 text-xs truncate mt-0.5">{user.bio}</p>
                    )}
                  </div>

                  {/* Unblock ボタン */}
                  <button
                    id={`unblock-btn-${blocked.blocked_id}`}
                    onClick={() => unblockUser(blocked.blocked_id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-green-500/20 hover:text-green-400 border border-white/20 hover:border-green-500/30 transition-all"
                  >
                    Unblock
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
