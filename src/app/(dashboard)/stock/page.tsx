import { createServiceClient } from '@/lib/supabase/server'
import { StockList } from './StockList'

export default async function StockPage() {
  const supabase = await createServiceClient()

  const { data: articulos } = await supabase
    .from('articulos')
    .select('id_articulo, nombre, stock_disponible, stock_minimo, precio_costo, porcentaje_ganancia, activo')
    .eq('activo', 1)
    .gt('stock_minimo', 0)
    .order('stock_disponible', { ascending: true })

  const items = (articulos ?? []).map(a => {
    let estado: 'sin_stock' | 'bajo' | 'ok'
    if (a.stock_disponible <= 0) estado = 'sin_stock'
    else if (a.stock_disponible <= a.stock_minimo) estado = 'bajo'
    else estado = 'ok'

    return { ...a, estado }
  })

  const sinStock = items.filter(a => a.estado === 'sin_stock').length
  const bajo = items.filter(a => a.estado === 'bajo').length
  const ok = items.filter(a => a.estado === 'ok').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Stock</h1>
        <p className="text-[#444] text-sm mt-0.5">{items.length} productos con stock mínimo definido</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
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

      <StockList items={items} />
    </div>
  )
}
