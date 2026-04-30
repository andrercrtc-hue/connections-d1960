// app/(dashboard)/layout.tsx
'use client'
import { Sidebar } from './menu-components/sidebar'
import { TopNav } from './menu-components/TopNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar fixa à esquerda com largura de 64 (w-64) */}
      <Sidebar />

      {/* Área de conteúdo que compensa a largura da sidebar (ml-64) */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Barra superior fixa */}
        <TopNav />

        {/* Onde as tuas páginas (dashboard, perfil, etc) vão aparecer */}
        <main className="p-10 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}