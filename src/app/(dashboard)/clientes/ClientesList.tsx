'use client'

import { useState } from 'react'
import { formatARS, formatDate } from '@/lib/utils'
import { Cliente } from '@/types'
import { ClienteModal } from './ClienteModal'

interface ClienteConStats {
  cliente: Cliente
  totalComprado: number
  ticketPromedio: number
  operaciones: number
  ultimaCompra: string | null
}

interface Props {
  clientes: ClienteConStats[]
}

export function ClientesList({ clientes }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ClienteConStats | null>(null)

  const filtered = clientes.filter(c =>
    c.cliente.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    c.cliente.localidad?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="mb-5">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o localidad..."
          className="w-full md:w-80 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-blue-600 transition-colors"
        />
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Localidad</th>
                <th className="px-5 py-3 text-right text-xs text-[#555] font-medium uppercase tracking-wider">Total comprado</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Última compra</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Teléfono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#555]">
                    Sin resultados
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr
                    key={item.cliente.id_cliente}
                    className="hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                    onClick={() => setSelected(item)}
                  >
                    <td className="px-5 py-3 text-white font-medium">{item.cliente.razon_social}</td>
                    <td className="px-5 py-3 text-[#777]">{item.cliente.localidad ?? '—'}</td>
                    <td className="px-5 py-3 text-right text-white font-medium">{formatARS(item.totalComprado)}</td>
                    <td className="px-5 py-3 text-[#666]">{item.ultimaCompra ? formatDate(item.ultimaCompra) : '—'}</td>
                    <td className="px-5 py-3">
                      <a
                        href={`https://wa.me/54${item.cliente.celular?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 text-xs"
                        onClick={e => e.stopPropagation()}
                      >
                        {item.cliente.celular}
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ClienteModal data={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
