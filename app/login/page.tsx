'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Users, Shield } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Novos campos para o Registo
  const [nome, setNome] = useState('')
  const [clubeId, setClubeId] = useState('')
  const [tipoClube, setTipoClube] = useState('Rotary') // Padrão: Rotary
  const [listaClubes, setListaClubes] = useState<any[]>([])
  
  const router = useRouter()

  // 1. Ir buscar os clubes à base de dados para a dropdown
  useEffect(() => {
    async function carregarClubes() {
      const { data } = await supabase.from('clubes').select('id, nome').order('nome')
      if (data) setListaClubes(data)
    }
    carregarClubes()
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLogin) {
      // Lógica de Login
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else router.push('/')
    } else {
      // Lógica de Registo
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            nome_completo: nome,
            clube_id: clubeId,
            tipo_clube: tipoClube // Enviamos isto para o perfil
          }
        }
      })

      if (error) alert(error.message)
      else alert('Conta criada! Por favor, confirma o teu email.')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fce7f3] p-4 font-sans">
      <div className="flex w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[650px]">
        
        {/* LADO ESQUERDO (GRADIENTE) */}
        <div className="hidden md:flex w-5/12 bg-gradient-to-br from-[#e11d48] to-[#fb923c] p-12 flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="font-bold text-sm">C</span>
              </div>
              <span className="text-xs font-bold tracking-widest uppercase text-left">Distrito 1960<br/>Connections</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-6">A rede que une os clubes do Distrito 1960.</h1>
            <p className="text-white/80 text-sm mb-8 leading-relaxed">
              Comunique com clubes irmãos, acompanhe o calendário distrital e aceda aos documentos oficiais — tudo num só lugar.
            </p>
            <ul className="space-y-3 text-sm text-white/90">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white rounded-full" /> Diretório completo dos clubes</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white rounded-full" /> Mural e anúncios oficiais</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white rounded-full" /> Repositório distrital de documentos</li>
            </ul>
          </div>
          <span className="text-[10px] opacity-60 italic">© Connections D1960</span>
        </div>

        {/* LADO DIREITO (FORMULÁRIO) */}
        <div className="w-full md:w-7/12 p-10 md:p-16 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Bem-vindo</h2>
          <p className="text-gray-400 text-sm mb-8">Aceda ao portal do Distrito 1960.</p>

          <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>Entrar</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>Registar</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                {/* Campo Nome */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><User size={12}/> Nome</label>
                  <input type="text" placeholder="O seu nome" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-pink-300 transition-all text-sm" onChange={(e) => setNome(e.target.value)} required />
                </div>

                {/* Dropdown de Clube */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><Users size={12}/> Clube</label>
                  <select 
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-pink-300 transition-all text-sm appearance-none"
                    onChange={(e) => setClubeId(e.target.value)}
                    required
                  >
                    <option value="">Selecione o seu clube...</option>
                    {listaClubes.map((clube) => (
                      <option key={clube.id} value={clube.id}>{clube.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Campo Rotary ou Rotaract */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><Shield size={12}/> Organização</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="radio" name="tipo" value="Rotary" checked={tipoClube === 'Rotary'} onChange={() => setTipoClube('Rotary')} /> Rotary
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="radio" name="tipo" value="Rotaract" checked={tipoClube === 'Rotaract'} onChange={() => setTipoClube('Rotaract')} /> Rotaract
                    </label>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><Mail size={12}/> Email</label>
              <input type="email" placeholder="nome@clube.pt" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-pink-300 transition-all text-sm" onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><Lock size={12}/> Palavra-passe</label>
              <input type="password" placeholder="Mínimo 8 caracteres" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-pink-300 transition-all text-sm" onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button className="w-full bg-gradient-to-r from-[#e11d48] to-[#fb923c] hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg transition-all mt-4">
              {isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}