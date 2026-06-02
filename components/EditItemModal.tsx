import { BucketItem } from '@/types/item';
import { CATEGORIES } from '@/lib/constants';

export type EditItemModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    editTitle: string;
    setEditTitle: (title: string) => void;
    editDescription: string;
    setEditDescription: (desc: string) => void;
    editCategory: string;
    setEditCategory: (cat: string) => void;
    onSave: () => void;
};

export const EditItemModal = ({
    isOpen,
    setIsOpen,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editCategory,
    setEditCategory,
    onSave
}: EditItemModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative z-10 text-black">
                <h2 className="text-xl font-bold mb-4 text-center">Edit Post</h2>
                <input
                    className="w-full border-2 p-3 rounded-xl mb-4 bg-gray-50 focus:border-blue-500 outline-none"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Go skydiving"
                    autoFocus
                />

                <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                    <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full border-2 p-3 rounded-xl bg-gray-50 focus:border-blue-500 outline-none"
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <textarea
                    className="w-full border-2 p-3 rounded-xl mb-4 bg-gray-50 focus:border-blue-500 outline-none resize-none"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Details (optional)"
                    rows={3}
                />
                <div className="flex gap-2">
                    <button type="button" onClick={() => setIsOpen(false)} className="flex-1 text-gray-500 py-2 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button type="button" onClick={onSave} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-colors">Save</button>
                </div>
            </div>
        </div>
    );
};
