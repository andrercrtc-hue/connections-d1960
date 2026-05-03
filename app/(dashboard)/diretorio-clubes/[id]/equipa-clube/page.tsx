'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Phone, Plus, Edit2, Trash2, ChevronDown,
  Search, Users, Eye, Settings2, FileDown, Save, X, Check, CheckCircle, Layout, Type
} from 'lucide-react'

export default function EquipaClube() {
  const params = useParams()
  const clubeId = params.id as string
  
  const [todosSocios, setTodosSocios] = useState<any[]>([])
  const [equipaFiltrada, setEquipaFiltrada] = useState<any[]>([])
  const [comissoes, setComissoes] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('user')
  const [loading, setLoading] = useState(true)

  // Estados para Atribuição
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [novoCargo, setNovoCargo] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Estados para Edição Inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCargoValue, setEditCargoValue] = useState('')

  const presidente = equipaFiltrada.find(m => m.cargo_clube?.toLowerCase().includes('presidente'))

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // 1. Procurar cargos do utilizador neste clube na tabela correta
      const { data: userRoles } = await supabase
        .from('clube_equipa')
        .select('cargo_nome')
        .eq('perfil_id', user.id)
        .eq('clube_id', clubeId);

      if (userRoles && userRoles.length > 0) {
        const cargosNames = userRoles.map(r => r.cargo_nome).filter(Boolean);

        // 2. Verificar o nível de acesso na tabela de configurações[cite: 4]
        const { data: configData } = await supabase
          .from('cargos_clube_config')
          .select('nivel_acesso')
          .in('cargo', cargosNames); 

        if (configData) {
          const nivelMaximo = Math.max(...configData.map(c => c.nivel_acesso || 1));
          setIsAdmin(nivelMaximo >= 2); // Define se tem acesso à gestão
        }
      }
    }
    
    // 1. Carregar Oficiais via clube_equipa (Conselho Diretor)
    const { data: oficiaisRel } = await supabase
      .from('clube_equipa')
      .select(`
        id, cargo_nome, ordem,
        perfis ( id, primeiro_nome, apelido, avatar_url, email, telefone, bio )
      `)
      .eq('clube_id', clubeId)
      .order('ordem', { ascending: true });

    // 2. Carregar todos os sócios (para pesquisa e comissões)
    const { data: perfisBase } = await supabase
      .from('perfis')
      .select(`
        *,
        comissao_membros ( id, cargo_na_comissao, comissoes ( nome ) )
      `)
      .eq('clube_id', clubeId);

    if (perfisBase) {
      setTodosSocios(perfisBase);
      const listaExpandida: any[] = [];

      // A. Adicionar Oficiais vindos da tabela relacional
      oficiaisRel?.forEach(oficial => {
        listaExpandida.push({
          ...oficial.perfis,
          id_unico: `oficial-${oficial.id}`,
          id_relacao: oficial.id, // ID para permitir apagar o cargo depois
          cargo_exibir: oficial.cargo_nome,
          comissao_exibir: '-',
          tipo: 'conselho',
          ordem_equipa_clube: oficial.ordem
        });
      });

      // B. Adicionar Membros de Comissões
      perfisBase.forEach(perfil => {
        if (perfil.comissao_membros && perfil.comissao_membros.length > 0) {
          perfil.comissao_membros.forEach((cm: any, idx: number) => {
            listaExpandida.push({
              ...perfil,
              id_unico: `com-${cm.id}`,
              cargo_exibir: cm.cargo_na_comissao,
              comissao_exibir: cm.comissoes?.nome || '-',
              tipo: 'comissao',
              comissao_membro_id: cm.id
            });
          });
        }
      });

      setEquipaFiltrada(listaExpandida);
    }

    // 2. Carregar Comissões do Clube
    const { data: coms } = await supabase
      .from('comissoes')
      .select(`
        *,
        comissao_membros (
          id, cargo_na_comissao, ordem,
          perfis ( primeiro_nome, apelido, avatar_url, email, telefone )
        )
      `)
      .eq('clube_id', clubeId)
      .order('nome', { ascending: true });

    if (coms) setComissoes(coms);
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

  // Funções de Gestão (Simplificadas para o Clube)
  async function updateOrdemManual(id: string, novaOrdem: number) {
    const { error } = await supabase.from('perfis').update({ ordem_equipa_clube: novaOrdem }).eq('id', id)
    if (!error) loadData()
  }

  async function handleAtribuirCargo() {
    if (!selectedMember || !novoCargo.trim()) return

    const { error } = await supabase
      .from('clube_equipa')
      .insert({ 
        perfil_id: selectedMember.id,
        clube_id: clubeId,
        cargo_nome: novoCargo.trim(),
        ano_rotario: '2025-26',
        ordem: 99
      });

    if (!error) { setSearchTerm(''); setSelectedMember(null); setNovoCargo(''); loadData(); }
  }

  async function saveEditCargo(id: string) {
    const { error } = await supabase.from('perfis').update({ cargo_clube: editCargoValue }).eq('id', id)
    if (!error) { setEditingId(null); loadData(); }
  }

  async function removerDaEquipa(row: any) {
    if (!confirm("Remover este cargo da equipa do clube?")) return
    
    if (row.tipo === 'comissao') {
      await supabase.from('comissao_membros').delete().eq('id', row.comissao_membro_id)
    } else {
      // Apaga a entrada específica na tabela clube_equipa[cite: 4]
      await supabase.from('clube_equipa').delete().eq('id', row.id_relacao)
    }
    loadData()
  }

  if (loading) return <div className="p-10 text-gray-400 font-bold italic text-center">Carregando equipa...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-[#002d5e] uppercase tracking-tighter">
          {viewMode === 'admin' ? 'Gestão da Equipa do Clube' : 'Equipa do Clube'}
        </h1>
        {isAdmin && (
          <button onClick={() => setViewMode(viewMode === 'admin' ? 'user' : 'admin')} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase bg-[#004a99] text-white shadow-lg transition-all">
            {viewMode === 'admin' ? <><Eye size={16}/> Ver como Sócio</> : <><Settings2 size={16}/> Editar Equipa</>}
          </button>
        )}
      </div>

      {viewMode === 'admin' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* GESTÃO DE ATRIBUIÇÃO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
               <h3 className="text-lg font-black text-[#004a99] mb-6">Nomear Oficiais do Clube</h3>
               <div className="space-y-4">
                  <div className="relative" ref={dropdownRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3.5 pl-10 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Pesquisar sócio..." />
                    {showDropdown && searchTerm.length > 0 && (
                      <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        {todosSocios.filter(m => `${m.primeiro_nome} ${m.apelido}`.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                          <li key={m.id} onClick={() => { setSelectedMember(m); setSearchTerm(`${m.primeiro_nome} ${m.apelido}`); setShowDropdown(false); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3">
                            <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-sm font-bold text-gray-900">{m.primeiro_nome} {m.apelido}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input value={novoCargo} onChange={(e) => setNovoCargo(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm font-bold outline-none" placeholder="Escreva o cargo (ex: Presidente, Tesoureiro)..." />
                  <button onClick={handleAtribuirCargo} className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-sm shadow-lg hover:bg-[#003366] transition-colors">Adicionar Oficial</button>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
               <Users size={48} className="text-blue-100 mb-4" />
               <h3 className="text-xl font-black text-[#002d5e]">{equipaFiltrada.length} Cargos Atribuídos</h3>
               <p className="text-sm text-gray-400 font-medium">Gerencie o Conselho Diretor e as Comissões do seu clube.</p>
            </div>
          </div>

          {/* TABELA DE GESTÃO */}
          <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4 w-32">Ordem</th>
                    <th className="px-8 py-4">Membro</th>
                    <th className="px-8 py-4">Cargo</th>
                    <th className="px-8 py-4">Origem</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {equipaFiltrada.map((m) => (
                    <tr key={m.id_unico} className="hover:bg-gray-50/50 transition group">
                      <td className="px-8 py-4">
                        {m.tipo === 'conselho' ? (
                          <input type="number" defaultValue={m.ordem_equipa_clube} onBlur={(e) => updateOrdemManual(m.id, parseInt(e.target.value))} className="w-16 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-black text-center" />
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-8 h-8 rounded-full object-cover" />
                          <span className="font-bold text-gray-900">{m.primeiro_nome} {m.apelido}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="bg-blue-50 text-[#004a99] px-3 py-1 rounded-full text-[10px] font-black uppercase">{m.cargo_exibir}</span>
                      </td>
                      <td className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase">{m.tipo === 'conselho' ? 'Conselho Diretor' : m.comissao_exibir}</td>
                      <td className="px-8 py-4 text-right">
                         <button onClick={() => removerDaEquipa(m)} className="p-2 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <PublicClubTeamView members={equipaFiltrada} comissoes={comissoes} />
      )}
    </div>
  )
}

function PublicClubTeamView({ members, comissoes }: { members: any[], comissoes: any[] }) {
  const [comissaoAberta, setComissaoAberta] = useState<string | null>(null)

  // 1. Destaque: Presidente do Clube
  const pres = members.find(m => m.tipo === 'conselho' &&  m.cargo_exibir?.toLowerCase() === 'presidente');
  
  // 2. Conselho Diretor (Gabinete)
  const idsVistos = new Set();
  const conselho = members.filter(m => {
    if (m.tipo === 'conselho' && !m.cargo_exibir?.toLowerCase().includes('presidente') && !idsVistos.has(m.id)) {
      idsVistos.add(m.id); return true;
    }
    return false;
  });

// 3. Mapeamento de ícones para as comissões
  const getIcon = (id: string) => {
    switch (id) {
      case 'strategy': return <Layout size={24} />;
      case 'public': return <Type size={24} />;
      case 'volunteer_activism': return <Plus size={24} />;
      case 'hub': return <CheckCircle size={24} />;
      default: return <Users size={24} />;
    }
  };

  const coresIcones = [
    { bg: 'bg-[#eef4ff]', text: 'text-[#3178c6]' },
    { bg: 'bg-[#ffedd5]', text: 'text-[#f59e0b]' },
    { bg: 'bg-[#fce7f3]', text: 'text-[#db2777]' },
    { bg: 'bg-[#dcfce7]', text: 'text-[#10b981]' },
  ]


  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4">
      
      {/* DESTAQUE: PRESIDENTE DO CLUBE */}
      <section className="bg-white rounded-[32px] p-12 border border-gray-100 shadow-sm relative overflow-hidden text-gray-900">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#004a99] to-[#fca311]"></div>
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-48 h-48 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-50 flex-shrink-0">
            <img src={pres?.avatar_url || `https://ui-avatars.com/api/?name=P`} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase text-[#fca311] tracking-widest">Presidente do Clube</span>
            <h2 className="text-4xl font-black text-[#002d5e] mb-4">{pres ? `${pres.primeiro_nome} ${pres.apelido}` : 'Presidente do Clube'}</h2>
            <p className="border-l-4 border-orange-100 pl-6 italic text-gray-500 text-lg leading-relaxed mb-6">"{pres?.bio || 'Liderando com entusiasmo para criar mudanças positivas em nossa comunidade.'}"</p>
            {pres && (
              <div className="flex flex-wrap gap-4 font-bold">
                <div className="bg-blue-50 text-[#004a99] px-4 py-2.5 rounded-xl text-xs border border-blue-100 flex items-center gap-2"><Mail size={16}/> {pres.email}</div>
                {pres.telefone && <div className="bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-xs border border-gray-200 flex items-center gap-2"><Phone size={16}/> {pres.telefone}</div>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONSELHO DIRETOR */}
      {conselho.length > 0 && (
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-[#002d5e] flex items-center gap-4">Conselho Diretor <div className="h-[1px] flex-1 bg-gray-100"></div></h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conselho.map((m, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6 hover:shadow-md transition text-gray-900 font-medium">
               <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 shadow-inner">
                  <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
               </div>
               <div className="space-y-3 w-full">
                  <div>
                      <h4 className="font-black text-[#002d5e] text-xl leading-none mb-1.5">{m.primeiro_nome} {m.apelido}</h4>
                  <p className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">{m.cargo_clube}</p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-gray-50 text-gray-500 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-[#004a99]" />
                      <span>{m.email || 'Sem email'}</span>
                    </div>
                    {m.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-[#004a99]" />
                        <span>{m.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          ))}
        </div>
      </section>
    )}

      {/* COMISSÕES DO CLUBE */}
      {comissoes && comissoes.length > 0 && (
        <section className="space-y-6 pt-4 text-gray-900">
          <h3 className="text-2xl font-black text-[#002d5e] flex items-center gap-4">
            Comissões Distritais <div className="h-[1px] flex-1 bg-gray-100"></div>
          </h3>
          
          <div className="space-y-4">
            {comissoes.map((com, index) => {
              const isAberta = comissaoAberta === com.id
              const cor = coresIcones[index % coresIcones.length]
              
              // Ordenação por precedência definida no formulário
              const membrosOrdenados = [...(com.comissao_membros || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

              return (
                <div key={com.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => setComissaoAberta(isAberta ? null : com.id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cor.bg} ${cor.text} shadow-sm`}>
                         {getIcon(com.icone)}
                      </div>
                      <div className="text-left">
                         <h4 className="font-black text-[#002d5e] text-xl mb-1">{com.nome}</h4>
                         <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">
                            {membrosOrdenados.length} Membros • <span className="text-gray-500 normal-case font-medium">{com.descricao || "Sem descrição."}</span>
                         </p>
                      </div>
                    </div>
                    <ChevronDown className={`text-gray-300 transition-transform duration-500 ${isAberta ? 'rotate-180' : ''}`} size={24} />
                  </button>

                  {/* LISTAGEM DE MEMBROS (ACORDEÃO) */}
                  {isAberta && (
                    <div className="px-6 pb-8 pt-2 border-t border-gray-50 bg-gray-50/30">
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                         {membrosOrdenados.map((m: any, idx: number) => (
                           <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                                <img src={m.perfis?.avatar_url || `https://ui-avatars.com/api/?name=${m.perfis?.primeiro_nome}`} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-[#002d5e] truncate leading-tight">{m.perfis?.primeiro_nome} {m.perfis?.apelido}</p>
                                <p className="text-[10px] font-bold text-[#fca311] uppercase tracking-wider">{m.cargo_na_comissao}</p>
                                {m.perfis?.email && <p className="text-[9px] text-gray-500 truncate mt-1">{m.perfis?.email}</p>}
                                {m.perfis?.telefone && <p className="text-[9px] text-gray-500">{m.perfis?.telefone}</p>}
                              </div>
                           </div>
                         ))}
                       </div>
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