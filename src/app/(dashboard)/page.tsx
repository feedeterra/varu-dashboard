/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServiceClient } from '@/lib/supabase/server'
import { formatARS } from '@/lib/utils'
import { HomeCharts } from './HomeCharts'

async function getHomeData() {
  const supabase = await createServiceClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
  const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
  const since45 = new Date(today); since45.setDate(today.getDate() - 45)
  const since45Str = since45.toISOString().split('T')[0]
  const since90Str = (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().split('T')[0] })()

  const [
    { data: ventasHoy },
    { data: ventasMes },
    { data: ventasMesAnterior },
    { data: ultimasVentas },
    { data: movimientos },
    { data: clientes },
    { data: ventasGrafico },
    { data: stockNegativo },
    { data: articulos },
    { data: ventas90 },
    { data: ventasRecientes },
  ] = await Promise.all([
    supabase.from('ventas').select('precio_venta, precio_costo, cantidad').gte('fecha', todayStr).gt('cantidad', 0),
    supabase.from('ventas').select('precio_venta, precio_costo, cantidad, id_cliente').gte('fecha', firstOfMonth).gt('cantidad', 0),
    supabase.from('ventas').select('precio_venta, cantidad').gte('fecha', firstOfLastMonth).lte('fecha', lastOfLastMonth).gt('cantidad', 0),
    supabase.from('ventas').select('id_principal, id_movimiento, fecha, cantidad, precio_venta, forma_pago, clientes(razon_social), articulos(nombre)').gte('fecha', todayStr).gt('cantidad', 0).order('id_movimiento', { ascending: false }).limit(100),
    supabase.from('movimientos_cc').select('id_cliente, id_tipo_movimiento, importe_unitario, importe_abonado, cantidad').eq('activo', 1),
    supabase.from('clientes').select('id_cliente, razon_social, celular').eq('activo', 1),
    supabase.from('ventas').select('fecha, precio_venta, cantidad').gte('fecha', firstOfMonth).gt('cantidad', 0).order('fecha'),
    supabase.from('articulos').select('id_articulo, nombre, stock_disponible').eq('activo', 1).lt('stock_disponible', 0),
    supabase.from('articulos').select('id_articulo, stock_disponible, stock_minimo, precio_costo').eq('activo', 1),
    supabase.from('ventas').select('id_articulo, cantidad').gte('fecha', since90Str).gt('cantidad', 0),
    supabase.from('ventas').select('id_cliente, fecha').gte('fecha', since45Str).gt('cantidad', 0),
  ])

  const facturadoHoy = (ventasHoy ?? []).reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0)
  const facturadoMes = (ventasMes ?? []).reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0)
  const facturadoMesAnterior = (ventasMesAnterior ?? []).reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0)
  const gananciaMes = (ventasMes ?? []).reduce((acc, v) => acc + (v.precio_venta - v.precio_costo) * v.cantidad, 0)
  const clientesUnicos = new Set((ventasMes ?? []).map(v => v.id_cliente)).size

  const variacionMes = facturadoMesAnterior > 0
    ? ((facturadoMes - facturadoMesAnterior) / facturadoMesAnterior * 100).toFixed(1)
    : null

  // Saldos CC
  const saldoMap = new Map<number, number>()
  for (const m of movimientos ?? []) {
    const prev = saldoMap.get(m.id_cliente) ?? 0
    if (m.id_tipo_movimiento === 2) saldoMap.set(m.id_cliente, prev + (m.importe_unitario ?? 0) * (m.cantidad ?? 1))
    else if (m.id_tipo_movimiento === 3) saldoMap.set(m.id_cliente, prev - (m.importe_abonado ?? 0))
  }
  const deudaTotal = Array.from(saldoMap.values()).filter(s => s > 0).reduce((acc, s) => acc + s, 0)

  // Agrupar remitos del día por id_movimiento
  const remitoHoyMap = new Map<number, { cliente: string; total: number; items: string[]; forma_pago: string }>()
  for (const v of ultimasVentas ?? []) {
    const cliente = (v as any).clientes?.razon_social ?? '—'
    const nombre = (v as any).articulos?.nombre ?? '—'
    const prev = remitoHoyMap.get(v.id_movimiento)
    if (!prev) {
      remitoHoyMap.set(v.id_movimiento, { cliente, total: v.precio_venta * v.cantidad, items: [`${nombre} x${v.cantidad}`], forma_pago: v.forma_pago?.toString() ?? '' })
    } else {
      prev.total += v.precio_venta * v.cantidad
      prev.items.push(`${nombre} x${v.cantidad}`)
    }
  }
  const remitosHoy = Array.from(remitoHoyMap.values())

  const clienteMap = new Map((clientes ?? []).map(c => [c.id_cliente, c]))
  const topDeudores = Array.from(saldoMap.entries())
    .filter(([, saldo]) => saldo > 500)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, saldo]) => ({ ...clienteMap.get(id)!, saldo }))
    .filter(d => d.razon_social)

  // Gráfico por día
  const porDiaMap = new Map<string, number>()
  for (const v of ventasGrafico ?? []) {
    const dia = v.fecha.split('T')[0]
    porDiaMap.set(dia, (porDiaMap.get(dia) ?? 0) + v.precio_venta * v.cantidad)
  }
  const porDia = Array.from(porDiaMap.entries()).map(([fecha, total]) => ({ fecha, total })).sort((a, b) => a.fecha.localeCompare(b.fecha))

  // --- TAREAS ACCIONABLES ---
  const tareas: { tipo: 'error' | 'warning' | 'info'; titulo: string; descripcion: string; href: string }[] = []

  // 1. Stock negativo
  if ((stockNegativo ?? []).length > 0) {
    tareas.push({ tipo: 'error', titulo: `${stockNegativo!.length} productos con stock negativo`, descripcion: 'Diferencias de inventario — revisar ajustes', href: '/stock' })
  }

  // 2. Productos próximos a agotarse (< 10 días)
  const vendidoMap = new Map<number, number>()
  for (const v of ventas90 ?? []) vendidoMap.set(v.id_articulo, (vendidoMap.get(v.id_articulo) ?? 0) + v.cantidad)
  const proximosAgotar = (articulos ?? []).filter(a => {
    if (a.stock_disponible <= 0) return false
    const vendido = vendidoMap.get(a.id_articulo) ?? 0
    if (vendido === 0) return false
    const dias = Math.round(a.stock_disponible / (vendido / 90))
    return dias < 10
  })
  if (proximosAgotar.length > 0) {
    tareas.push({ tipo: 'error', titulo: `${proximosAgotar.length} productos se agotan en menos de 10 días`, descripcion: 'Revisar reposición urgente', href: '/stock' })
  }

  // 3. Capital inmovilizado
  const capitalInmovilizado = (articulos ?? []).filter(a => a.stock_disponible > 30 && !(vendidoMap.get(a.id_articulo) ?? 0) && a.precio_costo > 0)
  const totalInmovilizado = capitalInmovilizado.reduce((acc, a) => acc + a.stock_disponible * a.precio_costo, 0)
  if (capitalInmovilizado.length > 0) {
    tareas.push({ tipo: 'warning', titulo: `${formatARS(totalInmovilizado)} de capital inmovilizado`, descripcion: `${capitalInmovilizado.length} productos sin movimiento en 90 días`, href: '/stock' })
  }

  // 4. Clientes inactivos +45 días que antes compraban
  const clientesActivos45 = new Set((ventasRecientes ?? []).map(v => v.id_cliente))
  const clientesConHistorial = new Set((ventasMes ?? []).map(v => v.id_cliente))
  // Clientes que compraron el mes pasado pero no en los últimos 45 días
  const clientesInactivos = (clientes ?? []).filter(c => clientesConHistorial.has(c.id_cliente) && !clientesActivos45.has(c.id_cliente)).length
  if (clientesInactivos > 0) {
    tareas.push({ tipo: 'warning', titulo: `${clientesInactivos} clientes inactivos hace más de 45 días`, descripcion: 'Compraban regularmente — contactar', href: '/clientes' })
  }

  // 5. Deudores sin movimiento con saldo alto
  const deudoresAltos = Array.from(saldoMap.entries()).filter(([, s]) => s > 50000).length
  if (deudoresAltos > 0) {
    tareas.push({ tipo: 'warning', titulo: `${deudoresAltos} clientes con deuda mayor a $50.000`, descripcion: 'Revisar cuenta corriente', href: '/deudores' })
  }

  return {
    facturadoHoy, facturadoMes, facturadoMesAnterior, variacionMes,
    gananciaMes, clientesUnicos, deudaTotal,
    remitosHoy,
    topDeudores, porDia, tareas,
    stockNegativoCount: (stockNegativo ?? []).length,
  }
}

