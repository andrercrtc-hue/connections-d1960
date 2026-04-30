'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Users, Calendar, FileText, 
  Settings, LogOut, Bell, Camera, CheckCircle,
  Save, X, User, Home, Briefcase, ClipboardList, Info
} from 'lucide-react'

// Definição do tipo de dados para o Perfil
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

  // Estado local para o formulário (Garante que o texto é preto e nítido)
  const [formData, setFormData] = useState({
    primeiro_nome: '',
    apelido: '',
    telefone: '',
    bio: ''
  })

  // Carregar dados do utilizador ao abrir a página
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

  // Função para salvar as alterações de texto
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

  // Função para upload da foto de perfil
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#f8fafc]">Carregando Perfil...</div>

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      
      {/* SIDEBAR (Mantida do Dashboard para coerência) */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#004a99] rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <div>
              <h2 className="text-[#004a99] font-black text-lg leading-tight">Distrito Rotary</h2>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => router.push('/dashboard')} />
          <SidebarItem icon={<Home size={20}/>} label="Equipa Distrital" />
          <SidebarItem icon={<Calendar size={20}/>} label="Calendário" />
          <SidebarItem icon={<FileText size={20}/>} label="Documentos" />
          <SidebarItem icon={<Settings size={20}/>} label="Administração" />
          <div className="pt-4 border-t border-gray-50">
             <SidebarItem icon={<User size={20}/>} label="Profile Details" active />
          </div>
        </nav>

        <div className="p-6 border-t border-gray-50">
           <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex items-center gap-3 text-xs font-bold text-gray-400 hover:text-red-500 transition">
             <LogOut size={18}/> Sign Out
           </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 ml-64 flex flex-col">
        
        {/* TOP NAV SIMPLIFICADA */}
        <header className="h-20 bg-white border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-[#004a99] font-black tracking-tighter text-xl uppercase italic">Rotary Nexus</h2>
          <div className="flex items-center gap-6">
             <div className="flex gap-4 text-gray-400">
                <Bell size={20} className="cursor-pointer" />
                <Settings size={20} className="cursor-pointer" />
             </div>
             <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden">
                <img src={perfil?.avatar_url || `https://ui-avatars.com/api/?name=${perfil?.primeiro_nome}`} alt="Avatar" />
             </div>
          </div>
        </header>

        {/* CONTAINER DA PÁGINA (Baseado na Imagem) */}
        <div className="p-10 max-w-6xl">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-[#4a5568]">Perfil do Utilizador</h1>
            <p className="text-gray-500 text-sm">Gira a tua informação pessoal e preferências de conta no Rotary Nexus.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* COLUNA ESQUERDA: FOTO E STATUS */}
            <div className="space-y-6">
              {/* Card da Foto (Igual à imagem) */}
              <div className="bg-white p-10 rounded-[20px] border border-gray-100 shadow-sm text-center relative">
                {/* Detalhe da barra superior amarela/azul */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#004a99] to-[#fca311] rounded-t-[20px]"></div>
                
                <div className="relative w-36 h-36 mx-auto mb-6">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50 shadow-inner">
                    <img 
                      src={perfil?.avatar_url || `https://ui-avatars.com/api/?name=${formData.primeiro_nome}`} 
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  </div>
                  {/* Botão da câmara posicionado exatamente como na imagem */}
                  <label className="absolute bottom-2 right-2 bg-[#004a99] text-white p-2 rounded-full cursor-pointer hover:scale-110 transition shadow-md border-2 border-white">
                    <Camera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
                
                <h4 className="font-bold text-[#004a99] text-lg mb-4">Alterar Foto de Perfil</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed px-4">
                  Utilize uma fotografia profissional com boa iluminação (JPEG ou PNG, máx. 5MB).
                </p>
              </div>

              {/* Card Membro Verificado (Igual à imagem) */}
              <div className="bg-[#0052a3] p-8 rounded-[20px] text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle size={24} className="text-white" />
                  <span className="font-bold text-lg">Membro Verificado</span>
                </div>
                <p className="text-sm text-blue-50 opacity-90 leading-relaxed">
                  A sua conta está associada ao Distrito 1960 com todos os privilégios ativos.
                </p>
              </div>
            </div>

            {/* COLUNA DIREITA: FORMULÁRIO (Igual à imagem) */}
            <div className="lg:col-span-2">
              <div className="bg-white p-10 rounded-[20px] border border-gray-100 shadow-sm h-full">
                <h3 className="text-xl font-bold text-[#004a99] mb-10">Informações Pessoais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Campo Primeiro Nome */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-600">Primeiro Nome</label>
                    <input 
                      className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-5 py-4 text-[15px] text-gray-900 font-medium focus:ring-2 focus:ring-blue-100 outline-none transition"
                      value={formData.primeiro_nome}
                      onChange={(e) => setFormData({...formData, primeiro_nome: e.target.value})}
                    />
                  </div>
                  {/* Campo Apelido */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-600">Apelido / Restantes Nomes</label>
                    <input 
                      className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-5 py-4 text-[15px] text-gray-900 font-medium focus:ring-2 focus:ring-blue-100 outline-none transition"
                      value={formData.apelido}
                      onChange={(e) => setFormData({...formData, apelido: e.target.value})}
                    />
                  </div>
                  {/* Campo Telefone */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-600">Contacto Telefónico</label>
                    <input 
                      className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-5 py-4 text-[15px] text-gray-900 font-medium focus:ring-2 focus:ring-blue-100 outline-none transition"
                      placeholder="+351 --- --- ---"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    />
                  </div>
                </div>

                {/* Campo Email (Bloqueado conforme a imagem) */}
                <div className="space-y-3 mb-8">
                  <label className="text-sm font-bold text-gray-600">Endereço de E-mail</label>
                  <input 
                    className="w-full bg-[#eff4f9] border border-gray-200 rounded-xl px-5 py-4 text-[15px] text-gray-400 cursor-not-allowed outline-none"
                    value={perfil?.email}
                    disabled
                  />
                  <p className="text-[11px] text-gray-400">
                    O e-mail de conta não pode ser alterado diretamente por questões de segurança.
                  </p>
                </div>

                {/* Campo Bio (Igual à imagem) */}
                <div className="space-y-3 mb-12">
                  <label className="text-sm font-bold text-gray-600">Bio / Nota Biográfica</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-5 py-4 text-[15px] text-gray-900 font-medium focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
                </div>

                {/* Botões de Ação (Cores fiéis à imagem) */}
                <div className="flex justify-end gap-5">
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="px-10 py-4 rounded-xl font-bold text-sm text-[#004a99] border-2 border-[#004a99] hover:bg-blue-50 transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={updating}
                    className="px-10 py-4 rounded-xl font-bold text-sm bg-[#fca311] text-white shadow-lg shadow-orange-100 hover:bg-[#e8960f] transition flex items-center gap-3 disabled:opacity-50"
                  >
                    {updating ? 'A guardar...' : <><Save size={18}/> Guardar Alterações</>}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

// Componente para Itens da Sidebar
function SidebarItem({ icon, label, active = false, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
        active ? 'bg-blue-50 text-[#004a99] border-l-4 border-[#004a99]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
      }`}
    >
      {icon} {label}
    </button>
  )
}