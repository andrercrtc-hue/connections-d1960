'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Save, Clock, MapPin, 
  RefreshCw, Globe, CheckCircle2, AlertCircle 
} from 'lucide-react'
import Link from 'next/link'

export default function EditarDadosReuniao() {
  const params = useParams()
  const router = useRouter()
  const clubeId = params.id as string
  
  // Estados do Formulário
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' })

  const [formData, setFormData] = useState({
    dia_reuniao: '',
    hora_reuniao: '',
    periodicidade_reuniao: 'Semanalmente',
    tipo_reuniao: 'Presencial',
    local_reuniao: ''
  })

  // 1. Carregar dados atuais
  useEffect(() => {
    async function carregarDados() {
      const { data, error } = await supabase
        .from('clubes')
        .select('dia_reuniao, hora_reuniao, periodicidade_reuniao, tipo_reuniao, local_reuniao')
        .eq('id', clubeId)
        .single()

      if (data) {
        setFormData({
          dia_reuniao: data.dia_reuniao || '',
          hora_reuniao: data.hora_reuniao || '',
          periodicidade_reuniao: data.periodicidade_reuniao || 'Semanalmente',
          tipo_reuniao: data.tipo_reuniao || 'Presencial',
          local_reuniao: data.local_reuniao || ''
        })
      }
      setLoading(false)
    }
    if (clubeId) carregarDados()
  }, [clubeId])

  // 2. Guardar Alterações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMensagem({ tipo: '', texto: '' })

    const { error } = await supabase
      .from('clubes')
      .update(formData)
      .eq('id', clubeId)

    if (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao guardar: ' + error.message })
    } else {
      setMensagem({ tipo: 'sucesso', texto: 'Dados atualizados com sucesso!' })
      setTimeout(() => router.push(`/diretorio-clubes/${clubeId}?view=gestao`), 1500)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">A carregar formulário...</div>

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <Link 
            href={`/diretorio-clubes/${clubeId}?view=gestao`}
            className="text-sm text-gray-400 hover:text-[#002d5e] flex items-center gap-2 transition-colors mb-2"
          >
            <ArrowLeft size={16} /> Voltar à Gestão
          </Link>
          <h1 className="text-3xl font-black text-[#002d5e] uppercase tracking-tighter">
            Dados da Reunião
          </h1>
          <p className="text-gray-500 text-sm">Atualiza as informações de logradouro e horário para os sócios e público.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DIA DA REUNIÃO */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#002d5e] uppercase tracking-widest ml-1">Dia da Semana</label>
            <div className="relative">
              <select 
                value={formData.dia_reuniao}
                onChange={(e) => setFormData({...formData, dia_reuniao: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[#002d5e] font-bold focus:ring-2 focus:ring-orange-100 outline-none appearance-none"
              >
                <option value="">Selecionar dia...</option>
                <option value="Segunda-feira">Segunda-feira</option>
                <option value="Terça-feira">Terça-feira</option>
                <option value="Quarta-feira">Quarta-feira</option>
                <option value="Quinta-feira">Quinta-feira</option>
                <option value="Sexta-feira">Sexta-feira</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>
          </div>

          {/* HORA DA REUNIÃO */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#002d5e] uppercase tracking-widest ml-1">Hora de Início</label>
            <div className="relative">
              <input 
                type="time" 
                value={formData.hora_reuniao}
                onChange={(e) => setFormData({...formData, hora_reuniao: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[#002d5e] font-bold focus:ring-2 focus:ring-orange-100 outline-none"
              />
            </div>
          </div>

          {/* PERIODICIDADE */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#002d5e] uppercase tracking-widest ml-1">Periodicidade</label>
            <select 
              value={formData.periodicidade_reuniao}
              onChange={(e) => setFormData({...formData, periodicidade_reuniao: e.target.value})}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[#002d5e] font-bold focus:ring-2 focus:ring-orange-100 outline-none"
            >
              <option value="Semanalmente">Semanalmente</option>
              <option value="Quinzenalmente">Quinzenalmente</option>
              <option value="Quinzenalmente">Trissemanalmente</option>
              <option value="Mensalmente">Mensalmente</option>
            </select>
          </div>

          {/* TIPO DE REUNIÃO */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#002d5e] uppercase tracking-widest ml-1">Formato</label>
            <select 
              value={formData.tipo_reuniao}
              onChange={(e) => setFormData({...formData, tipo_reuniao: e.target.value})}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[#002d5e] font-bold focus:ring-2 focus:ring-orange-100 outline-none"
            >
              <option value="Presencial">Presencial</option>
              <option value="Online">Online</option>
              <option value="Híbrida">Híbrida</option>
            </select>
          </div>
        </div>

        {/* LOCALIZAÇÃO / LINK */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#002d5e] uppercase tracking-widest ml-1">Localização ou Link da Reunião</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-4 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Ex: Rua do Alecrim, nº 10 ou Link do Zoom"
              value={formData.local_reuniao}
              onChange={(e) => setFormData({...formData, local_reuniao: e.target.value})}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-[#002d5e] font-bold focus:ring-2 focus:ring-orange-100 outline-none"
            />
          </div>
        </div>

        {/* Feedback de Status */}
        {mensagem.texto && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
            mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {mensagem.texto}
          </div>
        )}

        {/* Botão de Guardar */}
        <button 
          type="submit"
          disabled={saving}
          className="w-full bg-[#002d5e] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#001b33] transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? 'A Guardar...' : 'Guardar Alterações'}
        </button>
      </form>
    </div>
  )
}