'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';

const ESTADOS = ['bueno', 'regular', 'dañado', 'perdido'];

export default function DevolucionPage() {
  const [sku, setSku] = useState('');
  const [prestamo, setPrestamo] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [buscarError, setBuscarError] = useState('');

  const [matricula, setMatricula] = useState('');
  const [estado, setEstado] = useState('bueno');
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  async function buscarPrestamo(e) {
    e.preventDefault();
    setBuscando(true);
    setBuscarError('');
    setPrestamo(null);
    setStatus({ loading: false, error: '', success: '' });

    const res = await fetch('/api/prestamos?status=activo');
    const data = await res.json();
    const encontrado = (data.prestamos || []).find((p) => p.sku.toLowerCase() === sku.trim().toLowerCase());

    setBuscando(false);
    if (!encontrado) {
      setBuscarError(`No hay ningún préstamo activo con el SKU "${sku}".`);
      return;
    }
    setPrestamo(encontrado);
    setMatricula(encontrado.matricula_alumno);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      const res = await fetch('/api/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prestamo_id: prestamo.id, matricula_alumno: matricula, estado_calidad_regreso: estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus({
        loading: false,
        error: '',
        success: estado === 'perdido'
          ? `Se registró el regreso y el artículo ${prestamo.sku} quedó marcado como PERDIDO.`
          : `Regreso registrado. El artículo ${prestamo.sku} vuelve a estar EN BODEGA (estado: ${estado}).`,
      });
      setPrestamo(null);
      setSku('');
      setMatricula('');
      setEstado('bueno');
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Ocurrió un error.', success: '' });
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="font-mono text-xs text-bodega-tag uppercase tracking-[0.3em] mb-1">Regreso de material</p>
          <h1 className="font-display text-3xl font-bold">Registrar devolución</h1>
        </div>

        <form onSubmit={buscarPrestamo} className="panel p-6 space-y-4">
          <div>
            <label className="field-label" htmlFor="sku">SKU del artículo a devolver</label>
            <div className="flex gap-2">
              <input id="sku" className="input-field font-mono" placeholder="SL-BAL-FUT-001" value={sku} onChange={(e) => setSku(e.target.value)} required />
              <button type="submit" className="btn-secondary shrink-0" disabled={buscando}>
                {buscando ? 'Buscando…' : 'Buscar'}
              </button>
            </div>
          </div>
          {buscarError && (
            <p className="text-bodega-lost text-sm border border-bodega-lost/40 bg-bodega-lost/10 rounded-sm px-3 py-2">{buscarError}</p>
          )}
        </form>

        {prestamo && (
          <form onSubmit={handleSubmit} className="panel p-6 space-y-5">
            <div className="tag-stub">
              <p><span className="text-bodega-muted">Artículo:</span> {prestamo.articulos?.nombre_articulo}</p>
              <p><span className="text-bodega-muted">Prestado el:</span> {prestamo.fecha_prestamo} {prestamo.hora_prestamo}</p>
            </div>

            <div>
              <label className="field-label" htmlFor="matricula">Matrícula del alumno</label>
              <input id="matricula" className="input-field font-mono" value={matricula} onChange={(e) => setMatricula(e.target.value)} required />
            </div>

            <div>
              <label className="field-label" htmlFor="estado">Estado de calidad al regresar</label>
              <select id="estado" className="input-field" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS.map((op) => (
                  <option key={op} value={op}>{op === 'perdido' ? 'Perdido (no se regresó el material)' : op}</option>
                ))}
              </select>
            </div>

            {status.error && (
              <p className="text-bodega-lost text-sm border border-bodega-lost/40 bg-bodega-lost/10 rounded-sm px-3 py-2">{status.error}</p>
            )}
            {status.success && (
              <p className="text-bodega-ok text-sm border border-bodega-ok/40 bg-bodega-ok/10 rounded-sm px-3 py-2">{status.success}</p>
            )}

            <button type="submit" className="btn-primary" disabled={status.loading}>
              {status.loading ? 'Guardando…' : 'Confirmar regreso'}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
