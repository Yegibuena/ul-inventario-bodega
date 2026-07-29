'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';

export default function KitsPage() {
  const [kits, setKits] = useState([]);
  const [consumibles, setConsumibles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [items, setItems] = useState([{ sku: '', cantidad_requerida: 1 }]);
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  async function cargar() {
    setLoading(true);
    const [kitsRes, articulosRes] = await Promise.all([
      fetch('/api/kits'),
      fetch('/api/articulos?tipo=consumible'),
    ]);
    const kitsData = await kitsRes.json();
    const articulosData = await articulosRes.json();
    setKits(kitsData.kits || []);
    setConsumibles(articulosData.articulos || []);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  function actualizarItem(index, campo, valor) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [campo]: valor } : it)));
  }

  function agregarItem() {
    setItems((prev) => [...prev, { sku: '', cantidad_requerida: 1 }]);
  }

  function quitarItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      const res = await fetch('/api/kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus({ loading: false, error: '', success: `Kit "${data.kit.nombre}" creado.` });
      setNombre('');
      setDescripcion('');
      setItems([{ sku: '', cantidad_requerida: 1 }]);
      cargar();
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Ocurrió un error.', success: '' });
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <p className="font-mono text-xs text-bodega-tag uppercase tracking-[0.3em] mb-1">Catering y eventos</p>
          <h1 className="font-display text-3xl font-bold">Kits de consumibles</h1>
          <p className="text-bodega-muted text-sm mt-1">
            Arma paquetes reutilizables (ej. &quot;Catering Básico&quot;) para no volver a capturar la
            lista cada vez que hay un evento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
          <h2 className="font-display font-semibold text-lg">Crear nuevo kit</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="nombre">Nombre del kit</label>
              <input id="nombre" className="input-field" placeholder="Catering Básico" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div>
              <label className="field-label" htmlFor="descripcion">Descripción (opcional)</label>
              <input id="descripcion" className="input-field" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="field-label">Consumibles del kit</label>
            {items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <select
                  className="input-field"
                  value={item.sku}
                  onChange={(e) => actualizarItem(index, 'sku', e.target.value)}
                  required
                >
                  <option value="">Selecciona un consumible…</option>
                  {consumibles.map((c) => (
                    <option key={c.sku} value={c.sku}>{c.nombre_articulo} ({c.sku})</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className="input-field w-28"
                  value={item.cantidad_requerida}
                  onChange={(e) => actualizarItem(index, 'cantidad_requerida', e.target.value)}
                  required
                />
                {items.length > 1 && (
                  <button type="button" onClick={() => quitarItem(index)} className="btn-secondary shrink-0">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={agregarItem} className="btn-secondary text-xs">+ Agregar otro consumible</button>
            {consumibles.length === 0 && (
              <p className="text-xs text-bodega-muted">
                Todavía no tienes consumibles registrados — ve a &quot;+ Ingreso&quot; y elige &quot;Consumible&quot;.
              </p>
            )}
          </div>

          {status.error && (
            <p className="text-bodega-lost text-sm border border-bodega-lost/40 bg-bodega-lost/10 rounded-sm px-3 py-2">{status.error}</p>
          )}
          {status.success && (
            <p className="text-bodega-ok text-sm border border-bodega-ok/40 bg-bodega-ok/10 rounded-sm px-3 py-2">{status.success}</p>
          )}

          <button type="submit" className="btn-primary" disabled={status.loading}>
            {status.loading ? 'Guardando…' : 'Crear kit'}
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg">Kits existentes</h2>
          {loading ? (
            <p className="text-bodega-muted">Cargando…</p>
          ) : kits.length === 0 ? (
            <p className="text-bodega-muted">Aún no hay kits creados.</p>
          ) : (
            kits.map((kit) => (
              <div key={kit.id} className="panel p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold">{kit.nombre}</h3>
                  <Link href={`/kits/usar?kit=${kit.id}`} className="btn-secondary text-xs">Usar en evento</Link>
                </div>
                {kit.descripcion && <p className="text-bodega-muted text-sm mt-1">{kit.descripcion}</p>}
                <ul className="mt-2 space-y-1">
                  {kit.items.map((it) => (
                    <li key={it.id} className="text-xs font-mono text-bodega-muted flex justify-between">
                      <span>{it.articulos?.nombre_articulo} ({it.sku})</span>
                      <span>{it.cantidad_requerida} necesarias · {it.articulos?.cantidad_actual ?? '—'} en stock</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
