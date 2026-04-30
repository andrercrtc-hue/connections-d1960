'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Bell, Settings } from 'lucide-react'

export function TopNav() {
  const [perfil, setPerfil] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('perfis').select('*').eq('id', user.id).single()
        setPerfil(data)
      }
    }
    loadUser()
  }, [])

  return (
    <header className="h-20 bg-white border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-10 w-full">
      {/* ESQUERDA: Nome da App e Links */}
      <div className="flex items-center gap-8">
        <h2 className="text-[#004a99] font-black tracking-tighter text-xl italic uppercase">Rotary Nexus</h2>
        <nav className="hidden lg:flex gap-6 border-l border-gray-100 pl-8">
          <a href="#" className="text-xs font-bold text-[#004a99] border-b-2 border-[#004a99] pb-1">Portal</a>
          <a href="#" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition">Recursos</a>
          <a href="#" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition">Documentos</a>
        </nav>
      </div>
      
      {/* DIREITA: Notificações e Perfil (Alinhado ao canto) */}
      <div className="flex items-center gap-6">
        <div className="flex gap-4 text-gray-400 border-r border-gray-100 pr-6">
          <Bell size={20} className="cursor-pointer hover:text-gray-600 transition"/>
          <Settings size={20} className="cursor-pointer hover:text-gray-600 transition"/>
        </div>
        
        {/* Bloco de Perfil clicável */}
        <div 
          onClick={() => router.push('/perfil')} 
          className="flex items-center gap-3 text-right cursor-pointer group"
        >
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-[#004a99] transition-colors">
              {perfil?.primeiro_nome} {perfil?.apelido || 'Ribeiro Carvalho'}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
              {perfil?.cargo || 'Governador Distrital'}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full overflow-hidden border-2 border-white shadow-md group-hover:border-[#004a99] transition-all">
             <img 
                src={perfil?.avatar_url || `https://ui-avatars.com/api/?name=${perfil?.primeiro_nome || 'Andre'}&background=004a99&color=fff`} 
                alt="Perfil" 
                className="w-full h-full object-cover"
             />
          </div>
        </div>
      </div>
    </header>
  )
}