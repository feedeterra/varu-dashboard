import { createServiceClient } from '@/lib/supabase/server'
import { ClientesList } from './ClientesList'
import { formatARS } from '@/lib/utils'

export default async function ClientesPage() {
  const supabase = await createServiceClient()

  const [{ data: clientes }, { data: ventas }, { data: movimientos }] = await Promise.all([
    supabase
      .from('clientes')
      .select('id_cliente, razon_social, celular, localidad, activo, fecha_ingreso')
      .eq('activo', 1)
      .order('razon_social'),
    supabase
      .from('ventas')
      .select('id_cliente, precio_venta, cantidad, fecha')
      .gt('cantidad', 0),
    supabase
      .from('movimientos_cc')
      .select('id_cliente, id_tipo_movimiento, importe_unitario, importe_abonado, cantidad')
      .eq('activo', 1),
  ])

  // Saldo CC por cliente
  const saldoMap = new Map<number, number>()
  for (const m of movimientos ?? []) {
    const prev = saldoMap.get(m.id_cliente) ?? 0
    if (m.id_tipo_movimiento === 2) {
      saldoMap.set(m.id_cliente, prev + (m.importe_unitario ?? 0) * (m.cantidad ?? 1))
    } else if (m.id_tipo_movimiento === 3) {
      saldoMap.set(m.id_cliente, prev - (m.importe_abonado ?? 0))
    }
  }

  // Stats por cliente
  const statsMap = new Map<number, { total: number; ops: number; ultima: string | null }>()
  for (const v of ventas ?? []) {
    const prev = statsMap.get(v.id_cliente) ?? { total: 0, ops: 0, ultima: null }
    const monto = v.precio_venta * v.cantidad
    const fechaV = v.fecha?.split('T')[0] ?? null
    statsMap.set(v.id_cliente, {
      total: prev.total + monto,
      ops: prev.ops + 1,
      ultima: prev.ultima && prev.ultima > (fechaV ?? '') ? prev.ultima : fechaV,
    })
  }

  const clientesConStats = (clientes ?? []).map(c => {
    const stats = statsMap.get(c.id_cliente) ?? { total: 0, ops: 0, ultima: null }
    return {
      cliente: c,
      totalComprado: stats.total,
      ticketPromedio: stats.ops > 0 ? stats.total / stats.ops : 0,
      operaciones: stats.ops,
      ultimaCompra: stats.ultima,
      saldoCC: saldoMap.get(c.id_cliente) ?? 0,
    }
  }).sort((a, b) => b.totalComprado - a.totalComprado)

  // Ranking por ciudad
  const ciudadMap = new Map<string, { clientes: number; facturacion: number }>()
  for (const item of clientesConStats) {
    const ciudad = item.cliente.localidad?.trim() || 'Sin localidad'
    const prev = ciudadMap.get(ciudad) ?? { clientes: 0, facturacion: 0 }
    ciudadMap.set(ciudad, {
      clientes: prev.clientes + 1,
      facturacion: prev.facturacion + item.totalComprado,
    })
  }
  const rankingCiudades = Array.from(ciudadMap.entries())
    .map(([ciudad, data]) => ({ ciudad, ...data }))
    .sort((a, b) => b.facturacion - a.facturacion)
    .slice(0, 8)

  const maxFact = rankingCiudades[0]?.facturacion ?? 1

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Clientes</h1>
        <p className="text-[#444] text-sm mt-0.5">{clientesConStats.length} clientes activos</p>
      </div>

      {/* Ranking por ciudad */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Facturación por ciudad</h2>
        <div className="space-y-3">
          {rankingCiudades.map((c, i) => (
            <div key={c.ciudad} className="flex items-center gap-3">
              <span className="text-xs text-[#333] w-4 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#ccc] truncate">{c.ciudad}</span>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs text-[#444]">{c.clientes} clientes</span>
                    <span className="text-sm text-white font-medium">{formatARS(c.facturacion)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${(c.facturacion / maxFact) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ClientesList clientes={clientesConStats} />
    </div>
  )
}
