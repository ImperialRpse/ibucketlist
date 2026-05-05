'use client';
import { useState } from 'react';
import { Profile } from '@/types/item';

type UserOptionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  targetUser: Profile | null;
  isBlocked: boolean;
  blockLoading: boolean;
  onToggleBlock: () => Promise<void>;
};

export function UserOptionsModal({
  isOpen,
  onClose,
  targetUser,
  isBlocked,
  blockLoading,
  onToggleBlock,
}: UserOptionsModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen || !targetUser) return null;

  const displayName = targetUser.display_name || 'User';

  const handleBlockClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    await onToggleBlock();
    setShowConfirm(false);
    onClose();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={() => { setShowConfirm(false); onClose(); }}
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
          <h2 className="text-white font-semibold text-base">Advanced Settings</h2>
          <button
            onClick={() => { setShowConfirm(false); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          {!showConfirm ? (
            /* ブロック/アンブロックボタン */
            <button
              id="block-user-btn"
              onClick={handleBlockClick}
              disabled={blockLoading}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 ${
                isBlocked
                  ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30'
                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
              }`}
            >
              <span className="text-lg">{isBlocked ? '🔓' : '🚫'}</span>
              <span>
                {isBlocked ? `Unblock ${displayName}` : `Block ${displayName}`}
              </span>
            </button>
          ) : (
            /* 確認ダイアログ */
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-3xl">{isBlocked ? '🔓' : '🚫'}</div>
                <p className="text-white font-semibold text-sm">
                  {isBlocked
                    ? `Are you sure you want to unblock ${displayName}?`
                    : `Are you sure you want to block ${displayName}?`}
                </p>
                {!isBlocked && (
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Blocking this user will hide their posts and messages.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="confirm-block-btn"
                  onClick={handleConfirm}
                  disabled={blockLoading}
                  className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 ${
                    isBlocked
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {blockLoading ? 'Processing...' : isBlocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
