import { CATEGORIES } from '@/lib/constants';

/**
 * CATEGORIES 配列を { 大項目: [小項目, ...] } の階層構造に変換する
 */
export const parseCategoryTree = (): Record<string, string[]> => {
  return CATEGORIES.reduce((acc, cat) => {
    const match = cat.match(/^(.+?)(?:\s*\((.+)\))?$/);
    if (match) {
      const main = match[1].trim();
      const sub = match[2];
      if (!acc[main]) acc[main] = [];
      if (sub) acc[main].push(cat); // 小項目は元の値「Travel (Japan)」を保持する
    }
    return acc;
  }, {} as Record<string, string[]>);
};

export const categoryTree = parseCategoryTree();
