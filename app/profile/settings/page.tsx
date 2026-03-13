'use client';
import { useProfileSettings } from '@/hooks/useProfileSettings';

export default function SettingsPage() {
  const {
    name,
    setName,
    bio,
    setBio,
    loading,
    saving,
    avatarUrl,
    uploading,
    uploadAvatar,
    saveProfile,
    handleLogout
  } = useProfileSettings();

  if (loading) return <p className="text-center mt-10 text-white">読み込み中...</p>;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-3xl shadow-lg text-black">
      <h1 className="text-2xl font-bold mb-6">プロフィール設定</h1>

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
            {uploading ? '...' : '変更する'}
            <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
          </label>
        </div>
      </div>

      <label className="block mb-2 font-bold text-gray-600">表示名</label>
      <input
        className="w-full border-2 p-3 rounded-xl mb-6 bg-gray-50 focus:border-blue-500 outline-none"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="username"
      />

      {/* 自己紹介(Bio)の入力 */}
      <div>
        <label className="block mb-2 font-bold text-gray-600 text-sm ml-1">自己紹介 (Bio)</label>
        <textarea
          className="w-full border-2 p-3 rounded-xl bg-gray-50 h-32 focus:border-blue-500 outline-none resize-none transition-all"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio here..."
          maxLength={150}
        />
        <p className="text-right text-[10px] text-gray-400 mt-1">{bio.length} / 150</p>
      </div>

      <button
        onClick={saveProfile}
        disabled={saving || uploading}
        className={`w-full text-white py-3 rounded-xl font-bold transition-colors ${saving || uploading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
      >
        {saving ? '保存中...' : '保存する'}
      </button>

      {/* ログアウトボタン */}
      <button
        onClick={handleLogout}
        className="w-full mt-4 bg-white text-red-500 py-3 rounded-xl font-bold border-2 border-red-500 hover:bg-red-50 transition-colors"
      >
        ログアウト
      </button>
    </div>
  );
}