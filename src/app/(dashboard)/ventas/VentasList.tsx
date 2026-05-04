'use client'

import { useState } from 'react'
import { formatARS, formatDate } from '@/lib/utils'

interface Item {
  id_principal: number
  nombre: string
  cantidad: number
  precio_venta: number
}

interface Remito {
  id_movimiento: number
  cliente: string
  fecha: string
  total: number
  items: Item[]
  forma_pago: string
}

type Orden = 'total_desc' | 'total_asc' | 'fecha_desc' | 'cantidad_desc'

interface Props {
  remitos: Remito[]
}

export function VentasList({ remitos }: Props) {
  const [search, setSearch] = useState('')
  const [orden, setOrden] = useState<Orden>('fecha_desc')
  const [expandido, setExpandido] = useState<number | null>(null)

  const filtered = remitos
    .filter(r => !search || r.cliente.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (orden === 'total_desc') return b.total - a.total
      if (orden === 'total_asc') return a.total - b.total
      if (orden === 'cantidad_desc') return b.items.reduce((s, i) => s + i.cantidad, 0) - a.items.reduce((s, i) => s + i.cantidad, 0)
      return b.fecha.localeCompare(a.fecha) // fecha_desc
    })

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="flex-1 sm:max-w-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#333] focus:outline-none focus:border-blue-600 transition-colors"
        />
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
          {([
            { value: 'fecha_desc', label: 'Más reciente' },
            { value: 'total_desc', label: 'Mayor total' },
            { value: 'total_asc', label: 'Menor total' },
            { value: 'cantidad_desc', label: 'Mayor cantidad' },
          ] as { value: Orden; label: string }[]).map(o => (
            <button
              key={o.value}
              onClick={() => setOrden(o.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${orden === o.value ? 'bg-blue-600 text-white' : 'text-[#555] hover:text-white'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#444]">{filtered.length} remitos</p>

      {/* Lista de remitos */}
      <div className="space-y-2">
        {filtered.map(remito => {
          const isOpen = expandido === remito.id_movimiento
          const totalUnidades = remito.items.reduce((s, i) => s + i.cantidad, 0)
          return (
            <div key={remito.id_movimiento} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
              {/* Cabecera del remito */}
              <button
                onClick={() => setExpandido(isOpen ? null : remito.id_movimiento)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#1f1f1f] transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-[#666] shrink-0">
                    {remito.cliente.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{remito.cliente}</p>
                    <p className="text-xs text-[#444] mt-0.5">{formatDate(remito.fecha)} · {totalUnidades} unidades · {remito.items.length} productos</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{formatARS(remito.total)}</p>
                    <p className="text-[10px] text-[#444] uppercase">{remito.forma_pago}</p>
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"
                    className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {/* Desglose de items */}
              {isOpen && (
                <div className="border-t border-[#222]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1e1e1e]">
                        <th className="px-5 py-2 text-left text-xs text-[#333] font-medium">Producto</th>
                        <th className="px-5 py-2 text-right text-xs text-[#333] font-medium">Cant.</th>
                        <th className="px-5 py-2 text-right text-xs text-[#333] font-medium">Precio unit.</th>
                        <th className="px-5 py-2 text-right text-xs text-[#333] font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {remito.items.map(item => (
                        <tr key={item.id_principal} className="hover:bg-[#222] transition-colors">
                          <td className="px-5 py-2.5 text-[#aaa] text-xs">{item.nombre}</td>
                          <td className="px-5 py-2.5 text-right text-[#666] text-xs">{item.cantidad}</td>
                          <td className="px-5 py-2.5 text-right text-[#666] text-xs">{formatARS(item.precio_venta)}</td>
                          <td className="px-5 py-2.5 text-right text-white text-xs font-medium">{formatARS(item.precio_venta * item.cantidad)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#222]">
                        <td colSpan={3} className="px-5 py-2.5 text-xs text-[#444] text-right">Total remito</td>
                        <td className="px-5 py-2.5 text-right text-white font-bold text-sm">{formatARS(remito.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
