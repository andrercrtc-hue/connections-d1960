'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Bell, Calendar, FileText, Users, Wallet, 
  ArrowRight, Download, Upload, Plus, ExternalLink 
} from 'lucide-react'
import Link from 'next/link'

export default function OMeuClube() {
  const [perfil, setPerfil] = useState<any>(null)
  const [clube, setClube] = useState<any>(null)
  const [equipa, setEquipa] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDados() {
      // 1. Obter o utilizador e o seu perfil (para saber o clube_id)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: perfilData } = await supabase
        .from('perfis')
        .select('*, clubes(*)')
        .eq('id', user.id)
        .single()

      if (perfilData) {
        setPerfil(perfilData)
        setClube(perfilData.clubes)

        // 2. Carregar a Equipa do Clube (Adaptado da Equipa Distrital)
        const { data: equipaData } = await supabase
          .from('perfis')
          .select('*')
          .eq('clube_id', perfilData.clube_id)
          .not('cargo_clube', 'is', null)
          .order('cargo_clube') // Pode ajustar a ordem (Presidente, Secretário...)
        
        if (equipaData) setEquipa(equipaData)
      }
      setLoading(false)
    }
    carregarDados()
  }, [])

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">A carregar o seu clube...</div>

  return (
    <div className="pb-20 animate-in fade-in duration-700">
      {/* Contentor Principal - Largura Total */}
      <div className="relative h-[320px] w-full rounded-b-[40px] overflow-hidden flex items-end pb-10 px-8 md:px-12 -mt-10 mb-10">
        <div className="absolute inset-0 z-0">
          <img 
            src={clube?.capa_url || "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad"} 
            className="w-full h-full object-cover" 
            alt="Capa do Clube" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002d5e] via-[#002d5e]/60 to-transparent"></div>
        </div>

        <div className="relative z-10 space-y-3 text-white">
          <span className="bg-[#fca311] text-[#002d5e] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            {clube?.tipo === 'Rotaract' ? 'Distrito 1960 • Rotaract' : 'Distrito 1960 • Rotary'}
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">{clube?.nome}</h1>
          <p className="text-gray-200 text-sm md:text-base max-w-2xl font-medium">
            {clube?.descricao || "Unindo líderes para servir a comunidade e transformar vidas com impacto positivo."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-10">
        {/* --- SECÇÃO 1: ANÚNCIOS --- */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#002d5e]">
              <Bell size={20} className="text-red-500" />
              <h2 className="text-xl font-black uppercase tracking-tight">Anúncios Importantes</h2>
            </div>
            <button className="text-[#002d5e] font-bold text-sm hover:underline">Ver Todos</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-black text-red-600 uppercase mb-1">Urgente</span>
              <h3 className="font-bold text-[#002d5e]">Prazos de Inscrição na Convenção Distrital</h3>
              <p className="text-sm text-red-700/70">As inscrições encerram na próxima sexta-feira, dia 15 de Setembro.</p>
            </div>
            <div className="bg-gray-50 border-l-4 border-gray-300 p-6 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-black text-gray-500 uppercase mb-1">Documentação</span>
              <h3 className="font-bold text-[#002d5e]">Novos Estatutos Aprovados</h3>
              <p className="text-sm text-gray-500">Os novos estatutos já estão disponíveis para consulta no repositório.</p>
            </div>
          </div>
        </section>

        {/* --- SECÇÃO 2: PRÓXIMOS EVENTOS --- */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#002d5e]">
              <Calendar size={20} />
              <h2 className="text-xl font-black uppercase tracking-tight">Próximos Eventos</h2>
            </div>
            <button className="text-[#002d5e] font-bold text-sm hover:underline">Calendário Completo</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { dia: '12', mes: 'SET', titulo: 'Reunião Ordinária', hora: '20:00' },
              { dia: '18', mes: 'SET', titulo: 'Voluntariado Local', hora: '09:30' },
              { dia: '05', mes: 'OUT', titulo: 'Gala Solidariedade', hora: '19:00' },
            ].map((ev, i) => (
              <div key={i} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition">
                <div className="bg-[#fca311] text-[#002d5e] w-16 h-16 rounded-xl flex flex-col items-center justify-center font-black">
                  <span className="text-[10px] leading-none">{ev.mes}</span>
                  <span className="text-2xl">{ev.dia}</span>
                </div>
                <div>
                  <h4 className="font-bold text-[#002d5e]">{ev.titulo}</h4>
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Calendar size={12} /> {ev.hora}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- SECÇÃO 3: SECRETARIA E TESOURARIA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 text-[#002d5e] border-b pb-4">
              <FileText size={24} />
              <h2 className="text-2xl font-black uppercase tracking-tight">Secretaria</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-100 rounded-2xl space-y-2 hover:bg-gray-50 cursor-pointer">
                <FileText className="text-blue-500" />
                <p className="font-bold text-[#002d5e] text-sm leading-tight">Modelos de Documentos</p>
                <p className="text-[10px] text-gray-400">Aceda a atas, cartas tipo e modelos standard.</p>
              </div>
              <div className="p-4 border border-gray-100 rounded-2xl space-y-2 hover:bg-gray-50 cursor-pointer">
                <Users className="text-blue-500" />
                <p className="font-bold text-[#002d5e] text-sm leading-tight">Secretaria Distrital</p>
                <p className="text-[10px] text-gray-400">Contactos diretos e horários da equipa.</p>
              </div>
            </div>
            <button className="w-full bg-blue-50 text-blue-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-100 transition">
              <FileText size={18} /> Formulários Administrativos <ArrowRight size={18} />
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 text-[#002d5e] border-b pb-4">
              <Wallet size={24} className="text-[#fca311]" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Tesouraria</h2>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 text-center space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Atual</span>
              <p className="text-4xl font-black text-[#002d5e]">12.450,00€</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-green-600 uppercase">Quotas em dia</span>
                <p className="text-xl font-black text-green-700">92%</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-orange-600 uppercase">Próx. Vencimento</span>
                <p className="text-xl font-black text-orange-700">15 Set</p>
              </div>
            </div>
            <button className="w-full border-2 border-[#002d5e] text-[#002d5e] font-black py-3 rounded-xl hover:bg-[#002d5e] hover:text-white transition">
              Detalhes Financeiros
            </button>
          </div>
        </div>

        {/* --- SECÇÃO 4: EQUIPA DO CLUBE (ADAPTADA) --- */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[#002d5e]">
            <Users size={20} />
            <h2 className="text-xl font-black uppercase tracking-tight">Equipa do Clube</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {equipa.map((membro) => (
              <div key={membro.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-[#fca311]">
                  <img 
                    src={membro.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-black text-[#002d5e] leading-tight">{membro.nome_completo}</h4>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{membro.cargo_clube}</p>
                  <p className="text-[10px] text-gray-400">2025-2026</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- SECÇÃO 5: REPOSITÓRIO --- */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#002d5e]">
              <FileText size={20} />
              <h2 className="text-xl font-black uppercase tracking-tight">Repositório do Clube</h2>
            </div>
            <div className="flex gap-2">
              <button className="bg-[#002d5e] text-white p-2.5 rounded-lg hover:bg-blue-900 transition"><Upload size={18}/></button>
              <button className="border border-gray-200 text-[#002d5e] px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 transition">Explorar Tudo</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { nome: 'Plano Estratégico 2024', tipo: 'PDF', size: '2.4 MB' },
              { nome: 'Lista de Membros Ativa', tipo: 'XLSX', size: '1.1 MB' },
              { nome: 'Estatutos de Clube', tipo: 'PDF', size: '4.8 MB' },
              { nome: 'Arquivo Fotográfico', tipo: 'ZIP', size: '145 MB' },
            ].map((doc, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-[24px] space-y-4 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-lg transition cursor-pointer group">
                <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[#002d5e] text-sm line-clamp-2">{doc.nome}</h4>
                  <p className="text-[10px] text-gray-400 uppercase font-black mt-1">{doc.tipo} • {doc.size}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}