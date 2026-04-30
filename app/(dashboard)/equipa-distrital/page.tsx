'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Phone, Star, Award, Plus, Edit2, Trash2, 
  Search, Users, LayoutGrid, Eye, Settings2, FileDown, Save, X, Check 
} from 'lucide-react'

export default function EquipaDistrital() {
  const [todosPerfis, setTodosPerfis] = useState<any[]>([])
  const [equipaFiltrada, setEquipaFiltrada] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin')
  const [loading, setLoading] = useState(true)

  // Mensagem do Governador
  const [mensagemGov, setMensagemGov] = useState("")
  const [savingMsg, setSavingMsg] = useState(false)

  // Atribuição (Autocomplete)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [novoCargoDistrital, setNovoCargoDistrital] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Edição Inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCargoValue, setEditCargoValue] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)

  const governador = equipaFiltrada.find(m => m.cargo_distrital?.toLowerCase().includes('governador'))

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
      const cargoD = perfil?.cargo_distrital?.toLowerCase() || ''
      const temAcesso = cargoD.includes('governador') || cargoD.includes('secretario') || cargoD.includes('administrador')
      setIsAdmin(temAcesso)
      if (!temAcesso) setViewMode('user')
    }

    const { data: perfis } = await supabase.from('perfis').select('*').order('primeiro_nome')
    if (perfis) {
      setTodosPerfis(perfis)
      const soEquipa = perfis.filter(m => 
        m.cargo_distrital && m.cargo_distrital.toLowerCase() !== 'não membro'
      )
      setEquipaFiltrada(soEquipa)
      
      const govData = soEquipa.find(m => m.cargo_distrital?.toLowerCase().includes('governador'))
      if (govData) setMensagemGov(govData.bio || "Servir para transformar.")
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // CORREÇÃO SUPABASE: Gravar explicitamente na cargo_distrital
  async function handleAtribuirCargo() {
    if (!selectedMember || !novoCargoDistrital.trim()) return
    setIsAssigning(true)
    
    const { error } = await supabase
      .from('perfis')
      .update({ cargo_distrital: novoCargoDistrital })
      .eq('id', selectedMember.id)

    if (error) {
      alert("Erro ao gravar no Supabase: " + error.message)
    } else {
      setSearchTerm(''); setSelectedMember(null); setNovoCargoDistrital('');
      await loadData() // Recarrega a lista
    }
    setIsAssigning(false)
  }

  async function saveEditCargo(id: string) {
    const { error } = await supabase
      .from('perfis')
      .update({ cargo_distrital: editCargoValue })
      .eq('id', id)
    
    if (!error) { setEditingId(null); loadData(); }
  }

  async function removerDaEquipa(id: string) {
    if (!confirm("Remover este membro da equipa distrital?")) return
    const { error } = await supabase
      .from('perfis')
      .update({ cargo_distrital: 'Não membro' })
      .eq('id', id)
    if (!error) loadData()
  }

  async function handleSaveMensagem() {
    if (!governador?.id) return
    setSavingMsg(true)
    await supabase.from('perfis').update({ bio: mensagemGov }).eq('id', governador.id)
    setSavingMsg(false)
  }

  if (loading) return <div className="p-10 text-gray-400 font-bold">A carregar dados...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
            {viewMode === 'admin' ? 'Gestão da Equipa Distrital' : 'Equipa Distrital'}
          </h1>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setViewMode(viewMode === 'admin' ? 'user' : 'admin')}
            className="flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase bg-[#004a99] text-white shadow-lg transition-all"
          >
            {viewMode === 'admin' ? <><Eye size={16}/> Ver como Sócio</> : <><Settings2 size={16}/> Editar Equipa</>}
          </button>
        )}
      </div>

      {viewMode === 'admin' ? (
        <div className="space-y-10 animate-in fade-in duration-500">
          
          {/* MENSAGEM GOVERNADOR */}
          <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-50">
                <img src={governador?.avatar_url || `https://ui-avatars.com/api/?name=${governador?.primeiro_nome || 'G'}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 w-full space-y-4">
                <h2 className="text-2xl font-black text-[#004a99]">
                   {governador ? `${governador.primeiro_nome} ${governador.apelido}` : "Governador não definido"}
                </h2>
                <div className="relative">
                  <textarea 
                    value={mensagemGov}
                    onChange={(e) => setMensagemGov(e.target.value)}
                    className="w-full bg-gray-50 border-l-4 border-orange-200 p-4 italic text-gray-900 font-medium text-sm rounded-r-xl outline-none resize-none focus:ring-2 focus:ring-orange-50"
                    rows={3}
                  />
                  <button onClick={handleSaveMensagem} className="absolute bottom-2 right-2 bg-[#004a99] text-white p-2.5 rounded-lg">
                    {savingMsg ? "..." : <Save size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 border-t-4 border-t-blue-500 shadow-sm flex justify-between items-center">
              <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Membros na Equipa</p><p className="text-4xl font-black text-[#004a99]">{equipaFiltrada.length.toString().padStart(2, '0')}</p></div>
              <LayoutGrid size={32} className="text-gray-200" />
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-100 border-t-4 border-t-[#fca311] shadow-sm flex justify-between items-center">
              <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Comissões Ativas</p><p className="text-4xl font-black text-[#fca311]">03</p></div>
              <Users size={32} className="text-gray-200" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* COLUNA: ATRIBUIR (Autocomplete com Foto) */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative">
               <h3 className="text-lg font-black text-[#004a99] mb-6">Atribuir à Equipa</h3>
               <div className="space-y-4">
                  <div className="relative" ref={dropdownRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" size={16} />
                    <input 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setSelectedMember(null); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3.5 pl-10 pr-4 text-sm text-gray-900 font-bold placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-50" 
                      placeholder="Pesquisar sócio..." 
                    />
                    {showDropdown && searchTerm.length > 0 && !selectedMember && (
                      <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                        {todosPerfis.filter(m => `${m.primeiro_nome} ${m.apelido}`.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                          <li key={m.id} onClick={() => { setSelectedMember(m); setSearchTerm(`${m.primeiro_nome} ${m.apelido}`); setShowDropdown(false); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                               <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-gray-900">{m.primeiro_nome} {m.apelido}</span>
                               <span className="text-[10px] text-gray-400 uppercase font-black">{m.email}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <input 
                    value={novoCargoDistrital}
                    onChange={(e) => setNovoCargoDistrital(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm text-gray-900 font-bold placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-50"
                    placeholder="Escreva o cargo distrital..."
                  />

                  <button onClick={handleAtribuirCargo} className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-sm shadow-lg hover:bg-[#00356d] transition-all">
                    Adicionar à Equipa
                  </button>
               </div>
            </div>

            {/* COLUNA: COMISSÕES (Rollback) */}
            <div className="lg:col-span-3 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-[#004a99]">Gestão de Comissões</h3>
                  <button className="bg-[#fca311] text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md"><Plus size={16}/> Nova Comissão</button>
               </div>
               <div className="space-y-3">
                  <div className="p-4 bg-gray-50 border border-gray-50 rounded-2xl flex justify-between items-center group hover:bg-white hover:border-blue-100 transition-all">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Desenvolvimento e Expansão</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">12 Membros Registados</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-blue-500"><Edit2 size={16}/></button>
                      <button className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* TABELA INTEGRAL DE MEMBROS */}
          <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-[#004a99]">Listagem da Equipa Distrital</h3>
              <button onClick={() => {}} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-md"><FileDown size={16} /> Exportar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Membro</th>
                    <th className="px-8 py-4">Função Distrital</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {equipaFiltrada.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition group">
                      <td className="px-8 py-4 font-bold text-gray-900">{m.primeiro_nome} {m.apelido}</td>
                      <td className="px-8 py-4">
                        {editingId === m.id ? (
                          <input 
                            autoFocus 
                            value={editCargoValue} 
                            onChange={(e) => setEditCargoValue(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && saveEditCargo(m.id)}
                            className="bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 outline-none w-full" 
                          />
                        ) : (
                          <span className="bg-blue-50 text-[#004a99] px-3 py-1.5 rounded-full text-[10px] font-black uppercase">
                            {m.cargo_distrital}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-4 text-right">
                        {editingId === m.id ? (
                          <div className="flex justify-end gap-2">
                             <button onClick={() => saveEditCargo(m.id)} className="p-2 bg-green-100 text-green-700 rounded-lg"><Check size={14}/></button>
                             <button onClick={() => setEditingId(null)} className="p-2 bg-gray-100 text-gray-400 rounded-lg"><X size={14}/></button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => {setEditingId(m.id); setEditCargoValue(m.cargo_distrital)}} className="p-2 text-gray-400 hover:text-blue-500"><Edit2 size={18}/></button>
                            <button onClick={() => removerDaEquipa(m.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        /* VISTA PÚBLICA DO SÓCIO */
        <PublicTeamView members={equipaFiltrada} mensagem={mensagemGov} />
      )}
    </div>
  )
}

function PublicTeamView({ members, mensagem }: { members: any[], mensagem: string }) {
  const gov = members.find(m => m.cargo_distrital?.toLowerCase().includes('governador'))
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4">
      <section className="bg-white rounded-[32px] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-50">
            <img src={gov?.avatar_url || `https://ui-avatars.com/api/?name=G`} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase text-[#fca311] tracking-widest">Governador Distrital 2024-25</span>
            <h2 className="text-4xl font-black text-[#004a99] mb-6">{gov ? `${gov.primeiro_nome} ${gov.apelido}` : 'Governador'}</h2>
            <p className="border-l-4 border-orange-100 pl-6 italic text-gray-500 text-lg leading-relaxed">"{mensagem}"</p>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {members.filter(m => !m.cargo_distrital?.toLowerCase().includes('governador')).map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
             <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50">
               <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
             </div>
             <div><h4 className="font-bold text-gray-800 text-sm">{m.primeiro_nome} {m.apelido}</h4><p className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">{m.cargo_distrital}</p></div>
          </div>
        ))}
      </div>
    </div>
  )
}