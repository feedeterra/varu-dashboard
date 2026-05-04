'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Inicio', icon: '⊞', adminOnly: false },
  { href: '/ventas', label: 'Ventas', icon: '📊', adminOnly: false },
  { href: '/clientes', label: 'Clientes', icon: '👥', adminOnly: false },
  { href: '/deudores', label: 'Deudores', icon: '⚠', adminOnly: false },
  { href: '/envios', label: 'Envíos', icon: '📦', adminOnly: false },
]

interface SidebarProps {
  userEmail: string
  isAdmin: boolean
}

export function Sidebar({ userEmail, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-[#111111] border-r border-[#222] fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#222]">
          <span className="text-2xl font-black tracking-widest text-white">VARU</span>
          <p className="text-xs text-[#555] mt-0.5">Distribuidora</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-[#aaa] hover:bg-[#1e1e1e] hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-[#222]">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-[#555] truncate">{userEmail}</p>
            <p className="text-xs text-[#444]">{isAdmin ? 'Admin' : 'Encargado'}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#888] hover:bg-[#1e1e1e] hover:text-red-400 transition-colors"
          >
            {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#222] z-30 flex">
        {visibleItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                active ? 'text-blue-400' : 'text-[#666]'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
