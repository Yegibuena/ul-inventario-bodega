'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

export default function HistorialPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [sku, setSku] = useState('');
  const [matricula, setMatricula] = useState('');
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    const params = new URLSearchParams();
    if (sku) params.set('sku', sku);
    if (matricula) params.set('matricula', matricula);
    const res = await fetch(`/api/historial?${params.toString()}`);
    const data = await res.json();
    setMovimientos(data.historial || []);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="font-mono text-xs text-bodega-tag uppercase tracking-[0.3em] mb-1">Trazabilidad</p>
          <h1 className="font-display text-3xl font-bold">Historial de movimientos</h1>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); cargar(); }}
          className="flex flex-wrap gap-3"
        >
          <input className="input-field max-w-xs font-mono" placeholder="Filtrar por SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <input className="input-field max-w-xs font-mono" placeholder="Filtrar por matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
          <button type="submit" className="btn-secondary">Filtrar</button>
        </form>

        {loading ? (
          <p className="text-bodega-muted">Cargando…</p>
        ) : movimientos.length === 0 ? (
          <p className="text-bodega-muted">Sin movimientos registrados todavía.</p>
        ) : (
          <div className="panel divide-y divide-bodega-line">
            {movimientos.map((m) => (
              <div key={`${m.tipo_movimiento}-${m.movimiento_id}`} className="p-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className={m.tipo_movimiento === 'prestamo' ? 'stamp-out' : 'stamp-ok'}>
                  {m.tipo_movimiento === 'prestamo' ? 'Salida' : 'Regreso'}
                </span>
                <span className="font-mono text-bodega-tag">{m.sku}</span>
                <span className="font-medium">{m.nombre_articulo}</span>
                <span className="text-bodega-muted">{m.club}</span>
                <span className="text-bodega-muted">Matrícula: {m.matricula_alumno}</span>
                <span className="text-bodega-muted">{m.fecha} {m.hora}</span>
                {m.estado_calidad_regreso && (
                  <span className="text-bodega-muted">Calidad: {m.estado_calidad_regreso}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
