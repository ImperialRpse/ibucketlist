import Link from 'next/link';
import { BucketItem } from '@/types/item';

type Props = {
  items: BucketItem[];
};

export function ItemList({ items }: Props) {
  if (items.length === 0) {
    return <div className="text-center py-10 text-gray-500">検索結果はありません</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => (
        <Link
          key={item.id}
          href={`/item/${item.id}`}
          className="block bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="font-bold text-gray-800 line-clamp-2">{item.title}</h3>
          <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block mt-2">{item.category}</p>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
