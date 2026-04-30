'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Info, Users, Search, Plus, Trash2, Layout, 
  CheckCircle, ChevronRight, Star, UserPlus
} from 'lucide-react'
import Link from 'next/link'

export default function NovaComissao() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [perfis, setPerfis] = useState<any[]>([])

  // Estados do Formulário
  const [nome, setNome] = useState('')
  const [icone, setIcone] = useState('groups')
  const [presidente, setPresidente] = useState<any>(null)
  
  // Estado para a lista temporária de membros
  const [membros, setMembros] = useState<any[]>([])

  // Estados de Pesquisa (Presidente)
  const [searchPres, setSearchPres] = useState('')
  const [showPresDropdown, setShowPresDropdown] = useState(false)
  
  // Estados de Pesquisa (Membros)
  const [searchMembro, setSearchMembro] = useState('')
  const [cargoMembro, setCargoMembro] = useState('')
  const [membroSelecionado, setMembroSelecionado] = useState<any>(null)
  const [showMembroDropdown, setShowMembroDropdown] = useState(false)

  const dropdownRefPres = useRef<HTMLDivElement>(null)
  const dropdownRefMembro = useRef<HTMLDivElement>(null)

  // Carregar todos os sócios da base de dados ao abrir a página
  useEffect(() => {
    async function fetchPerfis() {
      const { data } = await supabase.from('perfis').select('*').order('primeiro_nome')
      if (data) setPerfis(data)
    }
    fetchPerfis()

    // Fechar dropdowns ao clicar fora
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRefPres.current && !dropdownRefPres.current.contains(e.target as Node)) setShowPresDropdown(false)
      if (dropdownRefMembro.current && !dropdownRefMembro.current.contains(e.target as Node)) setShowMembroDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Função para adicionar membro à lista temporária na UI
  const adicionarMembroLista = () => {
    if (!membroSelecionado) {
      alert("Por favor, selecione um sócio da lista.")
      return
    }
    if (!cargoMembro.trim()) {
      alert("Por favor, defina o cargo deste sócio na comissão.")
      return
    }

    const novoMembro = {
      ...membroSelecionado,
      cargo: cargoMembro
    }

    setMembros([...membros, novoMembro])
    
    // Limpar campos após adicionar
    setMembroSelecionado(null)
    setSearchMembro('')
    setCargoMembro('')
  }

  // Função principal para gravar tudo no Supabase
  const handleCriarComissao = async () => {
    if (!nome || !presidente) {
      alert("Preencha o nome da comissão e selecione um presidente.")
      return
    }
    setLoading(true)
    
    // 1. Inserir a Comissão
    const { data: com, error: errC } = await supabase
      .from('comissoes')
      .insert([{ nome, icone, presidente_id: presidente.id }])
      .select().single()

    if (errC) {
      alert("Erro ao criar comissão: " + errC.message)
      setLoading(false)
      return
    }

    // 2. Inserir os Membros Adicionados (se existirem)
    if (membros.length > 0) {
      const inserts = membros.map(m => ({
        comissao_id: com.id,
        perfil_id: m.id,
        cargo_na_comissao: m.cargo
      }))
      await supabase.from('comissao_membros').insert(inserts)
    }

    alert("Comissão criada com sucesso!")
    router.push('/equipa-distrital')
    setLoading(false)
  }

  // Função para obter as iniciais caso não haja foto
  const getInitials = (nome: string, apelido: string) => {
    return `${nome?.charAt(0) || ''}${apelido?.charAt(0) || ''}`.toUpperCase()
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 text-gray-900 font-medium animate-in fade-in duration-500">
      
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-6">
        <Link href="/equipa-distrital" className="hover:text-[#004a99] transition">Administração</Link> 
        <ChevronRight size={16} /> 
        <span className="text-[#002d5e]">Nova Comissão</span>
      </nav>

      {/* HEADER EXATAMENTE COMO NA IMAGEM 3 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="max-w-2xl">
          <h1 className="text-[40px] font-black text-[#002d5e] tracking-tight mb-3">Criar Nova Comissão</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            Configure uma nova comissão de serviço, defina a liderança e adicione membros ativos para iniciar os trabalhos e projetos.
          </p>
        </div>
        
        {/* Imagem decorativa de sala de reunião */}
        <div className="hidden md:block w-64 h-32 bg-[#001b3d] rounded-2xl overflow-hidden shadow-lg border border-gray-100 flex-shrink-0 relative">
           <img 
             src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400" 
             className="w-full h-full object-cover opacity-80 mix-blend-luminosity" 
             alt="Reunião"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#001b3d] to-transparent opacity-60"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ==========================================
            COLUNA ESQUERDA: INFORMAÇÃO BÁSICA
        ========================================== */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-7 flex-1">
            <div className="flex items-center gap-3 text-[#002d5e]">
              <Info size={24}/> 
              <h3 className="text-xl font-black tracking-tight">Informação Básica</h3>
            </div>
            
            {/* Campo Nome */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Nome da Comissão</label>
              <input 
                value={nome} 
                onChange={e => setNome(e.target.value)} 
                className="w-full bg-white border-2 border-gray-100 rounded-xl p-4 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 transition-colors" 
                placeholder="Ex: Comissão de Projetos Comunitários" 
              />
            </div>

            {/* Campo Ícone */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Ícone da Comissão</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    value={icone} 
                    onChange={e => setIcone(e.target.value)} 
                    className="w-full bg-white border-2 border-gray-100 rounded-xl p-4 pl-12 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 transition-colors" 
                    placeholder="groups" 
                  />
                </div>
                <div className="w-14 h-14 bg-[#eff4f9] rounded-xl border border-gray-200 flex items-center justify-center text-[#004a99]">
                  <Layout size={24} />
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium italic mt-1">
                Use nomes de <span className="font-bold text-gray-500">Material Symbols</span> para personalizar visualmente a comissão.
              </p>
            </div>

            {/* Campo Presidente */}
            <div className="space-y-2 relative" ref={dropdownRefPres}>
              <label className="text-sm font-bold text-gray-700">Presidente da Comissão</label>
              <div className="relative">
                <input 
                  value={searchPres} 
                  onChange={e => {setSearchPres(e.target.value); setShowPresDropdown(true)}} 
                  onFocus={() => setShowPresDropdown(true)} 
                  className="w-full bg-white border-2 border-gray-100 rounded-xl p-4 pr-12 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 transition-colors" 
                  placeholder="Seleccionar Sócio..." 
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              </div>
              
              {/* Dropdown Autocomplete */}
              {showPresDropdown && searchPres && (
                <ul className="absolute z-50 w-full bg-white border-2 border-gray-100 rounded-xl shadow-xl mt-2 max-h-56 overflow-y-auto">
                  {perfis.filter(p => `${p.primeiro_nome} ${p.apelido}`.toLowerCase().includes(searchPres.toLowerCase())).map(p => (
                    <li 
                      key={p.id} 
                      onClick={() => {setPresidente(p); setSearchPres(`${p.primeiro_nome} ${p.apelido}`); setShowPresDropdown(false)}} 
                      className="p-4 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                        <img src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.primeiro_nome}`} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">{p.primeiro_nome} {p.apelido}</span>
                    </li>
                  ))}
                  {perfis.filter(p => `${p.primeiro_nome} ${p.apelido}`.toLowerCase().includes(searchPres.toLowerCase())).length === 0 && (
                    <li className="p-4 text-sm text-gray-400 italic text-center">Nenhum sócio encontrado.</li>
                  )}
                </ul>
              )}
              <p className="text-xs text-gray-400 font-medium mt-1">
                O Presidente é o responsável máximo pela gestão e relatórios da comissão.
              </p>
            </div>
          </section>

          {/* DICA DE GESTÃO (Exatamente como na Imagem 3) */}
          <div className="bg-[#faf8f5] border border-[#f5ead9] rounded-[24px] p-6 flex gap-4 mt-6">
            <div className="w-10 h-10 rounded-full bg-[#dfb160] text-white flex items-center justify-center flex-shrink-0 shadow-inner">
               <Star size={20} fill="currentColor" />
            </div>
            <div>
              <h4 className="text-[#004a99] font-black mb-1">Dica de Gestão</h4>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Comissões com 5 a 8 membros tendem a ser 40% mais produtivas na execução de projetos anuais.
              </p>
            </div>
          </div>
        </div>

        {/* ==========================================
            COLUNA DIREITA: ADICIONAR MEMBROS E TABELA
        ========================================== */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Caixa Superior: Formulário de Adicionar Membro */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm border-t-4 border-t-[#fca311]">
            <div className="flex items-center gap-3 text-[#002d5e] mb-6">
              <UserPlus size={24}/> 
              <h3 className="text-xl font-black tracking-tight">Adicionar Membros</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Pesquisar Sócio */}
              <div className="relative" ref={dropdownRefMembro}>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Procurar Sócio</label>
                <div className="relative">
                  <input 
                    value={searchMembro} 
                    onChange={e => {setSearchMembro(e.target.value); setShowMembroDropdown(true); setMembroSelecionado(null)}} 
                    className="w-full bg-white border-2 border-gray-100 rounded-xl p-4 pr-12 text-sm font-medium focus:border-blue-500 transition-colors outline-none" 
                    placeholder="Nome ou ID do Sócio" 
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                
                {showMembroDropdown && searchMembro && (
                  <ul className="absolute z-50 w-full bg-white border-2 border-gray-100 rounded-xl shadow-xl mt-2 max-h-56 overflow-auto">
                    {perfis.filter(p => `${p.primeiro_nome} ${p.apelido}`.toLowerCase().includes(searchMembro.toLowerCase())).map(p => (
                      <li 
                        key={p.id} 
                        onClick={() => {setMembroSelecionado(p); setSearchMembro(`${p.primeiro_nome} ${p.apelido}`); setShowMembroDropdown(false)}} 
                        className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-sm font-bold text-gray-900">{p.primeiro_nome} {p.apelido}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Cargo na Comissão */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Cargo na Comissão</label>
                <input 
                  value={cargoMembro} 
                  onChange={e => setCargoMembro(e.target.value)} 
                  className="w-full bg-white border-2 border-gray-100 rounded-xl p-4 text-sm font-medium focus:border-blue-500 transition-colors outline-none" 
                  placeholder="Ex: Vogal, Tesoureiro..." 
                  onKeyDown={(e) => e.key === 'Enter' && adicionarMembroLista()}
                />
              </div>
            </div>
            
            <button 
              onClick={adicionarMembroLista} 
              className="w-full bg-[#002d5e] text-white py-4 rounded-xl font-bold text-sm hover:bg-blue-900 transition flex items-center justify-center gap-2"
            >
              <Plus size={20}/> Adicionar Membro
            </button>
          </section>

          {/* Caixa Inferior: Tabela de Membros Adicionados */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-black text-[#002d5e]">Membros Adicionados</h4>
              <span className="bg-[#eef4ff] text-[#3178c6] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                {membros.length} Membros
              </span>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="pb-4 text-gray-400 font-bold uppercase tracking-widest text-xs">Sócio</th>
                    <th className="pb-4 text-gray-400 font-bold uppercase tracking-widest text-xs">Cargo</th>
                    <th className="pb-4 text-right text-gray-400 font-bold uppercase tracking-widest text-xs">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {membros.map((m) => (
                    <tr key={m.id} className="group">
                      <td className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] font-bold text-xs overflow-hidden border border-gray-200 flex-shrink-0">
                            {m.avatar_url ? (
                              <img src={m.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(m.primeiro_nome, m.apelido)
                            )}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 leading-tight">{m.primeiro_nome} {m.apelido}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                              {m.cargo_clube ? `CLUBE ${m.cargo_clube}` : 'SEM CLUBE'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="bg-[#eef4ff] text-[#3178c6] px-3 py-1.5 rounded-full text-[11px] font-bold">
                          {m.cargo}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => setMembros(membros.filter(x => x.id !== m.id))} 
                          className="text-red-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-lg inline-flex"
                          title="Remover Membro"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {membros.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-400 font-medium italic">
                        Nenhum membro adicionado até ao momento. Pesquise e adicione acima.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>

      {/* ==========================================
          RODAPÉ / ACÇÕES GLOBAIS
      ========================================== */}
      <div className="mt-10 pt-8 border-t-2 border-gray-100 flex justify-between items-center">
        <button 
          onClick={() => router.back()} 
          className="px-8 py-4 rounded-xl border-2 border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button 
          onClick={handleCriarComissao} 
          disabled={loading} 
          className="bg-[#fca311] text-white px-10 py-4 rounded-xl font-black text-sm shadow-xl flex items-center gap-2 hover:bg-[#e5940e] transition-colors disabled:opacity-50"
        >
          {loading ? 'A processar...' : <><span className="mr-1">Criar Comissão</span> <CheckCircle size={20}/></>}
        </button>
      </div>

    </div>
  )
}