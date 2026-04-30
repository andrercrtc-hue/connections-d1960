'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../../../lib/supabase' 
import { useRouter, useParams } from 'next/navigation'
import { 
  Info, Users, Search, Plus, Trash2, Layout, 
  CheckCircle, ChevronRight, UserPlus, Type, ChevronDown, ChevronUp,
  X, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

/**
 * Opções de Ícones para a Dropdown Visual
 */
const OPCOES_ICONES = [
  { id: 'groups', nome: 'Equipas/Membros', icon: <Users size={18} /> },
  { id: 'strategy', nome: 'Estratégia e Planeamento', icon: <Layout size={18} /> },
  { id: 'public', nome: 'Imagem Pública', icon: <Type size={18} /> },
  { id: 'volunteer_activism', nome: 'Serviços à Comunidade', icon: <Plus size={18} /> },
  { id: 'hub', nome: 'Coordenação/Hub', icon: <CheckCircle size={18} /> },
];

export default function FormularioComissao() {
  const router = useRouter()
  const params = useParams()
  
  // Deteção de Modo: Criar vs Editar
  const isEditing = params.id !== 'nova'
  const comissaoId = params.id as string

  // Estados Globais
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [perfis, setPerfis] = useState<any[]>([])

  // Estados do Formulário (Informação Básica)
  const [nome, setNome] = useState('')
  const [icone, setIcone] = useState('groups')
  const [descricao, setDescricao] = useState('')
  const [membros, setMembros] = useState<any[]>([])

  // Estados de UI (Pesquisa e Dropdowns)
  const [searchMembro, setSearchMembro] = useState('')
  const [cargoMembro, setCargoMembro] = useState('')
  const [membroSelecionado, setMembroSelecionado] = useState<any>(null)
  const [showMembroDropdown, setShowMembroDropdown] = useState(false)
  const [showIconDropdown, setShowIconDropdown] = useState(false)

  // Refs para fechar menus ao clicar fora
  const dropdownRefMembro = useRef<HTMLDivElement>(null)
  const dropdownRefIcon = useRef<HTMLDivElement>(null)

  /**
   * Carregamento Inicial de Dados
   */
  useEffect(() => {
    async function carregarDados() {
      // 1. Carregar todos os perfis para a pesquisa
      const { data: perfisData } = await supabase
        .from('perfis')
        .select('id, primeiro_nome, apelido, avatar_url, cargo_clube')
        .order('primeiro_nome')
      
      if (perfisData) setPerfis(perfisData)

      // 2. Se for edição, carregar os dados da comissão específica
      if (isEditing && comissaoId) {
        const { data: comissao } = await supabase
          .from('comissoes')
          .select('*')
          .eq('id', comissaoId)
          .single()

        if (comissao) {
          setNome(comissao.nome)
          setIcone(comissao.icone || 'groups')
          setDescricao(comissao.descricao || '')
        }

        // 3. Carregar membros atuais com a sua ordem
        const { data: membrosAtuais } = await supabase
          .from('comissao_membros')
          .select('ordem, cargo_na_comissao, perfis(*)')
          .eq('comissao_id', comissaoId)
          .order('ordem', { ascending: true })

        if (membrosAtuais) {
          setMembros(membrosAtuais.map(m => ({ 
            ...m.perfis, 
            cargo: m.cargo_na_comissao,
            ordem: m.ordem || 0 
          })))
        }
      }
      setDataLoaded(true)
    }

    carregarDados()

    // Listener para fechar dropdowns
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRefMembro.current && !dropdownRefMembro.current.contains(e.target as Node)) setShowMembroDropdown(false)
      if (dropdownRefIcon.current && !dropdownRefIcon.current.contains(e.target as Node)) setShowIconDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [comissaoId, isEditing])

  /**
   * Lógica de Reordenação de Membros
   */
  const moverMembro = (index: number, direcao: 'subir' | 'descer') => {
    const novaLista = [...membros]
    const destino = direcao === 'subir' ? index - 1 : index + 1
    
    if (destino < 0 || destino >= novaLista.length) return

    const temp = novaLista[index]
    novaLista[index] = novaLista[destino]
    novaLista[destino] = temp

    // Re-atribuição de ordem numérica
    const listaFinal = novaLista.map((m, idx) => ({ ...m, ordem: idx + 1 }))
    setMembros(listaFinal)
  }

  /**
   * Adicionar Membro à Lista Temporária
   */
  const adicionarMembroLista = () => {
    if (!membroSelecionado) return alert("Por favor, selecione um sócio da lista.")
    if (!cargoMembro.trim()) return alert("Defina o cargo (ex: Presidente, Secretário).")
    
    if (membros.some(m => m.id === membroSelecionado.id)) {
      return alert("Este sócio já está na lista desta comissão.")
    }

    const novoMembro = { 
      ...membroSelecionado, 
      cargo: cargoMembro, 
      ordem: membros.length + 1 
    }

    setMembros([...membros, novoMembro])
    setMembroSelecionado(null)
    setSearchMembro('')
    setCargoMembro('')
  }

  /**
   * Gravar Tudo no Supabase
   */
  const handleGuardar = async () => {
    if (!nome.trim()) return alert("O nome da comissão é obrigatório.")
    setLoading(true)
    
    try {
      let idActivo = comissaoId;
      const dadosComissao = { nome, icone, descricao };

      if (isEditing) {
        // 1. Atualizar dados básicos
        const { error: errUpdate } = await supabase.from('comissoes').update(dadosComissao).eq('id', idActivo)
        if (errUpdate) throw errUpdate;

        // 2. Limpar membros para re-inserção (estratégia de sync mais simples)
        await supabase.from('comissao_membros').delete().eq('comissao_id', idActivo)
      } else {
        // 3. Criar nova comissão
        const { data: nova, error: errInsert } = await supabase.from('comissoes').insert([dadosComissao]).select().single()
        if (errInsert) throw errInsert
        idActivo = nova.id
      }

      // 4. GRAVAR MEMBROS (Esta é a parte que faltava na tua imagem)
      if (membros.length > 0) {
        const payloadMembros = membros.map((m, idx) => ({
          comissao_id: idActivo,
          perfil_id: m.id,
          cargo_na_comissao: m.cargo,
          ordem: idx + 1 // Grava a ordem que definimos com as setas
        }))
        
        const { error: errMembros } = await supabase.from('comissao_membros').insert(payloadMembros)
        if (errMembros) throw errMembros
      }

      // 5. Sucesso e Redirecionamento
      alert(isEditing ? "Alterações guardadas!" : "Comissão criada!")
      router.push('/equipa-distrital')
      router.refresh()

    } catch (e: any) { 
      alert("Erro ao gravar: " + e.message) 
    } finally { 
      setLoading(false) 
    }
  }


  if (!dataLoaded) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4 text-gray-400">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-xs uppercase tracking-widest">A carregar Nexus...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto pb-24 text-gray-900 font-medium animate-in fade-in duration-700">
      
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-8">
        <Link href="/equipa-distrital" className="hover:text-[#004a99] transition-colors">Administração</Link> 
        <ChevronRight size={14} /> 
        <span className="text-[#002d5e]">{isEditing ? 'Editar Comissão' : 'Nova Comissão'}</span>
      </nav>

      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-[44px] font-black text-[#002d5e] tracking-tighter leading-none mb-4">
            {isEditing ? 'Editar Comissão' : 'Criar Comissão'}
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            {isEditing 
              ? 'Pode alterar o nome, a descrição e a hierarquia dos membros que compõem este grupo de trabalho.'
              : 'Defina os objetivos da nova comissão e selecione os sócios que a irão integrar.'}
          </p>
        </div>
        
        <div className="hidden md:block w-72 h-36 bg-[#001b3d] rounded-[24px] overflow-hidden shadow-2xl border border-white/10 relative group">
           <img 
             src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400" 
             className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" 
           />
           <div className="absolute inset-0 bg-gradient-to-tr from-[#001b3d] via-transparent to-blue-500/20"></div>
           <div className="absolute bottom-4 left-4">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/20">
                 <Users className="text-white" size={20} />
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* COLUNA ESQUERDA: CONFIGURAÇÃO */}
        <aside className="lg:col-span-5 space-y-8">
          <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8 relative overflow-hidden">
            <div className="flex items-center gap-3 text-[#002d5e]">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Info size={22}/></div>
              <h3 className="text-xl font-black tracking-tight">Informação Geral</h3>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Nome da Comissão</label>
              <input 
                value={nome} 
                onChange={e => setNome(e.target.value)} 
                className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all" 
                placeholder="Ex: Projetos Comunitários 2026" 
              />
            </div>

            <div className="space-y-3 relative" ref={dropdownRefIcon}>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Identidade Visual (Ícone)</label>
              <button 
                onClick={() => setShowIconDropdown(!showIconDropdown)}
                className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl p-4 flex items-center justify-between text-sm font-bold hover:bg-white transition-all"
              >
                <div className="flex items-center gap-3 text-[#004a99]">
                  <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    {OPCOES_ICONES.find(o => o.id === icone)?.icon}
                  </div>
                  {OPCOES_ICONES.find(o => o.id === icone)?.nome}
                </div>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${showIconDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showIconDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                  {OPCOES_ICONES.map(opcao => (
                    <div 
                      key={opcao.id}
                      onClick={() => { setIcone(opcao.id); setShowIconDropdown(false); }}
                      className="p-4 hover:bg-blue-50 cursor-pointer flex items-center gap-4 text-sm font-bold text-gray-700 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${icone === opcao.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {opcao.icon}
                      </div>
                      {opcao.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Descrição e Objetivos</label>
              <textarea 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
                rows={6}
                className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-medium text-gray-600 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none" 
                placeholder="Descreva o propósito desta comissão..."
              />
            </div>
          </section>

          <div className="bg-orange-50 border border-orange-100 rounded-[24px] p-6 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0"><AlertCircle size={20} /></div>
            <p className="text-sm text-orange-800 font-bold leading-relaxed">
              Lembre-se: A ordem definida na tabela à direita será a ordem de exibição pública no site.
            </p>
          </div>
        </aside>

        {/* COLUNA DIREITA: MEMBROS E HIERARQUIA */}
        <main className="lg:col-span-7 space-y-8">
          
          <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm border-t-8 border-t-[#fca311]">
            <div className="flex items-center gap-3 text-[#002d5e] font-black mb-8">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><UserPlus size={22}/></div>
              <h3 className="text-xl font-black tracking-tight">Adicionar à Comissão</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="relative" ref={dropdownRefMembro}>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-1">Procurar Sócio</label>
                <div className="relative">
                  <input 
                    value={searchMembro} 
                    onChange={e => {setSearchMembro(e.target.value); setShowMembroDropdown(true)}} 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 pr-12 text-sm font-bold focus:border-blue-500 outline-none transition-all" 
                    placeholder="Nome do Sócio" 
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                </div>
                {showMembroDropdown && searchMembro && (
                  <ul className="absolute z-50 w-full bg-white border-2 border-gray-100 rounded-2xl shadow-2xl mt-2 max-h-60 overflow-auto">
                    {perfis.filter(p => `${p.primeiro_nome} ${p.apelido}`.toLowerCase().includes(searchMembro.toLowerCase())).map(p => (
                      <li key={p.id} onClick={() => {setMembroSelecionado(p); setSearchMembro(`${p.primeiro_nome} ${p.apelido}`); setShowMembroDropdown(false)}} className="p-4 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden"><img src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.primeiro_nome}`} className="w-full h-full object-cover" /></div>
                        <span className="text-sm font-bold text-gray-900">{p.primeiro_nome} {p.apelido}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-1">Cargo/Função</label>
                <input 
                  value={cargoMembro} 
                  onChange={e => setCargoMembro(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && adicionarMembroLista()}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all" 
                  placeholder="Presidente, Vogal, etc..." 
                />
              </div>
            </div>
            
            <button 
              onClick={adicionarMembroLista} 
              className="w-full bg-[#002d5e] text-white py-5 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-3 hover:bg-[#001b3d] hover:-translate-y-1 transition-all active:translate-y-0"
            >
              <Plus size={20}/> Adicionar à Estrutura
            </button>
          </section>

          {/* TABELA DE MEMBROS ADICIONADOS */}
          <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-sm font-black text-[#002d5e] uppercase tracking-[0.2em]">Estrutura Atual</h4>
              <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">{membros.length} Integrantes</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                    <th className="px-4 pb-2 w-24">Ordem</th>
                    <th className="px-4 pb-2">Sócio</th>
                    <th className="px-4 pb-2">Cargo</th>
                    <th className="px-4 pb-2 text-right">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {membros.map((m, idx) => (
                    <tr key={m.id} className="group bg-gray-50/50 hover:bg-white hover:shadow-md transition-all duration-300">
                      <td className="px-4 py-4 rounded-l-2xl">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col text-gray-300">
                            <button onClick={() => moverMembro(idx, 'subir')} className="hover:text-blue-500 transition-colors"><ChevronUp size={16}/></button>
                            <button onClick={() => moverMembro(idx, 'descer')} className="hover:text-blue-500 transition-colors"><ChevronDown size={16}/></button>
                          </div>
                          <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-gray-100 font-black text-xs text-[#002d5e] shadow-sm">
                            {idx + 1}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                            <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 leading-tight">{m.primeiro_nome} {m.apelido}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{m.cargo_clube || 'Membro do Distrito'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="bg-white text-[#004a99] border border-blue-100 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm">
                          {m.cargo}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right rounded-r-2xl">
                        <button 
                          onClick={() => setMembros(membros.filter(x => x.id !== m.id))} 
                          className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {membros.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-300">
                           <UserPlus size={40} strokeWidth={1} />
                           <p className="font-medium italic">A lista de membros está vazia.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* FOOTER DE ACÇÕES */}
      <footer className="mt-16 pt-10 border-t-2 border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <button 
          onClick={() => router.back()} 
          className="w-full md:w-auto px-12 py-5 rounded-2xl border-2 border-gray-100 font-black text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
        >
          Descartar Alterações
        </button>
        <button 
          onClick={handleGuardar} 
          disabled={loading} 
          className="w-full md:w-auto bg-[#fca311] text-white px-16 py-5 rounded-2xl font-black text-sm shadow-2xl flex items-center justify-center gap-3 hover:bg-[#e5940e] hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50"
        >
          {loading ? 'A processar...' : (
            <>
              {isEditing ? 'Guardar Configurações' : 'Finalizar Criação'} 
              <CheckCircle size={20}/>
            </>
          )}
        </button>
      </footer>
    </div>
  )
}