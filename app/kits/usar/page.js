'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';

function UsarKitForm() {
  const params = useSearchParams();
  const kitIdInicial = params.get('kit') || '';

  const [kits, setKits] = useState([]);
  const [kitId, setKitId] = useState(kitIdInicial);
  const [loading, setLoading] = useState(true);

  const [nombreEvento, setNombreEvento] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: '', success: '', bajoMinimo: [] });

  useEffect(() => {
    fetch('/api/kits')
      .then((res) => res.json())
      .then((data) => {
        setKits(data.kits || []);
        setLoading(false);
      });
  }, []);

  const kitSeleccionado = kits.find((k) => k.id === kitId);

  function handleFotoChange(e) {
    const file = e.target.files?.[0];
    setFoto(file || null);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '', bajoMinimo: [] });

    try {
      let foto_url = null;
      if (foto) {
        const fd = new FormData();
        fd.append('foto', foto);
        fd.append('sku', nombreEvento.replace(/\s+/g, '-') || 'evento');
        const uploadRes = await fetch('/api/articulos/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error);
        foto_url = uploadData.foto_url;
      }

      const res = await fetch('/api/eventos-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kit_id: kitId, nombre_evento: nombreEvento, fecha_evento: fecha, foto_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus({
        loading: false,
        error: '',
        success: `Consumo registrado para "${nombreEvento}". Se descontó del inventario.`,
        bajoMinimo: data.bajoMinimo || [],
      });
      setNombreEvento('');
      setFoto(null);
      setPreview(null);
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Ocurrió un error.', success: '', bajoMinimo: [] });
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <p className="font-mono text-xs text-bodega-tag uppercase tracking-[0.3em] mb-1">Catering y eventos</p>
        <h1 className="font-display text-3xl font-bold">Usar kit en un evento</h1>
      </div>

      {loading ? (
        <p className="text-bodega-muted">Cargando kits…</p>
      ) : (
        <form onSubmit={handleSubmit} className="panel p-6 space-y-5">
          <div>
            <label className="field-label" htmlFor="kit">Kit</label>
            <select id="kit" className="input-field" value={kitId} onChange={(e) => setKitId(e.target.value)} required>
              <option value="">Selecciona un kit…</option>
              {kits.map((k) => (
                <option key={k.id} value={k.id}>{k.nombre}</option>
              ))}
            </select>
          </div>

          {kitSeleccionado && (
            <div className="tag-stub space-y-1">
              <p className="font-display font-semibold uppercase text-xs tracking-wide text-bodega-muted">Lista para preparar:</p>
              {kitSeleccionado.items.map((it) => {
                const actual = it.articulos?.cantidad_actual ?? 0;
                const faltante = Math.max(0, it.cantidad_requerida - actual);
                return (
                  <p key={it.id} className="flex justify-between">
                    <span>{it.articulos?.nombre_articulo} — necesitas {it.cantidad_requerida}</span>
                    {faltante > 0 ? (
                      <span className="text-bodega-lost">faltan {faltante} (solo hay {actual})</span>
                    ) : (
                      <span className="text-bodega-ok">✓ hay suficiente ({actual})</span>
                    )}
                  </p>
                );
              })}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="nombreEvento">Nombre del evento</label>
              <input id="nombreEvento" className="input-field" placeholder="Torneo intramuros" value={nombreEvento} onChange={(e) => setNombreEvento(e.target.value)} required />
            </div>
            <div>
              <label className="field-label" htmlFor="fecha">Fecha</label>
              <input id="fecha" type="date" className="input-field" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="foto">Foto de cómo quedó el catering</label>
            <input id="foto" type="file" accept="image/*" className="input-field file:mr-3 file:py-1 file:px-2 file:rounded-sm file:border-0 file:bg-bodega-tag file:text-bodega-bg file:font-display file:font-semibold file:uppercase file:text-xs" onChange={handleFotoChange} />
          </div>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa" className="w-32 h-32 object-cover rounded-sm border border-bodega-line" />
          )}

          {status.error && (
            <p className="text-bodega-lost text-sm border border-bodega-lost/40 bg-bodega-lost/10 rounded-sm px-3 py-2">{status.error}</p>
          )}
          {status.success && (
            <p className="text-bodega-ok text-sm border border-bodega-ok/40 bg-bodega-ok/10 rounded-sm px-3 py-2">{status.success}</p>
          )}
          {status.bajoMinimo.length > 0 && (
            <div className="text-bodega-lost text-sm border border-bodega-lost/40 bg-bodega-lost/10 rounded-sm px-3 py-2 space-y-1">
              <p className="font-display font-semibold uppercase tracking-wide text-xs">⚠ Ya quedaron por debajo del mínimo — hay que comprar:</p>
              {status.bajoMinimo.map((b) => (
                <p key={b.sku} className="font-mono text-xs">{b.nombre_articulo}: quedan {b.cantidad_actual} (mínimo {b.cantidad_minima})</p>
              ))}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={status.loading || !kitId}>
            {status.loading ? 'Guardando…' : 'Registrar consumo del evento'}
          </button>
        </form>
      )}
    </main>
  );
}

export default function UsarKitPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={<p className="text-bodega-muted p-8">Cargando…</p>}>
        <UsarKitForm />
      </Suspense>
    </>
  );
}
