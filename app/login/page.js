'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo iniciar sesión.');
        setLoading(false);
        return;
      }
      router.replace(params.get('next') || '/');
      router.refresh();
    } catch (err) {
      setError('Error de red. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <p className="font-mono text-xs text-bodega-tag tracking-[0.3em] uppercase mb-2">Student Life · ULIN</p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Bodega UL</h1>
        <p className="text-bodega-muted text-sm mt-1">Control de inventario de clubes y materiales</p>
      </div>
      <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
        <div>
          <label className="field-label" htmlFor="codigo">Código de acceso de staff</label>
          <input
            id="codigo"
            type="password"
            className="input-field font-mono"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="••••••••"
            autoFocus
            required
          />
        </div>
        {error && (
          <p className="text-bodega-lost text-sm border border-bodega-lost/40 bg-bodega-lost/10 rounded-sm px-3 py-2">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar a la bodega'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
