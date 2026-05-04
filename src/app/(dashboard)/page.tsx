/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/Card'
import { formatARS } from '@/lib/utils'

async function getHomeData() {
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]

  const [
    { data: ventasHoy },
    { data: ventasMes },
    { data: clientesMes },
    { data: sinStock },
    { data: ultimasVentas },
  ] = await Promise.all([
    supabase
      .from('ventas')
      .select('precio_venta, precio_costo, cantidad')
      .gte('fecha', todayStr),
    supabase
      .from('ventas')
      .select('precio_venta, precio_costo, cantidad')
      .gte('fecha', firstOfMonth),
    supabase
      .from('ventas')
      .select('id_cliente')
      .gte('fecha', firstOfMonth),
    supabase
      .from('articulos')
      .select('id_articulo')
      .eq('activo', true)
      .lte('stock_disponible', 0),
    supabase
      .from('ventas')
      .select('id_movimiento, fecha, cantidad, precio_venta, forma_pago, clientes(razon_social), articulos(nombre)')
      .gte('fecha', todayStr)
      .order('id_movimiento', { ascending: false })
      .limit(10),
  ])

  const facturadoHoy = (ventasHoy ?? []).reduce((acc, v) => acc + (v.precio_venta * v.cantidad), 0)
  const facturadoMes = (ventasMes ?? []).reduce((acc, v) => acc + (v.precio_venta * v.cantidad), 0)
  const gananciaMes = (ventasMes ?? []).reduce((acc, v) => acc + ((v.precio_venta - v.precio_costo) * v.cantidad), 0)
  const clientesUnicos = new Set((clientesMes ?? []).map(v => v.id_cliente)).size
  const sinStockCount = sinStock?.length ?? 0

  return {
    facturadoHoy,
    facturadoMes,
    gananciaMes,
    clientesUnicos,
    sinStockCount,
    ultimasVentas: ultimasVentas ?? [],
  }
}

async function getIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = ['ffedericoterrazas@gmail.com']
  return adminEmails.includes(user?.email ?? '') || (user?.user_metadata?.role === 'admin')
}

export default async function HomePage() {
  const [data, isAdmin] = await Promise.all([getHomeData(), getIsAdmin()])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Inicio</h1>
        <p className="text-[#555] text-sm mt-1">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Facturado hoy"
          value={formatARS(data.facturadoHoy)}
          color="blue"
        />
        <StatCard
          label="Facturado este mes"
          value={formatARS(data.facturadoMes)}
          color="default"
        />
        <StatCard
          label="Clientes activos"
          value={data.clientesUnicos.toString()}
          sub="este mes"
        />
        <StatCard
          label="Sin stock"
          value={data.sinStockCount.toString()}
          sub="productos"
          color={data.sinStockCount > 0 ? 'red' : 'default'}
        />
        {isAdmin && (
          <StatCard
            label="Ganancia bruta del mes"
            value={formatARS(data.gananciaMes)}
            color="green"
          />
        )}
      </div>

      {/* Últimas ventas del día */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-sm font-semibold text-white">Últimas ventas del día</h2>
        </div>

        {data.ultimasVentas.length === 0 ? (
          <div className="px-5 py-10 text-center text-[#555] text-sm">
            Sin ventas registradas hoy
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Producto</th>
                  <th className="px-5 py-3 text-right text-xs text-[#555] font-medium uppercase tracking-wider">Cant.</th>
                  <th className="px-5 py-3 text-right text-xs text-[#555] font-medium uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]">
                {data.ultimasVentas.map((v: any) => (
                  <tr key={v.id_movimiento} className="hover:bg-[#1f1f1f] transition-colors">
                    <td className="px-5 py-3 text-white font-medium truncate max-w-[140px]">
                      {v.clientes?.razon_social ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-[#aaa] truncate max-w-[160px]">
                      {v.articulos?.nombre ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-[#aaa]">{v.cantidad}</td>
                    <td className="px-5 py-3 text-right text-white font-medium">
                      {formatARS(v.precio_venta * v.cantidad)}
                    </td>
                    <td className="px-5 py-3 text-[#666] text-xs uppercase">{v.forma_pago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
