// app/(dashboard)/layout.tsx
import { Sidebar } from '@/app/menu-components/sidebar'
import { TopNav } from '@/app/menu-components/TopNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar fixa à esquerda */}
      <Sidebar />

      {/* Área de conteúdo à direita da sidebar */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* TopNav fixa no topo do conteúdo */}
        <TopNav />

        {/* Onde o conteúdo das páginas (page.tsx) será injetado */}
        <main className="p-10 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}