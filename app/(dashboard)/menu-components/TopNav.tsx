// app/menu-components/TopNav.tsx
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
    <header className="h-20 bg-white border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-10">
      {/* ... (parte esquerda do Nexus e links mantém-se) */}
      
      <div className="flex items-center gap-6">
        {/* Bloco de Perfil Clicável - AQUI É QUE ESTÁ A MÁGICA */}
        <div 
          onClick={() => router.push('/perfil')} 
          className="flex items-center gap-3 text-right cursor-pointer group"
        >
          <div>
            <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-[#004a99] transition-colors">
              {perfil?.primeiro_nome} {perfil?.apelido || 'Utilizador'}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {perfil?.cargo === 'governador' ? 'Governador Distrital' : 'Membro de Clube'}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:border-[#004a99] transition-all">
             <img 
                src={perfil?.avatar_url || `https://ui-avatars.com/api/?name=${perfil?.primeiro_nome}&background=004a99&color=fff`} 
                alt="Perfil" 
                className="w-full h-full object-cover"
             />
          </div>
        </div>
      </div>
    </header>
  )
}