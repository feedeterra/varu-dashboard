import { createClient } from '@/lib/supabase/server'
import { ClientesList } from './ClientesList'

export default async function ClientesPage() {
  const supabase = await createClient()

  const [{ data: clientes }, { data: ventas }] = await Promise.all([
    supabase
      .from('clientes')
      .select('id_cliente, razon_social, celular, localidad, activo, fecha_ingreso')
      .eq('activo', true)
      .order('razon_social'),
    supabase
      .from('ventas')
      .select('id_cliente, precio_venta, cantidad, fecha'),
  ])

  // Build stats per cliente
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
    }
  }).sort((a, b) => b.totalComprado - a.totalComprado)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="text-[#555] text-sm mt-1">{clientesConStats.length} clientes activos</p>
      </div>

      <ClientesList clientes={clientesConStats} />
    </div>
  )
}
