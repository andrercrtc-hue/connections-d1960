'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { pt } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, MapPin, Clock, Plus, Edit2 } from 'lucide-react'
import Link from 'next/link' // Importação correta para navegação[cite: 3]

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [nivelAcesso, setNivelAcesso] = useState(1) 
  const [eventos, setEventos] = useState<any[]>([])
  const [filtro, setFiltro] = useState('Todos')

  // Verificação de Permissões[cite: 3, 4]
useEffect(() => {
  async function verificarPermissoes() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log("ID do Utilizador Logado:", user.id); //

      const { data: meusCargos } = await supabase
        .from('distrito_equipa')
        .select('cargo_nome')
        .eq('perfil_id', user.id);

      console.log("Cargos encontrados na distrito_equipa:", meusCargos); //

      if (meusCargos && meusCargos.length > 0) {
        const listaDeNomes = meusCargos.map(c => c.cargo_nome);

        const { data: permissoes } = await supabase
          .from('cargos_clube_config')
          .select('cargo, nivel_acesso') // Pedi para trazer o nome do cargo também para conferir
          .in('cargo', listaDeNomes);

        console.log("Níveis encontrados na cargos_clube_config:", permissoes); //

        if (permissoes && permissoes.length > 0) {
          const nivelMaximo = Math.max(...permissoes.map(p => p.nivel_acesso || 1));
          console.log("Nível Máximo Calculado:", nivelMaximo); //
          setNivelAcesso(nivelMaximo);
        }
      }
    } else {
      console.log("Nenhum utilizador logado no Supabase."); //
    }
  }

  verificarPermissoes();
}, []);

  // Carregar eventos do mês[cite: 3, 4]
  useEffect(() => {
    async function fetchEventos() {
      const primeiroDia = startOfMonth(currentDate).toISOString()
      const ultimoDia = endOfMonth(currentDate).toISOString()

      const { data } = await supabase
        .from('eventos')
        .select('*')
        .gte('data_inicio', primeiroDia)
        .lte('data_inicio', ultimoDia)

      if (data) setEventos(data)
    }
    fetchEventos()
  }, [currentDate])

  const diasNoMes = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Cabeçalho com Botão Novo Evento[cite: 3] */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#002d5e]">Calendário Distrital</h1>
          <p className="text-gray-500">Visualize e planeie as atividades do Distrito.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {['Todos', 'Conselho', 'Projetos', 'Visitas'].map(f => (
              <button 
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${filtro === f ? 'bg-[#002d5e] text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                {f}
              </button>
            ))}
          </div>
          {/* Botão Global de Criação[cite: 3] */}
          {nivelAcesso >= 3 && (
            <Link 
              href="/calendario/gestao/novo" 
              className="bg-[#002d5e] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg"
            >
              <Plus size={18} /> Novo Evento
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Grelha do Calendário[cite: 3, 4] */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-[#002d5e] capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: pt })}
            </h2>
            <div className="flex gap-4">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}><ChevronLeft /></button>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}><ChevronRight /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-100">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="bg-white p-4 text-center text-[10px] font-black text-gray-400 uppercase">{d}</div>
            ))}
            {diasNoMes.map((dia: Date) => (
              <div key={dia.toString()} className="bg-white min-h-[120px] p-2 border-t border-gray-50">
                <span className="text-sm font-bold text-gray-900">{format(dia, 'd')}</span>
                {eventos.filter(e => isSameDay(new Date(e.data_inicio), dia)).map(e => (
                  <div key={e.id} className="mt-1 p-1 text-[9px] font-bold rounded truncate bg-blue-50 text-[#002d5e] border-l-2 border-blue-500">
                    {e.titulo}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Eventos com Botão de Edição[cite: 3, 4] */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-xl font-black text-[#002d5e]">Próximos Eventos</h3>
          <div className="space-y-4">
            {eventos.length > 0 ? (
              eventos.map(e => (
                <div key={e.id} className="group relative flex gap-4 bg-white p-4 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-[#002d5e]">
                    <span className="text-[10px] font-black uppercase">{format(new Date(e.data_inicio), 'MMM', { locale: pt })}</span>
                    <span className="text-lg font-black">{format(new Date(e.data_inicio), 'dd')}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900">{e.titulo}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1"><MapPin size={12}/> {e.local}</div>
                  </div>
                  {nivelAcesso >= 3 && (
                    <Link 
                      href={`/calendario/gestao/${e.id}${e.clube_id ? `?clubeId=${e.clube_id}` : ''}`}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 transition"
                    >
                      <Edit2 size={16} />
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400 italic text-sm">Nenhum evento este mês.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}