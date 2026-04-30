'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Phone, Calendar, ChevronDown, Star, Award, 
  Plus, Edit2, Trash2, Search, Users, LayoutGrid, Eye, Settings2
} from 'lucide-react'

// Tipagem para os membros
type Membro = {
  primeiro_nome: string
  apelido: string
  cargo: string
  email: string
  telefone?: string
  bio?: string
  avatar_url?: string
}

export default function EquipaDistrital() {
  const [equipa, setEquipa] = useState<Membro[]>([])
  const [perfilAtivo, setPerfilAtivo] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin') // Estado para alternar vista
  const [loading, setLoading] = useState(true)
  
  // Estados para contadores reais
  const [stats, setStats] = useState({
    totalMembros: 0,
    totalComissoes: 3 // Valor base ou dinâmico se tiveres tabela de comissões
  })

  useEffect(() => {
    async function loadData() {
      // 1. Verificar utilizador e permissões
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
        setPerfilAtivo(perfil)
        
        const cargo = perfil?.cargo?.toLowerCase() || ''
        const temAcesso = cargo.includes('governador') || cargo.includes('secretario') || cargo.includes('administrador')
        setIsAdmin(temAcesso)
        if (!temAcesso) setViewMode('user')
      }

      // 2. Carregar todos os membros e contar
      const { data: todosMembros, count } = await supabase
        .from('perfis')
        .select('*', { count: 'exact' })
      
      if (todosMembros) {
        setEquipa(todosMembros)
        setStats(prev => ({ ...prev, totalMembros: count || 0 }))
      }

      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) return <div className="p-10 text-gray-400 font-bold">A carregar dados da equipa...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* HEADER DA PÁGINA COM TOGGLE DE VISTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">
            {viewMode === 'admin' ? 'Gestão da Equipa Distrital' : 'Equipa Distrital'}
          </h1>
          <p className="text-gray-500 text-sm">
            {viewMode === 'admin' 
              ? 'Administre os cargos, comissões e membros do distrito.' 
              : 'Conheça os líderes e a estrutura do Distrito 1960.'}
          </p>
        </div>

        {/* BOTÃO DE EDIÇÃO/VISTA (Apenas para Admins) */}
        {isAdmin && (
          <button 
            onClick={() => setViewMode(viewMode === 'admin' ? 'user' : 'admin')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
              viewMode === 'admin' 
                ? 'bg-white text-[#004a99] border border-blue-100 hover:bg-blue-50' 
                : 'bg-[#004a99] text-white hover:bg-[#003d7a]'
            }`}
          >
            {viewMode === 'admin' ? (
              <><Eye size={16}/> Ver como Utilizador</>
            ) : (
              <><Settings2 size={16}/> Voltar a Editar</>
            )}
          </button>
        )}
      </div>

      {viewMode === 'admin' ? (
        /* ============================================================
           VISTA DE ADMINISTRADOR (EDITOR)
           ============================================================ */
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* STATS CARDS DINÂMICOS (Retirado Cargos Ativos) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminStatCard 
              label="Membros na Equipa" 
              value={stats.totalMembros.toString().padStart(2, '0')} 
              icon={<LayoutGrid size={20}/>} 
              color="indigo" 
            />
            <AdminStatCard 
              label="Comissões Distritais" 
              value={stats.totalComissoes.toString().padStart(2, '0')} 
              icon={<Users size={20}/>} 
              color="orange" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Adicionar/Editar Cargos */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#004a99]"></div>
                <h3 className="text-lg font-black text-[#004a99] mb-8">Atribuir Cargo Individual</h3>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600">Nome do Membro</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none" placeholder="Procurar por nome..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600">Título do Cargo</label>
                    <select className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3.5 px-4 text-sm outline-none">
                      <option>Selecionar cargo...</option>
                      <option>Secretária Distrital</option>
                      <option>Tesoureiro Distrital</option>
                    </select>
                  </div>

                  <button className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-blue-100 hover:bg-[#003d7a] transition">
                    <Award size={18}/> Confirmar Atribuição
                  </button>
                </div>
              </div>
            </div>

            {/* Gestão de Comissões */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm min-h-full">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black text-[#004a99]">Gestão de Comissões</h3>
                  <button className="bg-[#fca311] text-white px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-100 hover:bg-[#e8960f] transition">
                    <Plus size={16}/> Nova Comissão
                  </button>
                </div>

                <div className="space-y-4">
                  <CommissionCard name="Comissão de Desenvolvimento e Expansão" president="Carlos Oliveira" members="12" />
                  <CommissionCard name="Imagem Pública e Marketing" president="Maria Costa" members="8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================
           VISTA DE UTILIZADOR (PREVIEW)
           ============================================================ */
        <div className="animate-in slide-in-from-bottom-4 duration-700">
           <PublicTeamView members={equipa} />
        </div>
      )}
    </div>
  )
}

/* COMPONENTES AUXILIARES */

function AdminStatCard({ label, value, icon, color }: any) {
  const colors: any = {
    indigo: 'border-t-indigo-500 text-indigo-500',
    orange: 'border-t-[#fca311] text-[#fca311]'
  }
  return (
    <div className={`bg-white p-8 rounded-2xl border border-gray-100 border-t-4 ${colors[color]} shadow-sm flex justify-between items-center`}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
        <p className="text-4xl font-black">{value}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl text-gray-300">
        {icon}
      </div>
    </div>
  )
}

function CommissionCard({ name, president, members }: any) {
  return (
    <div className="border border-gray-50 bg-gray-50/30 rounded-2xl p-6 flex justify-between items-center group hover:bg-white hover:border-blue-100 transition">
      <div>
        <h4 className="font-black text-gray-800 mb-1">{name}</h4>
        <p className="text-xs text-gray-500">Presidente: <span className="text-[#004a99] font-bold">{president}</span></p>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-[10px] font-bold text-gray-400 uppercase">{members} Membros</span>
        <div className="flex gap-2">
          <button className="p-2 text-gray-300 hover:text-blue-500 transition"><Edit2 size={16}/></button>
          <button className="p-2 text-gray-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
        </div>
      </div>
    </div>
  )
}

function PublicTeamView({ members }: { members: Membro[] }) {
  // Organiza os dados para a vista bonita
  const gov = members.find(m => m.cargo?.toLowerCase().includes('governador'))
  
  return (
    <div className="space-y-12">
      {/* Aqui deves colar o código da vista bonita que fizemos na mensagem anterior */}
      {/* Exemplo rápido do Card do Governador: */}
      <div className="bg-white rounded-[32px] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#004a99] to-[#fca311]"></div>
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl">
             <img src={gov?.avatar_url || `https://ui-avatars.com/api/?name=${gov?.primeiro_nome}`} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-[#fca311] tracking-widest">Governador Distrital</span>
            <h2 className="text-4xl font-black text-[#004a99] mb-4">{gov?.primeiro_nome} {gov?.apelido}</h2>
            <div className="flex gap-4">
               <div className="bg-blue-50 px-4 py-2 rounded-xl text-xs font-bold text-[#004a99] flex items-center gap-2">
                  <Mail size={14}/> {gov?.email}
               </div>
               <div className="bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold text-gray-500 flex items-center gap-2">
                  <Phone size={14}/> {gov?.telefone || 'N/A'}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}