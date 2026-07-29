# Plano Lógico y Técnico — Bodega UL
### Control de Inventario de Student Life · Universidad de la Libertad, Innovación y Negocios
**Curso:** Applied Algorithmic Thinking — Unit 2, Business Applications
**Autora:** Regina Sánchez

---

## 1. Definición del problema y alcance

### 1.1 El problema real

El área de Student Life administra una bodega física con material de más de una docena de clubes (balones, herramientas, equipo de catering, etc.). El control actual es un archivo de Excel mantenido a mano, lo cual genera cuatro fallas concretas y verificables:

1. **Sin notificación de inventario bajo o vencido.** Nadie se entera de que algo se agotó hasta que un alumno lo pide y no está.
2. **Sin trazabilidad de préstamos.** No existe un registro de qué alumno tiene cada artículo, ni desde cuándo.
3. **Sin historial lineal.** No se puede reconstruir la secuencia de movimientos de un artículo específico (quién lo tuvo, cuándo salió, cuándo regresó).
4. **Sin diferenciación de unidades repetidas.** Diez balones idénticos son una sola fila en el Excel; si tres se prestan, no hay forma de saber cuáles.

Un quinto problema surgió durante el desarrollo, al hablar con Student Life sobre el uso real de la bodega: **los consumibles de catering (agua, café, galletas) se manejan distinto a los artículos duraderos** — no se prestan y regresan, se gastan, y no había ninguna herramienta que ayudara a armar la lista de materiales por evento ni que avisara cuándo comprar más.

### 1.2 Usuarios afectados

| Usuario | Necesidad |
|---|---|
| Staff de Student Life | Registrar entradas/salidas rápido, sin fricción, sin necesitar capacitación técnica |
| Alumnos de clubes | Que el material que necesitan esté disponible y se les preste de forma ordenada |
| Coordinación de Student Life | Visibilidad de qué falta comprar, qué se pierde más, y evidencia de cada evento de catering |

### 1.3 Alcance — qué SÍ incluye la aplicación

- Catálogo de artículos con dos tipos: **duraderos** (una fila por unidad física, con SKU único) y **consumibles** (una fila por producto, con una cantidad que sube y baja).
- Flujo completo de **salida (préstamo)** y **regreso (devolución)**, con cambio de `status` en vez de borrado de registros.
- **Alta masiva** de unidades idénticas mediante generación automática de SKU.
- **Importación** del Excel actual de la bodega, con limpieza y deduplicación automática.
- **Detección de posibles duplicados** al dar de alta un artículo.
- **Kits de consumibles** reutilizables para eventos (ej. "Catering Básico"), con registro fotográfico del consumo real.
- **Mínimos y máximos** configurables por artículo, con alertas visuales y por correo.
- Autenticación de staff mediante código de acceso compartido.

### 1.4 Alcance — qué NO incluye (fuera de este proyecto)

- Cuentas individuales por miembro del staff con roles distintos (queda documentado como siguiente paso, sección 5).
- Escaneo de código de barras o QR (se usa SKU tecleado; ver sección de riesgos).
- Integración con el sistema de matrícula oficial de la universidad para validar que una matrícula existe de verdad (solo se valida el *formato*, no la existencia).
- Reportes financieros o de costos de reposición.

---

## 2. Descomposición en etapas

El proyecto se dividió en fases con dependencias explícitas: ninguna fase empezó sin que la anterior tuviera un checkpoint verificable, porque cada capa depende de que la anterior exista y funcione (no se puede construir la UI de préstamos sin que la tabla `articulos` ya exista y esté probada).

