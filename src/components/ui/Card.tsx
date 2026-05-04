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
  icon?: React.ReactNode
  badge?: { value: string; positive: boolean } | null
}

export function StatCard({ label, value, sub, color = 'default', icon, badge }: StatCardProps) {
  const colorMap = {
    default: 'text-white',
    green: 'text-emerald-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
  }

  const bgMap = {
    default: 'bg-[#ffffff08]',
    green: 'bg-emerald-500/10',
    red: 'bg-red-500/10',
    yellow: 'bg-yellow-500/10',
    blue: 'bg-blue-500/10',
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        {icon && (
          <div className={cn('p-2 rounded-lg', bgMap[color])}>
            <span className={colorMap[color]}>{icon}</span>
          </div>
        )}
        {badge && (
          <span className={cn(
            'ml-auto text-xs font-semibold px-2 py-0.5 rounded-full',
            badge.positive
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-red-500/15 text-red-400'
          )}>
            {badge.positive ? '+' : ''}{badge.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-[#555] uppercase tracking-wider mb-1">{label}</p>
        <p className={cn('text-2xl font-bold', colorMap[color])}>{value}</p>
        {sub && <p className="text-xs text-[#444] mt-1">{sub}</p>}
      </div>
    </div>
  )
}
