'use client'

import { useState } from 'react'

interface StockItem {
  id_articulo: number
  nombre: string
  stock_disponible: number
  stock_minimo: number
  precio_costo: number
  porcentaje_ganancia: number
  estado: 'sin_stock' | 'bajo' | 'ok'
}

interface Props {
  items: StockItem[]
}

const estadoConfig = {
  sin_stock: { label: 'Sin stock', className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  bajo: { label: 'Bajo mínimo', className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  ok: { label: 'OK', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
}

export function StockList({ items }: Props) {
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'sin_stock' | 'bajo' | 'ok'>('todos')

  const filtered = items.filter(a => {
    if (search && !a.nombre.toLowerCase().includes(search.toLowerCase())) return false
    if (filtro !== 'todos' && a.estado !== filtro) return false
    return true
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="flex-1 sm:max-w-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#333] focus:outline-none focus:border-blue-600 transition-colors"
        />
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
          {(['todos', 'sin_stock', 'bajo', 'ok'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filtro === f ? 'bg-blue-600 text-white' : 'text-[#555] hover:text-white'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'sin_stock' ? 'Sin stock' : f === 'bajo' ? 'Bajo mín.' : 'OK'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="px-5 py-3 text-left text-xs text-[#444] font-medium uppercase tracking-wider">Producto</th>
                <th className="px-5 py-3 text-center text-xs text-[#444] font-medium uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-right text-xs text-[#444] font-medium uppercase tracking-wider">Stock actual</th>
                <th className="px-5 py-3 text-right text-xs text-[#444] font-medium uppercase tracking-wider">Mínimo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-[#444]">Sin resultados</td>
                </tr>
              ) : (
                filtered.map(a => {
                  const cfg = estadoConfig[a.estado]
                  return (
                    <tr key={a.id_articulo} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-5 py-3 text-white">{a.nombre}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-right font-medium ${a.estado === 'sin_stock' ? 'text-red-400' : a.estado === 'bajo' ? 'text-yellow-400' : 'text-white'}`}>
                        {a.stock_disponible}
                      </td>
                      <td className="px-5 py-3 text-right text-[#444]">{a.stock_minimo}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
