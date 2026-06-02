'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ItemCard } from '@/components/ItemCard';
import { AddItemModal } from '@/components/AddItemModal';
import { EditItemModal } from '@/components/EditItemModal';
import { CompleteItemModal } from '@/components/CompleteItemModal';
import { FollowListModal } from '@/components/FollowListModal';
import { FollowRequestsModal } from '@/components/FollowRequestsModal';
import { UserOptionsModal } from '@/components/UserOptionsModal';
import { useProfile } from '@/hooks/useProfile';

function UserProfileContent() {
  const searchParams = useSearchParams();
  const profileUserId = searchParams.get('id') || '';

  // Follow Requestsモーダルの開閉状態
  const [isFollowRequestsModalOpen, setIsFollowRequestsModalOpen] = useState(false);
  // Usersオプション（Details）モーダルの開閉状態
  const [isUserOptionsModalOpen, setIsUserOptionsModalOpen] = useState(false);
  // フィルタータブの状態
  const [filterTab, setFilterTab] = useState<'All' | 'Active' | 'Completed'>('All');

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
    closeFollowModal,
    isBlocked,
    blockLoading,
    toggleBlock
  } = useProfile(profileUserId);

  if (loading) return <div className="p-10 text-center text-gray-600">Loading...</div>;

  // フォローボタンのスタイルとラベルを状態に応じて切り替える
  const followButtonLabel = isFollowing ? 'Following' : isRequestSent ? 'Requested' : 'Follow';
  const followButtonClass = (isFollowing || isRequestSent)
    ? 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
    : 'bg-blue-500 hover:bg-blue-600 text-white';

  // フィルタリングされたアイテム
  const filteredItems = items.filter((item) => {
    if (filterTab === 'All') return true;
    if (filterTab === 'Active') return !item.is_completed;
    if (filterTab === 'Completed') return item.is_completed;
    return true;
  });

  const tabs: Array<'All' | 'Active' | 'Completed'> = ['All', 'Active', 'Completed'];

  return (
    <div className="max-w-md mx-auto px-4 pt-[calc(env(safe-area-inset-top,0px)+68px)] pb-[calc(env(safe-area-inset-bottom,0px)+96px)] md:py-6 text-gray-900">
      {/* プロフィールヘッダーセクション */}
      <div className="flex flex-col items-center gap-4 mb-8 px-4 mt-6">
        {/* アイコンエリア */}
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[3px] border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl md:text-5xl font-bold text-gray-400">
                {profile?.display_name?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
        </div>

        {/* ユーザーネーム & プライベートバッジ */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {profile?.display_name || 'Username'}
          </h2>
          {profile && profile.is_public === false && (
            <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
              🔒 Private
            </span>
          )}
        </div>

        {/* アクションボタン */}
        <div className="w-full max-w-xs flex justify-center gap-2">
          {isMe ? (
            <div className="flex gap-2 w-full justify-center">
              <Link
                href="/profile/settings"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 text-sm font-bold py-2 px-4 rounded-xl transition-colors text-center shadow-sm"
              >
                Edit Profile
              </Link>
              {profile?.is_public === false && (
                <button
                  id="follow-requests-btn"
                  onClick={() => setIsFollowRequestsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold py-2 px-3 rounded-xl transition-colors border border-gray-200 shadow-sm"
                >
                  <span>📥</span>
                  <span>Requests</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2 w-full justify-center">
              <button
                id="follow-toggle-btn"
                onClick={toggleFollow}
                className={`flex-1 py-2 px-4 rounded-xl font-bold text-sm transition-all text-center shadow-sm ${followButtonClass}`}
              >
                {followButtonLabel}
              </button>
              <button
                onClick={handleStartMessage}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 text-sm font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 text-center shadow-sm"
              >
                {loading ? 'Connecting...' : 'Message'}
              </button>
              <button
                id="user-options-btn"
                onClick={() => setIsUserOptionsModalOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors border border-gray-200 shrink-0 shadow-sm"
                title="Details"
              >
                ⋯
              </button>
            </div>
          )}
        </div>

        {/* 統計情報 */}
        <div className="flex justify-center gap-6 text-gray-500 text-sm mt-2">
          <div><span className="font-bold text-gray-900">{items.length}</span> posts</div>
          <button
            onClick={() => openFollowModal('followers')}
            className="hover:text-gray-900 transition-colors cursor-pointer"
          >
            <span className="font-bold text-gray-900">{followerCount}</span> followers
          </button>
          <button
            onClick={() => openFollowModal('following')}
            className="hover:text-gray-900 transition-colors cursor-pointer"
          >
            <span className="font-bold text-gray-900">{followingCount}</span> following
          </button>
        </div>

        {/* 自己紹介 (Bio) */}
        <div className="text-sm text-center max-w-sm mt-1">
          <p className="text-gray-600 whitespace-pre-wrap">
            {profile?.bio || 'Bio here...'}
          </p>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-t border-gray-200 mb-0 flex justify-center">
        <div className="flex w-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              id={`filter-tab-${tab.toLowerCase()}`}
              onClick={() => setFilterTab(tab)}
              className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-colors border-t-2 -mt-[2px] ${
                filterTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* リスト表示 */}
      {isPrivateRestricted ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
            🔒
          </div>
          <p className="text-gray-900 font-semibold text-lg">This account is private</p>
          <p className="text-gray-500 text-sm">
            {currentUserId
              ? isRequestSent
                ? 'Follow request sent. Please wait for approval.'
                : 'Follow to see posts'
              : 'Log in and follow to see posts'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="text-4xl">
                {filterTab === 'Completed' ? '🎉' : '📝'}
              </span>
              <p className="text-gray-400 text-sm">
                {filterTab === 'All'
                  ? 'No posts yet.'
                  : filterTab === 'Active'
                  ? 'No active goals.'
                  : 'No completed goals yet.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
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
                  setEditCategory(item.category || 'Others');
                  setIsEditModalOpen(true);
                }}
                onDeleteClick={deleteItem}
              />
            ))
          )}
        </div>
      )}

      {/* 自分のみ＋ボタンを表示 */}
      {isMe && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] md:bottom-10 right-6 md:right-10 w-14 h-14 md:w-16 md:h-16 bg-blue-500 text-white rounded-full shadow-2xl text-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
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

      {/* Follow Requestsモーダル（自分のプロフィールのみ） */}
      <FollowRequestsModal
        isOpen={isFollowRequestsModalOpen}
        onClose={() => setIsFollowRequestsModalOpen(false)}
      />

      {/* Usersオプション（Details）モーダル */}
      <UserOptionsModal
        isOpen={isUserOptionsModalOpen}
        onClose={() => setIsUserOptionsModalOpen(false)}
        targetUser={profile}
        isBlocked={isBlocked}
        blockLoading={blockLoading}
        onToggleBlock={toggleBlock}
      />
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white">Loading...</div>}>
      <UserProfileContent />
    </Suspense>
  );
}
