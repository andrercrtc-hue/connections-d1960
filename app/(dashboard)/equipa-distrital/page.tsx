'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Phone, Calendar, ChevronDown, Star, Award, 
  Plus, Edit2, Trash2, Search, Users, LayoutGrid, Eye, Settings2, FileDown, Save
} from 'lucide-react'

export default function EquipaDistrital() {
  const [equipa, setEquipa] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin')
  const [loading, setLoading] = useState(true)
  const [savingMsg, setSavingMsg] = useState(false)

  // Estado para a mensagem do Governador
  const [mensagemGov, setMensagemGov] = useState("")

  // O governador atual (encontrado na lista de equipa)
  const governador = equipa.find(m => m.cargo?.toLowerCase().includes('governador'))

  useEffect(() => {
    async function loadData() {
      // 1. Obter utilizador atual e verificar permissões
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
        const cargo = perfil?.cargo?.toLowerCase() || ''
        const temAcesso = cargo.includes('governador') || cargo.includes('secretario') || cargo.includes('administrador')
        
        setIsAdmin(temAcesso)
        // Se não for admin, força a vista de utilizador
        if (!temAcesso) setViewMode('user')
      }

      // 2. Carregar todos os membros da equipa
      const { data: todosMembros } = await supabase.from('perfis').select('*').order('primeiro_nome')
      if (todosMembros) {
        setEquipa(todosMembros)
        
        // Procurar a bio do governador na lista carregada para preencher o estado inicial
        const govData = todosMembros.find(m => m.cargo?.toLowerCase().includes('governador'))
        if (govData) {
          setMensagemGov(govData.bio || "O Rotary é a oportunidade de transformar o mundo através do serviço.")
        }
      }
      
      setLoading(false)
    }
    loadData()
  }, [])

  // Função para guardar a mensagem na Base de Dados
  async function handleSaveMensagem() {
    if (!governador?.id) {
      alert("Nenhum Governador encontrado para associar a mensagem.")
      return
    }
    
    setSavingMsg(true)
    const { error } = await supabase
      .from('perfis')
      .update({ bio: mensagemGov })
      .eq('id', governador.id)

    if (error) {
      alert("Erro ao guardar mensagem: " + error.message)
    } else {
      alert("Mensagem do Governador atualizada com sucesso!")
    }
    setSavingMsg(false)
  }

  // Função para exportar Excel (CSV)
  const exportarExcel = () => {
    const cabecalho = "Nome,Cargo,Email,Telefone\n"
    const linhas = equipa.map(m => 
      `${m.primeiro_nome} ${m.apelido},${m.cargo},${m.email},${m.telefone || 'N/A'}`
    ).join("\n")
    
    const blob = new Blob(["\ufeff" + cabecalho + linhas], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `equipa_distrital_${new Date().getFullYear()}.csv`
    link.click()
  }

  if (loading) return <div className="p-10 text-gray-400 font-bold">A carregar interface de gestão...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* HEADER E TOGGLE */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
            {viewMode === 'admin' ? 'Gestão da Equipa Distrital' : 'Equipa Distrital'}
          </h1>
          <p className="text-gray-500 text-sm">Administre a mensagem do governador e a estrutura de cargos.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setViewMode(viewMode === 'admin' ? 'user' : 'admin')}
            className="flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-[#004a99] text-white shadow-lg hover:bg-[#00356d] transition-all"
          >
            {viewMode === 'admin' ? <><Eye size={16}/> Ver como Utilizador</> : <><Settings2 size={16}/> Voltar a Editar</>}
          </button>
        )}
      </div>

      {viewMode === 'admin' ? (
        <div className="space-y-10 animate-in fade-in duration-500">
          
          {/* 1. MENSAGEM DO GOVERNADOR (EDITOR) */}
          <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-50">
                  <img src={governador?.avatar_url || `https://ui-avatars.com/api/?name=${governador?.primeiro_nome}`} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#fca311] p-1.5 rounded-full text-white">
                  <Star size={14} fill="currentColor"/>
                </div>
              </div>
              
              <div className="flex-1 w-full space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#fca311] tracking-widest">Governador Distrital 2024-25</span>
                  <h2 className="text-2xl font-black text-[#004a99]">{governador?.primeiro_nome} {governador?.apelido || "Não atribuído"}</h2>
                </div>
                
                <div className="relative">
                  <textarea 
                    value={mensagemGov}
                    onChange={(e) => setMensagemGov(e.target.value)}
                    className="w-full bg-gray-50 border-l-4 border-orange-200 p-4 italic text-gray-600 text-sm rounded-r-xl focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                    rows={3}
                    placeholder="Escreva a mensagem do governador..."
                  />
                  <button 
                    onClick={handleSaveMensagem}
                    disabled={savingMsg}
                    className="absolute bottom-2 right-2 bg-[#004a99] text-white p-2.5 rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50"
                    title="Guardar na Base de Dados"
                  >
                    {savingMsg ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : <Save size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 2. CONTADORES (STATS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminStatCard label="Membros na Equipa" value={equipa.length.toString().padStart(2, '0')} icon={<LayoutGrid size={20}/>} color="blue" />
            <AdminStatCard label="Comissões Distritais" value="03" icon={<Users size={20}/>} color="orange" />
          </div>

          {/* 3. ATRIBUIÇÃO E COMISSÕES */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
               <h3 className="text-lg font-black text-[#004a99] mb-6">Atribuir Cargo Individual</h3>
               <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm outline-none" placeholder="Procurar membro..." />
                  </div>
                  <select className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm outline-none"><option>Selecionar cargo...</option></select>
                  <button className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 shadow-lg hover:bg-[#00356d] transition">
                    <Award size={18}/> Confirmar Atribuição
                  </button>
               </div>
            </div>

            <div className="lg:col-span-3 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-[#004a99]">Gestão de Comissões</h3>
                  <button className="bg-[#fca311] text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-[#e8960f] transition shadow-md shadow-orange-100"><Plus size={16}/> Nova Comissão</button>
               </div>
               <div className="space-y-3">
                  <CommissionItem title="Desenvolvimento e Expansão" members="12" />
                  <CommissionItem title="Imagem Pública e Marketing" members="08" />
               </div>
            </div>
          </div>

          {/* 4. TABELA DE MEMBROS E EXPORTAÇÃO */}
          <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-lg font-black text-[#004a99]">Listagem Geral da Equipa</h3>
              <button 
                onClick={exportarExcel}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-green-700 transition shadow-md"
              >
                <FileDown size={16} /> Exportar Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Membro</th>
                    <th className="px-8 py-4">Cargo</th>
                    <th className="px-8 py-4">Contacto</th>
                    <th className="px-8 py-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                  {equipa.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition cursor-default">
                      <td className="px-8 py-4 font-bold text-gray-800">{m.primeiro_nome} {m.apelido}</td>
                      <td className="px-8 py-4">
                        <span className="bg-blue-50 text-[#004a99] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          {m.cargo || "Membro"}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-gray-500 text-xs">{m.email}</td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-700">
           {/* Vista Pública */}
           <PublicTeamView members={equipa} mensagem={mensagemGov} />
        </div>
      )}
    </div>
  )
}

/* COMPONENTES DE SUPORTE */

function AdminStatCard({ label, value, icon, color }: any) {
  const colorMap: any = { 
    blue: 'border-t-blue-500 text-[#004a99]', 
    orange: 'border-t-[#fca311] text-[#fca311]' 
  }
  return (
    <div className={`bg-white p-8 rounded-2xl border border-gray-100 border-t-4 ${colorMap[color]} shadow-sm flex justify-between items-center`}>
      <div>
        <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">{label}</p>
        <p className="text-4xl font-black">{value}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl text-gray-300">
        {icon}
      </div>
    </div>
  )
}

function CommissionItem({ title, members }: { title: string, members: string }) {
  return (
    <div className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center hover:bg-white hover:border-blue-100 transition group">
      <div className="flex flex-col">
        <span className="font-bold text-gray-700 text-sm">{title}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{members} Membros</span>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
        <button className="p-1.5 text-gray-400 hover:text-blue-500"><Edit2 size={14}/></button>
        <button className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
      </div>
    </div>
  )
}

function PublicTeamView({ members, mensagem }: { members: any[], mensagem: string }) {
  const gov = members.find(m => m.cargo?.toLowerCase().includes('governador'))
  
  return (
    <div className="space-y-12">
      {/* Card do Governador na Vista Pública */}
      <section className="bg-white rounded-[32px] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-50">
             <img src={gov?.avatar_url || `https://ui-avatars.com/api/?name=${gov?.primeiro_nome}`} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase text-[#fca311] tracking-widest">Governador Distrital 2024-25</span>
            <h2 className="text-4xl font-black text-[#004a99] mb-6">{gov?.primeiro_nome} {gov?.apelido}</h2>
            <div className="relative">
              <p className="border-l-4 border-orange-100 pl-6 italic text-gray-500 text-lg leading-relaxed mb-8">
                "{mensagem}"
              </p>
            </div>
            <div className="flex gap-4">
               <button className="bg-[#004a99] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-[#00356d] transition">
                 <Mail size={16}/> E-mail
               </button>
               <button className="bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-gray-50 transition">
                 <Phone size={16}/> Contacto Direto
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* Título Gabinete Executivo */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-[#004a99] flex items-center gap-4">
          Gabinete Executivo <div className="h-[1px] flex-1 bg-gray-100"></div>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.filter(m => !m.cargo?.toLowerCase().includes('governador')).slice(0, 3).map((m, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-50 overflow-hidden">
                <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">{m.primeiro_nome} {m.apelido}</h4>
                <p className="text-[10px] font-bold text-[#fca311] uppercase tracking-widest">{m.cargo || "Membro da Equipa"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}