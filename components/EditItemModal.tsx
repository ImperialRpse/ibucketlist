import { BucketItem } from '@/types/item';

export type EditItemModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    editTitle: string;
    setEditTitle: (title: string) => void;
    editDescription: string;
    setEditDescription: (desc: string) => void;
    onSave: () => void;
};

export const EditItemModal = ({
    isOpen,
    setIsOpen,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    onSave
}: EditItemModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative z-10 text-black">
                <h2 className="text-xl font-bold mb-4 text-center">投稿を編集する</h2>
                <input
                    className="w-full border-2 p-3 rounded-xl mb-4 bg-gray-50 focus:border-blue-500 outline-none"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="例：スカイダイビングをする"
                    autoFocus
                />
                <textarea
                    className="w-full border-2 p-3 rounded-xl mb-4 bg-gray-50 focus:border-blue-500 outline-none resize-none"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="詳細（任意）"
                    rows={3}
                />
                <div className="flex gap-2">
                    <button onClick={() => setIsOpen(false)} className="flex-1 text-gray-500 py-2 hover:bg-gray-100 rounded-xl transition-colors">キャンセル</button>
                    <button onClick={onSave} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-colors">保存</button>
                </div>
            </div>
        </div>
    );
};
