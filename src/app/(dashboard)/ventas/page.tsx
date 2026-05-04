/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServiceClient } from '@/lib/supabase/server'
import { VentasCharts } from './VentasCharts'
import { formatARS } from '@/lib/utils'

type Periodo = 'hoy' | 'semana' | 'mes'

function getPeriodStart(periodo: Periodo): string {
  const today = new Date()
  if (periodo === 'hoy') return today.toISOString().split('T')[0]
  if (periodo === 'semana') {
    const d = new Date(today); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]
  }
  return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
}

export default async function VentasPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const params = await searchParams
  const periodo = (params.periodo ?? 'mes') as Periodo
  const desde = getPeriodStart(periodo)

  const supabase = await createServiceClient()

  const treintaDias = new Date(); treintaDias.setDate(treintaDias.getDate() - 30)
  const desde30 = treintaDias.toISOString().split('T')[0]

  const [{ data: ventasGrafico }, { data: ventasPeriodo }] = await Promise.all([
    supabase.from('ventas').select('fecha, precio_venta, cantidad').gte('fecha', desde30).gt('cantidad', 0).order('fecha'),
    supabase.from('ventas').select('id_articulo, id_cliente, precio_venta, precio_costo, cantidad, articulos(nombre), clientes(razon_social)').gte('fecha', desde).gt('cantidad', 0),
  ])

  // Facturación por día
  const porDiaMap = new Map<string, number>()
  for (const v of ventasGrafico ?? []) {
    const dia = v.fecha.split('T')[0]
    porDiaMap.set(dia, (porDiaMap.get(dia) ?? 0) + v.precio_venta * v.cantidad)
  }
  const porDia = Array.from(porDiaMap.entries()).map(([fecha, total]) => ({ fecha, total })).sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Top productos con ganancia real
  const prodMap = new Map<string, { nombre: string; total: number; cantidad: number; ganancia: number; margen_pct: number }>()
  for (const v of ventasPeriodo ?? []) {
    const nombre = (v.articulos as any)?.nombre ?? `ID ${v.id_articulo}`
    const prev = prodMap.get(nombre) ?? { nombre, total: 0, cantidad: 0, ganancia: 0, margen_pct: 0 }
    const gananciaLinea = v.precio_costo > 0 ? (v.precio_venta - v.precio_costo) * v.cantidad : 0
    prodMap.set(nombre, {
      nombre,
      total: prev.total + v.precio_venta * v.cantidad,
      cantidad: prev.cantidad + v.cantidad,
      ganancia: prev.ganancia + gananciaLinea,
      margen_pct: v.precio_costo > 0 ? Math.round(((v.precio_venta - v.precio_costo) / v.precio_costo) * 100) : 0,
    })
  }
  const topProductos = Array.from(prodMap.values()).sort((a, b) => b.total - a.total).slice(0, 10)

  // Top clientes
  const cliMap = new Map<string, { razon_social: string; total: number; operaciones: number }>()
  for (const v of ventasPeriodo ?? []) {
    const nombre = (v.clientes as any)?.razon_social ?? `ID ${v.id_cliente}`
    const prev = cliMap.get(nombre) ?? { razon_social: nombre, total: 0, operaciones: 0 }
    cliMap.set(nombre, { razon_social: nombre, total: prev.total + v.precio_venta * v.cantidad, operaciones: prev.operaciones + 1 })
  }
  const topClientes = Array.from(cliMap.values()).sort((a, b) => b.total - a.total).slice(0, 10)

  // Totales del período
  const totalFact = (ventasPeriodo ?? []).reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0)
  const totalGanancia = (ventasPeriodo ?? []).filter(v => v.precio_costo > 0).reduce((acc, v) => acc + (v.precio_venta - v.precio_costo) * v.cantidad, 0)
  const sinCostoFact = (ventasPeriodo ?? []).filter(v => !v.precio_costo || v.precio_costo === 0).reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0)

  const periodos: { value: Periodo; label: string }[] = [
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Ventas</h1>
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
          {periodos.map(p => (
            <a key={p.value} href={`/ventas?periodo=${p.value}`}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${periodo === p.value ? 'bg-blue-600 text-white' : 'text-[#555] hover:text-white'}`}>
              {p.label}
            </a>
          ))}
        </div>
      </div>

      {/* Resumen del período */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-xs text-[#444] uppercase tracking-wider mb-1">Facturado</p>
          <p className="text-2xl font-bold text-white">{formatARS(totalFact)}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-xs text-[#444] uppercase tracking-wider mb-1">Ganancia bruta</p>
          <p className="text-2xl font-bold text-emerald-400">{formatARS(totalGanancia)}</p>
          {sinCostoFact > 0 && (
            <p className="text-xs text-yellow-500 mt-1">{formatARS(sinCostoFact)} sin costo cargado</p>
          )}
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-xs text-[#444] uppercase tracking-wider mb-1">Margen promedio</p>
          <p className="text-2xl font-bold text-blue-400">
            {totalFact > 0 && totalGanancia > 0 ? `${Math.round((totalGanancia / totalFact) * 100)}%` : '—'}
          </p>
          <p className="text-xs text-[#444] mt-1">sobre productos con costo</p>
        </div>
      </div>

      <VentasCharts porDia={porDia} topProductos={topProductos} topClientes={topClientes} />
    </div>
  )
}
