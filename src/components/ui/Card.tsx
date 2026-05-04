import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5', className)}>
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  sub?: string
  color?: 'default' | 'green' | 'red' | 'yellow' | 'blue'
}

export function StatCard({ label, value, sub, color = 'default' }: StatCardProps) {
  const colorMap = {
    default: 'text-white',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
  }

  return (
    <Card>
      <p className="text-xs text-[#666] uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-[#555] mt-1">{sub}</p>}
    </Card>
  )
}