```
Fase 0 · Modelo de datos
   │  Checkpoint: tablas creadas en Supabase, RLS activo, se puede
   │  insertar y leer un registro de prueba manualmente.
   ▼
Fase 1 · Reglas de negocio (API)
   │  Depende de: Fase 0 (necesita las tablas para escribir consultas reales)
   │  Checkpoint: cada endpoint responde con el código HTTP correcto
   │  ante casos normales, límite e inválidos (ver pruebas en sección 3).
   ▼
Fase 2 · Interfaz de usuario
   │  Depende de: Fase 1 (la UI solo llama a endpoints que ya existen)
   │  Checkpoint: flujo completo ingreso → salida → regreso ejecutado
   │  a mano en el navegador, sin errores en consola.
   ▼
Fase 3 · Despliegue y variables de entorno
   │  Depende de: Fase 2 (no tiene sentido desplegar una UI incompleta)
   │  Checkpoint: la URL pública responde y el login funciona con las
   │  variables de entorno configuradas en Vercel (no locales).
   ▼
Fase 4 · Features de negocio avanzadas
   │  (regex, sets, loops, importador Excel, consumibles, kits, umbrales)
   │  Depende de: Fase 3 (se agregan sobre una base ya desplegada y
   │  verificada, para poder probar cada una en producción real)
   │  Checkpoint: cada feature se compiló localmente (`npm run build`)
   │  ANTES de desplegarse — nunca se subió código sin este checkpoint.
   ▼
Fase 5 · Documentación y entrega
   │  Depende de: Fase 4 (no se documenta lo que aún puede cambiar)
   │  Checkpoint: README con stack, prompts usados y autoevaluación;
   │  este documento de planeación.
```

**Nota sobre un cambio de rumbo real durante el proyecto:** originalmente el despliegue se hizo con un solo comando de "subir archivos" a Vercel (sin Git). Al perder temporalmente la conexión con la herramienta de despliegue, se detectó que ese enfoque no era sostenible — no había forma de reconstruir el estado del proyecto. La decisión correcta, documentada como parte del checkpoint de la Fase 3, fue migrar a un repositorio de GitHub conectado a Vercel para que cada cambio quede versionado y el despliegue sea reproducible.

---

## 3. Lógica algorítmica (pseudocódigo)

En cada bloque se anota explícitamente **qué herramienta o API resuelve ese paso**, porque la lógica de negocio y la llamada técnica están separadas a propósito: el pseudocódigo describe el algoritmo; el comentario entre corchetes documenta la herramienta.

### 3.1 Registrar una salida (préstamo) — flujo principal

```
FUNCION registrarPrestamo(sku, matricula, fechaEstimada):

  SI sku es vacío O matricula es vacío:
    REGRESAR error "faltan campos obligatorios"

  SI matricula NO cumple el patron AL-AAAA-#### (regex):      [Herramienta: expresión regular, tema 1.9]
    REGRESAR error "formato de matricula invalido"

  articulo <- CONSULTAR tabla articulos DONDE sku = sku        [Herramienta: Supabase REST API .select()]

  SI articulo no existe:
    REGRESAR error "no existe ese SKU"

  SI articulo.status != "en_bodega":                          # rama alternativa importante
    REGRESAR error "ya esta prestado o perdido"                # (evita doble-préstamo)

  INSERTAR en tabla prestamos (sku, matricula, fecha=HOY, status="activo")
                                                                 [Herramienta: Supabase .insert()]
  ACTUALIZAR articulo.status <- "prestado"                     [Herramienta: Supabase .update()]

  REGRESAR exito(prestamo)
```

**Caso borde anticipado:** si la actualización del artículo fallara justo después de insertar el préstamo (ej. corte de red), quedaría un préstamo activo sobre un artículo que el sistema aún cree "en bodega". Esto se documenta como riesgo de **falta de atomicidad multi-tabla** en la sección 5; la mitigación real implementada es que ambos pasos comparten la misma conexión y se ejecutan en secuencia inmediata, y cualquier error en el segundo paso se reporta explícitamente al usuario (no se oculta), para que el staff pueda corregir manualmente si ocurre.

### 3.2 Alta masiva con generación automática de SKU (loops)

```
FUNCION registrarAltaMasiva(prefijoSku, nombre, club, cantidad):

  prefijoFinal <- anteponer "SL-" si no lo trae ya              [Herramienta: función normalizarSku()]

  existentes <- CONSULTAR articulos DONDE sku EMPIEZA CON prefijoFinal
  numerosUsados <- []
  PARA CADA articulo EN existentes:                             # tema 1.7 — loop de extracción
    numerosUsados.agregar( ULTIMO_SEGMENTO(articulo.sku) COMO NUMERO )

  siguienteNumero <- MAXIMO(numerosUsados) + 1  (o 1 si esta vacio)

  nuevosArticulos <- []
  PARA i DESDE 0 HASTA cantidad - 1:                            # tema 1.7 — loop principal
    skuGenerado <- prefijoFinal + "-" + RELLENAR_CEROS(siguienteNumero + i, 3)
    nuevosArticulos.agregar({ sku: skuGenerado, nombre, club, status: "en_bodega" })

  INSERTAR TODOS nuevosArticulos EN UNA SOLA LLAMADA             [Herramienta: Supabase .insert(array),
                                                                    inserción en lote en vez de N llamadas]
  REGRESAR nuevosArticulos
```

