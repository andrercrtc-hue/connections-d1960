'use client'
import { useParams, useSearchParams } from 'next/navigation' 
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Bell, Calendar, FileText, Users, Wallet, 
  ArrowRight, Download, Upload, Plus, ExternalLink, Clock, Globe,
  Pencil
} from 'lucide-react'
import Link from 'next/link'



export default function PaginaDinamicaClube() {
  const params = useParams()
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const clubeIdUrl = params.id as string // Captura o ID do URL
  const [perfil, setPerfil] = useState<any>(null)
  const [clube, setClube] = useState<any>(null)
  const [equipa, setEquipa] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [comissoes, setComissoes] = useState<any[]>([]) // Novo estado para as comissões
  const [anuncios, setAnuncios] = useState<any[]>([]) // Novo estado para os anúncios
  const [modoVisao, setModoVisao] = useState<'publico' | 'gestao' | 'socio'> (viewParam === 'gestao' ? 'gestao' : (viewParam === 'socio' ? 'socio' : 'publico'));

  
  const apagarAnuncio = async (id: string) => {
  // 1. Pedir confirmação para não apagar por engano
  const confirmar = window.confirm("Tens a certeza que queres apagar este anúncio?");
  if (!confirmar) return;

  // 2. Apagar na base de dados do Supabase
  const { error } = await supabase
    .from('anuncios')
    .delete()
    .eq('id', id);

  if (error) {
    alert("Erro ao apagar: " + error.message);
  } else {
    // 3. Atualizar a lista no ecrã imediatamente (sem refresh)
    setAnuncios(prev => prev.filter(anuncio => anuncio.id !== id));
  }
};

  useEffect(() => {
    async function carregarDados() {
      // 1. Carregar primeiro o que é PÚBLICO (funciona para todos)
      if (clubeIdUrl) {
        // Carregar Clube
        const { data: clubeData } = await supabase
          .from('clubes')
          .select('*')
          .eq('id', clubeIdUrl)
          .single();
        if (clubeData) setClube(clubeData);

        // NOVO: Carregar Equipa via tabela 'clube_equipa' relacionando com 'perfis'
        const { data: equipaRelData } = await supabase
          .from('clube_equipa')
          .select(`
            cargo_nome,
            perfis (
              id,
              primeiro_nome,
              apelido,
              avatar_url
            )
          `)
          .eq('clube_id', clubeIdUrl);

        if (equipaRelData) {
          // Formatamos para que o objeto tenha a estrutura que o resto do código espera
          const equipaFormatada = equipaRelData.map((rel: any) => ({
            ...rel.perfis,
            cargo_nome: rel.cargo_nome
          }));
          setEquipa(equipaFormatada);
        }

        // NOVO: Carregar Comissões do Clube
        const { data: comissoesData } = await supabase
          .from('comissoes')
          .select('*')
          .eq('clube_id', clubeIdUrl);
        
        if (comissoesData) setComissoes(comissoesData);

        // Carregar Anúncios (Verifica se a coluna é 'created_at' ou 'criado_at')
        const { data: anunciosData, error: errAnuncios } = await supabase
          .from('anuncios')
          .select('*')
          .eq('clube_id', clubeIdUrl)
          .order('criado_at', { ascending: false }); // Se der erro, tenta 'criado_at'

        if (anunciosData) setAnuncios(anunciosData);
        if (errAnuncios) console.error("Erro nos anúncios:", errAnuncios);
      }

      // 2. Só depois carregamos o PERFIL (se o utilizador estiver logado)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: perfilData } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', user.id)
          .single();

        if (perfilData) {
          let nivelAcesso = 1;

          // NOVO: Lê os cargos do utilizador neste clube através da tabela 'clube_equipa'
          const { data: userRoles } = await supabase
            .from('clube_equipa')
            .select('cargo_nome')
            .eq('perfil_id', user.id)
            .eq('clube_id', clubeIdUrl);

          if (userRoles && userRoles.length > 0) {
            const cargosNames = userRoles.map(r => r.cargo_nome).filter(Boolean);

            if (cargosNames.length > 0) {
              // NOVO: Lê o nível de acesso na tabela 'cargos_clube_config' fazendo a relação com o cargo
              const { data: configData } = await supabase
                .from('cargos_clube_config')
                .select('nivel_acesso')
                .in('cargo_nome', cargosNames);

              if (configData && configData.length > 0) {
                // Caso tenha vários cargos no clube, fica com o nível de acesso mais alto
                nivelAcesso = Math.max(...configData.map(c => c.nivel_acesso || 1));
              }
            }
          }

          setPerfil({
            ...perfilData,
            nivel: nivelAcesso
          });
        }
      }

      // 3. O setLoading(false) tem de estar AQUI, fora de qualquer 'if', 
      // para a página carregar sempre, mesmo para visitantes.
      setLoading(false);
    }
    carregarDados()
  }, [clubeIdUrl]) // Recarrega se o ID do URL mudar

  const alterarCargoMembro = async (membroId: string, novoCargo: string) => {
    const { error } = await supabase
      .from('clube_equipa')
      .update({ cargo_nome: novoCargo })
      .match({ clube_id: clubeIdUrl, perfil_id: membroId }) // Adaptado para a nova relação

    if (error) {
      alert("Erro ao atualizar cargo: " + error.message)
    } else {
      // Atualiza a lista localmente para refletir a mudança instantaneamente
      setEquipa(prev => prev.map(m => 
        m.id === membroId ? { ...m, cargo_nome: novoCargo } : m
      ))
    }
  }

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">A carregar o seu clube...</div>

  return (
    <div className="pb-20 animate-in fade-in duration-700">
      {/* Contentor Principal - Largura Total */}
      <div className="relative h-[320px] w-full rounded-b-[40px] overflow-hidden flex items-end pb-10 px-8 md:px-12 -mt-10 mb-10">
        <div className="absolute inset-0 z-0">
          <img 
            src={clube?.capa_url || "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad"} 
            className="w-full h-full object-cover" 
            alt="Capa do Clube" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002d5e] via-[#002d5e]/60 to-transparent"></div>
        </div>

        <div className="relative z-10 space-y-3 text-white w-full md:max-w-[70%]">
          <div className="flex flex-col items-start gap-4">
            {/* O Nome do Clube em Grande (Por cima) */}
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
              {clube?.nome || 'O Meu Clube'}
            </h1>
          </div>
          <div className="flex justify-between items-end w-full">
            <div className="space-y-3">
              <span className="bg-[#fca311] text-[#002d5e] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Distrito 1960 • {clube?.tipo}
              </span>
            </div>
          </div>
          <p className="text-gray-200 text-sm md:text-base max-w-2xl font-medium">
            {clube?.descricao || "Unindo líderes para servir a comunidade e transformar vidas com impacto positivo."}
          </p>
        </div>

        {/* ========================================================================== */}
        {/* SELETORES DE VISÃO E EDIÇÃO (Canto inferior direito da imagem)             */}
        {/* ========================================================================== */}
        <div className="absolute bottom-10 right-8 md:right-12 z-20 flex flex-col md:flex-row items-end md:items-center gap-3">
          {perfil?.clube_id === clubeIdUrl && (
            <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-lg">
              <button 
                onClick={() => setModoVisao('publico')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${modoVisao === 'publico' ? 'bg-white text-[#002d5e] shadow-sm' : 'text-white hover:bg-white/20'}`}
              >
                Visão Pública
              </button>
              <button 
                onClick={() => setModoVisao('socio')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${modoVisao === 'socio' ? 'bg-white text-[#002d5e] shadow-sm' : 'text-white hover:bg-white/20'}`}
              >
                Visão de Sócio
              </button>
              {perfil?.nivel >= 2 && (
                <button 
                  onClick={() => setModoVisao('gestao')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${modoVisao === 'gestao' ? 'bg-[#fca311] text-[#002d5e] shadow-sm' : 'text-white hover:bg-white/20'}`}
                >
                  Gestão
                </button>
              )}
            </div>
          )}

          {modoVisao === 'gestao' && perfil?.nivel >= 2 && (
            <Link 
              href={`/diretorio-clubes/${clubeIdUrl}/editar-capa`}
              className="bg-[#fca311] text-[#002d5e] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-black hover:bg-orange-500 transition shadow-lg"
            >
              <Pencil size={16} /> Editar Página
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-10">
          {/* --- CASO 1: VISÃO PÚBLICA (Estilo exato da imagem image_223b37.png) --- */}
          {modoVisao === 'publico' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* COLUNA ESQUERDA: Sobre o Clube */}
              <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[40px] p-12 shadow-sm">
                <h2 className="text-3xl font-black text-[#002d5e] mb-6">Sobre o Clube</h2>
                <p className="text-gray-500 leading-relaxed text-lg font-medium">
                  {clube?.descricao || "O Rotaract Club é uma instituição dedicada à promoção da paz, ao combate de doenças e ao apoio à educação local. Mantemos uma rede vibrante de profissionais que dedicam o seu tempo a projetos de impacto social transformador."}
                </p>
              </div>

              {/* COLUNA DIREITA: Card de Reuniões Azul */}
              <div className="bg-[#002244] rounded-[32px] p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <Clock size={20} className="text-[#fca311]" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Reuniões</h2>
                </div>

                <div className="space-y-4">
                  {/* CAMPO QUANDO: Periocidade, Dia e Horas */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">Quando</span>
                      <span className="bg-[#fca311] text-[#002d5e] text-[8px] font-black px-2 py-0.5 rounded uppercase">
                        {clube?.tipo_reuniao || 'Presencial'}
                      </span>
                    </div>
                    
                    <p className="text-lg font-bold leading-tight">
                      {/* Ex: Semanalmente à Terça-feira */}
                      {clube?.periodicidade_reuniao || 'Semanalmente'}  {clube?.dia_reuniao || 'dia a definir'}
                    </p>
                    
                    <p className="text-sm text-white/60 mt-1">
                      {/* Ex: Às 21:00:00 */}
                      {clube?.hora_reuniao ? `Início às ${clube.hora_reuniao}` : 'Horário a definir'}
                    </p>
                  </div>

                  {/* LOCALIZAÇÃO */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-[#fca311] uppercase tracking-widest block mb-1">Localização</span>
                    <p className="text-lg font-bold">{clube?.local_reuniao || 'Local a definir'}</p>
                    <p className="text-xs text-white/60">
                      {clube?.morada_completa || 'Contacte o clube para a morada exata'}
                    </p>
                  </div>

                  {/* LÍNGUA */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-[#fca311] uppercase tracking-widest block mb-1">Língua</span>
                      <p className="text-lg font-bold">{clube?.lingua_reuniao || 'Local a definir'}</p>
                    </div>
                    <Globe size={16} className="text-white/20" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- CASO 2: VISÃO DE GESTÃO E SÓCIO (Partilhada, mas botões condicionados) --- */}
          {(modoVisao === 'gestao' || modoVisao === 'socio') && (
            <> {/* O Fragment é OBRIGATÓRIO aqui porque tens várias secções */}
              
              {/* --- SECÇÃO 1: ANÚNCIOS (O código que já tens) --- */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[#002d5e]">
                    <Bell size={20} />
                    <h2 className="text-xl font-black uppercase tracking-tight">Anúncios do Clube</h2>
                  </div>
              {/* AÇÃO EXCLUSIVA DE GESTÃO */}
              {modoVisao === 'gestao' && perfil?.nivel >= 2 && (
                    <Link 
                      href={`/diretorio-clubes/${clubeIdUrl}/anuncios`}
                      className="bg-[#fca311] text-[#002d5e] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-black hover:bg-orange-500 transition shadow-lg"
                    >
                      <Pencil size={16} /> Editar Anúncios
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {anuncios.length > 0 ? (
                    anuncios.map((anuncio) => (
                      <div 
                        key={anuncio.id} 
                        className={`${
                          anuncio.tipo === 'urgente' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-300'
                        } border-l-4 p-6 rounded-2xl flex flex-col justify-center relative group`}
                      >
                        <span className={`text-[10px] font-black uppercase mb-1 ${
                          anuncio.tipo === 'urgente' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {anuncio.tipo}
                        </span>
                        <h3 className="font-bold text-[#002d5e]">{anuncio.titulo}</h3>
                        <p className={`text-sm ${anuncio.tipo === 'urgente' ? 'text-red-700/70' : 'text-gray-500'}`}>
                          {anuncio.descricao}
                        </p>
                        
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-10 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                      <p className="text-gray-400 text-sm italic">Não existem anúncios publicados de momento.</p>
                    </div>
                  )}
                </div>
              </section>

          {/* --- SECÇÃO: INFORMAÇÕES DE REUNIÃO (Sócios apenas leem, Gestão pode editar) --- */}
              <section className="bg-[#002d5e] rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
                {/* Detalhe estético de fundo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <Calendar size={20} className="text-[#fca311]" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Informações de Reunião</h2>
                  </div>
                  {/* AÇÃO EXCLUSIVA DE GESTÃO */}
                  {modoVisao === 'gestao' && perfil?.nivel >= 2 && (
                    <Link 
                      href={`/diretorio-clubes/${clubeIdUrl}/dados-reuniao`}
                      className="bg-[#fca311] text-[#002d5e] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-black hover:bg-orange-500 transition shadow-lg"
                    >
                      <Pencil size={16} /> Editar Reuniões
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* QUANDO */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">Quando</span>
                      <span className="bg-[#fca311] text-[#002d5e] text-[8px] font-black px-2 py-0.5 rounded uppercase">
                        {clube?.tipo_reuniao || 'Presencial'}
                      </span>
                    </div>
                    <p className="text-lg font-bold leading-tight">
                      {clube?.periodicidade_reuniao || 'Semanalmente'}  {clube?.dia_reuniao || 'dia a definir'}
                    </p>
                    <p className="text-xs text-white/60">
                      {clube?.hora_reuniao ? `Às ${clube?.hora_reuniao}` : 'Contacte o clube para o horário'}
                    </p>
                  </div>

                  {/* LOCALIZAÇÃO */}
                  <div className="space-y-2 border-l border-white/10 pl-8">
                    <span className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">Localização</span>
                    <p className="text-lg font-bold leading-tight">
                      {clube?.local_reuniao || 'Sede do Clube'}
                    </p>
                    <p className="text-xs text-white/60">
                      {clube?.morada_completa || 'Contacte o clube para a morada exata'}
                    </p>
                  </div>

                  {/* LÍNGUA E CONTACTO */}
                  <div className="space-y-2 border-l border-white/10 pl-8">
                    <span className="text-[10px] font-black text-[#fca311] uppercase tracking-widest">Língua Oficial</span>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold">{clube?.lingua_reuniao || 'Local a definir'}</p>
                      <ExternalLink size={14} className="text-white/40" />
                    </div>
                  </div>
                </div>
              </section>
              
              {/* ... Outras secções de gestão (Tesouraria, etc.) ... */}
              {/* --- SECÇÃO 3: SECRETARIA E TESOURARIA --- */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6 shadow-sm">
                  <div className="flex items-center gap-2 text-[#002d5e] border-b pb-4">
                    <FileText size={24} />
                    <h2 className="text-2xl font-black uppercase tracking-tight">Secretaria</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-100 rounded-2xl space-y-2 hover:bg-gray-50 cursor-pointer">
                      <FileText className="text-blue-500" />
                      <p className="font-bold text-[#002d5e] text-sm leading-tight">Modelos de Documentos</p>
                      <p className="text-[10px] text-gray-400">Aceda a atas, cartas tipo e modelos standard.</p>
                    </div>
                    <div className="p-4 border border-gray-100 rounded-2xl space-y-2 hover:bg-gray-50 cursor-pointer">
                      <Users className="text-blue-500" />
                      <p className="font-bold text-[#002d5e] text-sm leading-tight">Secretaria Distrital</p>
                      <p className="text-[10px] text-gray-400">Contactos diretos e horários da equipa.</p>
                    </div>
                  </div>
                  <button className="w-full bg-blue-50 text-blue-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-100 transition">
                    <FileText size={18} /> Formulários Administrativos <ArrowRight size={18} />
                  </button>
                </div>

                <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6 shadow-sm">
                  <div className="flex items-center gap-2 text-[#002d5e] border-b pb-4">
                    <Wallet size={24} className="text-[#fca311]" />
                    <h2 className="text-2xl font-black uppercase tracking-tight">Tesouraria</h2>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 text-center space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Atual</span>
                    <p className="text-4xl font-black text-[#002d5e]">12.450,00€</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-green-50 p-4 rounded-2xl">
                      <span className="text-[10px] font-black text-green-600 uppercase">Quotas em dia</span>
                      <p className="text-xl font-black text-green-700">92%</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-2xl">
                      <span className="text-[10px] font-black text-orange-600 uppercase">Próx. Vencimento</span>
                      <p className="text-xl font-black text-orange-700">15 Set</p>
                    </div>
                  </div>
                  <button className="w-full border-2 border-[#002d5e] text-[#002d5e] font-black py-3 rounded-xl hover:bg-[#002d5e] hover:text-white transition">
                    Detalhes Financeiros
                  </button>
                </div>
              </div>

          {/* --- SECÇÃO: REPOSITÓRIO (Sócios transferem, Gestão faz upload) --- */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[#002d5e]">
                    <FileText size={20} />
                    <h2 className="text-xl font-black uppercase tracking-tight">Repositório do Clube</h2>
                  </div>
                  <div className="flex gap-2">
                {/* AÇÃO EXCLUSIVA DE GESTÃO */}
                {modoVisao === 'gestao' && (
                  <button className="bg-[#002d5e] text-white p-2.5 rounded-lg hover:bg-blue-900 transition"><Upload size={18}/></button>
                )}
                    <button className="border border-gray-200 text-[#002d5e] px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 transition">Explorar Tudo</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { nome: 'Plano Estratégico 2024', tipo: 'PDF', size: '2.4 MB' },
                    { nome: 'Lista de Membros Ativa', tipo: 'XLSX', size: '1.1 MB' },
                    { nome: 'Estatutos de Clube', tipo: 'PDF', size: '4.8 MB' },
                    { nome: 'Arquivo Fotográfico', tipo: 'ZIP', size: '145 MB' },
                  ].map((doc, i) => (
                    <div key={i} className="bg-gray-50 p-6 rounded-[24px] space-y-4 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-lg transition cursor-pointer group">
                      <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#002d5e] text-sm line-clamp-2">{doc.nome}</h4>
                        <p className="text-[10px] text-gray-400 uppercase font-black mt-1">{doc.tipo} • {doc.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </> 
          )}

      {/* ========================================================================== */}
      {/* 4. SECÇÃO COMUM: LIDERANÇA E EQUIPA (Visível para Público, Sócios e Gestão)*/}
      {/* ========================================================================== */}
          <section className="space-y-4 pt-10 border-t border-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[#002d5e]">
                <Users size={20} />
                <h2 className="text-xl font-black uppercase tracking-tight">Equipa do Clube</h2>
              </div>
              {/* AÇÃO PARA SÓCIOS E GESTÃO */}
              {(modoVisao === 'gestao' || modoVisao === 'socio') && (
                <Link 
                  href={`/diretorio-clubes/${clubeIdUrl}/equipa-clube`}
                  className="bg-[#fca311] text-[#002d5e] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-black hover:bg-orange-500 transition shadow-lg"
                >
                  <Users size={16} /> Ver Equipa Completa
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {equipa.map((membro) => (
                <div key={membro.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-[#fca311]">
                    <img 
                      src={membro.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    {/* Ajuste para os nomes reais da tua tabela */}
                    <h4 className="font-black text-[#002d5e] leading-tight">
                      {membro.primeiro_nome} {membro.apelido}
                    </h4>
                    
                    {/* LÓGICA DE GESTÃO: Só na visão de gestão + Nível >= 2 vê os comandos de edição */}
                    {perfil?.nivel >= 2 && modoVisao === 'gestao' ? (
                      <div className="mt-1">
                        {perfil.id !== membro.id ? (
                          <select
                            value={membro.cargo_nome || 'Membro'}
                            onChange={(e) => alterarCargoMembro(membro.id, e.target.value)}
                            className="bg-gray-50 border border-gray-100 text-[#002d5e] text-[10px] font-bold rounded-lg p-1 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                          >
                            <option value="Membro">Membro</option>
                            <option value="Presidente">Presidente</option>
                            <option value="Secretário">Secretário</option>
                            <option value="Tesoureiro">Tesoureiro</option>
                            <option value="Vice-Presidente">Vice-Presidente</option>
                            <option value="Protocolo">Protocolo</option>
                          </select>
                        ) : (
                          <div className="flex flex-col">
                            {/* Mostra o teu cargo real (Presidente) */}
                            <span className="text-[10px] font-bold text-blue-600 uppercase">
                              {membro.cargo_nome}
                            </span>
                            {/* Mantém o aviso que és tu */}
                            <span className="text-[8px] font-black text-orange-500 uppercase italic">
                              O teu cargo
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* O que o utilizador comum vê */
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          {membro.cargo_nome || 'Membro'}
                        </span>
                        {perfil?.id === membro.id && (
                          <span className="text-[8px] font-black text-orange-500 uppercase italic">
                            O teu cargo
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400">2025-2026</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
        </div>
      </div>
  )
}