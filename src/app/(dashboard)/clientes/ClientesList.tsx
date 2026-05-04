'use client'

import { useState, useMemo } from 'react'
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

type Col = 'nombre' | 'localidad' | 'total' | 'ultimaCompra' | 'saldoCC'
type Dir = 'asc' | 'desc'

function diasDesde(fecha: string | null): number | null {
  if (!fecha) return null
  return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24))
}

function InactivoBadge({ dias }: { dias: number | null }) {
  if (dias === null) return <span className="text-xs text-[#444]">—</span>
  if (dias > 60) return <span className="text-xs text-red-400 font-medium">{dias}d</span>
  if (dias > 30) return <span className="text-xs text-yellow-400">{dias}d</span>
  return <span className="text-xs text-[#555]">{dias}d</span>
}

function SortIcon({ col, orden, dir }: { col: Col; orden: Col; dir: Dir }) {
  const active = col === orden
  return (
    <span className={`ml-1 inline-block transition-colors ${active ? 'text-blue-400' : 'text-[#333]'}`}>
      {active && dir === 'asc' ? '↑' : active && dir === 'desc' ? '↓' : '↕'}
    </span>
  )
}

export function ClientesList({ clientes }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ClienteConStats | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'deudores' | 'inactivos'>('todos')
  const [ciudad, setCiudad] = useState<string>('todas')
  const [orden, setOrden] = useState<Col>('total')
  const [dir, setDir] = useState<Dir>('desc')

  // Lista de ciudades únicas
  const ciudades = useMemo(() => {
    const set = new Set<string>()
    for (const c of clientes) {
      const loc = c.cliente.localidad?.trim()
      if (loc) set.add(loc)
    }
    return Array.from(set).sort()
  }, [clientes])

  const handleSort = (col: Col) => {
    if (orden === col) setDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setOrden(col); setDir(col === 'nombre' || col === 'localidad' ? 'asc' : 'desc') }
  }

  const filtered = useMemo(() => {
    return clientes
      .filter(c => {
        const texto = search.toLowerCase()
        if (texto && !c.cliente.razon_social.toLowerCase().includes(texto)) return false
        if (ciudad !== 'todas' && c.cliente.localidad?.trim() !== ciudad) return false
        if (filtro === 'deudores') return c.saldoCC > 500
        if (filtro === 'inactivos') return (diasDesde(c.ultimaCompra) ?? 0) > 45
        return true
      })
      .sort((a, b) => {
        let cmp = 0
        if (orden === 'nombre') cmp = a.cliente.razon_social.localeCompare(b.cliente.razon_social)
        else if (orden === 'localidad') cmp = (a.cliente.localidad ?? '').localeCompare(b.cliente.localidad ?? '')
        else if (orden === 'total') cmp = a.totalComprado - b.totalComprado
        else if (orden === 'ultimaCompra') cmp = (a.ultimaCompra ?? '').localeCompare(b.ultimaCompra ?? '')
        else if (orden === 'saldoCC') cmp = a.saldoCC - b.saldoCC
        return dir === 'asc' ? cmp : -cmp
      })
  }, [clientes, search, ciudad, filtro, orden, dir])

  const thClass = 'px-5 py-3 text-xs text-[#444] font-medium uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors'

  return (
    <>
      {/* Controles */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Búsqueda */}
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="flex-1 sm:max-w-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#333] focus:outline-none focus:border-blue-600 transition-colors"
          />

          {/* Filtro por ciudad */}
          <select
            value={ciudad}
            onChange={e => setCiudad(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-600 transition-colors"
          >
            <option value="todas">Todas las ciudades</option>
            {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Filtro estado */}
          <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
            {(['todos', 'deudores', 'inactivos'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filtro === f ? 'bg-blue-600 text-white' : 'text-[#555] hover:text-white'}`}
              >
                {f === 'todos' ? `Todos (${clientes.length})` : f === 'deudores' ? 'Con deuda' : 'Inactivos +45d'}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#444]">{filtered.length} clientes</p>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222]">
                <th className={`${thClass} text-left`} onClick={() => handleSort('nombre')}>
                  Cliente <SortIcon col="nombre" orden={orden} dir={dir} />
                </th>
                <th className={`${thClass} text-left`} onClick={() => handleSort('localidad')}>
                  Ciudad <SortIcon col="localidad" orden={orden} dir={dir} />
                </th>
                <th className={`${thClass} text-right`} onClick={() => handleSort('total')}>
                  Total comprado <SortIcon col="total" orden={orden} dir={dir} />
                </th>
                <th className={`${thClass} text-right`} onClick={() => handleSort('ultimaCompra')}>
                  Última compra <SortIcon col="ultimaCompra" orden={orden} dir={dir} />
                </th>
                <th className={`${thClass} text-right`} onClick={() => handleSort('saldoCC')}>
                  Saldo CC <SortIcon col="saldoCC" orden={orden} dir={dir} />
                </th>
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
                      <td className="px-5 py-3 text-right"><InactivoBadge dias={dias} /></td>
                      <td className="px-5 py-3 text-right">
                        {item.saldoCC > 500
                          ? <span className="text-red-400 text-xs font-medium">{formatARS(item.saldoCC)}</span>
                          : <span className="text-[#444] text-xs">—</span>
                        }
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
