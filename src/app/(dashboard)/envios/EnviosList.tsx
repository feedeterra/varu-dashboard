/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Envio } from '@/types'

type EstadoEnvio = 'preparando' | 'enviado' | 'entregado' | 'devuelto'

function estadoBadge(estado: EstadoEnvio) {
  const map: Record<EstadoEnvio, React.ReactNode> = {
    preparando: <Badge variant="yellow">Preparando</Badge>,
    enviado: <Badge variant="blue">Enviado</Badge>,
    entregado: <Badge variant="green">Entregado</Badge>,
    devuelto: <Badge variant="red">Devuelto</Badge>,
  }
  return map[estado] ?? <Badge>{estado}</Badge>
}

interface Props {
  envios: Envio[]
}

const ESTADOS: EstadoEnvio[] = ['preparando', 'enviado', 'entregado', 'devuelto']

export function EnviosList({ envios }: Props) {
  const router = useRouter()
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroComisionista, setFiltroComisionista] = useState<string>('todos')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const comisionistas = Array.from(new Set(envios.map(e => e.comisionista).filter(Boolean)))

  const filtered = envios.filter(e => {
    if (filtroEstado !== 'todos' && e.estado !== filtroEstado) return false
    if (filtroComisionista !== 'todos' && e.comisionista !== filtroComisionista) return false
    return true
  })

  const updateEstado = async (id: number, nuevoEstado: EstadoEnvio) => {
    setUpdatingId(id)
    const supabase = createClient()
    await supabase
      .from('envios')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', id)
    setUpdatingId(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filtroEstado === 'todos' ? 'bg-blue-600 text-white' : 'text-[#666] hover:text-white'}`}
          >
            Todos
          </button>
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${filtroEstado === e ? 'bg-blue-600 text-white' : 'text-[#666] hover:text-white'}`}
            >
              {e}
            </button>
          ))}
        </div>

        {comisionistas.length > 0 && (
          <select
            value={filtroComisionista}
            onChange={e => setFiltroComisionista(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-[#aaa] text-xs focus:outline-none focus:border-blue-600"
          >
            <option value="todos">Todos los comisionistas</option>
            {comisionistas.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Producto</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Comisionista</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Dirección</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Fecha</th>
                <th className="px-5 py-3 text-left text-xs text-[#555] font-medium uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[#555]">
                    Sin envíos en esta categoría
                  </td>
                </tr>
              ) : (
                filtered.map(envio => (
                  <tr key={envio.id} className="hover:bg-[#1f1f1f] transition-colors">
                    <td className="px-5 py-3 text-white font-medium">
                      {(envio.clientes as any)?.razon_social ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-[#888] text-xs">
                      {(envio.articulos as any)?.nombre ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-[#aaa] text-xs">{envio.comisionista}</td>
                    <td className="px-5 py-3 text-[#888] text-xs max-w-[150px] truncate">{envio.direccion}</td>
                    <td className="px-5 py-3">{estadoBadge(envio.estado)}</td>
                    <td className="px-5 py-3 text-[#666] text-xs">{formatDate(envio.created_at)}</td>
                    <td className="px-5 py-3">
                      <select
                        value={envio.estado}
                        onChange={e => updateEstado(envio.id, e.target.value as EstadoEnvio)}
                        disabled={updatingId === envio.id}
                        className="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-[#aaa] focus:outline-none"
                      >
                        {ESTADOS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
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
