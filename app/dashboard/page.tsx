'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Users, Calendar, FileText, 
  Settings, LogOut, Bell, Search, Briefcase, 
  Heart, ChevronRight, MessageSquare, Info,
  TrendingUp, Home, ClipboardList
} from 'lucide-react'

type Perfil = {
  nome: string
  cargo: string
}

export default function Dashboard() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('perfis')
        .select('nome, cargo')
        .eq('id', user.id)
        .single()

      setPerfil(data || { nome: 'Companheiro', cargo: 'socio' })
      setLoading(false)
    }
    loadData()
  }, [router])

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50">Carregando Nexus...</div>

  const firstName = perfil?.nome?.split(' ')[0] || 'Companheiro'

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#004a99] rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <div>
              <h2 className="text-[#004a99] font-black text-lg leading-tight">Distrito Rotary</h2>
              <p className="text-[10px] text-gray-400 font-medium">Servir para Transformar</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Painel Principal" active />
          <SidebarItem icon={<Home size={20}/>} label="O meu Clube" />
          <SidebarItem icon={<Briefcase size={20}/>} label="Projetos" />
          <SidebarItem icon={<Calendar size={20}/>} label="Calendário" />
          <SidebarItem icon={<Users size={20}/>} label="Diretório" />
          <SidebarItem icon={<ClipboardList size={20}/>} label="Relatórios" />
        </nav>

        <div className="p-6 space-y-6">
          <button className="w-full bg-[#fca311] hover:bg-[#e8960f] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-100 transition-all">
            Fazer Doação
          </button>
          
          <div className="space-y-4 pt-4 border-t border-gray-50 text-gray-400">
            <button className="flex items-center gap-3 text-xs font-bold hover:text-[#004a99] transition">
              <HelpCircleIcon size={18}/> Apoio Técnico
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

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 ml-64 flex flex-col">
        
        {/* TOP NAV */}
        <header className="h-20 bg-white border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <h2 className="text-[#004a99] font-black tracking-tighter text-xl">ROTARY NEXUS</h2>
            <nav className="hidden md:flex gap-6">
              <a href="#" className="text-sm font-bold text-[#004a99] border-b-2 border-[#004a99] pb-1">Portal</a>
              <a href="#" className="text-sm font-bold text-gray-400 hover:text-gray-600 transition">Recursos</a>
              <a href="#" className="text-sm font-bold text-gray-400 hover:text-gray-600 transition">Documentos</a>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-gray-400">
              <Bell size={20} className="cursor-pointer hover:text-gray-600"/>
              <Settings size={20} className="cursor-pointer hover:text-gray-600"/>
            </div>
            <div className="h-10 w-[1px] bg-gray-100 mx-2"></div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-sm font-bold text-gray-800 leading-tight">{perfil?.nome || 'Utilizador'}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{perfil?.cargo === 'governador' ? 'Governador Distrital' : 'Membro de Clube'}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full overflow-hidden border-2 border-white shadow-sm">
                 <img src="https://ui-avatars.com/api/?name=Andre+Silva&background=004a99&color=fff" alt="Perfil" />
              </div>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="px-10 py-8">
          <div className="bg-[#003d7a] rounded-[32px] p-12 text-white relative overflow-hidden flex justify-between items-center min-h-[400px]">
            {/* Grelha Decorativa no Fundo */}
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', size: '20px 20px'}}></div>
            
            <div className="relative z-10 max-w-xl">
              <span className="bg-[#fca311] text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest mb-6 inline-block">
                Distrito 1960
              </span>
              <h1 className="text-6xl font-bold mb-6 leading-tight">
                Olá, {firstName}. Aqui está um resumo do Distrito 1960
              </h1>
              <p className="text-blue-100 text-lg mb-10 opacity-80 leading-relaxed">
                Bem-vindo ao seu painel de controlo. Acompanhe o impacto das nossas iniciativas e a vitalidade dos clubes sob a sua liderança.
              </p>
              <div className="flex gap-4">
                <button className="bg-[#8b5e34] hover:bg-[#724d2b] px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition shadow-lg">
                  Explorar clubes <GlobeIcon size={18}/>
                </button>
                <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition">
                  Ver calendário <Calendar size={18}/>
                </button>
              </div>
            </div>

            {/* Imagem de Destaque */}
            <div className="relative z-10 hidden xl:block w-[450px] h-[350px] rounded-[24px] overflow-hidden border-8 border-white/10 shadow-2xl rotate-2">
               <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Equipa" />
            </div>
          </div>
        </section>

        {/* ESTATÍSTICAS */}
        <section className="px-10 grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard label="Clubes" value="74" trend="+2 este mês" icon={<Home className="text-blue-400 opacity-20" size={48}/>} />
          <StatCard label="Membros Ativos" value="2,150" trend="+12% anual" icon={<Users className="text-orange-400 opacity-20" size={48}/>} />
          <StatCard label="Eventos" value="18" trend="Agendados p/ Junho" icon={<Bell className="text-pink-400 opacity-20" size={48}/>} />
          <StatCard label="Anúncios" value="5" trend="Pendentes de revisão" icon={<FileText className="text-gray-400 opacity-20" size={48}/>} />
        </section>

        {/* COLUNAS DE CONTEÚDO */}
        <section className="px-10 grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">
          
          {/* Calendário Distrital */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                <Calendar className="text-[#004a99]" /> Calendário Distrital
              </h3>
              <a href="#" className="text-sm font-bold text-[#004a99] hover:underline">Ver todo o calendário</a>
            </div>
            
            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
              <EventItem date="15 JUN" title="Conferência Distrital de Liderança" loc="Fundação Calouste Gulbenkian, Lisboa" tag="EVENTO VIP" time="09:00 - 18:00" />
              <EventItem date="22 JUN" title="Webinar: Projetos de Impacto Comunitário" loc="Plataforma Zoom Distrital" />
              <EventItem date="04 JUL" title="Jantar de Transmissão de Tarefas" loc="Hotel Vila Galé, Cascais" border={false} />
            </div>
          </div>

          {/* Anúncios */}
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <Bell className="text-[#004a99]" /> Anúncios
            </h3>
            
            <div className="space-y-6">
              <NewsCard category="IMPORTANTE" time="Há 2 horas" title="Relatório Anual de Sustentabilidade" desc="Caros companheiros, o prazo para submissão dos relatórios de..." color="border-l-[#8b5e34]" />
              <NewsCard category="SAÚDE" time="Ontem" title="Campanha Polio Plus: Resultados" desc="Alcançámos 95% do objetivo de angariação para este trimestre..." color="border-l-red-500" />
              
              <div className="bg-[#003d7a] rounded-[24px] p-6 text-white relative overflow-hidden group">
                <h4 className="text-xl font-bold mb-2 relative z-10">Desafio do Governador</h4>
                <p className="text-sm text-blue-200 mb-6 relative z-10">Qual clube terá o maior crescimento líquido de sócios este semestre?</p>
                <button className="bg-white text-[#003d7a] w-full py-3 rounded-xl font-black text-xs relative z-10 group-hover:scale-105 transition">Consultar Ranking</button>
                <div className="absolute bottom-[-20px] right-[-20px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                  <Heart size={120} />
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

/* COMPONENTES AUXILIARES */

function SidebarItem({ icon, label, active = false }: any) {
  return (
    <a href="#" className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all ${active ? 'bg-blue-50 text-[#004a99] border-l-4 border-[#004a99]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
      {icon} {label}
    </a>
  )
}

function StatCard({ label, value, trend, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
      <div className="relative z-10">
        <p className="text-sm font-bold text-gray-400 mb-1">{label}</p>
        <p className="text-4xl font-black text-gray-800 mb-2">{value}</p>
        <div className="flex items-center gap-2 text-[#004a99] font-bold text-xs bg-blue-50 w-max px-2 py-1 rounded-lg">
          <TrendingUp size={14}/> {trend}
        </div>
      </div>
      <div className="absolute top-6 right-6 group-hover:scale-110 transition-transform">{icon}</div>
    </div>
  )
}

function EventItem({ date, title, loc, tag, time, border = true }: any) {
  return (
    <div className={`p-8 flex items-center gap-8 hover:bg-gray-50 transition cursor-pointer ${border ? 'border-b border-gray-50' : ''}`}>
      <div className="bg-blue-50 text-[#004a99] w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black leading-tight">
        <span className="text-[10px] uppercase">{date.split(' ')[1]}</span>
        <span className="text-2xl">{date.split(' ')[0]}</span>
      </div>
      <div>
        <h4 className="text-xl font-black text-gray-800 mb-1">{title}</h4>
        <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
          <GlobeIcon size={14} /> {loc}
        </div>
        {tag && (
          <div className="flex items-center gap-3 mt-3">
             <span className="bg-[#ffead1] text-[#854d0e] text-[10px] font-black px-2 py-1 rounded tracking-widest">{tag}</span>
             <span className="text-gray-400 text-[10px] font-bold uppercase">{time}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function NewsCard({ category, time, title, desc, color }: any) {
  return (
    <div className={`bg-white p-6 rounded-[24px] border border-gray-100 border-l-4 ${color} shadow-sm hover:shadow-md transition`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-black tracking-widest text-orange-800">{category}</span>
        <span className="text-[10px] font-bold text-gray-400">{time}</span>
      </div>
      <h4 className="font-black text-gray-800 mb-2 leading-tight">{title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">{desc}</p>
      <button className="text-[#004a99] text-[10px] font-black uppercase hover:underline">Ler mais</button>
    </div>
  )
}

function HelpCircleIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
}

function GlobeIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
}