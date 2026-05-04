'use client'

import { useState } from 'react'
import { formatARS } from '@/lib/utils'
import { Cliente } from '@/types'
import { ClienteModal } from './ClienteModal'

interface ClienteConStats {
  cliente: Cliente
  totalComprado: number
  ticketPromedio: number
  operaciones: number
  ultimaCompra: string | null
  saldoCC: number
}

interface Props {
  clientes: ClienteConStats[]
}

function diasDesde(fecha: string | null): number | null {
  if (!fecha) return null
  const diff = Date.now() - new Date(fecha).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function InactivoBadge({ dias }: { dias: number | null }) {
  if (dias === null) return <span className="text-xs text-[#444]">—</span>
  if (dias > 60) return <span className="text-xs text-red-400 font-medium">{dias}d sin comprar</span>
  if (dias > 30) return <span className="text-xs text-yellow-400">{dias}d</span>
  return <span className="text-xs text-[#555]">{dias}d</span>
}

export function ClientesList({ clientes }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ClienteConStats | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'deudores' | 'inactivos'>('todos')

  const filtered = clientes
    .filter(c => {
      const texto = search.toLowerCase()
      if (texto && !c.cliente.razon_social.toLowerCase().includes(texto) && !c.cliente.localidad?.toLowerCase().includes(texto)) return false
      if (filtro === 'deudores') return c.saldoCC > 500
      if (filtro === 'inactivos') return (diasDesde(c.ultimaCompra) ?? 0) > 45
      return true
    })

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o localidad..."
          className="flex-1 sm:max-w-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#333] focus:outline-none focus:border-blue-600 transition-colors"
        />
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
          {(['todos', 'deudores', 'inactivos'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                filtro === f ? 'bg-blue-600 text-white' : 'text-[#555] hover:text-white'
              }`}
            >
              {f === 'todos' ? `Todos (${clientes.length})` : f === 'deudores' ? 'Con deuda' : 'Inactivos +45d'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="px-5 py-3 text-left text-xs text-[#444] font-medium uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 text-left text-xs text-[#444] font-medium uppercase tracking-wider">Localidad</th>
                <th className="px-5 py-3 text-right text-xs text-[#444] font-medium uppercase tracking-wider">Total comprado</th>
                <th className="px-5 py-3 text-right text-xs text-[#444] font-medium uppercase tracking-wider">Última compra</th>
                <th className="px-5 py-3 text-right text-xs text-[#444] font-medium uppercase tracking-wider">Saldo CC</th>
                <th className="px-5 py-3 text-left text-xs text-[#444] font-medium uppercase tracking-wider">Teléfono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[#444]">Sin resultados</td>
                </tr>
              ) : (
                filtered.map(item => {
                  const dias = diasDesde(item.ultimaCompra)
                  return (
                    <tr
                      key={item.cliente.id_cliente}
                      className="hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                      onClick={() => setSelected(item)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-[#555] shrink-0">
                            {item.cliente.razon_social.charAt(0)}
                          </div>
                          <span className="text-white font-medium truncate max-w-[160px]">{item.cliente.razon_social}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#555] text-xs">{item.cliente.localidad ?? '—'}</td>
                      <td className="px-5 py-3 text-right text-white font-medium">{formatARS(item.totalComprado)}</td>
                      <td className="px-5 py-3 text-right">
                        <InactivoBadge dias={dias} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {item.saldoCC > 500 ? (
                          <span className="text-red-400 text-xs font-medium">{formatARS(item.saldoCC)}</span>
                        ) : (
                          <span className="text-[#444] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <a
                          href={`https://wa.me/54${item.cliente.celular?.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-500 hover:text-green-400 text-xs"
                          onClick={e => e.stopPropagation()}
                        >
                          {item.cliente.celular}
                        </a>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <ClienteModal data={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
