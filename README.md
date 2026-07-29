# Bodega UL — Control de Inventario de Student Life

Aplicación web para el control de inventario de la bodega de Student Life en la
Universidad de la Libertad, Innovación y Negocios (ULIN). Reemplaza el Excel de
bodega con un sistema donde cada artículo tiene trazabilidad completa: quién lo
tiene prestado, cuándo salió, cuándo regresó y en qué condición — además de
manejar consumibles de catering, kits reutilizables para eventos, y alertas
automáticas de stock bajo.

> Proyecto elaborado para el curso **Applied Algorithmic Thinking**.

- **Web app desplegada:** https://ul-inventario-bodega-rrsanx.vercel.app
- **Documento de planeación (5 secciones):** `plano-logico-tecnico-bodega-ul.md`

---

## 1. El problema

La bodega de Student Life prestaba material de clubes sin: notificaciones de
inventario bajo, registro de qué alumno tiene cada artículo, historial lineal
de movimientos, ni forma de diferenciar unidades repetidas del mismo artículo.
Además, los consumibles de catering (agua, café, galletas) no tenían ninguna
herramienta que ayudara a armarlos por evento ni avisara cuándo comprar más.

## 2. Stack técnico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend/Backend | **Next.js 15** (App Router) | Un solo proyecto sirve páginas y API routes; despliegue nativo en Vercel. |
| Base de datos | **Supabase (Postgres)** | Tablas relacionales, Row Level Security, Storage de fotos, Edge Functions y cron, todo en un proveedor. |
| Hosting | **Vercel** | Dominio público `.vercel.app`, despliegue automático por `git push`. |
| Estilos | **Tailwind CSS** | Look blanco/azul centralizado en un solo archivo de configuración — cambiar la paleta completa de la app tomó editar un archivo, no cada página. |
| Iconos | **lucide-react** | SVG *tree-shakeable*, liviano. |
| Importación de datos | **SheetJS (xlsx)** | Lee el Excel real de Student Life sin pedirles cambiar de formato. |
| Correo automático | **Resend** | API HTTP simple para las alertas de stock bajo y préstamos vencidos. |
| Autenticación | Código de acceso de staff + cookie httpOnly firmada (SHA-256, Web Crypto) | Suficiente para un equipo pequeño; ver limitaciones abajo. |

### Modelo de datos (Supabase)

```
articulos          → catálogo maestro. es_consumible=false → una fila por
                      unidad física (SKU único, prefijo SL-). es_consumible=true
                      → una fila por producto con cantidad_actual/minima/maxima.
prestamos           → cada salida de un artículo duradero
devoluciones        → cada regreso, con estado de calidad
umbrales_articulo   → mínimo/máximo por familia de artículo duradero
kits / kit_items    → paquetes reutilizables de consumibles (ej. "Catering Básico")
eventos_kit         → registro de consumo real de un kit, con foto y fecha
historial_movimientos (vista) → línea de tiempo unificada de préstamos + devoluciones
```

### Funcionalidades principales

- **Ingreso** de artículos duraderos o consumibles, con **alta masiva** (loops) y
  **detección de posibles duplicados** (sets + índice de Jaccard).
- **Salida / Regreso** con validación de formato por regex (SKU, matrícula) y
  reglas de negocio (no se puede prestar algo ya prestado, no se cierra dos
  veces el mismo préstamo).
- **Importador de Excel** que limpia texto, genera SKUs faltantes y deduplica
  antes de insertar.
- **Kits de consumibles**: arma la lista de un evento una vez, reutilízala
  siempre; al usarla, descuenta el inventario y guarda foto + fecha + nombre
  del evento.
- **Mínimos y máximos** con alerta visual en el Panel y por correo automático
  (Supabase Edge Function + pg_cron + API de Resend, sin intervención humana).
- Navegación por 4 categorías (Panel, Inventario, Movimientos, Catering) con
  botones grandes por función en vez de un menú plano.

## 3. Seguridad — decisiones y límites conocidos

- Las credenciales de Supabase solo se usan del lado del servidor (dentro de
  `app/api/*`), nunca se exponen al navegador ni se suben al repositorio;
  viven como variables de entorno en Vercel.
