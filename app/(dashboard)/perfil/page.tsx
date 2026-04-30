'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle, Save } from 'lucide-react'

// Definição do tipo para o TypeScript não reclamar
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

  async function handlePhotoUpload(event: any) {
    try {
      setUpdating(true)
      const file = event.target.files[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const filePath = `${perfil?.id}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

      await supabase.from('perfis').update({ avatar_url: publicUrl }).eq('id', perfil?.id)
      
      setPerfil(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      alert('Foto de perfil atualizada!')
    } catch (err: any) {
      alert('Erro no upload: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-[60vh] text-gray-400">A carregar perfil...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* CABEÇALHO DA PÁGINA */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Perfil do Utilizador</h1>
        <p className="text-gray-500 text-sm">Gira a tua informação pessoal e preferências de conta no Rotary Nexus.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: FOTO E STATUS */}
        <div className="space-y-6">
          {/* Card da Foto */}
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
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </label>
            </div>
            
            <h4 className="font-bold text-[#004a99] text-[17px] mb-3">Alterar Foto de Perfil</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Utilize uma fotografia profissional com boa iluminação (JPEG ou PNG, máx. 5MB).
            </p>
          </div>

          {/* Card Membro Verificado */}
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
              <p className="text-[10px] font-medium text-gray-400 mt-1">
                O e-mail de conta não pode ser alterado diretamente por questões de segurança.
              </p>
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
    </div>
  )
}