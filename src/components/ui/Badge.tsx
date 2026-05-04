import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'green' | 'red' | 'yellow' | 'blue' | 'gray'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#2a2a2a] text-[#aaa]',
  green: 'bg-green-900/40 text-green-400 border border-green-800/40',
  red: 'bg-red-900/40 text-red-400 border border-red-800/40',
  yellow: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/40',
  blue: 'bg-blue-900/40 text-blue-400 border border-blue-800/40',
  gray: 'bg-[#222] text-[#777]',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  )
}
