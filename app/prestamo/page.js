'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';

export default function PrestamoPage() {
  const [form, setForm] = useState({ sku: '', matricula_alumno: '', fecha_devolucion_estimada: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      const res = await fetch('/api/prestamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const ahora = new Date();
      setStatus({
        loading: false,
        error: '',
        success: `Salida registrada: SKU ${data.prestamo.sku} → matrícula ${data.prestamo.matricula_alumno}, ${ahora.toLocaleDateString('es-MX')} ${ahora.toLocaleTimeString('es-MX')}.`,
      });
      setForm({ sku: '', matricula_alumno: '', fecha_devolucion_estimada: '' });
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Ocurrió un error.', success: '' });
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="font-mono text-xs text-bodega-tag uppercase tracking-[0.3em] mb-1">Salida de material</p>
          <h1 className="font-display text-3xl font-bold">Registrar préstamo</h1>
          <p className="text-bodega-muted text-sm mt-1">
            La fecha y hora se registran automáticamente al enviar el formulario.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6 space-y-5">
          <div>
            <label className="field-label" htmlFor="sku">SKU del artículo</label>
            <input id="sku" className="input-field font-mono" placeholder="SL-BAL-FUT-001" value={form.sku} onChange={(e) => update('sku', e.target.value)} required />
          </div>
          <div>
            <label className="field-label" htmlFor="matricula">Matrícula del alumno</label>
            <input id="matricula" className="input-field font-mono" placeholder="AL-2026-0042" value={form.matricula_alumno} onChange={(e) => update('matricula_alumno', e.target.value)} required />
            <p className="text-xs text-bodega-muted mt-1">Formato: letras-año-número, ej. AL-2026-0042</p>
          </div>
          <div>
            <label className="field-label" htmlFor="fecha_est">Fecha estimada de devolución (opcional)</label>
            <input id="fecha_est" type="date" className="input-field" value={form.fecha_devolucion_estimada} onChange={(e) => update('fecha_devolucion_estimada', e.target.value)} />
          </div>

          {status.error && (
            <p className="text-bodega-lost text-sm border border-bodega-lost/40 bg-bodega-lost/10 rounded-sm px-3 py-2">{status.error}</p>
          )}
          {status.success && (
            <p className="text-bodega-ok text-sm border border-bodega-ok/40 bg-bodega-ok/10 rounded-sm px-3 py-2">{status.success}</p>
          )}

          <button type="submit" className="btn-primary" disabled={status.loading}>
            {status.loading ? 'Registrando…' : 'Registrar salida'}
          </button>
        </form>
      </main>
    </>
  );
}
