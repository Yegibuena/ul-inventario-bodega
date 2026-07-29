const CONFIG = {
  en_bodega: { label: 'En bodega', className: 'stamp-ok' },
  prestado: { label: 'Prestado', className: 'stamp-out' },
  perdido: { label: 'Perdido', className: 'stamp-lost' },
  activo: { label: 'Activo', className: 'stamp-out' },
  devuelto: { label: 'Devuelto', className: 'stamp-ok' },
};

export default function StatusStamp({ status }) {
  const config = CONFIG[status] || { label: status, className: 'stamp-ok' };
  return <span className={config.className}>{config.label}</span>;
}
