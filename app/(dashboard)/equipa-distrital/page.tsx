'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Phone, Calendar, ChevronDown, Star, Award, 
  Plus, Edit2, Trash2, Search, Users, ShieldCheck, History, LayoutGrid
} from 'lucide-react'

export default function EquipaDistrital() {
  const [perfilAtivo, setPerfilAtivo] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setPerfilAtivo(data)
        
        // Verifica se o cargo tem permissões de edição
        const cargo = data?.cargo?.toLowerCase() || ''
        const temAcesso = cargo.includes('governador') || 
                          cargo.includes('secretario distrital') || 
                          cargo.includes('administrador')
        
        setIsAdmin(temAcesso)
      }
      setLoading(false)
    }
    checkAccess()
  }, [])

  if (loading) return <div className="p-10 text-gray-400 font-bold">A verificar credenciais...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* TÍTULO DINÂMICO */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isAdmin ? 'Gestão da Equipa Distrital' : 'Equipa Distrital'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isAdmin ? 'Área administrativa para gestão de cargos e comissões.' : 'Conheça os líderes do nosso distrito.'}
          </p>
        </div>
        {isAdmin && (
          <span className="bg-blue-50 text-[#004a99] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100">
            Modo Editor Ativo
          </span>
        )}
      </div>

      {isAdmin ? (
        /* ============================================================
           VISTA PERSONALIZADA (ADMIN) 
           ============================================================ */
        <div className="space-y-8">
          
          {/* STATS CARDS (Ajustados conforme o teu pedido) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdminStatCard label="Cargos Ativos" value="12" icon={<ShieldCheck size={20}/>} color="blue" />
            <AdminStatCard label="Comissões" value="08" icon={<Users size={20}/>} color="orange" />
            <AdminStatCard label="Membros na Equipa" value="45" icon={<LayoutGrid size={20}/>} color="indigo" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* LADO ESQUERDO: Adicionar/Editar Cargos */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#004a99]"></div>
                <h3 className="text-lg font-black text-[#004a99] mb-2">Adicionar ou Editar Cargos Individuais</h3>
                <p className="text-xs text-gray-400 mb-8">Gerir cargos específicos como Secretário Distrital ou Tesoureiro.</p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600">Nome do Membro</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="Procurar membro por nome ou ID" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600">Título do Cargo</label>
                    <select className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm outline-none">
                      <option>Selecionar cargo...</option>
                      <option>Secretária Distrital</option>
                      <option>Tesoureiro Distrital</option>
                    </select>
                  </div>

                  {/* Lista de Cargos Atuais */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-[#004a99] uppercase mb-4">Cargos Atuais</p>
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-gray-400 font-bold border-b border-gray-200">
                          <th className="pb-2">CARGO</th>
                          <th className="pb-2">MEMBRO</th>
                          <th className="pb-2 text-right">AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold text-gray-700">
                        <tr className="border-b border-gray-100">
                          <td className="py-3">Secretária</td>
                          <td className="py-3">Ana Silva</td>
                          <td className="py-3 text-right flex justify-end gap-2 text-gray-400">
                            <Edit2 size={14} className="cursor-pointer hover:text-blue-500"/>
                            <Trash2 size={14} className="cursor-pointer hover:text-red-500"/>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3">Tesoureiro</td>
                          <td className="py-3">João Santos</td>
                          <td className="py-3 text-right flex justify-end gap-2 text-gray-400">
                            <Edit2 size={14} className="cursor-pointer hover:text-blue-500"/>
                            <Trash2 size={14} className="cursor-pointer hover:text-red-500"/>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <button className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-blue-100">
                    <Award size={18}/> Atribuir Cargo
                  </button>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: Gestão de Comissões */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm min-h-full">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-black text-[#004a99]">Gestão de Comissões</h3>
                    <p className="text-xs text-gray-400">Criar comissões e gerir as suas estruturas internas.</p>
                  </div>
                  <button className="bg-[#fca311] text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-100">
                    <Plus size={16}/> Nova Comissão
                  </button>
                </div>

                <div className="space-y-4">
                  <CommissionCard name="Comissão de Desenvolvimento Urbano" president="Carlos Oliveira" members="12" />
                  <CommissionCard name="Saúde Pública e Segurança" president="Maria Costa" members="8" />
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* ============================================================
           VISTA PÚBLICA (MEMBRO) 
           ============================================================ */
        <PublicTeamView /> 
      )}
    </div>
  )
}

/* COMPONENTES DA ÁREA ADMIN */

function AdminStatCard({ label, value, icon, color }: any) {
  const colors: any = {
    blue: 'border-t-[#004a99] text-[#004a99]',
    orange: 'border-t-[#fca311] text-[#fca311]',
    indigo: 'border-t-indigo-500 text-indigo-500'
  }
  return (
    <div className={`bg-white p-6 rounded-2xl border border-gray-100 border-t-4 ${colors[color]} shadow-sm flex justify-between items-start`}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-black">{value}</p>
      </div>
      <div className="bg-gray-50 p-2 rounded-lg text-gray-300">
        {icon}
      </div>
    </div>
  )
}

function CommissionCard({ name, president, members }: any) {
  return (
    <div className="border border-gray-100 rounded-2xl p-6 hover:border-blue-100 transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-black text-gray-800 mb-1">{name}</h4>
          <p className="text-xs text-gray-500">Presidente: <span className="text-[#004a99] font-bold">{president}</span></p>
        </div>
        <div className="flex gap-3 text-gray-300">
          <Edit2 size={16} className="cursor-pointer hover:text-blue-500" />
          <Plus size={18} className="cursor-pointer hover:text-orange-500" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-500"></div>
          <div className="w-8 h-8 rounded-full border-2 border-white bg-orange-500"></div>
          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">+10</div>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{members} Membros Registados</span>
      </div>
    </div>
  )
}

function PublicTeamView() {
  // Aqui colocas o código que criámos na mensagem anterior (Secção do Governador, Gabinete, etc.)
  return <div>VISTA PÚBLICA DA EQUIPA</div>
}