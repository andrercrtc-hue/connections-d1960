'use client'
import { useEffect, useState, useRef, useCallback } from 'react' // Adicionado useCallback
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Image as ImageIcon, Info, FileText, Upload, Save, 
  ArrowLeft, X, CheckCircle2, AlertCircle, Camera 
} from 'lucide-react'
import Link from 'next/link'
import Cropper from 'react-easy-crop' // Adicionado o import do Cropper

// --- FUNÇÕES AUXILIARES DE RECORTE (Canvas) ---
// Estas funções processam a imagem para o tamanho final
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<File> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('Sem contexto 2D')

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      if (file) resolve(new File([file], 'capa_recortada.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg')
  })
}

export default function EditarCapaEDetalhes() {
  const params = useParams()
  const router = useRouter()
  const clubeId = params.id as string

  const [showCropModal, setShowCropModal] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' })

  // Estados para gerir a imagem
  const [imagemFicheiro, setImagemFicheiro] = useState<File | null>(null)
  const [previewImagem, setPreviewImagem] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    distrito: 'Distrito 1960',
    ano_fundacao: '',
    email_contacto: '',
    descricao: '',
    capa_url: '' // A imagem que já está na base de dados
  })

  // 1. Carregar dados atuais
  useEffect(() => {
    async function carregarDados() {
      const { data, error } = await supabase
        .from('clubes')
        .select('nome, ano_fundacao, email_contacto, descricao, capa_url') // Assegura-te que 'ano_fundacao' existe na BD
        .eq('id', clubeId)
        .single()

      if (data) {
        setFormData({
          nome: data.nome || '',
          distrito: 'Distrito 1960', // Fixo, conforme pedido
          ano_fundacao: data.ano_fundacao || '',
          email_contacto: data.email_contacto || '',
          descricao: data.descricao || '',
          capa_url: data.capa_url || ''
        })
        setPreviewImagem(data.capa_url || null)
      }
      setLoading(false)
    }
    if (clubeId) carregarDados()
  }, [clubeId])

  // 2. Lidar com a seleção da nova imagem (Pré-visualização)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagemFicheiro(file)
      // Cria um link temporário no browser para ver a imagem antes de fazer upload
      setPreviewImagem(URL.createObjectURL(file))
    }
  }

  const cancelarNovaImagem = () => {
    setImagemFicheiro(null)
    setPreviewImagem(formData.capa_url) // Volta à imagem original da BD
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ==========================================================================
  // FUNÇÕES DE RECORTE DE IMAGEM
  // ==========================================================================
  // Atualiza os pixéis exatos da área de corte de forma otimizada sempre que o utilizador interage com a grelha
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // Processa a imagem cortada, atualiza o estado para posterior upload e fecha o modal
  const confirmarRecorte = async () => {
    try {
      // Nota: Assegure-se de que a função getCroppedImg está importada ou definida neste ficheiro
      const file = await getCroppedImg(imageToCrop!, croppedAreaPixels)
      setImagemFicheiro(file as File) // Guarda o ficheiro recortado para o upload posterior
      setPreviewImagem(URL.createObjectURL(file!)) // Mostra a imagem cortada no form
      setShowCropModal(false) // Fecha o modal
    } catch (e) {
      console.error(e)
    }
  }

  // 3. Guardar Alterações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMensagem({ tipo: '', texto: '' })

    try {
      let urlFinalDaCapa = formData.capa_url

      // SE o utilizador escolheu uma nova imagem, fazemos upload para o Supabase Storage
      if (imagemFicheiro) {
        const fileExt = imagemFicheiro.name.split('.').pop()
        const fileName = `${clubeId}-${Math.random()}.${fileExt}`
        
        // ATENÇÃO: Precisas de ter um "Bucket" chamado 'capas_clubes' no Supabase Storage
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('capas_clubes') 
          .upload(fileName, imagemFicheiro)

        if (uploadError) throw uploadError

        // Pega no link público da imagem que acabámos de enviar
        const { data: { publicUrl } } = supabase.storage
          .from('capas_clubes')
          .getPublicUrl(fileName)

        urlFinalDaCapa = publicUrl
      }

      // Atualizar a base de dados (só os campos editáveis)
      const { error: updateError } = await supabase
        .from('clubes')
        .update({
          email_contacto: formData.email_contacto,
          descricao: formData.descricao,
          capa_url: urlFinalDaCapa
        })
        .eq('id', clubeId)

      if (updateError) throw updateError

      setMensagem({ tipo: 'sucesso', texto: 'Dados e capa atualizados com sucesso!' })
      setTimeout(() => router.push(`/diretorio-clubes/${clubeId}?view=gestao`), 1500)

    } catch (error: any) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao guardar: ' + error.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">A carregar dados...</div>

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Cabeçalho */}
      <div className="mb-8">
        <Link 
          href={`/diretorio-clubes/${clubeId}?view=gestao`}
          className="text-sm text-gray-400 hover:text-[#002d5e] flex items-center gap-2 transition-colors mb-2 w-fit"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
        <h1 className="text-3xl font-black text-[#002d5e] uppercase tracking-tighter">
          Editar Capa e Detalhes
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* CARTÃO 1: IMAGEM DE CAPA */}
        <div className="bg-white border border-gray-200 rounded-[24px] overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <ImageIcon size={20} className="text-[#002d5e]" />
            <h2 className="font-bold text-[#002d5e]">Imagem de Capa</h2>
          </div>
          <div className="p-6">
            <div className="relative w-full h-[240px] bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 group flex flex-col items-center justify-center">
              
              {/* Mostra a imagem (antiga ou a nova pré-visualização) */}
              {previewImagem ? (
                <>
                  <img src={previewImagem} alt="Pré-visualização" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-[#002d5e] font-bold px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-100"
                    >
                      <Upload size={18} /> Mudar Imagem
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="bg-white p-4 rounded-full inline-block shadow-sm">
                    <Upload size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-500">Clique para selecionar uma capa</p>
                </div>
              )}

              {/* Input escondido */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
              />
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <p className="text-[11px] text-gray-400">Recomendado: 1200x480px. Formatos: JPG, PNG, WEBP.</p>
              {imagemFicheiro && (
                <button type="button" onClick={cancelarNovaImagem} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1">
                  <X size={14} /> Remover nova seleção
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CARTÃO 2: INFORMAÇÕES BÁSICAS */}
        <div className="bg-white border border-gray-200 rounded-[24px] overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Info size={20} className="text-[#002d5e]" />
            <h2 className="font-bold text-[#002d5e]">Informações Básicas</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* NOME (Bloqueado) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 ml-1">Nome do Clube</label>
              <input 
                type="text" 
                value={formData.nome}
                disabled
                className="w-full bg-gray-100/70 border border-gray-200 rounded-xl p-3 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* DISTRITO (Bloqueado) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 ml-1">Distrito</label>
              <input 
                type="text" 
                value={formData.distrito}
                disabled
                className="w-full bg-gray-100/70 border border-gray-200 rounded-xl p-3 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* ANO DE FUNDAÇÃO (Bloqueado - Mudado de Data para Ano conforme pediste) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 ml-1">Ano de Fundação</label>
              <input 
                type="text" 
                value={formData.ano_fundacao}
                disabled
                className="w-full bg-gray-100/70 border border-gray-200 rounded-xl p-3 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* EMAIL (EDITÁVEL) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#002d5e] ml-1">E-mail de Contacto</label>
              <input 
                type="email" 
                value={formData.email_contacto}
                onChange={(e) => setFormData({...formData, email_contacto: e.target.value})}
                placeholder="contacto@clube.pt"
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-[#002d5e] font-medium focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              />
            </div>

          </div>
        </div>

        {/* CARTÃO 3: DESCRIÇÃO */}
        <div className="bg-white border border-gray-200 rounded-[24px] overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <FileText size={20} className="text-[#002d5e]" />
            <h2 className="font-bold text-[#002d5e]">Descrição</h2>
          </div>
          <div className="p-6 space-y-2">
            <label className="text-[11px] font-bold text-[#002d5e] ml-1">Descrição Detalhada</label>
            <textarea 
              rows={6}
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              placeholder="Descreva a história, missão e principais projetos do seu clube..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-[#002d5e] leading-relaxed focus:ring-2 focus:ring-orange-200 outline-none resize-none transition-all"
            />
            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] text-gray-400">Pode utilizar esta área para destacar o impacto do clube na comunidade.</p>
              <p className="text-[10px] text-gray-400 font-medium">{formData.descricao.length} / 2000 caracteres</p>
            </div>
          </div>
        </div>

        {/* MENSAGEM DE ERRO/SUCESSO */}
        {mensagem.texto && (
          <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${
            mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {mensagem.texto}
          </div>
        )}

        {/* BARRA DE BOTÕES INFERIOR */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
          <Link 
            href={`/diretorio-clubes/${clubeId}?view=gestao`}
            className="px-6 py-3 rounded-xl font-bold text-[#002d5e] border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#fca311] hover:bg-orange-500 text-[#002d5e] px-8 py-3 rounded-xl font-black transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? 'A Guardar...' : <><Save size={18} /> Guardar Alterações</>}
          </button>
        </div>

      </form>
    </div>
  )
}