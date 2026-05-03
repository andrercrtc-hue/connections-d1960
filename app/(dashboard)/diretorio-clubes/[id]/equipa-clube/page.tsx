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

  //Mensagem do Presidente
   const [mensagemPres, setMensagemPres] = useState("")
   const [savingMsg, setSavingMsg] = useState(false)

  // Estados para Atribuição
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [novoCargoClube, setNovoCargoClube] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Estados para Edição Inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCargoValue, setEditCargoValue] = useState('')

  const presidente = equipaFiltrada.find(m => m.tipo === 'conselho' && m.cargo_exibir?.toLowerCase().includes('presidente'))

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // ESTES LOGS SÃO A CHAVE:
      console.log("ID do utilizador logado:", user.id);
      console.log("ID do clube vindo do URL:", clubeId);
      
      const { data: meusCargos, error } = await supabase
        .from('clube_equipa')
        .select('cargo_nome')
        .eq('perfil_id', user.id)
        .eq('clube_id', clubeId);

      if (error) console.error("Erro na consulta:", error.message);
      console.log("Resultado da consulta:", meusCargos);

      let nivelMaximoEncontrado = 1;

      if (meusCargos && meusCargos.length > 0) {
        const listaDeNomes = meusCargos.map(c => c.cargo_nome).filter(Boolean);

        // 2. Consultar o nível desses cargos na tabela de configuração
        const { data: permissoes } = await supabase
          .from('cargos_clube_config')
          .select('nivel_acesso')
          .in('cargo', listaDeNomes);

        if (permissoes && permissoes.length > 0) {
          // 3. Extrair o nível mais alto
          nivelMaximoEncontrado = Math.max(...permissoes.map(p => p.nivel_acesso || 1));
        }
      }

      // 4. Define como Admin se o nível for 2 ou superior (Nível Clube)[cite: 6]
      setIsAdmin(nivelMaximoEncontrado >= 2);
      
      // DICA: Adiciona este log para debug se o botão continuar a não aparecer
      console.log("Cargos encontrados:", meusCargos, "Nível final:", nivelMaximoEncontrado);
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

      // Carregar a mensagem atual do Presidente para a caixa de texto
      const pres = listaExpandida.find(m => m.tipo === 'conselho' && m.cargo_exibir?.toLowerCase().includes('presidente'));
      if (pres && pres.bio) setMensagemPres(pres.bio);
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
  async function updateOrdemManual(idUnico: string, idRelacao: string, novaOrdem: number) {
    if (isNaN(novaOrdem) || novaOrdem < 1) return

    const membroAtual = equipaFiltrada.find((m) => m.id_unico === idUnico)
    if (!membroAtual) return

    const antigaOrdem = membroAtual.ordem_equipa_clube || 0
    if (novaOrdem === antigaOrdem) return

    const conselho = equipaFiltrada
      .filter((m) => m.tipo === 'conselho' && m.id_relacao)
      .map((m) => ({ id_relacao: m.id_relacao, ordem: m.ordem_equipa_clube || 99 }))

    const updates: Array<{ id: string; ordem: number }> = []

    if (novaOrdem < antigaOrdem) {
      conselho.forEach((m) => {
        if (m.id_relacao !== idRelacao && m.ordem >= novaOrdem && m.ordem < antigaOrdem) {
          updates.push({ id: m.id_relacao, ordem: m.ordem + 1 })
        }
      })
    } else {
      conselho.forEach((m) => {
        if (m.id_relacao !== idRelacao && m.ordem <= novaOrdem && m.ordem > antigaOrdem) {
          updates.push({ id: m.id_relacao, ordem: m.ordem - 1 })
        }
      })
    }

    updates.push({ id: idRelacao, ordem: novaOrdem })

    const results = await Promise.all(
      updates.map((item) =>
        supabase.from('clube_equipa').update({ ordem: item.ordem }).eq('id', item.id)
      )
    )

    if (results.some((result) => result.error)) {
      alert('Erro ao atualizar a ordem. Tente novamente.')
      return
    }
    loadData()
  }

  async function handleAtribuirCargo() {
    if (!selectedMember || !novoCargoClube.trim()) return

    const { error } = await supabase
      .from('clube_equipa')
      .insert({ 
        perfil_id: selectedMember.id,
        clube_id: clubeId,
        cargo_nome: novoCargoClube.trim(),
        ano_rotario: '2025-26',
        ordem: 99
      });

    if (!error) { setSearchTerm(''); setSelectedMember(null); setNovoCargoClube(''); loadData(); }
  }

  async function saveEditCargo(idRelacao: string) {
    const { error } = await supabase.from('clube_equipa').update({ cargo_nome: editCargoValue }).eq('id', idRelacao)
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

  async function apagarComissao(idComissao: string, nomeComissao: string) {
    if (!confirm(`Tem a certeza que deseja apagar a comissão "${nomeComissao}"? Esta ação não pode ser desfeita e removerá todos os membros associados.`)) return
    
    // O Supabase irá apagar a comissão. 
    // Se a tua tabela comissao_membros estiver bem configurada no SQL (com ON DELETE CASCADE), os membros dessa comissão também são apagados dessa lista.
    const { error } = await supabase.from('comissoes').delete().eq('id', idComissao)
    
    if (!error) {
      loadData() // Recarrega os dados para a comissão desaparecer do ecrã
    } else {
      alert("Erro ao apagar comissão: " + error.message)
    }
  }

  async function handleSaveMensagem() {
    if (!presidente?.id) return
    setSavingMsg(true)
    const { error } = await supabase.from('perfis').update({ bio: mensagemPres }).eq('id', presidente.id)
    if (!error) alert("Mensagem guardada com sucesso!")
    else alert("Erro ao guardar mensagem: " + error.message)
    setSavingMsg(false)
  }

  // EXPORTAÇÃO CSV
  function buildCsvRow(values: Array<string | number | undefined>) {
    return values.map((value) => {
        const text = value === undefined || value === null ? '' : String(value)
        const escaped = text.replace(/"/g, '""')
        return `"${escaped}"`
      }).join(',')
  }

  function exportEquipaToExcel() {
    if (equipaFiltrada.length === 0) return
    const header = ['Ordem', 'Membro', 'Função no Clube', 'Comissão']
    const rows = equipaFiltrada.map((m) => [
      m.ordem_equipa_clube ?? '',
      `${m.primeiro_nome || ''} ${m.apelido || ''}`.trim(),
      m.tipo === 'conselho' ? m.cargo_exibir || '' : '',
      m.tipo === 'comissao' ? m.comissao_exibir || '' : ''
    ])
    const csvContent = [header, ...rows].map(buildCsvRow).join('\r\n')
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'equipa-clube.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-10 text-gray-400 font-bold italic text-center">Carregando equipa...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* HEADER DA PÁGINA */}
        {viewMode === 'admin' ? (
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
        ) : (
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-[#002d5e] uppercase tracking-tighter">Equipa Distrital</h1>
            </div>
            {isAdmin && (
              <button onClick={() => setViewMode('admin')} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase bg-[#004a99] text-white shadow-lg transition-all">
                <Edit2 size={16}/> Editar
              </button>
            )}
          </div>
        )}


        {viewMode === 'admin' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* 1. MENSAGEM Presidente */}
          <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-50 flex-shrink-0">
                <img src={presidente?.avatar_url || `https://ui-avatars.com/api/?name=${presidente?.primeiro_nome || 'G'}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 w-full space-y-4">
                <h2 className="text-2xl font-black text-[#004a99]">Presidente</h2>
                <div className="relative">
                  <textarea value={mensagemPres} onChange={(e) => setMensagemPres(e.target.value)} className="w-full bg-gray-50 border-l-4 border-orange-200 p-4 italic text-gray-900 font-medium text-sm rounded-r-xl outline-none resize-none focus:ring-2 focus:ring-orange-50" rows={3} />
                  <button onClick={handleSaveMensagem} className="absolute bottom-2 right-2 bg-[#004a99] text-white p-2.5 rounded-lg"><Save size={18} /></button>
                </div>
              </div>
            </div>
          </section>

          {/* 2. STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD: MEMBROS NA EQUIPA */}
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Membros na Equipa</p>
                {/* Contamos apenas IDs únicos para ignorar duplicados de cargos */}
                <h3 className="text-4xl font-black text-[#002d5e]">
                  {String(new Set(equipaFiltrada.map(m => m.id)).size).padStart(2, '0')}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-200 group-hover:text-blue-500 transition-colors">
                <Users size={24} />
              </div>
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
                        {todosSocios
                          .filter(m => `${m.primeiro_nome} ${m.apelido}`.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map(m => (
                            <li 
                              key={m.id} 
                              onClick={() => { 
                                setSelectedMember(m); // Aqui passamos o objeto 'm' que contém o cargo_distrital atual
                                setSearchTerm(`${m.primeiro_nome} ${m.apelido}`); 
                                setShowDropdown(false); 
                              }} 
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3"
                            >
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${m.primeiro_nome || ''} ${m.apelido || ''}`.trim())}&background=ffffff&color=2f3e65`} alt={`${m.primeiro_nome} ${m.apelido}`} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-sm font-bold text-gray-900">{m.primeiro_nome} {m.apelido}</span>
                            </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input value={novoCargoClube} onChange={(e) => setNovoCargoClube(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm text-gray-900 font-bold outline-none" placeholder="Escreva o cargo..." />
                  <button onClick={handleAtribuirCargo} className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-sm shadow-lg">Adicionar à Equipa</button>
               </div>
            </div>

            <div className="lg:col-span-3 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
                {/* CABEÇALHO DA GESTÃO DE COMISSÕES */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-[#002d5e]">Gestão de Comissões</h3>
                  
                  {/* O Link aponta para 'nova', que é capturado pelo params.id da nossa página dinâmica */}
                  <Link 
                    href="/equipa-distrital/comissoes/nova" 
                    className="bg-[#fca311] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase shadow-md flex items-center gap-2 hover:bg-[#e5940e] transition-colors"
                  >
                    <Plus size={16} /> Nova Comissão
                  </Link>
                </div>
               <div className="space-y-3">
                  {comissoes.map((com) => (
                    <div key={com.id} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center group hover:bg-white hover:border-blue-100 transition-all">
                      <div>
                        <p className="font-bold text-gray-900 font-medium text-sm">{com.nome}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{com.comissao_membros?.length || 0} Membros Registados</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* LÁPIS: Em vez de um <button>, usamos um <Link> do Next.js para navegar para a página de edição usando o ID da comissão */}
                        <Link 
                          href={`/equipa-distrital/comissoes/${com.id}`} 
                          className="p-2 text-gray-400 hover:text-blue-500 transition cursor-pointer"
                        >
                          <Edit2 size={14}/>
                        </Link>
                        
                        {/* LIXO: Chama a função que criámos no Passo 1 */}
                        <button 
                          onClick={() => apagarComissao(com.id, com.nome)} 
                          className="p-2 text-gray-400 hover:text-red-500 transition cursor-pointer"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* 4. TABELA DE LISTAGEM */}
          <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-[#004a99]">Equipa do Clube</h3>
              <button onClick={exportEquipaToExcel} className="flex items-center gap-2 bg-[#00a859] text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-green-700 transition shadow-md"><FileDown size={16} /> Exportar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4 w-32">Ordem</th>
                    <th className="px-8 py-4">Membro</th>
                    <th className="px-8 py-4">Função no Clube</th>
                    <th className="px-8 py-4">Comissão</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {equipaFiltrada.map((m) => (
                    <tr key={m.id_unico} className="hover:bg-gray-50/50 transition group text-gray-900 font-medium">
                      {/* COLUNA ORDEM (Igual) */}
                      <td className="px-8 py-4 text-center">
                        {m.tipo === 'conselho' ? (
                          <input 
                            type="number" 
                            min={1}
                        defaultValue={m.ordem_equipa_clube || ''} 
                        onBlur={(e) => updateOrdemManual(m.id_unico, m.id_relacao, parseInt(e.target.value))} 
                            className="w-16 bg-gray-50 border border-gray-200 rounded px-1.5 py-1 text-center text-xs font-black outline-none focus:ring-1 focus:ring-blue-400" 
                          />
                        ) : (
                          <span className="text-gray-300 text-xs font-bold tracking-widest">—</span>
                        )}
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
                    {editingId === m.id_relacao ? (
                      <input autoFocus value={editCargoValue} onChange={(e) => setEditCargoValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEditCargo(m.id_relacao)} className="bg-white border border-blue-300 rounded px-3 py-1.5 text-xs font-medium text-gray-900 outline-none w-full" />
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
                    {editingId === m.id_relacao ? (
                      <div className="flex justify-end gap-2"><Check onClick={() => saveEditCargo(m.id_relacao)} className="cursor-pointer text-green-500" size={16}/><X onClick={() => setEditingId(null)} className="cursor-pointer text-gray-400" size={16}/></div>
                        ) : (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.tipo === 'conselho' && <Edit2 onClick={() => {setEditingId(m.id_relacao); setEditCargoValue(m.cargo_exibir)}} className="cursor-pointer text-gray-400 hover:text-blue-500 transition" size={16}/>}
                        <Trash2 onClick={() => removerDaEquipa(m)} className="cursor-pointer text-gray-400 hover:text-red-500 transition" size={16}/>
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
        <PublicClubTeamView members={equipaFiltrada} comissoes={comissoes} mensagem={mensagemPres} />
      )}
    </div>
  )
}

function PublicClubTeamView({ members, comissoes, mensagem }: { members: any[], mensagem: string, comissoes: any[] }) {
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
            <p className="border-l-4 border-orange-100 pl-6 italic text-gray-500 text-lg leading-relaxed mb-6">"{mensagem || 'Liderando com entusiasmo para criar mudanças positivas em nossa comunidade.'}"</p>
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
                  <p className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">{m.cargo_exibir}</p>
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