'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Ошибка'); return; }
      localStorage.setItem('admin_token', data.token);
      router.push('/admin');
    } catch { setError('Ошибка соединения'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-1 mb-2">
            <span className="text-3xl font-black text-orange-500">TAJ</span>
            <span className="text-3xl font-black text-white">PAINTBALL</span>
          </div>
          <p className="text-neutral-400 text-sm">Панель администратора</p>
        </div>
        <div className="card p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Логин</label>
              <input type="text" value={login} onChange={e => setLogin(e.target.value)}
                className="input-field" placeholder="admin" required autoComplete="username" />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••" required autoComplete="current-password" />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-4 rounded-2xl">
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
