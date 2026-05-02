'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Search, Map, Filter, Heart, Mail, MapPin, LayoutGrid, ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function DiretorioClubes() {
  const [clubes, setClubes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | 'Rotary' | 'Rotaract'>('Todos')
  const [favoritos, setFavoritos] = useState<string[]>([]) // Guarda IDs dos clubes favoritos
  const [verApenasFavoritos, setVerApenasFavoritos] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  
  useEffect(() => {
    // 1. LER OS FAVORITOS GUARDADOS NO NAVEGADOR
    const savedFavs = localStorage.getItem('rotary_favs');
    if (savedFavs) {
        try {
        setFavoritos(JSON.parse(savedFavs));
        } catch (err) {
        console.error("Erro ao ler favoritos:", err);
        }
    }

    // 2. LER OS CLUBES DA BASE DE DADOS
    async function loadClubes() {
        setLoading(true)
        const { data, error } = await supabase
        .from('clubes')
        .select('*')
        .order('nome', { ascending: true })
        
        if (data) setClubes(data)
        setLoading(false)
    }
    
    loadClubes()
    }, [])

    const toggleFavorito = (id: string, e: React.MouseEvent) => {
        // MUITO IMPORTANTE: Impede que o clique no coração abra a página do clube
        e.preventDefault();
        e.stopPropagation();

        setFavoritos((prev) => {
            const isFav = prev.includes(id);
            const novosFavs = isFav 
            ? prev.filter(favId => favId !== id) 
            : [...prev, id];
            
            // Guarda imediatamente no browser
            localStorage.setItem('rotary_favs', JSON.stringify(novosFavs));
            return novosFavs;
        });
        };

  const clubesFiltrados = clubes
    .filter((clube, index, self) => {
      // Remove duplicados por ID antes de filtrar
      const firstIndex = self.findIndex(item => item.id === clube.id);
      if (firstIndex !== index) return false;

      // Procura no nome ou no local de reunião
      const matchesSearch = clube.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          clube.local_reuniao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filtroTipo === 'Todos' || clube.tipo === filtroTipo;
      
      // Se "verApenasFavoritos" estiver ativo, filtra apenas os IDs que estão na lista de favoritos
      const matchesFav = !verApenasFavoritos || favoritos.includes(clube.id);
      
      return matchesSearch && matchesType && matchesFav;
    })
    // ADICIONA ISTO PARA A ORDEM ALFABÉTICA
    .sort((a, b) => a.nome.localeCompare(b.nome));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-4">
      <div className="w-8 h-8 border-4 border-[#002d5e] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-xs uppercase tracking-widest italic">A carregar rede de impacto Nexus...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <header className="space-y-4">
        <h1 className="text-[44px] font-black text-[#002d5e] tracking-tighter leading-none">Diretório de Clubes</h1>
        <p className="text-gray-500 max-w-2xl text-lg leading-relaxed">
          Explore a nossa rede global de impacto. Encontre clubes locais dedicados ao serviço comunitário e à transformação positiva.
        </p>
      </header>

      {/* BARRA DE FERRAMENTAS */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Procurar clubes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-[#002d5e] placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto font-bold">
          <button 
            onClick={() => setVerApenasFavoritos(!verApenasFavoritos)}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-gray-100 px-6 py-4 rounded-2xl text-sm text-[#002d5e] hover:bg-gray-50 transition shadow-sm ${verApenasFavoritos ? 'bg-red-50 border-red-200' : ''}`}
          >
            <Heart size={16} className={verApenasFavoritos ? 'fill-red-500 text-red-500' : 'text-gray-300'} /> 
            {verApenasFavoritos ? 'Ver Todos' : 'Favoritos'}
          </button>
          <div className="relative flex-1 lg:flex-none">
            {/* O BOTÃO PRINCIPAL */}
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`w-full flex items-center justify-center gap-2 bg-white border px-6 py-4 rounded-2xl text-sm text-[#002d5e] transition shadow-sm ${showFilterMenu ? 'border-blue-500 ring-2 ring-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
            >
              <Filter size={16} className={filtroTipo !== 'Todos' ? 'text-blue-600' : 'text-gray-300'} /> 
              <span>{filtroTipo === 'Todos' ? 'Filtrar' : filtroTipo}</span>
            </button>

            {/* A JANELA DO FILTRO (DROPDOWN) */}
            {showFilterMenu && (
              <>
                {/* Overlay invisível para fechar ao clicar fora */}
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-[24px] shadow-2xl z-20 p-2 animate-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-300">Tipo de Unidade</div>
                  
                  <button 
                    onClick={() => { setFiltroTipo('Rotary'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${filtroTipo === 'Rotary' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    Rotary Clubs
                  </button>
                  
                  <button 
                    onClick={() => { setFiltroTipo('Rotaract'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${filtroTipo === 'Rotaract' ? 'bg-pink-50 text-pink-600' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    Rotaract Clubs
                  </button>

                  <div className="my-2 border-t border-gray-50" />

                  <button 
                    onClick={() => { setFiltroTipo('Todos'); setShowFilterMenu(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-black text-red-500 hover:bg-red-50 transition"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </>
            )}
          </div>
          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-[#002d5e] px-8 py-4 rounded-2xl text-sm font-black text-white hover:bg-[#001b3d] transition shadow-xl"
          >
            {viewMode === 'grid' ? (
              <><Map size={16} /> Ver no Mapa</>
            ) : (
              <><LayoutGrid size={16} /> Ver em Grelha</>
            )}
          </button>
        </div>
      </div>

      {/* GRELHA DE CLUBES OU MAPA */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {clubesFiltrados.map((clube) => (
            <div key={clube.id} className="group bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col">
            
            {/* IMAGEM E CAPA */}
            <div className="relative h-60 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fca311] z-10"></div>
              <img 
                src={clube.capa_url || "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800"} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                alt={clube.nome}
                // Se a imagem falhar ao carregar, substitui por uma imagem genérica elegante
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800"; // Paisagem genérica
                    target.onerror = null; // Evita loops infinitos se a imagem de fallback também falhar
                }}
                />
              <button 
                onClick={(e) => toggleFavorito(clube.id, e)} // Passa o evento aqui
                className={`absolute top-6 right-6 p-2.5 backdrop-blur-md rounded-full transition-all border z-20 ${
                  favoritos.includes(clube.id)
                    ? 'bg-red-500 border-red-500 text-white shadow-lg'
                    : 'bg-white/20 border-white/20 text-white hover:bg-white hover:text-red-500'
                }`}
              >
                <Heart 
                  size={20} 
                  className={favoritos.includes(clube.id) ? 'fill-current' : ''} 
                />
              </button>
            </div>

            {/* CONTEÚDO DO CARTÃO */}
            <div className="p-10 space-y-8 flex-1 flex flex-col">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-[#002d5e] leading-tight tracking-tighter">
                  {clube.nome}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-4 text-gray-500">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div className="pt-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Sede de Reunião</p>
                      <p className="text-xs font-bold text-gray-700">{clube.local_reuniao || 'Por definir'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 text-gray-500">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                      <Mail size={18} />
                    </div>
                    <div className="pt-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Contacto Oficial</p>
                      <p className="text-xs font-bold text-gray-700 truncate">{clube.email_contacto || 'geral@rotary.pt'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACÇÃO FINAL */}
              <div className="pt-4 mt-auto">
                <Link 
                  href={`/diretorio-clubes/${clube.id}`}
                  className="w-full bg-[#002d5e] text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 group-hover:bg-[#fca311] transition-all duration-300 shadow-lg shadow-blue-900/10 group-hover:shadow-orange-500/20"
                >
                  Ver detalhes <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      /* O TEU CONTENTOR DO MAPA VAI AQUI */
      <div className="w-full h-[600px] bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 overflow-hidden flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
          <Map size={32} />
        </div>
        <div className="text-center">
          <p className="text-[#002d5e] font-black uppercase tracking-widest text-xs">Modo Mapa Ativo</p>
          <p className="text-gray-400 italic text-sm">O mapa interativo será carregado aqui...</p>
        </div>
      </div>
    )}
    </div>
  )
}