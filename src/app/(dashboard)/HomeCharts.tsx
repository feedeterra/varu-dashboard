'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatARS, formatDateShort } from '@/lib/utils'

interface DayData { fecha: string; total: number }

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

export function HomeCharts({ porDia }: { porDia: DayData[] }) {
  const chartData = porDia.map(d => ({ fecha: formatDateShort(d.fecha), total: d.total }))

  if (chartData.length === 0) return null

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Facturación del mes</h2>
        <span className="text-xs text-[#444]">{chartData.length} días con ventas</span>
      </div>
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
  )
}
