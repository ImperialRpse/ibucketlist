type Tab = 'items' | 'users';

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

const TABS: { value: Tab; label: string }[] = [
  { value: 'items', label: 'Bucket Items' },
  { value: 'users', label: 'Users' },
];

export function ExploreTabBar({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      {TABS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onTabChange(value)}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === value
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
