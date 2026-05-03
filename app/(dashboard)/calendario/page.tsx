'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval,  startOfDay } from 'date-fns'
import { pt } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, MapPin, Clock, Plus, Edit2 } from 'lucide-react'
import Link from 'next/link' // Importação correta para navegação[cite: 3]
import { start } from 'repl'

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [nivelAcesso, setNivelAcesso] = useState(1) 
  const [eventos, setEventos] = useState<any[]>([])
  const [filtro, setFiltro] = useState('Todos')
  const [selectedEvento, setSelectedEvento] = useState<any>(null);

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
          .select('cargo, nivel_acesso') 
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

  // Carregar eventos do mês
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
      {/* Cabeçalho com Botão Novo Evento */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#002d5e]">Calendário Distrital</h1>
          <p className="text-gray-500">Visualize e planeie as atividades do Distrito.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {['Todos', 'Atividade de Clube', 'Projeto', 'Visita Oficial', 'Formação'].map(f => (
              <button 
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${filtro === f ? 'bg-[#002d5e] text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                {f}
              </button>
            ))}
          </div>
          {/* Botão Global de Criação */}
          {nivelAcesso >= 3 && (
            <Link 
              href="/calendario/novo" 
              className="bg-[#002d5e] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg"
            >
              <Plus size={18} /> Novo Evento
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Grelha do Calendário */}
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
                {eventos.filter( e =>{
                  const inicio = startOfDay(new Date(e.data_inicio));
                  const fim = startOfDay(new Date(e.data_fim || e.data_inicio)); // Se não houver fim, usa o início como fim
                  return isWithinInterval(startOfDay(dia), { start: inicio, end: fim });
                }) .map(e => (
                  <button 
                    key={e.id} 
                    onClick={() => setSelectedEvento(e)} 
                    className="w-full mt-1 p-1 text-[9px] font-black rounded truncate border-l-2 transition-all hover:brightness-95 text-left"
                    style={{ 
                      backgroundColor: `${e.cor_etiqueta}15`, // Cor com 15% de opacidade
                      color: e.cor_etiqueta, 
                      borderColor: e.cor_etiqueta 
                    }}
                  >
                    {e.titulo}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Eventos com Botão de Edição */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-xl font-black text-[#002d5e]">Próximos Eventos</h3>
          <div className="space-y-4">
            {eventos.length > 0 ? (
              eventos.map(e => (
                <div key={e.id} className="group relative flex gap-4 bg-white p-4 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition">
                  <div 
                    className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                    style={{ backgroundColor: `${e.cor_etiqueta}15`, color: e.cor_etiqueta }}
                  >
                    <span className="text-[10px] font-black uppercase">{format(new Date(e.data_inicio), 'MMM', { locale: pt })}</span>
                    <span className="text-lg font-black">{format(new Date(e.data_inicio), 'dd')}</span>
                  </div>

                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900">{e.titulo}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                      {/* Substituição do Ícone MapPin */}
                      <MapPin size={12} style={{ color: e.cor_etiqueta }} /> {e.local}
                    </div>
                  </div>
                  {nivelAcesso >= 3 && (
                    <Link 
                      href={`/calendario/${e.id}${e.clube_id ? `?clubeId=${e.clube_id}` : ''}`}
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
      {/* MODAL DE DETALHES DO EVENTO */}
      {selectedEvento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho com Cor da Categoria */}
            <div 
              className="h-24 w-full p-8 flex items-end"
              style={{ backgroundColor: selectedEvento.cor_etiqueta }}
            >
              <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                {selectedEvento.categoria}
              </span>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-[#002d5e] leading-tight">{selectedEvento.titulo}</h2>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">{selectedEvento.descricao || 'Sem descrição disponível.'}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-600"><Clock size={20}/></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Data e Hora</p>
                    <p className="font-bold text-sm">
                      {format(new Date(selectedEvento.data_inicio), "d 'de' MMMM 'às' HH:mm", { locale: pt })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-gray-600">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-red-500"><MapPin size={20}/></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Localização</p>
                    <p className="font-bold text-sm">{selectedEvento.local || 'Local não definido'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {selectedEvento.link && (
                  <a 
                    href={selectedEvento.link} 
                    target="_blank" 
                    className="flex-1 bg-[#002d5e] text-white text-center py-4 rounded-2xl font-black text-sm shadow-lg hover:-translate-y-1 transition-all"
                  >
                    Inscrever no Evento
                  </a>
                )}
                <button 
                  onClick={() => setSelectedEvento(null)}
                  className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}