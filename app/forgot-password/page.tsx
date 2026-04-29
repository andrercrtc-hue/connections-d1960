'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPassword() {
  // --- ESTADOS DA PÁGINA ---
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false) // Controla se mostramos o formulário ou a mensagem de sucesso

  // --- FUNÇÃO PARA PEDIR RECUPERAÇÃO ---
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // O Supabase envia o e-mail e, quando o user clica, é mandado para o redirectTo
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // IMPORTANTE: Este URL deve estar na Whitelist do seu painel Supabase
      redirectTo: 'http://localhost:3000/update-password',
    })

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      setSent(true) // Mostra o ecrã de sucesso
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fce7f3] p-4 font-sans">
      
      {/* Container Principal (Layout de duas colunas) */}
      <div className="flex w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[550px]">
        
        {/* --- LADO ESQUERDO: INFORMATIVO (GRADIENTE) --- */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#e11d48] to-[#fb923c] p-12 flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="font-bold text-sm">C</span>
              </div>
              <span className="text-xs font-bold tracking-widest uppercase text-left leading-tight">
                Distrito 1960<br/>Connections
              </span>
            </div>
            
            <h1 className="text-4xl font-bold leading-tight mb-6">
              Recuperação de Acesso.
            </h1>
            
            <p className="text-white/80 text-sm leading-relaxed">
              Esqueceu-se da sua palavra-passe? Não há problema. 
              Introduza o seu e-mail e enviaremos instruções para criar uma nova.
            </p>
          </div>
          
          <span className="text-[10px] opacity-60 italic">© Connections D1960</span>
        </div>

        {/* --- LADO DIREITO: FORMULÁRIO OU SUCESSO --- */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-white">
          
          {/* Botão de Voltar */}
          <Link href="/login" className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#e11d48] mb-10 transition-colors w-fit">
            <ArrowLeft size={14} /> Voltar para o Login
          </Link>

          {!sent ? (
            // --- ESTADO 1: FORMULÁRIO DE ENVIO ---
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Recuperar senha</h2>
              <p className="text-gray-400 text-sm mb-8">Introduza o e-mail associado à sua conta distrital.</p>

              <form onSubmit={handleReset} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1">
                    <Mail size={12}/> Email de Sócio
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3.5 text-gray-300 w-4 h-4" />
                    <input 
                      type="email" 
                      placeholder="nome@clube.pt"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-pink-300 transition-all text-sm text-gray-700"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#e11d48] to-[#fb923c] hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-100 transition-all disabled:opacity-50"
                >
                  {loading ? 'A enviar link...' : 'Enviar link de recuperação'}
                </button>
              </form>
            </>
          ) : (
            // --- ESTADO 2: MENSAGEM DE SUCESSO ---
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifique o seu e-mail</h2>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed px-4">
                Enviámos um link de recuperação para <b>{email}</b>. 
                Se não receber em 2 minutos, verifique a pasta de Spam.
              </p>
              <button 
                onClick={() => setSent(false)}
                className="text-sm font-bold text-[#e11d48] hover:underline"
              >
                Tentar outro e-mail
              </button>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}