### 3.3 Detección de posibles duplicados (sets)

```
FUNCION encontrarPosiblesDuplicados(nombreNuevo, club, catalogoExistente):

  setNuevo <- PALABRAS_SIGNIFICATIVAS(normalizar(nombreNuevo))   # tema 1.5 — construir un SET

  candidatos <- FILTRAR catalogoExistente DONDE club coincide

  resultados <- []
  PARA CADA articulo EN candidatos:
    setExistente <- PALABRAS_SIGNIFICATIVAS(normalizar(articulo.nombre))
    interseccion <- TAMAÑO( setNuevo INTERSECCION setExistente )
    union        <- TAMAÑO( setNuevo UNION setExistente )
    similitud <- interseccion / union                            # índice de Jaccard

    SI similitud >= 0.5:
      resultados.agregar({articulo, similitud})

  REGRESAR resultados ORDENADOS por similitud DESCENDENTE
```

### 3.4 Importar y limpiar el Excel existente (lectura de documentos + limpieza de datos)

```
FUNCION importarExcel(archivoSubido):

  filasCrudas <- LEER_HOJA(archivoSubido)                        [Herramienta: librería SheetJS/xlsx,
                                                                    parsea el binario .xlsx a filas JSON]
  skusExistentes <- SET( CONSULTAR articulos.sku )                # tema 1.5 — set para búsqueda O(1)
  clavesVistasEnArchivo <- SET_VACIO()                            # deduplicar dentro del mismo archivo

  limpios <- []
  omitidos <- []

  PARA CADA fila EN filasCrudas:                                  # tema 2.13/2.14 — procesar documento externo
    nombre <- TITULO_CASO( LIMPIAR_ESPACIOS(fila.articulo) )      # tema 3.22 — limpieza de texto
    club   <- TITULO_CASO( LIMPIAR_ESPACIOS(fila.club) )

    SI nombre vacio O club vacio:
      omitidos.agregar("falta articulo o club"); CONTINUAR

    clave <- normalizar(nombre) + "|" + normalizar(club)
    SI clave YA ESTA en clavesVistasEnArchivo:
      omitidos.agregar("duplicado dentro del Excel"); CONTINUAR   # deduplicación con set
    clavesVistasEnArchivo.agregar(clave)

    sku <- fila.sku SI EXISTE, si no GENERAR_SKU(club)
    sku <- normalizarSku(sku)                                     # siempre con prefijo SL-

    SI sku EN skusExistentes:
      omitidos.agregar("SKU ya existe"); CONTINUAR

    limpios.agregar({sku, nombre, club, ...})

  INSERTAR TODOS limpios EN UNA SOLA LLAMADA                       [Herramienta: Supabase .insert(array)]
  REGRESAR {insertados: limpios.cantidad, omitidos}
```

### 3.5 Alerta automática de vencidos y stock bajo (dos sistemas que se hablan solos)

```
# Este bloque corre SOLO, sin intervención humana, disparado por un cron.

TAREA PROGRAMADA diaria a las 8:00 UTC:                            [Herramienta: pg_cron, extension de
                                                                     Postgres dentro de Supabase]
  1. pg_cron ejecuta una llamada HTTP hacia la Edge Function        [Herramienta: pg_net — hace la
     "alertas-vencidos", pasando la anon key como autenticacion.     peticion HTTP desde dentro de la
                                                                      base de datos]
  2. La Edge Function (codigo Deno/TypeScript, corre en el borde
     de la red, no en el navegador):                                [Herramienta: Supabase Edge Functions]

     vencidos <- CONSULTAR prestamos DONDE status="activo"
                 Y fecha_devolucion_estimada < HOY

     SI vencidos esta vacio:
       TERMINAR (no se manda correo)

     armar tabla HTML con los vencidos

     ENVIAR_CORREO(destinatario, asunto, tablaHtml)                  [Herramienta: API de Resend —
                                                                       un servicio EXTERNO de correo,
                                                                       la app le "habla" via HTTP POST]

  3. Resend regresa exito/error; la Edge Function lo registra.
```

