'use client'

import { useState } from 'react'
import { formatARS, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

type EstadoFiltro = 'todos' | 'riesgo'

interface Deudor {
  id_cliente: number
  razon_social: string
  celular: string
  saldo: number
  ultimoMovimiento: string | null
  estado: 'nunca_pago' | 'inactivo' | 'activo'
}

interface Props {
  deudores: Deudor[]
}

function estadoBadge(estado: Deudor['estado']) {
  if (estado === 'nunca_pago') return <Badge variant="red">Nunca pagó</Badge>
  if (estado === 'inactivo') return <Badge variant="yellow">Inactivo</Badge>
  return <Badge variant="green">Activo</Badge>
}

export function DeudoresList({ deudores }: Props) {
  const [filtro, setFiltro] = useState<EstadoFiltro>('todos')

  const filtered = filtro === 'riesgo'
    ? deudores.filter(d => d.estado === 'nunca_pago' || d.estado === 'inactivo')
    : deudores

  const totalDeuda = filtered.reduce((acc, d) => acc + d.saldo, 0)

  return (
    <>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
          {[
            { value: 'todos' as const, label: 'Todos' },
            { value: 'riesgo' as const, label: 'En riesgo' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filtro === f.value ? 'bg-blue-600 text-white' : 'text-[#666] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="text-sm text-[#555]">
          {filtered.length} clientes ·{' '}
          <span className="text-red-400 font-medium">{formatARS(totalDeuda)}</span> total
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 text-right text-xs text-[#555] font-medium uppercase tracking-wider">Deuda</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Último mov.</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Teléfono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#555]">
                    Sin deudores en esta categoría
                  </td>
                </tr>
              ) : (
                filtered.map(d => (
                  <tr
                    key={d.id_cliente}
                    className={`hover:bg-[#1f1f1f] transition-colors ${
                      d.estado === 'nunca_pago' ? 'border-l-2 border-red-700' : ''
                    }`}
                  >
                    <td className="px-5 py-3 text-white font-medium">{d.razon_social}</td>
                    <td className="px-5 py-3 text-right text-red-400 font-bold">{formatARS(d.saldo)}</td>
                    <td className="px-5 py-3 text-[#666]">{d.ultimoMovimiento ? formatDate(d.ultimoMovimiento) : '—'}</td>
                    <td className="px-5 py-3">{estadoBadge(d.estado)}</td>
                    <td className="px-5 py-3">
                      <a
                        href={`https://wa.me/54${d.celular?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 text-xs"
                      >
                        {d.celular}
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
