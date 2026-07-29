'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import { SKU_EJEMPLO } from '@/lib/validators';

const ESTADOS_CALIDAD = ['nuevo', 'bueno', 'regular', 'dañado'];

export default function NuevoArticuloPage() {
  const [esConsumible, setEsConsumible] = useState(false);
  const [form, setForm] = useState({
    sku: '',
    nombre_articulo: '',
    club: '',
    descripcion: '',
    estado_calidad: 'bueno',
    cantidad: 1,
    cantidad_actual: '',
    cantidad_minima: '',
    cantidad_maxima: '',
  });
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: '', success: '', duplicados: [] });

  const esMasivo = !esConsumible && Number(form.cantidad) > 1;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFotoChange(e) {
    const file = e.target.files?.[0];
    setFoto(file || null);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '', duplicados: [] });

    try {
      let foto_url = null;
      if (foto) {
        const fd = new FormData();
        fd.append('foto', foto);
        fd.append('sku', form.sku);
        const uploadRes = await fetch('/api/articulos/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error);
        foto_url = uploadData.foto_url;
      }

      const res = await fetch('/api/articulos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, foto_url, es_consumible: esConsumible }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const cantidadCreada = data.articulos.length;
      const mensaje = esConsumible
        ? `Consumible "${data.articulos[0].nombre_articulo}" registrado con SKU ${data.articulos[0].sku} (${data.articulos[0].cantidad_actual} unidades).`
        : cantidadCreada === 1
          ? `Artículo "${data.articulos[0].nombre_articulo}" registrado con SKU ${data.articulos[0].sku}.`
          : `Se registraron ${cantidadCreada} unidades: ${data.articulos[0].sku} … ${data.articulos[cantidadCreada - 1].sku}.`;

      setStatus({ loading: false, error: '', success: mensaje, duplicados: data.posiblesDuplicados || [] });
      setForm({ sku: '', nombre_articulo: '', club: '', descripcion: '', estado_calidad: 'bueno', cantidad: 1, cantidad_actual: '', cantidad_minima: '', cantidad_maxima: '' });
      setFoto(null);
      setPreview(null);
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Ocurrió un error.', success: '', duplicados: [] });
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="font-mono text-xs text-bodega-tag uppercase tracking-[0.3em] mb-1">Ingreso de material</p>
          <h1 className="font-display text-3xl font-bold">Registrar artículo nuevo</h1>
        </div>

        <div className="flex gap-2 panel p-1.5 w-fit">
          <button
            type="button"
            onClick={() => setEsConsumible(false)}
            className={`px-4 py-2 rounded-sm text-sm font-display font-semibold uppercase tracking-wide transition-colors ${!esConsumible ? 'bg-bodega-tag text-bodega-bg' : 'text-bodega-muted'}`}
          >
            Duradero (se presta y regresa)
          </button>
          <button
            type="button"
            onClick={() => setEsConsumible(true)}
            className={`px-4 py-2 rounded-sm text-sm font-display font-semibold uppercase tracking-wide transition-colors ${esConsumible ? 'bg-bodega-tag text-bodega-bg' : 'text-bodega-muted'}`}
          >
            Consumible (se gasta)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="sku">
                {esMasivo ? 'Prefijo de SKU (sin número)' : 'SKU'}
              </label>
              <input
                id="sku"
                className="input-field font-mono"
                placeholder={esMasivo ? 'BAL-FUT (se guarda como SL-BAL-FUT)' : SKU_EJEMPLO}
                value={form.sku}
                onChange={(e) => update('sku', e.target.value)}
                required
              />
              <p className="text-xs text-bodega-muted mt-1">
                No hace falta escribir &quot;SL-&quot;, se agrega solo. {esMasivo && `Se generarán como SL-${(form.sku || 'PREFIJO').toUpperCase().replace(/^SL-/, '')}-001, -002, …`}
              </p>
            </div>
            <div>
              <label className="field-label" htmlFor="club">Club</label>
              <input id="club" className="input-field" placeholder="Club de Fútbol" value={form.club} onChange={(e) => update('club', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="nombre">Artículo</label>
            <input id="nombre" className="input-field" placeholder={esConsumible ? 'Agua embotellada 600ml' : 'Balón de fútbol #5'} value={form.nombre_articulo} onChange={(e) => update('nombre_articulo', e.target.value)} required />
          </div>

          <div>
            <label className="field-label" htmlFor="descripcion">Descripción</label>
            <textarea id="descripcion" className="input-field" rows={2} value={form.descripcion} onChange={(e) => update('descripcion', e.target.value)} />
          </div>

          {esConsumible ? (
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="field-label" htmlFor="cantidad_actual">Cantidad actual</label>
                <input id="cantidad_actual" type="number" min={0} className="input-field" value={form.cantidad_actual} onChange={(e) => update('cantidad_actual', e.target.value)} required />
              </div>
              <div>
                <label className="field-label" htmlFor="cantidad_minima">Mínimo (alerta de restock)</label>
                <input id="cantidad_minima" type="number" min={0} className="input-field" value={form.cantidad_minima} onChange={(e) => update('cantidad_minima', e.target.value)} required />
              </div>
              <div>
                <label className="field-label" htmlFor="cantidad_maxima">Máximo (opcional)</label>
                <input id="cantidad_maxima" type="number" min={0} className="input-field" value={form.cantidad_maxima} onChange={(e) => update('cantidad_maxima', e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="field-label" htmlFor="estado_calidad">Estado del material</label>
                <select id="estado_calidad" className="input-field" value={form.estado_calidad} onChange={(e) => update('estado_calidad', e.target.value)}>
                  {ESTADOS_CALIDAD.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="cantidad">Cantidad (unidades iguales)</label>
                <input id="cantidad" type="number" min={1} max={50} className="input-field" value={form.cantidad} onChange={(e) => update('cantidad', e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="foto">Foto</label>
                <input id="foto" type="file" accept="image/*" className="input-field file:mr-3 file:py-1 file:px-2 file:rounded-sm file:border-0 file:bg-bodega-tag file:text-bodega-bg file:font-display file:font-semibold file:uppercase file:text-xs" onChange={handleFotoChange} />
              </div>
            </div>
          )}

          {esConsumible && (
            <div>
              <label className="field-label" htmlFor="foto2">Foto</label>
              <input id="foto2" type="file" accept="image/*" className="input-field file:mr-3 file:py-1 file:px-2 file:rounded-sm file:border-0 file:bg-bodega-tag file:text-bodega-bg file:font-display file:font-semibold file:uppercase file:text-xs" onChange={handleFotoChange} />
            </div>
          )}

          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa" className="w-28 h-28 object-cover rounded-sm border border-bodega-line" />
          )}

          {status.error && (
            <p className="text-bodega-lost text-sm border border-bodega-lost/40 bg-bodega-lost/10 rounded-sm px-3 py-2">{status.error}</p>
          )}
          {status.success && (
            <p className="text-bodega-ok text-sm border border-bodega-ok/40 bg-bodega-ok/10 rounded-sm px-3 py-2">{status.success}</p>
          )}
          {status.duplicados.length > 0 && (
            <div className="text-bodega-tag text-sm border border-bodega-tag/40 bg-bodega-tag/10 rounded-sm px-3 py-2 space-y-1">
              <p className="font-display font-semibold uppercase tracking-wide text-xs">⚠ Ya existe algo parecido en este club:</p>
              {status.duplicados.map((d) => (
                <p key={d.sku} className="font-mono text-xs">{d.sku} — {d.nombre_articulo} ({Math.round(d.similitud * 100)}% similar)</p>
              ))}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={status.loading}>
            {status.loading ? 'Guardando…' : esConsumible ? 'Registrar consumible' : esMasivo ? `Registrar ${form.cantidad} unidades` : 'Registrar artículo'}
          </button>
        </form>
      </main>
    </>
  );
}