// Icono por tipo de tarea
function TareaIcon({ tipo }: { tipo: 'error' | 'warning' | 'info' }) {
  if (tipo === 'error') return (
    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
  )
  if (tipo === 'warning') return (
    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
  )
  return (
    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </div>
  )
}

export default async function HomePage() {
  const data = await getHomeData()
  const mes = new Date().toLocaleDateString('es-AR', { month: 'long' })
  const margenMes = data.facturadoMes > 0 && data.gananciaMes > 0 ? Math.round((data.gananciaMes / data.facturadoMes) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Resumen del negocio</h1>
          <p className="text-[#444] text-sm mt-0.5">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {data.tareas.length > 0 && (
          <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full font-medium">
            {data.tareas.length} tareas pendientes
          </span>
        )}
      </div>

      {/* Layout principal: métricas + tareas */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Columna izquierda: métricas (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stat cards 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            {/* Facturado hoy */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-600/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-blue-400/70 uppercase tracking-wider">Facturado hoy</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-white">{formatARS(data.facturadoHoy)}</p>
              <p className="text-xs text-blue-400/50 mt-1">{data.remitosHoy.length} remitos hoy</p>
            </div>

            {/* Facturado mes */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#444] uppercase tracking-wider">Facturado {mes}</p>
                {data.variacionMes && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${parseFloat(data.variacionMes) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {parseFloat(data.variacionMes) >= 0 ? '+' : ''}{data.variacionMes}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-white">{formatARS(data.facturadoMes)}</p>
              <p className="text-xs text-[#444] mt-1">vs {formatARS(data.facturadoMesAnterior)} mes anterior</p>
            </div>

            {/* Ganancia + margen */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#444] uppercase tracking-wider">Ganancia bruta</p>
                {margenMes > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                    {margenMes}% margen
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-emerald-400">{formatARS(data.gananciaMes)}</p>
              <p className="text-xs text-[#444] mt-1">{data.clientesUnicos} clientes activos este mes</p>
            </div>

            {/* Deuda total */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#444] uppercase tracking-wider">Deuda total cartera</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-red-400">{formatARS(data.deudaTotal)}</p>
              <a href="/deudores" className="text-xs text-[#444] hover:text-blue-400 mt-1 inline-block transition-colors">Ver deudores →</a>
            </div>
          </div>

          {/* Gráfico */}
          <HomeCharts porDia={data.porDia} />

          {/* Remitos del día */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Remitos del día</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#444]">{data.remitosHoy.length} remitos</span>
                <a href="/ventas?vista=remitos" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">Ver todos →</a>
              </div>
            </div>
            {data.remitosHoy.length === 0 ? (
              <div className="px-5 py-10 text-center text-[#444] text-sm">Sin ventas registradas hoy</div>
            ) : (
              <div className="divide-y divide-[#1f1f1f]">
                {data.remitosHoy.slice(0, 8).map((r: any, i: number) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#1f1f1f] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-[#555] shrink-0">
                        {r.cliente.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{r.cliente}</p>
                        <p className="text-xs text-[#555] truncate">{r.items.slice(0, 2).join(' · ')}{r.items.length > 2 ? ` +${r.items.length - 2} más` : ''}</p>
                      </div>
                    </div>
                    <p className="text-sm text-white font-semibold shrink-0">{formatARS(r.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: tareas + deudores (1/3) */}
        <div className="space-y-4">

          {/* Panel tareas */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#222]">
              <h2 className="text-sm font-semibold text-white">Tareas pendientes</h2>
              <p className="text-xs text-[#444] mt-0.5">Requieren atención</p>
            </div>
            {data.tareas.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-emerald-400 text-sm font-medium">Todo en orden</p>
                <p className="text-xs text-[#444] mt-1">Sin alertas activas</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1e1e1e]">
                {data.tareas.map((t, i) => (
                  <a key={i} href={t.href} className="flex items-start gap-3 px-5 py-4 hover:bg-[#1f1f1f] transition-colors block">
                    <TareaIcon tipo={t.tipo} />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium leading-snug ${t.tipo === 'error' ? 'text-red-300' : t.tipo === 'warning' ? 'text-yellow-300' : 'text-blue-300'}`}>
                        {t.titulo}
                      </p>
                      <p className="text-xs text-[#444] mt-0.5">{t.descripcion}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Top deudores */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Mayores deudas</h2>
              <a href="/deudores" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">Ver todos →</a>
            </div>
            {data.topDeudores.length === 0 ? (
              <div className="px-5 py-8 text-center text-[#444] text-sm">Sin deudas pendientes</div>
            ) : (
              <div className="divide-y divide-[#1f1f1f]">
                {data.topDeudores.map((d: any) => (
                  <div key={d.id_cliente} className="px-5 py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-bold text-red-400 shrink-0">
                        {d.razon_social.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white font-medium truncate">{d.razon_social}</p>
                        {d.celular && (
                          <a href={`https://wa.me/54${d.celular.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-500 hover:text-green-400">
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-red-400 font-semibold shrink-0">{formatARS(d.saldo)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
