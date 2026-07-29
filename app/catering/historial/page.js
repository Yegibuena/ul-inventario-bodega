'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

export default function HistorialCateringPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/eventos-kit')
      .then((res) => res.json())
      .then((data) => {
        setEventos(data.eventos || []);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-bodega-tag font-semibold text-sm mb-1">Catering y eventos</p>
          <h1 className="font-display text-3xl font-bold">Historial de eventos</h1>
        </div>

        {loading ? (
          <p className="text-bodega-muted">Cargando…</p>
        ) : eventos.length === 0 ? (
          <p className="text-bodega-muted">Todavía no hay eventos registrados.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {eventos.map((ev) => (
              <div key={ev.id} className="panel p-4 flex gap-3">
                <div className="w-20 h-20 shrink-0 rounded-xl bg-bodega-panel border border-bodega-line overflow-hidden flex items-center justify-center">
                  {ev.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ev.foto_url} alt={ev.nombre_evento} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-bodega-muted text-xs">Sin foto</span>
                  )}
                </div>
                <div>
                  <p className="font-display font-semibold">{ev.nombre_evento}</p>
                  <p className="text-bodega-muted text-sm">{ev.kits?.nombre}</p>
                  <p className="text-bodega-muted text-xs mt-1">{ev.fecha_evento}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
