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

  // Estados para Atribuição (Autocomplete)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [novoCargoDistrital, setNovoCargoDistrital] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Estados para Edição Inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCargoValue, setEditCargoValue] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)

  async function loadData() {
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
      const soEquipa = perfis.filter(m => m.cargo_distrital && m.cargo_distrital.toLowerCase() !== 'não membro')
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

  async function handleSaveMensagem() {
    const gov = equipaFiltrada.find(m => m.cargo_distrital?.toLowerCase().includes('governador'))
    if (!gov?.id) return
    setSavingMsg(true)
    await supabase.from('perfis').update({ bio: mensagemGov }).eq('id', gov.id)
    alert("Mensagem guardada!")
    setSavingMsg(false)
  }

  async function handleAtribuirCargo() {
    if (!selectedMember || !novoCargoDistrital.trim()) return
    setIsAssigning(true)
    await supabase.from('perfis').update({ cargo_distrital: novoCargoDistrital }).eq('id', selectedMember.id)
    setSearchTerm(''); setSelectedMember(null); setNovoCargoDistrital('');
    loadData()
    setIsAssigning(false)
  }

  async function saveEditCargo(id: string) {
    await supabase.from('perfis').update({ cargo_distrital: editCargoValue }).eq('id', id)
    setEditingId(null)
    loadData()
  }

  async function removerDaEquipa(id: string) {
    if (!confirm("Remover este membro?")) return
    await supabase.from('perfis').update({ cargo_distrital: 'Não membro' }).eq('id', id)
    loadData()
  }

  if (loading) return <div className="p-10 text-gray-400 font-bold italic">A carregar...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
            {viewMode === 'admin' ? 'Gestão da Equipa' : 'Equipa Distrital'}
          </h1>
        </div>
        {isAdmin && (
          <button onClick={() => setViewMode(viewMode === 'admin' ? 'user' : 'admin')} className="bg-[#004a99] text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg">
            {viewMode === 'admin' ? 'Vista Sócio' : 'Editar Equipa'}
          </button>
        )}
      </div>

      {viewMode === 'admin' ? (
        <div className="space-y-10 animate-in fade-in duration-500">
          {/* MENSAGEM DO GOVERNADOR */}
          <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative">
             <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-50">
                   <img src={equipaFiltrada.find(m => m.cargo_distrital?.toLowerCase().includes('governador'))?.avatar_url || `https://ui-avatars.com/api/?name=G`} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 w-full space-y-4">
                  <div className="relative">
                    <textarea value={mensagemGov} onChange={(e) => setMensagemGov(e.target.value)} className="w-full bg-gray-50 border-l-4 border-orange-200 p-4 italic text-gray-900 font-medium text-sm rounded-r-xl outline-none resize-none" rows={3}/>
                    <button onClick={handleSaveMensagem} className="absolute bottom-2 right-2 bg-[#004a99] text-white p-2 rounded-lg hover:bg-blue-700 transition"><Save size={18} /></button>
                  </div>
                </div>
             </div>
          </section>

          {/* ESTATÍSTICAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div><p className="text-[10px] font-black uppercase text-gray-400">Membros na Equipa</p><p className="text-4xl font-black text-[#004a99]">{equipaFiltrada.length.toString().padStart(2, '0')}</p></div>
              <LayoutGrid size={32} className="text-gray-100" />
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div><p className="text-[10px] font-black uppercase text-gray-400">Comissões Ativas</p><p className="text-4xl font-black text-[#fca311]">03</p></div>
              <Users size={32} className="text-gray-100" />
            </div>
          </div>

          {/* ATRIBUIÇÃO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm" ref={dropdownRef}>
               <h3 className="text-lg font-black text-[#004a99] mb-6">Atribuir à Equipa</h3>
               <div className="space-y-4">
                  <div className="relative">
                    <input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedMember(null); setShowDropdown(true); }} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3.5 px-4 text-sm text-gray-900 font-medium outline-none" placeholder="Pesquisar sócio..." />
                    {showDropdown && searchTerm.length > 1 && !selectedMember && (
                      <ul className="absolute z-30 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        {todosPerfis.filter(m => `${m.primeiro_nome} ${m.apelido}`.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                          <li key={m.id} onClick={() => { setSelectedMember(m); setSearchTerm(`${m.primeiro_nome} ${m.apelido}`); setShowDropdown(false); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-50">
                            <span className="text-sm font-bold">{m.primeiro_nome} {m.apelido}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input value={novoCargoDistrital} onChange={(e) => setNovoCargoDistrital(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm text-gray-900 font-medium outline-none" placeholder="Escreva o cargo distrital..."/>
                  <button onClick={handleAtribuirCargo} className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-sm">Adicionar</button>
               </div>
            </div>
            
            {/* TABELA */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr><th className="px-6 py-4">Membro</th><th className="px-6 py-4">Cargo</th><th className="px-6 py-4 text-right">Ações</th></tr>
                  </thead>
                  <tbody>
                    {equipaFiltrada.map(m => (
                      <tr key={m.id} className="border-b border-gray-50 group">
                        <td className="px-6 py-4 font-bold text-gray-900">{m.primeiro_nome}</td>
                        <td className="px-6 py-4">
                          {editingId === m.id ? 
                            <input value={editCargoValue} onChange={(e) => setEditCargoValue(e.target.value)} className="border rounded px-2 py-1 w-full" onKeyDown={(e) => e.key === 'Enter' && saveEditCargo(m.id)}/> : 
                            <span className="text-[#004a99] font-medium text-xs">{m.cargo_distrital}</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {editingId === m.id ? <Check onClick={() => saveEditCargo(m.id)} className="cursor-pointer inline text-green-500" size={16}/> : <Edit2 onClick={() => {setEditingId(m.id); setEditCargoValue(m.cargo_distrital)}} className="cursor-pointer inline text-gray-400 mr-2" size={16}/>}
                          <Trash2 onClick={() => removerDaEquipa(m.id)} className="cursor-pointer inline text-gray-400 hover:text-red-500" size={16}/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      ) : (
        <PublicTeamView members={equipaFiltrada} mensagem={mensagemGov} />
      )}
    </div>
  )
}

function PublicTeamView({ members, mensagem }: { members: any[], mensagem: string }) {
  const gov = members.find(m => m.cargo_distrital?.toLowerCase().includes('governador'))
  return (
    <div className="space-y-12">
      <section className="bg-white rounded-[32px] p-12 border border-gray-100 shadow-sm relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-50">
            <img src={gov?.avatar_url || `https://ui-avatars.com/api/?name=G`} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase text-[#fca311] tracking-widest">Governador Distrital</span>
            <h2 className="text-4xl font-black text-[#004a99] mb-6">{gov ? `${gov.primeiro_nome} ${gov.apelido}` : 'Governador'}</h2>
            <p className="border-l-4 border-orange-100 pl-6 italic text-gray-500 text-lg leading-relaxed">"{mensagem}"</p>
          </div>
        </div>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {members.filter(m => !m.cargo_distrital?.toLowerCase().includes('governador')).map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50">
               <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
             </div>
             <div>
                <h4 className="font-bold text-gray-800 text-sm">{m.primeiro_nome} {m.apelido}</h4>
                <p className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">{m.cargo_distrital}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}