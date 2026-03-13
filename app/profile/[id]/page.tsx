'use client';
import { use } from 'react';
import Link from 'next/link';
import { ItemCard } from '@/components/ItemCard';
import { AddItemModal } from '@/components/AddItemModal';
import { CompleteItemModal } from '@/components/CompleteItemModal';
import { useProfile } from '@/hooks/useProfile';

//フォルダ名が [id] なら、プログラムの中では id という名前でデータを受け取れます。
//引数(URL)を渡す処理に時間がかかる可能性があるのでPromiseで包んでおく。
//引数をpromiseで包んだ場合、関数内で使う場合はawaitで待ってから使う。今回はクライアントサイドなのでuse()を使う。
export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  //use()は、ブラウザ側のコンポーネントで Promise（予約票）を開封するための特別な道具。
  const { id: profileUserId } = use(params);

  const {
    items,
    profile,
    isMe,
    loading,
    currentUserId,
    isOpen,
    setIsOpen,
    isCompleteModalOpen,
    setIsCompleteModalOpen,
    newItem,
    setNewItem,
    newItemDescription,
    setNewItemDescription,
    selectedItem,
    setSelectedItem,
    reflection,
    setReflection,
    uploading,
    imageFile,
    previewUrl,
    isFollowing,
    followerCount,
    followingCount,
    toggleLike,
    toggleFollow,
    addItem,
    handleCompleteSave,
    handleFileChange,
    handleStartMessage
  } = useProfile(profileUserId);

  if (loading) return <div className="p-10 text-center text-white">Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-4 pb-24 text-white">
      {/* インスタ風プロフィールヘッダーセクション */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 px-4 mt-6">
        {/* アイコンエリア */}
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
            <div className="w-full h-full rounded-full border-4 border-[#121212] overflow-hidden bg-gray-200 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl md:text-5xl font-bold text-gray-500">
                  {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ユーザー情報 & 統計情報エリア */}
        <div className="flex-1 text-center md:text-left w-full min-w-0">
          <div className="flex flex-row flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
            <h2 className="text-2xl font-light text-white tracking-tight whitespace-nowrap shrink-0">
              {profile?.display_name || 'ユーザー名'}
            </h2>

            {isMe ? (
              <Link
                href="/profile/settings"
                className="inline-block bg-white/20 hover:bg-white/30 text-white text-sm font-bold py-1.5 px-6 rounded-lg transition-colors text-center"
              >
                Edit Profile
              </Link>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={toggleFollow}
                  className={`py-1.5 px-6 rounded-lg font-bold text-sm transition-all ${isFollowing
                    ? 'bg-white/10 text-white border border-gray-600 hover:bg-white/20'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleStartMessage}
                  disabled={loading}
                  className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold py-1.5 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Message'}
                </button>

              </div>
            )}
          </div>

          <div className="flex justify-center md:justify-start gap-6 mb-4 text-gray-300 text-sm">
            <div><span className="font-bold text-white">{items.length}</span> posts</div>
            <div><span className="font-bold text-white">{followerCount}</span> followers</div>
            <div><span className="font-bold text-white">{followingCount}</span> following</div>
          </div>

          <div className="text-sm">
            <p className="text-gray-400 whitespace-pre-wrap">
              {profile?.bio || 'Bio here...'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-600 mb-8 flex justify-center">
        <div className="border-t-2 border-white -mt-[2px] pt-3 flex items-center gap-2 px-4">
          <span className="text-xs font-bold tracking-widest uppercase text-white">My Bucket List</span>
        </div>
      </div>

      {/* リスト表示 */}
      <div className="space-y-4">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            currentUserId={currentUserId}
            toggleLike={toggleLike}
            isProfileView={true}
            isMe={isMe}
            onCompleteClick={(item) => {
              setSelectedItem(item);
              setIsCompleteModalOpen(true);
            }}
          />
        ))}
      </div>

      {/* 自分のみ＋ボタンを表示 */}
      {isMe && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-10 right-10 w-16 h-16 bg-blue-500 text-white rounded-full shadow-2xl text-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
        >
          ＋
        </button>
      )}

      {/* モーダル群 */}
      <AddItemModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        newItem={newItem}
        setNewItem={setNewItem}
        newItemDescription={newItemDescription}
        setNewItemDescription={setNewItemDescription}
        onAdd={addItem}
      />

      <CompleteItemModal
        isCompleteModalOpen={isCompleteModalOpen}
        setIsCompleteModalOpen={setIsCompleteModalOpen}
        selectedItem={selectedItem}
        imageFile={imageFile}
        previewUrl={previewUrl}
        reflection={reflection}
        setReflection={setReflection}
        uploading={uploading}
        handleFileChange={handleFileChange}
        handleCompleteSave={handleCompleteSave}
      />
    </div>
  );
}