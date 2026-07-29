'use client';

import Link from 'next/link';
import Nav from '@/components/Nav';
import { ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';

const OPCIONES = [
  {
    href: '/prestamo',
    icon: ArrowUpRight,
    titulo: 'Registrar salida',
    desc: 'Presta un artículo duradero a un alumno con su matrícula.',
  },
  {
    href: '/devolucion',
    icon: ArrowDownLeft,
    titulo: 'Registrar regreso',
    desc: 'Marca un préstamo activo como devuelto o como perdido.',
  },
  {
    href: '/historial',
    icon: History,
    titulo: 'Ver historial',
    desc: 'Consulta la línea de tiempo completa de salidas y regresos.',
  },
];

export default function MovimientosPage() {
  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-bodega-tag font-semibold text-sm mb-1">Movimientos</p>
          <h1 className="font-display text-3xl font-bold">¿Qué necesitas hacer?</h1>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {OPCIONES.map((op) => {
            const Icon = op.icon;
            return (
              <Link key={op.href} href={op.href} className="action-card">
                <span className="action-card-icon"><Icon size={22} /></span>
                <span>
                  <span className="block font-display font-semibold text-lg text-bodega-paper">{op.titulo}</span>
                  <span className="block text-bodega-muted text-sm mt-1">{op.desc}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
