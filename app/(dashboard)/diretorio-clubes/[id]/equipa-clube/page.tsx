'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Phone, Plus, Edit2, Trash2, ChevronDown,
  Search, Users, Eye, Settings2, FileDown, Save, X, Check, Camera, UserPlus
} from 'lucide-react'

export default function EquipaClube() {
  const params = useParams()
  const router = useRouter()
  const clubeId = params.id as string

  // Estados principais
  const [todosSociosClube, setTodosSociosClube] = useState<any[]>([])
  const [equipaExecutiva, setEquipaExecutiva] = useState<any[]>([])
  const [comissoesClube, setComissoesClube] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('user')
  const [loading, setLoading] = useState(true)

  // Estados de Atribuição
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [novoCargo, setNovoCargo] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Estados para Edição Inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCargoValue, setEditCargoValue] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)

  // 1. CARREGAR DADOS
  async function loadData() {
    setLoading(true)
    
    // Verificar Permissões (Nível 2+ ou Admin do Clube)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
      const ehAdminClube = perfil?.clube_id === clubeId && (perfil?.cargo_clube?.toLowerCase().includes('presidente') || perfil?.cargo_clube?.toLowerCase().includes('secretario'))
      setIsAdmin(perfil?.nivel_acesso >= 2 || ehAdminClube)
    }

    // Carregar todos os sócios do clube para o search
    const { data: socios } = await supabase
      .from('perfis')
      .select('*')
      .eq('clube_id', clubeId)
      .order('primeiro_nome')
    
    if (socios) setTodosSociosClube(socios)

    // Carregar membros que já têm cargo (Equipa do Clube)
    const { data: equipa } = await supabase
      .from('perfis')
      .select('*')
      .eq('clube_id', clubeId)
      .not('cargo_clube', 'is', null)
      .not('cargo_clube', 'eq', 'Não membro')
      .order('ordem_equipa_clube', { ascending: true })

    if (equipa) setEquipaExecutiva(equipa)

    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [clubeId])

  // 2. FUNÇÕES DE GESTÃO
  async function handleAtribuirCargo() {
    if (!selectedMember || !novoCargo.trim()) return

    const { error } = await supabase
      .from('perfis')
      .update({ 
        cargo_clube: novoCargo.trim(),
        ordem_equipa_clube: equipaExecutiva.length + 1
      })
      .eq('id', selectedMember.id)

    if (!error) {
      setSearchTerm('')
      setSelectedMember(null)
      setNovoCargo('')
      loadData()
    }
  }

  async function updateOrdemManual(id: string, novaOrdem: number) {
    const { error } = await supabase
      .from('perfis')
      .update({ ordem_equipa_clube: novaOrdem })
      .eq('id', id)
    if (!error) loadData()
  }

  async function removerDaEquipa(id: string) {
    if (!confirm("Remover este sócio da equipa diretiva?")) return
    const { error } = await supabase
      .from('perfis')
      .update({ cargo_clube: null, ordem_equipa_clube: 99 })
      .eq('id', id)
    if (!error) loadData()
  }

  async function saveEditCargo(id: string) {
    const { error } = await supabase.from('perfis').update({ cargo_clube: editCargoValue }).eq('id', id)
    if (!error) { setEditingId(null); loadData(); }
  }

  if (loading) return <div className="p-20 text-center font-black text-[#002d5e] animate-pulse">SINCRONIZANDO CONSELHO DIRETOR...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      
      {/* HEADER DINÂMICO */}
      <div className="flex justify-between items-end border-b-4 border-[#002d5e] pb-6">
        <div>
          <p className="text-[#fca311] font-black uppercase tracking-widest text-xs mb-2">Administração</p>
          <h1 className="text-4xl font-black text-[#002d5e] uppercase tracking-tighter italic">Equipa do Clube</h1>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setViewMode(viewMode === 'admin' ? 'user' : 'admin')}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase bg-[#002d5e] text-white shadow-xl hover:scale-105 transition-all"
          >
            {viewMode === 'admin' ? <><Eye size={18}/> Visualização Sócio</> : <><Settings2 size={18}/> Gerir Equipa</>}
          </button>
        )}
      </div>

      {viewMode === 'admin' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-top-4 duration-500">
          
          {/* COLUNA ESQUERDA: ADICIONAR MEMBRO */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[32px] border-2 border-[#002d5e] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-[#002d5e]"><UserPlus size={40} /></div>
              <h3 className="text-xl font-black text-[#002d5e] mb-6 uppercase">Nomear Oficial</h3>
              
              <div className="space-y-4">
                <div className="relative" ref={dropdownRef}>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Pesquisar Sócios</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      value={searchTerm} 
                      onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-[#fca311] transition-all" 
                      placeholder="Nome do sócio..." 
                    />
                  </div>

                  {showDropdown && searchTerm.length > 0 && (
                    <ul className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-100 rounded-[24px] shadow-2xl max-h-60 overflow-y-auto p-2">
                      {todosSociosClube
                        .filter(m => `${m.primeiro_nome} ${m.apelido}`.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(m => (
                          <li 
                            key={m.id} 
                            onClick={() => { setSelectedMember(m); setSearchTerm(`${m.primeiro_nome} ${m.apelido}`); setShowDropdown(false); }} 
                            className="p-3 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-10 h-10 rounded-full object-cover" />
                            <span className="font-bold text-[#002d5e]">{m.primeiro_nome} {m.apelido}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Cargo no Clube</label>
                  <input 
                    value={novoCargo} 
                    onChange={(e) => setNovoCargo(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-6 font-bold outline-none focus:border-[#fca311] transition-all" 
                    placeholder="Ex: Presidente, Tesoureiro..." 
                  />
                </div>

                <button 
                  onClick={handleAtribuirCargo}
                  className="w-full bg-[#fca311] text-[#002d5e] py-5 rounded-[24px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg"
                >
                  Confirmar Nomeação
                </button>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: TABELA DE GESTÃO */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#002d5e] text-white">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase">Ordem</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase">Oficial</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {equipaExecutiva.map((m) => (
                    <tr key={m.id} className="group hover:bg-gray-50/50 transition-all">
                      <td className="px-8 py-4">
                        <input 
                          type="number" 
                          defaultValue={m.ordem_equipa_clube}
                          onBlur={(e) => updateOrdemManual(m.id, parseInt(e.target.value))}
                          className="w-16 bg-white border-2 border-gray-100 rounded-xl py-2 text-center font-black text-[#002d5e]"
                        />
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                          <div>
                            <p className="font-black text-[#002d5e] leading-none">{m.primeiro_nome} {m.apelido}</p>
                            {editingId === m.id ? (
                              <input 
                                autoFocus 
                                value={editCargoValue} 
                                onChange={(e) => setEditCargoValue(e.target.value)}
                                onBlur={() => saveEditCargo(m.id)}
                                className="mt-1 border-b-2 border-[#fca311] outline-none text-xs font-bold text-[#fca311] uppercase"
                              />
                            ) : (
                              <p className="text-[10px] font-black text-[#fca311] uppercase tracking-tighter">{m.cargo_clube}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingId(m.id); setEditCargoValue(m.cargo_clube); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                          <button onClick={() => removerDaEquipa(m.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* VISUALIZAÇÃO PÚBLICA (ESTILO CARDS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom-6 duration-700">
          {equipaExecutiva.map((m, i) => (
            <div key={i} className="group relative bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#fca311] rounded-t-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-[#002d5e] rounded-[30px] rotate-6 group-hover:rotate-12 transition-transform shadow-xl"></div>
                  <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="relative w-32 h-32 rounded-[30px] object-cover border-4 border-white" />
                </div>
                <h4 className="font-black text-[#002d5e] text-xl leading-tight mb-1">{m.primeiro_nome} {m.apelido}</h4>
                <span className="text-[10px] font-black text-[#fca311] uppercase tracking-widest mb-6">{m.cargo_clube}</span>
                
                <div className="flex gap-3 mt-auto">
                  <a href={`mailto:${m.email}`} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:bg-[#002d5e] hover:text-white transition-all shadow-inner"><Mail size={18} /></a>
                  {m.telefone && (
                    <a href={`tel:${m.telefone}`} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:bg-[#002d5e] hover:text-white transition-all shadow-inner"><Phone size={18} /></a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}