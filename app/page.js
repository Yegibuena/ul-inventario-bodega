'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError('No se pudo cargar el panel.'));
  }, []);

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <p className="font-mono text-xs text-bodega-tag uppercase tracking-[0.3em] mb-1">Panel de control</p>
          <h1 className="font-display text-3xl font-bold">Estado de la bodega</h1>
        </div>

        {error && (
          <p className="text-bodega-lost border border-bodega-lost/40 bg-bodega-lost/10 rounded-sm px-4 py-3">{error}</p>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total de artículos" value={stats.total} accent="text-bodega-paper" />
              <StatCard label="En bodega" value={stats.en_bodega} accent="text-bodega-ok" />
              <StatCard label="Prestados" value={stats.prestado} accent="text-bodega-out" />
              <StatCard label="Perdidos" value={stats.perdido} accent="text-bodega-lost" />
            </div>

            {(stats.consumiblesBajoMinimo?.length > 0 || stats.duraderosBajoMinimo?.length > 0) && (
              <div className="panel p-5 border-bodega-lost/50">
                <h2 className="font-display font-semibold uppercase tracking-wide text-bodega-lost mb-3">
                  ⚠ Stock por debajo del mínimo
                </h2>
                <div className="space-y-2">
                  {stats.consumiblesBajoMinimo?.map((c) => (
                    <div key={c.sku} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-bodega-line/60 pb-2 last:border-0">
                      <span className="font-mono text-bodega-tag">{c.sku}</span>
                      <span>{c.nombre_articulo}</span>
                      <span className="text-bodega-lost">quedan {c.cantidad_actual} (mínimo {c.cantidad_minima})</span>
                    </div>
                  ))}
                  {stats.duraderosBajoMinimo?.map((d) => (
                    <div key={`${d.nombre_articulo}-${d.club}`} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-bodega-line/60 pb-2 last:border-0">
                      <span>{d.nombre_articulo} ({d.club})</span>
                      <span className="text-bodega-lost">hay {d.en_bodega} en bodega (mínimo {d.cantidad_minima})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.vencidos.length > 0 && (
              <div className="panel p-5 border-bodega-lost/50">
                <h2 className="font-display font-semibold uppercase tracking-wide text-bodega-lost mb-3">
                  ⚠ Préstamos con retraso ({stats.vencidos.length})
                </h2>
                <div className="space-y-2">
                  {stats.vencidos.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-bodega-line/60 pb-2 last:border-0">
                      <span className="font-mono text-bodega-tag">{p.sku}</span>
                      <span>{p.articulos?.nombre_articulo}</span>
                      <span className="text-bodega-muted">Matrícula: {p.matricula_alumno}</span>
                      <span className="text-bodega-muted">Debía volver: {p.fecha_devolucion_estimada}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="panel p-5">
              <h2 className="font-display font-semibold uppercase tracking-wide text-bodega-muted mb-3">Artículos por club</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(stats.porClub).map(([club, count]) => (
                  <div key={club} className="tag-stub flex items-center justify-between">
                    <span className="truncate pr-2">{club}</span>
                    <span className="text-bodega-tag font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <QuickLink href="/inventario" title="Inventario" desc="Catálogo, ingreso, importar Excel y mínimos." />
          <QuickLink href="/movimientos" title="Movimientos" desc="Salidas, regresos e historial de préstamos." />
          <QuickLink href="/catering" title="Catering" desc="Kits de consumibles y registro de eventos." />
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="panel p-4">
      <p className="text-bodega-muted text-xs uppercase tracking-widest font-display font-semibold mb-1">{label}</p>
      <p className={`font-display font-bold text-4xl ${accent}`}>{value ?? '—'}</p>
    </div>
  );
}

function QuickLink({ href, title, desc }) {
  return (
    <Link href={href} className="panel p-5 hover:border-bodega-tag transition-colors block">
      <h3 className="font-display font-semibold text-lg mb-1">{title}</h3>
      <p className="text-bodega-muted text-sm">{desc}</p>
    </Link>
  );
}
