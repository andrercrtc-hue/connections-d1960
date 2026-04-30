'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Phone, Star, Plus, Edit2, Trash2, ChevronUp, ChevronDown,
  Search, Users, LayoutGrid, Eye, Settings2, FileDown, Save, X, Check 
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

  // O governador é quem tem "Governador" no cargo distrital
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

    // BUSCA COM ORDENAÇÃO PELA NOVA COLUNA ESPECÍFICA
    const { data: perfis } = await supabase
      .from('perfis')
      .select('*')
      .order('ordem_equipa_distrital', { ascending: true })
      .order('primeiro_nome', { ascending: true })

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

  // FUNÇÃO PARA MUDAR A ORDEM (SUBIR/DESCER)
  async function alterarOrdem(membro: any, direcao: 'subir' | 'descer') {
    const indexAtual = equipaFiltrada.findIndex(m => m.id === membro.id)
    if (direcao === 'subir' && indexAtual === 0) return
    if (direcao === 'descer' && indexAtual === equipaFiltrada.length - 1) return

    const novaPosicao = direcao === 'subir' ? indexAtual - 1 : indexAtual + 1
    const vizinho = equipaFiltrada[novaPosicao]
    
    // Troca de valores de ordem_equipa_distrital entre os dois
    await supabase.from('perfis').update({ ordem_equipa_distrital: novaPosicao }).eq('id', membro.id)
    await supabase.from('perfis').update({ ordem_equipa_distrital: indexAtual }).eq('id', vizinho.id)
    
    loadData()
  }

  async function handleAtribuirCargo() {
    if (!selectedMember || !novoCargoDistrital.trim()) return
    setIsAssigning(true)
    
    // Atribui cargo e coloca na última posição da equipa
    const { error } = await supabase.from('perfis').update({ 
      cargo_distrital: novoCargoDistrital,
      ordem_equipa_distrital: equipaFiltrada.length 
    }).eq('id', selectedMember.id)

    if (!error) {
      setSearchTerm(''); setSelectedMember(null); setNovoCargoDistrital('');
      await loadData()
    }
    setIsAssigning(false)
  }

  async function saveEditCargo(id: string) {
    const { error } = await supabase.from('perfis').update({ cargo_distrital: editCargoValue }).eq('id', id)
    if (!error) { setEditingId(null); loadData(); }
  }

  async function removerDaEquipa(id: string) {
    if (!confirm("Remover este membro da equipa distrital?")) return
    const { error } = await supabase.from('perfis').update({ 
      cargo_distrital: 'Não membro', 
      ordem_equipa_distrital: 99 
    }).eq('id', id)
    if (!error) loadData()
  }

  async function handleSaveMensagem() {
    if (!governador?.id) return
    setSavingMsg(true)
    const { error } = await supabase.from('perfis').update({ bio: mensagemGov }).eq('id', governador.id)
    if (!error) alert("Mensagem do Governador guardada!")
    setSavingMsg(false)
  }

  if (loading) return <div className="p-10 text-gray-400 font-bold italic">A organizar hierarquia...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
            {viewMode === 'admin' ? 'Gestão da Equipa' : 'Equipa Distrital'}
          </h1>
          <p className="text-gray-500 text-sm italic">Defina a ordem e os cargos da liderança distrital.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setViewMode(viewMode === 'admin' ? 'user' : 'admin')}
            className="flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase bg-[#004a99] text-white shadow-lg transition-all"
          >
            {viewMode === 'admin' ? <><Eye size={16}/> Vista Sócio</> : <><Settings2 size={16}/> Editar Ordem</>}
          </button>
        )}
      </div>

      {viewMode === 'admin' ? (
        <div className="space-y-10 animate-in fade-in duration-500">
          
          {/* MENSAGEM DO GOVERNADOR */}
          <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-50 flex-shrink-0">
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
                  <button onClick={handleSaveMensagem} disabled={savingMsg} className="absolute bottom-2 right-2 bg-[#004a99] text-white p-2.5 rounded-lg">
                    {savingMsg ? "..." : <Save size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* TABELA DE GESTÃO E ORDENAÇÃO */}
          <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <h3 className="text-lg font-black text-[#004a99]">Organizar Hierarquia da Equipa</h3>
              <p className="text-xs text-gray-400">Use as setas para definir quem aparece primeiro na página pública.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4 w-20 text-center">Ordem</th>
                    <th className="px-8 py-4">Membro</th>
                    <th className="px-8 py-4">Cargo Distrital</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {equipaFiltrada.map((m, index) => (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition group">
                      <td className="px-8 py-4">
                        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => alterarOrdem(m, 'subir')} className="p-1 text-gray-400 hover:text-[#004a99]"><ChevronUp size={16}/></button>
                          <span className="text-[10px] font-black text-gray-800">{index + 1}</span>
                          <button onClick={() => alterarOrdem(m, 'descer')} className="p-1 text-gray-400 hover:text-[#004a99]"><ChevronDown size={16}/></button>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100"><img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" /></div>
                            <span className="font-bold text-gray-900">{m.primeiro_nome} {m.apelido}</span>
                         </div>
                      </td>
                      <td className="px-8 py-4">
                        {editingId === m.id ? (
                          <input autoFocus value={editCargoValue} onChange={(e) => setEditCargoValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEditCargo(m.id)} className="bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-900 outline-none w-full" />
                        ) : (
                          <span className="bg-blue-50 text-[#004a99] px-3 py-1.5 rounded-full text-[10px] font-black uppercase">{m.cargo_distrital}</span>
                        )}
                      </td>
                      <td className="px-8 py-4 text-right">
                        {editingId === m.id ? (
                          <div className="flex justify-end gap-2"><button onClick={() => saveEditCargo(m.id)} className="p-2 bg-green-100 text-green-700 rounded-lg"><Check size={14}/></button><button onClick={() => setEditingId(null)} className="p-2 bg-gray-100 text-gray-400 rounded-lg"><X size={14}/></button></div>
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => {setEditingId(m.id); setEditCargoValue(m.cargo_distrital)}} className="p-2 text-gray-400 hover:text-blue-500"><Edit2 size={18}/></button><button onClick={() => removerDaEquipa(m.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ATRIBUIÇÃO */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative" ref={dropdownRef}>
               <h3 className="text-lg font-black text-[#004a99] mb-6">Adicionar à Equipa</h3>
               <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" size={16} />
                    <input 
                      value={searchTerm} 
                      onChange={(e) => { setSearchTerm(e.target.value); setSelectedMember(null); setShowDropdown(true); }} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3.5 pl-10 pr-4 text-sm text-gray-900 font-medium outline-none" 
                      placeholder="Pesquisar sócio..." 
                    />
                    {showDropdown && searchTerm.length > 1 && !selectedMember && (
                      <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        {todosPerfis.filter(m => `${m.primeiro_nome} ${m.apelido}`.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                          <li key={m.id} onClick={() => { setSelectedMember(m); setSearchTerm(`${m.primeiro_nome} ${m.apelido}`); setShowDropdown(false); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900">{m.primeiro_nome} {m.apelido}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input 
                    value={novoCargoDistrital} 
                    onChange={(e) => setNovoCargoDistrital(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm text-gray-900 font-medium outline-none" 
                    placeholder="Cargo distrital (ex: Secretário)..." 
                  />
                  <button onClick={handleAtribuirCargo} disabled={isAssigning} className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-sm shadow-lg hover:bg-[#00356d] transition-all">
                    {isAssigning ? 'A guardar...' : 'Confirmar Atribuição'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA PÚBLICA (RESPEITA A ORDEM DEFINIDA) */
        <PublicTeamView members={equipaFiltrada} mensagem={mensagemGov} />
      )}
    </div>
  )
}

function PublicTeamView({ members, mensagem }: { members: any[], mensagem: string }) {
  const gov = members.find(m => m.cargo_distrital?.toLowerCase().includes('governador'))
  const gabinete = members.filter(m => !m.cargo_distrital?.toLowerCase().includes('governador'))

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4">
      <section className="bg-white rounded-[32px] p-8 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#004a99] to-[#fca311]"></div>
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-48 h-48 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-50 flex-shrink-0">
             <img src={gov?.avatar_url || `https://ui-avatars.com/api/?name=G`} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase text-[#fca311] tracking-widest">Governador Distrital</span>
            <h2 className="text-4xl font-black text-[#004a99] mb-4">{gov ? `${gov.primeiro_nome} ${gov.apelido}` : 'Governador'}</h2>
            <p className="border-l-4 border-orange-100 pl-6 italic text-gray-500 text-lg leading-relaxed mb-6">"{mensagem}"</p>
            {gov && (
              <div className="flex flex-wrap gap-4">
                <div className="bg-blue-50 text-[#004a99] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-blue-100"><Mail size={16}/> {gov.email}</div>
                {gov.telefone && <div className="bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-gray-200"><Phone size={16}/> {gov.telefone}</div>}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gabinete.map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6">
             <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 shadow-inner">
               <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
             </div>
             <div className="space-y-3 w-full">
                <div>
                   <h4 className="font-black text-[#004a99] text-xl leading-none mb-1">{m.primeiro_nome} {m.apelido}</h4>
                   <p className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">{m.cargo_distrital}</p>
                </div>
                <div className="space-y-1 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500"><Mail size={14} className="text-gray-400"/> {m.email}</div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500"><Phone size={14} className="text-gray-400"/> {m.telefone || 'N/A'}</div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}