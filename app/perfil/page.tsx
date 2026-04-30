'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Users, Calendar, FileText, 
  LogOut, Bell, Camera, CheckCircle, Save, User, Info, Home, Briefcase, ClipboardList
} from 'lucide-react'

export default function ProfilePage() {
  const [perfil, setPerfil] = useState<any>(null)
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

    if (error) alert('Erro: ' + error.message)
    else alert('Perfil atualizado!')
    setUpdating(false)
  }

  async function handlePhotoUpload(event: any) {
    try {
      setUpdating(true)
      const file = event.target.files[0]
      if (!file) return
      const filePath = `${perfil?.id}/${Math.random()}.${file.name.split('.').pop()}`
      await supabase.storage.from('avatars').upload(filePath, file)
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      await supabase.from('perfis').update({ avatar_url: publicUrl }).eq('id', perfil?.id)
      setPerfil({ ...perfil, avatar_url: publicUrl })
    } catch (err: any) {
      alert('Erro no upload: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#004a99] rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <h2 className="text-[#004a99] font-black text-lg">Distrito Rotary</h2>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Painel Principal" onClick={() => router.push('/dashboard')} />
          <SidebarItem icon={<User size={20}/>} label="Profile Details" active />
        </nav>
      </aside>

      <main className="flex-1 ml-64 p-10">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl font-black text-[#004a99]">Perfil do Utilizador</h1>
            <p className="text-gray-500">Gira a tua informação pessoal no Rotary Nexus.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* FOTO */}
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm text-center h-fit">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <img 
                  src={perfil?.avatar_url || `https://ui-avatars.com/api/?name=${formData.primeiro_nome}`} 
                  className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                />
                <label className="absolute bottom-0 right-0 bg-[#004a99] text-white p-2 rounded-full cursor-pointer">
                  <Camera size={16} />
                  <input type="file" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <p className="text-xs text-gray-400">Fotografia oficial do Distrito 1960</p>
            </div>

            {/* FORMULÁRIO */}
            <div className="lg:col-span-2 bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-8">Informações Pessoais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Primeiro Nome</label>
                  <input 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-100 outline-none transition"
                    value={formData.primeiro_nome}
                    onChange={(e) => setFormData({...formData, primeiro_nome: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Apelido / Restantes Nomes</label>
                  <input 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-100 outline-none transition"
                    value={formData.apelido}
                    onChange={(e) => setFormData({...formData, apelido: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contacto Telefónico</label>
                  <input 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-100 outline-none transition"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">E-mail (Privado)</label>
                  <input className="w-full bg-gray-100 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed" value={perfil?.email} disabled />
                </div>
              </div>

              <div className="space-y-2 mb-10">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bio / Nota Biográfica</label>
                <textarea 
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  onClick={handleSave}
                  disabled={updating}
                  className="px-10 py-4 rounded-xl font-bold text-sm bg-[#fca311] text-white shadow-lg hover:bg-[#e8960f] transition disabled:opacity-50"
                >
                  {updating ? 'A guardar...' : 'Guardar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function SidebarItem({ icon, label, active = false, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all ${active ? 'bg-blue-50 text-[#004a99] border-l-4 border-[#004a99]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
      {icon} {label}
    </button>
  )
}