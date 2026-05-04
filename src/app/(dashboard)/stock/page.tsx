import { createServiceClient } from '@/lib/supabase/server'
import { StockList } from './StockList'
import { formatARS } from '@/lib/utils'

const DIAS_90 = 90

export default async function StockPage() {
  const supabase = await createServiceClient()

  const since90 = new Date()
  since90.setDate(since90.getDate() - DIAS_90)
  const since90Str = since90.toISOString().split('T')[0]

  const [{ data: articulos }, { data: ventas90 }] = await Promise.all([
    supabase
      .from('articulos')
      .select('id_articulo, nombre, stock_disponible, stock_minimo, precio_costo, porcentaje_ganancia')
      .eq('activo', 1)
      .order('stock_disponible', { ascending: true }),
    supabase
      .from('ventas')
      .select('id_articulo, cantidad')
      .gte('fecha', since90Str)
      .gt('cantidad', 0),
  ])

  // Unidades vendidas por artículo en 90d
  const vendidoMap = new Map<number, number>()
  for (const v of ventas90 ?? []) {
    vendidoMap.set(v.id_articulo, (vendidoMap.get(v.id_articulo) ?? 0) + v.cantidad)
  }

  const items = (articulos ?? []).map(a => {
    const vendido90d = vendidoMap.get(a.id_articulo) ?? 0
    const xDia = vendido90d / DIAS_90
    const diasRestantes = xDia > 0 && a.stock_disponible > 0
      ? Math.round(a.stock_disponible / xDia)
      : null

    let estado: 'sin_stock' | 'bajo' | 'ok' | 'negativo'
    if (a.stock_disponible < 0) estado = 'negativo'
    else if (a.stock_disponible === 0) estado = 'sin_stock'
    else if (a.stock_minimo > 0 && a.stock_disponible <= a.stock_minimo) estado = 'bajo'
    else estado = 'ok'

    return { ...a, vendido90d, xDia, diasRestantes, estado }
  })

  // Próximos a agotar: tienen ventas, stock > 0, y se agotan en < 21 días
  const proximosAgotar = items
    .filter(a => a.diasRestantes !== null && a.diasRestantes < 21 && a.stock_disponible > 0)
    .sort((a, b) => (a.diasRestantes ?? 999) - (b.diasRestantes ?? 999))
    .slice(0, 20)

  // Stock negativo — ordenado por mayor diferencia, máximo 10 en el panel
  const stockNegativo = items
    .filter(a => a.estado === 'negativo')
    .sort((a, b) => a.stock_disponible - b.stock_disponible)
    .slice(0, 10)

  // Capital inmovilizado: stock > 30, 0 ventas en 90d, precio_costo > 0
  const capitalInmovilizado = items
    .filter(a => a.stock_disponible > 30 && a.vendido90d === 0 && a.precio_costo > 0)
    .map(a => ({ ...a, valorStock: a.stock_disponible * a.precio_costo }))
    .sort((a, b) => b.valorStock - a.valorStock)

  const totalInmovilizado = capitalInmovilizado.reduce((acc, a) => acc + a.valorStock, 0)

  const sinStock = items.filter(a => a.estado === 'sin_stock').length
  const bajo = items.filter(a => a.estado === 'bajo').length
  const ok = items.filter(a => a.estado === 'ok').length
  const negativo = items.filter(a => a.estado === 'negativo').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Stock</h1>
        <p className="text-[#444] text-sm mt-0.5">{items.length} productos activos</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {negativo > 0 && (
          <div className="bg-[#1a1a1a] border border-red-500/40 rounded-xl p-4 text-center col-span-2 lg:col-span-1">
            <p className="text-2xl font-bold text-red-400">{negativo}</p>
            <p className="text-xs text-red-400/60 mt-1 uppercase tracking-wider">Stock negativo</p>
          </div>
        )}
        <div className="bg-[#1a1a1a] border border-red-900/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{sinStock}</p>
          <p className="text-xs text-[#444] mt-1 uppercase tracking-wider">Sin stock</p>
        </div>
        <div className="bg-[#1a1a1a] border border-yellow-900/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{bajo}</p>
          <p className="text-xs text-[#444] mt-1 uppercase tracking-wider">Bajo mínimo</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{ok}</p>
          <p className="text-xs text-[#444] mt-1 uppercase tracking-wider">OK</p>
        </div>
      </div>

      {/* Stock negativo */}
      {stockNegativo.length > 0 && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-red-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-semibold text-red-400">Stock negativo — {negativo} productos</h2>
            </div>
            <span className="text-xs text-red-400/50">Mostrando los 10 con mayor diferencia</span>
          </div>
          <div className="divide-y divide-red-500/10">
            {stockNegativo.map(a => (
              <div key={a.id_articulo} className="px-5 py-3 flex items-center justify-between">
                <span className="text-sm text-white">{a.nombre}</span>
                <span className="text-sm font-bold text-red-400">{a.stock_disponible}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximos a agotar */}
      {proximosAgotar.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222]">
            <h2 className="text-sm font-semibold text-white">Próximos a agotar</h2>
            <p className="text-xs text-[#444] mt-0.5">Basado en ritmo de venta últimos 90 días</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="px-5 py-3 text-left text-xs text-[#444] font-medium uppercase tracking-wider">Producto</th>
                  <th className="px-5 py-3 text-right text-xs text-[#444] font-medium uppercase tracking-wider">Stock</th>
                  <th className="px-5 py-3 text-right text-xs text-[#444] font-medium uppercase tracking-wider">Uds/día</th>
                  <th className="px-5 py-3 text-right text-xs text-[#444] font-medium uppercase tracking-wider">Días restantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {proximosAgotar.map(a => {
                  const dias = a.diasRestantes ?? 0
                  const color = dias <= 7 ? 'text-red-400' : dias <= 14 ? 'text-yellow-400' : 'text-[#aaa]'
                  return (
                    <tr key={a.id_articulo} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-5 py-3 text-white">{a.nombre}</td>
                      <td className="px-5 py-3 text-right text-[#aaa]">{a.stock_disponible}</td>
                      <td className="px-5 py-3 text-right text-[#555] text-xs">{a.xDia.toFixed(2)}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${color}`}>{dias}d</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Capital inmovilizado */}
      {capitalInmovilizado.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Capital inmovilizado</h2>
              <p className="text-xs text-[#444] mt-0.5">+30 unidades sin ventas en 90 días</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-yellow-400">{formatARS(totalInmovilizado)}</p>
              <p className="text-xs text-[#444]">total parado</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="px-5 py-3 text-left text-xs text-[#444] font-medium uppercase tracking-wider">Producto</th>
                  <th className="px-5 py-3 text-right text-xs text-[#444] font-medium uppercase tracking-wider">Stock</th>
                  <th className="px-5 py-3 text-right text-xs text-[#444] font-medium uppercase tracking-wider">Costo unit.</th>
                  <th className="px-5 py-3 text-right text-xs text-[#444] font-medium uppercase tracking-wider">Capital parado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {capitalInmovilizado.map(a => (
                  <tr key={a.id_articulo} className="hover:bg-[#1f1f1f] transition-colors">
                    <td className="px-5 py-3 text-white">{a.nombre}</td>
                    <td className="px-5 py-3 text-right text-[#aaa]">{a.stock_disponible}</td>
                    <td className="px-5 py-3 text-right text-[#555] text-xs">{formatARS(a.precio_costo)}</td>
                    <td className="px-5 py-3 text-right text-yellow-400 font-medium">{formatARS(a.valorStock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StockList items={items} />
    </div>
  )
}
