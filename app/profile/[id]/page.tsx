'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { ItemCard } from '@/components/ItemCard';
import { AddItemModal } from '@/components/AddItemModal';
import { EditItemModal } from '@/components/EditItemModal';
import { CompleteItemModal } from '@/components/CompleteItemModal';
import { FollowListModal } from '@/components/FollowListModal';
import { FollowRequestsModal } from '@/components/FollowRequestsModal';
import { useProfile } from '@/hooks/useProfile';

//フォルダ名が [id] なら、プログラムの中では id という名前でデータを受け取れます。
//引数(URL)を渡す処理に時間がかかる可能性があるのでPromiseで包んでおく。
//引数をpromiseで包んだ場合、関数内で使う場合はawaitで待ってから使う。今回はクライアントサイドなのでuse()を使う。
export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  //use()は、ブラウザ側のコンポーネントで Promise（予約票）を開封するための特別な道具。
  const { id: profileUserId } = use(params);

  // フォローリクエストモーダルの開閉状態
  const [isFollowRequestsModalOpen, setIsFollowRequestsModalOpen] = useState(false);

  const {
    items,
    profile,
    isMe,
    loading,
    currentUserId,
    isPrivateRestricted,
    isOpen,
    setIsOpen,
    isCompleteModalOpen,
    setIsCompleteModalOpen,
    newItem,
    setNewItem,
    newItemDescription,
    setNewItemDescription,
    newCategory,
    setNewCategory,
    selectedItem,
    setSelectedItem,
    reflection,
    setReflection,
    uploading,
    imageFile,
    previewUrl,
    isFollowing,
    isRequestSent,
    followerCount,
    followingCount,
    toggleLike,
    toggleFollow,
    addItem,
    isEditModalOpen,
    setIsEditModalOpen,
    editingItem,
    setEditingItem,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editCategory,
    setEditCategory,
    updateItem,
    deleteItem,
    handleCompleteSave,
    handleFileChange,
    handleStartMessage,
    followModalType,
    followListUsers,
    followListLoading,
    openFollowModal,
    closeFollowModal
  } = useProfile(profileUserId);

  if (loading) return <div className="p-10 text-center text-white">Loading...</div>;

  // フォローボタンのスタイルとラベルを状態に応じて切り替える
  const followButtonLabel = isFollowing ? 'Following' : isRequestSent ? 'Requested' : 'Follow';
  const followButtonClass = (isFollowing || isRequestSent)
    ? 'bg-white/10 text-white border border-gray-600 hover:bg-white/20'
    : 'bg-blue-500 hover:bg-blue-600 text-white';

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
            {/* プライベートバッジ */}
            {profile && profile.is_public === false && (
              <span className="text-xs bg-white/10 text-gray-300 border border-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                🔒 非公開
              </span>
            )}

            {isMe ? (
              <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                <Link
                  href="/profile/settings"
                  className="inline-block bg-white/20 hover:bg-white/30 text-white text-sm font-bold py-1.5 px-6 rounded-lg transition-colors text-center"
                >
                  Edit Profile
                </Link>
                {/* 自分のプロフィールが非公開の場合、フォローリクエストボタンを表示 */}
                {profile?.is_public === false && (
                  <button
                    id="follow-requests-btn"
                    onClick={() => setIsFollowRequestsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-1.5 px-4 rounded-lg transition-colors border border-gray-600"
                  >
                    <span>📥</span>
                    <span>フォローリクエスト</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  id="follow-toggle-btn"
                  onClick={toggleFollow}
                  className={`py-1.5 px-6 rounded-lg font-bold text-sm transition-all ${followButtonClass}`}
                >
                  {followButtonLabel}
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
            <button
              onClick={() => openFollowModal('followers')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              <span className="font-bold text-white">{followerCount}</span> followers
            </button>
            <button
              onClick={() => openFollowModal('following')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              <span className="font-bold text-white">{followingCount}</span> following
            </button>
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
      {isPrivateRestricted ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl">
            🔒
          </div>
          <p className="text-white font-semibold text-lg">このアカウントは非公開です</p>
          <p className="text-gray-400 text-sm">
            {currentUserId
              ? isRequestSent
                ? 'フォローリクエストを送信しました。承認をお待ちください'
                : 'フォローすると投稿を見られます'
              : 'ログインしてフォローすると投稿を見られます'}
          </p>
        </div>
      ) : (
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
              onEditClick={(item) => {
                setEditingItem(item);
                setEditTitle(item.title);
                setEditDescription(item.description || '');
                setEditCategory(item.category || 'その他');
                setIsEditModalOpen(true);
              }}
              onDeleteClick={deleteItem}
            />
          ))}
        </div>
      )}

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
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        onAdd={addItem}
      />

      <EditItemModal
        isOpen={isEditModalOpen}
        setIsOpen={setIsEditModalOpen}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editCategory={editCategory}
        setEditCategory={setEditCategory}
        onSave={updateItem}
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

      <FollowListModal
        isOpen={followModalType !== null}
        onClose={closeFollowModal}
        title={followModalType === 'followers' ? 'Followers' : 'Following'}
        users={followListUsers}
        loading={followListLoading}
      />

      {/* フォローリクエストモーダル（自分のプロフィールのみ） */}
      <FollowRequestsModal
        isOpen={isFollowRequestsModalOpen}
        onClose={() => setIsFollowRequestsModalOpen(false)}
      />
    </div>
  );
}