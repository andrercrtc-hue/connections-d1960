'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Calendar, Users, Bell, FileText, Globe, Heart, TrendingUp, Home } from 'lucide-react'

export default function DashboardPage() {
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('perfis')
        .select('primeiro_nome')
        .eq('id', user.id)
        .single()

      setPerfil(data)
      setLoading(false)
    }
    loadData()
  }, [router])

  if (loading) return <div className="flex justify-center items-center h-[60vh] text-gray-400">A carregar o teu resumo distrital...</div>

  const firstName = perfil?.primeiro_nome || 'Companheiro'

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      
      {/* HERO SECTION */}
      <section className="bg-[#003d7a] rounded-[32px] p-12 text-white relative overflow-hidden flex justify-between items-center min-h-[350px] shadow-lg">
        {/* Padrão de Fundo */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
        
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#fca311] text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest mb-6 inline-block shadow-sm">
            Distrito 1960
          </span>
          <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Olá, {firstName}. Aqui está um resumo do Distrito 1960
          </h1>
          <p className="text-blue-100 text-lg mb-10 opacity-90 leading-relaxed max-w-md">
            Bem-vindo ao seu painel de controlo. Acompanhe o impacto das nossas iniciativas e a vitalidade dos clubes sob a sua liderança.
          </p>
          <div className="flex gap-4">
            <button className="bg-[#8b5e34] hover:bg-[#724d2b] px-6 py-3 lg:px-8 lg:py-4 rounded-xl font-bold flex items-center gap-3 transition shadow-lg text-sm lg:text-base">
              Explorar clubes <Globe size={18}/>
            </button>
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-6 py-3 lg:px-8 lg:py-4 rounded-xl font-bold flex items-center gap-3 transition text-sm lg:text-base">
              Ver calendário <Calendar size={18}/>
            </button>
          </div>
        </div>

        {/* Imagem Flutuante */}
        <div className="relative z-10 hidden xl:block w-[400px] h-[280px] rounded-[24px] overflow-hidden border-8 border-white/10 shadow-2xl rotate-2">
           <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Equipa" />
        </div>
      </section>

      {/* CARDS DE ESTATÍSTICAS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Clubes" value="74" trend="+2 este mês" icon={<Home className="text-blue-400 opacity-20" size={48}/>} />
        <StatCard label="Membros Ativos" value="2,150" trend="+12% anual" icon={<Users className="text-orange-400 opacity-20" size={48}/>} />
        <StatCard label="Eventos" value="18" trend="Agendados p/ Junho" icon={<Bell className="text-pink-400 opacity-20" size={48}/>} />
        <StatCard label="Anúncios" value="5" trend="Pendentes de revisão" icon={<FileText className="text-gray-400 opacity-20" size={48}/>} />
      </section>

      {/* GRELHA INFERIOR (Calendário e Anúncios) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Calendário */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
              <Calendar className="text-[#004a99]" size={24}/> Calendário Distrital
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
        <div className="space-y-6">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
            <Bell className="text-[#004a99]" size={24}/> Anúncios
          </h3>
          <div className="space-y-4">
            <NewsCard category="IMPORTANTE" time="Há 2 horas" title="Relatório Anual de Sustentabilidade" desc="Caros companheiros, o prazo para submissão dos relatórios de..." color="border-l-[#8b5e34]" />
            <NewsCard category="SAÚDE" time="Ontem" title="Campanha Polio Plus: Resultados" desc="Alcançámos 95% do objetivo de angariação para este trimestre..." color="border-l-red-500" />
            
            {/* Desafio do Governador */}
            <div className="bg-[#003d7a] rounded-[24px] p-8 text-white relative overflow-hidden group shadow-md mt-6">
              <h4 className="text-xl font-bold mb-2 relative z-10">Desafio do Governador</h4>
              <p className="text-sm text-blue-200 mb-6 relative z-10 leading-relaxed">Qual clube terá o maior crescimento líquido de sócios este semestre?</p>
              <button className="bg-white text-[#003d7a] w-full py-3 rounded-xl font-black text-xs relative z-10 group-hover:scale-105 transition-transform shadow-lg">Consultar Ranking</button>
              <div className="absolute bottom-[-20px] right-[-20px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                <Heart size={140} />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

/* Componentes Auxiliares apenas para os Cards desta página */
function StatCard({ label, value, trend, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition cursor-default">
      <div className="relative z-10">
        <p className="text-sm font-bold text-gray-400 mb-1">{label}</p>
        <p className="text-4xl font-black text-gray-800 mb-3">{value}</p>
        <div className="flex items-center gap-2 text-[#004a99] font-bold text-[11px] bg-blue-50 w-max px-3 py-1.5 rounded-lg uppercase tracking-wider">
          <TrendingUp size={14}/> {trend}
        </div>
      </div>
      <div className="absolute top-6 right-6 group-hover:scale-110 transition-transform">{icon}</div>
    </div>
  )
}

function EventItem({ date, title, loc, tag, time, border = true }: any) {
  return (
    <div className={`p-8 flex items-center gap-6 hover:bg-gray-50 transition cursor-pointer ${border ? 'border-b border-gray-100' : ''}`}>
      <div className="bg-blue-50 text-[#004a99] min-w-[80px] h-20 rounded-2xl flex flex-col items-center justify-center font-black leading-tight border border-blue-100/50 shadow-inner">
        <span className="text-[10px] uppercase tracking-widest">{date.split(' ')[1]}</span>
        <span className="text-2xl">{date.split(' ')[0]}</span>
      </div>
      <div>
        <h4 className="text-[17px] font-black text-gray-800 mb-1.5">{title}</h4>
        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
          <Globe size={14} className="text-gray-400"/> {loc}
        </div>
        {tag && (
          <div className="flex items-center gap-3 mt-3">
             <span className="bg-[#ffead1] text-[#854d0e] text-[10px] font-black px-2 py-1 rounded tracking-widest shadow-sm">{tag}</span>
             <span className="text-gray-400 text-[10px] font-bold uppercase">{time}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function NewsCard({ category, time, title, desc, color }: any) {
  return (
    <div className={`bg-white p-6 rounded-[24px] border border-gray-100 border-l-4 ${color} shadow-sm hover:shadow-md transition cursor-pointer`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-black tracking-widest text-orange-800 bg-orange-50 px-2 py-1 rounded">{category}</span>
        <span className="text-[10px] font-bold text-gray-400">{time}</span>
      </div>
      <h4 className="font-black text-gray-800 text-[15px] mb-2 leading-tight">{title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">{desc}</p>
      <button className="text-[#004a99] text-[10px] font-black uppercase hover:underline flex items-center gap-1">
        Ler mais
      </button>
    </div>
  )
}