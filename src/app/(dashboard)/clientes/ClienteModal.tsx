/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatARS, formatDate } from '@/lib/utils'
import { Cliente } from '@/types'

interface ClienteConStats {
  cliente: Cliente
  totalComprado: number
  ticketPromedio: number
  operaciones: number
  ultimaCompra: string | null
}

interface Props {
  data: ClienteConStats
  onClose: () => void
}

export function ClienteModal({ data, onClose }: Props) {
  const [topProductos, setTopProductos] = useState<any[] | null>(null)
  const [saldoCC, setSaldoCC] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const loadDetails = async () => {
    if (loaded) return
    setLoading(true)
    const supabase = createClient()

    const [{ data: ventas }, { data: movs }] = await Promise.all([
      supabase
        .from('ventas')
        .select('id_articulo, cantidad, precio_venta, articulos(nombre)')
        .eq('id_cliente', data.cliente.id_cliente),
      supabase
        .from('movimientos_cc')
        .select('id_tipo_movimiento, importe_unitario, importe_abonado, cantidad')
        .eq('id_cliente', data.cliente.id_cliente)
        .eq('activo', true),
    ])

    // Top 5 productos
    const prodMap = new Map<string, { nombre: string; cantidad: number; total: number }>()
    for (const v of ventas ?? []) {
      const nombre = (v.articulos as any)?.nombre ?? `ID ${v.id_articulo}`
      const prev = prodMap.get(nombre) ?? { nombre, cantidad: 0, total: 0 }
      prodMap.set(nombre, {
        nombre,
        cantidad: prev.cantidad + v.cantidad,
        total: prev.total + v.precio_venta * v.cantidad,
      })
    }
    const top5 = Array.from(prodMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
    setTopProductos(top5)

    // Saldo CC: tipo 2 = deuda, tipo 3 = pago
    let deuda = 0
    let pagado = 0
    for (const m of movs ?? []) {
      if (m.id_tipo_movimiento === 2) {
        deuda += (m.importe_unitario ?? 0) * (m.cantidad ?? 1)
      } else if (m.id_tipo_movimiento === 3) {
        pagado += m.importe_abonado ?? 0
      }
    }
    setSaldoCC(deuda - pagado)
    setLoaded(true)
    setLoading(false)
  }

  // Load details on mount
  if (!loaded && !loading) {
    loadDetails()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#222] flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{data.cliente.razon_social}</h2>
            <p className="text-[#555] text-sm mt-0.5">{data.cliente.localidad}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-white text-xl leading-none ml-4 mt-0.5"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Datos básicos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#111] rounded-lg p-3">
              <p className="text-xs text-[#555] mb-1">Teléfono</p>
              <a
                href={`https://wa.me/54${data.cliente.celular.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 text-sm font-medium hover:text-green-300"
              >
                {data.cliente.celular}
              </a>
            </div>
            <div className="bg-[#111] rounded-lg p-3">
              <p className="text-xs text-[#555] mb-1">Cliente desde</p>
              <p className="text-white text-sm">{data.cliente.fecha_ingreso ? formatDate(data.cliente.fecha_ingreso) : '—'}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111] rounded-lg p-3 text-center">
              <p className="text-xs text-[#555] mb-1">Total comprado</p>
              <p className="text-white text-sm font-bold">{formatARS(data.totalComprado)}</p>
            </div>
            <div className="bg-[#111] rounded-lg p-3 text-center">
              <p className="text-xs text-[#555] mb-1">Ticket prom.</p>
              <p className="text-white text-sm font-bold">{formatARS(data.ticketPromedio)}</p>
            </div>
            <div className="bg-[#111] rounded-lg p-3 text-center">
              <p className="text-xs text-[#555] mb-1">Operaciones</p>
              <p className="text-white text-sm font-bold">{data.operaciones}</p>
            </div>
          </div>

          {data.ultimaCompra && (
            <p className="text-xs text-[#555]">
              Última compra: <span className="text-[#888]">{formatDate(data.ultimaCompra)}</span>
            </p>
          )}

          {loading && (
            <p className="text-xs text-[#555] text-center py-4">Cargando detalles...</p>
          )}

          {/* Top productos */}
          {topProductos && topProductos.length > 0 && (
            <div>
              <h3 className="text-xs text-[#555] uppercase tracking-wider mb-3">Productos frecuentes</h3>
              <div className="space-y-2">
                {topProductos.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#aaa] truncate">
                      <span className="text-[#444] mr-2">{i + 1}.</span>{p.nombre}
                    </span>
                    <span className="text-white font-medium ml-3 shrink-0">{formatARS(p.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cuenta corriente */}
          {saldoCC !== null && (
            <div className={`rounded-lg p-4 ${saldoCC > 0 ? 'bg-red-900/20 border border-red-800/30' : 'bg-green-900/20 border border-green-800/30'}`}>
              <p className="text-xs text-[#555] mb-1">Saldo cuenta corriente</p>
              <p className={`text-xl font-bold ${saldoCC > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {saldoCC > 0 ? `Debe ${formatARS(saldoCC)}` : 'Sin deuda'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
