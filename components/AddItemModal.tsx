import { useState } from 'react';
import { suggestCategory } from '@/actions/categorize';
import { CATEGORIES } from '@/lib/constants';

export type AddItemModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    newItem: string;
    setNewItem: (item: string) => void;
    newItemDescription: string;
    setNewItemDescription: (desc: string) => void;
    newCategory: string;
    setNewCategory: (cat: string) => void;
    onAdd: () => void;
};

export const AddItemModal = ({
    isOpen,
    setIsOpen,
    newItem,
    setNewItem,
    newItemDescription,
    setNewItemDescription,
    newCategory,
    setNewCategory,
    onAdd
}: AddItemModalProps) => {
    const [isSuggesting, setIsSuggesting] = useState(false);

    const handleBlurTitle = async () => {
        if (!newItem) return;
        setIsSuggesting(true);
        try {
            const suggested = await suggestCategory(newItem);
            setNewCategory(suggested);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSuggesting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative z-10 text-black">
                <h2 className="text-xl font-bold mb-4 text-center">新しい「やりたいこと」</h2>
                <input
                    className="w-full border-2 p-3 rounded-xl mb-4 bg-gray-50 focus:border-blue-500 outline-none"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onBlur={handleBlurTitle}
                    placeholder="例：スカイダイビングをする"
                    autoFocus
                />
                
                <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">カテゴリー</label>
                    <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full border-2 p-3 rounded-xl bg-gray-50 focus:border-blue-500 outline-none disabled:bg-gray-200"
                        disabled={isSuggesting}
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    {isSuggesting && <span className="text-xs text-blue-500 mt-1 block">✨ AIがカテゴリを推測中...</span>}
                </div>

                <textarea
                    className="w-full border-2 p-3 rounded-xl mb-4 bg-gray-50 focus:border-blue-500 outline-none resize-none"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="詳細（任意）"
                    rows={3}
                />
                <div className="flex gap-2">
                    <button type="button" onClick={() => setIsOpen(false)} className="flex-1 text-gray-500 py-2">キャンセル</button>
                    <button type="button" onClick={onAdd} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors">追加</button>
                </div>
            </div>
        </div>
    );
};
