'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function RegistarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const [formData, setFormData] = useState({
    primeiro_nome: '',
    apelido: '',
    email: '',
    password: '',
    confirm_password: ''
  })

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    if (formData.password !== formData.confirm_password) {
      setErro('As palavras-passe não coincidem.')
      setLoading(false)
      return
    }

    // 1. Criar utilizador na Autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      setErro(authError.message)
      setLoading(false)
      return
    }

    // 2. Se a criação for bem sucedida, inserir os dados na tabela 'perfis'
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('perfis')
        .insert([
          { 
            id: authData.user.id, 
            primeiro_nome: formData.primeiro_nome,
            apelido: formData.apelido,
            email: formData.email,
            cargo: 'Membro' // Cargo padrão ao registar
          }
        ])

      if (profileError) {
        setErro('Conta criada, mas erro ao guardar perfil: ' + profileError.message)
      } else {
        setSucesso(true)
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-white">
      
      {/* LADO ESQUERDO: Branding (Igual ao Login) */}
      <div className="hidden lg:flex w-1/2 bg-[#003d7a] flex-col justify-center px-20 relative overflow-hidden">
        {/* Elemento decorativo de fundo */}
        <div className="absolute -bottom-32 -left-32 opacity-10">
           {/* Podes colocar aqui a roda rotária em SVG se tiveres */}
           <div className="w-96 h-96 rounded-full border-[40px] border-white border-dashed"></div>
        </div>

        <div className="relative z-10 text-white">
          <h2 className="text-2xl font-black mb-12">
            Rotary <span className="text-[#fca311]">Nexus</span>
          </h2>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            A rede que une os clubes do Distrito 1960
          </h1>
          <p className="text-blue-200 text-lg max-w-md leading-relaxed">
            Liderança, amizade e serviço. Entre na plataforma oficial do Rotary Nexus para gerir projetos, eventos e impacto comunitário.
          </p>
        </div>
      </div>

      {/* LADO DIREITO: Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Criar Nova Conta</h2>
            <p className="text-gray-500 mt-2 text-sm">Preencha os dados para se juntar à plataforma.</p>
          </div>

          {erro && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold">{erro}</div>}
          
          {sucesso ? (
            <div className="bg-green-50 text-green-700 p-6 rounded-2xl text-center space-y-4">
              <h3 className="font-bold text-lg">Registo efetuado com sucesso!</h3>
              <p className="text-sm">A sua conta foi criada. Pode agora iniciar sessão.</p>
              <button onClick={() => router.push('/login')} className="bg-[#004a99] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#003d7a] transition w-full">
                Ir para o Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Primeiro Nome</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      value={formData.primeiro_nome}
                      onChange={e => setFormData({...formData, primeiro_nome: e.target.value})}
                      className="w-full bg-[#eff4f9] border-transparent rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#004a99] focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" 
                      placeholder="João" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Apelido</label>
                  <input 
                    required
                    value={formData.apelido}
                    onChange={e => setFormData({...formData, apelido: e.target.value})}
                    className="w-full bg-[#eff4f9] border-transparent rounded-xl py-3 px-4 text-sm focus:border-[#004a99] focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" 
                    placeholder="Silva" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#eff4f9] border-transparent rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#004a99] focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" 
                    placeholder="joao.silva@rotary.pt" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Palavra-passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" required minLength={6}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-[#eff4f9] border-transparent rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#004a99] focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Confirmar Palavra-passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" required minLength={6}
                    value={formData.confirm_password}
                    onChange={e => setFormData({...formData, confirm_password: e.target.value})}
                    className="w-full bg-[#eff4f9] border-transparent rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#004a99] focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-[#004a99] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#003d7a] transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? 'A registar...' : <><ArrowRight size={18}/> Registar Conta</>}
              </button>
            </form>
          )}

          <div className="text-center pt-6 border-t border-gray-100 mt-8">
            <p className="text-sm text-gray-500">
              Já tem uma conta? {' '}
              <Link href="/login" className="text-[#004a99] font-bold hover:underline">
                Iniciar Sessão
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}