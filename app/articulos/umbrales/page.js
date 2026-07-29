'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

export default function UmbralesPage() {
  const [umbrales, setUmbrales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre_articulo: '', club: '', cantidad_minima: '', cantidad_maxima: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  async function cargar() {
    setLoading(true);
    const res = await fetch('/api/umbrales');
    const data = await res.json();
    setUmbrales(data.umbrales || []);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      const res = await fetch('/api/umbrales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus({ loading: false, error: '', success: `Mínimo de "${data.umbral.nombre_articulo}" guardado.` });
      setForm({ nombre_articulo: '', club: '', cantidad_minima: '', cantidad_maxima: '' });
      cargar();
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Ocurrió un error.', success: '' });
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="font-mono text-xs text-bodega-tag uppercase tracking-[0.3em] mb-1">Umbrales</p>
          <h1 className="font-display text-3xl font-bold">Mínimos y máximos por artículo</h1>
          <p className="text-bodega-muted text-sm mt-1">
            Ej. &quot;mínimo 5 Balón de fútbol en Club de Fútbol&quot; — si el número en bodega baja de eso,
            aparece una alerta en el Panel y en el correo automático.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="nombre_articulo">Nombre del artículo (exacto)</label>
              <input id="nombre_articulo" className="input-field" placeholder="Balón de fútbol #5" value={form.nombre_articulo} onChange={(e) => update('nombre_articulo', e.target.value)} required />
            </div>
            <div>
              <label className="field-label" htmlFor="club">Club</label>
              <input id="club" className="input-field" placeholder="Club de Fútbol" value={form.club} onChange={(e) => update('club', e.target.value)} required />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="cantidad_minima">Mínimo en bodega</label>
              <input id="cantidad_minima" type="number" min={0} className="input-field" value={form.cantidad_minima} onChange={(e) => update('cantidad_minima', e.target.value)} required />
            </div>
            <div>
              <label className="field-label" htmlFor="cantidad_maxima">Máximo (opcional)</label>
              <input id="cantidad_maxima" type="number" min={0} className="input-field" value={form.cantidad_maxima} onChange={(e) => update('cantidad_maxima', e.target.value)} />
            </div>
          </div>

          {status.error && (
            <p className="text-bodega-lost text-sm border border-bodega-lost/40 bg-bodega-lost/10 rounded-sm px-3 py-2">{status.error}</p>
          )}
          {status.success && (
            <p className="text-bodega-ok text-sm border border-bodega-ok/40 bg-bodega-ok/10 rounded-sm px-3 py-2">{status.success}</p>
          )}

          <button type="submit" className="btn-primary" disabled={status.loading}>
            {status.loading ? 'Guardando…' : 'Guardar mínimo'}
          </button>
        </form>

        <div className="space-y-2">
          <h2 className="font-display font-semibold text-lg">Umbrales configurados</h2>
          {loading ? (
            <p className="text-bodega-muted">Cargando…</p>
          ) : umbrales.length === 0 ? (
            <p className="text-bodega-muted">Sin umbrales configurados todavía.</p>
          ) : (
            <div className="panel divide-y divide-bodega-line">
              {umbrales.map((u) => (
                <div key={u.id} className="p-3 flex justify-between text-sm">
                  <span>{u.nombre_articulo} — {u.club}</span>
                  <span className="text-bodega-muted">mín. {u.cantidad_minima}{u.cantidad_maxima ? ` · máx. ${u.cantidad_maxima}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
