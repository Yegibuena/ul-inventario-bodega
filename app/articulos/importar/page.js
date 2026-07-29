'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';

export default function ImportarExcelPage() {
  const [archivo, setArchivo] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: '', resultado: null });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!archivo) return;
    setStatus({ loading: true, error: '', resultado: null });

    try {
      const fd = new FormData();
      fd.append('archivo', archivo);
      const res = await fetch('/api/articulos/importar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus({ loading: false, error: '', resultado: data });
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Ocurrió un error al importar.', resultado: null });
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="font-mono text-xs text-bodega-tag uppercase tracking-[0.3em] mb-1">Migración</p>
          <h1 className="font-display text-3xl font-bold">Importar Excel existente</h1>
          <p className="text-bodega-muted text-sm mt-1">
            Sube el Excel actual de la bodega. El sistema detecta las columnas (Artículo, Club,
            Descripción, SKU, Estado — no importa el orden ni mayúsculas), limpia nombres
            duplicados o mal escritos, genera un SKU cuando falte, y omite lo que ya exista.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
          <div>
            <label className="field-label" htmlFor="archivo">Archivo (.xlsx o .xls)</label>
            <input
              id="archivo"
              type="file"
              accept=".xlsx,.xls"
              className="input-field file:mr-3 file:py-1 file:px-2 file:rounded-sm file:border-0 file:bg-bodega-tag file:text-bodega-bg file:font-display file:font-semibold file:uppercase file:text-xs"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              required
            />
          </div>

          {status.error && (
            <p className="text-bodega-lost text-sm border border-bodega-lost/40 bg-bodega-lost/10 rounded-sm px-3 py-2">{status.error}</p>
          )}

          <button type="submit" className="btn-primary" disabled={status.loading || !archivo}>
            {status.loading ? 'Importando…' : 'Importar y limpiar'}
          </button>
        </form>

        {status.resultado && (
          <div className="panel p-6 space-y-3">
            <p className="text-bodega-ok font-display font-semibold">
              ✓ {status.resultado.insertados} artículos importados correctamente.
            </p>
            {status.resultado.omitidos > 0 && (
              <div className="text-bodega-tag text-sm space-y-1">
                <p className="font-display font-semibold uppercase tracking-wide text-xs">
                  {status.resultado.omitidos} filas omitidas:
                </p>
                {status.resultado.detalleOmitidos.map((o, i) => (
                  <p key={i} className="font-mono text-xs text-bodega-muted">Fila {o.fila}: {o.motivo}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