- RLS activo en todas las tablas.
- El login es un código compartido, no cuentas individuales — decisión
  consciente para un equipo pequeño; el siguiente paso natural es Supabase
  Auth con roles si el equipo crece.
- Se detectó y corrigió una vulnerabilidad crítica real (**CVE-2025-29927**,
  bypass de autorización en middleware de Next.js) actualizando de la versión
  14.2.5 a la 15.5.9 **antes** de desplegar — justo la pieza de la que
  depende el login de esta app.

## 4. Cómo correrlo localmente

```bash
git clone <URL-DE-ESTE-REPO>
cd ul-inventario-bodega
npm install
cp .env.example .env.local   # y llena los 4 valores
npm run dev
```

## 5. Variables de entorno

| Variable | De dónde sale |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` key |
| `STAFF_ACCESS_CODE` | La inventas tú |
| `SESSION_SECRET` | String largo y aleatorio, ej. `openssl rand -hex 32` |

## 6. Autoevaluación

**Lo que funcionó bien:** cada feature se construyó y se compiló localmente
(`npm run build`) antes de desplegarse, lo que evitó subir código roto a
producción ni una sola vez. La arquitectura separa con claridad la lógica de
negocio (validaciones, reglas de estado) de la capa de presentación, lo que
permitió rediseñar toda la interfaz de un tema oscuro a uno blanco/azul
editando un solo archivo de configuración sin tocar la lógica.

**Lo que fue más difícil:** coordinar variables de entorno entre proyectos de
Vercel (hubo confusión inicial entre un proyecto previo) 

**Lo que mejoraría con más tiempo:** autenticación individual por miembro del
staff (en vez de un código compartido), notificaciones por WhatsApp además de
correo, y códigos QR para no tener que teclear el SKU.

## 7. Prompts principales utilizados con la IA

1. Brief inicial completo describiendo el problema real de Student Life, los
   campos exactos de ingreso/salida/regreso, y el requisito de no borrar
   inventario sino cambiar su `status`.

Rol: experto en versel: npx plugins add vercel/vercel-plugin y supabase, queremos hacer segun los contenidos vistos en el curso Applied algoritmic Thinking un control de inventario.

Problema: dentro de la universidad de la libertad, el area de student life tiene inventario en excel sobre la bodega con los materiales de clubes y extras que constantemente estan en uso pero no tienen notificaciones de inventario, no saben a que alumno le prestaron tal articulo, y no hay un seguimiento lineal de ellos.

Solucion: vamos a crear un app web con el dominio de versel para que el equipo de la UL la pueda utilizar, usando supabase como base de datos de todo lo que se registrara, y github para subir nuestros repositorios. 
Tareas: decodifica una interfaz grafica super intuitiva para el ingreso en el invetario y salidas del mismo, para el ingreso debe contener los campos: articulo, club, descripcion, sku (numero de identificación), FOTO y estado del material. Ten en cuenta que por ejemplo con los balones se pueden repetir entonces la identificacion del articulo diferenciandolo es importante, para la salida d los materiales solo queremos la matricula del alumno, dia del prestamo, hora , y SKU, para los regresos del prestamos dia, hora, matricula y sku. dentro de supabase en lugar de borrar inventario solo ponle un status como "prestado" y que se cambie a "en bodega " cuando lo rewgresen, en caso de que se pierda algun material a la hora del regreso debe estar el status de calidad del material, y poner una opcion de "perdido" lo cual tambien debe estar reflejado en la base de datos

puedes ser creativo y agregar cosas que mejoren la operacion de esto que te pido, invetiga mas recursos si es necesario, si tienes limitaciones dime y dame instrucciones claras de lo que quieres que realice.


2. Iteraciones pidiendo cubrir temas específicos del curso (regex, sets,
   loops, lectura de documentos, limpieza de datos, APIs que se hablan entre
   sí, Pandas/Seaborn) aplicados como features reales, no ejercicios sueltos.
   
Con esta base, y arreglando los errores en Versel, quiero que implementes:Migración del Excel + limpieza de datos (2.14/3.22), Alerta automática por correo de préstamos vencidos (2.15), Notebook de Pandas/Seaborn con gráficas (3.18-3.21), Alta masiva con loops (1.7), Validación con regex de SKU/matrícula (1.9), Detector de duplicados con sets (1.5)

