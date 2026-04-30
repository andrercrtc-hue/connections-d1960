'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Info, Users, Search, Plus, Trash2, X, Check, 
  ArrowLeft, Layout, type Icon as LucideIcon, Save
} from 'lucide-react'
import Link from 'next/link'

// Tipagem para membros temporários na lista
interface MembroAdicionado {
  id: string
  nome: string
  apelido: string
  email: string
  avatar_url: string
  cargo: string
}

export default function NovaComissao() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [perfis, setPerfis] = useState<any[]>([])

  // Estados da Comissão
  const [nome, setNome] = useState('')
  const [icone, setIcone] = useState('groups')
  const [presidente, setPresidente] = useState<any>(null)
  const [membros, setMembros] = useState<MembroAdicionado[]>([])

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

  useEffect(() => {
    async function fetchPerfis() {
      const { data } = await supabase.from('perfis').select('*').order('primeiro_nome')
      if (data) setPerfis(data)
    }
    fetchPerfis()

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRefPres.current && !dropdownRefPres.current.contains(e.target as Node)) setShowPresDropdown(false)
      if (dropdownRefMembro.current && !dropdownRefMembro.current.contains(e.target as Node)) setShowMembroDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Função para adicionar membro à lista temporária
  const adicionarMembroALista = () => {
    if (!membroSelecionado || !cargoMembro.trim()) return
    
    const novo = {
      id: membroSelecionado.id,
      nome: membroSelecionado.primeiro_nome,
      apelido: membroSelecionado.apelido,
      email: membroSelecionado.email,
      avatar_url: membroSelecionado.avatar_url,
      cargo: cargoMembro
    }

    setMembros([...membros, novo])
    setMembroSelecionado(null)
    setSearchMembro('')
    setCargoMembro('')
  }

  const removerMembroDaLista = (id: string) => {
    setMembros(membros.filter(m => m.id !== id))
  }

  // Gravar no Supabase
  const handleCriarComissao = async () => {
    if (!nome || !presidente) {
      alert("Por favor, preencha o nome da comissão e selecione um presidente.")
      return
    }

    setLoading(true)
    
    // 1. Inserir a Comissão
    const { data: comissao, error: errC } = await supabase
      .from('comissoes')
      .insert([{ nome, icone, presidente_id: presidente.id }])
      .select()
      .single()

    if (errC) {
      alert("Erro ao criar comissão: " + errC.message)
      setLoading(false)
      return
    }

    // 2. Inserir Membros
    if (membros.length > 0) {
      const inserts = membros.map(m => ({
        comissao_id: comissao.id,
        perfil_id: m.id,
        cargo_na_comissao: m.cargo
      }))
      await supabase.from('comissao_membros').insert(inserts)
    }

    alert("Comissão criada com sucesso!")
    router.push('/equipa-distrital')
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      
      {/* NAVEGAÇÃO / BREADCRUMB */}
      <nav className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-6">
        <Link href="/equipa-distrital" className="hover:text-[#004a99] transition">Administração</Link>
        <span>&rsaquo;</span>
        <span className="text-gray-900 font-medium">Nova Comissão</span>
      </nav>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black text-[#002d5e] tracking-tighter mb-2">Criar Nova Comissão</h1>
          <p className="text-gray-500 font-medium text-sm">
            Configure uma nova comissão de serviço, defina a liderança e adicione membros ativos para iniciar os trabalhos e projetos.
          </p>
        </div>
        <div className="hidden md:block w-48 h-24 bg-blue-900 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
           <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover opacity-60" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: INFORMAÇÃO BÁSICA */}
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-[#004a99] mb-2">
              <div className="p-2 bg-blue-50 rounded-lg"><Info size={20}/></div>
              <h3 className="text-lg font-black tracking-tight">Informação Básica</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-900 uppercase tracking-widest">Nome da Comissão</label>
              <input 
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-900 font-medium outline-none focus:ring-2 focus:ring-blue-50 transition" 
                placeholder="Ex: Comissão de Projetos Comunitários" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-900 uppercase tracking-widest">Ícone da Comissão</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    value={icone}
                    onChange={e => setIcone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-sm text-gray-900 font-medium outline-none" 
                    placeholder="groups, settings, heart..." 
                  />
                </div>
                <div className="w-14 h-14 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center text-blue-900 shadow-inner">
                  <Layout size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">Use nomes de Material Symbols para personalizar visualmente.</p>
            </div>

            <div className="space-y-2 relative" ref={dropdownRefPres}>
              <label className="text-xs font-black text-gray-900 uppercase tracking-widest">Presidente da Comissão</label>
              <div className="relative">
                <input 
                  value={searchPres}
                  onChange={e => { setSearchPres(e.target.value); setShowPresDropdown(true); }}
                  onFocus={() => setShowPresDropdown(true)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pr-12 text-sm text-gray-900 font-medium outline-none focus:ring-2 focus:ring-blue-50" 
                  placeholder="Pesquisar sócio..." 
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
              
              {showPresDropdown && searchPres.length > 0 && (
                <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden">
                  {perfis.filter(p => `${p.primeiro_nome} ${p.apelido}`.toLowerCase().includes(searchPres.toLowerCase())).map(p => (
                    <li key={p.id} onClick={() => { setPresidente(p); setSearchPres(`${p.primeiro_nome} ${p.apelido}`); setShowPresDropdown(false); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden"><img src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.primeiro_nome}`} className="w-full h-full object-cover" /></div>
                      <span className="text-sm font-bold text-gray-900">{p.primeiro_nome} {p.apelido}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[10px] text-gray-400 font-medium pt-1">O Presidente é o responsável máximo pela gestão e relatórios da comissão.</p>
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: ADICIONAR MEMBROS */}
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-[#004a99] mb-2">
              <div className="p-2 bg-blue-50 rounded-lg"><Users size={20}/></div>
              <h3 className="text-lg font-black tracking-tight">Adicionar Membros</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 relative" ref={dropdownRefMembro}>
                <label className="text-xs font-black text-gray-900 uppercase tracking-widest">Procurar Sócio</label>
                <div className="relative">
                  <input 
                    value={searchMembro}
                    onChange={e => { setSearchMembro(e.target.value); setShowMembroDropdown(true); setMembroSelecionado(null); }}
                    onFocus={() => setShowMembroDropdown(true)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-900 font-medium outline-none" 
                    placeholder="Nome ou ID do Sócio" 
                  />
                  <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                </div>
                {showMembroDropdown && searchMembro.length > 1 && (
                  <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden">
                    {perfis.filter(p => `${p.primeiro_nome} ${p.apelido}`.toLowerCase().includes(searchMembro.toLowerCase())).map(p => (
                      <li key={p.id} onClick={() => { setMembroSelecionado(p); setSearchMembro(`${p.primeiro_nome} ${p.apelido}`); setShowMembroDropdown(false); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0">
                        <span className="text-sm font-bold text-gray-900">{p.primeiro_nome} {p.apelido}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-900 uppercase tracking-widest">Cargo na Comissão</label>
                <input 
                  value={cargoMembro}
                  onChange={e => setCargoMembro(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-900 font-medium outline-none" 
                  placeholder="Ex: Vogal, Tesoureiro..." 
                />
              </div>
            </div>

            <button 
              onClick={adicionarMembroALista}
              className="w-full bg-[#004a99] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-[#00356d] transition shadow-lg shadow-blue-50"
            >
              <Plus size={18}/> Adicionar Membro
            </button>

            {/* TABELA DE MEMBROS ADICIONADOS */}
            <div className="pt-6 border-t border-gray-50">
              <div className="flex justify-between items-center mb-6">
                 <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Membros Adicionados</h4>
                 <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{membros.length} Membros</span>
              </div>

              <div className="space-y-4">
                {membros.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-50 group hover:bg-white hover:border-blue-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.nome}`} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none mb-1">{m.nome} {m.apelido}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Clube de Oeiras</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="bg-white px-3 py-1.5 rounded-full text-[10px] font-black text-blue-500 uppercase shadow-sm">{m.cargo}</span>
                      <button onClick={() => removerMembroDaLista(m.id)} className="text-red-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>
                ))}
                {membros.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-[24px]">
                    <p className="text-gray-300 text-sm italic">Nenhum membro adicionado até ao momento.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* RODAPÉ DE AÇÕES */}
      <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
        <button 
          onClick={() => router.back()}
          className="px-8 py-3.5 rounded-xl border-2 border-gray-100 text-gray-500 font-black text-sm hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button 
          onClick={handleCriarComissao}
          disabled={loading}
          className="bg-gradient-to-r from-[#fca311] to-[#ffb331] text-white px-10 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-orange-100 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {loading ? 'A Gravar...' : <><Save size={18}/> Criar Comissão</>}
        </button>
      </div>
    </div>
  )
}