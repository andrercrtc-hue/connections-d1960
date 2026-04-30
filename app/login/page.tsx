'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, UserPlus, Globe, ShieldCheck, HelpCircle, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Erro no login: ' + error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-white">
      
      {/* COLUNA ESQUERDA: Branding e Info */}
      <div className="hidden lg:flex w-1/2 bg-[#003d7a] p-16 flex-col justify-center text-white relative overflow-hidden">
        {/* Elemento Decorativo (Engrenagem no fundo) */}
        <div className="absolute bottom-[-10%] left-[-10%] opacity-10">
          <SettingsIcon size={400} />
        </div>

        <div className="relative z-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold inline-block text-white">
              Rotary <span className="text-[#fca311] border-b-4 border-[#fca311]">Nexus</span>
            </h2>
          </div>

          <h1 className="text-6xl font-extrabold leading-tight mb-8 text-white">
            A rede que une o <br />
            <span className="text-white">Distrito 1960</span>
          </h1>

          <p className="text-xl text-blue-50 max-w-md leading-relaxed font-medium opacity-90">
            Liderança, amizade e serviço. Entre na plataforma oficial do Rotary Nexus para gerir projetos, eventos e impacto comunitário.
          </p>
        </div>
      </div>

      {/* COLUNA DIREITA: Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-24 relative">
        
        {/* Ícone de Pessoas Subtil no Topo Direito */}
        <div className="absolute top-12 right-12 opacity-5 hidden sm:block text-gray-900">
          <UsersIcon size={120} />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Bem-vindo de volta</h2>
            <p className="text-gray-700 font-bold">Inicie sessão na sua conta de Governadoria</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Campo Email */}
            <div>
              <label className="block text-sm font-black text-gray-900 mb-2 uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900" size={20} />
                <input
                  type="email"
                  placeholder="nome@rotary1960.org"
                  className="w-full pl-12 pr-4 py-4 bg-[#f8fafc] border-2 border-gray-100 rounded-xl text-gray-900 font-bold placeholder-gray-400 focus:ring-2 focus:ring-[#003d7a] focus:bg-white focus:border-transparent transition-all outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Campo Password */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-black text-gray-900 uppercase tracking-widest">Palavra-passe</label>
                {/* CORREÇÃO DO LINK DE ESQUECEU A PASSWORD AQUI */}
                <Link href="/forgot-password" className="text-sm font-black text-[#003d7a] hover:underline">
                  Esqueceu-se?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-[#f8fafc] border-2 border-gray-100 rounded-xl text-gray-900 font-bold placeholder-gray-400 focus:ring-2 focus:ring-[#003d7a] focus:bg-white focus:border-transparent transition-all outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Checkbox Manter Sessão */}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="remember" className="w-5 h-5 rounded border-gray-300 text-[#003d7a] focus:ring-[#003d7a] cursor-pointer" />
              <label htmlFor="remember" className="text-sm text-gray-900 font-bold cursor-pointer">Manter sessão iniciada</label>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-lg hover:bg-[#003d7a] transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {loading ? 'A entrar...' : 'Entrar na Plataforma'}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-10 text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200"></span>
            </div>
            <span className="relative px-4 bg-white text-sm text-gray-900 font-black uppercase tracking-widest">ou</span>
          </div>

          {/* Botão Registar */}
          <button 
            onClick={() => router.push('/registar')}
            className="w-full bg-[#fce8d5] text-[#8b5e34] py-4 rounded-xl font-black text-sm hover:bg-[#fbdcb9] transition flex items-center justify-center gap-2 shadow-sm"
          >
            <UserPlus size={18} /> Criar Nova Conta
          </button>

          {/* Footer do Login */}
          <div className="mt-12 text-center">
            <p className="text-gray-900 text-sm font-bold mb-6">
              Precisa de ajuda? <a href="#" className="text-[#004a99] font-black hover:underline">Contacte o Apoio Técnico</a>
            </p>
            
            {/* CORREÇÃO DAS PROPS NOS ÍCONES AQUI */}
            <div className="flex justify-center gap-8 text-gray-900">
              <Globe size={22} className="hover:text-gray-600 cursor-pointer transition-colors" />
              <ShieldCheck size={22} className="hover:text-gray-600 cursor-pointer transition-colors" />
              <HelpCircle size={22} className="hover:text-gray-600 cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- ÍCONES DE APOIO AO DESIGN ---

function SettingsIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function UsersIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
