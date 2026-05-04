/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { formatARS, formatDateShort } from '@/lib/utils'
import { useState } from 'react'

interface DayData { fecha: string; total: number }
interface ProductoData { nombre: string; total: number; cantidad: number; ganancia: number; margen_pct: number }
interface ClienteData { razon_social: string; total: number; operaciones: number }

interface Props {
  porDia: DayData[]
  topProductos: ProductoData[]
  topClientes: ClienteData[]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm">
        <p className="text-[#666] mb-1 text-xs">{label}</p>
        <p className="text-white font-semibold">{formatARS(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function VentasCharts({ porDia, topProductos, topClientes }: Props) {
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  const chartData = porDia.map(d => ({ fecha: formatDateShort(d.fecha), fechaRaw: d.fecha, total: d.total }))
  const maxFact = topProductos[0]?.total ?? 1

  return (
    <div className="grid lg:grid-cols-2 gap-6">

      {/* Columna izquierda: gráfico por día + top clientes */}
      <div className="space-y-4">

        {/* Gráfico de barras compacto */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Facturación por día</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                onClick={(d: any) => setDiaSeleccionado(d?.activePayload?.[0]?.payload?.fechaRaw ?? null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fill: '#444', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#444', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={44} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                <Bar dataKey="total" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={diaSeleccionado === entry.fechaRaw ? '#60a5fa' : '#3b82f6'}
                      opacity={diaSeleccionado && diaSeleccionado !== entry.fechaRaw ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {diaSeleccionado && (
            <button onClick={() => setDiaSeleccionado(null)} className="text-xs text-[#444] hover:text-white mt-2 transition-colors">
              ✕ Limpiar filtro
            </button>
          )}
        </div>

        {/* Top clientes */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222]">
            <h2 className="text-sm font-semibold text-white">Top clientes</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                <th className="px-5 py-2 text-left text-xs text-[#444]">Cliente</th>
                <th className="px-5 py-2 text-right text-xs text-[#444]">Remitos</th>
                <th className="px-5 py-2 text-right text-xs text-[#444]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {topClientes.map((c, i) => (
                <tr key={i} className="hover:bg-[#1f1f1f] transition-colors">
                  <td className="px-5 py-2.5 text-[#ccc] text-xs truncate max-w-[160px]">
                    <span className="text-[#333] mr-2">{i + 1}.</span>{c.razon_social}
                  </td>
                  <td className="px-5 py-2.5 text-right text-[#555] text-xs">{c.operaciones}</td>
                  <td className="px-5 py-2.5 text-right text-white text-xs font-medium">{formatARS(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Columna derecha: top productos */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#222]">
          <h2 className="text-sm font-semibold text-white">Top productos</h2>
          <p className="text-xs text-[#444] mt-0.5">Cantidad · Facturación · Ganancia</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                <th className="px-5 py-2.5 text-left text-xs text-[#444] font-medium">#</th>
                <th className="px-5 py-2.5 text-left text-xs text-[#444] font-medium">Producto</th>
                <th className="px-5 py-2.5 text-right text-xs text-[#444] font-medium">Cant.</th>
                <th className="px-5 py-2.5 text-right text-xs text-[#444] font-medium">Facturación</th>
                <th className="px-5 py-2.5 text-right text-xs text-[#444] font-medium">Ganancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {topProductos.map((p, i) => (
                <tr key={i} className="hover:bg-[#1f1f1f] transition-colors group">
                  <td className="px-5 py-3 text-[#333] text-xs">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-xs text-[#ccc] truncate max-w-[180px]">{p.nombre}</p>
                      {/* Barra de progreso */}
                      <div className="h-1 bg-[#222] rounded-full overflow-hidden mt-1.5 max-w-[180px]">
                        <div className="h-full bg-blue-600/60 rounded-full" style={{ width: `${(p.total / maxFact) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-[#888] text-xs">{p.cantidad}</td>
                  <td className="px-5 py-3 text-right text-white text-xs font-medium whitespace-nowrap">{formatARS(p.total)}</td>
                  <td className="px-5 py-3 text-right text-xs whitespace-nowrap">
                    {p.ganancia > 0
                      ? <span className="text-emerald-400 font-medium">{formatARS(p.ganancia)}</span>
                      : <span className="text-yellow-600">sin costo</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
