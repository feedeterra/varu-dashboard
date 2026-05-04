import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Determine role: if email contains 'admin' or matches owner email → admin
  // Adjust this logic to match your actual role setup
  const adminEmails = ['ffedericoterrazas@gmail.com']
  const isAdmin = adminEmails.includes(user.email ?? '') ||
    (user.user_metadata?.role === 'admin')

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar userEmail={user.email ?? ''} isAdmin={isAdmin} />
      {/* Main content — offset for sidebar on desktop */}
      <main className="md:ml-56 pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
