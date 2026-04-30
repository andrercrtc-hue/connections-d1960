'use client'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Home, Briefcase, Calendar, Users, 
  ClipboardList, HelpCircle, LogOut, Award
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { icon: <LayoutDashboard size={20}/>, label: "Painel Principal", path: "/dashboard" },
    { icon: <Home size={20}/>, label: "O meu Clube", path: "/dashboard/clube" },
    { icon: <Award size={20}/>, label: "Equipa Distrital", path: "/equipa-distrital" },
    { icon: <Briefcase size={20}/>, label: "Projetos", path: "/dashboard/projetos" },
    { icon: <Calendar size={20}/>, label: "Calendário", path: "/dashboard/calendario" },
    { icon: <Users size={20}/>, label: "Diretório", path: "/dashboard/diretorio" },
    { icon: <ClipboardList size={20}/>, label: "Relatórios", path: "/dashboard/relatorios" },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20">
      {/* LOGO */}
      <div className="p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#004a99] rounded-lg flex items-center justify-center text-white font-bold">R</div>
          <div>
            <h2 className="text-[#004a99] font-black text-lg leading-tight">Distrito Rotary</h2>
            <p className="text-[10px] text-gray-400 font-medium">Servir para Transformar</p>
          </div>
        </div>
      </div>
      
      {/* MENU NAV */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              pathname === item.path 
                ? 'bg-blue-50 text-[#004a99] border-l-4 border-[#004a99]' 
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>

      {/* FOOTER DA SIDEBAR */}
      <div className="p-6 space-y-6">
        <button className="w-full bg-[#fca311] hover:bg-[#e8960f] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-100 transition-all">
          Fazer Doação
        </button>
        
        <div className="space-y-4 pt-4 border-t border-gray-50 text-gray-400">
          <button className="flex items-center gap-3 text-xs font-bold hover:text-[#004a99] transition">
            <HelpCircle size={18}/> Apoio Técnico
          </button>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            className="flex items-center gap-3 text-xs font-bold hover:text-red-500 transition"
          >
            <LogOut size={18}/> Sair
          </button>
        </div>
      </div>
    </aside>
  )
}