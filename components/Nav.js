'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ArrowRightLeft, UtensilsCrossed, LogOut } from 'lucide-react';

const LINKS = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/movimientos', label: 'Movimientos', icon: ArrowRightLeft },
  { href: '/catering', label: 'Catering', icon: UtensilsCrossed },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-bodega-line bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="font-display font-bold text-xl tracking-tight text-bodega-paper">Bodega UL</span>
          <span className="font-mono text-[10px] text-bodega-tag uppercase tracking-widest hidden sm:inline">Student Life</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? 'bg-bodega-tag text-white' : 'text-bodega-muted hover:bg-blue-50 hover:text-bodega-tag'
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-bodega-muted hover:bg-red-50 hover:text-bodega-lost transition-colors whitespace-nowrap"
          >
            <LogOut size={16} />
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}