Este es el ejemplo más claro del tema **2.15 — "letting computers talk among themselves"**: tres sistemas (Postgres/pg_cron, una Edge Function propia, y la API externa de Resend) se coordinan sin que ninguna persona los dispare manualmente.

### 3.6 Registrar el consumo de un kit en un evento

```
FUNCION registrarEventoKit(kitId, nombreEvento, fecha, fotoUrl):

  items <- CONSULTAR kit_items DONDE kit_id = kitId               [Herramienta: Supabase .select() con JOIN
                                                                     a la tabla articulos]
  SI items esta vacio:
    REGRESAR error "kit sin articulos configurados"

  bajoMinimo <- []
  PARA CADA item EN items:
    actual <- item.articulo.cantidad_actual
    nuevaCantidad <- MAXIMO(0, actual - item.cantidad_requerida)   # nunca queda en negativo

    ACTUALIZAR articulo.cantidad_actual <- nuevaCantidad           [Herramienta: Supabase .update()]

    SI nuevaCantidad < item.articulo.cantidad_minima:              # umbral de restock
      bajoMinimo.agregar({item, nuevaCantidad})

  INSERTAR EN eventos_kit (kitId, nombreEvento, fecha, fotoUrl)     [Herramienta: Supabase Storage para
                                                                      la foto + .insert() para el registro]
  REGRESAR {exito: true, bajoMinimo}                                # el staff ve al instante que comprar
```

---

## 4. Selección y justificación de herramientas

No se listan solo por nombre — cada una se seleccionó comparándola contra al menos una alternativa real, con la función técnica exacta que cumple dentro de la arquitectura.

| Herramienta | Función específica en la app | Alternativa considerada | Por qué se eligió esta y no la otra |
|---|---|---|---|
| **Next.js (App Router)** | Sirve páginas Y endpoints de API (`/api/*`) en un solo proyecto | Un backend separado en Express + un frontend separado en React | Un solo repo, un solo despliegue, sin configurar CORS entre dos servidores — menos piezas móviles para un proyecto que un solo staff mantendrá |
| **Vercel** | Hosting con despliegue automático por cada `git push` | Netlify | Ambos son comparables; se eligió Vercel porque Next.js es su propio framework (soporte de primera mano para Edge Runtime y variables de entorno por ambiente) |
| **Supabase (Postgres)** | Base de datos relacional + Storage de fotos + Edge Functions + cron, todo en un solo proveedor | Firebase (NoSQL) | Los datos son intrínsecamente relacionales (un préstamo referencia un artículo, una devolución referencia un préstamo); forzar eso a documentos NoSQL habría requerido duplicar datos manualmente. Postgres además da RLS (seguridad a nivel de fila) que Firestore no ofrece de forma nativa igual |
| **Row Level Security (RLS)** | Controla qué puede hacer cada rol sobre cada tabla, a nivel de base de datos | Confiar solo en la lógica de la API | RLS es una segunda capa de defensa: aunque alguien llamara a Supabase saltándose la API, las políticas siguen aplicando |
| **SheetJS (`xlsx`)** | Parsear el archivo Excel real de Student Life dentro del servidor | Pedirle a Student Life que exporte a CSV manualmente | La bodega ya tiene el archivo en `.xlsx`; obligarlos a convertir formato es fricción evitable |
| **Resend** | Enviar el correo de alertas automáticas | Nodemailer + SMTP propio | Resend da una API HTTP simple sin necesitar gestionar credenciales SMTP ni exponer un servidor de correo; para un staff no técnico, una sola `API key` es más manejable |
| **lucide-react** | Iconos consistentes en la nueva interfaz | Font Awesome | Lucide es *tree-shakeable* (solo se descargan los iconos usados, no la librería completa) y usa SVG, más liviano para el sitio |
| **Tailwind CSS** | Sistema de diseño (colores, espaciados) centralizado en un archivo | CSS escrito a mano por página | Cambiar toda la paleta de la app (como se hizo en la sesión de rediseño, de tema oscuro a blanco/azul) tomó editar **un solo archivo** de configuración, no cada página |

### Análisis crítico de complejidad y alternativas descartadas

