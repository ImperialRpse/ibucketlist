import { useRef, useEffect, useState } from 'react';
import { categoryTree } from '@/lib/categories';

type Props = {
  activeCategory: string;
  onCategoryClick: (catName: string) => void;
};

export function CategoryFilter({ activeCategory, onCategoryClick }: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // コンテナの外側クリックで展開をClose
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpandedCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpand = (mainCat: string) => {
    setExpandedCategory(prev => (prev === mainCat ? null : mainCat));
  };

  return (
    <div ref={containerRef} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-sm font-semibold text-gray-500 mb-3">Search by Category</h2>
      <div className="flex flex-wrap gap-2">
        {Object.entries(categoryTree).map(([mainCat, subCats]) => (
          <div key={mainCat} className="relative">
            <button
              onClick={() => toggleExpand(mainCat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${expandedCategory === mainCat || (activeCategory && activeCategory.startsWith(mainCat))
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {/* 波括弧 { } で囲むことで、JavaScriptの変数をHTMLの中に埋め込むことができます */}
              {mainCat}
            </button>

            {/* 小項目のドロップダウン */}
            {expandedCategory === mainCat && subCats.length > 0 && (
              <div className="absolute top-full left-0 mt-2 min-w-[200px] z-10 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                {/* "All" オプション */}
                <button
                  onClick={() => onCategoryClick(mainCat)}
                  className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${activeCategory === mainCat
                      ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                      : 'text-gray-700'
                    }`}
                >
                  All
                </button>

                {subCats.map(fullCat => {
                  const subNameMatch = fullCat.match(/（(.+)）/);
                  const displaySubName = subNameMatch ? subNameMatch[1] : fullCat;
                  return (
                    <button
                      key={fullCat}
                      onClick={() => onCategoryClick(fullCat)}
                      className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${activeCategory === fullCat
                          ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                          : 'text-gray-700'
                        }`}
                    >
                      {displaySubName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
