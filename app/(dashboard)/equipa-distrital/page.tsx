'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Phone, Star, Award, 
  Plus, Edit2, Trash2, Search, Users, LayoutGrid, Eye, Settings2, FileDown, Save, X, Check
} from 'lucide-react'

export default function EquipaDistrital() {
  const [todosPerfis, setTodosPerfis] = useState<any[]>([])
  const [equipaFiltrada, setEquipaFiltrada] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin')
  const [loading, setLoading] = useState(true)

  // Estados da Mensagem do Governador
  const [mensagemGov, setMensagemGov] = useState("")
  const [savingMsg, setSavingMsg] = useState(false)

  // Estados para Atribuição de Novo Cargo
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [customCargo, setCustomCargo] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Estados para Edição Inline na Tabela
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCargoValue, setEditCargoValue] = useState('')

  // Referência para fechar o dropdown se clicar fora
  const dropdownRef = useRef<HTMLDivElement>(null)

  const governador = equipaFiltrada.find(m => m.cargo?.toLowerCase().includes('governador'))

  // Carregar Dados
  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
      const cargo = perfil?.cargo?.toLowerCase() || ''
      const temAcesso = cargo.includes('governador') || cargo.includes('secretario') || cargo.includes('administrador')
      
      setIsAdmin(temAcesso)
      if (!temAcesso) setViewMode('user')
    }

    const { data: perfis } = await supabase.from('perfis').select('*').order('primeiro_nome')
    if (perfis) {
      setTodosPerfis(perfis)
      
      // Filtra apenas quem tem um cargo específico (exclui vazios e "Membro")
      const soEquipa = perfis.filter(m => m.cargo && m.cargo !== '' && m.cargo.toLowerCase() !== 'membro')
      setEquipaFiltrada(soEquipa)
      
      const govData = soEquipa.find(m => m.cargo?.toLowerCase().includes('governador'))
      if (govData) setMensagemGov(govData.bio || "O Rotary é a oportunidade de transformar o mundo através do serviço.")
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    
    // Fechar dropdown de pesquisa ao clicar fora
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 1. Guardar Mensagem do Governador
  async function handleSaveMensagem() {
    if (!governador?.id) return
    setSavingMsg(true)
    const { error } = await supabase.from('perfis').update({ bio: mensagemGov }).eq('id', governador.id)
    if (error) alert("Erro ao guardar: " + error.message)
    else alert("Mensagem atualizada!")
    setSavingMsg(false)
  }

  // 2. Lógica de Pesquisa de Membros
  const membrosFiltradosPesquisa = todosPerfis.filter(m => {
    const nomeCompleto = `${m.primeiro_nome} ${m.apelido || ''}`.toLowerCase()
    return nomeCompleto.includes(searchTerm.toLowerCase())
  })

  function handleSelectMember(membro: any) {
    setSelectedMember(membro)
    setSearchTerm(`${membro.primeiro_nome} ${membro.apelido || ''}`)
    setShowDropdown(false)
  }

  // 3. Atribuir Novo Cargo
  async function handleAtribuirCargo() {
    if (!selectedMember || !customCargo.trim()) {
      alert("Selecione um membro e escreva um título para o cargo.")
      return
    }
    setIsAssigning(true)
    const { error } = await supabase.from('perfis').update({ cargo: customCargo }).eq('id', selectedMember.id)
    if (error) {
      alert("Erro ao atribuir cargo: " + error.message)
    } else {
      // Limpar formulário e recarregar dados para atualizar UI
      setSearchTerm('')
      setSelectedMember(null)
      setCustomCargo('')
      loadData() 
    }
    setIsAssigning(false)
  }

  // 4. Edição Inline na Tabela (Iniciar)
  function startEdit(membro: any) {
    setEditingId(membro.id)
    setEditCargoValue(membro.cargo)
  }

  // 5. Guardar Edição Inline
  async function saveEditCargo(id: string) {
    if (!editCargoValue.trim()) return
    const { error } = await supabase.from('perfis').update({ cargo: editCargoValue }).eq('id', id)
    if (error) alert("Erro ao atualizar: " + error.message)
    else {
      setEditingId(null)
      loadData()
    }
  }

  // 6. Remover Membro da Equipa (Reverte para "Membro")
  async function removerDaEquipa(id: string, nome: string) {
    if (!confirm(`Tem a certeza que deseja remover ${nome} da equipa?`)) return
    
    const { error } = await supabase.from('perfis').update({ cargo: 'Membro' }).eq('id', id)
    if (error) alert("Erro ao remover: " + error.message)
    else loadData()
  }

  // 7. Exportar para Excel
  const exportarExcel = () => {
    const cabecalho = "Nome,Cargo,Email,Telefone\n"
    const linhas = equipaFiltrada.map(m => `${m.primeiro_nome} ${m.apelido},${m.cargo},${m.email},${m.telefone || 'N/A'}`).join("\n")
    const blob = new Blob(["\ufeff" + cabecalho + linhas], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `equipa_distrital.csv`
    link.click()
  }

  if (loading) return <div className="p-10 text-gray-400 font-bold">A carregar interface...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
            {viewMode === 'admin' ? 'Gestão da Equipa Distrital' : 'Equipa Distrital'}
          </h1>
          <p className="text-gray-500 text-sm">Controlo de cargos e comunicações do Distrito 1960.</p>
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
          
          {/* MENSAGEM DO GOVERNADOR (EDITOR) */}
          <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-50 flex-shrink-0">
                <img src={governador?.avatar_url || `https://ui-avatars.com/api/?name=${governador?.primeiro_nome || 'G'}`} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 w-full space-y-4">
                <h2 className="text-2xl font-black text-[#004a99]">
                  {governador ? `${governador.primeiro_nome} ${governador.apelido}` : "Governador não atribuído"}
                </h2>
                <div className="relative">
                  <textarea 
                    value={mensagemGov}
                    onChange={(e) => setMensagemGov(e.target.value)}
                    className="w-full bg-gray-50 border-l-4 border-orange-200 p-4 italic text-gray-900 font-medium text-sm rounded-r-xl focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                    rows={3}
                  />
                  <button onClick={handleSaveMensagem} disabled={savingMsg} className="absolute bottom-2 right-2 bg-[#004a99] text-white p-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                    {savingMsg ? "..." : <Save size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminStatCard label="Membros na Equipa" value={equipaFiltrada.length.toString().padStart(2, '0')} icon={<LayoutGrid size={20}/>} color="blue" />
            <AdminStatCard label="Comissões Ativas" value="03" icon={<Users size={20}/>} color="orange" />
          </div>

          {/* FORMULÁRIO DE ATRIBUIÇÃO */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative overflow-visible">
               <h3 className="text-lg font-black text-[#004a99] mb-6">Atribuir Cargo Individual</h3>
               
               <div className="space-y-4">
                  {/* AUTOCOMPLETE DE MEMBROS */}
                  <div className="relative" ref={dropdownRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setSelectedMember(null) // Reseta o membro selecionado se escrever de novo
                        setShowDropdown(true)
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3.5 pl-10 pr-10 text-sm text-gray-900 font-medium outline-none focus:ring-2 focus:ring-blue-100" 
                      placeholder="Procurar membro pelo nome..." 
                    />
                    {searchTerm && (
                      <button onClick={() => { setSearchTerm(''); setSelectedMember(null) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    )}

                    {/* DROPDOWN MENU */}
                    {showDropdown && searchTerm.trim() !== '' && !selectedMember && (
                      <ul className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {membrosFiltradosPesquisa.length > 0 ? (
                          membrosFiltradosPesquisa.map(m => (
                            <li 
                              key={m.id} 
                              onClick={() => handleSelectMember(m)}
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800">{m.primeiro_nome} {m.apelido}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{m.email}</p>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="px-4 py-3 text-sm text-gray-500 text-center">Nenhum membro encontrado.</li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* INPUT TEXTO LIVRE PARA O CARGO */}
                  <input 
                    value={customCargo}
                    onChange={(e) => setCustomCargo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm text-gray-900 font-medium outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Escreva o título do cargo (ex: Tesoureiro)"
                  />

                  <button 
                    onClick={handleAtribuirCargo}
                    disabled={isAssigning || !selectedMember || !customCargo.trim()}
                    className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-sm shadow-lg hover:bg-[#00356d] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAssigning ? 'A atribuir...' : 'Confirmar Atribuição'}
                  </button>
               </div>
            </div>

            <div className="lg:col-span-3 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-[#004a99]">Gestão de Comissões</h3>
                  <button className="bg-[#fca311] text-white px-4 py-2 rounded-xl font-black text-xs"><Plus size={16}/> Nova Comissão</button>
               </div>
               <div className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-gray-900 font-medium text-sm">Desenvolvimento e Expansão</span>
                  <div className="flex gap-2"><Edit2 size={14} className="text-gray-300"/><Trash2 size={14} className="text-gray-300"/></div>
               </div>
            </div>
          </div>

          {/* TABELA COM EDIÇÃO INLINE */}
          <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-[#004a99]">Membros Atribuídos à Equipa</h3>
              <button onClick={exportarExcel} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-green-700 transition shadow-md">
                <FileDown size={16} /> Exportar Equipa
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4 w-1/3">Membro</th>
                    <th className="px-8 py-4 w-1/3">Cargo Atribuído</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {equipaFiltrada.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition group">
                      <td className="px-8 py-4 font-bold text-gray-900">{m.primeiro_nome} {m.apelido}</td>
                      
                      {/* COLUNA DO CARGO (Editável) */}
                      <td className="px-8 py-4">
                        {editingId === m.id ? (
                          <input 
                            autoFocus
                            value={editCargoValue}
                            onChange={(e) => setEditCargoValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditCargo(m.id)}
                            className="bg-white border border-blue-300 rounded px-3 py-1.5 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 w-full"
                          />
                        ) : (
                          <span className="bg-blue-50 text-[#004a99] px-3 py-1.5 rounded-full text-[10px] font-black uppercase">
                            {m.cargo}
                          </span>
                        )}
                      </td>
                      
                      {/* COLUNA DE AÇÕES */}
                      <td className="px-8 py-4 text-right">
                        {editingId === m.id ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => saveEditCargo(m.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"><Check size={14}/></button>
                            <button onClick={() => setEditingId(null)} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition"><X size={14}/></button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(m)} className="p-2 text-gray-400 hover:text-blue-500 transition" title="Editar Cargo"><Edit2 size={16}/></button>
                            <button onClick={() => removerDaEquipa(m.id, m.primeiro_nome)} className="p-2 text-gray-400 hover:text-red-500 transition" title="Remover da Equipa"><Trash2 size={16}/></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {equipaFiltrada.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-400 text-sm">Nenhum membro atribuído à equipa.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-700">
           <PublicTeamView members={equipaFiltrada} mensagem={mensagemGov} />
        </div>
      )}
    </div>
  )
}

/* Componentes Auxiliares (Stat Card e Public View) mantidos iguais aos da versão anterior */
function AdminStatCard({ label, value, icon, color }: any) {
  const colorMap: any = { blue: 'border-t-blue-500 text-[#004a99]', orange: 'border-t-[#fca311] text-[#fca311]' }
  return (
    <div className={`bg-white p-8 rounded-2xl border border-gray-100 border-t-4 ${colorMap[color]} shadow-sm flex justify-between items-center`}>
      <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">{label}</p><p className="text-4xl font-black">{value}</p></div>
      <div className="bg-gray-50 p-4 rounded-2xl text-gray-300">{icon}</div>
    </div>
  )
}

function PublicTeamView({ members, mensagem }: { members: any[], mensagem: string }) {
  const gov = members.find(m => m.cargo?.toLowerCase().includes('governador'))
  return (
    <div className="space-y-12">
      <section className="bg-white rounded-[32px] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-50">
             <img src={gov?.avatar_url || `https://ui-avatars.com/api/?name=${gov?.primeiro_nome || 'G'}`} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase text-[#fca311] tracking-widest">Governador Distrital 2024-25</span>
            <h2 className="text-4xl font-black text-[#004a99] mb-6">{gov ? `${gov.primeiro_nome} ${gov.apelido}` : 'Governador'}</h2>
            <p className="border-l-4 border-orange-100 pl-6 italic text-gray-500 text-lg leading-relaxed mb-8">"{mensagem}"</p>
          </div>
        </div>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {members.filter(m => !m.cargo?.toLowerCase().includes('governador')).map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50">
               <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
             </div>
             <div>
                <h4 className="font-bold text-gray-800 text-sm">{m.primeiro_nome} {m.apelido}</h4>
                <p className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">{m.cargo}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}