'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { BlockListModal } from '@/components/BlockListModal';

export default function SettingsPage() {
  const {
    name,
    setName,
    bio,
    setBio,
    isPublic,
    setIsPublic,
    loading,
    saving,
    avatarUrl,
    uploading,
    uploadAvatar,
    saveProfile,
    handleLogout
  } = useProfileSettings();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isBlockListOpen, setIsBlockListOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  if (loading) return <p className="text-center mt-10 text-white">Loading...</p>;

  return (
    <div className="w-full pt-[calc(env(safe-area-inset-top,0px)+80px)] md:pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-[calc(env(safe-area-inset-bottom,0px)+96px)] px-4 flex justify-center items-start">
      <div className="w-full max-w-md p-6 bg-white rounded-3xl shadow-lg text-black mt-4 md:mt-0">
        <h1 className="text-2xl font-bold mt-4 mb-6">Profile Settings</h1>

        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                  {name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
              {uploading ? '...' : 'Change'}
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
        </div>

        <label className="block mb-2 font-bold text-gray-600">Display Name</label>
        <input
          className="w-full border-2 p-3 rounded-xl mb-6 bg-gray-50 focus:border-blue-500 outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="username"
        />

        {/* 自己紹介(Bio)の入力 */}
        <div className="mb-6">
          <label className="block mb-2 font-bold text-gray-600 text-sm ml-1">Bio</label>
          <textarea
            className="w-full border-2 p-3 rounded-xl bg-gray-50 h-32 focus:border-blue-500 outline-none resize-none transition-all"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio here..."
            maxLength={150}
          />
          <p className="text-right text-[10px] text-gray-400 mt-1">{bio.length} / 150</p>
        </div>

        {/* 公開設定トグル */}
        <div className="mb-6 border-2 border-gray-100 rounded-2xl p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${isPublic ? 'bg-blue-100' : 'bg-gray-200'
                  }`}
              >
                {isPublic ? '🌍' : '🔒'}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  {isPublic ? 'Public Account' : 'Private Account'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isPublic
                    ? 'Posts are visible to everyone'
                    : 'Only followers can see posts'}
                </p>
              </div>
            </div>

            {/* トグルスイッチ */}
            <button
              id="privacy-toggle"
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${isPublic ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              aria-label={isPublic ? 'Setting to Public' : 'Setting to Private'}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Block List ボタン */}
        <button
          id="block-list-btn"
          onClick={() => setIsBlockListOpen(true)}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-white text-gray-700 py-3 rounded-xl font-bold border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <span>🚫</span>
          <span>Block List</span>
        </button>

        <button
          onClick={saveProfile}
          disabled={saving || uploading}
          className={`w-full mt-8 text-white py-3 rounded-xl font-bold transition-colors ${saving || uploading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {/* Logoutボタン */}
        <button
          onClick={handleLogout}
          className="w-full mt-4 bg-white text-red-500 py-3 rounded-xl font-bold border-2 border-red-500 hover:bg-red-50 transition-colors"
        >
          Logout
        </button>

        {/* ブロックリストモーダル */}
        <BlockListModal
          isOpen={isBlockListOpen}
          onClose={() => setIsBlockListOpen(false)}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}