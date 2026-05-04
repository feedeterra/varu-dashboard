import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar userEmail="varu" isAdmin={true} />
      <main className="md:ml-56 pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
