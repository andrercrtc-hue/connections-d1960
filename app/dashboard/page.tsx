'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Users, Calendar, FileText, 
  Settings, LogOut, ShieldCheck, ChevronRight 
} from 'lucide-react'

type Perfil = {
  nome: string
  cargo: string
  clube?: string
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
        .select('nome, cargo, clube')
        .eq('id', user.id)
        .single()

      setPerfil(data || { nome: 'Companheiro', cargo: 'socio' })
      setLoading(false)
    }
    loadData()
  }, [router])

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#fce7f3]">Carregando Distrito 1960...</div>

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6">
          <h2 className="text-[#e11d48] font-bold text-xl tracking-tight">Distrito 1960</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Connections</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <p className="px-2 pb-2 text-[10px] font-bold text-gray-400 uppercase">Principal</p>
          <a href="#" className="flex items-center gap-3 px-3 py-2 bg-pink-50 text-[#e11d48] rounded-xl font-medium text-sm">
            <LayoutDashboard size={18} /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-50 rounded-xl text-sm transition">
            <Users size={18} /> Diretório de Clubes
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-50 rounded-xl text-sm transition">
            <Calendar size={18} /> Calendário
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-50 rounded-xl text-sm transition">
            <FileText size={18} /> Documentos
          </a>

          {/* SÓ APARECE PARA ADMIN OU GOVERNADOR */}
          {(perfil?.cargo === 'governador' || perfil?.cargo === 'administrador') && (
            <div className="mt-8">
              <p className="px-2 pb-2 text-[10px] font-bold text-gray-400 uppercase">Administração</p>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-50 rounded-xl text-sm transition">
                <Settings size={18} /> Definições
              </a>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            className="flex items-center gap-3 px-3 py-2 w-full text-gray-400 hover:text-red-500 transition text-sm"
          >
            <LogOut size={18} /> Sair da conta
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-sm font-medium text-gray-400">Portal Distrital • D1960</h1>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">Sessão Iniciada • {perfil?.cargo}</span>
          </div>
        </header>

        {/* BANNER PRINCIPAL */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#e11d48] to-[#fb7185] rounded-[32px] p-12 text-white shadow-xl shadow-pink-100 mb-8">
          <div className="relative z-10 max-w-2xl">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 inline-block">
              Governadoria Distrital
            </span>
            <h2 className="text-5xl font-bold mb-4">Olá, {perfil?.nome?.split(' ')[0] || 'Companheiro'}.</h2>
            <p className="text-white/80 text-lg mb-8">
              Aqui está um resumo do Distrito 1960: eventos próximos, novidades dos clubes e comunicados oficiais.
            </p>
            <div className="flex gap-4">
              <button className="bg-white text-[#e11d48] px-6 py-3 rounded-2xl font-bold hover:shadow-lg transition">Ver calendário</button>
              <button className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl font-bold hover:bg-white/20 transition">Explorar clubes</button>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Clubes do Distrito', value: '32', color: 'text-gray-800' },
            { label: 'Membros Ativos', value: '1.284', color: 'text-gray-800' },
            { label: 'Eventos a chegar', value: '7', color: 'text-gray-800' },
            { label: 'Anúncios Novos', value: '3', color: 'text-gray-800' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* SECÇÕES DE CONTEÚDO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendário */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800">Calendário Distrital</h3>
              <button className="text-[10px] font-bold text-[#e11d48] uppercase">Ver tudo</button>
            </div>
            <div className="space-y-4">
              {[
                { date: '24 ABR', title: 'Assembleia Distrital de Primavera', loc: 'Coimbra' },
                { date: '03 MAI', title: 'Visita Oficial - Clube do Porto', loc: 'Porto' }
              ].map((ev, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition group cursor-pointer">
                  <div className="bg-pink-50 text-[#e11d48] p-3 rounded-xl text-center min-w-[60px]">
                    <p className="text-[10px] font-bold leading-tight">{ev.date.split(' ')[1]}</p>
                    <p className="text-lg font-black leading-tight">{ev.date.split(' ')[0]}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{ev.title}</p>
                    <p className="text-xs text-gray-400">{ev.loc}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-[#e11d48] transition" />
                </div>
              ))}
            </div>
          </div>

          {/* Anúncios */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6">Anúncios da Governadoria</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-1 h-12 bg-[#e11d48] rounded-full"></div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Novo manual de marca disponível</p>
                  <p className="text-xs text-gray-400">Há 2h • Por: Secretaria Distrital</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1 h-12 bg-pink-200 rounded-full"></div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Inscrições abertas para a Assembleia</p>
                  <p className="text-xs text-gray-400">Há 5h • Por: Governadoria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}