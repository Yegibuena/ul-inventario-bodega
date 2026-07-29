import './globals.css';

export const metadata = {
  title: 'Bodega UL · Control de Inventario',
  description: 'Control de inventario de Student Life — Universidad de la Libertad, Innovación y Negocios',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="font-body bg-bodega-bg text-bodega-paper min-h-screen">
        {children}
      </body>
    </html>
  );
}
