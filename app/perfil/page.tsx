'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Users, Calendar, FileText, 
  LogOut, Bell, Settings, Camera, CheckCircle,
  Phone, Mail, User, Info, Save, X, Home, Briefcase, ClipboardList
} from 'lucide-react'

// Definição do tipo de dados do utilizador
type Perfil = {
  id: string
  nome: string
  email: string
  cargo: string
  telefone?: string
  bio?: string
  avatar_url?: string
  anos_servico?: number
}

export default function ProfilePage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  // Estados locais para o formulário (evita lag ao escrever)
  const [formData, setFormData] = useState({
    nome: '',
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
          nome: data.nome || '',
          telefone: data.telefone || '',
          bio: data.bio || ''
        })
      }
      setLoading(false)
    }
    loadData()
  }, [router])

  // Função para guardar as alterações de texto
  async function handleSave() {
    setUpdating(true)
    const { error } = await supabase
      .from('perfis')
      .update({
        nome: formData.nome,
        telefone: formData.telefone,
        bio: formData.bio
      })
      .eq('id', perfil?.id)

    if (error) alert('Erro ao atualizar: ' + error.message)
    else alert('Perfil atualizado com sucesso!')
    setUpdating(false)
  }

  // Função para gerir o upload da foto
  async function handlePhotoUpload(event: any) {
    try {
      setUpdating(true)
      const file = event.target.files[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const filePath = `${perfil?.id}/${Math.random()}.${fileExt}`

      // 1. Upload para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError

      // 2. Gerar URL pública
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

      // 3. Atualizar tabela
      await supabase.from('perfis').update({ avatar_url: publicUrl }).eq('id', perfil?.id)
      
      setPerfil(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
    } catch (err: any) {
      alert('Erro no upload: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando Perfil...</div>

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      
      {/* SIDEBAR (Mantida igual ao Dashboard para coerência) */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#004a99] rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <div>
              <h2 className="text-[#004a99] font-black text-lg leading-tight">Distrito Rotary</h2>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Painel Principal" onClick={() => router.push('/dashboard')} />
          <SidebarItem icon={<Home size={20}/>} label="O meu Clube" />
          <SidebarItem icon={<Briefcase size={20}/>} label="Projetos" />
          <SidebarItem icon={<Calendar size={20}/>} label="Calendário" />
          <SidebarItem icon={<Users size={20}/>} label="Diretório" />
          <SidebarItem icon={<ClipboardList size={20}/>} label="Relatórios" />
          <div className="pt-4 border-t border-gray-50">
             <SidebarItem icon={<User size={20}/>} label="Profile Details" active />
          </div>
        </nav>
        <div className="p-6">
           <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="flex items-center gap-3 text-xs font-bold text-gray-400 hover:text-red-500 transition">
             <LogOut size={18}/> Sair
           </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 ml-64 flex flex-col">
        
        {/* TOP NAV */}
        <header className="h-20 bg-white border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-[#004a99] font-black tracking-tighter text-xl uppercase">Rotary Nexus</h2>
          <div className="flex items-center gap-4">
             <Bell className="text-gray-400" size={20} />
             <div className="w-10 h-10 rounded-full bg-blue-50 overflow-hidden border">
                <img src={perfil?.avatar_url || `https://ui-avatars.com/api/?name=${perfil?.nome}`} alt="Avatar" />
             </div>
          </div>
        </header>

        {/* ÁREA DE EDIÇÃO */}
        <div className="p-10 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-[#004a99]">Perfil do Utilizador</h1>
            <p className="text-gray-500 text-sm">Gira a tua informação pessoal e preferências de conta no Rotary Nexus.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUNA ESQUERDA: FOTO E STATUS */}
            <div className="space-y-6">
              {/* Card da Foto */}
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100">
                    <img 
                      src={perfil?.avatar_url || `https://ui-avatars.com/api/?name=${perfil?.nome}`} 
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  </div>
                  <label className="absolute bottom-0 right-0 bg-[#004a99] text-white p-2 rounded-full cursor-pointer hover:scale-110 transition shadow-lg">
                    <Camera size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <h4 className="font-bold text-[#004a99] mb-1">Alterar Foto de Perfil</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed px-4">
                  Utilize uma fotografia profissional com boa iluminação (JPEG ou PNG, máx. 5MB).
                </p>
              </div>

              {/* Card de Status */}
              <div className="bg-[#004a99] p-6 rounded-[24px] text-white">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle size={20} className="text-blue-300" />
                  <span className="font-bold text-sm">Membro Verificado</span>
                </div>
                <p className="text-xs text-blue-100 opacity-80 leading-relaxed">
                  A sua conta está associada ao Distrito 1960 com todos os privilégios ativos de {perfil?.cargo}.
                </p>
              </div>
            </div>

            {/* COLUNA DIREITA: FORMULÁRIO */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-8">Informações Pessoais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Nome Completo</label>
                    <input 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Contacto Telefónico</label>
                    <input 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition"
                      placeholder="+351 --- --- ---"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <label className="text-xs font-bold text-gray-400 uppercase">Endereço de E-mail</label>
                  <input 
                    className="w-full bg-gray-100 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed outline-none"
                    value={perfil?.email}
                    disabled
                  />
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Info size={10} /> O e-mail de conta não pode ser alterado diretamente por questões de segurança.
                  </p>
                </div>

                <div className="space-y-2 mb-10">
                  <label className="text-xs font-bold text-gray-400 uppercase">Bio / Nota Biográfica</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                    placeholder="Conte-nos um pouco sobre a sua jornada no Rotary..."
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button className="px-8 py-3 rounded-xl font-bold text-sm text-[#004a99] border border-[#004a99] hover:bg-blue-50 transition">
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={updating}
                    className="px-8 py-3 rounded-xl font-bold text-sm bg-[#fca311] text-white shadow-lg shadow-orange-100 hover:bg-[#e8960f] transition flex items-center gap-2"
                  >
                    {updating ? 'A guardar...' : <><Save size={18}/> Guardar Alterações</>}
                  </button>
                </div>
              </div>

              {/* CARDS INFERIORES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Anos de Serviço</p>
                    <p className="text-3xl font-black text-[#004a99]">{perfil?.anos_servico || 0} <span className="text-sm font-bold text-gray-400">Anos</span></p>
                  </div>
                  <CheckCircle size={40} className="text-blue-50" />
                </div>
                <div className="bg-gradient-to-br from-[#fca311] to-[#ffb84d] p-6 rounded-[24px] text-white relative overflow-hidden">
                  <p className="text-[10px] font-bold uppercase opacity-80 mb-4">Impacto Estimado</p>
                  <div className="w-full bg-white/20 h-2 rounded-full mb-2">
                    <div className="bg-white h-full rounded-full" style={{width: '75%'}}></div>
                  </div>
                  <p className="text-[10px] font-bold">Meta anual de doação e serviço: 75%</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

// Componente auxiliar para os itens do menu lateral
function SidebarItem({ icon, label, active = false, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all ${active ? 'bg-blue-50 text-[#004a99] border-l-4 border-[#004a99]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
    >
      {icon} {label}
    </button>
  )
}