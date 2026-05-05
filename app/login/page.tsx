'use client';
import { useAuthForm } from '@/hooks/useAuthForm';

export default function LoginPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    displayName,
    setDisplayName,
    handleSignUp,
    handleLogin,
  } = useAuthForm();

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl text-black border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Welcome!</h1>
      
      {/* 💡 Add：Users名入力欄（新規登録時のみ使われます） */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Username (for signup only)</label>
        <input
          type="text"
          placeholder="Nickname"
          className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-blue-500 outline-none transition-all"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Email Address</label>
        <input
          type="email"
          placeholder="email@example.com"
          className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-blue-500 outline-none transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Password</label>
        <input
          type="password"
          placeholder="••••••••"
          className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-blue-500 outline-none transition-all"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-4">
        <button onClick={handleLogin} className="w-full bg-blue-500 text-white p-4 rounded-2xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-100 transition-all active:scale-95">
          Login
        </button>
        <button onClick={handleSignUp} className="w-full bg-gray-100 text-gray-700 p-4 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95">
          Sign Up
        </button>
      </div>
    </div>
  );
}