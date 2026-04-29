'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Users, Settings, FileText } from 'lucide-react'

// Criar um tipo para o perfil
type Perfil = {
  nome: string
  cargo: string
}

export default function Dashboard() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      // 1. Quem está logado?
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // 2. Qual é o cargo dele na tabela de perfis?
      const { data, error } = await supabase
        .from('perfis')
        .select('nome, cargo')
        .eq('id', user.id)
        .single()

      if (data) {
        setPerfil(data)
      } else {
        // Se ainda não tiver perfil na tabela, assumimos 'socio'
        setPerfil({ nome: 'Sócio', cargo: 'socio' })
      }
      setLoading(false)
    }

    loadUser()
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center">A carregar Distrito 1960...</div>

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho */}
        <header className="mb-10 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Distrito 1960</h1>
            <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mt-1">
              Painel de Controlo • Nível: <span className="text-[#e11d48]">{perfil?.cargo}</span>
            </p>
          </div>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            className="text-sm font-bold text-gray-400 hover:text-red-500"
          >
            Terminar Sessão
          </button>
        </header>

        {/* --- ÁREA EXCLUSIVA: GOVERNADOR --- */}
        {perfil?.cargo === 'governador' && (
          <section className="mb-8 p-6 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert size={24} />
              <h2 className="text-xl font-bold">Painel da Governadoria</h2>
            </div>
            <p className="text-sm opacity-90 mb-4">Acesso total a estatísticas, orçamento, aprovação de subsídios e visão geral de todos os clubes do Distrito 1960.</p>
            <div className="flex gap-4">
              <button className="bg-white text-amber-700 px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-gray-50 transition">Ver Relatório Distrital</button>
              <button className="bg-amber-700 text-white border border-amber-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-800 transition">Aprovar Documentos</button>
            </div>
          </section>
        )}

        {/* --- ÁREA EXCLUSIVA: SECRETARIA E GOVERNADOR --- */}
        {(perfil?.cargo === 'governador' || perfil?.cargo === 'secretario') && (
          <section className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4 text-[#e11d48]">
              <FileText size={24} />
              <h2 className="text-xl font-bold text-gray-800">Gestão de Secretaria</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Gestão de quadros sociais, atas, quotas e relatórios de visitas oficiais.</p>
            <button className="bg-[#fce7f3] text-[#e11d48] px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-200 transition">Gerir Sócios do Distrito</button>
          </section>
        )}

        {/* --- ÁREA EXCLUSIVA: ADMINISTRADOR DO CONNECTIONS --- */}
        {(perfil?.cargo === 'administrador' || perfil?.cargo === 'governador') && (
          <section className="mb-8 p-6 bg-gray-900 text-white rounded-2xl shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Settings size={24} className="text-pink-400"/>
              <h2 className="text-xl font-bold">Administração do Sistema</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">Suporte técnico, atribuição de cargos, gestão de acessos e configurações da plataforma Connections.</p>
            <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition">Gerir Permissões</button>
          </section>
        )}

        {/* --- ÁREA COMUM (SÓCIOS E TODOS OS OUTROS) --- */}
        <section className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <Users size={24} />
            <h2 className="text-xl font-bold text-gray-800">Área do Sócio</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Acesso ao diretório distrital, calendário de eventos e documentos do teu clube.</p>
          <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition">Ver o Meu Clube</button>
        </section>

      </div>
    </main>
  )
}