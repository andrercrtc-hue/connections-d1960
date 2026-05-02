'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Cropper from 'react-easy-crop'
import { 
  Image as ImageIcon, 
  Info, 
  FileText, 
  Upload, 
  Save, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Camera,
  Pencil
} from 'lucide-react'

// ==========================================================================
// FUNÇÕES AUXILIARES DE RECORTE (Canvas Engine)
// ==========================================================================

/**
 * Cria um objeto de imagem a partir de um URL
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

/**
 * Processa o recorte da imagem e devolve um ficheiro pronto para upload
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<File | null> {
  try {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    // Definimos o tamanho do canvas para o tamanho do recorte
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Desenhamos a imagem recortada no canvas
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    // Convertemos o canvas para um Blob e depois para um Ficheiro
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null)
        const file = new File([blob], 'capa_clube_recortada.jpg', { type: 'image/jpeg' })
        resolve(file)
      }, 'image/jpeg', 0.9) // 0.9 é a qualidade da imagem
    })
  } catch (e) {
    console.error("Erro no processamento do canvas:", e)
    return null
  }
}

// ==========================================================================
// COMPONENTE PRINCIPAL
// ==========================================================================
async function obterCoordenadas(morada: string) {
  if (!morada) return null;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(morada)}`
    );
    const data = await response.json();
    return data && data.length > 0 ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
  } catch (error) {
    console.error("Erro no Geocoding:", error);
    return null;
  }
}

export default function EditarCapaEDetalhes() {
  const params = useParams()
  const router = useRouter()
  const clubeId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- ESTADOS DE CARREGAMENTO E FEEDBACK ---
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' })

  // --- ESTADOS DO FORMULÁRIO ---
  const [formData, setFormData] = useState({
    nome: '',
    distrito: 'Distrito 1960',
    ano_fundacao: '',
    email_contacto: '',
    morada_completa: '',
    descricao: '',
    capa_url: ''
  })

  // --- ESTADOS DA IMAGEM E PREVIEW ---
  const [imagemFicheiro, setImagemFicheiro] = useState<File | null>(null)
  const [previewImagem, setPreviewImagem] = useState<string | null>(null)

  // --- ESTADOS DO MODAL DE RECORTE (CROPPER) ---
  const [showCropModal, setShowCropModal] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  // 1. CARREGAR DADOS INICIAIS
  useEffect(() => {
    async function carregarDados() {
      if (!clubeId) return

      try {
        const { data, error } = await supabase
          .from('clubes')
          .select('nome, ano_fundacao, email_contacto, morada_completa, descricao, capa_url')
          .eq('id', clubeId)
          .single()

        if (error) throw error

        if (data) {
          setFormData({
            nome: data.nome || '',
            distrito: 'Distrito 1960',
            ano_fundacao: data.ano_fundacao || '',
            email_contacto: data.email_contacto || '',
            morada_completa: data.morada_completa || '',
            descricao: data.descricao || '',
            capa_url: data.capa_url || ''
          })
          setPreviewImagem(data.capa_url || null)
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [clubeId])

  // 2. GESTÃO DA SELECÇÃO DE IMAGEM
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result as string)
        setShowCropModal(true)
      })
      reader.readAsDataURL(file)
    }
    // Reset do input para permitir selecionar a mesma imagem novamente
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const confirmarRecorte = async () => {
    if (!imageToCrop || !croppedAreaPixels) return

    const file = await getCroppedImg(imageToCrop, croppedAreaPixels)
    if (file) {
      setImagemFicheiro(file)
      setPreviewImagem(URL.createObjectURL(file))
      setShowCropModal(false)
      setMensagem({ tipo: 'sucesso', texto: 'Recorte aplicado! Não te esqueças de guardar as alterações.' })
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMensagem({ tipo: '', texto: '' }), 3000)
    }
  }

  const cancelarNovaImagem = () => {
    setImagemFicheiro(null)
    setPreviewImagem(formData.capa_url)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 3. SUBMISSÃO DO FORMULÁRIO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMensagem({ tipo: '', texto: '' })

    try {
      let urlFinalDaCapa = formData.capa_url

      // Se houver uma nova imagem recortada, fazer upload
      if (imagemFicheiro) {
        const timestamp = Date.now()
        const fileName = `capa_${clubeId}_${timestamp}.jpg`
        
        const { error: uploadError } = await supabase.storage
          .from('capas_clubes') 
          .upload(fileName, imagemFicheiro)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('capas_clubes')
          .getPublicUrl(fileName)

        urlFinalDaCapa = publicUrl
      }

      // Atualizar dados na tabela 'clubes'
      const { error: updateError } = await supabase
        .from('clubes')
        .update({
          email_contacto: formData.email_contacto,
          descricao: formData.descricao,
          capa_url: urlFinalDaCapa
        })
        .eq('id', clubeId)

      if (updateError) throw updateError

      setMensagem({ tipo: 'sucesso', texto: 'Alterações guardadas com sucesso! A redirecionar...' })
      
      // Redirecionar após sucesso
      setTimeout(() => {
        router.push(`/diretorio-clubes/${clubeId}?view=gestao`)
        router.refresh() // Força atualização dos dados na página principal
      }, 1500)

    } catch (error: any) {
      setMensagem({ tipo: 'erro', texto: 'Ocorreu um erro: ' + error.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#fca311] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-[#002d5e] animate-pulse uppercase tracking-widest text-xs">Carregando Informações...</p>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-4xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
        
        {/* CABEÇALHO */}
        <div className="mb-10 flex flex-col gap-2">
          <Link 
            href={`/diretorio-clubes/${clubeId}?view=gestao`}
            className="group text-sm text-gray-400 hover:text-[#002d5e] flex items-center gap-2 transition-all w-fit"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Voltar para a Área de Gestão
          </Link>
          <h1 className="text-4xl font-black text-[#002d5e] uppercase tracking-tighter">
            Definições Visuais
          </h1>
          <div className="h-1 w-20 bg-[#fca311] rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECÇÃO 1: IMAGEM DE CAPA */}
          <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#002d5e] p-2 rounded-xl text-white">
                  <ImageIcon size={20} />
                </div>
                <h2 className="font-black text-[#002d5e] uppercase tracking-tight">Banner do Clube</h2>
              </div>
              <span className="text-[10px] font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                1200 x 320 PX RECOMENDADO
              </span>
            </div>
            
            <div className="p-8">
              <div className="relative w-full h-[280px] bg-gray-50 rounded-[24px] overflow-hidden border-2 border-dashed border-gray-200 group transition-all hover:border-[#fca311]/50">
                
                {previewImagem ? (
                  <>
                    <img src={previewImagem} alt="Capa" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#002d5e]/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#fca311] text-[#002d5e] font-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"
                      >
                        <Upload size={18} /> Alterar Fotografia
                      </button>
                      <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">JPG, PNG ou WEBP até 5MB</p>
                    </div>
                  </>
                ) : (
                  <div 
                    className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 text-gray-400 group-hover:text-[#fca311] transition-colors">
                      <Camera size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-[#002d5e] uppercase text-sm">Carregar nova capa</p>
                      <p className="text-gray-400 text-xs">Clique aqui para explorar ficheiros</p>
                    </div>
                  </div>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              {imagemFicheiro && (
                <div className="mt-4 flex justify-end">
                  <button 
                    type="button" 
                    onClick={cancelarNovaImagem}
                    className="text-xs text-red-500 font-black uppercase tracking-tighter flex items-center gap-1 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <X size={14} /> Cancelar nova seleção
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECÇÃO 2: INFORMAÇÕES BÁSICAS */}
          <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="bg-[#002d5e] p-2 rounded-xl text-white">
                <Info size={20} />
              </div>
              <h2 className="font-black text-[#002d5e] uppercase tracking-tight">Identidade</h2>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#002d5e] uppercase tracking-widest ml-1">Nome Oficial</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.nome}
                    disabled
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-400 font-bold cursor-not-allowed italic"
                  />
                  <div className="absolute right-4 top-4 text-gray-300">
                    <X size={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#002d5e] uppercase tracking-widest ml-1">Distrito Rotário</label>
                <input 
                  type="text" 
                  value={formData.distrito}
                  disabled
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-400 font-bold cursor-not-allowed italic"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#002d5e] uppercase tracking-widest ml-1">Ano de Fundação</label>
                <input 
                  type="text" 
                  value={formData.ano_fundacao}
                  disabled
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-400 font-bold cursor-not-allowed italic"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#002d5e] uppercase tracking-widest ml-1">E-mail de Contacto Público</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={formData.email_contacto}
                    onChange={(e) => setFormData({...formData, email_contacto: e.target.value})}
                    placeholder="exemplo@rotaract.org"
                    className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-[#002d5e] font-bold focus:ring-4 focus:ring-[#fca311]/10 focus:border-[#fca311] outline-none transition-all shadow-sm"
                  />
                  <div className="absolute right-4 top-4 text-[#fca311]">
                    <Pencil size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECÇÃO 3: DESCRIÇÃO */}
          <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="bg-[#002d5e] p-2 rounded-xl text-white">
                <FileText size={20} />
              </div>
              <h2 className="font-black text-[#002d5e] uppercase tracking-tight">Descrição do Clube</h2>
            </div>
            <div className="p-8 space-y-4">
              <textarea 
                rows={8}
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Conte a história do clube, projetos marcantes e a vossa missão..."
                className="w-full bg-white border border-gray-200 rounded-[24px] p-6 text-[#002d5e] font-medium leading-relaxed focus:ring-4 focus:ring-[#fca311]/10 focus:border-[#fca311] outline-none transition-all shadow-sm resize-none"
              />
              <div className="flex justify-between items-center px-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Escreva uma descrição apelativa para novos sócios.</p>
                <p className={`text-[10px] font-black ${formData.descricao.length > 1900 ? 'text-red-500' : 'text-gray-300'}`}>
                  {formData.descricao.length} / 2000
                </p>
              </div>
            </div>
          </div>

          {/* ALERTAS DE FEEDBACK */}
          {mensagem.texto && (
            <div className={`p-5 rounded-2xl flex items-center gap-4 animate-in slide-in-from-left-4 duration-500 ${
              mensagem.tipo === 'sucesso' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'
            }`}>
              {mensagem.tipo === 'sucesso' ? <CheckCircle2 className="shrink-0" /> : <AlertCircle className="shrink-0" />}
              <span className="text-sm font-black uppercase tracking-tight">{mensagem.texto}</span>
            </div>
          )}

          {/* FOOTER DE ACÇÕES (Fixed no mobile, normal no desktop) */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-6 md:relative md:bg-transparent md:border-none md:p-0 md:pt-4 flex items-center justify-end gap-4 z-40">
            <Link 
              href={`/diretorio-clubes/${clubeId}?view=gestao`}
              className="px-8 py-4 rounded-2xl font-black text-[#002d5e] uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit"
              disabled={saving}
              className="bg-[#002d5e] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#001b33] transition-all flex items-center gap-3 disabled:opacity-50 shadow-2xl shadow-blue-900/20 active:scale-95"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  A Guardar...
                </>
              ) : (
                <>
                  <Save size={18} className="text-[#fca311]" />
                  Guardar Alterações
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* ==========================================================================
          MODAL DE RECORTE (CROPPER POP-UP)
          ========================================================================== */}
      {showCropModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Overlay de fundo */}
          <div 
            className="absolute inset-0 bg-[#002d5e]/90 backdrop-blur-lg animate-in fade-in duration-300"
            onClick={() => setShowCropModal(false)}
          ></div>
          
          {/* Contentor do Modal */}
          <div className="relative bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            
            {/* Cabeçalho do Modal */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="bg-[#fca311] p-3 rounded-2xl text-[#002d5e] shadow-lg shadow-orange-500/20">
                  <Camera size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#002d5e] uppercase tracking-tighter">Ajustar Banner</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Arraste a imagem para enquadrar</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCropModal(false)}
                className="p-3 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all shadow-sm border border-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Área de Recorte (O Cropper ocupa este espaço) */}
            <div className="relative w-full h-[350px] md:h-[450px] bg-black">
              {imageToCrop && (
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1200 / 320} // Proporção exata do banner
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="rect"
                  showGrid={true}
                />
              )}
            </div>

            {/* Controlos e Botões de Ação */}
            <div className="p-8 bg-white border-t border-gray-100 space-y-8">
              
              {/* Slider de Zoom Estilizado */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Zoom da Imagem</span>
                  <span className="text-[10px] font-black text-[#fca311] bg-orange-50 px-2 py-1 rounded-md">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min={1} 
                  max={3} 
                  step={0.01} 
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#fca311]"
                />
              </div>

              {/* Botões de Decisão */}
              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => setShowCropModal(false)}
                  className="flex-1 py-5 rounded-[20px] font-black text-[#002d5e] uppercase tracking-widest text-xs bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarRecorte}
                  className="flex-1 py-5 rounded-[20px] font-black text-[#002d5e] uppercase tracking-widest text-xs bg-[#fca311] hover:bg-[#e69510] transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3"
                >
                  <CheckCircle2 size={18} /> Confirmar e Cortar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}