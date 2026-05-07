# Varu Dashboard — Contexto del proyecto

## El negocio
Casa de electrodomésticos y bicicletas en Chivilcoy, Buenos Aires. Ver contexto completo en `/Users/federicoterrazas/sistema varu/CLAUDE.md`.

## Stack
- **Next.js 14** App Router (Server Components + Client Components)
- **Tailwind CSS** — tema oscuro, colores: bg `#111`, cards `#1a1a1a`, bordes `#2a2a2a`
- **Recharts** — gráficos de barras con Cell para coloreo individual
- **Supabase** — fuente de datos (espejo de MySQL del cliente)
- **Deploy:** Vercel

## Estructura
```
src/app/(dashboard)/
  page.tsx          — Inicio: métricas, chart mensual, remitos recientes, tareas, deudores
  ventas/page.tsx   — Ventas: toggle gráficos/remitos, métricas período
  ventas/VentasCharts.tsx  — 2 col: chart diario + top clientes | top productos
  ventas/VentasList.tsx    — Remitos expandibles con desglose de items
  clientes/page.tsx        — Clientes: ranking ciudades, lista con stats
  clientes/ClientesList.tsx — Tabla sorteable por columna, filtro por ciudad
  clientes/ClienteModal.tsx — Modal detalle de cliente
  stock/page.tsx           — Stock: paneles críticos + lista completa
  stock/StockList.tsx      — Lista con estado: ok/bajo/sin_stock/negativo
  deudores/page.tsx        — Deudores con saldo CC

src/components/
  layout/Sidebar.tsx       — Sidebar con SVG icons, mobile bottom nav
  ui/Card.tsx              — StatCard con icon y badge props

src/lib/
  supabase/server.ts       — createServiceClient() con service role key
  utils.ts                 — formatARS, formatDate, formatDateShort
```

## Supabase — tablas
- `clientes` — id_cliente, razon_social, celular, localidad, activo
- `articulos` — id_articulo, nombre, precio_costo, porcentaje_ganancia, iva, stock_disponible, stock_minimo, activo
- `ventas` — id_principal (PK línea), id_movimiento (agrupa remito), id_cliente, id_articulo, fecha, cantidad, precio_venta, precio_costo, forma_pago
- `movimientos_cc` — id_movimiento, id_cliente, fecha, id_tipo_movimiento, importe_unitario, importe_abonado, activo
- `sync_log` — registro de cada sync

## Convenciones clave
- **Agrupar ventas por `id_movimiento`** para reconstruir remitos (un movimiento = una venta con N líneas)
- **`id_principal`** es el PK real de cada línea de venta
- **Saldo CC** = `SUM(importe_unitario - importe_abonado)` por cliente
- **Siempre usar `createServiceClient()`** (service role, bypasa RLS)
- **Server Components** para fetching, **Client Components** solo para interactividad
- No pasar event handlers desde Server Components a Client Components

## Diseño
- Fondo general: `#111111`
- Cards: `bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl`
- Texto primario: `text-white`, secundario: `text-[#555]`, terciario: `text-[#444]`
- Azul acento: `blue-600` / `blue-400`
- Verde ganancia: `emerald-400`
- Rojo deuda: `red-400`
- Amarillo sin costo: `yellow-500`
