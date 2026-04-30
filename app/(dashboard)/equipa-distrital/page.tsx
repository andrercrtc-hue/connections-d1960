'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Phone, Calendar, ChevronDown, Star, Award, 
  Plus, Edit2, Trash2, Search, Users, LayoutGrid, Eye, Settings2, FileDown, Save
} from 'lucide-react'

export default function EquipaDistrital() {
  const [todosPerfis, setTodosPerfis] = useState<any[]>([])
  const [equipaFiltrada, setEquipaFiltrada] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin')
  const [loading, setLoading] = useState(true)
  const [savingMsg, setSavingMsg] = useState(false)

  const [mensagemGov, setMensagemGov] = useState("")

  // O governador é extraído da equipa que já tem cargo atribuído
  const governador = equipaFiltrada.find(m => m.cargo?.toLowerCase().includes('governador'))

  useEffect(() => {
    async function loadData() {
      // 1. Verificar permissões do utilizador atual
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
        const cargo = perfil?.cargo?.toLowerCase() || ''
        const temAcesso = cargo.includes('governador') || cargo.includes('secretario') || cargo.includes('administrador')
        
        setIsAdmin(temAcesso)
        if (!temAcesso) setViewMode('user')
      }

      // 2. Carregar todos os perfis
      const { data: perfis } = await supabase.from('perfis').select('*').order('primeiro_nome')
      if (perfis) {
        setTodosPerfis(perfis)
        
        // FILTRAGEM: Apenas perfis com cargo preenchido e diferente de vazio ou "Membro" genérico
        // Consideramos que "fazer parte da equipa" exige um cargo específico atribuído
        const soEquipa = perfis.filter(m => m.cargo && m.cargo !== '' && m.cargo !== 'Membro')
        setEquipaFiltrada(soEquipa)
        
        const govData = soEquipa.find(m => m.cargo?.toLowerCase().includes('governador'))
        if (govData) {
          setMensagemGov(govData.bio || "O Rotary é a oportunidade de transformar o mundo através do serviço.")
        }
      }
      
      setLoading(false)
    }
    loadData()
  }, [])

  async function handleSaveMensagem() {
    if (!governador?.id) return
    setSavingMsg(true)
    const { error } = await supabase.from('perfis').update({ bio: mensagemGov }).eq('id', governador.id)
    if (error) alert("Erro ao guardar: " + error.message)
    else alert("Mensagem atualizada!")
    setSavingMsg(false)
  }

  const exportarExcel = () => {
    const cabecalho = "Nome,Cargo,Email,Telefone\n"
    const linhas = equipaFiltrada.map(m => 
      `${m.primeiro_nome} ${m.apelido},${m.cargo},${m.email},${m.telefone || 'N/A'}`
    ).join("\n")
    const blob = new Blob(["\ufeff" + cabecalho + linhas], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `equipa_distrital.csv`
    link.click()
  }

  if (loading) return <div className="p-10 text-gray-400 font-bold">A carregar interface...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
            {viewMode === 'admin' ? 'Gestão da Equipa Distrital' : 'Equipa Distrital'}
          </h1>
          <p className="text-gray-500 text-sm">Controlo de cargos e comunicações do Distrito 1960.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setViewMode(viewMode === 'admin' ? 'user' : 'admin')}
            className="flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-[#004a99] text-white shadow-lg hover:bg-[#00356d] transition-all"
          >
            {viewMode === 'admin' ? <><Eye size={16}/> Ver como Utilizador</> : <><Settings2 size={16}/> Voltar a Editar</>}
          </button>
        )}
      </div>

      {viewMode === 'admin' ? (
        <div className="space-y-10 animate-in fade-in duration-500">
          
          {/* MENSAGEM DO GOVERNADOR (EDITOR) */}
          <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-50">
                <img src={governador?.avatar_url || `https://ui-avatars.com/api/?name=${governador?.primeiro_nome}`} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 w-full space-y-4">
                <h2 className="text-2xl font-black text-[#004a99]">{governador?.primeiro_nome} {governador?.apelido || "Governador não definido"}</h2>
                <div className="relative">
                  <textarea 
                    value={mensagemGov}
                    onChange={(e) => setMensagemGov(e.target.value)}
                    className="w-full bg-gray-50 border-l-4 border-orange-200 p-4 italic text-gray-900 font-medium text-sm rounded-r-xl focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                    rows={3}
                  />
                  <button onClick={handleSaveMensagem} disabled={savingMsg} className="absolute bottom-2 right-2 bg-[#004a99] text-white p-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                    {savingMsg ? "..." : <Save size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* STATS (DINÂMICOS BASEADOS NA EQUIPA FILTRADA) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminStatCard label="Membros na Equipa" value={equipaFiltrada.length.toString().padStart(2, '0')} icon={<LayoutGrid size={20}/>} color="blue" />
            <AdminStatCard label="Comissões Ativas" value="03" icon={<Users size={20}/>} color="orange" />
          </div>

          {/* FORMULÁRIOS DE ATRIBUIÇÃO */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
               <h3 className="text-lg font-black text-[#004a99] mb-6">Atribuir Cargo Individual</h3>
               <div className="space-y-4">
                  <input 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm text-gray-900 font-medium outline-none" 
                    placeholder="Procurar membro..." 
                  />
                  <select className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm text-gray-900 font-medium outline-none">
                    <option>Selecionar cargo...</option>
                    <option>Secretário Distrital</option>
                    <option>Tesoureiro Distrital</option>
                  </select>
                  <button className="w-full bg-[#004a99] text-white py-4 rounded-xl font-black text-sm shadow-lg hover:bg-[#00356d] transition">Confirmar Atribuição</button>
               </div>
            </div>

            <div className="lg:col-span-3 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-[#004a99]">Gestão de Comissões</h3>
                  <button className="bg-[#fca311] text-white px-4 py-2 rounded-xl font-black text-xs"><Plus size={16}/> Nova Comissão</button>
               </div>
               <div className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-gray-900 font-medium text-sm">Desenvolvimento e Expansão</span>
                  <div className="flex gap-2"><Edit2 size={14} className="text-gray-300"/><Trash2 size={14} className="text-gray-300"/></div>
               </div>
            </div>
          </div>

          {/* TABELA FILTRADA (APENAS QUEM TEM CARGO) */}
          <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-[#004a99]">Membros Atribuídos à Equipa</h3>
              <button onClick={exportarExcel} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-green-700 transition shadow-md">
                <FileDown size={16} /> Exportar Equipa
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr><th className="px-8 py-4">Membro</th><th className="px-8 py-4">Cargo Atribuído</th><th className="px-8 py-4">Contacto</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {equipaFiltrada.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition">
                      <td className="px-8 py-4 font-bold text-gray-900">{m.primeiro_nome} {m.apelido}</td>
                      <td className="px-8 py-4"><span className="bg-blue-50 text-[#004a99] px-3 py-1 rounded-full text-[10px] font-black uppercase">{m.cargo}</span></td>
                      <td className="px-8 py-4 text-gray-500">{m.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-700">
           <PublicTeamView members={equipaFiltrada} mensagem={mensagemGov} />
        </div>
      )}
    </div>
  )
}

function AdminStatCard({ label, value, icon, color }: any) {
  const colorMap: any = { blue: 'border-t-blue-500 text-[#004a99]', orange: 'border-t-[#fca311] text-[#fca311]' }
  return (
    <div className={`bg-white p-8 rounded-2xl border border-gray-100 border-t-4 ${colorMap[color]} shadow-sm flex justify-between items-center`}>
      <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">{label}</p><p className="text-4xl font-black">{value}</p></div>
      <div className="bg-gray-50 p-4 rounded-2xl text-gray-300">{icon}</div>
    </div>
  )
}

function PublicTeamView({ members, mensagem }: { members: any[], mensagem: string }) {
  const gov = members.find(m => m.cargo?.toLowerCase().includes('governador'))
  return (
    <div className="space-y-12">
      <section className="bg-white rounded-[32px] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311]"></div>
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl">
             <img src={gov?.avatar_url || `https://ui-avatars.com/api/?name=${gov?.primeiro_nome}`} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase text-[#fca311] tracking-widest">Governador Distrital 2024-25</span>
            <h2 className="text-4xl font-black text-[#004a99] mb-6">{gov?.primeiro_nome} {gov?.apelido}</h2>
            <p className="border-l-4 border-orange-100 pl-6 italic text-gray-500 text-lg leading-relaxed mb-8">"{mensagem}"</p>
            <div className="flex gap-4">
               <button className="bg-[#004a99] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg"><Mail size={16}/> E-mail</button>
               <button className="bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm"><Phone size={16}/> Contacto Direto</button>
            </div>
          </div>
        </div>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {members.filter(m => !m.cargo?.toLowerCase().includes('governador')).map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50">
               <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.primeiro_nome}`} className="w-full h-full object-cover" />
             </div>
             <div>
                <h4 className="font-bold text-gray-800 text-sm">{m.primeiro_nome} {m.apelido}</h4>
                <p className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">{m.cargo}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}