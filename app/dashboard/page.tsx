'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Users, BookOpen, Calendar, 
  MessageSquare, FileText, User, Settings, LogOut, Bell
} from 'lucide-react' // Importação dos ícones

export default function Dashboard() {
  const [perfil, setPerfil] = useState<any>(null)
  const router = useRouter()

  // Carregar dados do utilizador logado
  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login') // Se não estiver logado, volta para o login
        return
      }

      // Procurar o nome na tabela 'perfis'
      const { data } = await supabase
        .from('perfis')
        .select('*, clubes(nome)')
        .eq('id', user.id)
        .single()
      
      setPerfil(data)
    }
    getProfile()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      
      {/* --- BARRA LATERAL (SIDEBAR) --- */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 sticky h-screen top-0">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
          <span className="font-bold text-gray-800 leading-tight">Distrito 1960<br/><span className="text-pink-600">Connections</span></span>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-4 ml-2">Principal</p>
          <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active />
          <NavItem icon={<BookOpen size={18}/>} label="Diretório de Clubes" />
          <NavItem icon={<Users size={18}/>} label="O Meu Clube" />
          <NavItem icon={<Calendar size={18}/>} label="Calendário" />
          <NavItem icon={<FileText size={18}/>} label="Documentos" />
          
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-8 mb-4 ml-2">Administração</p>
          <NavItem icon={<Settings size={18}/>} label="Definições" />
        </nav>

        {/* Perfil do Utilizador no fundo da Sidebar */}
        <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">
              {perfil?.nome_completo?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-800 truncate">{perfil?.nome_completo || 'Utilizador'}</p>
              <p className="text-[10px] text-gray-400 truncate">{perfil?.clubes?.nome || 'Sem Clube'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-pink-600 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 p-8">
        
        {/* Top Header */}
        <header className="flex justify-between items-center mb-8">
          <p className="text-sm text-gray-500 font-medium">Portal Distrital • D1960</p>
          <div className="flex items-center gap-3 bg-green-50 text-green-700 px-4 py-2 rounded-full text-xs font-bold border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Sessão iniciada
          </div>
        </header>

        {/* Banner Hero (Gradiente Rosa/Laranja) */}
        <section className="bg-gradient-to-r from-[#e11d48] to-[#fb923c] rounded-[2rem] p-10 text-white mb-8 shadow-xl shadow-pink-100 relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Representadoria Distrital</span>
            <h2 className="text-4xl font-bold mt-4 mb-2">Olá, {perfil?.nome_completo?.split(' ')[0] || 'Companheiro'}.</h2>
            <p className="text-white/80 max-w-md text-sm">Aqui está um resumo do Distrito 1960: eventos próximos, novidades dos clubes e comunicados oficiais.</p>
            
            <div className="flex gap-4 mt-8">
              <button className="bg-white text-[#e11d48] px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">Ver calendário</button>
              <button className="bg-white/10 border border-white/20 px-6 py-2 rounded-xl font-bold text-sm hover:bg-white/20 transition-all">Explorar clubes</button>
            </div>
          </div>
        </section>

        {/* Grelha de Estatísticas (Cards pequenos) */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard label="Clubes do D1960" value="32" sub="-2 este ano" />
          <StatCard label="Membros Ativos" value="1.284" sub="+48 este mês" />
          <StatCard label="Eventos a Chegar" value="7" sub="Próx. 30 dias" />
          <StatCard label="Anúncios Novos" value="3" sub="Esta semana" />
        </section>

        {/* Secção de Calendário e Anúncios */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna Calendário */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6">Calendário Distrital</h3>
            <div className="space-y-6">
              <EventItem date="24 ABR" title="Assembleia Distrital de Primavera" location="Coimbra" tag="Oficial" />
              <EventItem date="03 MAI" title="Visita oficial - Clube do Porto" location="Porto" tag="Visita" />
            </div>
          </div>

          {/* Coluna Anúncios */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6">Anúncios da Representadoria</h3>
            <div className="space-y-6">
              <NewsItem title="Novo manual de marca disponível" date="há 2h" />
              <NewsItem title="Inscrições abertas para a Assembleia" date="há 1d" />
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

/* --- COMPONENTES AUXILIARES (Para facilitar a edição) --- */

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-pink-600 text-white shadow-lg shadow-pink-100' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function EventItem({ date, title, location, tag }: { date: string, title: string, location: string, tag: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-pink-50 text-pink-600 p-2 rounded-xl text-center min-w-[60px]">
        <p className="text-[10px] font-bold uppercase">{date.split(' ')[1]}</p>
        <p className="text-lg font-bold leading-tight">{date.split(' ')[0]}</p>
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400">{location}</p>
      </div>
      <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full uppercase">{tag}</span>
    </div>
  )
}

function NewsItem({ title, date }: { title: string, date: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full mt-1.5" />
      <div>
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-[10px] text-gray-400 uppercase mt-1">{date}</p>
      </div>
    </div>
  )
}