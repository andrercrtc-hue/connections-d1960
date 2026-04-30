'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Phone, Star, Plus, Edit2, Trash2, ChevronUp, ChevronDown,
  Search, Users, LayoutGrid, Eye, Settings2, FileDown, Save, X, Check, Layout
} from 'lucide-react'

export default function EquipaDistrital() {
  const [todosPerfis, setTodosPerfis] = useState<any[]>([])
  const [equipaFiltrada, setEquipaFiltrada] = useState<any[]>([])
  const [comissoes, setComissoes] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin')
  const [loading, setLoading] = useState(true)

  // Estados da Mensagem do Governador
  const [mensagemGov, setMensagemGov] = useState("")
  const [savingMsg, setSavingMsg] = useState(false)

  // Estados para Atribuição
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [novoCargoDistrital, setNovoCargoDistrital] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Estados para Edição Inline
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
    // 1. CARREGAR PERFIS COM DADOS DE COMISSÕES
    const { data: perfis } = await supabase
      .from('perfis')
      .select(`
        *,
        comissao_membros (
          cargo_na_comissao,
          comissoes (
            nome
          )
        )
      `)
      .order('ordem_equipa_distrital', { ascending: true })
      .order('primeiro_nome', { ascending: true })

    if (perfis) {
      setTodosPerfis(perfis);

      const listaExpandida: any[] = [];

      perfis.forEach(perfil => {
        // 1. Verificar se tem cargo distrital (ex: Governador, Tesoureiro)
        if (perfil.cargo_distrital && perfil.cargo_distrital.toLowerCase() !== 'não membro') {
          listaExpandida.push({
            ...perfil,
            id_unico: `${perfil.id}-distrital`, // Chave única para o React não se baralhar
            cargo_exibir: perfil.cargo_distrital,
            comissao_exibir: '-',
            tipo: 'distrital'
          });
        }

        // 2. Verificar se está em comissões e criar uma linha para cada uma
        const temCargoDistrital = perfil.cargo_distrital && perfil.cargo_distrital.toLowerCase() !== 'não membro'

        if (!temCargoDistrital && perfil.comissao_membros && perfil.comissao_membros.length > 0) {
          perfil.comissao_membros.forEach((cm: any) => {
            listaExpandida.push({
              ...perfil,
              id_unico: `${perfil.id}-comissao-${cm.comissoes?.nome}`,
              cargo_exibir: cm.cargo_na_comissao,
              comissao_exibir: cm.comissoes?.nome || '-',
              tipo: 'comissao'
            });
          });
        }
      });

      // Ordenar a lista final pela coluna de ordem
      const listaOrdenada = listaExpandida.sort((a, b) => 
        (a.ordem_equipa_distrital || 99) - (b.ordem_equipa_distrital || 99)
      );

      setEquipaFiltrada(listaOrdenada);

      // Manter a lógica do governador para a mensagem
      const gov = listaOrdenada.find(m => m.cargo_exibir?.toLowerCase().includes('governador'));
      if (gov) setMensagemGov(gov.bio || "Servir para transformar.");
    }

    // Carregar Comissões (Dinâmico)
    const { data: coms } = await supabase
      .from('comissoes')
      .select('*, comissao_membros(count)')
    if (coms) setComissoes(coms)

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

  // MANTIDAS AS TUAS FUNÇÕES DE ORDENAÇÃO
  async function updateOrdemManual(id: string, novaOrdem: number) {
    const { error } = await supabase.from('perfis').update({ ordem_equipa_distrital: novaOrdem }).eq('id', id)
    if (!error) loadData()
  }

  async function alterarOrdemSeta(membro: any, direcao: 'subir' | 'descer') {
    const valorAtual = membro.ordem_equipa_distrital || 0
    const novoValor = direcao === 'subir' ? valorAtual - 1 : valorAtual + 1
    updateOrdemManual(membro.id, novoValor)
  }

  async function handleAtribuirCargo() {
    if (!selectedMember || !novoCargoDistrital.trim()) return
    setIsAssigning(true)
    const { error } = await supabase.from('perfis').update({ 
      cargo_distrital: novoCargoDistrital,
      ordem_equipa_distrital: equipaFiltrada.length + 1
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
    const { error } = await supabase.from('perfis').update({ cargo_distrital: 'Não membro', ordem_equipa_distrital: 99 }).eq('id', id)
    if (!error) loadData()
  }

  async function handleSaveMensagem() {
    if (!governador?.id) return
    setSavingMsg(true)
    const { error } = await supabase.from('perfis').update({ bio: mensagemGov }).eq('id', governador.id)
    if (!error) alert("Mensagem guardada!")
    setSavingMsg(false)
  }

  // MANTIDA A TUA LÓGICA DE EXPORTAÇÃO CSV
  function buildCsvRow(values: Array<string | number | undefined>) {
    return values.map((value) => {
        const text = value === undefined || value === null ? '' : String(value)
        const escaped = text.replace(/"/g, '""')
        return `"${escaped}"`
      }).join(',')
  }

  function exportEquipeToExcel() {
    if (equipaFiltrada.length === 0) return
    const header = ['Ordem', 'Membro', 'Função Distrital']
    const rows = equipaFiltrada.map((m) => [
      m.ordem_equipa_distrital ?? '',
      `${m.primeiro_nome || ''} ${m.apelido || ''}`.trim(),
      m.cargo_distrital || ''
    ])
    const csvContent = [header, ...rows].map(buildCsvRow).join('\r\n')
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'equipa-distrital.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-10 text-gray-400 font-bold italic text-center">Sincronizando Nexus...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#002d5e] uppercase tracking-tighter">Gestão da Equipa Distrital</h1>
        </div>
        {isAdmin && (
          <button onClick={() => setViewMode(viewMode === 'admin' ? 'user' : 'admin')} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase bg-[#004a99] text-white shadow-lg transition-all">
            {viewMode === 'admin' ? <><Eye size={16}/> Ver como Sócio</> : <><Settings2 size={16}/> Voltar a Editar</>}
          </button>
        )}
      </div>

      {viewMode === 'admin' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* 1. MENSAGEM GOVERNADOR */}
          <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-50 flex-shrink-0">
                <img src={governador?.avatar_url || `https://ui-avatars.com/api/?name=${governador?.primeiro_nome || 'G'}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 w-full space-y-4">
                <h2 className="text-2xl font-black text-[#004a99]">Governador</h2>
                <div className="relative">
                  <textarea value={mensagemGov} onChange={(e) => setMensagemGov(e.target.value)} className="w-full bg-gray-50 border-l-4 border-orange-200 p-4 italic text-gray-900 font-medium text-sm rounded-r-xl outline-none resize-none focus:ring-2 focus:ring-orange-50" rows={3} />
                  <button onClick={handleSaveMensagem} className="absolute bottom-2 right-2 bg-[#004a99] text-white p-2.5 rounded-lg"><Save size={18} /></button>
                </div>
              </div>
            </div>
          </section>

          {/* 2. STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-blue-100 border-t-4 border-t-[#004a99] shadow-sm flex justify-between items-center">
              <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Membros na Equipa</p><p className="text-4xl font-black text-[#004a99]">{equipaFiltrada.length.toString().padStart(2, '0')}</p></div>
              <LayoutGrid size={32} className="text-gray-100" />
            </div>
            <div className="bg-white p-8 rounded-2xl border border-orange-100 border-t-4 border-t-[#fca311] shadow-sm flex justify-between items-center">
              <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Comissões Ativas</p><p className="text-4xl font-black text-[#fca311]">{comissoes.length.toString().padStart(2, '0')}</p></div>
              <Users size={32} className="text-gray-100" />
            </div>
          </div>

          {/* 3. ATRIBUIÇÃO E GESTÃO COMISSÕES */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative">
               <h3 className="text-lg font-black text-[#004a99] mb-6">Atribuir à Equipa</h3>
               <div className="space-y-4">
                  <div className="relative" ref={dropdownRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" size={16} />
                    <input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedMember(null); setShowDropdown(true); }} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3.5 pl-10 pr-4 text-sm text-gray-900 font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Pesquisar sócio..." />
                    {showDropdown && searchTerm.length > 0 && !selectedMember && (
                      <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        {todosPerfis.filter(m => `${m.primeiro_nome} ${m.apelido}`.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                          <li key={m.id} onClick={() => { setSelectedMember(m); setSearchTerm(`${m.primeiro_nome} ${m.apelido}`); setShowDropdown(false); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                              <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${m.primeiro_nome || ''} ${m.apelido || ''}`.trim())}&background=ffffff&color=2f3e65`} alt={`${m.primeiro_nome} ${m.apelido}`} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">{m.primeiro_nome} {m.apelido}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input value={novoCargoDistrital} onChange={(e) => setNovoCargoDistrital(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm text-gray-900 font-bold outline-none" placeholder="Escreva o cargo..." />
                  <button onClick={handleAtribuirCargo} className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-sm shadow-lg">Adicionar à Equipa</button>
               </div>
            </div>

            <div className="lg:col-span-3 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-[#004a99]">Gestão de Comissões</h3>
                  <Link href="/equipa-distrital/comissoes/nova" className="bg-[#fca311] text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md"><Plus size={16}/> Nova Comissão</Link>
               </div>
               <div className="space-y-3">
                  {comissoes.map((com) => (
                    <div key={com.id} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center group hover:bg-white hover:border-blue-100 transition-all">
                      <div>
                        <p className="font-bold text-gray-900 font-medium text-sm">{com.nome}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{com.comissao_membros[0]?.count || 0} Membros Registados</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-blue-500"><Edit2 size={14}/></button>
                        <button className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* 4. TABELA DE LISTAGEM */}
          <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-[#004a99]">Equipa Distrital</h3>
              <button onClick={exportEquipeToExcel} className="flex items-center gap-2 bg-[#00a859] text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-green-700 transition shadow-md"><FileDown size={16} /> Exportar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4 w-32">Ordem</th>
                    <th className="px-8 py-4">Membro</th>
                    <th className="px-8 py-4">Função Distrital</th>
                    <th className="px-8 py-4">Comissão</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {equipaFiltrada.map((m) => (
                    <tr key={m.id_unico} className="hover:bg-gray-50/50 transition group text-gray-900 font-medium">
                      {/* COLUNA ORDEM (Igual) */}
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                           <div className="flex flex-col">
                              <button onClick={() => alterarOrdemSeta(m, 'subir')} className="text-gray-400 hover:text-blue-600"><ChevronUp size={14}/></button>
                              <button onClick={() => alterarOrdemSeta(m, 'descer')} className="text-gray-400 hover:text-blue-600"><ChevronDown size={14}/></button>
                           </div>
                           <input
                              type="number"
                              value={m.ordem_equipa_distrital}
                              onBlur={(e) => updateOrdemManual(m.id, parseInt(e.target.value))}
                              className="w-12 bg-gray-50 border border-gray-200 rounded px-1.5 py-1 text-center text-xs font-black outline-none"
                           />
                        </div>
                      </td>

                      {/* COLUNA MEMBRO (Com imagem) */}
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                              <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
                           </div>
                           <span className="font-bold text-gray-900">{m.primeiro_nome} {m.apelido}</span>
                        </div>
                      </td>

                      {/* COLUNA CARGO (Usa o cargo_exibir que criámos no loadData) */}
                      <td className="px-8 py-4">
                        {editingId === m.id ? (
                          <input autoFocus value={editCargoValue} onChange={(e) => setEditCargoValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEditCargo(m.id)} className="bg-white border border-blue-300 rounded px-3 py-1.5 text-xs font-medium text-gray-900 outline-none w-full" />
                        ) : (
                          <span className="bg-blue-50 text-[#004a99] px-3 py-1.5 rounded-full text-[10px] font-black uppercase">
                            {m.cargo_exibir}
                          </span>
                        )}
                      </td>

                      {/* COLUNA COMISSÃO (Usa o comissao_exibir) */}
                      <td className="px-8 py-4 text-gray-500 font-bold uppercase text-[10px] tracking-tight">
                         {m.comissao_exibir}
                      </td>

                      {/* COLUNA AÇÕES (Igual) */}
                      <td className="px-8 py-4 text-right">
                        {editingId === m.id ? (
                          <div className="flex justify-end gap-2"><Check onClick={() => saveEditCargo(m.id)} className="cursor-pointer text-green-500" size={16}/><X onClick={() => setEditingId(null)} className="cursor-pointer text-gray-400" size={16}/></div>
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 onClick={() => {setEditingId(m.id); setEditCargoValue(m.cargo_distrital)}} className="cursor-pointer text-gray-400 hover:text-blue-500 transition" size={16}/><Trash2 onClick={() => removerDaEquipa(m.id)} className="cursor-pointer text-gray-400 hover:text-red-500 transition" size={16}/></div>
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
        <PublicTeamView members={equipaFiltrada} mensagem={mensagemGov} comissoes={comissoes} />
      )}
    </div>
  )
}

function PublicTeamView({ members, mensagem, comissoes }: { members: any[], mensagem: string, comissoes: any[] }) {
  const gov = members.find(m => m.cargo_distrital?.toLowerCase().includes('governador'))
  const gabinete = members.filter(m => !m.cargo_distrital?.toLowerCase().includes('governador'))
  
  // Estado para controlar qual comissão está aberta (Acordeão)
  const [comissaoAberta, setComissaoAberta] = useState<string | null>(null)

  // Paleta de cores para os ícones das comissões (Azul, Laranja, Rosa, Verde...)
  const coresIcones = [
    { bg: 'bg-[#eef4ff]', text: 'text-[#3178c6]' },
    { bg: 'bg-[#ffedd5]', text: 'text-[#f59e0b]' },
    { bg: 'bg-[#fce7f3]', text: 'text-[#db2777]' },
    { bg: 'bg-[#dcfce7]', text: 'text-[#10b981]' },
  ]

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4">
      
      {/* DESTAQUE GOVERNADOR */}
      <section className="bg-white rounded-[32px] p-12 border border-gray-100 shadow-sm relative overflow-hidden text-gray-900 font-medium">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#004a99] to-[#fca311]"></div>
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-48 h-48 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-50 flex-shrink-0">
             <img src={gov?.avatar_url || `https://ui-avatars.com/api/?name=G`} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase text-[#fca311] tracking-widest">Governador Distrital</span>
            <h2 className="text-4xl font-black text-[#002d5e] mb-4">{gov ? `${gov.primeiro_nome} ${gov.apelido}` : 'Governador'}</h2>
            <p className="border-l-4 border-orange-100 pl-6 italic text-gray-500 text-lg leading-relaxed mb-6">"{mensagem}"</p>
            {gov && (
              <div className="flex flex-wrap gap-4">
                <div className="bg-blue-50 text-[#004a99] px-4 py-2.5 rounded-xl text-xs font-bold border border-blue-100 flex items-center gap-2"><Mail size={16}/> {gov.email}</div>
                {gov.telefone && <div className="bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200 flex items-center gap-2"><Phone size={16}/> {gov.telefone}</div>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* GABINETE EXECUTIVO */}
      {gabinete.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-2xl font-black text-[#002d5e] flex items-center gap-4">Gabinete Executivo <div className="h-[1px] flex-1 bg-gray-100"></div></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gabinete.map((m, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6 hover:shadow-md transition text-gray-900 font-medium">
                 <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 shadow-inner">
                   <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
                 </div>
                 <div className="space-y-3 w-full">
                    <div>
                       <h4 className="font-black text-[#002d5e] text-xl leading-none mb-1.5">{m.primeiro_nome} {m.apelido}</h4>
                       <p className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">{m.cargo_distrital}</p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-50 text-gray-400">
                      <div className="p-1.5 bg-gray-50 rounded-md hover:text-[#004a99] transition cursor-pointer"><Mail size={14}/></div>
                      {m.telefone && <div className="p-1.5 bg-gray-50 rounded-md hover:text-[#004a99] transition cursor-pointer"><Phone size={14}/></div>}
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* NOVA SECÇÃO: COMISSÕES DISTRITAIS */}
      {comissoes && comissoes.length > 0 && (
        <section className="space-y-6 pt-4">
          <h3 className="text-2xl font-black text-[#002d5e] flex items-center gap-4">
            Comissões Distritais <div className="h-[1px] flex-1 bg-gray-100"></div>
          </h3>
          
          <div className="space-y-4">
            {comissoes.map((com, index) => {
              const isAberta = comissaoAberta === com.id
              const cor = coresIcones[index % coresIcones.length] // Alterna as cores da paleta

              return (
                <div key={com.id} className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden transition-all">
                  <button 
                    onClick={() => setComissaoAberta(isAberta ? null : com.id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cor.bg} ${cor.text}`}>
                         <Layout size={24} /> {/* Placeholder de ícone genérico */}
                      </div>
                      <div className="text-left">
                         <h4 className="font-bold text-[#002d5e] text-lg mb-1">{com.nome}</h4>
                         <p className="text-xs text-gray-500 font-medium">
                            {com.comissao_membros[0]?.count || 0} Membros • Clique para ver detalhes da comissão.
                         </p>
                      </div>
                    </div>
                    <ChevronDown className={`text-gray-300 transition-transform duration-300 ${isAberta ? 'rotate-180' : ''}`} size={24} />
                  </button>

                  {/* CONTEÚDO EXPANDÍVEL (Acordeão) */}
                  {isAberta && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-50 bg-gray-50/50">
                       <p className="text-sm text-gray-600 font-medium">
                          Esta comissão tem atualmente <span className="font-bold">{com.comissao_membros[0]?.count || 0}</span> membros registados.
                       </p>
                       {/* Futuramente, podes mapear e listar os membros exatos desta comissão aqui */}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

    </div>
  )
}