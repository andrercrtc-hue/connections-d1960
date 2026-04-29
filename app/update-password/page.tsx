'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()

  // --- PROTEÇÃO: Verificar se existe uma sessão de recuperação ---
  useEffect(() => {
    async function checkSession() {
      // O link do email cria uma sessão temporária. Vamos verificar se ela existe.
      const { data: { session } } = await supabase.auth.getSession()
      
      // Se não houver sessão, o utilizador não deve estar nesta página.
      if (!session) {
        setIsValidSession(false)
      } else {
        setIsValidSession(true)
      }
    }
    checkSession()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Atualizar a password do utilizador que já está autenticado pelo token do email
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      alert('Erro ao atualizar: ' + error.message)
    } else {
      alert('Palavra-passe atualizada com sucesso! Aceda com a nova senha.')
      router.push('/login')
    }
    setLoading(false)
  }

  // Ecrã de carregamento enquanto verificamos a sessão
  if (isValidSession === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fce7f3] p-4 font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </main>
    )
  }

  // Ecrã de erro se tentarem entrar sem o link do email
  if (isValidSession === false) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fce7f3] p-4 font-sans">
        <div className="flex w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-12 flex-col items-center border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6"><AlertTriangle size={32} /></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Inválido</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">Esta página só é acessível através do link enviado para o seu e-mail de recuperação.</p>
          <Link href="/forgot-password" className="w-full bg-[#e11d48] hover:bg-[#be123c] text-white font-bold py-4 rounded-xl shadow-lg transition-all">Pedir novo link</Link>
        </div>
      </main>
    )
  }

  // Ecrã do Formulário Real
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fce7f3] p-4 font-sans">
      <div className="flex w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-12 flex-col items-center border border-pink-100">
        <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><ShieldCheck size={32} /></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">Nova Palavra-passe</h2>
        <p className="text-gray-400 text-sm mb-8 text-center px-2 leading-relaxed">Escolha uma nova senha forte para proteger a sua conta distrital.</p>
        <form onSubmit={handleUpdate} className="w-full space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nova Password (mín. 8 caracteres)</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3.5 text-gray-300 w-4 h-4" />
              <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-pink-300 transition-all text-sm text-gray-700" onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#e11d48] to-[#fb923c] text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50">
            {loading ? 'A guardar...' : 'Confirmar Nova Senha'}
          </button>
        </form>
      </div>
    </main>
  )
}