- **SKU tecleado vs. código QR:** se consideró usar códigos QR desde el inicio. Se descartó para el alcance actual porque agregaría una dependencia de hardware (lector o cámara) sin la cual el staff no podría operar; se documenta como mejora futura de bajo riesgo de implementar después, no como parte del MVP.
- **Autenticación compartida vs. Supabase Auth:** un código único para todo el staff es más simple de operar, pero tiene un costo real de trazabilidad (no se sabe *quién* del staff hizo cada movimiento). Se decidió aceptar ese costo para el tamaño actual del equipo, documentándolo explícitamente como limitación conocida (no oculta) en la sección de riesgos.
- **Generación de SKU en alta masiva — límite de eficiencia identificado:** el algoritmo de la sección 3.2 recorre TODOS los artículos con un prefijo dado para calcular el siguiente número (`O(n)` sobre ese subconjunto). Para el volumen actual de la bodega (cientos de artículos) esto es instantáneo. Si el catálogo creciera a decenas de miles de unidades por prefijo, ese recorrido se volvería más lento; la mitigación identificada — no implementada aún porque no es necesaria al tamaño actual — sería reemplazarlo por una tabla de contadores (`sku_counters`) con una operación atómica `UPDATE ... RETURNING`, evitando el recorrido completo.

---

## 5. Criterios de éxito

Métricas observables, no opiniones — cada una se puede verificar entrando a la app o a los logs, sin depender de que alguien "sienta" que funciona:

| # | Criterio | Cómo se mide | Umbral de éxito |
|---|---|---|---|
| 1 | El staff puede completar el ciclo alta → salida → regreso sin ayuda técnica | Prueba guiada con una persona de Student Life que no participó en el desarrollo | Completa las 3 acciones en menos de 5 minutos sin preguntar "¿y ahora qué?" |
| 2 | Ningún artículo puede prestarse dos veces a la vez | Intentar prestar un SKU ya prestado | La API regresa error 409 explícito, nunca un préstamo duplicado silencioso |
| 3 | Los SKUs duplicados o repetidos se detectan | Registrar dos artículos con nombres parecidos en el mismo club | Aparece el aviso de "posible duplicado" con el porcentaje de similitud |
| 4 | El correo de alertas llega quintanas sin intervención | Forzar un préstamo vencido y un consumible bajo mínimo, esperar la ejecución del cron | Llega un correo con ambos casos listados, sin que nadie lo dispare a mano |
| 5 | El Excel real de Student Life se importa sin captura manual | Subir el archivo real de la bodega | Al menos el 90% de las filas válidas quedan insertadas; las omitidas se listan con motivo explícito |
| 6 | La app sigue funcionando tras el rediseño visual | Repetir las pruebas 1–5 después del cambio de tema oscuro → blanco/azul | Los 5 criterios anteriores se mantienen sin regresiones |
| 7 | No hay credenciales sensibles expuestas en el repositorio público | Revisar el código subido a GitHub | `SUPABASE_ANON_KEY`, `STAFF_ACCESS_CODE` y `SESSION_SECRET` no aparecen en ningún archivo versionado, solo en variables de entorno de Vercel |

---

## Riesgos identificados y plan de mitigación (transparencia técnica)

| Riesgo | Probabilidad | Impacto | Mitigación tomada |
|---|---|---|---|
| Vulnerabilidad crítica de Next.js en el middleware (CVE-2025-29927), justo la pieza de la que depende el login | Detectada durante el desarrollo | Alto — bypass total de autenticación | Se actualizó de Next.js 14.2.5 a 15.5.9 (versión parchada) **antes** de desplegar a producción, no después |
| Falta de atomicidad al actualizar dos tablas relacionadas (préstamo + artículo) en la misma operación | Baja | Medio — estado inconsistente si falla a la mitad | Cualquier error se reporta explícitamente al usuario en vez de fallar en silencio; el staff puede corregir manualmente en el catálogo |
| Un código de acceso compartido no distingue quién del staff hizo cada acción | Constante (limitación de diseño, no un bug) | Bajo–medio | Documentado abiertamente como decisión consciente; próximo paso sugerido es Supabase Auth con cuentas individuales si el equipo crece |
| Plan gratuito de Resend solo permite enviar al correo con el que te registraste, sin dominio verificado | Alta al inicio | Bajo (es una limitación de la etapa de prueba, no de producción) | Documentado en el README con el paso exacto para verificar un dominio propio cuando Student Life lo necesite |
| El SKU se teclea a mano, con margen de error humano | Media | Bajo–medio | Mitigado con regex de formato + autocompletado del prefijo `SL-`; posible mejora futura con QR |
