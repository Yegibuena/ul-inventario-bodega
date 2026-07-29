'use client';

import Link from 'next/link';
import Nav from '@/components/Nav';
import { List, PlusCircle, FileSpreadsheet, Gauge } from 'lucide-react';

const OPCIONES = [
  {
    href: '/articulos',
    icon: List,
    titulo: 'Ver catálogo',
    desc: 'Busca y filtra todos los artículos duraderos y consumibles de la bodega.',
  },
  {
    href: '/articulos/nuevo',
    icon: PlusCircle,
    titulo: 'Registrar ingreso',
    desc: 'Da de alta un artículo nuevo — duradero o consumible — con foto y SKU.',
  },
  {
    href: '/articulos/importar',
    icon: FileSpreadsheet,
    titulo: 'Importar Excel',
    desc: 'Sube el Excel actual de la bodega y se limpia e importa automáticamente.',
  },
  {
    href: '/articulos/umbrales',
    icon: Gauge,
    titulo: 'Mínimos y máximos',
    desc: 'Define cuánto stock mínimo debe haber de cada artículo para recibir alertas.',
  },
];

export default function InventarioPage() {
  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-bodega-tag font-semibold text-sm mb-1">Inventario</p>
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
