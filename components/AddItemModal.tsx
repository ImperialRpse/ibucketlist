export type AddItemModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    newItem: string;
    setNewItem: (item: string) => void;
    newItemDescription: string;
    setNewItemDescription: (desc: string) => void;
    onAdd: () => void;
};

export const AddItemModal = ({
    isOpen,
    setIsOpen,
    newItem,
    setNewItem,
    newItemDescription,
    setNewItemDescription,
    onAdd
}: AddItemModalProps) => {
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
                    placeholder="例：スカイダイビングをする"
                    autoFocus
                />
                <textarea
                    className="w-full border-2 p-3 rounded-xl mb-4 bg-gray-50 focus:border-blue-500 outline-none resize-none"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="詳細（任意）"
                    rows={3}
                />
                <div className="flex gap-2">
                    <button onClick={() => setIsOpen(false)} className="flex-1 text-gray-500 py-2">キャンセル</button>
                    <button onClick={onAdd} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold">追加</button>
                </div>
            </div>
        </div>
    );
};
