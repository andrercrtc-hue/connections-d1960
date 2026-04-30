'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle, Save, X } from 'lucide-react'
import Cropper from 'react-easy-crop'

// --- FUNÇÕES AUXILIARES DE RECORTE (Canvas) ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

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

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
  })
}

type Perfil = {
  id: string
  primeiro_nome: string
  apelido: string
  email: string
  cargo: string
  telefone?: string
  bio?: string
  avatar_url?: string
}

export default function ProfilePage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    primeiro_nome: '',
    apelido: '',
    telefone: '',
    bio: ''
  })

  // --- ESTADOS DO EDITOR DE IMAGEM ---
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setPerfil(data)
        setFormData({
          primeiro_nome: data.primeiro_nome || '',
          apelido: data.apelido || '',
          telefone: data.telefone || '',
          bio: data.bio || ''
        })
      }
      setLoading(false)
    }
    loadData()
  }, [router])

  async function handleSave() {
    setUpdating(true)
    const { error } = await supabase
      .from('perfis')
      .update({
        primeiro_nome: formData.primeiro_nome,
        apelido: formData.apelido,
        telefone: formData.telefone,
        bio: formData.bio
      })
      .eq('id', perfil?.id)

    if (error) alert('Erro ao atualizar: ' + error.message)
    else alert('Perfil atualizado com sucesso!')
    setUpdating(false)
  }

  // Ativado quando escolhes o ficheiro
  const onFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener('load', () => setImageToCrop(reader.result as string))
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // Ativado quando clicas em "Confirmar" no Modal
  const handleConfirmCrop = async () => {
    try {
      setUpdating(true)
      if (!imageToCrop || !croppedAreaPixels) return

      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)
      if (!croppedBlob) return

      const filePath = `${perfil?.id}/${Math.random()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

      await supabase.from('perfis').update({ avatar_url: publicUrl }).eq('id', perfil?.id)
      
      setPerfil(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      setImageToCrop(null) // Fecha o modal
      alert('Foto de perfil atualizada!')
    } catch (err: any) {
      alert('Erro no processamento: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-[60vh] text-gray-400">A carregar perfil...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Perfil do Utilizador</h1>
        <p className="text-gray-500 text-sm">Gira a tua informação pessoal e preferências de conta no Rotary Nexus.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: FOTO E STATUS */}
        <div className="space-y-6">
          <div className="bg-white p-10 rounded-[20px] border border-gray-100 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#004a99] to-[#fca311]"></div>
            
            <div className="relative w-36 h-36 mx-auto mb-6">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50">
                <img 
                  src={perfil?.avatar_url || `https://ui-avatars.com/api/?name=${formData.primeiro_nome}`} 
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              </div>
              <label className="absolute bottom-2 right-2 bg-[#004a99] text-white p-2.5 rounded-full cursor-pointer hover:scale-110 transition shadow-lg border-2 border-white">
                <Camera size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
              </label>
            </div>
            
            <h4 className="font-bold text-[#004a99] text-[17px] mb-3">Alterar Foto de Perfil</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Utilize uma fotografia profissional. O editor permite ajustar o enquadramento circular.
            </p>
          </div>

          <div className="bg-[#004a99] p-8 rounded-[20px] text-white shadow-md relative overflow-hidden group">
             <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                <CheckCircle size={120} />
             </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle size={22} className="text-blue-200" />
                <span className="font-bold text-lg">Membro Verificado</span>
              </div>
              <p className="text-sm text-blue-100 opacity-90 leading-relaxed">
                A sua conta está associada ao Distrito 1960 com todos os privilégios ativos.
              </p>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO */}
        <div className="lg:col-span-2">
          <div className="bg-white p-10 rounded-[20px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-[#004a99] mb-8 pb-4 border-b border-gray-50">Informações Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Primeiro Nome</label>
                <input 
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-[#004a99] focus:border-transparent outline-none transition"
                  value={formData.primeiro_nome}
                  onChange={(e) => setFormData({...formData, primeiro_nome: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Apelido / Outros Nomes</label>
                <input 
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-[#004a99] focus:border-transparent outline-none transition"
                  value={formData.apelido}
                  onChange={(e) => setFormData({...formData, apelido: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contacto Telefónico</label>
                <input 
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-[#004a99] focus:border-transparent outline-none transition"
                  placeholder="+351 --- --- ---"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Endereço de E-mail</label>
              <input 
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm text-gray-400 cursor-not-allowed outline-none"
                value={perfil?.email}
                disabled
              />
            </div>

            <div className="space-y-2 mb-10">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bio / Nota Biográfica</label>
              <textarea 
                rows={4}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-[#004a99] focus:border-transparent outline-none transition resize-none"
                placeholder="A tua jornada no Rotary..."
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 rounded-xl font-bold text-sm text-[#004a99] border-2 border-[#004a99] hover:bg-blue-50 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={updating}
                className="px-8 py-3 rounded-xl font-bold text-sm bg-[#fca311] text-white shadow-lg shadow-orange-100 hover:bg-[#e8960f] transition flex items-center gap-2 disabled:opacity-50"
              >
                {updating ? 'A guardar...' : <><Save size={18}/> Guardar Alterações</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DO EDITOR DE IMAGEM --- */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-[#002d5e]">Ajustar Fotografia</h3>
              <button onClick={() => setImageToCrop(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="relative h-80 w-full bg-gray-900">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center block">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#fca311]"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setImageToCrop(null)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmCrop}
                  disabled={updating}
                  className="flex-1 bg-[#fca311] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-[#e8960f] transition disabled:opacity-50"
                >
                  {updating ? 'A processar...' : 'Confirmar Recorte'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}