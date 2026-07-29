'use client';

import Link from 'next/link';
import Nav from '@/components/Nav';
import { PackagePlus, Camera, History } from 'lucide-react';

const OPCIONES = [
  {
    href: '/kits',
    icon: PackagePlus,
    titulo: 'Kits de consumibles',
    desc: 'Crea y revisa paquetes reutilizables, ej. "Catering Básico".',
  },
  {
    href: '/kits/usar',
    icon: Camera,
    titulo: 'Usar kit en evento',
    desc: 'Selecciona un kit, mira qué falta comprar, y registra el consumo con foto.',
  },
  {
    href: '/catering/historial',
    icon: History,
    titulo: 'Historial de eventos',
    desc: 'Revisa los catering pasados: fecha, kit usado y foto de cómo quedó.',
  },
];

export default function CateringPage() {
  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-bodega-tag font-semibold text-sm mb-1">Catering y eventos</p>
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
