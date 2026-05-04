/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { formatARS, formatDateShort } from '@/lib/utils'

interface DayData {
  fecha: string
  total: number
}

interface ProductoData {
  nombre: string
  total: number
  cantidad: number
}

interface ClienteData {
  razon_social: string
  total: number
  operaciones: number
}

interface Props {
  porDia: DayData[]
  topProductos: ProductoData[]
  topClientes: ClienteData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm">
        <p className="text-[#888] mb-1">{label}</p>
        <p className="text-white font-semibold">{formatARS(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function VentasCharts({ porDia, topProductos, topClientes }: Props) {
  const chartData = porDia.map(d => ({
    fecha: formatDateShort(d.fecha),
    total: d.total,
  }))

  return (
    <div className="space-y-6">
      {/* Gráfico de barras */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Facturación por día (últimos 30 días)</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis
                dataKey="fecha"
                tick={{ fill: '#555', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#555', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
              <Bar dataKey="total" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top productos */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222]">
            <h2 className="text-sm font-semibold text-white">Top 10 productos del mes</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                <th className="px-5 py-2 text-left text-xs text-[#555]">Producto</th>
                <th className="px-5 py-2 text-right text-xs text-[#555]">Uds.</th>
                <th className="px-5 py-2 text-right text-xs text-[#555]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {topProductos.map((p, i) => (
                <tr key={i} className="hover:bg-[#1f1f1f] transition-colors">
                  <td className="px-5 py-2.5 text-[#ccc] text-xs truncate max-w-[140px]">
                    <span className="text-[#444] mr-2">{i + 1}.</span>{p.nombre}
                  </td>
                  <td className="px-5 py-2.5 text-right text-[#666] text-xs">{p.cantidad}</td>
                  <td className="px-5 py-2.5 text-right text-white text-xs font-medium">{formatARS(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top clientes */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222]">
            <h2 className="text-sm font-semibold text-white">Top 10 clientes del mes</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                <th className="px-5 py-2 text-left text-xs text-[#555]">Cliente</th>
                <th className="px-5 py-2 text-right text-xs text-[#555]">Ops.</th>
                <th className="px-5 py-2 text-right text-xs text-[#555]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {topClientes.map((c, i) => (
                <tr key={i} className="hover:bg-[#1f1f1f] transition-colors">
                  <td className="px-5 py-2.5 text-[#ccc] text-xs truncate max-w-[140px]">
                    <span className="text-[#444] mr-2">{i + 1}.</span>{c.razon_social}
                  </td>
                  <td className="px-5 py-2.5 text-right text-[#666] text-xs">{c.operaciones}</td>
                  <td className="px-5 py-2.5 text-right text-white text-xs font-medium">{formatARS(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
