'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Send, Filter, ChevronLeft, ChevronRight, 
  MessageSquare, AlertCircle, Clock 
} from 'lucide-react'
import Link from 'next/link'

export default function ComunicacaoClube() {
  const [loading, setLoading] = useState(true)
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [perfil, setPerfil] = useState<any>(null)
  
  // Estado do Formulário focado no 'tipo'
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'normal', // Valor padrão
    data_expiracao: '',
    conteudo: ''
  })

  useEffect(() => {
    async function carregarDados() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: perfilData } = await supabase
        .from('perfis')
        .select('*, cargos_clube_config(nivel_acesso)')
        .eq('id', user.id)
        .single()

      if (perfilData) {
        setPerfil(perfilData)
        const { data: anunciosData } = await supabase
          .from('anuncios')
          .select('*')
          .eq('clube_id', perfilData.clube_id)
          .order('criado_at', { ascending: false })
        
        if (anunciosData) setAnuncios(anunciosData)
      }
      setLoading(false)
    }
    carregarDados()
  }, [])

  const handlePublicar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo || !form.conteudo) {
      alert("Preencha o título e o conteúdo!")
      return
    }

    const { error } = await supabase
      .from('anuncios')
      .insert([{
        titulo: form.titulo,
        descricao: form.conteudo,
        tipo: form.tipo, // Aqui envia 'normal' ou 'urgente'
        data_expiracao: form.data_expiracao || null,
        clube_id: perfil.clube_id,
        criado_por: perfil.id
      }])

    if (error) {
      alert("Erro ao publicar: " + error.message)
    } else {
      alert("Anúncio publicado com sucesso!")
      window.location.reload()
    }
  }

  if (loading) return <div className="p-20 text-center font-black">A carregar painel de comunicação...</div>

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="space-y-2">
        <div className="flex items-center gap-4">
          <Link href="/o-meu-clube" className="text-gray-400 hover:text-[#002d5e] transition">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-4xl font-black text-[#002d5e] tracking-tight">Comunicação do Clube</h1>
        </div>
        <p className="text-gray-500 ml-10">
          Gira os avisos e comunicações oficiais para os teus membros.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORMULÁRIO */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 space-y-6 sticky top-8">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
              <MessageSquare className="text-blue-600" size={20} />
              <h2 className="text-xl font-black text-[#002d5e]">Criar Novo Anúncio</h2>
            </div>

            <form onSubmit={handlePublicar} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Título</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Próxima Assembleia"
                  className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                  onChange={(e) => setForm({...form, titulo: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Prioridade</label>
                  <select 
                    value={form.tipo}
                    className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm outline-none cursor-pointer font-bold text-[#002d5e]"
                    onChange={(e) => setForm({...form, tipo: e.target.value})}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Expira em</label>
                  <input 
                    type="date"
                    className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm outline-none"
                    onChange={(e) => setForm({...form, data_expiracao: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Mensagem</label>
                <textarea 
                  rows={6}
                  required
                  placeholder="Escreve aqui os detalhes..."
                  className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                  onChange={(e) => setForm({...form, conteudo: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#002d5e] text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20"
              >
                <Send size={18} /> Publicar Agora
              </button>
            </form>
          </div>
        </div>

        {/* TABELA DE GESTÃO */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100">
              <span className="text-[10px] font-black text-blue-500 uppercase">Total Ativos</span>
              <p className="text-3xl font-black text-[#002d5e]">{anuncios.length}</p>
            </div>
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
              <span className="text-[10px] font-black text-red-500 uppercase">Urgentes</span>
              <p className="text-3xl font-black text-red-600">
                {anuncios.filter(a => a.tipo === 'urgente').length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-black text-[#002d5e]">Histórico de Anúncios</h2>
              <Filter size={18} className="text-gray-400" />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/30 text-[10px] font-black uppercase text-gray-400">
                  <tr>
                    <th className="px-8 py-4">Título</th>
                    <th className="px-8 py-4">Tipo</th>
                    <th className="px-8 py-4 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {anuncios.map((anuncio) => (
                    <tr key={anuncio.id} className="group hover:bg-gray-50/50 transition">
                      <td className="px-8 py-5">
                        <p className="font-bold text-[#002d5e] text-sm">{anuncio.titulo}</p>
                        <p className="text-[10px] text-gray-400 line-clamp-1">{anuncio.descricao}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                          anuncio.tipo === 'urgente' 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-blue-100 text-blue-600'
                        }`}>
                          {anuncio.tipo}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right text-xs text-gray-400 font-medium">
                        {new Date(anuncio.criado_at).toLocaleDateString('pt-PT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}