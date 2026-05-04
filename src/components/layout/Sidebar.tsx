'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navSections = [
  {
    label: 'GESTIÓN',
    items: [
      {
        href: '/',
        label: 'Inicio',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
      {
        href: '/ventas',
        label: 'Ventas',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
          </svg>
        ),
      },
      {
        href: '/clientes',
        label: 'Clientes',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        href: '/stock',
        label: 'Stock',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'FINANZAS',
    items: [
      {
        href: '/deudores',
        label: 'Deudores',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
      },
    ],
  },
]

export function Sidebar({ userEmail, isAdmin }: { userEmail: string; isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-[#111111] border-r border-[#1e1e1e] fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#1e1e1e]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold tracking-widest text-white">VARU</span>
              <p className="text-[10px] text-[#444] leading-none mt-0.5">Distribuidora</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="px-3 text-[10px] font-semibold text-[#333] tracking-widest mb-1.5">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-600/20'
                          : 'text-[#555] hover:bg-[#1a1a1a] hover:text-[#aaa]'
                      }`}
                    >
                      <span className={active ? 'text-blue-400' : 'text-[#444]'}>{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-[#1e1e1e]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-[#888]">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#666] truncate">{userEmail}</p>
              <p className="text-[10px] text-[#333]">{isAdmin ? 'Admin' : 'Encargado'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#1e1e1e] z-30 flex">
        {navSections.flatMap(s => s.items).map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2.5 text-[10px] font-medium transition-colors gap-1 ${
                active ? 'text-blue-400' : 'text-[#444]'
              }`}
            >
              {item.icon}
              <span className="mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
