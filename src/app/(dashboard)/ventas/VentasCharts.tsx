/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { formatARS, formatDateShort } from '@/lib/utils'

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
  const chartData = porDia.map(d => ({ fecha: formatDateShort(d.fecha), total: d.total }))
  const maxFact = topProductos[0]?.total ?? 1
  const maxGanancia = Math.max(...topProductos.map(p => p.ganancia))

  return (
    <div className="space-y-6">
      {/* Gráfico de barras */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Facturación por día</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fill: '#444', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={44} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
              <Bar dataKey="total" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top productos con margen real */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#222]">
          <h2 className="text-sm font-semibold text-white">Top productos</h2>
          <p className="text-xs text-[#444] mt-0.5">Facturación y ganancia bruta del período</p>
        </div>
        <div className="divide-y divide-[#1e1e1e]">
          {topProductos.map((p, i) => (
            <div key={i} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <span className="text-sm text-[#ccc] min-w-0">
                  <span className="text-[#333] mr-2 text-xs">{i + 1}.</span>{p.nombre}
                </span>
                <div className="text-right shrink-0">
                  <p className="text-sm text-white font-medium">{formatARS(p.total)}</p>
                  {p.ganancia > 0 && (
                    <p className="text-xs text-emerald-400">+{formatARS(p.ganancia)} ganancia</p>
                  )}
                  {p.ganancia === 0 && p.margen_pct === 0 && (
                    <p className="text-xs text-yellow-500">sin margen cargado</p>
                  )}
                </div>
              </div>
              {/* Barra de progreso facturación */}
              <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(p.total / maxFact) * 100}%` }}
                />
              </div>
              {p.ganancia > 0 && (
                <div className="h-0.5 bg-[#1a1a1a] rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-emerald-500/60 rounded-full"
                    style={{ width: `${(p.ganancia / maxGanancia) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
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
  )
}
