'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, MapPin, Globe, Mail, Phone, Share2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react' // Adiciona este import no topo

export default function DetalheClube({ params }: { params: Promise<{ id: string }> }) {
  // "Desembrulha" o ID usando a função use()
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const [clube, setClube] = useState<any>(null)
  const [lideranca, setLideranca] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDados() {
      if (!id) return // Segurança extra

      const { data: clubeData, error } = await supabase
        .from('clubes')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error("Erro Supabase:", error.message)
      }

      if (clubeData) setClube(clubeData)

      const { data: perfisData } = await supabase
        .from('perfis')
        .select('*')
        .eq('clube_id', id)
        .not('cargo_clube', 'is', null)
      
      if (perfisData) setLideranca(perfisData)
      setLoading(false)
    }

    carregarDados()
  }, [id]) // Usa o id aqui


  if (loading) return <div className="p-20 text-center font-bold text-gray-400">A carregar detalhes do clube...</div>
  if (!clube) return <div className="p-20 text-center font-bold text-red-500">Clube não encontrado.</div>

  return (
    <div className="pb-20 animate-in fade-in duration-700">
      
      {/* 1. HERO SECTION (Imagem de Fundo e Título) */}
      <div className="relative h-[400px] w-full rounded-b-[40px] overflow-hidden flex items-end pb-12 px-8 md:px-20 -mt-10">
        {/* Imagem de Fundo com Escurecimento para leitura */}
        <div className="absolute inset-0 z-0">
          <img 
            src={clube.capa_url || "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad"} 
            className="w-full h-full object-cover" 
            alt="Capa do Clube" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002d5e] via-[#002d5e]/70 to-transparent"></div>
        </div>

        {/* Conteúdo do Hero */}
        <div className="relative z-10 space-y-4 max-w-4xl text-white">
          <div className="flex gap-3">
            <span className="bg-[#fca311] text-[#002d5e] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Distrito 1960
            </span>
            {clube.ano_fundacao && (
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Fundado em {clube.ano_fundacao}
              </span>
            )}
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">{clube.nome}</h1>
          <p className="text-lg text-gray-200 leading-relaxed max-w-2xl">
            {clube.descricao || "Unindo líderes para servir a comunidade e transformar vidas com impacto positivo."}
          </p>
        </div>
      </div>

      {/* 2. CONTEÚDO PRINCIPAL (Sobre e Reuniões) */}
      <div className="max-w-7xl mx-auto px-4 mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Cartão Sobre */}
        <div className="md:col-span-2 bg-white rounded-[32px] p-10 border-t-4 border-[#002d5e] shadow-sm">
          <h2 className="text-3xl font-black text-[#002d5e] mb-6">Sobre o Clube</h2>
          <p className="text-gray-500 leading-relaxed text-lg">
            {clube.descricao || `O ${clube.nome} é uma instituição dedicada à promoção da paz, ao combate de doenças e ao apoio à educação local. Mantemos uma rede vibrante de profissionais que dedicam o seu tempo a projetos de impacto social transformador.`}
          </p>
        </div>

        {/* Cartão Azul de Reuniões */}
        <div className="bg-[#003b7a] text-white rounded-[32px] p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/20 pb-4">
            <Clock size={24} />
            <h3 className="text-2xl font-black">Reuniões</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">Quando</span>
                <span className="bg-[#fca311] text-[#002d5e] text-[10px] font-black px-2 py-0.5 rounded uppercase">Presencial</span>
              </div>
              <p className="font-bold">{clube.dia_reuniao || 'Terça-feira'}, {clube.hora_reuniao || '20:00'}</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              <span className="text-[10px] font-black text-[#fca311] uppercase tracking-widest mb-1 block">Localização</span>
              <p className="font-bold">{clube.local_reuniao || 'Sede do Clube'}</p>
              <p className="text-sm text-gray-300">{clube.morada_completa || 'Contacte-nos para a morada exata'}</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-[#fca311] uppercase tracking-widest block mb-1">Língua</span>
                <p className="font-bold">{clube.lingua_reuniao || 'Português'}</p>
              </div>
              <Globe className="text-white/50" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. LIDERANÇA DO CLUBE (Ligado aos Perfis) */}
      <div className="max-w-7xl mx-auto px-4 mt-16 space-y-8">
        <div className="flex justify-between items-end">
          <h2 className="text-3xl font-black text-[#002d5e]">Liderança do Clube</h2>
          <button className="text-[#002d5e] font-bold text-sm flex items-center gap-2 hover:underline">
            Ver Direção Completa <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {lideranca.length > 0 ? (
            lideranca.map((lider) => (
            <div key={lider.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:shadow-xl transition-all">
                
                {/* Imagem + Badge de Cargo */}
                <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full border-4 border-[#fca311] overflow-hidden">
                    <img 
                    src={lider.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"} 
                    alt={lider.nome_completo}
                    className="w-full h-full object-cover"
                    />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#002d5e] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap shadow-md">
                    {lider.cargo_clube}
                </div>
                </div>

                {/* Nome do Líder */}
                <h3 className="text-[#002d5e] font-black text-lg">{lider.nome_completo}</h3>
                
                {/* REMOVIDO: Área Profissional */}

                {/* Ícones de Contacto */}
                <div className="flex gap-4 mt-8">
                <button className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                    <Mail size={16} />
                </button>
                <button className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                    <Phone size={16} />
                </button>
                <button className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                    <Share2 size={16} />
                </button>
                </div>
            </div>
            ))
        ) : (
            <div className="col-span-3 text-center py-10 bg-gray-50 rounded-[32px] text-gray-400 font-bold">
            Ainda não existem membros da direção associados a este clube.
            </div>
        )}
        </div>
      </div>

    </div>
  )
}