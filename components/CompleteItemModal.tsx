import { BucketItem } from '@/types/item';

export type CompleteItemModalProps = {
    isCompleteModalOpen: boolean;
    setIsCompleteModalOpen: (isOpen: boolean) => void;
    selectedItem: BucketItem | null;
    imageFile: File | null;
    previewUrl: string | null;
    reflection: string;
    setReflection: (reflection: string) => void;
    uploading: boolean;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleCompleteSave: () => void;
};

export const CompleteItemModal = ({
    isCompleteModalOpen,
    setIsCompleteModalOpen,
    selectedItem,
    imageFile,
    previewUrl,
    reflection,
    setReflection,
    uploading,
    handleFileChange,
    handleCompleteSave
}: CompleteItemModalProps) => {
    if (!isCompleteModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative animate-in zoom-in duration-200 text-black">
                <h2 className="text-2xl font-bold mb-1 text-center text-gray-800">達成おめでとう！🎉</h2>
                <p className="text-blue-600 font-semibold text-center mb-6 text-sm">「{selectedItem?.title}」</p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">写真を選択</label>
                        <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-2 text-center hover:bg-gray-50 hover:border-green-300 transition-all group">
                            <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} />
                            {previewUrl ? (
                                <img src={previewUrl} className="w-full max-h-60 object-contain rounded-xl" alt="Preview" />
                            ) : (
                                <div className="py-8">
                                    <div className="text-3xl mb-2">📸</div>
                                    <p className="text-sm text-gray-500 font-bold">写真をアップロード</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <textarea
                        className="w-full border-2 p-3 rounded-xl bg-gray-50 h-24 focus:border-green-500 outline-none resize-none"
                        placeholder="どんな最高な体験でしたか？"
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 mt-6">
                    <button onClick={() => setIsCompleteModalOpen(false)} className="flex-1 text-gray-400 font-bold" disabled={uploading}>戻る</button>
                    <button
                        onClick={handleCompleteSave}
                        disabled={uploading || !imageFile}
                        className={`flex-1 text-white py-3 rounded-xl font-bold ${uploading || !imageFile ? 'bg-gray-300' : 'bg-green-500 shadow-lg shadow-green-100'}`}
                    >
                        {uploading ? '保存中...' : '記録する'}
                    </button>
                </div>
            </div>
        </div>
    );
};
