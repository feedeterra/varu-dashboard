/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServiceClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/Card'
import { formatARS } from '@/lib/utils'
import { HomeCharts } from './HomeCharts'

async function getHomeData() {
  const supabase = await createServiceClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
  const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]

  const [
    { data: ventasHoy },
    { data: ventasMes },
    { data: ventasMesAnterior },
    { data: sinStock },
    { data: ultimasVentas },
    { data: movimientos },
    { data: clientes },
    { data: ventasGrafico },
    { data: stockNegativo },
  ] = await Promise.all([
    supabase.from('ventas').select('precio_venta, precio_costo, cantidad').gte('fecha', todayStr).gt('cantidad', 0),
    supabase.from('ventas').select('precio_venta, precio_costo, cantidad, id_cliente').gte('fecha', firstOfMonth).gt('cantidad', 0),
    supabase.from('ventas').select('precio_venta, cantidad').gte('fecha', firstOfLastMonth).lte('fecha', lastOfLastMonth).gt('cantidad', 0),
    supabase.from('articulos').select('id_articulo').eq('activo', 1).gt('stock_minimo', 0).lte('stock_disponible', 0),
    supabase
      .from('ventas')
      .select('id_principal, id_movimiento, fecha, cantidad, precio_venta, forma_pago, clientes(razon_social), articulos(nombre)')
      .gte('fecha', todayStr)
      .gt('cantidad', 0)
      .order('id_principal', { ascending: false })
      .limit(20),
    supabase.from('movimientos_cc').select('id_cliente, id_tipo_movimiento, importe_unitario, importe_abonado, cantidad').eq('activo', 1),
    supabase.from('clientes').select('id_cliente, razon_social, celular').eq('activo', 1),
    supabase
      .from('ventas')
      .select('fecha, precio_venta, cantidad')
      .gte('fecha', firstOfMonth)
      .gt('cantidad', 0)
      .order('fecha'),
    supabase
      .from('articulos')
      .select('id_articulo, nombre, stock_disponible')
      .eq('activo', 1)
      .lt('stock_disponible', 0),
  ])

  const facturadoHoy = (ventasHoy ?? []).reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0)
  const facturadoMes = (ventasMes ?? []).reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0)
  const facturadoMesAnterior = (ventasMesAnterior ?? []).reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0)
  const gananciaMes = (ventasMes ?? []).reduce((acc, v) => acc + (v.precio_venta - v.precio_costo) * v.cantidad, 0)
  const clientesUnicos = new Set((ventasMes ?? []).map(v => v.id_cliente)).size
  const sinStockCount = sinStock?.length ?? 0

  // Variación mes vs mes anterior
  const variacionMes = facturadoMesAnterior > 0
    ? ((facturadoMes - facturadoMesAnterior) / facturadoMesAnterior * 100).toFixed(1)
    : null

  // Top 5 deudores con saldo > 0, ordenados por saldo desc
  const saldoMap = new Map<number, number>()
  for (const m of movimientos ?? []) {
    const prev = saldoMap.get(m.id_cliente) ?? 0
    if (m.id_tipo_movimiento === 2) {
      saldoMap.set(m.id_cliente, prev + (m.importe_unitario ?? 0) * (m.cantidad ?? 1))
    } else if (m.id_tipo_movimiento === 3) {
      saldoMap.set(m.id_cliente, prev - (m.importe_abonado ?? 0))
    }
  }
  const clienteMap = new Map((clientes ?? []).map(c => [c.id_cliente, c]))
  const topDeudores = Array.from(saldoMap.entries())
    .filter(([, saldo]) => saldo > 500)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, saldo]) => ({ ...clienteMap.get(id)!, saldo }))
    .filter(d => d.razon_social)

  // Facturación por día del mes actual
  const porDiaMap = new Map<string, number>()
  for (const v of ventasGrafico ?? []) {
    const dia = v.fecha.split('T')[0]
    porDiaMap.set(dia, (porDiaMap.get(dia) ?? 0) + v.precio_venta * v.cantidad)
  }
  const porDia = Array.from(porDiaMap.entries())
    .map(([fecha, total]) => ({ fecha, total }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Deuda total de toda la cartera
  const deudaTotal = Array.from(saldoMap.values()).filter(s => s > 0).reduce((acc, s) => acc + s, 0)

  return {
    facturadoHoy,
    facturadoMes,
    facturadoMesAnterior,
    variacionMes,
    gananciaMes,
    clientesUnicos,
    sinStockCount,
    ultimasVentas: ultimasVentas ?? [],
    topDeudores,
    porDia,
    deudaTotal,
    stockNegativo: stockNegativo ?? [],
  }
}

export default async function HomePage() {
  const data = await getHomeData()

  const mes = new Date().toLocaleDateString('es-AR', { month: 'long' })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Resumen del día</h1>
        <p className="text-[#444] text-sm mt-0.5">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Facturado hoy"
          value={formatARS(data.facturadoHoy)}
          color="blue"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label={`Facturado ${mes}`}
          value={formatARS(data.facturadoMes)}
          color="default"
          badge={data.variacionMes ? { value: `${data.variacionMes}%`, positive: parseFloat(data.variacionMes) >= 0 } : null}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
            </svg>
          }
        />
        <StatCard
          label="Ganancia bruta del mes"
          value={formatARS(data.gananciaMes)}
          color="green"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
            </svg>
          }
        />
        <StatCard
          label="Deuda total cartera"
          value={formatARS(data.deudaTotal)}
          sub="cuenta corriente"
          color={data.deudaTotal > 0 ? 'red' : 'default'}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
      </div>

      {/* Alerta stock negativo */}
      {data.stockNegativo.length > 0 && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mt-1.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">
              {data.stockNegativo.length} producto{data.stockNegativo.length > 1 ? 's' : ''} con stock negativo
            </p>
            <p className="text-xs text-red-400/60 mt-0.5">
              {data.stockNegativo.map((a: any) => a.nombre).join(' · ')}
            </p>
            <a href="/stock" className="text-xs text-red-400 underline mt-1 inline-block">Ver en Stock →</a>
          </div>
        </div>
      )}

      {/* Gráfico de facturación del mes */}
      <HomeCharts porDia={data.porDia} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Últimas ventas del día */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Últimas ventas del día</h2>
            <span className="text-xs text-[#444]">{data.ultimasVentas.length} registros</span>
          </div>
          {data.ultimasVentas.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#444] text-sm">Sin ventas registradas hoy</div>
          ) : (
            <div className="divide-y divide-[#1f1f1f]">
              {data.ultimasVentas.slice(0, 10).map((v: any) => (
                <div key={v.id_principal} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#1f1f1f] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-[#555] shrink-0">
                      {(v.clientes?.razon_social ?? '?').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{v.clientes?.razon_social ?? '—'}</p>
                      <p className="text-xs text-[#555] truncate">{v.articulos?.nombre ?? '—'} · x{v.cantidad}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-white font-semibold">{formatARS(v.precio_venta * v.cantidad)}</p>
                    <p className="text-[10px] text-[#444] uppercase">{v.forma_pago}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top deudores */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Deudas pendientes</h2>
            <a href="/deudores" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">Ver todos →</a>
          </div>
          {data.topDeudores.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#444] text-sm">Sin deudas pendientes</div>
          ) : (
            <div className="divide-y divide-[#1f1f1f]">
              {data.topDeudores.map((d: any) => (
                <div key={d.id_cliente} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#1f1f1f] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-bold text-red-400 shrink-0">
                      {d.razon_social.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{d.razon_social}</p>
                      {d.celular && (
                        <a
                          href={`https://wa.me/54${d.celular.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-500 hover:text-green-400"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-red-400 font-semibold shrink-0">{formatARS(d.saldo)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
