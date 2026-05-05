'use client';
import { useFollowRequests } from '@/hooks/useFollowRequests';
import { Profile } from '@/types/item';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

function RequesterAvatar({ profile }: { profile?: Profile }) {
    return (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-yellow-400 to-fuchsia-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
            {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-full h-full object-cover" />
            ) : (
                <span>{(profile?.display_name || 'U').charAt(0).toUpperCase()}</span>
            )}
        </div>
    );
}

export function FollowRequestsModal({ isOpen, onClose }: Props) {
    const { requests, loading, approveRequest, rejectRequest } = useFollowRequests();

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 text-base">Follow Requests</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* コンテンツ */}
                <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm">
                            <p className="text-3xl mb-3">📭</p>
                            <p>No follow requests</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="flex items-center gap-3 px-5 py-4">
                                <RequesterAvatar profile={req.profiles} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">
                                        {req.profiles?.display_name || 'User'}
                                    </p>
                                    {req.profiles?.bio && (
                                        <p className="text-xs text-gray-500 truncate">{req.profiles.bio}</p>
                                    )}
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        id={`approve-${req.id}`}
                                        onClick={() => approveRequest(req.id, req.requester_id)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        id={`reject-${req.id}`}
                                        onClick={() => rejectRequest(req.id)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
