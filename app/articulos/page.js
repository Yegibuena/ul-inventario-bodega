'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import StatusStamp from '@/components/StatusStamp';

export default function CatalogoPage() {
  const [articulos, setArticulos] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    const res = await fetch(`/api/articulos?${params.toString()}`);
    const data = await res.json();
    setArticulos(data.articulos || []);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    cargar();
  }

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="font-mono text-xs text-bodega-tag uppercase tracking-[0.3em] mb-1">Catálogo</p>
          <h1 className="font-display text-3xl font-bold">Artículos de la bodega</h1>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3">
          <input
            className="input-field max-w-xs"
            placeholder="Buscar por SKU o nombre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input-field max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="en_bodega">En bodega</option>
            <option value="prestado">Prestado</option>
            <option value="perdido">Perdido</option>
          </select>
          <button type="submit" className="btn-secondary">Filtrar</button>
        </form>

        {loading ? (
          <p className="text-bodega-muted">Cargando…</p>
        ) : articulos.length === 0 ? (
          <p className="text-bodega-muted">No hay artículos que coincidan con la búsqueda.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articulos.map((a) => (
              <div key={a.id} className="panel p-4 flex gap-3">
                <div className="w-20 h-20 shrink-0 rounded-sm bg-bodega-bg border border-bodega-line overflow-hidden flex items-center justify-center">
                  {a.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.foto_url} alt={a.nombre_articulo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-bodega-muted text-xs">Sin foto</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-semibold text-lg leading-tight truncate">{a.nombre_articulo}</h3>
                    <StatusStamp status={a.status} />
                  </div>
                  <p className="font-mono text-xs text-bodega-tag">{a.sku}</p>
                  <p className="text-bodega-muted text-sm">{a.club}</p>
                  {a.descripcion && <p className="text-bodega-muted text-xs truncate">{a.descripcion}</p>}
                  <p className="text-xs text-bodega-muted">Calidad: {a.estado_calidad}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
