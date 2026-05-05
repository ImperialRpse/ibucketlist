import Link from 'next/link';
import { Profile } from '@/types/item';

type Props = {
  profiles: Profile[];
};

function UserAvatar({ profile }: { profile: Profile }) {
  return (
    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-yellow-400 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.display_name || 'Users'} className="w-full h-full object-cover" />
      ) : (
        <span>{(profile.display_name || 'U').charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export function UserList({ profiles }: Props) {
  if (profiles.length === 0) {
    return <div className="text-center py-10 text-gray-500">No results found</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {profiles.map(profile => (
        <Link
          key={profile.id}
          href={`/profile/${profile.id}`}
          className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <UserAvatar profile={profile} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{profile.display_name}</p>
            <p className="text-xs text-gray-500 truncate">{profile.bio || 'No bio'}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
