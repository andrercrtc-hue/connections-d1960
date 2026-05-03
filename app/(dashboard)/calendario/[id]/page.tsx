'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, MapPin, Link as LinkIcon, Save, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function GestaoEvento() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const id = params.id as string
  const isEditing = id !== 'novo'
  const clubeId = searchParams.get('clubeId')

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    local: '',
    categoria: 'Conselho',
    link: '',
    cor_etiqueta: '#002d5e'
  })

  useEffect(() => {
    if (isEditing) {
      async function carregarEvento() {
        const { data } = await supabase.from('eventos').select('*').eq('id', id).single()
        if (data) {
          setForm({
            ...data,
            data_inicio: data.data_inicio.slice(0, 16), // Ajuste para input datetime-local
            data_fim: data.data_fim?.slice(0, 16) || ''
          })
        }
      }
      carregarEvento()
    }
  }, [id, isEditing])

  const handleGuardar = async () => {
    if (!form.titulo || !form.data_inicio) return alert("Preencha os campos obrigatórios.")
    setLoading(true)

    const dados = { ...form, clube_id: clubeId || null }

    const { error } = isEditing 
      ? await supabase.from('eventos').update(dados).eq('id', id)
      : await supabase.from('eventos').insert([dados])

    if (!error) {
      alert(isEditing ? "Evento atualizado!" : "Evento criado!")
      router.push('/calendario')
      router.refresh()
    } else {
      alert("Erro: " + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft /></button>
        <h1 className="text-3xl font-black text-[#002d5e]">{isEditing ? 'Editar Evento' : 'Novo Evento'}</h1>
      </header>

      <div className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Título */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Título do Evento *</label>
          <input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl p-4 font-bold outline-none focus:border-blue-500 transition-all" />
        </div>

        {/* Datas */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Início *</label>
          <input type="datetime-local" value={form.data_inicio} onChange={e => setForm({...form, data_inicio: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl p-4 font-bold outline-none focus:border-blue-500 transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Fim</label>
          <input type="datetime-local" value={form.data_fim} onChange={e => setForm({...form, data_fim: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl p-4 font-bold outline-none focus:border-blue-500 transition-all" />
        </div>

        {/* Local e Categoria */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Local</label>
          <input value={form.local} onChange={e => setForm({...form, local: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl p-4 font-bold outline-none focus:border-blue-500 transition-all" placeholder="Ex: Sede ou Link Zoom" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Categoria (Dropdown)</label>
          <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl p-4 font-bold outline-none focus:border-blue-500 transition-all appearance-none">
            <option value="Conselho">Conselho</option>
            <option value="Projetos">Projetos</option>
            <option value="Visitas Oficiais">Visitas Oficiais</option>
            <option value="Formação">Formação</option>
          </select>
        </div>

        {/* Link e Cor */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Link de Inscrição</label>
          <input value={form.link} onChange={e => setForm({...form, link: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl p-4 font-bold outline-none focus:border-blue-500 transition-all" placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Cor da Etiqueta</label>
          <input type="color" value={form.cor_etiqueta} onChange={e => setForm({...form, cor_etiqueta: e.target.value})} className="w-full h-[58px] bg-gray-50 border-2 border-gray-50 rounded-xl p-2 outline-none cursor-pointer" />
        </div>

        <button 
          onClick={handleGuardar}
          disabled={loading}
          className="md:col-span-2 w-full bg-[#002d5e] text-white py-5 rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50"
        >
          {loading ? 'A gravar...' : 'Guardar Evento'}
        </button>
      </div>
    </div>
  )
}