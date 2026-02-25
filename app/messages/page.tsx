export default function MessagesStartPage() {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-[#121212]">
        <div className="w-20 h-20 bg-gray-800/50 text-gray-500 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Your Messages</h2>
        <p className="text-gray-500 max-w-[240px] text-sm leading-relaxed">
          左側のリストから会話を選択してチャットを開始してください。
        </p>
      </div>
    );
  }