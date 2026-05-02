'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'

// Correção para os ícones do Leaflet (necessário para os pins aparecerem)
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface MapViewProps {
  clubes: any[];
}

export default function MapViewComponent({ clubes }: MapViewProps) {
  return (
    <div className="w-full h-[600px] rounded-[40px] border border-gray-100 overflow-hidden shadow-inner z-0">
      <MapContainer 
        center={[38.7223, -9.1393]} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {clubes.map((clube) => (
          clube.latitude && clube.longitude && (
            <Marker 
              key={clube.id} 
              position={[clube.latitude, clube.longitude]} 
              icon={icon}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-black text-[#002d5e]">{clube.nome}</h4>
                  <p className="text-xs text-gray-400 mb-2">{clube.local_reuniao}</p>
                  <Link 
                    href={`/diretorio-clubes/${clube.id}`}
                    className="text-[10px] font-bold text-[#fca311] uppercase"
                  >
                    Ver Detalhes →
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  )
}